# Codebase Review Report

## Summary
This review analyzed the V11M2 codebase for duplicate code patterns, orphaned systems, import errors, and circular dependencies.

## 1. Duplicate Code Patterns

### A. Debounce/Throttle Implementations
- **Found in**: Multiple locations implementing similar functionality
  - `/src/utils/debounce.ts` - Complete implementation with debounce, throttle, and AsyncQueue
  - `/src/utils/debouncedStorage.ts` - Separate debounced storage implementation
  - Multiple components using inline debounce logic

**Recommendation**: Consolidate all debounce/throttle logic to use the utility in `/src/utils/debounce.ts`

### B. Store Creation Patterns
- **Duplicate patterns**: 
  - `/src/utils/createManagedStore.ts` - Wrapper for migration handling
  - Multiple stores using different create patterns
  - V2 stores in `/src/stores/v2/` partially duplicate functionality

**Recommendation**: Complete migration to a single store pattern, remove createManagedStore after migration

### C. Character Type Definitions
- **Duplicates found**:
  - `/src/types/character.ts` - Basic character types
  - `/src/types/integratedCharacter.ts` - Extended character system
  - Inline character interfaces in stores

**Recommendation**: Consolidate into a single character type system

## 2. Orphaned/Unused Code

### A. Test Utilities
- `/src/utils/reliabilityTest.ts` - Only imported by itself
- `/src/utils/clueSystemTest.ts` - Only imported by limited components
- `/src/utils/quickBalanceTools.ts` - Limited usage

### B. Legacy Components
- `/src/pages/PlannerOriginal.tsx` - Backup of original planner, not actively used
- `/src/components/RefactorNotificationBanner.tsx` - Temporary refactor notification
- `/src/utils/legacyCleanup.ts` - Cleanup utility that may no longer be needed

### C. Migration/Backup Files
- `/src/utils/refactorBackup.ts`
- `/src/utils/preRefactorBackup.ts`
- `/src/utils/rollbackPlan.ts`

**Recommendation**: Remove these files after confirming they're no longer needed

## 3. Import Errors
- **TypeScript Compilation**: ✅ No import errors detected
- All imports resolve correctly

## 4. Circular Dependencies

### A. Store Dependencies
Found potential circular dependency pattern:
- `useAppStore` references `useStoryletStore` (via window global)
- Several stores import from `useAppStore`:
  - `useClueStore.ts`
  - `useStoryletStore.ts`
  - `useSaveStore.ts`
  - `integratedCharacterStore.ts`

**Risk**: This creates tight coupling between stores

### B. Global Window References
Multiple stores expose themselves globally:
```typescript
(window as any).useAppStore = useAppStore;
```

**Risk**: This pattern can lead to hidden dependencies and testing difficulties

## 5. Additional Issues

### A. Inconsistent Save Patterns
- Some stores use `persist` middleware directly
- Others use `debouncedStorage`
- V2 stores have their own persistence approach

### B. Development-Only Code in Production
Multiple files have development-only code that should be stripped in production:
- Console logs
- Window globals
- Debug utilities

### C. Type Safety Issues
- Use of `any` types in several places
- Loose typing on window globals
- Some stores using Record<string, any> instead of proper types

## Recommendations

### Immediate Actions
1. **Remove orphaned test files** that are no longer used
2. **Consolidate duplicate utilities** (debounce, throttle)
3. **Remove legacy backup files** after confirming migration success

### Short-term Improvements
1. **Refactor circular dependencies** between stores
2. **Consolidate character type definitions**
3. **Standardize save/persistence patterns**

### Long-term Architecture
1. **Complete V2 store migration** and remove legacy stores
2. **Remove global window references** in favor of proper imports
3. **Implement proper dependency injection** for store dependencies
4. **Add automated checks** for circular dependencies and unused code

## File Cleanup List

### Safe to Remove (after verification):
- `/src/pages/PlannerOriginal.tsx`
- `/src/utils/legacyCleanup.ts`
- `/src/utils/refactorBackup.ts`
- `/src/utils/preRefactorBackup.ts`
- `/src/utils/rollbackPlan.ts`
- `/src/components/RefactorNotificationBanner.tsx`
- `/src/utils/createManagedStore.ts` (after migration complete)

### Needs Consolidation:
- Character types (character.ts vs integratedCharacter.ts)
- Debounce utilities
- Store creation patterns

### Needs Refactoring:
- Circular dependencies in stores
- Global window references
- V2 store migration completion