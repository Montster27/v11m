# V12 Patterns Implementation in V11M2

## Overview

This document describes the implementation of V12 architectural patterns in the V11M2 codebase. These patterns improve maintainability, reduce coupling, and prevent the architectural violations identified in the expert review.

## Implemented V12 Patterns

### 1. Actions Namespace Pattern ✅

**Location**: `src/stores/v2/useCoreGameStoreV12.ts`

**Before (V11M2 Old Pattern)**:
```typescript
const store = useCoreGameStore();
store.updateTimeAllocation('study', 50);
store.updateResource('energy', 75);
```

**After (V12 Pattern)**:
```typescript
const actions = useCoreGameActions();
actions.updateTimeAllocation('study', 50);
actions.updateResource('energy', 75);
```

**Benefits**:
- Clear separation between data and actions
- Prevents accidental persistence of functions
- Better TypeScript intellisense
- Cleaner component code

### 2. EventBus Decoupling Pattern ✅

**Location**: `src/utils/EventBus.ts`

**Implementation**:
```typescript
// Engine module (no direct store access)
class NarrativeEngine {
  constructor(private eventBus: EventBus) {
    this.eventBus.on('time.dayAdvanced', this.evaluateStorylets);
  }
  
  private evaluateStorylets = async (event: GameEvent) => {
    // Evaluate storylets without direct store coupling
    this.eventBus.emit(createEvent.storylet.activated('tutorial'));
  };
}

// Component (subscribes to events)
const StoryletPanel = () => {
  useEffect(() => {
    const unsubscribe = globalEventBus.on('storylet.activated', (event) => {
      // Update UI based on event
    });
    return unsubscribe;
  }, []);
};
```

**Benefits**:
- Eliminates tight coupling between modules
- Engine modules can be unit tested in isolation
- Event-driven architecture enables better scalability
- Follows the EventBus pattern from V12

### 3. Typed Selectors Pattern ✅

**Location**: `src/stores/v2/useCoreGameStoreV12.ts`

**Implementation**:
```typescript
// Instead of accessing full store
const store = useCoreGameStore();
const player = store.player; // Too broad

// Use typed selectors
const player = usePlayer();
const world = useWorld();
const actions = useCoreGameActions();
```

**Benefits**:
- Components only subscribe to data they need
- Prevents unnecessary re-renders
- Better performance
- Clearer component dependencies

### 4. Middleware Stack Pattern ✅

**Implementation**:
```typescript
export const useCoreGameStoreV12 = create<CoreGameState>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          // Store implementation
        })),
        { name: 'core-game-store-v12', version: 1 }
      )
    ),
    { name: 'CoreGameStoreV12' }
  )
);
```

**Benefits**:
- Consistent middleware configuration
- Immer for immutable updates
- DevTools integration
- Proper persistence handling

## Migration Examples

### Component Migration

**Before (V11M2 Old)**:
```typescript
const TimeAllocationPanel = () => {
  const allocations = useCoreGameStore(state => state.world.timeAllocation);
  const updateTimeAllocation = useCoreGameStore(state => state.updateTimeAllocation);
  
  return (
    <Slider 
      onChange={(value) => updateTimeAllocation('study', value)}
    />
  );
};
```

**After (V12 Pattern)**:
```typescript
const TimeAllocationPanel = () => {
  const world = useWorld();
  const actions = useCoreGameActions();
  
  const handleChange = (value: number) => {
    actions.updateTimeAllocation('study', value);
    globalEventBus.emit(createEvent.time.allocationChanged('study', value));
  };
  
  return (
    <Slider onChange={handleChange} />
  );
};
```

### Engine Module Migration

**Before (Tight Coupling)**:
```typescript
class SimulationEngine {
  tick() {
    const store = useCoreGameStore.getState();
    store.updateWorld({ day: store.world.day + 1 });
    store.updateResource('energy', 50);
  }
}
```

**After (EventBus Decoupling)**:
```typescript
class SimulationEngine {
  constructor(private eventBus: EventBus) {}
  
  tick() {
    this.eventBus.emit(createEvent.time.dayAdvanced(2));
    this.eventBus.emit(createEvent.resource.updated('energy', 50, -25));
  }
}
```

## Files Created

1. **`src/stores/v2/useCoreGameStoreV12.ts`** - V12 pattern store implementation
2. **`src/utils/EventBus.ts`** - EventBus for decoupling
3. **`src/components/examples/V12PatternExample.tsx`** - Working example
4. **`docs/V12-PATTERNS-IMPLEMENTATION.md`** - This documentation

## Current Status

### ✅ Completed
- [x] Actions namespace pattern implemented
- [x] EventBus system created
- [x] Typed selectors pattern
- [x] Working examples created
- [x] Documentation written

### 🔄 In Progress
- [ ] Migrate existing components to V12 patterns
- [ ] Remove V1 component duplicates

### 📋 Pending
- [ ] Add comprehensive testing infrastructure
- [ ] Create migration guide for remaining components
- [ ] Implement engine modules using EventBus pattern

## Benefits Achieved

1. **Architectural Compliance**: Addresses violations identified in expert review
2. **Maintainability**: Clear separation of concerns
3. **Testability**: Engine modules can be unit tested in isolation
4. **Performance**: Typed selectors prevent unnecessary re-renders
5. **Scalability**: EventBus enables loosely coupled architecture

## Next Steps

1. **Gradual Migration**: Convert existing components one by one to V12 patterns
2. **Remove Legacy Code**: Delete V1 stores and duplicate components
3. **Add Testing**: Implement V12 testing patterns
4. **Engine Refactor**: Convert existing engines to EventBus pattern

## Usage Guidelines

### When to Use V12 Patterns

1. **New Components**: Always use V12 patterns for new code
2. **Major Refactors**: When significantly changing existing components
3. **Engine Modules**: All engine modules should use EventBus pattern
4. **Cross-Component Communication**: Use EventBus instead of direct store access

### Migration Priority

1. **High**: Components with business logic
2. **Medium**: Components with complex state interactions
3. **Low**: Simple display components

The V12 patterns provide a solid foundation for scaling the V11M2 codebase while maintaining the benefits achieved from the recent architectural fixes.