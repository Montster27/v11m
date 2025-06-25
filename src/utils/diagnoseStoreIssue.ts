// /Users/montysharma/V11M2/src/utils/diagnoseStoreIssue.ts
// Advanced diagnostic tool to find the real root cause

export const diagnoseStoreIssue = () => {
  console.log('🔍 DEEP DIAGNOSIS: Finding the REAL root cause...\n');
  
  // 1. Check React version and StrictMode
  console.log('1️⃣ React Environment:');
  console.log('   - React Version:', (window as any).React?.version || 'Unknown');
  console.log('   - StrictMode:', document.querySelector('#root')?.innerHTML.includes('StrictMode') ? 'Enabled' : 'Disabled');
  
  // 2. Check if stores are actually singleton instances
  console.log('\n2️⃣ Store Instance Check:');
  const coreStore1 = (window as any).useCoreGameStore;
  const coreStore2 = (window as any).useCoreGameStore;
  console.log('   - Same instance?', coreStore1 === coreStore2 ? '✅ Yes' : '❌ No');
  
  // 3. Test direct store updates
  console.log('\n3️⃣ Testing Direct Store Updates:');
  const testDirectUpdate = () => {
    const store = (window as any).useCoreGameStore?.getState();
    if (store) {
      console.log('   - Before update:', { 
        level: store.player?.level,
        resources: store.player?.resources
      });
      
      // Update directly
      store.updatePlayer({ 
        level: 99,
        resources: { 
          energy: 100, 
          stress: 0, 
          money: 9999,
          knowledge: 500,
          social: 500
        } 
      });
      
      // Check immediately
      const afterUpdate = (window as any).useCoreGameStore?.getState();
      console.log('   - After update:', { 
        level: afterUpdate.player?.level,
        resources: afterUpdate.player?.resources
      });
      
      // Check if UI updated
      setTimeout(() => {
        const resourcePanelText = document.querySelector('#resources')?.textContent || '';
        console.log('   - UI shows level 99?', resourcePanelText.includes('99') ? '✅ Yes' : '❌ No');
        console.log('   - UI shows money $9999?', resourcePanelText.includes('9999') ? '✅ Yes' : '❌ No');
      }, 100);
    }
  };
  testDirectUpdate();
  
  // 4. Check component subscriptions
  console.log('\n4️⃣ Component Store Subscriptions:');
  const checkSubscriptions = () => {
    // Get all Zustand subscriptions
    const coreStore = (window as any).useCoreGameStore;
    if (coreStore) {
      const listeners = coreStore.getState().listeners || [];
      console.log('   - Active subscriptions:', listeners.length);
      console.log('   - Store subscribe method exists?', typeof coreStore.subscribe === 'function' ? '✅ Yes' : '❌ No');
    }
  };
  checkSubscriptions();
  
  // 5. Check for module loading issues
  console.log('\n5️⃣ Module Loading Check:');
  console.log('   - ResourcePanel loaded?', document.querySelector('#resources') ? '✅ Yes' : '❌ No');
  console.log('   - TimeAllocation loaded?', document.querySelector('#time-allocation') ? '✅ Yes' : '❌ No');
  
  // 6. Check localStorage persistence
  console.log('\n6️⃣ Persistence Check:');
  const v2Data = localStorage.getItem('mmv-core-game-store');
  if (v2Data) {
    try {
      const parsed = JSON.parse(v2Data);
      console.log('   - Persisted state:', parsed.state);
      console.log('   - Version:', parsed.version);
    } catch (e) {
      console.log('   - ❌ Failed to parse persisted data');
    }
  } else {
    console.log('   - ❌ No persisted V2 data found');
  }
  
  // 7. Force React re-render test
  console.log('\n7️⃣ React Re-render Test:');
  const forceRerender = () => {
    const root = document.getElementById('root');
    if (root) {
      // Try to force React to re-render
      const event = new Event('storage');
      window.dispatchEvent(event);
      console.log('   - Dispatched storage event');
      
      // Also try updating through Zustand's API
      const store = (window as any).useCoreGameStore;
      if (store) {
        store.setState({});
        console.log('   - Forced empty setState');
      }
    }
  };
  forceRerender();
  
  // 8. Check if it's a selector issue
  console.log('\n8️⃣ Selector Reference Check:');
  console.log('   - Testing selector stability...');
  const testSelectors = () => {
    const store = (window as any).useCoreGameStore;
    if (store) {
      const selector1 = (state: any) => state.player.resources;
      const selector2 = (state: any) => state.player.resources;
      const result1 = selector1(store.getState());
      const result2 = selector2(store.getState());
      console.log('   - Same selector results?', result1 === result2 ? '✅ Yes' : '❌ No');
      console.log('   - Result 1:', result1);
      console.log('   - Result 2:', result2);
    }
  };
  testSelectors();
  
  console.log('\n🔍 Diagnosis complete. Check results above for clues.');
};

// Create a visual test button
export const createDiagnosticButton = () => {
  const button = document.createElement('button');
  button.textContent = '🔍 Run Deep Diagnosis';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    background: #dc2626;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    border: none;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  `;
  button.onclick = diagnoseStoreIssue;
  document.body.appendChild(button);
  console.log('🔍 Diagnostic button added to page (bottom right)');
};

// Auto-expose to window
if (typeof window !== 'undefined') {
  (window as any).diagnoseStoreIssue = diagnoseStoreIssue;
  (window as any).createDiagnosticButton = createDiagnosticButton;
  
  // Auto-create button in dev
  setTimeout(() => {
    if (import.meta.env.DEV) {
      createDiagnosticButton();
    }
  }, 2000);
  
  console.log('🔍 Deep Diagnostic Tool loaded. Run: diagnoseStoreIssue()');
}
