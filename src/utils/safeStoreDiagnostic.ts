// /Users/montysharma/V11M2/src/utils/safeStoreDiagnostic.ts
// Safe diagnostic that won't trigger app errors

export const safeStoreDiagnostic = () => {
  console.log('🔍 SAFE STORE DIAGNOSTIC\n');
  
  try {
    // 1. Check which stores exist
    console.log('1️⃣ Available Stores:');
    const stores = {
      oldAppStore: !!(window as any).useAppStore,
      v2CoreStore: !!(window as any).useCoreGameStore,
      v2NarrativeStore: !!(window as any).useNarrativeStore,
      v2SocialStore: !!(window as any).useSocialStore
    };
    console.log(stores);
    
    // 2. Check current values without triggering updates
    console.log('\n2️⃣ Current Store Values:');
    
    if (stores.oldAppStore) {
      const oldState = (window as any).useAppStore.getState();
      console.log('Old Store:', {
        money: oldState.resources?.money,
        energy: oldState.resources?.energy,
        day: oldState.day
      });
    }
    
    if (stores.v2CoreStore) {
      const v2State = (window as any).useCoreGameStore.getState();
      console.log('V2 Store:', {
        money: v2State.player?.resources?.money,
        energy: v2State.player?.resources?.energy,
        day: v2State.world?.day
      });
    }
    
    // 3. Safe UI check
    console.log('\n3️⃣ UI Content Check:');
    const resourcePanel = document.querySelector('#resources');
    if (resourcePanel) {
      const text = resourcePanel.textContent || '';
      // Extract money value from UI
      const moneyMatch = text.match(/\$(\d+(\.\d+)?)/);
      const energyMatch = text.match(/Energy:.*?(\d+(\.\d+)?)/);
      
      console.log('UI Shows:');
      console.log('- Money:', moneyMatch ? moneyMatch[1] : 'Not found');
      console.log('- Energy:', energyMatch ? energyMatch[1] : 'Not found');
    }
    
    // 4. The safe test - only update money
    console.log('\n4️⃣ Safe Update Test:');
    console.log('Setting money to 55555 in both stores...');
    
    let oldStoreUpdated = false;
    let v2StoreUpdated = false;
    
    // Update old store
    if (stores.oldAppStore) {
      try {
        const state = (window as any).useAppStore.getState();
        if (state.updateResource) {
          state.updateResource('money', 55555);
          oldStoreUpdated = true;
          console.log('✅ Old store updated');
        }
      } catch (e) {
        console.log('❌ Old store update failed:', e.message);
      }
    }
    
    // Update V2 store
    if (stores.v2CoreStore) {
      try {
        const state = (window as any).useCoreGameStore.getState();
        if (state.updatePlayer) {
          state.updatePlayer({
            resources: {
              ...state.player.resources,
              money: 55555
            }
          });
          v2StoreUpdated = true;
          console.log('✅ V2 store updated');
        }
      } catch (e) {
        console.log('❌ V2 store update failed:', e.message);
      }
    }
    
    // Check UI after a moment
    setTimeout(() => {
      const panel = document.querySelector('#resources');
      if (panel) {
        const text = panel.textContent || '';
        const shows55555 = text.includes('55555');
        
        console.log('\n📊 RESULT:');
        if (shows55555) {
          if (oldStoreUpdated && !v2StoreUpdated) {
            console.log('❌ ResourcePanel is STILL using OLD store (useAppStore)');
            console.log('🔧 The component updates were NOT applied!');
          } else if (!oldStoreUpdated && v2StoreUpdated) {
            console.log('✅ ResourcePanel IS using V2 store (useCoreGameStore)');
            console.log('🎉 The component updates WERE applied successfully!');
          } else if (oldStoreUpdated && v2StoreUpdated) {
            console.log('⚠️ Both stores were updated - inconclusive');
          }
        } else {
          console.log('❓ UI did not update - possible rendering issue');
          console.log('Try refreshing the page and running again');
        }
      }
    }, 500);
    
  } catch (error) {
    console.error('Diagnostic error:', error);
  }
};

// Quick check function
export const quickStoreCheck = () => {
  const oldStore = (window as any).useAppStore?.getState();
  const v2Store = (window as any).useCoreGameStore?.getState();
  
  console.log('Quick Check:');
  console.log('Old Store Money:', oldStore?.resources?.money);
  console.log('V2 Store Money:', v2Store?.player?.resources?.money);
  console.log('UI Money:', document.querySelector('#resources')?.textContent?.match(/\$(\d+)/)?.[1]);
};

// Auto-expose
if (typeof window !== 'undefined') {
  (window as any).safeStoreDiagnostic = safeStoreDiagnostic;
  (window as any).quickStoreCheck = quickStoreCheck;
  console.log('🔍 Safe diagnostic loaded:');
  console.log('- safeStoreDiagnostic() - Full safe diagnostic');
  console.log('- quickStoreCheck() - Quick value check');
}
