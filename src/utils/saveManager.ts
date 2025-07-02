// /Users/montysharma/v11m2/src/utils/saveManager.ts
// Atomic Save Manager for unified save/load operations across all stores

import { compress, decompress } from 'lz-string';
import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';

interface SaveGame {
  version: number;
  timestamp: number;
  checksum?: string;
  metadata: {
    playerName?: string;
    gameDay: number;
    playerLevel: number;
    playtime: number;
  };
  data: {
    core: any;
    narrative: any;
    social: any;
  };
}

export interface SaveManagerStats {
  totalSaves: number;
  lastSaveTime: number | null;
  lastLoadTime: number | null;
  saveSize: number;
  compressionRatio: number;
}

class SaveManager {
  private static instance: SaveManager;
  private saveKey = 'v11m2-unified-save';
  private backupKey = 'v11m2-unified-save-backup';
  private currentVersion = 1;
  private stats: SaveManagerStats = {
    totalSaves: 0,
    lastSaveTime: null,
    lastLoadTime: null,
    saveSize: 0,
    compressionRatio: 0
  };

  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  /**
   * Atomically save all store states to a single compressed save file
   */
  async saveGame(): Promise<boolean> {
    try {
      console.log('[SaveManager] Starting atomic save operation...');
      
      // Capture all store states atomically
      const coreState = useCoreGameStore.getState();
      const narrativeState = useNarrativeStore.getState();
      const socialState = useSocialStore.getState();

      // Extract metadata for quick access
      const metadata = {
        playerName: coreState.character?.name || 'Unknown Player',
        gameDay: coreState.world?.day || 1,
        playerLevel: coreState.player?.level || 1,
        playtime: coreState.world?.playtime || 0
      };

      const saveData: SaveGame = {
        version: this.currentVersion,
        timestamp: Date.now(),
        metadata,
        data: {
          core: this.serializeStoreState(coreState),
          narrative: this.serializeStoreState(narrativeState),
          social: this.serializeStoreState(socialState)
        }
      };

      // Calculate checksum for integrity verification
      saveData.checksum = this.calculateChecksum(saveData.data);

      // Compress to reduce storage size
      const serialized = JSON.stringify(saveData);
      const compressed = compress(serialized);
      
      // Update statistics
      this.stats.saveSize = compressed.length;
      this.stats.compressionRatio = serialized.length / compressed.length;

      // Backup current save before overwriting
      const existingSave = localStorage.getItem(this.saveKey);
      if (existingSave) {
        localStorage.setItem(this.backupKey, existingSave);
      }

      // Write new save atomically
      localStorage.setItem(this.saveKey, compressed);

      // Update stats
      this.stats.totalSaves++;
      this.stats.lastSaveTime = Date.now();

      console.log('[SaveManager] Atomic save completed successfully', {
        size: `${(compressed.length / 1024).toFixed(2)}KB`,
        compression: `${this.stats.compressionRatio.toFixed(2)}x`,
        checksum: saveData.checksum.substring(0, 8)
      });

      return true;
    } catch (error) {
      console.error('[SaveManager] Atomic save failed:', error);
      
      // Attempt to restore from backup if main save was corrupted
      try {
        const backup = localStorage.getItem(this.backupKey);
        if (backup) {
          localStorage.setItem(this.saveKey, backup);
          console.log('[SaveManager] Restored from backup after save failure');
        }
      } catch (restoreError) {
        console.error('[SaveManager] Failed to restore from backup:', restoreError);
      }
      
      return false;
    }
  }

  /**
   * Atomically load all store states from unified save file
   */
  async loadGame(): Promise<boolean> {
    try {
      console.log('[SaveManager] Starting atomic load operation...');
      
      const compressed = localStorage.getItem(this.saveKey);
      if (!compressed) {
        console.log('[SaveManager] No unified save found');
        return false;
      }

      // Decompress and parse
      const decompressed = decompress(compressed);
      if (!decompressed) {
        throw new Error('Failed to decompress save data');
      }

      const saveData: SaveGame = JSON.parse(decompressed);
      
      // Verify save integrity
      if (saveData.checksum) {
        const calculatedChecksum = this.calculateChecksum(saveData.data);
        if (calculatedChecksum !== saveData.checksum) {
          throw new Error('Save file corrupted - checksum mismatch');
        }
      }

      // Migrate if needed
      const migrated = this.migrate(saveData);

      // Restore all stores atomically
      console.log('[SaveManager] Restoring store states...');
      
      // Restore each store state
      if (migrated.data.core) {
        useCoreGameStore.setState(this.deserializeStoreState(migrated.data.core));
        console.log('[SaveManager] Core game state restored');
      }

      if (migrated.data.narrative) {
        useNarrativeStore.setState(this.deserializeStoreState(migrated.data.narrative));
        console.log('[SaveManager] Narrative state restored');
      }

      if (migrated.data.social) {
        useSocialStore.setState(this.deserializeStoreState(migrated.data.social));
        console.log('[SaveManager] Social state restored');
      }

      // Update stats
      this.stats.lastLoadTime = Date.now();

      console.log('[SaveManager] Atomic load completed successfully', {
        version: migrated.version,
        timestamp: new Date(migrated.timestamp).toLocaleString(),
        metadata: migrated.metadata
      });

      return true;
    } catch (error) {
      console.error('[SaveManager] Atomic load failed:', error);
      
      // Try backup if main save failed
      try {
        console.log('[SaveManager] Attempting to load from backup...');
        const backup = localStorage.getItem(this.backupKey);
        if (backup) {
          localStorage.setItem(this.saveKey, backup);
          return await this.loadGame(); // Recursive call with backup
        }
      } catch (backupError) {
        console.error('[SaveManager] Backup load also failed:', backupError);
      }
      
      return false;
    }
  }

  /**
   * Export save data as string for sharing/backup
   */
  async exportSave(): Promise<string | null> {
    try {
      await this.saveGame(); // Ensure latest state is saved
      const saveData = localStorage.getItem(this.saveKey);
      return saveData;
    } catch (error) {
      console.error('[SaveManager] Export failed:', error);
      return null;
    }
  }

  /**
   * Import save data from string
   */
  async importSave(saveString: string): Promise<boolean> {
    try {
      // Validate the save string first
      const decompressed = decompress(saveString);
      if (!decompressed) {
        throw new Error('Invalid save format - cannot decompress');
      }

      const saveData = JSON.parse(decompressed);
      if (!saveData.version || !saveData.data) {
        throw new Error('Invalid save format - missing required fields');
      }

      // Backup current save before importing
      const currentSave = localStorage.getItem(this.saveKey);
      if (currentSave) {
        localStorage.setItem(this.backupKey, currentSave);
      }

      // Import the new save
      localStorage.setItem(this.saveKey, saveString);
      return await this.loadGame();
    } catch (error) {
      console.error('[SaveManager] Import failed:', error);
      return false;
    }
  }

  /**
   * Clear all save data
   */
  clearSave(): void {
    console.log('[SaveManager] Clearing all save data...');
    
    // Clear unified saves
    localStorage.removeItem(this.saveKey);
    localStorage.removeItem(this.backupKey);
    
    // Clear legacy individual store keys for backwards compatibility
    localStorage.removeItem('mmv-core-game-store');
    localStorage.removeItem('mmv-narrative-store');
    localStorage.removeItem('mmv-social-store');
    
    // Clear any other legacy keys
    localStorage.removeItem('life-sim-store');
    localStorage.removeItem('storylet-store');
    localStorage.removeItem('character-concerns-store');
    
    console.log('[SaveManager] All save data cleared');
  }

  /**
   * Check if a unified save exists
   */
  hasSave(): boolean {
    return localStorage.getItem(this.saveKey) !== null;
  }

  /**
   * Get save metadata without loading the full save
   */
  getSaveMetadata(): SaveGame['metadata'] | null {
    try {
      const compressed = localStorage.getItem(this.saveKey);
      if (!compressed) return null;

      const decompressed = decompress(compressed);
      if (!decompressed) return null;

      const saveData: SaveGame = JSON.parse(decompressed);
      return saveData.metadata;
    } catch (error) {
      console.error('[SaveManager] Failed to read save metadata:', error);
      return null;
    }
  }

  /**
   * Get save manager statistics
   */
  getStats(): SaveManagerStats {
    return { ...this.stats };
  }

  /**
   * Migrate save data from older versions
   */
  private migrate(save: SaveGame): SaveGame {
    if (save.version < this.currentVersion) {
      console.log(`[SaveManager] Migrating save from v${save.version} to v${this.currentVersion}`);
      
      // Future migration logic goes here
      // For now, just update the version
      save.version = this.currentVersion;
    }
    return save;
  }

  /**
   * Calculate checksum for save integrity
   */
  private calculateChecksum(data: any): string {
    // Simple checksum based on content length and structure
    // In production, consider using a proper hash function
    const serialized = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      const char = serialized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Serialize store state, handling special cases like Maps
   */
  private serializeStoreState(state: any): any {
    // Handle special serialization cases
    const serialized = { ...state };
    
    // Handle Maps in narrative store flags
    if (state.flags) {
      serialized.flags = {};
      for (const [key, value] of Object.entries(state.flags)) {
        if (value instanceof Map) {
          serialized.flags[key] = Array.from((value as Map<any, any>).entries());
        } else {
          serialized.flags[key] = value;
        }
      }
    }
    
    return serialized;
  }

  /**
   * Deserialize store state, handling special cases like Maps
   */
  private deserializeStoreState(state: any): any {
    // Handle special deserialization cases
    const deserialized = { ...state };
    
    // Restore Maps in narrative store flags
    if (state.flags) {
      deserialized.flags = {};
      for (const [key, value] of Object.entries(state.flags)) {
        if (Array.isArray(value)) {
          deserialized.flags[key] = new Map(value as [any, any][]);
        } else {
          deserialized.flags[key] = value;
        }
      }
    }
    
    return deserialized;
  }
}

// Singleton instance
export const saveManager = SaveManager.getInstance();

// Export types for external use
export type { SaveGame, SaveManagerStats };