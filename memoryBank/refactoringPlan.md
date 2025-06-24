# /Users/montysharma/V11M2/memoryBank/refactoringPlan.md

# V11M2 Architecture Refactoring Plan
## Zen-Guided Strategic Overhaul for Better Maintainability & Performance

### **Philosophy: From Chaos to Harmony**

The current architecture reflects rapid iteration and growth - components have grown organically, stores have multiplied, and patterns have emerged independently. This refactor will bring zen-like simplicity: **each component knows its purpose, each store serves its domain, each pattern flows naturally from the architecture.**

## **Phase 1: Store Consolidation & Migration Strategy** 
*Estimated Time: 2-3 weeks*

### **Current Pain Points**
- **Store Fragmentation**: 15+ separate stores with overlapping concerns
- **State Synchronization**: Complex patterns to sync legacy/V2 systems
- **Flag Management Chaos**: 4+ different flag systems creating confusion
- **Memory Leaks**: Subscriptions and cleanup not consistently managed

### **Target State: The Unified Store Trinity**
```typescript
// Single source of truth with clean domain separation
useCoreGameStore    // Player, character, world state, resources
useNarrativeStore   // Storylets, flags, character concerns, arcs  
useSocialStore      // Saves, multiplayer, sharing, analytics
```

### **Migration Strategy**
```typescript
// Phase 1.1: Create Migration Utilities (Week 1)
// File: src/stores/migration/
storeMigrationUtils.ts     // Utilities for safe data migration
legacyAdapters.ts         // Temporary adapters for legacy stores
migrationValidation.ts    // Validation for migrated data

// Phase 1.2: Consolidate Flag Management (Week 1-2)
// All flags move to useNarrativeStore with unified interface
const flags = useNarrativeStore(state => state.flags);
flags.storylet.get('character_created')
flags.concerns.get('academically_focused') 
flags.custom.set('custom_flag', true)

// Phase 1.3: Component Migration (Week 2-3)
// Migrate components one-by-one with adapters for safety
// Priority: Planner.tsx -> StoryletPanel.tsx -> ContentStudio components
```

### **Success Metrics**
- Reduce store count from 15+ to 3 core stores
- Eliminate all state synchronization complexity
- 100% test coverage for migration utilities
- Zero data loss during migration

## **Phase 2: Planner.tsx Decomposition**
*Estimated Time: 2 weeks*

### **Current Problem: The God Component**
Planner.tsx is doing everything:
- Time simulation and day progression
- Resource calculations and validation
- Crash detection and recovery
- UI rendering and state management
- Storylet evaluation triggers

### **Target State: Clean Separation of Concerns**

```typescript
// Core Architecture: UI + Business Logic Separation
/pages/Planner.tsx              // Clean UI orchestration only
/hooks/useTimeSimulation.ts     // Time progression & simulation logic
/hooks/useResourceManager.ts    // Resource calculations & validation
/hooks/useCrashRecovery.ts      // Crash detection & recovery
/services/SimulationEngine.ts   // Core simulation business logic
/utils/resourceCalculations.ts  // Pure functions (already exists)
```

### **Implementation Plan**

#### **Week 1: Extract Business Logic**
```typescript
// 1. Extract Time Simulation Hook
export const useTimeSimulation = () => {
  // Manages day progression, tick rates, pause/play state
  // Encapsulates all setInterval/setTimeout logic
  // Returns: { isPlaying, toggleSimulation, simulateTick }
}

// 2. Extract Resource Management Hook  
export const useResourceManager = () => {
  // Encapsulates resource calculations, validation, limits
  // Returns: { resources, updateResource, validateAllocations }
}

// 3. Extract Crash Recovery Hook
export const useCrashRecovery = () => {
  // Handles crash detection, modal state, recovery logic
  // Returns: { crashState, handleCrash, recoverFromCrash }
}
```

#### **Week 2: Clean UI Component**
```typescript
// New Planner.tsx Structure (< 150 lines target)
const Planner: React.FC = () => {
  // Clean hook usage - no direct business logic
  const simulation = useTimeSimulation();
  const resources = useResourceManager();  
  const crashRecovery = useCrashRecovery();
  
  // Pure UI rendering with clean event handlers
  return <PlannerUI {...{ simulation, resources, crashRecovery }} />;
};
```

### **Benefits**
- **Testability**: Business logic isolated for unit testing
- **Maintainability**: Clear responsibilities, easier debugging
- **Reusability**: Hooks can be used in other components
- **Performance**: Better memoization and re-render optimization

## **Phase 3: Content Studio Unification**
*Estimated Time: 3 weeks*

### **Current Challenge: Component Duplication**
8 content studio tabs with similar patterns:
- CRUD operations repeated 8 times
- Undo/redo implemented differently
- Validation patterns duplicated
- Error handling inconsistent

### **Target State: Shared Foundation Architecture**

```typescript
// Unified Foundation Layer
/components/contentStudio/shared/
  BaseStudioComponent.tsx        // Common layout, error boundaries
  useCRUDOperations.ts          // Unified create/read/update/delete
  useStudioValidation.ts        // Shared validation patterns  
  useStudioPersistence.ts       // Consistent save/load behavior
  
// Specialized Components (Slimmed Down)
/components/contentStudio/
  AdvancedStoryletCreator.tsx   // 300 lines (from 1000+)
  StoryletBrowser.tsx           // 200 lines (from 600+)  
  VisualStoryletEditor.tsx      // 400 lines (from 800+)
  // etc...
```

### **Implementation Strategy**

#### **Week 1: Create Shared Foundation**
```typescript
// 1. Base Component Architecture
export const BaseStudioComponent = ({ children, title, helpText }) => {
  // Standard layout, error boundaries, help system
  // Shared undo/redo UI integration
  // Common loading states and transitions
};

// 2. Unified CRUD Hook
export const useCRUDOperations = <T>(entityType: string) => {
  // Standardized create, read, update, delete operations
  // Consistent error handling and validation
  // Automatic undo/redo integration
  return { items, create, update, delete, loading, error };
};
```

#### **Week 2: Migrate High-Impact Components**
Priority: AdvancedStoryletCreator, StoryletBrowser, VisualStoryletEditor

#### **Week 3: Complete Migration & Polish**
Remaining components + comprehensive testing

### **Expected Outcomes**
- Reduce total Content Studio code by 40-50%
- Consistent UX across all studio components  
- Shared bug fixes benefit all components
- Faster development of new studio features

## **Phase 4: Minigame System Modernization**
*Estimated Time: 2 weeks*

### **Current Limitations**
- Simple switch statement dispatcher
- No unified state management
- Inconsistent difficulty progression
- Mixed implementation (some complete, some placeholders)

### **Target State: Plugin Architecture**

```typescript
// Extensible Minigame Framework
/components/minigames/core/
  MinigameEngine.ts             // Unified game state management
  DifficultyManager.ts          // Adaptive difficulty system
  MinigameRegistry.ts           // Plugin registration system
  
/components/minigames/plugins/
  MemoryGame/                   // Self-contained game modules
  PathPlanner/                  // With unified interfaces
  WordScramble/
  // etc...
```

### **Implementation Plan**

#### **Week 1: Core Framework**
```typescript
// 1. Unified Minigame Interface
interface MinigamePlugin {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyConfig;
  component: React.ComponentType<MinigameProps>;
  validateConfig: (config: any) => boolean;
}

// 2. Game Engine
export const useMinigameEngine = () => {
  // Unified state management for all games
  // Progress tracking, analytics, difficulty adjustment
  // Consistent lifecycle: start -> play -> complete -> cleanup
};
```

#### **Week 2: Plugin Migration**
Convert existing games to plugin architecture, implement missing games from specs

### **Benefits**
- Easy addition of new minigames
- Consistent difficulty progression
- Better error handling and recovery
- Unified analytics and progress tracking

## **Phase 5: Performance & Testing Infrastructure**
*Estimated Time: 1 week*

### **Performance Optimizations**
```typescript
// Store Subscription Optimization
const useOptimizedSelector = (selector) => {
  // Memoized selectors to prevent unnecessary re-renders
  // Batch updates for related state changes
};

// Component Memoization Strategy  
const MemoizedStoryletPanel = React.memo(StoryletPanel, (prev, next) => {
  // Smart comparison based on actual data dependencies
});
```

### **Testing Infrastructure**
```typescript
// Business Logic Testing (New)
/src/__tests__/hooks/           // Test extracted hooks
/src/__tests__/services/        // Test simulation engine
/src/__tests__/stores/          // Test store behavior

// Integration Testing
/src/__tests__/integration/     // Test cross-component workflows
```

## **Migration Execution Strategy**

### **Risk Mitigation**
1. **Gradual Migration**: One component/store at a time
2. **Feature Flags**: Toggle between old/new implementations  
3. **Comprehensive Backup**: Auto-backup before destructive changes
4. **Rollback Plan**: Quick revert capability for each phase

### **Team Workflow**
```bash
# Development Branch Strategy
main                    # Stable code
refactor/store-consolidation    # Phase 1 work
refactor/planner-decomposition  # Phase 2 work  
refactor/content-studio        # Phase 3 work
refactor/minigame-modernization # Phase 4 work

# Integration points at end of each phase
# Comprehensive testing before merging to main
```

### **Quality Gates**
- [ ] All existing functionality preserved
- [ ] Performance metrics equal or better
- [ ] Test coverage above 80% for new code
- [ ] Documentation updated for new patterns
- [ ] Zero production errors during migration

## **Expected Outcomes**

### **Developer Experience**
- **50% reduction** in time to add new features
- **Clearer mental model** of system architecture
- **Easier debugging** with separated concerns
- **Better onboarding** for new developers

### **Performance**
- **30% reduction** in component re-renders
- **Faster startup time** with optimized stores
- **Better memory usage** with proper cleanup

### **Maintainability**
- **Single pattern** for similar operations
- **Consistent error handling** across all components
- **Unified state management** eliminates sync issues
- **Modular architecture** enables independent updates

### **User Experience**
- **Faster feature delivery** due to better developer productivity
- **More consistent UX** across all studio components
- **Better error recovery** with improved architecture
- **Smooth performance** with optimized re-rendering

This refactoring plan transforms the V11M2 codebase from an organically grown system into a **well-architected, maintainable platform** that can scale elegantly as new features are added. Each phase builds upon the previous, creating a foundation of simplicity and clarity that will serve the project for years to come.
