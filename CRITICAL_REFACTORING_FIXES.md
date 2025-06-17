# Critical Refactoring Fixes - Security & Performance Improvements

Based on the comprehensive zen code review, these critical issues have been identified and fixed:

## 🔴 **Critical Issues Fixed**

### 1. Race Conditions from setTimeout Pattern ✅ FIXED
**Problem**: Using `setTimeout` to trigger storylet evaluation created unpredictable timing and potential missed evaluations

**Locations Fixed**:
- `useAppStore.ts` - resource update triggers (lines 293-301)
- `useAppStore.ts` - day change triggers (lines 496-518)
- `useStoryletStore.ts` - multiple re-evaluation timeouts (8+ instances)

**Solution Implemented**:
- Created `useGameOrchestrator` hook for reactive state coordination
- Replaced setTimeout patterns with useEffect orchestration
- Added reactive auto-save hook replacing setTimeout-based auto-save

### 2. Global Window Object Security Risk ✅ PARTIALLY FIXED
**Problem**: Stores and functions exposed on `window` object breaks encapsulation and creates security vulnerabilities

**Locations Fixed**:
- `App.tsx` - Removed window-based notification functions (lines 44-59)
- `App.tsx` - Removed direct window store assignments

**Solution Implemented**:
- Added reactive notification state to storylet store
- Created `useStoryletNotifications` hook for reactive event management
- Replaced imperative window calls with declarative React patterns

**Remaining Work**:
- Some legacy window assignments may still exist in other files
- Need to audit and remove remaining window-based store access

## 🟠 **High Priority Issues Fixed**

### 3. Imperative State Updates Breaking React Model ✅ FIXED
**Problem**: Direct state setter calls via window functions bypassed React's declarative model

**Solution**:
- Implemented reactive notification system through Zustand store state
- UI components now subscribe to state changes via hooks
- Eliminated imperative function calls through window object

### 4. Hidden Store Dependencies ✅ PARTIALLY FIXED
**Problem**: Tight coupling between stores via window object access

**Solution**:
- Created orchestrator hook pattern for explicit store coordination
- Removed setTimeout-based cross-store communication
- Implemented proper import-based store access where needed

## 📋 **Files Modified**

### New Files Created:
1. `/src/hooks/useGameOrchestrator.ts` - Reactive store coordination
2. `/src/hooks/useAutoSave.ts` - Reactive auto-save system

### Modified Files:
1. `/src/App.tsx` - Removed window assignments, added reactive hooks
2. `/src/store/useAppStore.ts` - Removed setTimeout patterns
3. `/src/store/useStoryletStore.ts` - Added notification state, removed timeouts

## 🛠 **Technical Implementation Details**

### Reactive Orchestration Pattern
```typescript
// Before (Race Condition Risk)
setTimeout(() => {
  (window as any).useStoryletStore.getState().evaluateStorylets();
}, 100);

// After (Reactive & Safe)
useEffect(() => {
  if (hasStateChanged) {
    evaluateStorylets();
  }
}, [relevantState, evaluateStorylets]);
```

### Reactive Notifications
```typescript
// Before (Imperative & Insecure)
(window as any).showClueNotification = (clueResult) => {
  setClueNotification(clueResult);
};

// After (Reactive & Declarative)
const newlyDiscoveredClue = useStoryletStore(state => state.newlyDiscoveredClue);
useEffect(() => {
  if (newlyDiscoveredClue) {
    setClueNotification({ clue: newlyDiscoveredClue, isVisible: true });
  }
}, [newlyDiscoveredClue]);
```

## 🎯 **Benefits Achieved**

1. **Eliminated Race Conditions**: Reactive patterns ensure consistent state updates
2. **Improved Security**: Removed global window object exposure
3. **Better Performance**: Eliminated unnecessary timeout delays
4. **Enhanced Maintainability**: Clear dependency relationships between stores
5. **React Best Practices**: Proper declarative patterns throughout

## 🔄 **Reactive Flow Architecture**

```
App Store State Change → useGameOrchestrator → Storylet Evaluation
                     ↗                    ↘
    User Action → State Update → useEffect → Reactive Update
                     ↘                    ↗
           Auto-save → useAutoSave → Save Store Update
```

## 🧪 **Testing Status**

- ✅ Build compiles without TypeScript errors
- ✅ No runtime errors in development
- ⏳ Need integration testing to verify storylet evaluation timing
- ⏳ Need to test notification system functionality

## 🚧 **Remaining Work**

1. **Complete Window Object Removal**: Audit remaining files for window assignments
2. **Store Decoupling**: Remove any remaining cross-store window access
3. **Error Boundaries**: Add comprehensive error handling for reactive patterns
4. **Integration Testing**: Verify all game mechanics work with new reactive system

## 💡 **Next Steps**

1. Test the application thoroughly to ensure reactive patterns work correctly
2. Remove any remaining window object assignments in other components
3. Consider breaking down large store files into smaller focused modules
4. Add comprehensive error boundaries for the reactive system

---

This refactoring addresses the most critical security and performance issues identified in the codebase review, establishing a more robust and maintainable architecture.