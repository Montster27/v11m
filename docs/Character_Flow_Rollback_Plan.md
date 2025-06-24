# Character Flow Rollback Plan

## Phase 7: Emergency Rollback Procedures

This document provides step-by-step procedures for rolling back the character flow refactoring in case of critical issues that cannot be resolved through normal debugging.

## ⚠️ When to Use This Plan

**Use this rollback plan only when:**
- Critical functionality is completely broken and blocking development
- Data corruption is occurring that cannot be resolved
- Performance has degraded significantly (>500ms operations)
- Multiple test suites are failing consistently
- Save/load system is causing data loss

**Do NOT use this plan for:**
- Minor bugs that can be fixed with patches
- Single test failures
- UI issues that don't affect core functionality
- Temporary performance hiccups

## Rollback Strategy

### Option 1: Selective Rollback (Recommended)
Rollback specific components while keeping successful parts of the refactoring.

### Option 2: Full Rollback (Last Resort)
Complete reversion to pre-refactoring state.

### Option 3: Hybrid Approach
Keep new stores but revert problematic integration points.

## Pre-Rollback Checklist

Before starting any rollback procedure:

1. **Document the Issue**
   ```bash
   # Create issue report
   git log --oneline -10 > issue_context.txt
   echo "Issue Description: [DESCRIBE PROBLEM]" >> issue_context.txt
   echo "Reproduction Steps: [LIST STEPS]" >> issue_context.txt
   echo "Test Results: [PASTE FAILING TESTS]" >> issue_context.txt
   ```

2. **Backup Current State**
   ```bash
   # Create backup branch
   git checkout -b rollback_backup_$(date +%Y%m%d_%H%M%S)
   git add .
   git commit -m "Backup before rollback: $(date)"
   git checkout Dev_UX_Upgrade
   ```

3. **Run Diagnostic Tests**
   ```javascript
   // In browser console
   runAllCharacterCreationTests()
   runAllComprehensiveFlowTests()
   testMemoryStability()
   ```

4. **Capture Current State**
   ```javascript
   // Export current store states for analysis
   console.log('Core Store:', useCoreGameStore.getState())
   console.log('Narrative Store:', useNarrativeStore.getState())
   console.log('Social Store:', useSocialStore.getState())
   ```

## Option 1: Selective Rollback

### 1.1 Rollback Character Creation Component

**If CharacterCreation.tsx is problematic:**

```bash
# Revert to legacy character creation
git checkout HEAD~[X] -- src/pages/CharacterCreation.tsx
git checkout HEAD~[X] -- src/components/CharacterCreation/
```

**Then restore legacy dependencies:**
```bash
# Restore legacy character store
git checkout HEAD~[X] -- src/store/useCharacterStore.ts
```

**Update App.tsx to use legacy store:**
```typescript
// Add back legacy import
import { useCharacterStore } from './store/useCharacterStore';

// Modify character creation route
<Route path="/character-creation" element={<CharacterCreation />} />
```

### 1.2 Rollback Planner Integration

**If Planner.tsx data display is problematic:**

```bash
# Revert planner to legacy stores
git checkout HEAD~[X] -- src/pages/Planner.tsx
```

**Restore specific legacy stores:**
```bash
git checkout HEAD~[X] -- src/store/useAppStore.ts
git checkout HEAD~[X] -- src/store/useStoryletStore.ts
```

### 1.3 Rollback Save System

**If save/load functionality is broken:**

```bash
# Restore legacy save system
git checkout HEAD~[X] -- src/store/useSaveStore.ts
git checkout HEAD~[X] -- src/pages/SplashScreen.tsx
```

**Update components to use legacy save store:**
```typescript
import { useSaveStore } from './store/useSaveStore';
```

## Option 2: Full Rollback

### 2.1 Identify Rollback Point

```bash
# Find commit before refactoring started
git log --oneline --grep="Phase 1" -n 5
git log --oneline --grep="refactor" -n 10

# Or find by date
git log --since="2024-01-01" --until="2024-01-15" --oneline
```

### 2.2 Create Rollback Branch

```bash
# Create new branch from pre-refactoring state
git checkout [COMMIT_HASH_BEFORE_REFACTORING]
git checkout -b emergency_rollback_$(date +%Y%m%d)
```

### 2.3 Selective File Restoration

**Instead of full rollback, restore key files:**

```bash
# Core files to restore
git checkout [PRE_REFACTOR_COMMIT] -- src/pages/SplashScreen.tsx
git checkout [PRE_REFACTOR_COMMIT] -- src/pages/CharacterCreation.tsx
git checkout [PRE_REFACTOR_COMMIT] -- src/pages/Planner.tsx

# Restore all legacy stores
git checkout [PRE_REFACTOR_COMMIT] -- src/store/useAppStore.ts
git checkout [PRE_REFACTOR_COMMIT] -- src/store/useCharacterStore.ts
git checkout [PRE_REFACTOR_COMMIT] -- src/store/useStoryletStore.ts
git checkout [PRE_REFACTOR_COMMIT] -- src/store/useSaveStore.ts
git checkout [PRE_REFACTOR_COMMIT] -- src/store/useNPCStore.ts
git checkout [PRE_REFACTOR_COMMIT] -- src/store/useClueStore.ts

# Restore character flow utilities
git checkout [PRE_REFACTOR_COMMIT] -- src/utils/characterFlow*.ts
```

### 2.4 Clean Up Refactoring Files

```bash
# Remove refactored stores
rm -rf src/stores/v2/
rm -f src/utils/characterFlowIntegration.ts

# Remove refactoring tests
rm -rf src/test/characterFlow/
```

### 2.5 Update App.tsx

```typescript
// Remove refactoring imports
// Remove Phase 6 test imports
// Remove consolidated store imports

// Restore legacy imports
import { useAppStore } from './store/useAppStore';
import { useCharacterStore } from './store/useCharacterStore';
import { useStoryletStore } from './store/useStoryletStore';
import { useSaveStore } from './store/useSaveStore';
```

## Option 3: Hybrid Approach

Keep the new consolidated stores but revert to legacy components.

### 3.1 Keep New Stores

```bash
# Keep the v2 stores
# Keep src/stores/v2/ directory
```

### 3.2 Restore Legacy Components

```bash
# Restore legacy pages
git checkout [PRE_REFACTOR_COMMIT] -- src/pages/SplashScreen.tsx
git checkout [PRE_REFACTOR_COMMIT] -- src/pages/CharacterCreation.tsx
git checkout [PRE_REFACTOR_COMMIT] -- src/pages/Planner.tsx
```

### 3.3 Create Adapter Layer

Create compatibility layer between legacy components and new stores:

```typescript
// src/utils/legacyStoreAdapter.ts
export const adaptLegacyCharacterStore = () => {
  const coreStore = useCoreGameStore.getState();
  return {
    character: coreStore.character,
    updateCharacter: coreStore.updateCharacter,
    // ... map other functions
  };
};
```

## Post-Rollback Procedures

### 1. Verify System Functionality

```javascript
// Test basic functionality
quickValidationTest()
showCurrentState()

// Test character creation
// Test save/load
// Test planner display
```

### 2. Run Full Test Suite

```bash
# If legacy tests exist
npm test

# Or manual testing checklist
# □ Splash screen loads
# □ Character creation works
# □ Save/load functions
# □ Planner displays correctly
# □ No console errors
```

### 3. Update Documentation

```markdown
## Rollback Applied
- Date: [DATE]
- Reason: [REASON]
- Components Rolled Back: [LIST]
- Components Kept: [LIST]
- Known Issues: [LIST]
```

### 4. Create Recovery Plan

```markdown
## Recovery Strategy
1. Fix identified issues in refactoring branch
2. Re-test in isolation
3. Create new integration branch
4. Gradual re-introduction of refactored components
```

## Data Migration During Rollback

### Preserve User Data

```typescript
// Before rollback, export user data
const exportUserData = () => {
  const data = {
    core: useCoreGameStore.getState(),
    narrative: useNarrativeStore.getState(),
    social: useSocialStore.getState(),
    timestamp: Date.now()
  };
  
  // Save to localStorage with emergency key
  localStorage.setItem('mmv_emergency_backup', JSON.stringify(data));
  console.log('User data backed up to emergency key');
};

// After rollback, import to legacy stores
const importToLegacyStores = () => {
  const backup = localStorage.getItem('mmv_emergency_backup');
  if (backup) {
    const data = JSON.parse(backup);
    
    // Map to legacy store format
    useAppStore.setState({
      userLevel: data.core.player.level,
      experience: data.core.player.experience,
      day: data.core.world.day,
      activeCharacter: data.core.character
    });
    
    // Map other stores as needed...
  }
};
```

### Clean Up Orphaned Data

```typescript
// Clean up refactoring-specific localStorage keys
const cleanupRefactoringData = () => {
  const keysToRemove = [
    'mmv-core-game-store',
    'mmv-narrative-store', 
    'mmv-social-store'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
};
```

## Testing After Rollback

### Immediate Tests
```javascript
// Basic functionality
showCurrentState()

// Character creation flow
// 1. Reset to clean state
// 2. Create character
// 3. Verify planner data
// 4. Test save/load
```

### Extended Testing
```bash
# Run any existing test suites
npm test

# Manual testing checklist:
# □ All pages load without errors
# □ Character creation completes
# □ Save and load work
# □ No data corruption
# □ Performance is acceptable
# □ No memory leaks
```

## Communication Plan

### Immediate Notification
```markdown
# Emergency Rollback Notice

**Status**: Character flow refactoring has been rolled back

**Reason**: [SPECIFIC ISSUE]

**Impact**: 
- [WHAT FUNCTIONALITY IS AFFECTED]
- [WHAT STILL WORKS]

**Timeline**:
- Rollback completed: [TIME]
- Fix estimated completion: [TIME]
- Re-deployment planned: [TIME]

**Actions Required**:
- [ANY USER ACTIONS NEEDED]
- [ANY DEVELOPER ACTIONS NEEDED]
```

### Follow-up Report
```markdown
# Rollback Post-Mortem

**Root Cause**: [DETAILED ANALYSIS]

**Prevention Measures**:
- [WHAT WILL BE DONE DIFFERENTLY]
- [ADDITIONAL TESTING NEEDED]
- [PROCESS IMPROVEMENTS]

**Recovery Plan**:
- [STEPS TO RE-IMPLEMENT]
- [ADDITIONAL SAFEGUARDS]
- [TIMELINE FOR RETRY]
```

## Prevention for Future Refactoring

### Improved Testing Strategy
1. **Feature flags**: Implement toggles for refactored components
2. **Parallel implementation**: Keep legacy and new systems side-by-side
3. **Gradual migration**: Component-by-component rollout
4. **Automated testing**: More comprehensive test coverage
5. **User acceptance testing**: Beta testing with real users

### Better Rollback Preparation
1. **Automated rollback scripts**: Create scripts for common rollback scenarios
2. **Data migration tools**: Bidirectional data conversion utilities
3. **Monitoring**: Real-time error tracking and performance monitoring
4. **Feature toggles**: Easy switching between legacy and new implementations

---

**Emergency Contact**: Development Team  
**Last Updated**: Phase 7 implementation  
**Review Date**: After any rollback execution