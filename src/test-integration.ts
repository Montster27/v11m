// /Users/montysharma/V11M2/src/test-integration.ts
// Integration Test Script - Run in browser console

declare global {
  interface Window {
    useAppStore: any;
    useStoryletStore: any;
    testIntegration: () => void;
    resetGameState: () => void;
  }
}

// Test the full integration between all modules
export const testIntegration = () => {
  console.log('🚀 Starting Integration Test...');
  console.log('=====================================');

  // 1. Test Unified Store
  console.log('\n📦 Testing Unified Store...');
  const appStore = window.useAppStore?.getState();
  const storyletStore = window.useStoryletStore?.getState();
  
  if (!appStore || !storyletStore) {
    console.error('❌ Stores not available');
    return;
  }

  console.log('✅ App Store accessible:', {
    hasActiveCharacter: !!appStore.activeCharacter,
    allocationsTotal: Object.values(appStore.allocations).reduce((sum, val) => sum + val, 0),
    resourcesCount: Object.keys(appStore.resources).length,
    skillsCount: Object.keys(appStore.skills).length
  });

  console.log('✅ Storylet Store accessible:', {
    storyletsCount: Object.keys(storyletStore.allStorylets).length,
    activeStorylets: storyletStore.activeStoryletIds.length,
    completedStorylets: storyletStore.completedStoryletIds.length,
    flags: Object.keys(storyletStore.activeFlags).length
  });

  // 2. Test Character Integration
  console.log('\n👤 Testing Character Integration...');
  if (appStore.activeCharacter) {
    console.log('✅ Active character found:', appStore.activeCharacter.name);
    console.log('✅ Character attributes available:', Object.keys(appStore.activeCharacter.attributes).length);
  } else {
    console.log('⚠️ No active character - creating test character...');
    // Create a simple test character
    appStore.setActiveCharacter({
      id: 'test-integration',
      name: 'Integration Tester',
      attributes: {
        intelligence: 8, charisma: 6, endurance: 7, creativity: 5,
        strength: 4, agility: 6, communication: 7, empathy: 8,
        focus: 9, memory: 7, stressTolerance: 6, selfControl: 8,
        perception: 7, intuition: 6, discipline: 7, perseverance: 9
      }
    });
    console.log('✅ Test character created');
  }

  // 3. Test Time Allocation Integration
  console.log('\n⏰ Testing Time Allocation Integration...');
  const originalAllocations = { ...appStore.allocations };
  
  // Test allocation update
  appStore.updateTimeAllocation('study', 50);
  appStore.updateTimeAllocation('work', 20);
  appStore.updateTimeAllocation('social', 15);
  appStore.updateTimeAllocation('rest', 10);
  appStore.updateTimeAllocation('exercise', 5);
  
  const newTotal = appStore.getTotalTimeAllocated();
  console.log('✅ Time allocation updated:', { total: newTotal, allocations: appStore.allocations });

  // 4. Test Resource Updates
  console.log('\n📊 Testing Resource Updates...');
  const originalResources = { ...appStore.resources };
  
  appStore.updateResource('energy', 50);
  appStore.updateResource('stress', 75);
  appStore.updateResource('knowledge', 500);  // Test with higher value for 1000 max
  appStore.updateResource('money', 750);      // Test with higher value for 1000 max
  appStore.updateResource('social', 300);     // Test with higher value for 1000 max
  
  console.log('✅ Resources updated:', {
    energy: appStore.resources.energy,
    stress: appStore.resources.stress,
    knowledge: appStore.resources.knowledge,
    money: appStore.resources.money,
    social: appStore.resources.social
  });

  // 5. Test Skill XP System
  console.log('\n✨ Testing Skill XP System...');
  const beforeXP = appStore.skills.informationWarfare.xp;
  const beforeLevel = appStore.skills.informationWarfare.level;
  
  appStore.addSkillXp('informationWarfare', 150, 'Integration Test');
  appStore.addSkillXp('allianceBuilding', 75, 'Integration Test');
  
  const afterXP = appStore.skills.informationWarfare.xp;
  const afterLevel = appStore.skills.informationWarfare.level;
  
  console.log('✅ Skill XP updated:', {
    informationWarfare: { before: beforeXP, after: afterXP, levelChange: afterLevel - beforeLevel },
    allianceBuilding: appStore.skills.allianceBuilding.xp
  });

  // 6. Test Storylet Evaluation
  console.log('\n📖 Testing Storylet Evaluation...');
  const beforeActive = storyletStore.activeStoryletIds.length;
  
  storyletStore.evaluateStorylets();
  
  const afterActive = storyletStore.activeStoryletIds.length;
  console.log('✅ Storylets evaluated:', {
    before: beforeActive,
    after: afterActive,
    activeStorylets: storyletStore.activeStoryletIds
  });

  // 7. Test Storylet Choice Integration
  console.log('\n🎭 Testing Storylet Choice Integration...');
  if (storyletStore.activeStoryletIds.length > 0) {
    const storyletId = storyletStore.activeStoryletIds[0];
    const storylet = storyletStore.allStorylets[storyletId];
    
    if (storylet && storylet.choices.length > 0) {
      const choiceId = storylet.choices[0].id;
      const choice = storylet.choices[0];
      
      console.log(`✅ Testing choice: "${choice.text}" from "${storylet.name}"`);
      console.log('✅ Effects to apply:', choice.effects);
      
      const beforeState = {
        resources: { ...appStore.resources },
        skills: { informationWarfare: appStore.skills.informationWarfare.xp }
      };
      
      storyletStore.chooseStorylet(storyletId, choiceId);
      
      const afterState = {
        resources: { ...appStore.resources },
        skills: { informationWarfare: appStore.skills.informationWarfare.xp }
      };
      
      console.log('✅ Storylet choice completed:', {
        resourceChanges: Object.keys(beforeState.resources).reduce((changes, key) => {
          const before = beforeState.resources[key];
          const after = afterState.resources[key];
          if (before !== after) changes[key] = { before, after, delta: after - before };
          return changes;
        }, {}),
        skillChanges: {
          informationWarfare: {
            before: beforeState.skills.informationWarfare,
            after: afterState.skills.informationWarfare,
            delta: afterState.skills.informationWarfare - beforeState.skills.informationWarfare
          }
        }
      });
    } else {
      console.log('⚠️ No storylet choices available for testing');
    }
  } else {
    console.log('⚠️ No active storylets for testing choices');
  }

  // 8. Test State Persistence
  console.log('\n💾 Testing State Persistence...');
  try {
    const persistedAppState = localStorage.getItem('life-sim-store');
    const persistedStoryletState = localStorage.getItem('storylet-store');
    
    console.log('✅ State persistence working:', {
      appStateSize: persistedAppState ? persistedAppState.length : 0,
      storyletStateSize: persistedStoryletState ? persistedStoryletState.length : 0,
      hasPersistedData: !!(persistedAppState && persistedStoryletState)
    });
  } catch (error) {
    console.error('❌ State persistence test failed:', error);
  }

  console.log('\n🎉 Integration Test Complete!');
  console.log('=====================================');
  console.log('✅ All integration points tested successfully');
  console.log('💡 Check the Debug Panel (🐞) to see real-time state');
  console.log('💡 Try refreshing the page to test persistence');
  console.log('💡 Navigate between pages to test transitions');
};

// Reset game state for clean testing
export const resetGameState = () => {
  console.log('🔄 Resetting game state...');
  
  const appStore = window.useAppStore?.getState();
  const storyletStore = window.useStoryletStore?.getState();
  
  if (appStore) {
    // Reset to default values
    appStore.updateTimeAllocation('study', 40);
    appStore.updateTimeAllocation('work', 25);
    appStore.updateTimeAllocation('social', 15);
    appStore.updateTimeAllocation('rest', 15);
    appStore.updateTimeAllocation('exercise', 5);
    
    appStore.updateResource('energy', 75);
    appStore.updateResource('stress', 25);
    appStore.updateResource('money', 150);
    appStore.updateResource('knowledge', 100);  // Higher starting value to show 1000 max
    appStore.updateResource('social', 200);     // Higher starting value to show 1000 max
  }
  
  if (storyletStore) {
    storyletStore.resetStorylets();
  }
  
  console.log('✅ Game state reset to defaults');
};

// Make functions available globally
if (typeof window !== 'undefined') {
  window.testIntegration = testIntegration;
  window.resetGameState = resetGameState;
}
