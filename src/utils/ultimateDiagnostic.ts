// /Users/montysharma/V11M2/src/utils/ultimateDiagnostic.ts
// The ultimate diagnostic to find the real issue

export const ultimateDiagnostic = () => {
  console.log('🔬 ULTIMATE DIAGNOSTIC - Finding the REAL issue...\n');
  
  // 1. Check what ResourcePanel is actually using
  console.log('1️⃣ ResourcePanel Store Check:');
  const resourcePanel = document.querySelector('#resources');
  if (resourcePanel) {
    // Check if old store is being used by looking for specific patterns
    const panelHTML = resourcePanel.innerHTML;
    console.log('   - Panel found: ✅');
    console.log('   - Contains "Resources" title:', panelHTML.includes('Resources'));
    
    // Try to trigger an update through the old store
    const oldStore = (window as any).useAppStore;
    if (oldStore) {
      const state = oldStore.getState();
      console.log('   - Old store state:', {
        energy: state.resources?.energy,
        money: state.resources?.money
      });
      
      // Update old store
      state.updateResource('money', 12345);
      
      setTimeout(() => {
        const updatedHTML = document.querySelector('#resources')?.innerHTML || '';
        console.log('   - After old store update, shows 12345?', updatedHTML.includes('12345'));
      }, 100);
    }
  } else {
    console.log('   - Panel NOT FOUND! ❌');
  }
  
  // 2. Check V2 store
  console.log('\n2️⃣ V2 Store Check:');
  const v2Store = (window as any).useCoreGameStore;
  if (v2Store) {
    console.log('   - V2 store exists: ✅');
    const state = v2Store.getState();
    console.log('   - V2 state:', {
      level: state.player?.level,
      resources: state.player?.resources
    });
    
    // Update V2 store
    state.updatePlayer({
      resources: { ...state.player.resources, money: 67890 }
    });
    
    setTimeout(() => {
      const updatedHTML = document.querySelector('#resources')?.innerHTML || '';
      console.log('   - After V2 store update, shows 67890?', updatedHTML.includes('67890'));
    }, 200);
  } else {
    console.log('   - V2 store NOT FOUND! ❌');
  }
  
  // 3. Check actual imports
  console.log('\n3️⃣ Module Import Check:');
  
  // Create a test to see which store ResourcePanel is using
  const testImport = async () => {
    try {
      // Check if the module is cached
      const moduleCache = (window as any).__modules;
      console.log('   - Module cache exists?', !!moduleCache);
      
      // Check Vite's module graph
      if (import.meta.hot) {
        console.log('   - Vite HMR active: ✅');
        console.log('   - Import meta URL:', import.meta.url);
      } else {
        console.log('   - Vite HMR NOT active: ❌');
      }
    } catch (e) {
      console.log('   - Module check error:', e);
    }
  };
  testImport();
  
  // 4. The smoking gun test
  console.log('\n4️⃣ SMOKING GUN TEST:');
  console.log('Checking which store updates actually change the UI...');
  
  let oldStoreWorks = false;
  let v2StoreWorks = false;
  
  // Test 1: Update old store with unique value
  if ((window as any).useAppStore) {
    const oldStore = (window as any).useAppStore.getState();
    oldStore.updateResource('money', 11111);
    
    setTimeout(() => {
      const html = document.querySelector('#resources')?.textContent || '';
      if (html.includes('11111')) {
        oldStoreWorks = true;
        console.log('   🚨 OLD STORE IS STILL BEING USED! 🚨');
      }
      
      // Test 2: Update V2 store with unique value
      if ((window as any).useCoreGameStore) {
        const v2Store = (window as any).useCoreGameStore.getState();
        v2Store.updatePlayer({
          resources: { ...v2Store.player.resources, money: 22222 }
        });
        
        setTimeout(() => {
          const html2 = document.querySelector('#resources')?.textContent || '';
          if (html2.includes('22222')) {
            v2StoreWorks = true;
            console.log('   ✅ V2 STORE IS BEING USED!');
          }
          
          // Final verdict
          console.log('\n📊 FINAL VERDICT:');
          if (oldStoreWorks && !v2StoreWorks) {
            console.log('❌ Components are STILL using OLD stores!');
            console.log('🔧 The code changes were NOT applied!');
            console.log('🚨 This is a BUILD/CACHE issue, not a code issue!');
          } else if (!oldStoreWorks && v2StoreWorks) {
            console.log('✅ Components ARE using V2 stores correctly!');
          } else if (oldStoreWorks && v2StoreWorks) {
            console.log('⚠️ BOTH stores are being used - mixed state!');
          } else {
            console.log('❓ Neither store is updating the UI - rendering issue!');
          }
        }, 300);
      }
    }, 100);
  }
  
  // 5. Browser cache check
  console.log('\n5️⃣ Cache Status:');
  if ('caches' in window) {
    caches.keys().then(names => {
      console.log('   - Cache Storage names:', names);
      if (names.length > 0) {
        console.log('   ⚠️ Found caches! These might be serving old code.');
      }
    });
  }
  
  // Performance entries
  const resources = performance.getEntriesByType('resource');
  const jsFiles = resources.filter(r => r.name.includes('.js'));
  console.log('   - JS files loaded:', jsFiles.length);
  jsFiles.slice(0, 3).forEach(file => {
    console.log(`   - ${file.name.split('/').pop()}: ${file.transferSize === 0 ? 'CACHED' : 'FRESH'}`);
  });
};

// Auto-expose
if (typeof window !== 'undefined') {
  (window as any).ultimateDiagnostic = ultimateDiagnostic;
  console.log('🔬 Ultimate diagnostic loaded. Run: ultimateDiagnostic()');
  console.log('This will definitively tell you if the code changes are applied.');
}
