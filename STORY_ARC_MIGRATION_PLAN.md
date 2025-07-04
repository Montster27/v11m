# Story Arc Migration Plan to V2 Architecture

## Overview
The codebase already contains a sophisticated story arc system with multiple stores, UI components, and testing infrastructure. This plan outlines how to migrate and consolidate the story arc functionality into the new V2 unified architecture while preserving all existing capabilities.

## Current State Analysis

### ✅ **Existing Story Arc Infrastructure**

#### **Stores (Multiple)**
- `useStoryArcStore.ts` - Dedicated arc store with progress tracking
- `useClueStore.ts` - Clue management with arc relationships  
- `useNarrativeStore.ts` (V2) - Unified narrative store with arc support
- `useStoryletStore.ts` - Storylet management with arc assignments

#### **Components**
- `ArcManager.tsx` - Full-featured arc management UI
- `ClueManager.tsx` - Clue management with arc integration
- `StoryArcVisualizer.tsx` - Visual arc representation

#### **Testing & Utils**
- `arcTesting.ts` - Comprehensive arc testing framework
- Various arc data files and examples

#### **Type Definitions**
- `Storylet` interface with `storyArc` field
- `Clue` interface with arc relationships
- `StoryArc` interface with metadata

## Migration Strategy

### Phase 1: Store Consolidation
**Goal**: Migrate all arc-related state to the unified V2 stores

#### 1.1 **Enhance V2 Narrative Store**
```typescript
// Add to useNarrativeStore.ts
interface NarrativeState {
  // ... existing fields
  
  // Story Arc Management
  storyArcs: {
    [arcId: string]: {
      id: string;
      name: string;
      description: string;
      progress: number; // 0-1
      isCompleted: boolean;
      currentStorylet?: string;
      startedAt?: number;
      completedAt?: number;
      failures: number;
      metadata: {
        totalStorylets: number;
        completedStorylets: number;
        availableStorylets: string[];
        entryPoints: string[];
        deadEnds: string[];
        lastAccessed: number;
        createdAt: number;
      };
    };
  };
  
  // Arc Progress Tracking  
  arcProgress: {
    [arcId: string]: {
      currentStoryletId?: string;
      completedStorylets: string[];
      availableStorylets: string[];
      flags: Record<string, any>;
      failures: Array<{
        storyletId: string;
        timestamp: number;
        reason: string;
      }>;
    };
  };
}
```

#### 1.2 **Enhance V2 Social Store for Clue-Arc Integration**
```typescript
// Add to useSocialStore.ts
interface SocialState {
  // ... existing fields
  
  clues: {
    // ... existing clue fields
    
    arcRelationships: {
      [clueId: string]: {
        storyArc: string;
        arcOrder: number;
        prerequisites: string[]; // Other clues needed first
        unlocks: string[]; // Clues this unlocks
        arcProgress: number; // % progress this clue represents
      };
    };
    
    arcDiscoveryProgress: {
      [arcId: string]: {
        discoveredClues: string[];
        totalClues: number;
        completionPercentage: number;
        nextClues: string[]; // Available to discover
      };
    };
  };
}
```

#### 1.3 **Migration Actions for Store Consolidation**
```typescript
// Create migration utilities
export const migrateStoryArcData = () => {
  // 1. Extract data from useStoryArcStore
  const arcStore = useStoryArcStore.getState();
  const clueStore = useClueStore.getState();
  
  // 2. Transform to V2 format
  const migratedArcs = transformArcData(arcStore.arcs);
  const migratedClueArcs = transformClueArcData(clueStore.clues);
  
  // 3. Update V2 stores
  useNarrativeStore.getState().setStoryArcs(migratedArcs);
  useSocialStore.getState().setClueArcRelationships(migratedClueArcs);
  
  // 4. Clear old stores
  arcStore.clearAll();
  clueStore.clearArcData();
};
```

### Phase 2: API Consolidation
**Goal**: Create unified API for arc operations

#### 2.1 **Create Unified Arc Manager**
```typescript
// src/utils/storyArcManager.ts
class StoryArcManager {
  // Arc Operations
  createArc(arcData: CreateArcInput): string
  updateArc(arcId: string, updates: Partial<StoryArc>): void
  deleteArc(arcId: string): void
  getArc(arcId: string): StoryArc | null
  getAllArcs(): StoryArc[]
  
  // Progress Management
  startArc(arcId: string): void
  completeArc(arcId: string): void
  recordArcFailure(arcId: string, reason: string): void
  getArcProgress(arcId: string): ArcProgress
  
  // Storylet Integration
  assignStoryletToArc(storyletId: string, arcId: string): void
  getArcStorylets(arcId: string): Storylet[]
  getAvailableStorylets(arcId: string): Storylet[]
  progressArcStorylet(arcId: string, storyletId: string): void
  
  // Clue Integration
  assignClueToArc(clueId: string, arcId: string, order: number): void
  getArcClues(arcId: string): Clue[]
  progressArcClue(arcId: string, clueId: string): void
  getNextArcClue(arcId: string): Clue | null
  
  // Cross-Arc Operations
  jumpToArc(fromArcId: string, toArcId: string): void
  getArcDependencies(arcId: string): string[]
  getUnlockedArcs(): string[]
  
  // Statistics & Analytics
  getArcStatistics(arcId: string): ArcStatistics
  getPlayerArcHistory(): ArcHistoryEntry[]
  getArcCompletionRate(): number
}

export const storyArcManager = new StoryArcManager();
```

#### 2.2 **Update Component APIs**
```typescript
// Refactor components to use unified manager
const ArcManager = () => {
  const arcs = storyArcManager.getAllArcs();
  const createArc = storyArcManager.createArc;
  const updateArc = storyArcManager.updateArc;
  // ... rest of component logic
};
```

### Phase 3: Component Migration
**Goal**: Update all arc-related components to use V2 stores

#### 3.1 **Migrate ArcManager.tsx**
```typescript
// Update imports
import { useNarrativeStore } from '../../stores/v2';
import { storyArcManager } from '../../utils/storyArcManager';

// Replace store hooks
const ArcManager = () => {
  const { storyArcs, arcProgress } = useNarrativeStore();
  
  // Use unified manager for operations
  const handleCreateArc = (arcData: CreateArcInput) => {
    storyArcManager.createArc(arcData);
  };
  
  // ... rest of component
};
```

#### 3.2 **Migrate ClueManager.tsx**
```typescript
// Update to use V2 stores for clue-arc relationships
const ClueManager = () => {
  const { clues, arcRelationships } = useSocialStore();
  const { storyArcs } = useNarrativeStore();
  
  const handleAssignClueToArc = (clueId: string, arcId: string) => {
    storyArcManager.assignClueToArc(clueId, arcId, arcOrder);
  };
  
  // ... rest of component
};
```

#### 3.3 **Migrate StoryArcVisualizer.tsx**
```typescript
// Update to use V2 data sources
const StoryArcVisualizer = ({ arcId }: { arcId: string }) => {
  const arc = storyArcManager.getArc(arcId);
  const storylets = storyArcManager.getArcStorylets(arcId);
  const clues = storyArcManager.getArcClues(arcId);
  
  // ... visualization logic
};
```

### Phase 4: Testing Framework Migration
**Goal**: Update testing framework to work with V2 architecture

#### 4.1 **Update arcTesting.ts**
```typescript
// Update test utilities to use V2 stores
export const runArcTest = (arcId: string) => {
  const arc = storyArcManager.getArc(arcId);
  const testResults = {
    arcValidation: validateArc(arc),
    storyletConnections: validateStoryletConnections(arc),
    clueProgression: validateClueProgression(arc),
    branchingPaths: analyzeBranchingPaths(arc),
    deadEnds: findDeadEnds(arc)
  };
  
  return testResults;
};
```

#### 4.2 **Create V2 Arc Testing Suite**
```typescript
// src/tests/storyArcIntegration.test.ts
describe('Story Arc V2 Integration', () => {
  test('Arc creation and management', () => {
    const arcId = storyArcManager.createArc(testArcData);
    expect(storyArcManager.getArc(arcId)).toBeDefined();
  });
  
  test('Clue-to-arc relationships', () => {
    storyArcManager.assignClueToArc('clue1', 'arc1', 1);
    const arcClues = storyArcManager.getArcClues('arc1');
    expect(arcClues).toContain('clue1');
  });
  
  test('Arc progress tracking', () => {
    storyArcManager.startArc('arc1');
    storyArcManager.progressArcStorylet('arc1', 'storylet1');
    const progress = storyArcManager.getArcProgress('arc1');
    expect(progress.completedStorylets).toContain('storylet1');
  });
});
```

### Phase 5: Data Migration
**Goal**: Migrate existing arc data to V2 format

#### 5.1 **Create Migration Scripts**
```typescript
// src/scripts/migrateStoryArcs.ts
export const migrateExistingArcs = async () => {
  console.log('🔄 Migrating story arcs to V2 architecture...');
  
  // 1. Backup existing data
  const backup = {
    arcStore: useStoryArcStore.getState(),
    clueStore: useClueStore.getState()
  };
  
  // 2. Transform data format
  const transformedArcs = transformArcData(backup.arcStore);
  const transformedClues = transformClueData(backup.clueStore);
  
  // 3. Load into V2 stores
  useNarrativeStore.getState().setStoryArcs(transformedArcs);
  useSocialStore.getState().setClueArcRelationships(transformedClues);
  
  // 4. Validate migration
  const validationResults = validateMigration(backup, {
    arcs: transformedArcs,
    clues: transformedClues
  });
  
  if (validationResults.success) {
    console.log('✅ Story arc migration completed successfully');
    // Clear old stores
    clearLegacyStores();
  } else {
    console.error('❌ Migration failed:', validationResults.errors);
    // Rollback if needed
    rollbackMigration(backup);
  }
};
```

#### 5.2 **Restore Arc Data**
```typescript
// src/data/arcs/restoreArcData.ts
export const restoreArcData = () => {
  // Restore Emma Romance arc
  const emmaRomanceArc = {
    id: 'emma-romance',
    name: 'Emma Romance',
    description: 'A romantic storyline with Emma',
    storylets: [
      'emma-first-meeting',
      'emma-coffee-date',
      'emma-relationship-choice'
    ],
    clues: [
      { id: 'emma-likes-coffee', order: 1 },
      { id: 'emma-favorite-book', order: 2 },
      { id: 'emma-background', order: 3 }
    ]
  };
  
  storyArcManager.createArc(emmaRomanceArc);
  
  // Add more arc examples
  createSampleArcs();
};
```

### Phase 6: Legacy Cleanup
**Goal**: Remove old arc stores and update imports

#### 6.1 **Deprecate Old Stores**
```typescript
// Mark stores as deprecated
// useStoryArcStore.ts
console.warn('⚠️ useStoryArcStore is deprecated. Use V2 useNarrativeStore instead.');

// Update all imports across codebase
// Replace: import { useStoryArcStore } from '../store/useStoryArcStore';
// With:    import { useNarrativeStore } from '../stores/v2';
```

#### 6.2 **Update All Import Statements**
```bash
# Search and replace pattern
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/useStoryArcStore/useNarrativeStore/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/useClueStore/useSocialStore/g'
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Create unified StoryArcManager
- [ ] Enhance V2 stores with arc fields
- [ ] Create migration utilities

### Week 2: Component Migration  
- [ ] Migrate ArcManager.tsx
- [ ] Migrate ClueManager.tsx
- [ ] Migrate StoryArcVisualizer.tsx

### Week 3: Testing & Data
- [ ] Update testing framework
- [ ] Create V2 integration tests
- [ ] Run data migration scripts

### Week 4: Cleanup & Validation
- [ ] Remove legacy stores
- [ ] Update all imports
- [ ] Full system testing
- [ ] Performance validation

## Success Criteria

### ✅ **Functional Requirements**
- [ ] All existing arc functionality preserved
- [ ] Arc creation, editing, deletion works
- [ ] Clue-to-arc relationships maintained
- [ ] Storylet-to-arc assignments work
- [ ] Arc progress tracking accurate
- [ ] Cross-arc jumping functional

### ✅ **Technical Requirements**
- [ ] All components use V2 stores
- [ ] No legacy store dependencies
- [ ] Performance same or better
- [ ] Memory usage optimized
- [ ] Type safety maintained

### ✅ **Data Integrity**
- [ ] No data loss during migration
- [ ] All arc relationships preserved
- [ ] Progress tracking continues seamlessly
- [ ] Backup and rollback tested

### ✅ **Testing Coverage**
- [ ] Unit tests for StoryArcManager
- [ ] Integration tests for V2 stores
- [ ] E2E tests for arc workflows
- [ ] Migration validation tests

## Risk Mitigation

### **Data Loss Prevention**
- Comprehensive backup before migration
- Rollback procedures tested
- Validation at each migration step
- Incremental migration approach

### **Performance Monitoring**
- Before/after performance benchmarks
- Memory usage tracking
- Load testing with large arc datasets
- User experience validation

### **Compatibility Assurance**
- Feature parity checklist
- API compatibility layer if needed
- Gradual rollout with feature flags
- User acceptance testing

## Post-Migration Enhancements

Once migration is complete, consider these improvements:

### **New Features**
- Arc dependencies and prerequisites
- Arc difficulty progression
- Arc recommendation system
- Cross-arc state sharing
- Arc completion rewards

### **Performance Optimizations**
- Arc data lazy loading
- Storylet caching by arc
- Progress calculation optimization
- Memory usage reduction

### **UI/UX Improvements**
- Enhanced arc visualizer
- Better progress indicators
- Arc discovery flow
- Player guidance system

This migration plan ensures a smooth transition to the V2 architecture while preserving all existing story arc functionality and setting the foundation for future enhancements.