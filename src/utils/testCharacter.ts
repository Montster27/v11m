// /Users/montysharma/V11M2/src/utils/testCharacter.ts

import { useCharacterStore } from '../store/characterStore';
import { useAppStore } from '../store/useAppStore';

// Create a test character for development
export const createTestCharacter = () => {
  const store = useCharacterStore.getState();
  
  // Create a sample character
  store.createNewCharacter();
  
  // Update with test data
  store.updateCharacter({
    name: 'Alex Morgan',
    attributes: {
      intelligence: 8,
      creativity: 7,
      memory: 6,
      focus: 7,
      strength: 5,
      agility: 6,
      endurance: 7,
      dexterity: 5,
      charisma: 8,
      empathy: 9,
      communication: 8,
      emotionalStability: 6,
      perseverance: 8,
      stressTolerance: 7,
      adaptability: 7,
      selfControl: 6
    },
    initialResources: {
      grades: 75,
      money: 20,
      social: 60,
      energy: 80,
      stress: 25
    }
  });
  
  // Save the character
  store.saveCharacter();
  
  return store.currentCharacter;
};

// Simulate skill gains for preview/testing
export const simulateSkillGainsForPreview = () => {
  const { addSkillXp } = useAppStore.getState();
  
  // Add initial test XP to demonstrate the system
  addSkillXp('bureaucraticNavigation', 120, 'Test: Initial Bonus');
  addSkillXp('resourceAcquisition', 50, 'Test: Workshop Attendance');
  addSkillXp('informationWarfare', 200, 'Test: Research Project');
  addSkillXp('allianceBuilding', 75, 'Test: Networking Event');
  addSkillXp('operationalSecurity', 30, 'Test: Security Training');
  
  console.log('Simulated skill gains for preview');
};
