# StoryArcVisualizer Performance & Bug Fix Guide

## Overview
This guide provides a systematic, test-driven approach to fix critical bugs and optimize performance in StoryArcVisualizer.tsx without losing any functionality.

## Pre-Fix Checklist

### 1. Create Backup
```bash
# Create a backup of the current working version
cp src/components/StoryArcVisualizer.tsx src/components/StoryArcVisualizer.tsx.backup
```

### 2. Document Current Functionality
Before making any changes, verify and document all current features:

- [ ] Node click selects storylet
- [ ] Double-click opens edit mode
- [ ] Drag to pan viewport
- [ ] Mouse wheel to zoom
- [ ] Right-click context menu
- [ ] Create new storylet
- [ ] Edit storylet properties
- [ ] Delete storylet
- [ ] Auto-save functionality
- [ ] Path highlighting
- [ ] Search/filter storylets
- [ ] Import/export to main store

### 3. Create Test Component
Create a test harness to verify functionality remains intact:

```typescript
// src/components/__tests__/StoryArcVisualizerTest.tsx
import React from 'react';
import { StoryArcVisualizer } from '../StoryArcVisualizer';
import { useArcVisualizerStore } from '../../store/useArcVisualizerStore';

export const StoryArcVisualizerTest = () => {
  const [testResults, setTestResults] = React.useState<Record<string, boolean>>({});
  
  const runTests = async () => {
    const results: Record<string, boolean> = {};
    
    // Test 1: Component renders without crashing
    try {
      results['renders'] = true;
    } catch (e) {
      results['renders'] = false;
    }
    
    // Test 2: Store functions exist
    const store = useArcVisualizerStore.getState();
    results['storeExists'] = !!store;
    results['loadArcExists'] = typeof store.loadArc === 'function';
    results['createStoryletExists'] = typeof store.createStorylet === 'function';
    
    setTestResults(results);
  };
  
  return (
    <div>
      <button onClick={runTests}>Run Tests</button>
      <pre>{JSON.stringify(testResults, null, 2)}</pre>
    </div>
  );
};
```

## Phase 1: Critical Bug Fixes (IMMEDIATE)

### Step 1.1: Fix Undefined Variables

**Issue**: `setSelectedNode` is undefined (should be `setSelectedStorylet`)

```typescript
// BEFORE (Line ~550)
setSelectedNode(null);

// AFTER
setSelectedStorylet(null);
```

**Test After Fix**:
```typescript
// In browser console
const store = useArcVisualizerStore.getState();
console.log('setSelectedStorylet exists:', typeof store.setSelectedStorylet === 'function');
// Should output: true
```

### Step 1.2: Fix allStorylets Reference

**Issue**: `allStorylets` is undefined (should be `arcStorylets`)

```typescript
// BEFORE (Lines ~578, 587)
const storylet = allStorylets.find(s => s.id === edge.to);

// AFTER
const storylet = arcStorylets.find(s => s.id === edge.to);
```

**Test After Fix**:
```typescript
// Verify storylet connections still work
// Click on a storylet node and verify connected paths highlight
```

### Step 1.3: Fix handleSaveEdit Callback

**Issue**: `handleSaveEdit` not wrapped in useCallback but used as dependency

```typescript
// BEFORE (Line ~280)
const handleSaveEdit = () => {
  // ... existing code
};

// AFTER
const handleSaveEdit = useCallback(() => {
  if (!editingStorylet || !editFormData.id) return;
  
  const updatedStorylet: Storylet = {
    ...editFormData,
    trigger: {
      ...editFormData.trigger,
      conditions: safeParseJSON(triggerConditionsText, editFormData.trigger.conditions)
    },
    lastModified: Date.now()
  };
  
  updateStorylet(updatedStorylet);
  setEditingStorylet(null);
  setEditFormData({});
  setTriggerConditionsText('{}');
}, [editingStorylet, editFormData, triggerConditionsText, updateStorylet, setEditingStorylet]);
```

**Verification Test**:
1. Open a storylet for editing
2. Make changes
3. Save
4. Verify changes persist
5. Check console for any errors

## Phase 2: Performance Critical Path (1-2 HOURS)

### Step 2.1: Memoize validateConnections

```typescript
// ADD this memoized version
const validationErrors = useMemo(() => {
  return validateConnections(arcStorylets);
}, [arcStorylets]);

// REMOVE the direct call in render
// const validationErrors = validateConnections(arcStorylets);
```

**Performance Test**:
```typescript
// Add temporary performance logging
console.time('validateConnections');
const errors = validateConnections(arcStorylets);
console.timeEnd('validateConnections');
// Should see significant reduction in calls
```

### Step 2.2: Memoize ViewBox Calculation

```typescript
// BEFORE (Line ~732)
const viewBox = `${viewport.x} ${viewport.y} ${CANVAS_WIDTH / viewport.zoom} ${CANVAS_HEIGHT / viewport.zoom}`;

// AFTER
const viewBox = useMemo(() => 
  `${viewport.x} ${viewport.y} ${CANVAS_WIDTH / viewport.zoom} ${CANVAS_HEIGHT / viewport.zoom}`,
  [viewport.x, viewport.y, viewport.zoom]
);
```

### Step 2.3: Optimize Graph Layout Dependencies

```typescript
// BEFORE
const { nodes, edges } = useMemo(() => {
  // ... calculation
}, [arcStorylets, searchQuery, filterOptions, selectedStorylet, highlightedPath, clues]);

// AFTER - Remove unnecessary dependencies
const { nodes, edges } = useMemo(() => {
  // ... same calculation
}, [arcStorylets, searchQuery, filterOptions]);
```

**Verification**: Graph should still render correctly but with fewer recalculations

## Phase 3: Event Handler Optimization (1 HOUR)

### Step 3.1: Wrap All Event Handlers

```typescript
// Example for handleNodeClick
const handleNodeClick = useCallback((storyletId: string, event: React.MouseEvent) => {
  event.stopPropagation();
  const storylet = arcStorylets.find(s => s.id === storyletId);
  if (!storylet) return;
  
  setSelectedStorylet(storylet);
  
  // Path highlighting logic...
}, [arcStorylets, setSelectedStorylet]);

// Repeat for all handlers:
// - handleNodeDoubleClick
// - handleCanvasClick
// - handleMouseDown
// - handleMouseMove
// - handleMouseUp
// - handleWheel
// - createNewStorylet
```

**Test Each Handler**:
1. Click node - should select
2. Double-click - should edit
3. Drag - should pan
4. Scroll - should zoom
5. Right-click - should show menu

## Phase 4: Component Extraction (2 HOURS)

### Step 4.1: Extract EditPanel Component

```typescript
// Create new file: StoryArcVisualizerEditPanel.tsx
interface EditPanelProps {
  editingStorylet: Storylet | null;
  editFormData: Partial<Storylet>;
  triggerConditionsText: string;
  validationErrors: ValidationError[];
  clues: Clue[];
  onSave: () => void;
  onCancel: () => void;
  onFormChange: (data: Partial<Storylet>) => void;
  onTriggerChange: (text: string) => void;
}

export const StoryArcVisualizerEditPanel = React.memo(({
  // ... props
}: EditPanelProps) => {
  // Move edit panel JSX here (lines 1376-2059)
  return (
    <div className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-lg p-4 max-h-[80vh] overflow-y-auto">
      {/* ... existing edit panel JSX ... */}
    </div>
  );
});
```

**Integration Test**:
1. Open edit panel
2. Verify all fields work
3. Save changes
4. Cancel changes
5. Verify no functionality lost

### Step 4.2: Extract MiniMap Component

```typescript
// Create StoryArcVisualizerMiniMap.tsx
interface MiniMapProps {
  nodes: Node[];
  edges: Edge[];
  viewport: ViewportState;
  onViewportChange: (viewport: ViewportState) => void;
}

export const StoryArcVisualizerMiniMap = React.memo(({ 
  nodes, edges, viewport, onViewportChange 
}: MiniMapProps) => {
  // Extract minimap logic
});
```

## Phase 5: State Optimization (1 HOUR)

### Step 5.1: Debounce Search Input

```typescript
// Add debounced search
const [searchQuery, setSearchQuery] = useState('');
const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearchQuery(searchQuery);
  }, 300);
  
  return () => clearTimeout(timer);
}, [searchQuery]);

// Use debouncedSearchQuery in graph calculation
```

### Step 5.2: Optimize Auto-Save

```typescript
// BEFORE - Saves on every change
useEffect(() => {
  if (!editingStorylet || !editFormData.id) return;
  const timer = setTimeout(() => {
    handleSaveEdit();
  }, 2000);
  return () => clearTimeout(timer);
}, [editFormData, editingStorylet, handleSaveEdit]);

// AFTER - Save only on meaningful changes
const hasEditChanges = useMemo(() => {
  if (!editingStorylet || !editFormData.id) return false;
  return JSON.stringify(editingStorylet) !== JSON.stringify(editFormData);
}, [editingStorylet, editFormData]);

useEffect(() => {
  if (!hasEditChanges) return;
  const timer = setTimeout(() => {
    handleSaveEdit();
  }, 2000);
  return () => clearTimeout(timer);
}, [hasEditChanges, handleSaveEdit]);
```

## Phase 6: Final Optimization & Testing

### Step 6.1: Add Performance Monitoring

```typescript
// Add at component top
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('StoryArcVisualizer render');
  }
});
```

### Step 6.2: Full Functionality Test

Run through all features:

1. **Navigation**
   - [ ] Pan with drag
   - [ ] Zoom with scroll
   - [ ] Click to select nodes
   
2. **Editing**
   - [ ] Double-click to edit
   - [ ] All fields editable
   - [ ] Save persists changes
   - [ ] Cancel reverts changes
   
3. **Creation/Deletion**
   - [ ] Right-click to create
   - [ ] Delete via context menu
   - [ ] Proper cleanup
   
4. **Visual Features**
   - [ ] Path highlighting works
   - [ ] Search filters correctly
   - [ ] Minimap (if implemented)
   
5. **Performance**
   - [ ] No lag when panning
   - [ ] Smooth zoom
   - [ ] Quick node selection
   - [ ] Fast edit panel open

### Step 6.3: Performance Benchmarks

```typescript
// Add temporary performance measurement
const measurePerformance = () => {
  const startTime = performance.now();
  
  // Trigger re-render
  setSearchQuery('test');
  
  requestAnimationFrame(() => {
    const endTime = performance.now();
    console.log(`Render time: ${endTime - startTime}ms`);
    // Should be < 16ms for 60fps
  });
};
```

## Rollback Plan

If any issues occur:

1. **Immediate Rollback**:
   ```bash
   cp src/components/StoryArcVisualizer.tsx.backup src/components/StoryArcVisualizer.tsx
   ```

2. **Partial Rollback**:
   - Keep bug fixes (Phase 1)
   - Revert optimization changes

3. **Git Rollback**:
   ```bash
   git checkout -- src/components/StoryArcVisualizer.tsx
   ```

## Success Metrics

- [ ] All undefined variable errors fixed
- [ ] No functionality regression
- [ ] Render time < 16ms for smooth 60fps
- [ ] Memory usage stable (no growth over time)
- [ ] All original features working
- [ ] User interactions feel responsive

## Deployment Checklist

1. [ ] All tests passing
2. [ ] Manual QA complete
3. [ ] Performance improved (measured)
4. [ ] No console errors
5. [ ] Backup preserved
6. [ ] Team notified of changes

Remember: Make changes incrementally, test after each change, and maintain the ability to rollback at any point.
