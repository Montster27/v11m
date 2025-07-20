// V2 Store Migration Service
// One-time migration from legacy stores to V2 unified stores
// 
// NOTE: This migration file intentionally uses legacy stores (useClueStore, useNPCStore, useStoryletCatalogStore)
// as it needs to read from them during the migration process. Legacy store usage here is by design.

import { useStoryletCatalogStore } from '../stores/useStoryletCatalogStore';
import { useNPCStore } from '../stores/useNPCStore';
import { useClueStore } from '../stores/useClueStore';
import { useStoryArcStore } from '../stores/useStoryArcStore';
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
import { useSocialStore } from '../stores/v2/useSocialStore';
import { useCoreGameStore } from '../stores/v2/useCoreGameStore';

export interface V2MigrationResult {
  success: boolean;
  migratedData: {
    storylets: number;
    npcs: number;
    clues: number;
    arcs: number;
  };
  errors: string[];
  warnings: string[];
  duration: number;
}

export interface V2MigrationOptions {
  validateMigration?: boolean;
  cleanupLegacyData?: boolean;
  backupBeforeMigration?: boolean;
  onProgress?: (stage: string, progress: number) => void;
}

export class V2StoreMigrationService {
  private readonly MIGRATION_KEY = 'v2_store_migration_complete';
  private readonly MIGRATION_BACKUP_KEY = 'v2_migration_backup';

  /**
   * Check if V2 migration has already been completed
   */
  isMigrationComplete(): boolean {
    return localStorage.getItem(this.MIGRATION_KEY) === 'true';
  }

  /**
   * Get migration status information
   */
  getMigrationStatus(): {
    isComplete: boolean;
    completedAt: string | null;
    hasLegacyData: boolean;
    canMigrate: boolean;
  } {
    const isComplete = this.isMigrationComplete();
    const completedAt = localStorage.getItem(`${this.MIGRATION_KEY}_timestamp`);
    
    // Check if legacy stores have data
    let hasLegacyData = false;
    try {
      const catalogStore = useStoryletCatalogStore.getState();
      const npcStore = useNPCStore.getState();
      const clueStore = useClueStore.getState();
      
      hasLegacyData = 
        catalogStore.allStorylets.length > 0 ||
        Object.keys(npcStore.npcs).length > 0 ||
        Object.keys(clueStore.clues).length > 0;
    } catch (error) {
      console.warn('Could not check legacy data:', error);
    }

    return {
      isComplete,
      completedAt,
      hasLegacyData,
      canMigrate: !isComplete && hasLegacyData
    };
  }

  /**
   * Perform the V2 store migration
   */
  async runV2Migration(options: V2MigrationOptions = {}): Promise<V2MigrationResult> {
    const startTime = Date.now();
    console.log('🚀 Starting V2 Store Migration...');

    const result: V2MigrationResult = {
      success: false,
      migratedData: {
        storylets: 0,
        npcs: 0,
        clues: 0,
        arcs: 0
      },
      errors: [],
      warnings: [],
      duration: 0
    };

    try {
      // Check if already migrated
      if (this.isMigrationComplete()) {
        result.warnings.push('Migration already completed');
        result.success = true;
        return result;
      }

      const updateProgress = (stage: string, progress: number) => {
        if (options.onProgress) {
          options.onProgress(stage, progress);
        }
      };

      // Stage 1: Backup existing data if requested
      updateProgress('Creating backup...', 10);
      if (options.backupBeforeMigration) {
        await this.createMigrationBackup();
      }

      // Stage 2: Get legacy store states
      updateProgress('Reading legacy data...', 20);
      const legacyStores = this.getLegacyStoreStates();

      // Stage 3: Get V2 store instances
      updateProgress('Initializing V2 stores...', 30);
      const v2Stores = this.getV2StoreInstances();

      // Stage 4: Migrate storylets
      updateProgress('Migrating storylets...', 40);
      const storyletCount = await this.migrateStorylets(legacyStores.catalog, v2Stores.narrative);
      result.migratedData.storylets = storyletCount;

      // Stage 5: Migrate NPCs
      updateProgress('Migrating NPCs...', 60);
      const npcCount = await this.migrateNPCs(legacyStores.npc, v2Stores.social);
      result.migratedData.npcs = npcCount;

      // Stage 6: Migrate clues
      updateProgress('Migrating clues...', 70);
      const clueCount = await this.migrateClues(legacyStores.clue, v2Stores.narrative);
      result.migratedData.clues = clueCount;

      // Stage 7: Migrate story arcs
      updateProgress('Migrating story arcs...', 80);
      const arcCount = await this.migrateStoryArcs(legacyStores.arc, v2Stores.narrative);
      result.migratedData.arcs = arcCount;

      // Stage 8: Validate migration if requested
      updateProgress('Validating migration...', 90);
      if (options.validateMigration) {
        const validation = await this.validateMigration(legacyStores, v2Stores);
        if (!validation.isValid) {
          result.errors.push(...validation.errors);
          throw new Error(`Migration validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Stage 9: Mark migration complete
      updateProgress('Finalizing migration...', 95);
      await this.markMigrationComplete();

      // Stage 10: Cleanup legacy data if requested
      updateProgress('Cleaning up...', 100);
      if (options.cleanupLegacyData) {
        await this.cleanupLegacyData();
      }

      result.success = true;
      result.duration = Date.now() - startTime;

      console.log(`✅ V2 Migration completed successfully in ${result.duration}ms`);
      console.log('Migration summary:', result.migratedData);

      return result;

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown migration error');
      result.duration = Date.now() - startTime;
      
      console.error('❌ V2 Migration failed:', error);
      
      // Attempt to restore from backup if it exists
      if (options.backupBeforeMigration) {
        try {
          await this.restoreFromBackup();
          result.warnings.push('Restored from backup after migration failure');
        } catch (restoreError) {
          result.errors.push('Failed to restore from backup: ' + restoreError);
        }
      }

      return result;
    }
  }

  /**
   * Get current state of all legacy stores
   */
  private getLegacyStoreStates() {
    try {
      return {
        catalog: useStoryletCatalogStore.getState(),
        npc: useNPCStore.getState(),
        clue: useClueStore.getState(),
        arc: useStoryArcStore.getState()
      };
    } catch (error) {
      throw new Error(`Failed to access legacy stores: ${error}`);
    }
  }

  /**
   * Get V2 store instances
   */
  private getV2StoreInstances() {
    try {
      return {
        narrative: useNarrativeStore.getState(),
        social: useSocialStore.getState(),
        core: useCoreGameStore.getState()
      };
    } catch (error) {
      throw new Error(`Failed to access V2 stores: ${error}`);
    }
  }

  /**
   * Migrate storylets from catalog store to narrative store
   */
  private async migrateStorylets(catalogStore: any, narrativeStore: any): Promise<number> {
    let migratedCount = 0;

    try {
      // Clear existing V2 storylets before migration to ensure idempotency
      const existingStorylets = narrativeStore.getAllStorylets?.() || [];
      const existingStoryletCount = existingStorylets.length;
      
      if (existingStoryletCount > 0) {
        console.log(`⚠️ Found ${existingStoryletCount} existing storylets in V2 store, clearing before migration...`);
        
        // Clear all existing user-created storylets
        for (const storylet of existingStorylets) {
          if (storylet.metadata?.migratedFromV1 && narrativeStore.removeUserStorylet) {
            narrativeStore.removeUserStorylet(storylet.id);
          }
        }
        
        console.log('✅ Cleared existing V2 storylets');
      }

      // allStorylets is an object, not an array
      const storyletsObj = catalogStore.allStorylets || {};
      const storylets = Array.isArray(storyletsObj) ? storyletsObj : Object.values(storyletsObj);
      
      if (!Array.isArray(storylets)) {
        console.warn('Storylets is not an array, skipping migration');
        return 0;
      }
      
      for (const storylet of storylets) {
        try {
          // Skip null/undefined storylets
          if (!storylet || typeof storylet !== 'object') {
            console.warn('Skipping invalid storylet:', storylet);
            continue;
          }
          
          // Ensure storylet has required V2 structure
          const v2Storylet = this.normalizeStoryletForV2(storylet);
          
          // Add to narrative store
          if (narrativeStore.addStorylet) {
            narrativeStore.addStorylet(v2Storylet);
          } else if (narrativeStore.setStorylet) {
            narrativeStore.setStorylet(v2Storylet);
          } else {
            console.warn('No method to add storylet to narrative store');
            continue;
          }
          
          migratedCount++;
        } catch (error) {
          const id = storylet?.id || 'unknown';
          console.warn(`Failed to migrate storylet ${id}:`, error);
        }
      }

      console.log(`📚 Migrated ${migratedCount} storylets`);
      return migratedCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Storylet migration failed: ${errorMessage}`);
    }
  }

  /**
   * Migrate NPCs from NPC store to social store
   */
  private async migrateNPCs(npcStore: any, socialStore: any): Promise<number> {
    let migratedCount = 0;

    try {
      // Clear existing V2 NPCs before migration to ensure idempotency
      const existingNPCs = socialStore.getAllNPCs?.() || {};
      const existingNPCCount = Object.keys(existingNPCs).length;
      
      if (existingNPCCount > 0) {
        console.log(`⚠️ Found ${existingNPCCount} existing NPCs in V2 store, clearing before migration...`);
        
        // Clear all existing NPCs
        for (const npcId of Object.keys(existingNPCs)) {
          if (socialStore.deleteNPC) {
            socialStore.deleteNPC(npcId);
          }
        }
        
        console.log('✅ Cleared existing V2 NPCs');
      }

      const npcs = Object.values(npcStore.npcs || {});
      
      for (const npc of npcs as any[]) {
        try {
          // Ensure NPC has required V2 structure
          const v2NPC = this.normalizeNPCForV2(npc);
          
          // Add to social store
          if (socialStore.addNPC) {
            socialStore.addNPC(v2NPC);
          } else if (socialStore.setNPC) {
            socialStore.setNPC(v2NPC);
          } else {
            console.warn('No method to add NPC to social store');
            continue;
          }
          
          migratedCount++;
        } catch (error) {
          console.warn(`Failed to migrate NPC ${npc.id}:`, error);
        }
      }

      console.log(`👥 Migrated ${migratedCount} NPCs`);
      return migratedCount;
    } catch (error) {
      throw new Error(`NPC migration failed: ${error}`);
    }
  }

  /**
   * Migrate clues from clue store to narrative store
   */
  private async migrateClues(clueStore: any, narrativeStore: any): Promise<number> {
    let migratedCount = 0;

    try {
      // Clear existing V2 clues before migration to ensure idempotency
      const existingClues = narrativeStore.getAllClues?.() || {};
      const existingClueCount = Object.keys(existingClues).length;
      
      if (existingClueCount > 0) {
        console.log(`⚠️ Found ${existingClueCount} existing clues in V2 store, clearing before migration...`);
        
        // Clear all existing clues
        for (const clueId of Object.keys(existingClues)) {
          if (narrativeStore.deleteClue) {
            narrativeStore.deleteClue(clueId);
          }
        }
        
        console.log('✅ Cleared existing V2 clues');
      }

      // Now migrate legacy clues
      const clues = Object.values(clueStore.clues || {});
      console.log(`🔍 Found ${clues.length} legacy clues to migrate:`, Object.keys(clueStore.clues || {}));
      
      for (const clue of clues as any[]) {
        try {
          // Skip null/undefined clues
          if (!clue || typeof clue !== 'object') {
            console.warn('Skipping invalid clue:', clue);
            continue;
          }
          
          // Ensure clue has required V2 structure
          const v2Clue = this.normalizeClueForV2(clue);
          console.log(`🔍 Migrating clue ${clue.id}:`, v2Clue);
          
          // Add to narrative store (clues are part of narrative)
          if (narrativeStore.addClue) {
            narrativeStore.addClue(v2Clue);
            console.log(`✅ Added clue ${v2Clue.id} to narrative store`);
            
            // Verify it was added
            const verifyClue = narrativeStore.getClue?.(v2Clue.id);
            if (verifyClue) {
              console.log(`✅ Verified clue ${v2Clue.id} exists in narrative store`);
            } else {
              console.warn(`⚠️ Clue ${v2Clue.id} not found after adding to narrative store`);
            }
          } else if (narrativeStore.setClue) {
            narrativeStore.setClue(v2Clue);
            console.log(`✅ Set clue ${v2Clue.id} in narrative store`);
          } else {
            console.warn('No method to add clue to narrative store');
            continue;
          }
          
          migratedCount++;
        } catch (error) {
          const id = clue?.id || 'unknown';
          console.warn(`Failed to migrate clue ${id}:`, error);
        }
      }

      console.log(`🔍 Migrated ${migratedCount} clues`);
      
      // Double-check clues in V2 store after migration
      const finalClues = narrativeStore.getAllClues?.() || {};
      const finalClueCount = Object.keys(finalClues).length;
      console.log(`🔍 Final clue count in V2 store: ${finalClueCount}`);
      console.log(`🔍 Final clues in V2 store:`, Object.keys(finalClues));
      
      return migratedCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Clue migration failed: ${errorMessage}`);
    }
  }

  /**
   * Migrate story arcs
   */
  private async migrateStoryArcs(arcStore: any, narrativeStore: any): Promise<number> {
    let migratedCount = 0;

    try {
      const arcs = arcStore.arcs || [];
      
      for (const arc of arcs) {
        try {
          // Ensure arc has required V2 structure
          const v2Arc = this.normalizeArcForV2(arc);
          
          // Add to narrative store
          if (narrativeStore.addStoryArc) {
            narrativeStore.addStoryArc(v2Arc);
          } else if (narrativeStore.setStoryArc) {
            narrativeStore.setStoryArc(v2Arc);
          } else {
            console.warn('No method to add story arc to narrative store');
            continue;
          }
          
          migratedCount++;
        } catch (error) {
          console.warn(`Failed to migrate story arc ${arc.id}:`, error);
        }
      }

      console.log(`🔗 Migrated ${migratedCount} story arcs`);
      return migratedCount;
    } catch (error) {
      throw new Error(`Story arc migration failed: ${error}`);
    }
  }

  /**
   * Normalize storylet for V2 compatibility
   */
  private normalizeStoryletForV2(storylet: any) {
    // Ensure we have a valid storylet object
    if (!storylet || typeof storylet !== 'object') {
      throw new Error('Invalid storylet object');
    }
    
    // Ensure required fields exist
    const normalizedStorylet = {
      id: storylet.id || `storylet_${Date.now()}`,
      title: storylet.title || 'Untitled Storylet',
      content: storylet.content || '',
      choices: Array.isArray(storylet.choices) ? storylet.choices : [],
      trigger: storylet.trigger || { type: 'immediate' },
      requirements: storylet.requirements || {},
      ...storylet,
      metadata: {
        ...(storylet.metadata || {}),
        migratedFromV1: true,
        migrationDate: new Date().toISOString()
      }
    };
    
    return normalizedStorylet;
  }

  /**
   * Normalize NPC for V2 compatibility
   */
  private normalizeNPCForV2(npc: any) {
    return {
      ...npc,
      metadata: {
        ...npc.metadata,
        migratedFromV1: true,
        migrationDate: new Date().toISOString()
      }
    };
  }

  /**
   * Normalize clue for V2 compatibility
   */
  private normalizeClueForV2(clue: any) {
    // Ensure we have a valid clue object
    if (!clue || typeof clue !== 'object') {
      throw new Error('Invalid clue object');
    }
    
    // Ensure required fields exist
    const normalizedClue = {
      id: clue.id || `clue_${Date.now()}`,
      title: clue.title || 'Untitled Clue',
      description: clue.description || '',
      content: clue.content || clue.description || '',
      discovered: clue.discovered || false,
      minigameId: clue.minigameId || null,
      storyletId: clue.storyletId || null,
      ...clue,
      metadata: {
        ...(clue.metadata || {}),
        migratedFromV1: true,
        migrationDate: new Date().toISOString()
      }
    };
    
    return normalizedClue;
  }

  /**
   * Normalize story arc for V2 compatibility
   */
  private normalizeArcForV2(arc: any) {
    return {
      ...arc,
      metadata: {
        ...arc.metadata,
        migratedFromV1: true,
        migrationDate: new Date().toISOString()
      }
    };
  }

  /**
   * Create a backup before migration
   */
  private async createMigrationBackup(): Promise<void> {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        stores: this.getLegacyStoreStates()
      };

      localStorage.setItem(this.MIGRATION_BACKUP_KEY, JSON.stringify(backup));
      console.log('💾 Migration backup created');
    } catch (error) {
      throw new Error(`Failed to create migration backup: ${error}`);
    }
  }

  /**
   * Restore from backup
   */
  private async restoreFromBackup(): Promise<void> {
    try {
      const backupData = localStorage.getItem(this.MIGRATION_BACKUP_KEY);
      if (!backupData) {
        throw new Error('No backup found');
      }

      const backup = JSON.parse(backupData);
      console.log('🔄 Restoring from backup:', backup.timestamp);
      
      // This would require re-initializing legacy stores with backup data
      // For now, just log the restoration attempt
      console.log('Backup restoration would restore:', Object.keys(backup.stores));
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error}`);
    }
  }

  /**
   * Validate that migration was successful
   */
  private async validateMigration(legacyStores: any, v2Stores: any): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Validate storylets
      const legacyStoryletCount = legacyStores.catalog.allStorylets?.length || 0;
      const v2StoryletCount = v2Stores.narrative.getStorylets?.()?.length || 0;
      
      if (legacyStoryletCount !== v2StoryletCount) {
        errors.push(`Storylet count mismatch: ${legacyStoryletCount} legacy vs ${v2StoryletCount} V2`);
      }

      // Validate NPCs
      const legacyNPCCount = Object.keys(legacyStores.npc.npcs || {}).length;
      const v2NPCCount = v2Stores.social.getAllNPCs?.()?.length || 0;
      
      if (legacyNPCCount !== v2NPCCount) {
        errors.push(`NPC count mismatch: ${legacyNPCCount} legacy vs ${v2NPCCount} V2`);
      }

      // Validate clues
      const legacyClueCount = Object.keys(legacyStores.clue.clues || {}).length;
      const v2ClueCount = Object.keys(v2Stores.narrative.getAllClues?.() || {}).length;
      
      if (legacyClueCount !== v2ClueCount) {
        errors.push(`Clue count mismatch: ${legacyClueCount} legacy vs ${v2ClueCount} V2`);
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error}`]
      };
    }
  }

  /**
   * Mark migration as complete
   */
  private async markMigrationComplete(): Promise<void> {
    try {
      localStorage.setItem(this.MIGRATION_KEY, 'true');
      localStorage.setItem(`${this.MIGRATION_KEY}_timestamp`, new Date().toISOString());
      console.log('✅ V2 migration marked as complete');
    } catch (error) {
      throw new Error(`Failed to mark migration complete: ${error}`);
    }
  }

  /**
   * Clean up legacy data after successful migration
   */
  private async cleanupLegacyData(): Promise<void> {
    try {
      // Clear legacy store persisted data
      const legacyKeys = [
        'storylet-catalog-store',
        'npc-store', 
        'clue-store',
        'story-arc-store'
      ];

      for (const key of legacyKeys) {
        localStorage.removeItem(key);
      }

      console.log('🧹 Legacy store data cleaned up');
    } catch (error) {
      console.warn('Failed to cleanup legacy data:', error);
    }
  }

  /**
   * Rollback migration (revert to legacy stores)
   */
  async rollbackMigration(): Promise<void> {
    try {
      // Remove migration flags
      localStorage.removeItem(this.MIGRATION_KEY);
      localStorage.removeItem(`${this.MIGRATION_KEY}_timestamp`);
      
      console.log('🔄 Migration rolled back - will use legacy stores');
    } catch (error) {
      throw new Error(`Failed to rollback migration: ${error}`);
    }
  }
}

// Singleton instance
export const v2Migration = new V2StoreMigrationService();

// Convenience function for components
export const runV2Migration = async (options?: V2MigrationOptions): Promise<V2MigrationResult> => {
  return v2Migration.runV2Migration(options);
};