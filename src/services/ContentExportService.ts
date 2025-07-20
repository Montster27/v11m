// Unified Content Export Service
// Replaces fragmented export implementations with a single, comprehensive service

import { StorageAdapter } from './storage/StorageAdapter';
import { CompressionService } from './compression/CompressionService';
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
import { useSocialStore } from '../stores/v2/useSocialStore';
import type { Storylet, StoryArc } from '../types/storylet';
import type { NPC } from '../types/npc';
import type { Clue } from '../types/clue';

// Export configuration options
export interface ExportOptions {
  format: 'json' | 'compressed' | 'structured';
  includeMetadata: boolean;
  contentTypes?: ('storylets' | 'npcs' | 'clues' | 'arcs')[];
  onProgress?: (progress: number, stage: string) => void;
  validateDependencies?: boolean;
  includePreferences?: boolean;
  compressionLevel?: 1 | 2 | 3 | 4 | 5; // 1 = fastest, 5 = best compression
}

// Import configuration options
export interface ImportOptions {
  allowLegacyFormat?: boolean;
  ignoreMissingDependencies?: boolean;
  overwriteExisting?: boolean;
  validateContent?: boolean;
  onProgress?: (progress: number, stage: string) => void;
  dryRun?: boolean;
}

// Content dependency tracking
export interface ContentDependency {
  id: string;
  type: 'storylet' | 'npc' | 'clue' | 'arc';
  name: string;
  required: boolean;
  version?: string;
}

// Unified export package structure
export interface ExportPackage {
  version: string;
  timestamp: string;
  metadata: {
    schemaVersion: number;
    contentCounts: Record<string, number>;
    dependencies: ContentDependency[];
    exportOptions: ExportOptions;
    exportedBy: string;
    totalSize: number;
    checksum?: string;
  };
  data: {
    storylets?: Storylet[];
    npcs?: NPC[];
    clues?: Clue[];
    arcs?: StoryArc[];
    preferences?: Record<string, any>;
  };
  compressed?: boolean;
  compressionInfo?: {
    originalSize: number;
    compressedSize: number;
    algorithm: string;
  };
}

// Import transaction result
export interface ImportResult {
  success: boolean;
  imported?: Record<string, number>;
  errors?: string[];
  warnings?: string[];
  skipped?: Record<string, number>;
  summary?: {
    totalItems: number;
    successfulItems: number;
    failedItems: number;
    duration: number;
  };
}

// Import transaction for rollback support
export class ImportTransaction {
  private storageAdapter: StorageAdapter;
  private backupKeys: string[] = [];
  private isActive = false;

  constructor(storageAdapter: StorageAdapter) {
    this.storageAdapter = storageAdapter;
  }

  async begin(): Promise<void> {
    if (this.isActive) {
      throw new Error('Transaction already active');
    }
    this.isActive = true;
    this.backupKeys = [];
    console.log('📦 Import transaction started');
  }

  async backupItem(key: string): Promise<void> {
    if (!this.isActive) {
      throw new Error('Transaction not active');
    }

    try {
      const existingData = await this.storageAdapter.getItem(key);
      if (existingData) {
        const backupKey = `__backup_${Date.now()}_${key}`;
        await this.storageAdapter.setItem(backupKey, existingData);
        this.backupKeys.push(backupKey);
      }
    } catch (error) {
      console.warn(`Failed to backup ${key}:`, error);
    }
  }

  async commit(): Promise<void> {
    if (!this.isActive) {
      throw new Error('Transaction not active');
    }

    // Clean up backup data
    for (const backupKey of this.backupKeys) {
      try {
        await this.storageAdapter.removeItem(backupKey);
      } catch (error) {
        console.warn(`Failed to cleanup backup ${backupKey}:`, error);
      }
    }

    this.isActive = false;
    this.backupKeys = [];
    console.log('✅ Import transaction committed');
  }

  async rollback(): Promise<void> {
    if (!this.isActive) {
      throw new Error('Transaction not active');
    }

    console.log('🔄 Rolling back import transaction...');

    // Restore from backups
    for (const backupKey of this.backupKeys) {
      try {
        const originalKey = backupKey.replace(/^__backup_\d+_/, '');
        const backupData = await this.storageAdapter.getItem(backupKey);
        
        if (backupData) {
          await this.storageAdapter.setItem(originalKey, backupData);
        }
        
        await this.storageAdapter.removeItem(backupKey);
      } catch (error) {
        console.error(`Failed to rollback ${backupKey}:`, error);
      }
    }

    this.isActive = false;
    this.backupKeys = [];
    console.log('✅ Import transaction rolled back');
  }
}

// Main export service class
export class ContentExportService {
  private storageAdapter: StorageAdapter;
  private compressionService: CompressionService;
  private readonly CURRENT_SCHEMA_VERSION = 2;
  private readonly EXPORT_VERSION = '2.0';
  private monitoringCallback?: (event: { type: 'export' | 'import' | 'error'; success: boolean; duration?: number; size?: number; error?: string }) => void;

  constructor(storageAdapter: StorageAdapter, monitoringCallback?: (event: any) => void) {
    this.storageAdapter = storageAdapter;
    this.compressionService = new CompressionService();
    this.monitoringCallback = monitoringCallback;
  }

  /**
   * Export project content with unified structure
   */
  async exportProject(options: ExportOptions): Promise<ExportPackage> {
    const startTime = Date.now();
    console.log('📤 Starting content export with options:', options);

    try {
      // Initialize export package
      const exportPackage: ExportPackage = {
        version: this.EXPORT_VERSION,
        timestamp: new Date().toISOString(),
        metadata: {
          schemaVersion: this.CURRENT_SCHEMA_VERSION,
          contentCounts: {},
          dependencies: [],
          exportOptions: options,
          exportedBy: 'ContentExportService',
          totalSize: 0
        },
        data: {}
      };

      // Progress tracking
      const stages = ['gathering', 'dependencies', 'packaging', 'compression'];
      let currentStage = 0;

      const updateProgress = (stage: string, progress: number) => {
        const overallProgress = (currentStage / stages.length) * 100 + (progress / stages.length);
        if (options.onProgress) {
          options.onProgress(Math.min(overallProgress, 100), stage);
        }
      };

      // Stage 1: Gather content data
      updateProgress('Gathering content...', 0);
      
      if (!options.contentTypes || options.contentTypes.includes('storylets')) {
        exportPackage.data.storylets = await this.gatherStorylets();
        exportPackage.metadata.contentCounts.storylets = exportPackage.data.storylets.length;
        updateProgress('Gathering storylets...', 25);
      }

      if (!options.contentTypes || options.contentTypes.includes('npcs')) {
        exportPackage.data.npcs = await this.gatherNPCs();
        exportPackage.metadata.contentCounts.npcs = exportPackage.data.npcs.length;
        updateProgress('Gathering NPCs...', 50);
      }

      if (!options.contentTypes || options.contentTypes.includes('clues')) {
        exportPackage.data.clues = await this.gatherClues();
        exportPackage.metadata.contentCounts.clues = exportPackage.data.clues.length;
        updateProgress('Gathering clues...', 75);
      }

      if (!options.contentTypes || options.contentTypes.includes('arcs')) {
        exportPackage.data.arcs = await this.gatherArcs();
        exportPackage.metadata.contentCounts.arcs = exportPackage.data.arcs.length;
        updateProgress('Gathering arcs...', 100);
      }

      if (options.includePreferences) {
        exportPackage.data.preferences = await this.gatherPreferences();
      }

      currentStage++;

      // Stage 2: Analyze dependencies
      updateProgress('Analyzing dependencies...', 0);
      if (options.validateDependencies) {
        exportPackage.metadata.dependencies = await this.analyzeDependencies(exportPackage.data);
      }
      currentStage++;

      // Stage 3: Calculate package size and metadata
      updateProgress('Packaging content...', 0);
      const packageJson = JSON.stringify(exportPackage);
      exportPackage.metadata.totalSize = packageJson.length;
      
      if (options.includeMetadata) {
        exportPackage.metadata.checksum = await this.calculateChecksum(packageJson);
      }
      currentStage++;

      // Stage 4: Apply compression if requested
      updateProgress('Finalizing export...', 0);
      if (options.format === 'compressed') {
        const compressed = await this.compressPackage(exportPackage, options.compressionLevel);
        updateProgress('Finalizing export...', 100);
        currentStage++;
        
        const duration = Date.now() - startTime;
        console.log(`✅ Export completed in ${duration}ms (compressed: ${compressed.compressionInfo?.compressedSize} bytes)`);
        
        // Record monitoring event
        if (this.monitoringCallback) {
          this.monitoringCallback({
            type: 'export',
            success: true,
            duration,
            size: compressed.compressionInfo?.compressedSize || exportPackage.metadata.totalSize
          });
        }
        
        return compressed;
      }

      currentStage++;
      const duration = Date.now() - startTime;
      console.log(`✅ Export completed in ${duration}ms (${exportPackage.metadata.totalSize} bytes)`);

      // Record monitoring event
      if (this.monitoringCallback) {
        this.monitoringCallback({
          type: 'export',
          success: true,
          duration,
          size: exportPackage.metadata.totalSize
        });
      }

      return exportPackage;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ Export failed:', error);
      
      // Record monitoring event for error
      if (this.monitoringCallback) {
        this.monitoringCallback({
          type: 'error',
          success: false,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import project content with transaction support
   */
  async importProject(packageData: ExportPackage, options: ImportOptions = {}): Promise<ImportResult> {
    const startTime = Date.now();
    console.log('📥 Starting content import with options:', options);

    const result: ImportResult = {
      success: false,
      imported: {},
      errors: [],
      warnings: [],
      skipped: {}
    };

    try {
      // Validate package version
      if (packageData.metadata.schemaVersion > this.CURRENT_SCHEMA_VERSION) {
        throw new Error(`Package requires newer version (schema ${packageData.metadata.schemaVersion} > ${this.CURRENT_SCHEMA_VERSION})`);
      }

      // Check dependencies if required
      if (!options.ignoreMissingDependencies && packageData.metadata.dependencies) {
        const missingDeps = await this.checkDependencies(packageData.metadata.dependencies);
        if (missingDeps.length > 0) {
          result.errors = missingDeps.map(dep => `Missing ${dep.type}: ${dep.id} (${dep.name})`);
          return result;
        }
      }

      // Return early if dry run
      if (options.dryRun) {
        result.success = true;
        result.imported = packageData.metadata.contentCounts;
        return result;
      }

      // Start transaction
      const transaction = new ImportTransaction(this.storageAdapter);
      await transaction.begin();

      try {
        const stages = ['storylets', 'npcs', 'clues', 'arcs', 'preferences'];
        let currentStage = 0;

        const updateProgress = (stage: string, progress: number) => {
          const overallProgress = (currentStage / stages.length) * 100 + (progress / stages.length);
          if (options.onProgress) {
            options.onProgress(Math.min(overallProgress, 100), stage);
          }
        };

        // Import each content type
        if (packageData.data.storylets) {
          updateProgress('Importing storylets...', 0);
          const importedCount = await this.importStorylets(packageData.data.storylets, transaction, options);
          result.imported!.storylets = importedCount;
          updateProgress('Importing storylets...', 100);
        }
        currentStage++;

        if (packageData.data.npcs) {
          updateProgress('Importing NPCs...', 0);
          const importedCount = await this.importNPCs(packageData.data.npcs, transaction, options);
          result.imported!.npcs = importedCount;
          updateProgress('Importing NPCs...', 100);
        }
        currentStage++;

        if (packageData.data.clues) {
          updateProgress('Importing clues...', 0);
          const importedCount = await this.importClues(packageData.data.clues, transaction, options);
          result.imported!.clues = importedCount;
          updateProgress('Importing clues...', 100);
        }
        currentStage++;

        if (packageData.data.arcs) {
          updateProgress('Importing arcs...', 0);
          const importedCount = await this.importArcs(packageData.data.arcs, transaction, options);
          result.imported!.arcs = importedCount;
          updateProgress('Importing arcs...', 100);
        }
        currentStage++;

        if (packageData.data.preferences && options.includePreferences !== false) {
          updateProgress('Importing preferences...', 0);
          await this.importPreferences(packageData.data.preferences, transaction);
          updateProgress('Importing preferences...', 100);
        }
        currentStage++;

        // Commit transaction
        await transaction.commit();
        result.success = true;

        const duration = Date.now() - startTime;
        const totalImported = Object.values(result.imported!).reduce((sum, count) => sum + count, 0);
        
        result.summary = {
          totalItems: Object.values(packageData.metadata.contentCounts).reduce((sum, count) => sum + count, 0),
          successfulItems: totalImported,
          failedItems: 0,
          duration
        };

        console.log(`✅ Import completed in ${duration}ms (${totalImported} items imported)`);
        
        // Record monitoring event
        if (this.monitoringCallback) {
          this.monitoringCallback({
            type: 'import',
            success: true,
            duration,
            size: packageData.metadata?.totalSize || 0
          });
        }
        
        return result;

      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ Import failed:', error);
      
      // Record monitoring event for error
      if (this.monitoringCallback) {
        this.monitoringCallback({
          type: 'error',
          success: false,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      result.errors = [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`];
      return result;
    }
  }

  // Private helper methods for gathering data
  private async gatherStorylets(): Promise<Storylet[]> {
    // Get storylets from the narrative store
    const narrativeStore = useNarrativeStore.getState();
    return narrativeStore.getAllStorylets();
  }

  private async gatherNPCs(): Promise<NPC[]> {
    // For now, return empty array since social store doesn't have NPC entities stored
    // NPCs are stored separately in the social store as relationships/interactions
    // This may need to be implemented differently based on your NPC storage strategy
    console.warn('NPC export not yet implemented - social store stores relationships, not full NPC entities');
    return [];
  }

  private async gatherClues(): Promise<Clue[]> {
    // Get clues from storage
    try {
      const cluesData = await this.storageAdapter.getItem('content_clues');
      return cluesData ? JSON.parse(cluesData) : [];
    } catch {
      return [];
    }
  }

  private async gatherArcs(): Promise<StoryArc[]> {
    // Get arcs from storage
    try {
      const arcsData = await this.storageAdapter.getItem('content_arcs');
      return arcsData ? JSON.parse(arcsData) : [];
    } catch {
      return [];
    }
  }

  private async gatherPreferences(): Promise<Record<string, any>> {
    // Gather user preferences and settings
    try {
      const prefsData = await this.storageAdapter.getItem('user_preferences');
      return prefsData ? JSON.parse(prefsData) : {};
    } catch {
      return {};
    }
  }

  private async analyzeDependencies(data: ExportPackage['data']): Promise<ContentDependency[]> {
    const dependencies: ContentDependency[] = [];

    // Analyze storylet dependencies
    if (data.storylets) {
      for (const storylet of data.storylets) {
        // Check for NPC references
        if (storylet.characterRequirements) {
          for (const charReq of storylet.characterRequirements) {
            if (charReq.npcId) {
              dependencies.push({
                id: charReq.npcId,
                type: 'npc',
                name: charReq.npcId,
                required: true
              });
            }
          }
        }

        // Check for clue references
        if (storylet.outcomes) {
          for (const outcome of storylet.outcomes) {
            if (outcome.cluesAwarded) {
              for (const clueId of outcome.cluesAwarded) {
                dependencies.push({
                  id: clueId,
                  type: 'clue',
                  name: clueId,
                  required: false
                });
              }
            }
          }
        }
      }
    }

    // Remove duplicates
    const uniqueDeps = dependencies.filter((dep, index, self) => 
      index === self.findIndex(d => d.id === dep.id && d.type === dep.type)
    );

    return uniqueDeps;
  }

  private async checkDependencies(dependencies: ContentDependency[]): Promise<ContentDependency[]> {
    const missing: ContentDependency[] = [];

    for (const dep of dependencies) {
      let exists = false;

      try {
        switch (dep.type) {
          case 'npc': {
            // For now, assume NPCs exist since we don't have full NPC entities
            exists = true;
            break;
          }
          case 'storylet': {
            const narrativeStore = useNarrativeStore.getState();
            exists = narrativeStore.getStorylet(dep.id) !== null;
            break;
          }
          case 'clue': {
            const cluesData = await this.storageAdapter.getItem('content_clues');
            const clues = cluesData ? JSON.parse(cluesData) : [];
            exists = clues.some((clue: Clue) => clue.id === dep.id);
            break;
          }
          case 'arc': {
            const arcsData = await this.storageAdapter.getItem('content_arcs');
            const arcs = arcsData ? JSON.parse(arcsData) : [];
            exists = arcs.some((arc: StoryArc) => arc.id === dep.id);
            break;
          }
        }
      } catch {
        exists = false;
      }

      if (!exists && dep.required) {
        missing.push(dep);
      }
    }

    return missing;
  }

  private async calculateChecksum(data: string): Promise<string> {
    // Simple checksum calculation
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private async compressPackage(exportPackage: ExportPackage, level: number = 3): Promise<ExportPackage> {
    try {
      const jsonString = JSON.stringify(exportPackage);
      const compressionResult = await this.compressionService.compress(jsonString, {
        algorithm: 'lz-string',
        level: level as any,
        enableChunking: jsonString.length > 100 * 1024, // 100KB threshold
        chunkSize: 64 * 1024, // 64KB chunks
        onProgress: exportPackage.metadata.exportOptions.onProgress ? 
          (progress, stage) => exportPackage.metadata.exportOptions.onProgress!(80 + progress * 0.2, stage) : 
          undefined
      });

      return {
        ...exportPackage,
        compressed: true,
        compressionInfo: {
          originalSize: compressionResult.originalSize,
          compressedSize: compressionResult.compressedSize,
          algorithm: compressionResult.algorithm
        },
        data: {
          // Store compressed data instead of original
          compressed: typeof compressionResult.compressed === 'string' ? 
            compressionResult.compressed : 
            Array.from(compressionResult.compressed).join(',')
        } as any
      };
    } catch (error) {
      console.warn('Compression failed, returning uncompressed:', error);
      // Fallback to uncompressed
      return exportPackage;
    }
  }

  // Import helper methods
  private async importStorylets(storylets: Storylet[], transaction: ImportTransaction, options: ImportOptions): Promise<number> {
    const narrativeStore = useNarrativeStore.getState();
    let imported = 0;

    for (const storylet of storylets) {
      try {
        if (!options.overwriteExisting && narrativeStore.getStorylet(storylet.id)) {
          continue; // Skip existing
        }

        await transaction.backupItem(`storylet_${storylet.id}`);
        narrativeStore.addUserStorylet(storylet);
        imported++;
      } catch (error) {
        console.warn(`Failed to import storylet ${storylet.id}:`, error);
      }
    }

    return imported;
  }

  private async importNPCs(npcs: NPC[], transaction: ImportTransaction, options: ImportOptions): Promise<number> {
    // Skip NPC import for now since the social store doesn't handle full NPC entities
    console.warn('NPC import not yet implemented - social store handles relationships, not full NPC entities');
    return 0;
  }

  private async importClues(clues: Clue[], transaction: ImportTransaction, options: ImportOptions): Promise<number> {
    try {
      await transaction.backupItem('content_clues');
      await this.storageAdapter.setItem('content_clues', JSON.stringify(clues));
      return clues.length;
    } catch (error) {
      console.warn('Failed to import clues:', error);
      return 0;
    }
  }

  private async importArcs(arcs: StoryArc[], transaction: ImportTransaction, options: ImportOptions): Promise<number> {
    try {
      await transaction.backupItem('content_arcs');
      await this.storageAdapter.setItem('content_arcs', JSON.stringify(arcs));
      return arcs.length;
    } catch (error) {
      console.warn('Failed to import arcs:', error);
      return 0;
    }
  }

  private async importPreferences(preferences: Record<string, any>, transaction: ImportTransaction): Promise<void> {
    try {
      await transaction.backupItem('user_preferences');
      await this.storageAdapter.setItem('user_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to import preferences:', error);
    }
  }
}