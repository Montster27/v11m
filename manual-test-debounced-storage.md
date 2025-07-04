# Manual Testing Protocol for Debounced Storage

## Prerequisites
1. Development server is running at http://localhost:5173/
2. Open browser console (F12)
3. Navigate to the application

## Test Sequence

### Test 1: Rapid State Changes Debouncing
```javascript
// In browser console:

// Monitor localStorage writes
let writeCount = 0;
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  if (key.includes('mmv-')) {
    writeCount++;
    console.log(`📀 Write #${writeCount}: ${key}`);
  }
  return originalSetItem.call(this, key, value);
};

// Make 10 rapid resource changes
for (let i = 0; i < 10; i++) {
  useCoreGameStore.getState().updateResource('money', 1);
}

// Wait and check results
setTimeout(() => {
  console.log(`Total writes: ${writeCount} (should be ≤1 due to debouncing)`);
  localStorage.setItem = originalSetItem; // restore
}, 2000);
```

### Test 2: AutoSaveIndicator Status
```javascript
// Make a change and watch the indicator
useCoreGameStore.getState().updateResource('energy', 5);

// Check indicator element
const indicator = document.querySelector('.autosave-indicator');
console.log('Indicator text:', indicator?.textContent);
```

### Test 3: Storage Statistics
```javascript
// Check debounced storage stats
if (window.debouncedStorage) {
  console.log('Storage stats:', window.debouncedStorage.getStats());
}
```

### Test 4: Force Flush
```javascript
// Make changes
useCoreGameStore.getState().updateResource('money', 100);
useNarrativeStore.getState().setStoryletFlag('test_flag', 'test_value');

// Check pending writes
console.log('Before flush:', window.debouncedStorage.getStats());

// Force flush
window.debouncedStorage.flush();

// Check after flush
setTimeout(() => {
  console.log('After flush:', window.debouncedStorage.getStats());
}, 100);
```

### Test 5: Complete Test Suite
```javascript
// Run the automated test script
// First, load the test script in console, then:
runDebouncedStorageTests();
```

## Expected Results

1. **Debouncing**: Multiple rapid changes should result in only 1 localStorage write per store
2. **AutoSaveIndicator**: Should show "Saving..." then "Saved" status
3. **Statistics**: pendingWrites should decrease to 0 after flush
4. **Performance**: No noticeable lag during rapid state changes
5. **Persistence**: Changes should be saved and recoverable

## Success Criteria

✅ Debouncing reduces localStorage writes by ~90%
✅ AutoSaveIndicator updates in real-time
✅ No memory leaks or performance issues
✅ State persists correctly across page reloads
✅ Force flush works immediately

## Error Scenarios to Test

- Storage quota exceeded
- Multiple subscribers to save events
- Page unload during pending writes
- Rapid subscribe/unsubscribe cycles