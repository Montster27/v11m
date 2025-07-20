// /Users/montysharma/V11M2/src/store/characterStore.ts
import { create } from 'zustand';
import { Character, QuestionnaireQuestion } from '../types/character';

// Export Character type for other files
export type { Character } from '../types/character';

// Questionnaire data
export const questionnaireData: QuestionnaireQuestion[] = [
  {
    id: 'study_approach',
    question: 'How do you typically approach studying for an important exam?',
    options: [
      {
        id: 'methodical',
        text: 'Create a detailed study schedule and stick to it religiously',
        attributeEffects: [
          { attribute: 'focus', change: 2 },
          { attribute: 'perseverance', change: 1 }
        ]
      },
      {
        id: 'creative',
        text: 'Use mind maps, flashcards, and creative memory techniques',
        attributeEffects: [
          { attribute: 'creativity', change: 2 },
          { attribute: 'memory', change: 1 }
        ]
      },
      {
        id: 'group',
        text: 'Form study groups and learn through discussion',
        attributeEffects: [
          { attribute: 'communication', change: 2 },
          { attribute: 'charisma', change: 1 }
        ]
      }
    ]
  },
  {
    id: 'stress_response',
    question: 'When facing a high-pressure deadline, you tend to:',
    options: [
      {
        id: 'calm',
        text: 'Stay calm and work systematically through the tasks',
        attributeEffects: [
          { attribute: 'stressTolerance', change: 2 },
          { attribute: 'emotionalStability', change: 1 }
        ]
      },
      {
        id: 'energized',
        text: 'Feel energized and work with intense focus',
        attributeEffects: [
          { attribute: 'focus', change: 2 },
          { attribute: 'endurance', change: 1 }
        ]
      },
      {
        id: 'collaborative',
        text: 'Seek help and collaborate with others',
        attributeEffects: [
          { attribute: 'empathy', change: 1 },
          { attribute: 'communication', change: 2 }
        ]
      }
    ]
  }
];

// Simple UUID generator
const generateUUID = (): string => {
  return 'char-' + Math.random().toString(36).substr(2, 9);
};

interface CharacterStore {
  currentCharacter: Character | null;
  savedCharacters: Character[];
  currentStep: number;
  totalSteps: number;
  
  // Actions
  createNewCharacter: () => void;
  updateCharacter: (updates: Partial<Character>) => void;
  saveCharacter: () => void;
  loadCharacter: (id: string) => void;
  deleteCharacter: (id: string) => void;
  
  // Step navigation
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  
  // Validation
  isStepValid: (step: number) => boolean;
  getTotalAttributePoints: () => number;
}

const defaultAttributes = {
  intelligence: 6,
  creativity: 6,
  memory: 6,
  focus: 6,
  strength: 6,
  agility: 6,
  endurance: 6,
  dexterity: 6,
  charisma: 6,
  empathy: 6,
  communication: 6,
  emotionalStability: 6,
  perseverance: 6,
  stressTolerance: 6,
  adaptability: 6,
  selfControl: 4
};

const defaultResources = {
  grades: 75,
  money: 100,
  social: 50,
  energy: 80,
  stress: 20
};

const defaultSkills = {
  bureaucraticNavigation: {
    id: 'bureaucraticNavigation',
    name: 'Bureaucratic Navigation',
    description: 'Mastery of institutional systems, form-filling, and navigating complex bureaucratic structures efficiently.',
    xp: 0,
    level: 1,
    xpToNextLevel: 100
  },
  resourceAcquisition: {
    id: 'resourceAcquisition',
    name: 'Resource Acquisition',
    description: 'Skill in finding, securing, and optimizing access to materials, funding, and opportunities.',
    xp: 0,
    level: 1,
    xpToNextLevel: 100
  },
  informationWarfare: {
    id: 'informationWarfare',
    name: 'Information Warfare',
    description: 'Strategic intelligence gathering, data analysis, and leveraging information for competitive advantage.',
    xp: 0,
    level: 1,
    xpToNextLevel: 100
  },
  allianceBuilding: {
    id: 'allianceBuilding',
    name: 'Alliance Building',
    description: 'Creating and maintaining strategic partnerships, networking, and coalition formation.',
    xp: 0,
    level: 1,
    xpToNextLevel: 100
  },
  operationalSecurity: {
    id: 'operationalSecurity',
    name: 'Operational Security',
    description: 'Protecting sensitive activities, maintaining discretion, and managing risk in complex operations.',
    xp: 0,
    level: 1,
    xpToNextLevel: 100
  }
};

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  currentCharacter: null,
  savedCharacters: [],
  currentStep: 1,
  totalSteps: 3,
  
  createNewCharacter: () => {
    set({
      currentCharacter: {
        id: generateUUID(),
        name: '',
        attributes: { ...defaultAttributes },
        initialResources: { ...defaultResources },
        skills: { ...defaultSkills },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      currentStep: 1
    });
  },
  
  updateCharacter: (updates) => {
    set((state) => ({
      currentCharacter: state.currentCharacter 
        ? { 
            ...state.currentCharacter, 
            ...updates,
            updatedAt: new Date()
          }
        : null
    }));
  },
  
  saveCharacter: () => {
    const { currentCharacter, savedCharacters } = get();
    if (!currentCharacter) return;
    
    const existingIndex = savedCharacters.findIndex(c => c.id === currentCharacter.id);
    
    if (existingIndex >= 0) {
      // Update existing character
      set((state) => ({
        savedCharacters: state.savedCharacters.map((c, i) => 
          i === existingIndex ? currentCharacter : c
        )
      }));
    } else {
      // Add new character
      set((state) => ({
        savedCharacters: [...state.savedCharacters, currentCharacter]
      }));
    }
    
    // Save to localStorage for persistence
    try {
      const { savedCharacters: updatedCharacters } = get();
      localStorage.setItem('lifeSimulator_characters', JSON.stringify(updatedCharacters));
    } catch (error) {
      console.warn('Failed to save characters:', error);
    }
  },
  
  loadCharacter: (id) => {
    const { savedCharacters } = get();
    const character = savedCharacters.find(c => c.id === id);
    if (character) {
      set({ currentCharacter: character });
    }
  },
  
  deleteCharacter: (id) => {
    set((state) => ({
      savedCharacters: state.savedCharacters.filter(c => c.id !== id)
    }));
  },
  
  nextStep: () => set((state) => ({
    currentStep: Math.min(state.currentStep + 1, state.totalSteps)
  })),
  
  prevStep: () => set((state) => ({
    currentStep: Math.max(state.currentStep - 1, 1)
  })),
  
  setStep: (step) => set({ currentStep: step }),
  
  isStepValid: (step) => {
    const { currentCharacter } = get();
    if (!currentCharacter) return false;
    
    switch (step) {
      case 1:
        return !!(currentCharacter.name && currentCharacter.name.trim().length > 0);
      case 2:
        return get().getTotalAttributePoints() === 100;
      case 3:
        return true; // Review step
      default:
        return false;
    }
  },
  
  getTotalAttributePoints: () => {
    const { currentCharacter } = get();
    if (!currentCharacter?.attributes) return 0;
    
    return Object.values(currentCharacter.attributes).reduce((sum, value) => sum + value, 0);
  }
}));

// Load saved characters from localStorage on initialization
if (typeof window !== 'undefined') {
  try {
    const savedData = localStorage.getItem('lifeSimulator_characters');
    if (savedData) {
      const characters = JSON.parse(savedData);
      // Ensure backward compatibility - add skills to old characters
      const updatedCharacters = characters.map((char: any) => ({
        ...char,
        skills: char.skills || { ...defaultSkills },
        updatedAt: char.updatedAt || new Date()
      }));
      useCharacterStore.setState({ savedCharacters: updatedCharacters });
    }
  } catch (error) {
    console.warn('Failed to load saved characters:', error);
  }
}
