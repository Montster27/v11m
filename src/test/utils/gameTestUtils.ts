// Game Testing Utilities
// Provides helper functions for setting up and testing game state

import { renderHook } from '@testing-library/react'
import { useAppStore } from '../../stores/useAppStore'
import { useStoryletStore } from '../../stores/useStoryletStore'
import { useStoryletCatalogStore } from '../../stores/useStoryletCatalogStore'
import type { Storylet } from '../../types/storylet'

/**
 * Setup a basic game state for testing
 */
export const setupGameState = (overrides = {}) => {
  const defaultState = {
    day: 1,
    resources: {
      energy: 75,
      stress: 25,
      money: 20,
      knowledge: 100,
      social: 200
    },
    activeCharacter: {
      id: 'test-char',
      name: 'Test Character'
    },
    ...overrides
  }
  
  useAppStore.setState(defaultState)
  return defaultState
}

/**
 * Wait for storylet evaluation async queue to process
 */
export const waitForStoryletEvaluation = async () => {
  // Wait for the async queue to process
  await new Promise(resolve => setTimeout(resolve, 50))
}

/**
 * Wait for Zustand store updates to propagate
 */
export const waitForStoreUpdate = async () => {
  await new Promise(resolve => setTimeout(resolve, 10))
}

/**
 * Ensure window stores are available for storylet evaluation
 */
export const setupWindowStores = () => {
  if (typeof window !== 'undefined') {
    if (!window.useAppStore) {
      window.useAppStore = require('../../stores/useAppStore').useAppStore
    }
  }
}

/**
 * Create a test storylet with sensible defaults that matches the Storylet interface
 */
export const createTestStorylet = (overrides = {}): Storylet => {
  const baseStorylet = {
    id: `test-storylet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Storylet',
    description: 'A test storylet for testing purposes',
    trigger: { 
      type: 'flag' as const, 
      conditions: { flags: ['test_flag'] } 
    },
    choices: [{
      id: 'choice1',
      text: 'Test Choice',
      effects: []
    }],
    deploymentStatus: 'dev' as const,
    // Optional fields can be added through overrides
    ...overrides
  };

  // Ensure trigger structure is always valid
  if (overrides.trigger) {
    baseStorylet.trigger = {
      type: overrides.trigger.type || 'flag',
      conditions: overrides.trigger.conditions || {}
    };
  }

  // Ensure choices array is always valid
  if (overrides.choices) {
    baseStorylet.choices = Array.isArray(overrides.choices) ? overrides.choices : [baseStorylet.choices[0]];
  }

  return baseStorylet;
}

/**
 * Create multiple test storylets quickly
 */
export const createTestStorylets = (count: number, baseOverrides = {}) => {
  return Array.from({ length: count }, (_, i) => 
    createTestStorylet({
      id: `test-storylet-batch-${i}`,
      name: `Test Storylet ${i + 1}`,
      ...baseOverrides
    })
  )
}

/**
 * Setup a complete test scenario with character, storylets, and game state
 */
export const setupTestScenario = (scenarioName = 'default') => {
  switch (scenarioName) {
    case 'early-game':
      return {
        gameState: setupGameState({
          day: 3,
          resources: { energy: 80, stress: 20, money: 30, knowledge: 120, social: 180 }
        }),
        storylets: createTestStorylets(5, {
          trigger: { type: 'time', conditions: { day: 3 } }
        })
      }
    
    case 'mid-game':
      return {
        gameState: setupGameState({
          day: 30,
          resources: { energy: 60, stress: 40, money: 150, knowledge: 300, social: 250 }
        }),
        storylets: createTestStorylets(10, {
          trigger: { type: 'resource', conditions: { resources: { knowledge: 250 } } }
        })
      }
    
    case 'late-game':
      return {
        gameState: setupGameState({
          day: 80,
          resources: { energy: 70, stress: 30, money: 500, knowledge: 600, social: 400 }
        }),
        storylets: createTestStorylets(15)
      }
    
    default:
      return {
        gameState: setupGameState(),
        storylets: createTestStorylets(3)
      }
  }
}

/**
 * Helper to test storylet trigger conditions
 */
export const testTriggerCondition = (storylet: Storylet, gameState: any = null) => {
  if (!gameState) {
    gameState = useAppStore.getState()
  }
  
  const storyletState = useStoryletStore.getState()
  
  switch (storylet.trigger.type) {
    case 'time':
      const dayCondition = storylet.trigger.conditions?.day
      return dayCondition ? gameState.day === dayCondition : false
    
    case 'flag':
      const flags = storylet.trigger.conditions?.flags || []
      return flags.every((flag: string) => storyletState.activeFlags[flag])
    
    case 'resource':
      const resources = storylet.trigger.conditions?.resources || {}
      return Object.entries(resources).every(([key, minValue]) => 
        gameState.resources[key] >= minValue
      )
    
    default:
      return false
  }
}


/**
 * Reset all stores to clean state
 */
export const resetAllStores = () => {
  // Setup window stores first
  setupWindowStores();

  // Clear app store
  useAppStore.setState({
    day: 1,
    resources: {
      energy: 100,
      stress: 0,
      money: 50,
      knowledge: 100,
      social: 150
    },
    activeCharacter: null
  });

  // Clear storylet store completely with test mode
  useStoryletStore.setState({
    allStorylets: {},
    activeStoryletIds: [],
    completedStoryletIds: [],
    activeFlags: {},
    storyletCooldowns: {},
    // Include dev storylets in tests
    deploymentFilter: new Set(['live', 'dev']),
    // Disable catalog syncing in tests
    _testMode: true
  });

  // Also clear the catalog store to prevent storylet accumulation
  useStoryletCatalogStore.setState({
    allStorylets: {},
    lastLoaded: 0,
    isLoading: false
  });

  // Clear any persistent storage
  localStorage.clear()
  sessionStorage.clear()
}

/**
 * Create a minimal character for testing
 */
export const createTestCharacter = (overrides = {}) => ({
  id: `test-char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Character',
  background: 'academic',
  track: 'college',
  concerns: {
    academics: 20,
    socialFitting: 15,
    financial: 10,
    isolation: 5,
    genderIssues: 0,
    raceIssues: 0,
    classIssues: 0
  },
  ...overrides
})

/**
 * Add storylets to catalog and sync to main store with proper timing
 */
export const addStoryletsToTest = async (storylets: Record<string, Storylet>) => {
  useStoryletCatalogStore.setState({
    allStorylets: storylets,
    lastLoaded: Date.now(),
    isLoading: false
  });
  
  await waitForStoreUpdate();
  
  useStoryletStore.getState().syncFromCatalogStore();
  await waitForStoreUpdate();
}

/**
 * Evaluate storylets and wait for completion
 */
export const evaluateAndWait = async () => {
  useStoryletStore.getState().evaluateStorylets();
  await waitForStoryletEvaluation();
}

/**
 * Test that a storylet activates under given conditions
 */
export const expectStoryletToActivate = async (storylet: Storylet, gameState = null) => {
  if (gameState) {
    useAppStore.setState(gameState)
    await waitForStoreUpdate()
  }
  
  useStoryletStore.getState().addStorylet(storylet)
  await waitForStoreUpdate()
  
  useStoryletStore.getState().evaluateStorylets()
  await waitForStoryletEvaluation()
  
  const activeIds = useStoryletStore.getState().activeStoryletIds
  if (!activeIds.includes(storylet.id)) {
    throw new Error(`Expected storylet "${storylet.id}" to be active, but it was not. Active IDs: ${activeIds.join(', ')}`)
  }
}

/**
 * Helper to simulate game progression
 */
export const simulateGameProgress = async (days: number) => {
  const appStore = useAppStore.getState()
  const storyletStore = useStoryletStore.getState()
  
  for (let i = 0; i < days; i++) {
    // Advance day
    appStore.incrementDay?.()
    
    // Evaluate storylets
    storyletStore.evaluateStorylets()
    await waitForStoryletEvaluation()
    
    // Simulate some resource changes
    const currentResources = useAppStore.getState().resources
    useAppStore.setState({
      resources: {
        ...currentResources,
        energy: Math.max(0, currentResources.energy - Math.random() * 10),
        stress: Math.min(100, currentResources.stress + Math.random() * 5)
      }
    })
  }
}