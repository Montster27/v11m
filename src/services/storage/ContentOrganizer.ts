// /Users/montysharma/v11m2/src/services/storage/ContentOrganizer.ts
// Data organization patterns for large content collections
// Implements chunking, indexing, and lazy loading for storylets, clues, and arcs

import { StorageAdapter } from './StorageAdapter';
import type { Storylet, StoryArc } from '../../types/storylet';
import type { Clue } from '../../types/clue';
import type { NPC } from '../../types/npc';

interface ChunkManifest<T> {
  version: string;
  timestamp: string;
  totalItems: number;
  chunkSize: number;
  totalChunks: number;
  contentType: string;
  metadata: {
    lastModified: string;
    totalSize: number;
    compression: boolean;
    checksum?: string;
  };
  chunks: Array<{
    id: string;
    itemCount: number;
    size: number;
    startIndex: number;
    endIndex: number;
    lastModified: string;
  }>;
  index: {
    byId: Record<string, { chunkId: string; localIndex: number }>;
    byType?: Record<string, string[]>; // For storylets: by category
    byTag?: Record<string, string[]>;
    byArc?: Record<string, string[]>; // For clues: by story arc
  };
}

interface ChunkData<T> {
  chunkId: string;
  items: T[];
  metadata: {
    timestamp: string;
    itemCount: number;
    startIndex: number;
    endIndex: number;
  };
}

interface OrganizationOptions {
  chunkSize: number;
  enableIndexing: boolean;
  enableCompression: boolean;
  enableLazyLoading: boolean;
  cacheSize: number; // Number of chunks to keep in memory
}

interface QueryOptions {
  limit?: number;
  offset?: number;
  filter?: (item: any) => boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface QueryResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  nextOffset?: number;
}

/**
 * ContentOrganizer provides efficient storage and retrieval patterns for large content collections.
 * 
 * Features:
 * - Automatic chunking for large collections (50+ items per chunk)
 * - Indexing for fast lookups by ID, type, tag, arc
 * - Lazy loading with configurable chunk caching
 * - Query support with pagination and filtering
 * - Incremental updates without full rewrite
 */
export class ContentOrganizer {
  private storageAdapter: StorageAdapter;
  private chunkCache: Map<string, { data: ChunkData<any>; lastAccessed: number }> = new Map();
  private manifestCache: Map<string, ChunkManifest<any>> = new Map();
  
  constructor(
    storageAdapter: StorageAdapter,
    private options: OrganizationOptions = {
      chunkSize: 50,
      enableIndexing: true,
      enableCompression: false, // Let ContentExportService handle compression
      enableLazyLoading: true,
      cacheSize: 5
    }
  ) {
    this.storageAdapter = storageAdapter;
  }

  /**
   * Save storylets with chunking and indexing
   */
  async saveStorylets(storylets: Storylet[]): Promise<{ success: boolean; chunksCreated: number; error?: string }> {
    try {
      return await this.saveCollection('storylets', storylets, {
        indexBy: ['id', 'category', 'tags', 'author'],
        sortBy: 'name'
      });
    } catch (error) {
      console.error('Failed to save storylets:', error);
      return { success: false, chunksCreated: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Save clues with arc-based organization
   */
  async saveClues(clues: Clue[]): Promise<{ success: boolean; chunksCreated: number; error?: string }> {
    try {
      return await this.saveCollection('clues', clues, {
        indexBy: ['id', 'storyArc', 'category', 'tags'],
        sortBy: 'title',
        groupBy: 'storyArc' // Group clues by story arc for better locality
      });
    } catch (error) {
      console.error('Failed to save clues:', error);
      return { success: false, chunksCreated: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Save story arcs with dependency tracking
   */
  async saveStoryArcs(arcs: StoryArc[]): Promise<{ success: boolean; chunksCreated: number; error?: string }> {
    try {
      return await this.saveCollection('story_arcs', arcs, {
        indexBy: ['id', 'name', 'tags'],
        sortBy: 'name'
      });
    } catch (error) {
      console.error('Failed to save story arcs:', error);
      return { success: false, chunksCreated: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Save NPCs with relationship indexing
   */
  async saveNPCs(npcs: NPC[]): Promise<{ success: boolean; chunksCreated: number; error?: string }> {
    try {
      return await this.saveCollection('npcs', npcs, {
        indexBy: ['id', 'name', 'traits'],
        sortBy: 'name'
      });
    } catch (error) {
      console.error('Failed to save NPCs:', error);
      return { success: false, chunksCreated: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Generic collection save with chunking and indexing
   */
  private async saveCollection<T extends { id: string }>(
    collectionName: string,
    items: T[],
    options: {
      indexBy: string[];
      sortBy?: string;
      groupBy?: string;
    }
  ): Promise<{ success: boolean; chunksCreated: number; error?: string }> {
    const startTime = Date.now();
    console.log(`📦 Organizing ${items.length} ${collectionName} into chunks...`);

    try {
      // Sort items if requested
      let sortedItems = [...items];
      if (options.sortBy) {
        sortedItems.sort((a, b) => {
          const aVal = (a as any)[options.sortBy!];
          const bVal = (b as any)[options.sortBy!];
          return aVal.localeCompare(bVal);
        });
      }

      // Group items if requested (for better data locality)
      if (options.groupBy) {
        sortedItems = this.groupItems(sortedItems, options.groupBy);
      }

      // Create chunks
      const chunks = this.createChunks(sortedItems, this.options.chunkSize);
      console.log(`📊 Created ${chunks.length} chunks for ${collectionName}`);

      // Build index
      const index = this.buildIndex(sortedItems, options.indexBy, collectionName);

      // Create manifest
      const manifest: ChunkManifest<T> = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        totalItems: items.length,
        chunkSize: this.options.chunkSize,
        totalChunks: chunks.length,
        contentType: collectionName,
        metadata: {
          lastModified: new Date().toISOString(),
          totalSize: JSON.stringify(items).length,
          compression: this.options.enableCompression
        },
        chunks: chunks.map((chunk, index) => ({
          id: `${collectionName}_chunk_${index}`,
          itemCount: chunk.length,
          size: JSON.stringify(chunk).length,
          startIndex: index * this.options.chunkSize,
          endIndex: Math.min((index + 1) * this.options.chunkSize - 1, items.length - 1),
          lastModified: new Date().toISOString()
        })),
        index
      };

      // Save chunks in parallel
      const chunkSavePromises = chunks.map(async (chunk, index) => {
        const chunkId = `${collectionName}_chunk_${index}`;
        const chunkData: ChunkData<T> = {
          chunkId,
          items: chunk,
          metadata: {
            timestamp: new Date().toISOString(),
            itemCount: chunk.length,
            startIndex: index * this.options.chunkSize,
            endIndex: Math.min((index + 1) * this.options.chunkSize - 1, items.length - 1)
          }
        };

        const key = `content_chunk_${chunkId}`;
        await this.storageAdapter.setItem(key, JSON.stringify(chunkData));
      });

      await Promise.all(chunkSavePromises);

      // Save manifest
      const manifestKey = `content_manifest_${collectionName}`;
      await this.storageAdapter.setItem(manifestKey, JSON.stringify(manifest));

      // Cache manifest
      this.manifestCache.set(collectionName, manifest);

      const duration = Date.now() - startTime;
      console.log(`✅ Organized ${collectionName}: ${chunks.length} chunks in ${duration}ms`);

      return { success: true, chunksCreated: chunks.length };

    } catch (error) {
      console.error(`❌ Failed to organize ${collectionName}:`, error);
      return { 
        success: false, 
        chunksCreated: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Load items with lazy loading and pagination
   */
  async loadStorylets(options: QueryOptions = {}): Promise<QueryResult<Storylet>> {
    return this.loadCollection<Storylet>('storylets', options);
  }

  async loadClues(options: QueryOptions = {}): Promise<QueryResult<Clue>> {
    return this.loadCollection<Clue>('clues', options);
  }

  async loadStoryArcs(options: QueryOptions = {}): Promise<QueryResult<StoryArc>> {
    return this.loadCollection<StoryArc>('story_arcs', options);
  }

  async loadNPCs(options: QueryOptions = {}): Promise<QueryResult<NPC>> {
    return this.loadCollection<NPC>('npcs', options);
  }

  /**
   * Generic collection loader with pagination and filtering
   */
  private async loadCollection<T>(
    collectionName: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    try {
      const manifest = await this.getManifest<T>(collectionName);
      if (!manifest) {
        return { items: [], totalCount: 0, hasMore: false };
      }

      const {
        limit = 50,
        offset = 0,
        filter,
        sortBy,
        sortOrder = 'asc'
      } = options;

      // If no filtering/sorting and we can serve from chunks directly
      if (!filter && !sortBy) {
        return this.loadFromChunks(manifest, offset, limit);
      }

      // For complex queries, load all and process
      const allItems = await this.loadAllItems<T>(manifest);
      
      // Apply filter
      let filteredItems = filter ? allItems.filter(filter) : allItems;

      // Apply sorting
      if (sortBy) {
        filteredItems.sort((a, b) => {
          const aVal = (a as any)[sortBy];
          const bVal = (b as any)[sortBy];
          const comparison = aVal.localeCompare(bVal);
          return sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      // Apply pagination
      const totalCount = filteredItems.length;
      const paginatedItems = filteredItems.slice(offset, offset + limit);
      const hasMore = offset + limit < totalCount;
      const nextOffset = hasMore ? offset + limit : undefined;

      return {
        items: paginatedItems,
        totalCount,
        hasMore,
        nextOffset
      };

    } catch (error) {
      console.error(`Failed to load ${collectionName}:`, error);
      return { items: [], totalCount: 0, hasMore: false };
    }
  }

  /**
   * Fast lookup by ID using index
   */
  async findById<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const manifest = await this.getManifest<T>(collectionName);
      if (!manifest || !manifest.index.byId[id]) {
        return null;
      }

      const { chunkId, localIndex } = manifest.index.byId[id];
      const chunk = await this.getChunk<T>(chunkId);
      
      return chunk ? chunk.items[localIndex] : null;

    } catch (error) {
      console.error(`Failed to find ${id} in ${collectionName}:`, error);
      return null;
    }
  }

  /**
   * Find items by tag
   */
  async findByTag<T>(collectionName: string, tag: string): Promise<T[]> {
    try {
      const manifest = await this.getManifest<T>(collectionName);
      if (!manifest || !manifest.index.byTag?.[tag]) {
        return [];
      }

      const itemIds = manifest.index.byTag[tag];
      const items: T[] = [];

      for (const id of itemIds) {
        const item = await this.findById<T>(collectionName, id);
        if (item) {
          items.push(item);
        }
      }

      return items;

    } catch (error) {
      console.error(`Failed to find items by tag ${tag} in ${collectionName}:`, error);
      return [];
    }
  }

  /**
   * Find clues by story arc
   */
  async findCluesByArc(arcId: string): Promise<Clue[]> {
    try {
      const manifest = await this.getManifest<Clue>('clues');
      if (!manifest || !manifest.index.byArc?.[arcId]) {
        return [];
      }

      const clueIds = manifest.index.byArc[arcId];
      const clues: Clue[] = [];

      for (const id of clueIds) {
        const clue = await this.findById<Clue>('clues', id);
        if (clue) {
          clues.push(clue);
        }
      }

      return clues;

    } catch (error) {
      console.error(`Failed to find clues for arc ${arcId}:`, error);
      return [];
    }
  }

  /**
   * Update a single item (incremental update)
   */
  async updateItem<T extends { id: string }>(
    collectionName: string,
    item: T
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const manifest = await this.getManifest<T>(collectionName);
      if (!manifest) {
        return { success: false, error: 'Collection not found' };
      }

      const indexEntry = manifest.index.byId[item.id];
      if (!indexEntry) {
        return { success: false, error: 'Item not found' };
      }

      // Load the chunk
      const chunk = await this.getChunk<T>(indexEntry.chunkId);
      if (!chunk) {
        return { success: false, error: 'Chunk not found' };
      }

      // Update the item
      chunk.items[indexEntry.localIndex] = item;
      chunk.metadata.lastModified = new Date().toISOString();

      // Save the updated chunk
      const key = `content_chunk_${indexEntry.chunkId}`;
      await this.storageAdapter.setItem(key, JSON.stringify(chunk));

      // Update cache
      this.chunkCache.set(indexEntry.chunkId, {
        data: chunk,
        lastAccessed: Date.now()
      });

      // Update manifest timestamp
      manifest.metadata.lastModified = new Date().toISOString();
      const manifestKey = `content_manifest_${collectionName}`;
      await this.storageAdapter.setItem(manifestKey, JSON.stringify(manifest));

      console.log(`✅ Updated ${item.id} in ${collectionName}`);
      return { success: true };

    } catch (error) {
      console.error(`Failed to update item ${item.id} in ${collectionName}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collectionName: string): Promise<{
    totalItems: number;
    totalChunks: number;
    averageChunkSize: number;
    totalSize: number;
    lastModified: string;
    cacheHitRate: number;
  } | null> {
    try {
      const manifest = await this.getManifest(collectionName);
      if (!manifest) {
        return null;
      }

      const totalCacheRequests = this.chunkCache.size;
      const cacheHits = Array.from(this.chunkCache.values()).length;
      const cacheHitRate = totalCacheRequests > 0 ? (cacheHits / totalCacheRequests) * 100 : 0;

      return {
        totalItems: manifest.totalItems,
        totalChunks: manifest.totalChunks,
        averageChunkSize: manifest.totalItems / manifest.totalChunks,
        totalSize: manifest.metadata.totalSize,
        lastModified: manifest.metadata.lastModified,
        cacheHitRate
      };

    } catch (error) {
      console.error(`Failed to get stats for ${collectionName}:`, error);
      return null;
    }
  }

  /**
   * Clear collection data
   */
  async clearCollection(collectionName: string): Promise<boolean> {
    try {
      const manifest = await this.getManifest(collectionName);
      if (!manifest) {
        return true; // Already cleared
      }

      // Remove all chunks
      const deletePromises = manifest.chunks.map(chunk =>
        this.storageAdapter.removeItem(`content_chunk_${chunk.id}`)
      );

      // Remove manifest
      deletePromises.push(
        this.storageAdapter.removeItem(`content_manifest_${collectionName}`)
      );

      await Promise.all(deletePromises);

      // Clear caches
      this.manifestCache.delete(collectionName);
      for (const chunkInfo of manifest.chunks) {
        this.chunkCache.delete(chunkInfo.id);
      }

      console.log(`✅ Cleared collection: ${collectionName}`);
      return true;

    } catch (error) {
      console.error(`Failed to clear collection ${collectionName}:`, error);
      return false;
    }
  }

  // Private helper methods

  private createChunks<T>(items: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private groupItems<T>(items: T[], groupBy: string): T[] {
    const grouped = new Map<string, T[]>();
    
    // Group items
    for (const item of items) {
      const groupKey = (item as any)[groupBy] || 'ungrouped';
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)!.push(item);
    }

    // Flatten grouped items (items in same group stay together)
    const result: T[] = [];
    for (const group of grouped.values()) {
      result.push(...group);
    }

    return result;
  }

  private buildIndex<T extends { id: string }>(items: T[], indexBy: string[], collectionName: string): ChunkManifest<T>['index'] {
    const index: ChunkManifest<T>['index'] = {
      byId: {},
      byType: {},
      byTag: {},
      byArc: {}
    };

    items.forEach((item, globalIndex) => {
      const chunkIndex = Math.floor(globalIndex / this.options.chunkSize);
      const localIndex = globalIndex % this.options.chunkSize;
      const chunkId = `${collectionName}_chunk_${chunkIndex}`;

      // ID index
      index.byId[item.id] = { chunkId, localIndex };

      // Build other indexes
      for (const field of indexBy) {
        if (field === 'id') continue;

        const value = (item as any)[field];
        if (value === undefined || value === null) continue;

        if (field === 'tags' && Array.isArray(value)) {
          // Handle array fields like tags
          for (const tag of value) {
            if (!index.byTag![tag]) index.byTag![tag] = [];
            index.byTag![tag].push(item.id);
          }
        } else if (field === 'storyArc' || field === 'arcId') {
          // Handle arc references
          if (!index.byArc![value]) index.byArc![value] = [];
          index.byArc![value].push(item.id);
        } else {
          // Handle other string fields
          if (!index.byType![value]) index.byType![value] = [];
          index.byType![value].push(item.id);
        }
      }
    });

    return index;
  }

  private async getManifest<T>(collectionName: string): Promise<ChunkManifest<T> | null> {
    // Check cache first
    if (this.manifestCache.has(collectionName)) {
      return this.manifestCache.get(collectionName)!;
    }

    try {
      const manifestKey = `content_manifest_${collectionName}`;
      const manifestData = await this.storageAdapter.getItem(manifestKey);
      
      if (!manifestData) {
        return null;
      }

      const manifest: ChunkManifest<T> = JSON.parse(manifestData);
      this.manifestCache.set(collectionName, manifest);
      return manifest;

    } catch (error) {
      console.error(`Failed to load manifest for ${collectionName}:`, error);
      return null;
    }
  }

  private async getChunk<T>(chunkId: string): Promise<ChunkData<T> | null> {
    // Check cache first
    const cached = this.chunkCache.get(chunkId);
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.data;
    }

    try {
      const key = `content_chunk_${chunkId}`;
      const chunkData = await this.storageAdapter.getItem(key);
      
      if (!chunkData) {
        return null;
      }

      const chunk: ChunkData<T> = JSON.parse(chunkData);
      
      // Add to cache (with LRU eviction)
      this.addToCache(chunkId, chunk);
      
      return chunk;

    } catch (error) {
      console.error(`Failed to load chunk ${chunkId}:`, error);
      return null;
    }
  }

  private addToCache<T>(chunkId: string, data: ChunkData<T>): void {
    // Evict oldest if cache is full
    if (this.chunkCache.size >= this.options.cacheSize) {
      let oldestKey = '';
      let oldestTime = Date.now();
      
      for (const [key, entry] of this.chunkCache.entries()) {
        if (entry.lastAccessed < oldestTime) {
          oldestTime = entry.lastAccessed;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        this.chunkCache.delete(oldestKey);
      }
    }

    this.chunkCache.set(chunkId, {
      data,
      lastAccessed: Date.now()
    });
  }

  private async loadFromChunks<T>(
    manifest: ChunkManifest<T>,
    offset: number,
    limit: number
  ): Promise<QueryResult<T>> {
    const startChunk = Math.floor(offset / this.options.chunkSize);
    const endChunk = Math.floor((offset + limit - 1) / this.options.chunkSize);
    
    const items: T[] = [];
    
    for (let chunkIndex = startChunk; chunkIndex <= endChunk && chunkIndex < manifest.totalChunks; chunkIndex++) {
      const chunkInfo = manifest.chunks[chunkIndex];
      const chunk = await this.getChunk<T>(chunkInfo.id);
      
      if (chunk) {
        const chunkStartOffset = chunkIndex * this.options.chunkSize;
        const localStartIndex = Math.max(0, offset - chunkStartOffset);
        const localEndIndex = Math.min(chunk.items.length, offset + limit - chunkStartOffset);
        
        if (localStartIndex < localEndIndex) {
          items.push(...chunk.items.slice(localStartIndex, localEndIndex));
        }
      }
      
      if (items.length >= limit) {
        break;
      }
    }

    return {
      items: items.slice(0, limit),
      totalCount: manifest.totalItems,
      hasMore: offset + limit < manifest.totalItems,
      nextOffset: offset + limit < manifest.totalItems ? offset + limit : undefined
    };
  }

  private async loadAllItems<T>(manifest: ChunkManifest<T>): Promise<T[]> {
    const items: T[] = [];
    
    for (const chunkInfo of manifest.chunks) {
      const chunk = await this.getChunk<T>(chunkInfo.id);
      if (chunk) {
        items.push(...chunk.items);
      }
    }
    
    return items;
  }
}