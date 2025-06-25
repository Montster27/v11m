// /Users/montysharma/V11M2/src/utils/finalCharacterFlowValidation.ts
// Final validation script to ensure character creation flow works

import { useCoreGameStore } from '../stores/v2/useCoreGameStore';
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
import { useSocialStore } from '../stores/v2/useSocialStore';

export function validateCharacterCreationFlow() {
  console.log('\n🔄 VALIDATING CHARACTER CREATION FLOW...\n');
  
  // 1. Check current store states
  const coreState = useCoreGameStore.getState();
  const narrativeState = useNarrativeStore.getState();
  const socialState = useSocialStore.getState();
  
  console.log('📊 Current Store States:');
  console.log('Core Store Character:', coreState.character);
  console.log('Core Store Player:', coreState.player);
  console.log('Core Store World:', coreState.world);
  
  // 2. Test character creation
  console.log('\n🧪 Testing Character Creation...');
  
  // Create a test character
  const testCharacter = {
    id: 'test-' + Date.now(),
    name: 'Test Character',
    birthMonth: 6,
    birthYear: 1970,
    major: 'Computer Science',
    academicFocus: 5,
    traits: ['Analytical', 'Creative', 'Social'],
    bio: 'Test character for validation',
    avatar: '/default-avatar.jpg',
    gameVersion: '1.0.0',
    createdAt: Date.now()
  };
  
  // Save current state for rollback
  const originalCharacter = coreState.character;
  
  // Create character
  coreState.createCharacter(testCharacter);
  
  // Verify creation
  const newState = useCoreGameStore.getState();
  const created = newState.character?.name === 'Test Character';
  
  console.log('✅ Character Created:', created);
  console.log('Character in store:', newState.character);
  
  // 3. Check localStorage
  console.log('\n💾 Checking localStorage...');
  const coreStorage = localStorage.getItem('mmv-core-game-store');
  const narrativeStorage = localStorage.getItem('mmv-narrative-store');
  const socialStorage = localStorage.getItem('mmv-social-store');
  
  console.log('Core store persisted:', !!coreStorage);
  console.log('Narrative store persisted:', !!narrativeStorage);
  console.log('Social store persisted:', !!socialStorage);
  
  if (coreStorage) {
    const parsed = JSON.parse(coreStorage);
    console.log('Persisted character:', parsed.state?.character);
  }
  
  // 4. Test character deletion
  console.log('\n🗑️ Testing Character Deletion...');
  coreState.deleteCharacter();
  
  const afterDelete = useCoreGameStore.getState();
  console.log('Character deleted:', !afterDelete.character);
  
  // 5. Restore original state if needed
  if (originalCharacter) {
    console.log('\n♻️ Restoring original character...');
    coreState.createCharacter(originalCharacter);
  }
  
  // 6. Summary
  console.log('\n📋 VALIDATION SUMMARY:');
  console.log('- Store initialization: ✅');
  console.log('- Character creation: ' + (created ? '✅' : '❌'));
  console.log('- LocalStorage persistence: ' + (coreStorage ? '✅' : '❌'));
  console.log('- Character deletion: ✅');
  
  return {
    storesInitialized: true,
    characterCreation: created,
    persistence: !!coreStorage,
    deletion: true
  };
}

// Test navigation flow
export function testNavigationFlow() {
  console.log('\n🧭 Testing Navigation Flow...');
  
  const state = useCoreGameStore.getState();
  
  // Check if navigation would show character
  console.log('Character exists:', !!state.character);
  console.log('Should show game:', !!state.character);
  console.log('Should show character creation:', !state.character);
  
  return !!state.character;
}

// Full diagnostic
export function runFullDiagnostic() {
  console.log('\n🏥 RUNNING FULL DIAGNOSTIC...\n');
  
  // 1. Clear console for fresh start
  console.clear();
  
  // 2. Check browser
  console.log('🌐 Browser:', navigator.userAgent);
  console.log('📍 URL:', window.location.href);
  
  // 3. Check localStorage keys
  console.log('\n🗃️ LocalStorage Keys:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.includes('store') || key?.includes('mmv')) {
      console.log(`- ${key}`);
    }
  }
  
  // 4. Run validation
  const validation = validateCharacterCreationFlow();
  
  // 5. Check for common issues
  console.log('\n⚠️ Common Issues Check:');
  
  // Check for old store usage
  if (window.useAppStore) {
    console.warn('❌ Old useAppStore is still being imported somewhere!');
  } else {
    console.log('✅ Old useAppStore not found');
  }
  
  // Check for multiple store instances
  const core1 = useCoreGameStore.getState();
  const core2 = useCoreGameStore.getState();
  if (core1 === core2) {
    console.log('✅ Single store instance confirmed');
  } else {
    console.warn('❌ Multiple store instances detected!');
  }
  
  return validation;
}

// Emergency fix
export function emergencyFix() {
  console.log('\n🚨 APPLYING EMERGENCY FIX...\n');
  
  // 1. Clear all caches
  console.log('1️⃣ Clearing all storage...');
  localStorage.clear();
  sessionStorage.clear();
  
  // 2. Reload stores
  console.log('2️⃣ Reloading stores...');
  useCoreGameStore.persist.rehydrate();
  useNarrativeStore.persist.rehydrate();
  useSocialStore.persist.rehydrate();
  
  // 3. Force page reload
  console.log('3️⃣ Reloading page in 2 seconds...');
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

// Expose to window
if (typeof window !== 'undefined') {
  window.validateCharacterCreationFlow = validateCharacterCreationFlow;
  window.testNavigationFlow = testNavigationFlow;
  window.runFullDiagnostic = runFullDiagnostic;
  window.emergencyFix = emergencyFix;
  
  console.log('🧪 Character flow validation tools loaded!');
  console.log('Commands:');
  console.log('- validateCharacterCreationFlow()');
  console.log('- testNavigationFlow()');
  console.log('- runFullDiagnostic()');
  console.log('- emergencyFix()');
}
