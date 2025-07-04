// Test script to check player level during character creation
// We'll create a simple node script that can access the stores

import { useCoreGameStore } from './src/stores/v2/useCoreGameStore.js';
import { createCharacterAtomically, resetAllGameState } from './src/utils/characterFlowIntegration.js';

try {
  console.log('🧪 Testing Player Level During Character Creation...');
  
  // Reset to clean state
  console.log('1. Resetting all game state...');
  resetAllGameState();
  
  // Check initial player level
  const initialState = useCoreGameStore.getState();
  console.log('2. Initial player level:', initialState.player.level);
  console.log('   Initial player experience:', initialState.player.experience);
  console.log('   Initial player skillPoints:', initialState.player.skillPoints);
  
  // Create a character
  console.log('3. Creating character...');
  createCharacterAtomically({
    name: 'Test Character',
    background: 'general',
    attributes: { intelligence: 60, creativity: 55 },
    domainAdjustments: {}
  });
  
  // Check player level after character creation
  const afterState = useCoreGameStore.getState();
  console.log('4. Player level after character creation:', afterState.player.level);
  console.log('   Player experience after character creation:', afterState.player.experience);
  console.log('   Player skillPoints after character creation:', afterState.player.skillPoints);
  console.log('   Character name:', afterState.character.name);
  console.log('   Character background:', afterState.character.background);
  
  // Test conclusion
  if (afterState.player.level === 1) {
    console.log('✅ PASS: Player level is correctly set to 1');
  } else {
    console.log('❌ FAIL: Player level is not 1, got:', afterState.player.level);
  }
  
} catch (error) {
  console.error('❌ Test failed with error:', error.message);
  console.error('Stack:', error.stack);
}