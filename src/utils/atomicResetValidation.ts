// /Users/montysharma/V11M2/src/utils/atomicResetValidation.ts
// Validation utilities for atomic reset functions

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';

export const validateAtomicReset = () => {
  console.log('🧪 Testing atomic reset functions...');
  
  const results = {
    coreGame: false,
    narrative: false,
    social: false,
    errors: [] as string[]
  };

  try {
    // Test Core Game Store reset
    console.log('Testing Core Game Store reset...');
    const coreGameStore = useCoreGameStore.getState();
    
    // Set some test data
    coreGameStore.updatePlayer({ level: 5, experience: 100 });
    coreGameStore.updateWorld({ day: 10 });
    
    // Perform reset
    coreGameStore.resetGame();
    
    // Validate reset
    const coreState = useCoreGameStore.getState();
    if (coreState.player.level === 1 && 
        coreState.player.experience === 0 && 
        coreState.world.day === 1) {
      results.coreGame = true;
      console.log('✅ Core Game Store reset successful');
    } else {
      results.errors.push('Core Game Store reset failed');
      console.log('❌ Core Game Store reset failed');
    }

  } catch (error) {
    results.errors.push(`Core Game Store error: ${error}`);
    console.error('❌ Core Game Store reset error:', error);
  }

  try {
    // Test Narrative Store reset
    console.log('Testing Narrative Store reset...');
    const narrativeStore = useNarrativeStore.getState();
    
    // Set some test data
    narrativeStore.addActiveStorylet('test-storylet');
    narrativeStore.setStoryletFlag('test-flag', true);
    
    // Perform reset
    narrativeStore.resetNarrative();
    
    // Validate reset
    const narrativeState = useNarrativeStore.getState();
    if (narrativeState.storylets.active.length === 0 && 
        narrativeState.flags.storylet.size === 0) {
      results.narrative = true;
      console.log('✅ Narrative Store reset successful');
    } else {
      results.errors.push('Narrative Store reset failed');
      console.log('❌ Narrative Store reset failed');
    }

  } catch (error) {
    results.errors.push(`Narrative Store error: ${error}`);
    console.error('❌ Narrative Store reset error:', error);
  }

  try {
    // Test Social Store reset
    console.log('Testing Social Store reset...');
    const socialStore = useSocialStore.getState();
    
    // Set some test data
    socialStore.updateRelationship('test-npc', 5);
    socialStore.setCurrentSave('test-save');
    
    // Perform reset
    socialStore.resetSocial();
    
    // Validate reset
    const socialState = useSocialStore.getState();
    if (Object.keys(socialState.npcs.relationships).length === 0 && 
        socialState.saves.currentSaveId === null) {
      results.social = true;
      console.log('✅ Social Store reset successful');
    } else {
      results.errors.push('Social Store reset failed');
      console.log('❌ Social Store reset failed');
    }

  } catch (error) {
    results.errors.push(`Social Store error: ${error}`);
    console.error('❌ Social Store reset error:', error);
  }

  // Overall validation
  const allPassed = results.coreGame && results.narrative && results.social;
  
  console.log('🏁 Atomic Reset Validation Results:');
  console.log('  Core Game Store:', results.coreGame ? '✅' : '❌');
  console.log('  Narrative Store:', results.narrative ? '✅' : '❌');
  console.log('  Social Store:', results.social ? '✅' : '❌');
  console.log('  Overall:', allPassed ? '✅ PASSED' : '❌ FAILED');
  
  if (results.errors.length > 0) {
    console.log('❌ Errors:', results.errors);
  }

  return {
    passed: allPassed,
    results,
    summary: `${Object.values(results).filter(r => r === true).length}/3 stores passed reset validation`
  };
};

export const validateAtomicResetIntegrity = () => {
  console.log('🔒 Testing atomic reset integrity (no race conditions)...');
  
  const iterations = 10;
  let successCount = 0;
  
  for (let i = 0; i < iterations; i++) {
    try {
      // Rapid reset sequence to test for race conditions
      const coreStore = useCoreGameStore.getState();
      const narrativeStore = useNarrativeStore.getState();
      const socialStore = useSocialStore.getState();
      
      // Set data
      coreStore.updatePlayer({ level: i + 1 });
      narrativeStore.addActiveStorylet(`test-${i}`);
      socialStore.updateRelationship(`npc-${i}`, i);
      
      // Simultaneous reset
      Promise.all([
        Promise.resolve(coreStore.resetGame()),
        Promise.resolve(narrativeStore.resetNarrative()),
        Promise.resolve(socialStore.resetSocial())
      ]);
      
      // Validate immediately
      const coreState = useCoreGameStore.getState();
      const narrativeState = useNarrativeStore.getState();
      const socialState = useSocialStore.getState();
      
      if (coreState.player.level === 1 && 
          narrativeState.storylets.active.length === 0 && 
          Object.keys(socialState.npcs.relationships).length === 0) {
        successCount++;
      }
      
    } catch (error) {
      console.warn(`Iteration ${i} failed:`, error);
    }
  }
  
  const integrityRate = (successCount / iterations) * 100;
  console.log(`🔒 Integrity test: ${successCount}/${iterations} (${integrityRate}%) passed`);
  
  return {
    passed: integrityRate >= 95, // 95% or higher success rate
    successRate: integrityRate,
    iterations,
    successCount
  };
};

// Global functions for easy access
if (typeof window !== 'undefined') {
  (window as any).validateAtomicReset = validateAtomicReset;
  (window as any).validateAtomicResetIntegrity = validateAtomicResetIntegrity;
  console.log('🧪 Atomic reset validation utilities loaded');
  console.log('   validateAtomicReset() - Test all reset functions');
  console.log('   validateAtomicResetIntegrity() - Test for race conditions');
}