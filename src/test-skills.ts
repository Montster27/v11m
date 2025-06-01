// /Users/montysharma/V11M2/src/test-skills.ts
// Simple test file to verify skill system works

import { useAppStore } from './store/useAppStore';
import { getLevelFromXp } from './utils/skillCalculations';

// Test the skill calculations
console.log('Testing skill calculations...');
console.log('Level 1 XP test:', getLevelFromXp(50));  // Should be level 1, 50 XP to next
console.log('Level 2 XP test:', getLevelFromXp(150)); // Should be level 2, 100 XP to next
console.log('Level 3 XP test:', getLevelFromXp(300)); // Should be level 3, 200 XP to next

// Test store skills
console.log('Testing store skills...');
const store = useAppStore.getState();
console.log('Available skills:', Object.keys(store.skills));
console.log('Bureaucratic Navigation skill:', store.skills.bureaucraticNavigation);

// Test XP addition
console.log('Testing XP addition...');
store.addSkillXp('bureaucraticNavigation', 120, 'Test');
console.log('After adding 120 XP:', store.skills.bureaucraticNavigation);

export {};
