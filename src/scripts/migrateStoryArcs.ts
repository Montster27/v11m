// /Users/montysharma/v11m2/src/scripts/migrateStoryArcs.ts
// Migration utilities for Story Arc V2 architecture
// Migrates data from legacy stores to unified V2 stores

import { storyArcManager } from '../utils/storyArcManager';

export interface LegacyStoryArc {
  id: string;
  name: string;
  description: string;
  category?: string;
  totalClues?: number;
  discoveredClues?: number;
  isCompleted?: boolean;
  completedAt?: Date;
  progress?: number;
}

export interface LegacyClue {
  id: string;
  title: string;
  description: string;
  content: string;
  storyArc?: string;
  arcOrder?: number;
  isDiscovered?: boolean;
  minigameTypes: string[];
  associatedStorylets: string[];
  positiveOutcomeStorylet?: string;
  negativeOutcomeStorylet?: string;
}

export interface MigrationResult {
  success: boolean;
  migratedArcs: number;
  migratedClues: number;
  migratedStorylets: number;
  errors: string[];
  warnings: string[];
  backupCreated: boolean;
  backupPath?: string;
}

export interface ValidationResult {
  success: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  errors: string[];
  warnings: string[];
}

/**
 * Main migration function - migrates all story arc data to V2 architecture
 */
export async function migrateExistingArcs(): Promise<MigrationResult> {
  console.log('🔄 Starting story arc migration to V2 architecture...');
  
  const result: MigrationResult = {
    success: false,
    migratedArcs: 0,
    migratedClues: 0,
    migratedStorylets: 0,
    errors: [],
    warnings: [],
    backupCreated: false
  };

  try {
    // Step 1: Create backup of existing data
    console.log('📦 Creating backup of existing data...');
    const backup = await createBackup();
    result.backupCreated = backup.success;
    result.backupPath = backup.path;
    
    if (!backup.success) {
      result.errors.push('Failed to create backup');
      return result;
    }

    // Step 2: Extract and validate legacy data
    console.log('📊 Extracting legacy data...');
    const legacyData = extractLegacyData();
    
    if (!legacyData.storyArcs.length && !legacyData.clues.length) {
      result.warnings.push('No legacy data found to migrate');
      result.success = true;
      return result;
    }

    // Step 3: Transform data format
    console.log('🔄 Transforming data format...');
    const transformedData = transformDataFormat(legacyData);
    
    // Step 4: Load into V2 stores via StoryArcManager
    console.log('💾 Loading data into V2 stores...');
    const loadResult = await loadIntoV2Stores(transformedData);
    result.migratedArcs = loadResult.arcs;
    result.migratedClues = loadResult.clues;
    result.migratedStorylets = loadResult.storylets;
    
    // Step 5: Validate migration
    console.log('✅ Validating migration...');
    const validationResult = validateMigration(backup.data, transformedData);
    
    if (validationResult.success) {
      console.log('✅ Story arc migration completed successfully');
      result.success = true;
      
      // Step 6: Clear legacy stores (optional, for cleanup)
      if (confirm('Migration successful! Clear legacy stores?')) {
        clearLegacyStores();
        console.log('🧹 Legacy stores cleared');
      }
    } else {
      console.error('❌ Migration validation failed:', validationResult.errors);
      result.errors.push(...validationResult.errors);
      
      // Offer rollback
      if (confirm('Migration validation failed. Rollback to backup?')) {
        await rollbackMigration(backup.data);
        result.errors.push('Migration rolled back due to validation failure');
      }
    }

  } catch (error) {
    console.error('❌ Migration failed with exception:', error);
    result.errors.push(`Migration exception: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * Create backup of current data
 */
async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      timestamp,
      stores: {
        storyArcStore: (window as any).useStoryArcStore?.getState(),
        clueStore: (window as any).useClueStore?.getState(),
        storyletStore: (window as any).useStoryletStore?.getState(),
        storyletCatalogStore: (window as any).useStoryletCatalogStore?.getState()
      }
    };

    // Store in localStorage as backup
    const backupKey = `story_arc_backup_${timestamp}`;
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    
    console.log(`📦 Backup created: ${backupKey}`);
    
    return {
      success: true,
      path: backupKey,
      data: backupData
    };
  } catch (error) {
    console.error('❌ Failed to create backup:', error);
    return {
      success: false,
      path: undefined,
      data: null
    };
  }
}

/**
 * Extract data from legacy stores
 */
function extractLegacyData() {
  const storyArcStore = (window as any).useStoryArcStore?.getState();
  const clueStore = (window as any).useClueStore?.getState();
  const storyletStore = (window as any).useStoryletStore?.getState();
  const storyletCatalogStore = (window as any).useStoryletCatalogStore?.getState();

  return {
    storyArcs: (storyArcStore?.storyArcs || []) as LegacyStoryArc[],
    clues: (clueStore?.clues || []) as LegacyClue[],
    storylets: [
      ...(storyletStore?.storylets || []),
      ...(storyletCatalogStore?.allStorylets || [])
    ],
    discoveredClues: clueStore?.discoveredClues || [],
    completedStorylets: storyletStore?.completedStorylets || []
  };
}

/**
 * Transform legacy data to V2 format
 */
function transformDataFormat(legacyData: any) {
  console.log('🔄 Transforming arc data...');
  
  // Transform story arcs
  const transformedArcs = legacyData.storyArcs.map((legacyArc: LegacyStoryArc) => ({
    name: legacyArc.name,
    description: legacyArc.description,
    progress: legacyArc.progress || 0,
    isCompleted: legacyArc.isCompleted || false,
    failures: 0 // Reset failures for fresh start
  }));

  // Transform clues with arc relationships
  const transformedClues = legacyData.clues.map((legacyClue: LegacyClue) => ({
    clue: legacyClue,
    arcRelationship: legacyClue.storyArc ? {
      storyArc: legacyClue.storyArc,
      arcOrder: legacyClue.arcOrder || 0,
      prerequisites: [], // Could be enhanced based on analysis
      unlocks: [], // Could be enhanced based on analysis
      arcProgress: ((legacyClue.arcOrder || 0) / 10) * 100
    } : null
  }));

  // Transform storylets (minimal transformation needed)
  const transformedStorylets = legacyData.storylets.filter((storylet: any) => 
    storylet.storyArc // Only storylets with arc assignments
  );

  return {
    arcs: transformedArcs,
    clues: transformedClues,
    storylets: transformedStorylets,
    discoveredClues: legacyData.discoveredClues,
    completedStorylets: legacyData.completedStorylets
  };
}

/**
 * Load transformed data into V2 stores
 */
async function loadIntoV2Stores(transformedData: any) {
  let arcsCreated = 0;
  let cluesProcessed = 0;
  let storyletsProcessed = 0;

  try {
    // Create arcs first to get their IDs
    const arcIdMapping: Record<string, string> = {};
    
    for (const arcData of transformedData.arcs) {
      try {
        const arcId = storyArcManager.createArc(arcData);
        // Map old arc name to new arc ID for clue relationships
        arcIdMapping[arcData.name] = arcId;
        arcsCreated++;
      } catch (error) {
        console.warn(`⚠️ Failed to create arc: ${arcData.name}`, error);
      }
    }

    // Process clues with arc relationships
    for (const clueData of transformedData.clues) {
      try {
        if (clueData.arcRelationship && clueData.arcRelationship.storyArc) {
          const newArcId = arcIdMapping[clueData.arcRelationship.storyArc];
          if (newArcId) {
            // Update the arc relationship to use new arc ID
            clueData.arcRelationship.storyArc = newArcId;
            
            // Set the clue-arc relationship
            const socialStore = (window as any).useSocialStore;
            if (socialStore) {
              socialStore.getState().setClueArcRelationship(
                clueData.clue.id,
                clueData.arcRelationship
              );
            }
          }
        }
        
        cluesProcessed++;
      } catch (error) {
        console.warn(`⚠️ Failed to process clue: ${clueData.clue.id}`, error);
      }
    }

    // Process storylets with arc assignments
    for (const storylet of transformedData.storylets) {
      try {
        if (storylet.storyArc && arcIdMapping[storylet.storyArc]) {
          const newArcId = arcIdMapping[storylet.storyArc];
          storyArcManager.assignStoryletToArc(storylet.id, newArcId);
        }
        storyletsProcessed++;
      } catch (error) {
        console.warn(`⚠️ Failed to process storylet: ${storylet.id}`, error);
      }
    }

    console.log(`✅ Loaded data: ${arcsCreated} arcs, ${cluesProcessed} clues, ${storyletsProcessed} storylets`);
    
    return {
      arcs: arcsCreated,
      clues: cluesProcessed,
      storylets: storyletsProcessed
    };

  } catch (error) {
    console.error('❌ Failed to load data into V2 stores:', error);
    throw error;
  }
}

/**
 * Validate migration success
 */
function validateMigration(backupData: any, transformedData: any): ValidationResult {
  const result: ValidationResult = {
    success: false,
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    errors: [],
    warnings: []
  };

  try {
    // Check 1: Arc count matches
    result.totalChecks++;
    const originalArcCount = backupData.stores.storyArcStore?.storyArcs?.length || 0;
    const migratedArcCount = storyArcManager.getAllArcs().length;
    
    if (originalArcCount === migratedArcCount) {
      result.passedChecks++;
    } else {
      result.failedChecks++;
      result.errors.push(`Arc count mismatch: ${originalArcCount} original vs ${migratedArcCount} migrated`);
    }

    // Check 2: No data loss in critical fields
    result.totalChecks++;
    let dataIntegrityPass = true;
    
    const originalArcs = backupData.stores.storyArcStore?.storyArcs || [];
    const migratedArcs = storyArcManager.getAllArcs();
    
    for (const originalArc of originalArcs) {
      const migratedArc = migratedArcs.find(arc => arc.name === originalArc.name);
      if (!migratedArc) {
        result.errors.push(`Missing arc after migration: ${originalArc.name}`);
        dataIntegrityPass = false;
      } else if (migratedArc.description !== originalArc.description) {
        result.warnings.push(`Description changed for arc: ${originalArc.name}`);
      }
    }
    
    if (dataIntegrityPass) {
      result.passedChecks++;
    } else {
      result.failedChecks++;
    }

    // Check 3: V2 stores are functional
    result.totalChecks++;
    try {
      const testArcId = storyArcManager.createArc({
        name: 'Migration Test Arc',
        description: 'Test arc for migration validation'
      });
      
      const retrievedArc = storyArcManager.getArc(testArcId);
      if (retrievedArc && retrievedArc.name === 'Migration Test Arc') {
        result.passedChecks++;
        
        // Clean up test arc
        storyArcManager.deleteArc(testArcId);
      } else {
        result.failedChecks++;
        result.errors.push('V2 store functionality test failed');
      }
    } catch (error) {
      result.failedChecks++;
      result.errors.push(`V2 store test failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    result.success = result.failedChecks === 0;
    
    console.log(`📊 Migration validation: ${result.passedChecks}/${result.totalChecks} checks passed`);
    
  } catch (error) {
    result.errors.push(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error('❌ Migration validation failed:', error);
  }

  return result;
}

/**
 * Rollback migration by restoring from backup
 */
async function rollbackMigration(backupData: any): Promise<void> {
  console.log('🔄 Rolling back migration...');
  
  try {
    // Restore legacy stores if they exist
    if (backupData.stores.storyArcStore && (window as any).useStoryArcStore) {
      (window as any).useStoryArcStore.setState(backupData.stores.storyArcStore);
    }
    
    if (backupData.stores.clueStore && (window as any).useClueStore) {
      (window as any).useClueStore.setState(backupData.stores.clueStore);
    }
    
    // Clear V2 stores
    const narrativeStore = (window as any).useNarrativeStore;
    const socialStore = (window as any).useSocialStore;
    
    if (narrativeStore) {
      narrativeStore.getState().resetNarrative();
    }
    
    if (socialStore) {
      socialStore.getState().resetSocial();
    }
    
    console.log('✅ Migration rollback completed');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

/**
 * Clear legacy stores after successful migration
 */
function clearLegacyStores(): void {
  console.log('🧹 Clearing legacy stores...');
  
  try {
    // Reset legacy stores to initial state
    (window as any).useStoryArcStore?.getState().reset?.();
    (window as any).useClueStore?.getState().reset?.();
    
    console.log('✅ Legacy stores cleared');
  } catch (error) {
    console.warn('⚠️ Some legacy stores could not be cleared:', error);
  }
}

/**
 * Get migration status and recommendations
 */
export function getMigrationStatus() {
  const legacyData = extractLegacyData();
  const v2Arcs = (window as any).useNarrativeStore?.getState().storyArcs || {};
  
  const hasLegacyData = legacyData.storyArcs.length > 0 || legacyData.clues.length > 0;
  const hasV2Data = Object.keys(v2Arcs).length > 0;
  
  return {
    needsMigration: hasLegacyData && !hasV2Data,
    hasLegacyData,
    hasV2Data,
    legacyArcCount: legacyData.storyArcs.length,
    legacyClueCount: legacyData.clues.length,
    v2ArcCount: Object.keys(v2Arcs).length,
    recommendation: hasLegacyData && !hasV2Data 
      ? 'Migration recommended to unlock V2 features'
      : hasV2Data
      ? 'Already using V2 architecture'
      : 'No story arc data found'
  };
}

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).migrateStoryArcs = migrateExistingArcs;
  (window as any).getMigrationStatus = getMigrationStatus;
}