// /Users/montysharma/V11M2/src/test/characterFlow/saveSystemDiagnostic.ts
// Comprehensive diagnostic test for character save system

import { useSocialStore, useCoreGameStore, useNarrativeStore } from '../../stores/v2';
import { createCharacterAtomically, resetAllGameState } from '../../utils/characterFlowIntegration';
import { clearAllGameData } from '../../utils/clearAllData';

/**
 * Comprehensive save system diagnostic
 */
export const runSaveSystemDiagnostic = async () => {
  console.log('🩺 SAVE SYSTEM DIAGNOSTIC');
  console.log('=========================\n');
  
  const results: any[] = [];
  const startTime = performance.now();
  
  try {
    // Step 1: Check initial localStorage state
    console.log('1️⃣ Checking localStorage state...');
    const initialLocalStorageKeys = Object.keys(localStorage).filter(key => 
      key.includes('mmv') || key.includes('storylet') || key.includes('character') || 
      key.includes('save') || key.includes('clue') || key.includes('npc')
    );
    
    results.push({
      test: 'Initial localStorage Check',
      success: true,
      data: {
        totalKeys: initialLocalStorageKeys.length,
        keys: initialLocalStorageKeys,
        v2StoreKeys: initialLocalStorageKeys.filter(key => key.includes('mmv'))
      }
    });
    
    // Step 2: Clear all data to start fresh
    console.log('2️⃣ Clearing all game data for clean test...');
    clearAllGameData();
    
    // Wait a moment for storage to clear
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 3: Check stores are properly initialized
    console.log('3️⃣ Checking store initialization...');
    const coreStore = useCoreGameStore.getState();
    const narrativeStore = useNarrativeStore.getState();
    const socialStore = useSocialStore.getState();
    
    results.push({
      test: 'Store Initialization',
      success: true,
      data: {
        coreGame: {
          hasCharacter: !!coreStore.character,
          characterName: coreStore.character.name,
          worldDay: coreStore.world.day,
          playerLevel: coreStore.player.level
        },
        narrative: {
          hasConcerns: Object.keys(narrativeStore.concerns).length > 0,
          hasFlags: narrativeStore.flags.storylet instanceof Map ? narrativeStore.flags.storylet.size : 0
        },
        social: {
          currentSaveId: socialStore.saves.currentSaveId,
          saveSlotCount: Object.keys(socialStore.saves.saveSlots).length,
          hasNPCs: Object.keys(socialStore.npcs.relationships).length > 0
        }
      }
    });
    
    // Step 4: Create a character
    console.log('4️⃣ Creating test character...');
    const testCharacterData = {
      name: 'Save Diagnostic Test',
      background: 'scholar',
      attributes: { 
        intelligence: 80, 
        creativity: 60,
        charisma: 70
      },
      domainAdjustments: { 
        intelligence: 10,
        creativity: -5
      }
    };
    
    createCharacterAtomically(testCharacterData);
    
    // Verify character was created
    const postCreationCore = useCoreGameStore.getState();
    const postCreationNarrative = useNarrativeStore.getState();
    
    results.push({
      test: 'Character Creation',
      success: postCreationCore.character.name === testCharacterData.name,
      data: {
        characterName: postCreationCore.character.name,
        characterBackground: postCreationCore.character.background,
        attributes: postCreationCore.character.attributes,
        concerns: postCreationNarrative.concerns,
        worldDay: postCreationCore.world.day,
        characterCreatedFlag: postCreationNarrative.getStoryletFlag('character_created')
      }
    });
    
    // Step 5: Test localStorage persistence
    console.log('5️⃣ Testing localStorage persistence...');
    await new Promise(resolve => setTimeout(resolve, 200)); // Allow persistence to complete
    
    const persistedKeys = Object.keys(localStorage).filter(key => key.includes('mmv'));
    const persistedData: any = {};
    
    persistedKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        persistedData[key] = {
          hasState: !!data.state,
          version: data.version,
          stateKeys: data.state ? Object.keys(data.state) : []
        };
      } catch (error) {
        persistedData[key] = { error: error.message };
      }
    });
    
    results.push({
      test: 'localStorage Persistence',
      success: persistedKeys.length > 0,
      data: {
        persistedKeys,
        persistedData,
        coreGamePersisted: persistedKeys.includes('mmv-core-game-store'),
        narrativePersisted: persistedKeys.includes('mmv-narrative-store'),
        socialPersisted: persistedKeys.includes('mmv-social-store')
      }
    });
    
    // Step 6: Test save slot creation
    console.log('6️⃣ Testing save slot creation...');
    const testSaveId = 'diagnostic_test_' + Date.now();
    const saveData = {
      name: 'Diagnostic Test Save',
      characterName: postCreationCore.character.name,
      gameDay: postCreationCore.world.day,
      playerLevel: postCreationCore.player.level,
      timestamp: Date.now()
    };
    
    const socialStoreAfterChar = useSocialStore.getState();
    socialStoreAfterChar.createSaveSlot(testSaveId, saveData);
    
    // Verify save slot was created
    const postSaveStore = useSocialStore.getState();
    const saveSlotExists = testSaveId in postSaveStore.saves.saveSlots;
    const saveSlotData = saveSlotExists ? postSaveStore.saves.saveSlots[testSaveId] : null;
    
    results.push({
      test: 'Save Slot Creation',
      success: saveSlotExists,
      data: {
        saveSlotExists,
        saveSlotData,
        currentSaveId: postSaveStore.saves.currentSaveId,
        totalSaveSlots: Object.keys(postSaveStore.saves.saveSlots).length,
        saveHistory: postSaveStore.saves.saveHistory
      }
    });
    
    // Step 7: Test state modification and auto-save triggering
    console.log('7️⃣ Testing state modification...');
    const coreStoreForModification = useCoreGameStore.getState();
    coreStoreForModification.updatePlayer({ level: 5, experience: 1000 });
    coreStoreForModification.updateWorld({ day: 15 });
    
    // Check if modifications took effect
    const modifiedCore = useCoreGameStore.getState();
    
    results.push({
      test: 'State Modification',
      success: modifiedCore.player.level === 5 && modifiedCore.world.day === 15,
      data: {
        playerLevel: modifiedCore.player.level,
        playerExperience: modifiedCore.player.experience,
        worldDay: modifiedCore.world.day,
        characterName: modifiedCore.character.name
      }
    });
    
    // Step 8: Test save slot update
    console.log('8️⃣ Testing save slot update...');
    const updatedSaveData = {
      ...saveData,
      gameDay: modifiedCore.world.day,
      playerLevel: modifiedCore.player.level,
      lastModified: Date.now()
    };
    
    const socialStoreForUpdate = useSocialStore.getState();
    socialStoreForUpdate.updateSaveSlot(testSaveId, updatedSaveData);
    
    const postUpdateStore = useSocialStore.getState();
    const updatedSlot = postUpdateStore.saves.saveSlots[testSaveId];
    
    results.push({
      test: 'Save Slot Update',
      success: !!updatedSlot && updatedSlot.gameDay === 15,
      data: {
        updatedSlot,
        saveHistory: postUpdateStore.saves.saveHistory.slice(-3) // Last 3 entries
      }
    });
    
    // Step 9: Test cross-store data consistency
    console.log('9️⃣ Testing cross-store consistency...');
    const finalCore = useCoreGameStore.getState();
    const finalNarrative = useNarrativeStore.getState();
    const finalSocial = useSocialStore.getState();
    
    const consistency = {
      characterNameConsistent: finalCore.character.name === testCharacterData.name,
      characterCreatedFlagSet: finalNarrative.getStoryletFlag('character_created') === true,
      saveSlotHasCorrectCharacter: finalSocial.saves.saveSlots[testSaveId]?.characterName === testCharacterData.name,
      concernsInitialized: Object.keys(finalNarrative.concerns).length > 0
    };
    
    results.push({
      test: 'Cross-Store Consistency',
      success: Object.values(consistency).every(Boolean),
      data: {
        consistency,
        stores: {
          core: {
            character: finalCore.character,
            player: finalCore.player,
            world: finalCore.world
          },
          narrative: {
            concerns: finalNarrative.concerns,
            characterCreatedFlag: finalNarrative.getStoryletFlag('character_created')
          },
          social: {
            currentSaveId: finalSocial.saves.currentSaveId,
            saveSlotCount: Object.keys(finalSocial.saves.saveSlots).length
          }
        }
      }
    });
    
    // Cleanup
    console.log('🧹 Cleaning up test data...');
    socialStoreForUpdate.deleteSaveSlot(testSaveId);
    
    const totalDuration = performance.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    console.log(`\n✅ DIAGNOSTIC COMPLETE: ${successCount}/${totalCount} tests passed (${totalDuration.toFixed(2)}ms)`);
    
    return {
      success: successCount === totalCount,
      results,
      summary: {
        totalTests: totalCount,
        passedTests: successCount,
        failedTests: totalCount - successCount,
        duration: totalDuration
      }
    };
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    return {
      success: false,
      error: error.message,
      results
    };
  }
};

/**
 * Quick localStorage inspection utility
 */
export const inspectLocalStorage = () => {
  console.log('🔍 LOCALSTORAGE INSPECTION');
  console.log('=========================\n');
  
  const allKeys = Object.keys(localStorage);
  const gameKeys = allKeys.filter(key => 
    key.includes('mmv') || key.includes('storylet') || key.includes('character') || 
    key.includes('save') || key.includes('clue') || key.includes('npc')
  );
  
  console.log(`📊 Total localStorage keys: ${allKeys.length}`);
  console.log(`🎮 Game-related keys: ${gameKeys.length}`);
  
  gameKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      console.log(`\n🔑 ${key}:`);
      console.log(`   Version: ${data.version || 'N/A'}`);
      console.log(`   Has State: ${!!data.state}`);
      if (data.state) {
        console.log(`   State Keys: ${Object.keys(data.state).join(', ')}`);
      }
    } catch (error) {
      console.log(`\n🔑 ${key}: [Parse Error] ${error.message}`);
    }
  });
  
  return {
    totalKeys: allKeys.length,
    gameKeys: gameKeys.length,
    keys: gameKeys
  };
};

// Browser console access
if (typeof window !== 'undefined') {
  (window as any).runSaveSystemDiagnostic = runSaveSystemDiagnostic;
  (window as any).inspectLocalStorage = inspectLocalStorage;
  
  console.log('🩺 Save System Diagnostic loaded');
  console.log('   runSaveSystemDiagnostic() - Full diagnostic test');
  console.log('   inspectLocalStorage() - Quick localStorage inspection');
}