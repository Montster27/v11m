// /Users/montysharma/V11M2/src/utils/forceStoreUpdate.ts
// Force store updates to diagnose if it's a rendering issue

export const forceStoreUpdate = () => {
  console.log('💪 FORCING Store Updates...\n');
  
  // Get both stores
  const coreStore = (window as any).useCoreGameStore;
  const legacyStore = (window as any).useAppStore;
  
  if (!coreStore) {
    console.error('❌ Core store not found! This is the problem.');
    return;
  }
  
  // Method 1: Direct state update
  console.log('1️⃣ Direct State Update:');
  const state = coreStore.getState();
  console.log('Before:', state.player);
  
  // Update using the store methods
  state.updatePlayer({
    level: 42,
    experience: 4200,
    resources: {
      energy: 100,
      stress: 0,
      money: 99999,
      knowledge: 999,
      social: 999
    }
  });
  
  console.log('After:', coreStore.getState().player);
  
  // Method 2: Force through setState
  console.log('\n2️⃣ Force through setState:');
  coreStore.setState((state: any) => ({
    player: {
      ...state.player,
      level: 55,
      experience: 5500
    }
  }));
  console.log('New state:', coreStore.getState().player);
  
  // Method 3: Subscribe and log changes
  console.log('\n3️⃣ Setting up subscription:');
  const unsubscribe = coreStore.subscribe((state: any) => {
    console.log('🔔 Store changed!', state.player);
  });
  
  // Trigger a change
  setTimeout(() => {
    coreStore.getState().updatePlayer({ level: 77 });
    
    // Check UI after a moment
    setTimeout(() => {
      const resourcePanel = document.querySelector('#resources');
      const panelText = resourcePanel?.textContent || '';
      console.log('\n4️⃣ UI Check:');
      console.log('Panel contains 99999?', panelText.includes('99999'));
      console.log('Panel text sample:', panelText.substring(0, 200));
      
      // Clean up
      unsubscribe();
    }, 500);
  }, 100);
  
  // Method 4: Check if it's a selector issue
  console.log('\n5️⃣ Testing selectors:');
  
  // Create a test component to see if it gets the data
  const testSelector = () => {
    const resources = coreStore((state: any) => state.player.resources);
    console.log('Selector returned:', resources);
    return resources;
  };
  
  try {
    const result = testSelector();
    console.log('Direct selector call:', result);
  } catch (e) {
    console.log('Selector error:', e);
  }
  
  // Method 5: Clear Vite cache
  console.log('\n6️⃣ Suggesting cache clear:');
  console.log('Run these commands:');
  console.log('1. Stop the dev server (Ctrl+C)');
  console.log('2. rm -rf node_modules/.vite');
  console.log('3. npm run dev');
  
  // Method 6: Check imports
  console.log('\n7️⃣ Import check:');
  console.log('Window stores:', {
    coreStore: !!(window as any).useCoreGameStore,
    narrativeStore: !!(window as any).useNarrativeStore,
    socialStore: !!(window as any).useSocialStore,
    legacyAppStore: !!(window as any).useAppStore
  });
};

// Alternative: Complete reset
export const completeStoreReset = () => {
  console.log('🔄 Complete Store Reset...');
  
  // Clear ALL localStorage
  localStorage.clear();
  
  // Clear sessionStorage too
  sessionStorage.clear();
  
  // Clear Zustand stores
  const stores = ['useCoreGameStore', 'useNarrativeStore', 'useSocialStore', 'useAppStore'];
  stores.forEach(storeName => {
    const store = (window as any)[storeName];
    if (store && store.destroy) {
      store.destroy();
      console.log(`Destroyed ${storeName}`);
    }
  });
  
  console.log('✅ All stores cleared. Reloading...');
  setTimeout(() => location.reload(), 1000);
};

// Create visual indicator
export const createStoreMonitor = () => {
  const monitor = document.createElement('div');
  monitor.id = 'store-monitor';
  monitor.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 9999;
    max-width: 300px;
  `;
  
  const updateMonitor = () => {
    const coreStore = (window as any).useCoreGameStore?.getState();
    if (coreStore) {
      monitor.innerHTML = `
        <div style="color: #10b981; font-weight: bold;">V2 Store Monitor</div>
        <div>Level: ${coreStore.player?.level || 'N/A'}</div>
        <div>XP: ${coreStore.player?.experience || 'N/A'}</div>
        <div>Day: ${coreStore.world?.day || 'N/A'}</div>
        <div>Energy: ${coreStore.player?.resources?.energy || 'N/A'}</div>
        <div>Money: $${coreStore.player?.resources?.money || 'N/A'}</div>
        <div style="margin-top: 5px; color: #6b7280; font-size: 10px;">
          Last update: ${new Date().toLocaleTimeString()}
        </div>
      `;
    }
  };
  
  document.body.appendChild(monitor);
  
  // Update every second
  setInterval(updateMonitor, 1000);
  updateMonitor();
  
  console.log('📊 Store monitor added (top right)');
};

// Auto-expose
if (typeof window !== 'undefined') {
  (window as any).forceStoreUpdate = forceStoreUpdate;
  (window as any).completeStoreReset = completeStoreReset;
  (window as any).createStoreMonitor = createStoreMonitor;
  
  console.log('💪 Force update tools loaded:');
  console.log('- forceStoreUpdate() - Force store changes');
  console.log('- completeStoreReset() - Nuclear option');
  console.log('- createStoreMonitor() - Visual monitor');
  
  // Auto-create monitor in dev
  setTimeout(() => {
    if (import.meta.env.DEV) {
      createStoreMonitor();
    }
  }, 2000);
}
