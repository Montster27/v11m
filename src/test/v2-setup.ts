// /Users/montysharma/V11M2/src/test/v2-setup.ts
// V2 Test Setup Utilities for V11M2
// Provides standardized test utilities for V2 store architecture

import { useCoreGameStore } from '../stores/v2/useCoreGameStore';
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
import { useSocialStore } from '../stores/v2/useSocialStore';
import type { Storylet } from '../types/storylet';
import type { Clue } from '../types/clue';

// ===== V2 STORE RESET UTILITIES =====

/**
 * Reset all V2 stores to initial state
 * Use this in beforeEach blocks to ensure clean test state
 */
export const resetAllV2Stores = () => {
  useCoreGameStore.getState().resetGame();
  useNarrativeStore.getState().resetNarrative();
  useSocialStore.getState().resetSocial();
};

/**
 * Reset individual V2 stores
 */
export const resetV2Stores = {
  core: () => useCoreGameStore.getState().resetGame(),
  narrative: () => useNarrativeStore.getState().resetNarrative(),
  social: () => useSocialStore.getState().resetSocial(),
};

// ===== V2 MOCK DATA FACTORIES =====

/**
 * Create a test storylet with V2-compatible structure
 */
export const createV2TestStorylet = (overrides: Partial<Storylet> = {}): Storylet => ({
  id: `test_storylet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Storylet',
  description: 'A test storylet for unit testing',
  choices: [
    {
      id: 'choice_1',
      text: 'Test Choice 1',
      effects: [
        { type: 'resource', resource: 'energy', delta: -10 },
        { type: 'skillXp', skill: 'academic', amount: 5 }
      ]
    }
  ],
  trigger: {
    type: 'manual'
  },
  requirements: {},
  storyArc: 'test',
  theme: 'test',
  deployment: 'test',
  ...overrides
});

/**
 * Create multiple test storylets
 */
export const createV2TestStorylets = (count: number, baseOverrides: Partial<Storylet> = {}): Storylet[] => {
  return Array.from({ length: count }, (_, i) => 
    createV2TestStorylet({
      id: `test_storylet_${i}`,
      name: `Test Storylet ${i}`,
      ...baseOverrides
    })
  );
};

/**
 * Create a test clue with V2-compatible structure
 */
export const createV2TestClue = (overrides: Partial<Clue> = {}): Clue => ({
  id: `test_clue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Clue',
  description: 'A test clue for unit testing',
  discovered: false,
  category: 'test',
  difficulty: 'medium',
  importance: 'medium',
  rarity: 'common',
  minigameTypes: [],
  associatedStorylets: [],
  tags: [],
  ...overrides
});

/**
 * Create test concerns data
 */
export const createV2TestConcerns = (overrides: Record<string, number> = {}): Record<string, number> => ({
  academic: 15,
  social: 10,
  financial: 5,
  health: 8,
  career: 12,
  ...overrides
});

/**
 * Create test player state
 */
export const createV2TestPlayer = (overrides = {}) => ({
  level: 1,
  experience: 0,
  skillPoints: 0,
  resources: {
    energy: 100,
    money: 50,
    stress: 20,
    ...overrides
  }
});

/**
 * Create test character state
 */
export const createV2TestCharacter = (overrides = {}) => ({
  name: 'Test Character',
  background: 'test_background',
  attributes: {
    intelligence: 10,
    charisma: 10,
    resilience: 10
  },
  developmentStats: {},
  ...overrides
});

/**
 * Create test world state
 */
export const createV2TestWorld = (overrides = {}) => ({
  day: 1,
  timeAllocation: {},
  isTimePaused: false,
  gameState: 'playing',
  playtime: 0,
  ...overrides
});

// ===== V2 STORE SETUP HELPERS =====

/**
 * Setup V2 stores with test data
 */
export const setupV2TestStores = (config: {
  storylets?: Storylet[];
  concerns?: Record<string, number>;
  player?: any;
  character?: any;
  world?: any;
  clues?: Clue[];
} = {}) => {
  // Reset all stores first
  resetAllV2Stores();

  // Setup narrative store
  if (config.storylets) {
    config.storylets.forEach(storylet => {
      useNarrativeStore.getState().addUserStorylet(storylet);
    });
  }

  if (config.concerns) {
    useNarrativeStore.getState().updateConcerns(config.concerns);
  }

  if (config.clues) {
    config.clues.forEach(clue => {
      useNarrativeStore.getState().addClue(clue);
    });
  }

  // Setup core game store
  if (config.player) {
    useCoreGameStore.getState().updatePlayer(config.player);
  }

  if (config.character) {
    useCoreGameStore.getState().updateCharacter(config.character);
  }

  if (config.world) {
    useCoreGameStore.getState().updateWorld(config.world);
  }
};

/**
 * Get all V2 store states for debugging
 */
export const getV2StoreStates = () => ({
  core: useCoreGameStore.getState(),
  narrative: useNarrativeStore.getState(),
  social: useSocialStore.getState()
});

/**
 * Create a realistic test scenario with multiple interconnected storylets
 */
export const createV2TestScenario = () => {
  const storylets = [
    createV2TestStorylet({
      id: 'academic_study',
      name: 'Study for Midterm',
      requirements: {
        flags: ['concern_academic']
      }
    }),
    createV2TestStorylet({
      id: 'social_coffee',
      name: 'Coffee with Friends',
      requirements: {
        flags: ['concern_social']
      }
    }),
    createV2TestStorylet({
      id: 'no_requirements',
      name: 'Free Choice',
      requirements: {}
    })
  ];

  const concerns = createV2TestConcerns({
    academic: 20,
    social: 15,
    financial: 10
  });

  const player = createV2TestPlayer({
    resources: {
      energy: 80,
      money: 100,
      stress: 25
    }
  });

  const clues = [
    createV2TestClue({
      id: 'test_clue_1',
      name: 'Academic Pressure',
      associatedStorylets: ['academic_study']
    })
  ];

  setupV2TestStores({
    storylets,
    concerns,
    player,
    clues
  });

  return {
    storylets,
    concerns,
    player,
    clues
  };
};

// ===== V2 TEST ASSERTIONS =====

/**
 * Assert that a storylet exists in the narrative store
 */
export const expectStoryletExists = (storyletId: string) => {
  const storylet = useNarrativeStore.getState().getStorylet(storyletId);
  if (!storylet) {
    throw new Error(`Expected storylet ${storyletId} to exist in narrative store`);
  }
  return storylet;
};

/**
 * Assert that storylets are available based on current state
 */
export const expectStoryletsAvailable = (expectedIds: string[]) => {
  const activeStorylets = useNarrativeStore.getState().storylets.active;
  expectedIds.forEach(id => {
    if (!activeStorylets.includes(id)) {
      throw new Error(`Expected storylet ${id} to be active, but it's not`);
    }
  });
};

/**
 * Assert player resources match expected values
 */
export const expectPlayerResources = (expected: Record<string, number>) => {
  const player = useCoreGameStore.getState().player;
  Object.entries(expected).forEach(([resource, expectedValue]) => {
    const actualValue = player.resources[resource] || 0;
    if (actualValue !== expectedValue) {
      throw new Error(`Expected player.${resource} to be ${expectedValue}, got ${actualValue}`);
    }
  });
};

// ===== EXPORT DEFAULT SETUP FUNCTION =====

/**
 * Default setup function for most tests
 * Call this in your beforeEach blocks
 */
export const setupV2Test = () => {
  resetAllV2Stores();
  
  // Set up minimal realistic state
  setupV2TestStores({
    player: createV2TestPlayer(),
    character: createV2TestCharacter(),
    world: createV2TestWorld(),
    concerns: createV2TestConcerns()
  });
};