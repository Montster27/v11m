// /Users/montysharma/V11M2/src/utils/importResolutionCheck.ts
// Check exactly what's being imported

export const checkImportResolution = () => {
  console.log('🔍 IMPORT RESOLUTION CHECK\n');
  
  // 1. Check if stores are available globally
  console.log('1️⃣ Global Store Availability:');
  console.log('- useAppStore:', typeof (window as any).useAppStore);
  console.log('- useCoreGameStore:', typeof (window as any).useCoreGameStore);
  
  // 2. Try to import dynamically
  console.log('\n2️⃣ Dynamic Import Test:');
  
  // Test old store import
  import('../store/useAppStore').then(module => {
    console.log('Old store module:', module);
    console.log('Has useAppStore?', 'useAppStore' in module);
  }).catch(e => {
    console.log('Old store import error:', e.message);
  });
  
  // Test v2 store import
  import('../stores/v2').then(module => {
    console.log('V2 store module:', module);
    console.log('Has useCoreGameStore?', 'useCoreGameStore' in module);
    
    // Try to use it
    if (module.useCoreGameStore) {
      const state = module.useCoreGameStore.getState();
      console.log('V2 store state:', state.player);
    }
  }).catch(e => {
    console.log('V2 store import error:', e.message);
  });
  
  // 3. Check ResourcePanel's actual usage
  console.log('\n3️⃣ Component Store Usage:');
  
  // Create a marker value in each store
  const marker = Date.now();
  
  if ((window as any).useAppStore) {
    const oldStore = (window as any).useAppStore.getState();
    oldStore.updateResource('money', marker);
    console.log(`Set old store money to: ${marker}`);
  }
  
  if ((window as any).useCoreGameStore) {
    const v2Store = (window as any).useCoreGameStore.getState();
    v2Store.updatePlayer({
      resources: { ...v2Store.player.resources, money: marker + 1000 }
    });
    console.log(`Set V2 store money to: ${marker + 1000}`);
  }
  
  // Check which value appears in UI
  setTimeout(() => {
    const uiText = document.querySelector('#resources')?.textContent || '';
    
    if (uiText.includes(String(marker))) {
      console.log('\n❌ CONFIRMED: ResourcePanel uses OLD store');
      console.log('The import changes did NOT take effect!');
    } else if (uiText.includes(String(marker + 1000))) {
      console.log('\n✅ CONFIRMED: ResourcePanel uses V2 store');
      console.log('The import changes DID take effect!');
    } else {
      console.log('\n❓ Neither value found in UI');
      console.log('UI text sample:', uiText.substring(0, 200));
    }
  }, 300);
  
  // 4. Module cache check
  console.log('\n4️⃣ Module Cache:');
  if (import.meta.hot) {
    console.log('HMR data:', import.meta.hot.data);
  }
};

// The nuclear option - force module reload
export const forceModuleReload = () => {
  console.log('🔄 Forcing module reload...');
  
  if (import.meta.hot) {
    import.meta.hot.invalidate();
    console.log('✅ Invalidated module cache');
  } else {
    console.log('❌ HMR not available');
  }
  
  // Force page reload as last resort
  console.log('Reloading page in 2 seconds...');
  setTimeout(() => {
    window.location.reload();
  }, 2000);
};

// Auto-expose
if (typeof window !== 'undefined') {
  (window as any).checkImportResolution = checkImportResolution;
  (window as any).forceModuleReload = forceModuleReload;
  console.log('🔍 Import resolution check loaded:');
  console.log('- checkImportResolution() - Check what\'s actually imported');
  console.log('- forceModuleReload() - Nuclear option');
}
