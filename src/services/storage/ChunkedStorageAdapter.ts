// /Users/montysharma/v11m2/src/services/storage/ChunkedStorageAdapter.ts
// Wrapper around existing storage adapters to handle large data via chunking
// Implements transparent chunking for data > 1MB while maintaining StorageAdapter interface

import { StorageAdapter, StorageInfo } from './StorageAdapter';

interface ChunkManifest {
  totalChunks: number;
  totalSize: number;
  chunkSize: number;
  timestamp: string;
  originalKey: string;
  metadata?: Record<string, any>;
}

interface ChunkedStorageOptions {
  chunkSizeBytes?: number;
  maxChunks?: number;
  compressionEnabled?: boolean;
}

/**
 * ChunkedStorageAdapter provides transparent chunking for large data
 * while maintaining full compatibility with the StorageAdapter interface.
 * 
 * Features:
 * - Automatic chunking for data > chunkSizeBytes (default 1MB)
 * - Transparent reconstruction on retrieval
 * - Metadata tracking for chunks
 * - Fallback to normal storage for small data
 * - Cleanup support for orphaned chunks
 */
export class ChunkedStorageAdapter implements StorageAdapter {
  private readonly baseAdapter: StorageAdapter;
  private readonly chunkSizeBytes: number;
  private readonly maxChunks: number;
  private readonly compressionEnabled: boolean;

  constructor(baseAdapter: StorageAdapter, options: ChunkedStorageOptions = {}) {
    this.baseAdapter = baseAdapter;
    this.chunkSizeBytes = options.chunkSizeBytes || 1024 * 1024; // 1MB default
    this.maxChunks = options.maxChunks || 100; // Prevent excessive fragmentation
    this.compressionEnabled = options.compressionEnabled || false;
  }

  async initialize(): Promise<void> {
    // Only call initialize if the base adapter has it
    if (this.baseAdapter.initialize) {
      return this.baseAdapter.initialize();
    }
    // No-op for adapters that don't need initialization
  }

  async setItem(key: string, value: string): Promise<void> {
    // For small data, use base adapter directly
    if (value.length <= this.chunkSizeBytes) {
      return this.baseAdapter.setItem(key, value);
    }

    // Large data - use chunking
    await this.setItemChunked(key, value);
  }

  private async setItemChunked(key: string, value: string): Promise<void> {
    const chunks = this.splitIntoChunks(value);
    
    if (chunks.length > this.maxChunks) {
      throw new Error(`Data too large: ${chunks.length} chunks exceeds maximum of ${this.maxChunks}`);
    }

    // Create manifest
    const manifest: ChunkManifest = {
      totalChunks: chunks.length,
      totalSize: value.length,
      chunkSize: this.chunkSizeBytes,
      timestamp: new Date().toISOString(),
      originalKey: key,
      metadata: {
        compressionEnabled: this.compressionEnabled,
        version: '1.0'
      }
    };

    try {
      // Save chunks first
      const chunkPromises = chunks.map((chunk, index) => 
        this.baseAdapter.setItem(this.getChunkKey(key, index), chunk)
      );
      await Promise.all(chunkPromises);

      // Save manifest last (atomic operation indicator)
      await this.baseAdapter.setItem(this.getManifestKey(key), JSON.stringify(manifest));
      
      console.log(`✅ ChunkedStorage: Saved ${chunks.length} chunks for key "${key}" (${this.formatBytes(value.length)})`);
    } catch (error) {
      // Cleanup on failure
      await this.cleanupChunks(key, chunks.length);
      throw new Error(`Failed to save chunked data: ${error}`);
    }
  }

  private splitIntoChunks(data: string): string[] {
    const chunks: string[] = [];
    const chunkSize = this.chunkSizeBytes;
    
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    
    return chunks;
  }

  async getItem(key: string): Promise<string | null> {
    // First, try to get manifest (indicates chunked data)
    const manifestData = await this.baseAdapter.getItem(this.getManifestKey(key));
    
    if (!manifestData) {
      // No manifest - try direct retrieval (small data or legacy)
      return this.baseAdapter.getItem(key);
    }

    // Chunked data - reconstruct from chunks
    return this.getItemChunked(key, manifestData);
  }

  private async getItemChunked(key: string, manifestData: string): Promise<string | null> {
    try {
      const manifest: ChunkManifest = JSON.parse(manifestData);
      
      // Retrieve all chunks in parallel
      const chunkPromises = Array.from({ length: manifest.totalChunks }, (_, index) =>
        this.baseAdapter.getItem(this.getChunkKey(key, index))
      );
      
      const chunks = await Promise.all(chunkPromises);
      
      // Validate all chunks retrieved successfully
      const missingChunks = chunks.map((chunk, index) => chunk === null ? index : -1)
        .filter(index => index !== -1);
      
      if (missingChunks.length > 0) {
        console.error(`❌ ChunkedStorage: Missing chunks for key "${key}": ${missingChunks.join(', ')}`);
        return null;
      }
      
      // Reconstruct original data
      const reconstructed = chunks.join('');
      
      // Validate size
      if (reconstructed.length !== manifest.totalSize) {
        console.error(`❌ ChunkedStorage: Size mismatch for key "${key}": expected ${manifest.totalSize}, got ${reconstructed.length}`);
        return null;
      }
      
      console.log(`✅ ChunkedStorage: Reconstructed ${manifest.totalChunks} chunks for key "${key}" (${this.formatBytes(reconstructed.length)})`);
      return reconstructed;
      
    } catch (error) {
      console.error(`❌ ChunkedStorage: Failed to reconstruct chunked data for key "${key}":`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    // Check if item is chunked
    const manifestData = await this.baseAdapter.getItem(this.getManifestKey(key));
    
    if (manifestData) {
      // Remove chunked data
      await this.removeItemChunked(key, manifestData);
    } else {
      // Remove regular item
      await this.baseAdapter.removeItem(key);
    }
  }

  private async removeItemChunked(key: string, manifestData: string): Promise<void> {
    try {
      const manifest: ChunkManifest = JSON.parse(manifestData);
      
      // Remove all chunks
      const removePromises = Array.from({ length: manifest.totalChunks }, (_, index) =>
        this.baseAdapter.removeItem(this.getChunkKey(key, index))
      );
      
      // Remove manifest
      removePromises.push(this.baseAdapter.removeItem(this.getManifestKey(key)));
      
      await Promise.all(removePromises);
      
      console.log(`✅ ChunkedStorage: Removed ${manifest.totalChunks} chunks for key "${key}"`);
    } catch (error) {
      console.error(`❌ ChunkedStorage: Failed to remove chunked data for key "${key}":`, error);
      throw error;
    }
  }

  async getKeys(): Promise<string[]> {
    const allKeys = await this.baseAdapter.getKeys();
    
    // Filter out chunk and manifest keys, return only original keys
    const originalKeys = new Set<string>();
    const manifestPrefix = this.getManifestPrefix();
    const chunkPrefix = this.getChunkPrefix();
    
    for (const key of allKeys) {
      if (key.startsWith(manifestPrefix)) {
        // Extract original key from manifest key
        const originalKey = key.slice(manifestPrefix.length);
        originalKeys.add(originalKey);
      } else if (!key.startsWith(chunkPrefix)) {
        // Regular (non-chunked) key
        originalKeys.add(key);
      }
      // Skip chunk keys - they're internal
    }
    
    return Array.from(originalKeys);
  }

  async clear(): Promise<void> {
    return this.baseAdapter.clear();
  }

  async getStorageInfo(): Promise<StorageInfo> {
    return this.baseAdapter.getStorageInfo();
  }

  // Utility methods for chunk management

  /**
   * Clean up orphaned chunks for a specific key
   */
  async cleanupChunks(key: string, maxChunks: number): Promise<void> {
    const cleanupPromises: Promise<void>[] = [];
    
    // Remove manifest
    cleanupPromises.push(
      this.baseAdapter.removeItem(this.getManifestKey(key)).catch(() => {})
    );
    
    // Remove chunks
    for (let i = 0; i < maxChunks; i++) {
      cleanupPromises.push(
        this.baseAdapter.removeItem(this.getChunkKey(key, i)).catch(() => {})
      );
    }
    
    await Promise.all(cleanupPromises);
  }

  /**
   * Validate chunk integrity for a key
   */
  async validateChunks(key: string): Promise<{ valid: boolean; error?: string; manifest?: ChunkManifest }> {
    try {
      const manifestData = await this.baseAdapter.getItem(this.getManifestKey(key));
      if (!manifestData) {
        return { valid: false, error: 'No manifest found' };
      }

      const manifest: ChunkManifest = JSON.parse(manifestData);
      
      // Check all chunks exist
      for (let i = 0; i < manifest.totalChunks; i++) {
        const chunk = await this.baseAdapter.getItem(this.getChunkKey(key, i));
        if (chunk === null) {
          return { valid: false, error: `Missing chunk ${i}`, manifest };
        }
      }

      return { valid: true, manifest };
    } catch (error) {
      return { valid: false, error: `Validation error: ${error}` };
    }
  }

  /**
   * Get statistics about chunked storage usage
   */
  async getChunkingStats(): Promise<{
    totalChunkedKeys: number;
    totalChunks: number;
    totalChunkedSize: number;
    averageChunksPerKey: number;
    largestKey: { key: string; chunks: number; size: number } | null;
  }> {
    const allKeys = await this.baseAdapter.getKeys();
    const manifestKeys = allKeys.filter(key => key.startsWith(this.getManifestPrefix()));
    
    let totalChunks = 0;
    let totalSize = 0;
    let largestKey: { key: string; chunks: number; size: number } | null = null;
    
    for (const manifestKey of manifestKeys) {
      try {
        const manifestData = await this.baseAdapter.getItem(manifestKey);
        if (manifestData) {
          const manifest: ChunkManifest = JSON.parse(manifestData);
          totalChunks += manifest.totalChunks;
          totalSize += manifest.totalSize;
          
          if (!largestKey || manifest.totalChunks > largestKey.chunks) {
            largestKey = {
              key: manifest.originalKey,
              chunks: manifest.totalChunks,
              size: manifest.totalSize
            };
          }
        }
      } catch (error) {
        console.warn(`Failed to parse manifest for ${manifestKey}:`, error);
      }
    }
    
    return {
      totalChunkedKeys: manifestKeys.length,
      totalChunks,
      totalChunkedSize: totalSize,
      averageChunksPerKey: manifestKeys.length > 0 ? totalChunks / manifestKeys.length : 0,
      largestKey
    };
  }

  // Private helper methods

  private getManifestKey(originalKey: string): string {
    return `${this.getManifestPrefix()}${originalKey}`;
  }

  private getChunkKey(originalKey: string, chunkIndex: number): string {
    return `${this.getChunkPrefix()}${originalKey}_chunk_${chunkIndex}`;
  }

  private getManifestPrefix(): string {
    return '__chunked_manifest__';
  }

  private getChunkPrefix(): string {
    return '__chunked_data__';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}