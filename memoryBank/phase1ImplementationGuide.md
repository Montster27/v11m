# /Users/montysharma/V11M2/memoryBank/phase1ImplementationGuide.md

# Phase 1 Implementation Guide: Store Consolidation
## Week-by-Week Implementation Plan with Code Examples

## **Week 1: Migration Infrastructure & Flag System Unification**

### **Day 1-2: Create Migration Utilities**

```typescript
// src/stores/migration/storeMigrationUtils.ts
export interface MigrationResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}

export class StoreMigrationManager {
  private backups: Map<string, any> = new Map();
  
  async migrateStore<T>(
    storeKey: string,
    oldData: any,
    migrationFn: (data: any) => T,
    validator: (data: T) => boolean
  ): Promise<MigrationResult<T>> {
    try {
      // Create backup
      this.createBackup(storeKey, oldData);
      
      // Apply migration
      const newData = migrationFn(oldData);
      
      // Validate result
      if (!validator(newData)) {
        throw new Error(`Migration validation failed for ${storeKey}`);
      }
      
      return {
        success: true,
        data: newData,
        errors: [],
        warnings: []
      };
    } catch (error) {
      return {
        success: false,
        errors: [error.message],
        warnings: []
      };
    }
  }
  
  private createBackup(key: string, data: any) {
    this.backups.set(`${key}_${Date.now()}`, JSON.parse(JSON.stringify(data)));
  }
  
  rollback(storeKey: string): any | null {
    const backupKeys = Array.from(this.backups.keys())
      .filter(key => key.startsWith(storeKey))
      .sort()
      .reverse();
    
    return backupKeys.length > 0 ? this.backups.get(backupKeys[0]) : null;
  }
}

// Global migration manager instance
export const migrationManager = new StoreMigrationManager();
```

```typescript
// src/stores/migration/legacyAdapters.ts
import { useAppStore } from '../useAppStore';
import { useStoryletStore } from '../useStoryletStore';
import { useCharacterConcernsStore } from '../useCharacterConcernsStore';
import { useCoreGameStore, useNarrativeStore } from '../v2';

// Adapter to bridge legacy stores to V2 stores during migration
export class LegacyStoreAdapter {
  // Convert legacy app store data to core game store format
  static adaptAppStoreData(legacyData: any) {
    return {
      player: {
        level: legacyData.userLevel || 1,
        experience: legacyData.experience || 0,
        resources: legacyData.resources || {
          energy: 75,
          stress: 20,
          money: 0,
          knowledge: 0,
          social: 0
        }
      },
      character: legacyData.currentCharacter || null,
      world: {
        day: legacyData.day || 1,
        isTimePaused: legacyData.isTimePaused || false
      }
    };
  }
  
  // Convert legacy storylet store data to narrative store format
  static adaptStoryletStoreData(legacyData: any) {
    return {
      storylets: {
        active: legacyData.activeStorylets || [],
        available: legacyData.availableStorylets || [],
        completed: legacyData.completedStorylets || [],
        catalog: legacyData.allStorylets || []
      },
      flags: {
        storylet: new Map(Object.entries(legacyData.storyletFlags || {})),
        concerns: new Map(), // Will be populated from concerns store
        custom: new Map(Object.entries(legacyData.customFlags || {}))
      },
      arcs: {
        active: [],
        completed: [],
        available: []
      }
    };
  }
  
  // Sync method to keep stores in sync during migration period
  static syncLegacyToV2() {
    const legacyApp = useAppStore.getState();
    const legacyStorylets = useStoryletStore.getState();
    const legacyConcerns = useCharacterConcernsStore.getState();
    
    // Update V2 stores with legacy data
    const coreStore = useCoreGameStore.getState();
    const narrativeStore = useNarrativeStore.getState();
    
    // Sync core game data
    coreStore.updatePlayer({
      level: legacyApp.userLevel,
      experience: legacyApp.experience,
      resources: legacyApp.resources
    });
    
    coreStore.updateWorld({
      day: legacyApp.day,
      isTimePaused: legacyApp.isTimePaused
    });
    
    // Sync narrative data  
    narrativeStore.updateStorylets({
      active: legacyStorylets.activeStorylets,
      available: legacyStorylets.availableStorylets,
      completed: legacyStorylets.completedStorylets
    });
    
    // Sync concern flags
    if (legacyConcerns.concerns) {
      const concernFlags = legacyConcerns.generateConcernFlags();
      Object.entries(concernFlags).forEach(([key, value]) => {
        narrativeStore.flags.concerns.set(key, value);
      });
    }
  }
}

// Auto-sync utility for migration period
export const startLegacySync = () => {
  const interval = setInterval(LegacyStoreAdapter.syncLegacyToV2, 1000);
  return () => clearInterval(interval);
};
```

### **Day 3-4: Unified Flag Management System**

```typescript
// src/stores/v2/flagSystem.ts
export class UnifiedFlagSystem {
  private flags: Map<string, Map<string, any>> = new Map();
  
  constructor() {
    // Initialize flag categories
    this.flags.set('storylet', new Map());
    this.flags.set('concerns', new Map());
    this.flags.set('custom', new Map());
    this.flags.set('system', new Map());
  }
  
  // Type-safe flag access
  get(category: 'storylet' | 'concerns' | 'custom' | 'system', key: string): any {
    return this.flags.get(category)?.get(key);
  }
  
  set(category: 'storylet' | 'concerns' | 'custom' | 'system', key: string, value: any): void {
    const categoryMap = this.flags.get(category);
    if (categoryMap) {
      categoryMap.set(key, value);
    }
  }
  
  has(category: 'storylet' | 'concerns' | 'custom' | 'system', key: string): boolean {
    return this.flags.get(category)?.has(key) || false;
  }
  
  delete(category: 'storylet' | 'concerns' | 'custom' | 'system', key: string): boolean {
    return this.flags.get(category)?.delete(key) || false;
  }
  
  // Batch operations for performance
  setMany(category: 'storylet' | 'concerns' | 'custom' | 'system', entries: [string, any][]): void {
    const categoryMap = this.flags.get(category);
    if (categoryMap) {
      entries.forEach(([key, value]) => categoryMap.set(key, value));
    }
  }
  
  // Get all flags for a category (useful for debugging)
  getAll(category: 'storylet' | 'concerns' | 'custom' | 'system'): Map<string, any> {
    return new Map(this.flags.get(category) || []);
  }
  
  // Serialization for persistence
  toJSON() {
    const result: Record<string, Record<string, any>> = {};
    this.flags.forEach((categoryMap, category) => {
      result[category] = Object.fromEntries(categoryMap.entries());
    });
    return result;
  }
  
  fromJSON(data: Record<string, Record<string, any>>) {
    Object.entries(data).forEach(([category, categoryData]) => {
      const categoryMap = this.flags.get(category as any);
      if (categoryMap) {
        categoryMap.clear();
        Object.entries(categoryData).forEach(([key, value]) => {
          categoryMap.set(key, value);
        });
      }
    });
  }
}
```

### **Day 5: Update Narrative Store with Unified Flags**

```typescript
// src/stores/v2/useNarrativeStore.ts (Updated)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UnifiedFlagSystem } from './flagSystem';
import type { Storylet, StoryArc } from '../../types/storylet';

interface NarrativeState {
  // Storylets
  storylets: {
    active: Storylet[];
    available: Storylet[];
    completed: Storylet[];
    catalog: Storylet[];
  };
  
  // Unified flag system
  flags: UnifiedFlagSystem;
  
  // Story arcs
  arcs: {
    active: StoryArc[];
    completed: StoryArc[];
    available: StoryArc[];
  };
  
  // Character concerns (migrated from separate store)
  concerns: {
    academics: number;
    socialFitting: number;
    financial: number;
    isolation: number;
    genderIssues: number;
    raceIssues: number;
    classIssues: number;
  } | null;
}

interface NarrativeActions {
  // Storylet management
  updateStorylets: (storylets: Partial<NarrativeState['storylets']>) => void;
  addActiveStorylet: (storylet: Storylet) => void;
  removeActiveStorylet: (storyletId: string) => void;
  completeStorylet: (storyletId: string) => void;
  
  // Flag management with unified system
  setFlag: (category: 'storylet' | 'concerns' | 'custom' | 'system', key: string, value: any) => void;
  getFlag: (category: 'storylet' | 'concerns' | 'custom' | 'system', key: string) => any;
  hasFlag: (category: 'storylet' | 'concerns' | 'custom' | 'system', key: string) => boolean;
  deleteFlag: (category: 'storylet' | 'concerns' | 'custom' | 'system', key: string) => void;
  
  // Character concerns
  setConcerns: (concerns: NarrativeState['concerns']) => void;
  updateConcern: (key: keyof NonNullable<NarrativeState['concerns']>, value: number) => void;
  generateConcernFlags: () => Record<string, boolean>;
  
  // Arc management
  updateArcs: (arcs: Partial<NarrativeState['arcs']>) => void;
  
  // Evaluation and processing
  evaluateStorylets: () => void;
  resetAllStorylets: () => void;
}

export const useNarrativeStore = create<NarrativeState & NarrativeActions>()(
  persist(
    (set, get) => ({
      // Initial state
      storylets: {
        active: [],
        available: [],
        completed: [],
        catalog: []
      },
      
      flags: new UnifiedFlagSystem(),
      
      arcs: {
        active: [],
        completed: [],
        available: []
      },
      
      concerns: null,
      
      // Storylet actions
      updateStorylets: (storylets) => set((state) => ({
        storylets: { ...state.storylets, ...storylets }
      })),
      
      addActiveStorylet: (storylet) => set((state) => ({
        storylets: {
          ...state.storylets,
          active: [...state.storylets.active, storylet]
        }
      })),
      
      removeActiveStorylet: (storyletId) => set((state) => ({
        storylets: {
          ...state.storylets,
          active: state.storylets.active.filter(s => s.id !== storyletId)
        }
      })),
      
      completeStorylet: (storyletId) => set((state) => {
        const storylet = state.storylets.active.find(s => s.id === storyletId);
        if (!storylet) return state;
        
        return {
          storylets: {
            ...state.storylets,
            active: state.storylets.active.filter(s => s.id !== storyletId),
            completed: [...state.storylets.completed, storylet]
          }
        };
      }),
      
      // Flag actions (delegated to UnifiedFlagSystem)
      setFlag: (category, key, value) => {
        const state = get();
        state.flags.set(category, key, value);
        set({ flags: state.flags });
      },
      
      getFlag: (category, key) => {
        return get().flags.get(category, key);
      },
      
      hasFlag: (category, key) => {
        return get().flags.has(category, key);
      },
      
      deleteFlag: (category, key) => {
        const state = get();
        state.flags.delete(category, key);
        set({ flags: state.flags });
      },
      
      // Character concerns
      setConcerns: (concerns) => {
        set({ concerns });
        // Auto-generate concern flags when concerns are set
        if (concerns) {
          const concernFlags = get().generateConcernFlags();
          Object.entries(concernFlags).forEach(([key, value]) => {
            get().setFlag('concerns', key, value);
          });
        }
      },
      
      updateConcern: (key, value) => set((state) => {
        if (!state.concerns) return state;
        const newConcerns = { ...state.concerns, [key]: value };
        
        // Auto-update concern flags
        const concernFlags = generateConcernFlagsFromConcerns(newConcerns);
        Object.entries(concernFlags).forEach(([flagKey, flagValue]) => {
          state.flags.set('concerns', flagKey, flagValue);
        });
        
        return { concerns: newConcerns };
      }),
      
      generateConcernFlags: () => {
        const state = get();
        if (!state.concerns) return {};
        return generateConcernFlagsFromConcerns(state.concerns);
      },
      
      // Arc actions
      updateArcs: (arcs) => set((state) => ({
        arcs: { ...state.arcs, ...arcs }
      })),
      
      // Evaluation actions
      evaluateStorylets: () => {
        // This will be implemented to replace the current storylet evaluation
        console.log('📖 Evaluating storylets with unified narrative store');
        // TODO: Implement storylet evaluation logic
      },
      
      resetAllStorylets: () => set({
        storylets: {
          active: [],
          available: [],
          completed: [],
          catalog: []
        }
      })
    }),
    {
      name: 'narrative-store',
      partialize: (state) => ({
        storylets: state.storylets,
        flags: state.flags.toJSON(), // Serialize flags properly
        arcs: state.arcs,
        concerns: state.concerns
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.flags) {
          // Restore UnifiedFlagSystem from JSON
          const flagSystem = new UnifiedFlagSystem();
          flagSystem.fromJSON(state.flags as any);
          state.flags = flagSystem;
        }
      }
    }
  )
);

// Helper function for concern flag generation
function generateConcernFlagsFromConcerns(concerns: NonNullable<NarrativeState['concerns']>) {
  const flags: Record<string, boolean> = {};
  
  Object.entries(concerns).forEach(([key, value]) => {
    flags[`concern_${key}`] = value > 0;
    flags[`concern_${key}_none`] = value === 0;
    flags[`concern_${key}_low`] = value > 0 && value <= 10;
    flags[`concern_${key}_moderate`] = value > 10 && value <= 20;
    flags[`concern_${key}_high`] = value > 20 && value <= 30;
    flags[`concern_${key}_extreme`] = value > 30;
    
    // Threshold flags
    flags[`concern_${key}_5plus`] = value >= 5;
    flags[`concern_${key}_10plus`] = value >= 10;
    flags[`concern_${key}_15plus`] = value >= 15;
    flags[`concern_${key}_20plus`] = value >= 20;
    flags[`concern_${key}_25plus`] = value >= 25;
  });
  
  // Profile flags
  const primaryConcern = Object.entries(concerns)
    .reduce((max, [key, value]) => value > max.value ? { key, value } : max, { key: '', value: 0 });
  
  if (primaryConcern.value > 0) {
    flags[`primary_concern_${primaryConcern.key}`] = true;
    flags['has_primary_concern'] = true;
  }
  
  // Combination flags
  flags['socially_concerned'] = concerns.socialFitting >= 15 || concerns.isolation >= 15;
  flags['financially_stressed'] = concerns.financial >= 15;
  flags['academically_focused'] = concerns.academics >= 20;
  flags['culturally_aware'] = (concerns.genderIssues + concerns.raceIssues + concerns.classIssues) >= 25;
  flags['well_balanced'] = Object.values(concerns).every(value => value >= 5 && value <= 15);
  
  return flags;
}
```

## **Week 2: Component Migration - Starting with Planner.tsx**

### **Day 1-2: Create Migration Hook for Planner**

```typescript
// src/hooks/usePlannerMigration.ts
import { useEffect, useState } from 'react';
import { LegacyStoreAdapter, startLegacySync } from '../stores/migration/legacyAdapters';
import { useCoreGameStore, useNarrativeStore } from '../stores/v2';

export const usePlannerMigration = () => {
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  
  useEffect(() => {
    const migrate = async () => {
      try {
        console.log('🔄 Starting Planner migration to V2 stores');
        
        // Start sync between legacy and V2 stores
        const stopSync = startLegacySync();
        
        // Migration is complete, but sync continues for safety
        setMigrationComplete(true);
        console.log('✅ Planner migration complete - sync active');
        
        // Cleanup sync after successful migration (can be removed later)
        return () => {
          stopSync();
          console.log('🛑 Legacy sync stopped');
        };
      } catch (error) {
        console.error('❌ Planner migration failed:', error);
        setMigrationError(error.message);
      }
    };
    
    const cleanup = migrate();
    return () => cleanup?.then?.(fn => fn?.());
  }, []);
  
  return {
    migrationComplete,
    migrationError,
    // Provide both legacy and V2 store access during migration
    stores: {
      core: useCoreGameStore(),
      narrative: useNarrativeStore()
    }
  };
};
```

### **Day 3-4: Update Planner.tsx to Use V2 Stores**

```typescript
// src/pages/Planner.tsx (Migration version - key changes only)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePlannerMigration } from '../hooks/usePlannerMigration';
// ... other imports

const Planner: React.FC = () => {
  // Use migration hook instead of direct store access
  const { migrationComplete, migrationError, stores } = usePlannerMigration();
  
  // Extract from V2 stores instead of legacy
  const { player, character, world, skills } = stores.core;
  const { storylets, concerns, flags } = stores.narrative;
  
  // Show migration status
  if (!migrationComplete) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-4">Migrating to V2 System...</h2>
          {migrationError ? (
            <p className="text-red-600">Migration failed: {migrationError}</p>
          ) : (
            <p className="text-blue-600">Please wait while we update the system...</p>
          )}
        </div>
      </div>
    );
  }
  
  // Use V2 store actions instead of legacy
  const updateResource = (resource: string, value: number) => {
    stores.core.updatePlayer({
      resources: {
        ...stores.core.player.resources,
        [resource]: resource === 'energy' || resource === 'stress'
          ? Math.max(0, Math.min(100, value))
          : Math.max(0, value)
      }
    });
  };
  
  const incrementDay = () => {
    stores.core.updateWorld({ day: stores.core.world.day + 1 });
  };
  
  const evaluateStorylets = () => {
    // Use V2 narrative store evaluation
    stores.narrative.evaluateStorylets();
  };
  
  // Rest of component logic remains the same...
  // The key change is that we're now using V2 stores through the migration hook
  
  return (
    <div className="page-container min-h-screen bg-gray-50">
      {/* Migration status indicator in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-green-100 border border-green-200 rounded-lg p-2 m-4">
          <span className="text-green-800 text-sm">
            ✅ Using V2 Stores (Migration Active)
          </span>
        </div>
      )}
      
      {/* Rest of existing JSX */}
      {/* ... */}
    </div>
  );
};

export default Planner;
```

### **Day 5: Testing & Validation**

```typescript
// src/__tests__/migration/plannerMigration.test.ts
import { renderHook } from '@testing-library/react';
import { usePlannerMigration } from '../../hooks/usePlannerMigration';
import { useAppStore } from '../../store/useAppStore';

describe('Planner Migration', () => {
  beforeEach(() => {
    // Reset stores before each test
    useAppStore.getState().resetGame();
  });
  
  it('should migrate legacy data to V2 stores', async () => {
    // Set up legacy data
    useAppStore.setState({
      userLevel: 5,
      experience: 250,
      day: 15,
      resources: { energy: 80, stress: 30, knowledge: 45, social: 60, money: 100 }
    });
    
    const { result, waitForNextUpdate } = renderHook(() => usePlannerMigration());
    
    await waitForNextUpdate();
    
    expect(result.current.migrationComplete).toBe(true);
    expect(result.current.migrationError).toBeNull();
    
    // Verify V2 stores have the migrated data
    const { stores } = result.current;
    expect(stores.core.player.level).toBe(5);
    expect(stores.core.player.experience).toBe(250);
    expect(stores.core.world.day).toBe(15);
    expect(stores.core.player.resources.energy).toBe(80);
  });
  
  it('should handle migration errors gracefully', async () => {
    // Test error handling by providing invalid data
    useAppStore.setState({ userLevel: 'invalid' as any });
    
    const { result, waitForNextUpdate } = renderHook(() => usePlannerMigration());
    
    await waitForNextUpdate();
    
    expect(result.current.migrationComplete).toBe(false);
    expect(result.current.migrationError).toBeDefined();
  });
});
```

## **Week 3: Content Studio Components Migration**

### **Day 1-2: Create Shared Content Studio Foundation**

```typescript
// src/components/contentStudio/shared/BaseStudioComponent.tsx
import React, { ReactNode } from 'react';
import { Card } from '../../ui';
import ErrorBoundary from '../../ErrorBoundary';
import HelpTooltip from '../../ui/HelpTooltip';

interface BaseStudioComponentProps {
  title: string;
  description?: string;
  helpText?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const BaseStudioComponent: React.FC<BaseStudioComponentProps> = ({
  title,
  description,
  helpText,
  children,
  actions,
  className = ''
}) => {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {helpText && <HelpTooltip content={helpText} />}
            </div>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
    </div>
  );
};
```

```typescript
// src/components/contentStudio/shared/useCRUDOperations.ts
import { useState, useCallback } from 'react';
import { useNarrativeStore } from '../../../stores/v2';

export type CRUDEntity = 'storylet' | 'character' | 'arc' | 'clue';

interface CRUDOperations<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  create: (item: Omit<T, 'id'>) => Promise<string>;
  update: (id: string, updates: Partial<T>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  get: (id: string) => T | undefined;
  refresh: () => Promise<void>;
}

export function useCRUDOperations<T extends { id: string }>(
  entityType: CRUDEntity,
  undoRedoSystem?: any
): CRUDOperations<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const narrativeStore = useNarrativeStore();
  
  // Get items based on entity type
  const getItems = useCallback((): T[] => {
    switch (entityType) {
      case 'storylet':
        return narrativeStore.storylets.catalog as T[];
      case 'arc':
        return [...narrativeStore.arcs.active, ...narrativeStore.arcs.completed] as T[];
      default:
        return [];
    }
  }, [entityType, narrativeStore]);
  
  const create = useCallback(async (item: Omit<T, 'id'>): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const id = `${entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newItem = { ...item, id } as T;
      
      // Use undo/redo system if available
      const action = () => {
        switch (entityType) {
          case 'storylet':
            narrativeStore.updateStorylets({
              catalog: [...narrativeStore.storylets.catalog, newItem as any]
            });
            break;
          // Add other entity types as needed
        }
      };
      
      if (undoRedoSystem) {
        undoRedoSystem.executeAction(action, `Create ${entityType}: ${(item as any).name || id}`);
      } else {
        action();
      }
      
      return id;
    } catch (err) {
      setError(`Failed to create ${entityType}: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [entityType, narrativeStore, undoRedoSystem]);
  
  const update = useCallback(async (id: string, updates: Partial<T>): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const action = () => {
        switch (entityType) {
          case 'storylet':
            const updatedCatalog = narrativeStore.storylets.catalog.map(item => 
              item.id === id ? { ...item, ...updates } : item
            );
            narrativeStore.updateStorylets({ catalog: updatedCatalog });
            break;
          // Add other entity types as needed
        }
      };
      
      if (undoRedoSystem) {
        undoRedoSystem.executeAction(action, `Update ${entityType}: ${id}`);
      } else {
        action();
      }
    } catch (err) {
      setError(`Failed to update ${entityType}: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id, updates, entityType, narrativeStore, undoRedoSystem]);
  
  const deleteItem = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const action = () => {
        switch (entityType) {
          case 'storylet':
            const filteredCatalog = narrativeStore.storylets.catalog.filter(item => item.id !== id);
            narrativeStore.updateStorylets({ catalog: filteredCatalog });
            break;
          // Add other entity types as needed
        }
      };
      
      if (undoRedoSystem) {
        undoRedoSystem.executeAction(action, `Delete ${entityType}: ${id}`);
      } else {
        action();
      }
    } catch (err) {
      setError(`Failed to delete ${entityType}: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id, entityType, narrativeStore, undoRedoSystem]);
  
  const get = useCallback((id: string): T | undefined => {
    return getItems().find(item => item.id === id);
  }, [getItems]);
  
  const refresh = useCallback(async (): Promise<void> => {
    // In this implementation, refresh is automatic via store subscriptions
    // But this could trigger re-evaluation of storylets or other refresh logic
    setError(null);
  }, []);
  
  return {
    items: getItems(),
    loading,
    error,
    create,
    update,
    delete: deleteItem,
    get,
    refresh
  };
}
```

### **Day 3-5: Migrate High-Priority Components**

```typescript
// src/components/contentStudio/StoryletBrowser.tsx (Refactored version - key changes)
import React, { useState } from 'react';
import { BaseStudioComponent } from './shared/BaseStudioComponent';
import { useCRUDOperations } from './shared/useCRUDOperations';
import { Button, Input } from '../ui';
import type { Storylet } from '../../types/storylet';

interface StoryletBrowserProps {
  onEditStorylet?: (storylet: Storylet) => void;
  onEditVisually?: (storylet: Storylet) => void;
  undoRedoSystem?: any;
}

export const StoryletBrowser: React.FC<StoryletBrowserProps> = ({
  onEditStorylet,
  onEditVisually,
  undoRedoSystem
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'completed'>('all');
  
  // Use unified CRUD operations
  const {
    items: storylets,
    loading,
    error,
    delete: deleteStorylet
  } = useCRUDOperations<Storylet>('storylet', undoRedoSystem);
  
  // Filter storylets based on search and type
  const filteredStorylets = storylets.filter(storylet => {
    const matchesSearch = storylet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         storylet.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter logic would depend on storylet status
    const matchesType = filterType === 'all' || true; // Simplified for example
    
    return matchesSearch && matchesType;
  });
  
  const handleDelete = async (storylet: Storylet) => {
    if (confirm(`Are you sure you want to delete "${storylet.name}"?`)) {
      try {
        await deleteStorylet(storylet.id);
      } catch (error) {
        console.error('Failed to delete storylet:', error);
      }
    }
  };
  
  return (
    <BaseStudioComponent
      title="Storylet Browser"
      description="Browse, search, and manage all storylets"
      helpText="Use the search bar to find specific storylets, or browse by category. Click Edit to modify a storylet."
      actions={
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search storylets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="border rounded px-3 py-2"
          >
            <option value="all">All Storylets</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      }
    >
      <div className="p-4 h-full overflow-y-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading storylets...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStorylets.map((storylet) => (
              <div key={storylet.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-lg mb-2">{storylet.name}</h4>
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">{storylet.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onEditStorylet?.(storylet)}
                      className="text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditVisually?.(storylet)}
                      className="text-xs"
                    >
                      Visual
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(storylet)}
                    className="text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {filteredStorylets.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No storylets found matching your criteria.</p>
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm('')}
                variant="outline"
                className="mt-2"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </BaseStudioComponent>
  );
};

export default StoryletBrowser;
```

## **Testing & Validation Strategy**

### **Continuous Testing During Migration**

```typescript
// src/__tests__/migration/integrationTests.ts
describe('Phase 1 Migration Integration', () => {
  it('should maintain data consistency across legacy and V2 stores', () => {
    // Test that data changes in one store are reflected in the other
  });
  
  it('should preserve all user data during migration', () => {
    // Test that no data is lost during the migration process
  });
  
  it('should handle migration failures gracefully', () => {
    // Test error recovery and rollback mechanisms
  });
  
  it('should perform equivalently to legacy system', () => {
    // Performance regression tests
  });
});
```

### **Migration Success Criteria**

1. **Zero Data Loss**: All existing game state preserved
2. **Performance Maintained**: No regression in load times or responsiveness
3. **Feature Parity**: All existing functionality works identically
4. **Error Recovery**: Graceful handling of migration failures
5. **Developer Experience**: Easier debugging and state inspection

This implementation guide provides concrete, actionable steps for Phase 1 of the refactoring plan. Each week builds upon the previous, with clear success criteria and testing strategies to ensure a smooth transition to the new architecture.
