// /Users/montysharma/V11M2/src/test/characterFlow/saveLoadTest.ts
// Quick test for save/load functionality

import { useSocialStore, useCoreGameStore, useNarrativeStore } from '../../stores/v2';
import { createCharacterAtomically } from '../../utils/characterFlowIntegration';

export const testSaveLoadFunctionality = () => {
  console.log('🧪 Testing Save/Load Functionality...');
  
  try {
    // Step 1: Create a character
    console.log('1️⃣ Creating test character...');
    createCharacterAtomically({
      name: 'Save Test Character',
      background: 'scholar',
      attributes: { intelligence: 90 },
      domainAdjustments: { intellectualCompetence: 10 }
    });
    
    // Step 2: Create a save
    console.log('2️⃣ Creating save slot...');
    const socialStore = useSocialStore.getState();
    const testSaveId = 'test_save_' + Date.now();
    
    socialStore.createSaveSlot(testSaveId, {
      name: 'Test Save',
      gameDay: useCoreGameStore.getState().world.day,
      characterName: 'Save Test Character',
      playerLevel: useCoreGameStore.getState().player.level
    });
    
    // Step 3: Check if save was created
    const saveExists = testSaveId in socialStore.saves.saveSlots;
    console.log('3️⃣ Save created:', saveExists);
    
    if (saveExists) {
      const saveData = socialStore.saves.saveSlots[testSaveId];
      console.log('   Save data:', {
        id: saveData.id,
        name: saveData.name,
        hasCore: !!saveData.coreGameState,
        hasNarrative: !!saveData.narrativeState,
        hasSocial: !!saveData.socialState
      });
    }
    
    // Step 4: Modify some data
    console.log('4️⃣ Modifying game state...');
    const coreStore = useCoreGameStore.getState();
    coreStore.updatePlayer({ level: 5, experience: 450 });
    coreStore.updateWorld({ day: 10 });
    
    // Step 5: Load the save
    console.log('5️⃣ Loading save...');
    socialStore.loadSaveSlot(testSaveId);
    
    // Step 6: Verify state was restored
    const restoredCore = useCoreGameStore.getState();
    const wasRestored = restoredCore.player.level === 1 && restoredCore.world.day === 1;
    console.log('6️⃣ State restored:', wasRestored);
    console.log('   Current state:', {
      level: restoredCore.player.level,
      day: restoredCore.world.day,
      characterName: restoredCore.character.name
    });
    
    // Cleanup
    socialStore.deleteSaveSlot(testSaveId);
    
    return {
      success: saveExists && wasRestored,
      details: {
        saveCreated: saveExists,
        stateRestored: wasRestored
      }
    };
    
  } catch (error) {
    console.error('❌ Save/Load test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Browser console access
if (typeof window !== 'undefined') {
  (window as any).testSaveLoadFunctionality = testSaveLoadFunctionality;
  console.log('🧪 Save/Load Test loaded');
  console.log('   testSaveLoadFunctionality() - Test save/load system');
}