// Game Testing Utilities - V2 Edition
// Provides helper functions for setting up and testing V2 game state

import { renderHook } from '@testing-library/react'
import { useCoreGameStore } from '../../stores/v2/useCoreGameStore'
import { useNarrativeStore } from '../../stores/v2/useNarrativeStore'
import { useSocialStore } from '../../stores/v2/useSocialStore'
import { setupV2Test, createV2TestStorylet, createV2TestScenario, resetAllV2Stores } from '../v2-setup'
import type { Storylet } from '../../types/storylet'

// Re-export V2 setup utilities for backward compatibility
export {
  setupV2Test,
  createV2TestStorylet as createTestStorylet,
  createV2TestScenario as setupTestScenario,
  resetAllV2Stores as resetAllStores
}

/**
 * Setup a basic V2 game state for testing
 */
export const setupGameState = (overrides = {}) => {
  const defaultState = {
    player: {
      level: 1,
      experience: 0,
      skillPoints: 0,
      resources: {
        energy: 75,
        stress: 25,
        money: 20,
        knowledge: 100,
        social: 200
      }
    },
    character: {
      name: 'Test Character',
      background: 'test_background',
      attributes: {},
      developmentStats: {}
    },
    world: {
      day: 1,
      timeAllocation: {},
      isTimePaused: false,
      gameState: 'playing',
      playtime: 0
    },
    ...overrides
  }
  
  // Update V2 stores
  if (defaultState.player) {
    useCoreGameStore.getState().updatePlayer(defaultState.player)
  }
  if (defaultState.character) {
    useCoreGameStore.getState().updateCharacter(defaultState.character)
  }
  if (defaultState.world) {
    useCoreGameStore.getState().updateWorld(defaultState.world)
  }
  
  return defaultState
}

/**
 * Wait for storylet evaluation async queue to process
 */
export const waitForStoryletEvaluation = async () => {
  // In test environment, evaluation is synchronous so no need to wait
  if (process.env.NODE_ENV === 'test') {
    return;
  }
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
 * Ensure window stores are available for storylet evaluation (V2)
 */
export const setupWindowStores = () => {
  if (typeof window !== 'undefined') {
    if (!window.useCoreGameStore) {
      window.useCoreGameStore = require('../../stores/v2/useCoreGameStore').useCoreGameStore
    }
    if (!window.useNarrativeStore) {
      window.useNarrativeStore = require('../../stores/v2/useNarrativeStore').useNarrativeStore
    }
    if (!window.useSocialStore) {
      window.useSocialStore = require('../../stores/v2/useSocialStore').useSocialStore
    }
  }
}

/**
 * Create multiple test storylets quickly (V2 compatible)
 */
export const createTestStorylets = (count: number, baseOverrides = {}) => {
  return Array.from({ length: count }, (_, i) => 
    createV2TestStorylet({
      id: `test-storylet-batch-${i}`,
      name: `Test Storylet ${i + 1}`,
      ...baseOverrides
    })
  )
}

/**
 * Helper to test storylet trigger conditions (V2)
 */
export const testTriggerCondition = (storylet: Storylet, gameState: any = null) => {
  const coreState = gameState || useCoreGameStore.getState()
  const narrativeState = useNarrativeStore.getState()
  
  switch (storylet.trigger?.type) {
    case 'time':
      const dayCondition = storylet.trigger.conditions?.day
      return dayCondition ? coreState.world.day >= dayCondition : false
    
    case 'flag':
      const flags = storylet.trigger.conditions?.flags || []
      return flags.every((flag: string) => {
        // Check V2 flag system
        return narrativeState.getStoryletFlag(flag) || false
      })
    
    case 'resource':
      const resources = storylet.trigger.conditions?.resources || {}
      return Object.entries(resources).every(([key, minValue]) => {
        const currentValue = coreState.player.resources[key] || 0
        return typeof minValue === 'number' ? currentValue >= minValue : true
      })
    
    case 'manual':
      // Manual triggers require explicit activation
      return false
    
    default:
      return false
  }
}

/**
 * Create a minimal character for testing (V2 compatible)
 */
export const createTestCharacter = (overrides = {}) => ({
  name: 'Test Character',
  background: 'academic',
  attributes: {
    intelligence: 10,
    charisma: 10,
    resilience: 10
  },
  developmentStats: {},
  ...overrides
})

/**
 * Add storylets to V2 narrative store
 */
export const addStoryletsToTest = async (storylets: Storylet[]) => {
  const narrativeStore = useNarrativeStore.getState()
  
  storylets.forEach(storylet => {
    narrativeStore.addUserStorylet(storylet)
  })
  
  await waitForStoreUpdate()
}

/**
 * Evaluate storylets and wait for completion (V2)
 */
export const evaluateAndWait = async () => {
  useNarrativeStore.getState().evaluateStorylets()
  await waitForStoryletEvaluation()
}

/**
 * Test that a storylet activates under given conditions (V2)
 */
export const expectStoryletToActivate = async (storylet: Storylet, gameState = null) => {
  if (gameState) {
    if (gameState.player) {
      useCoreGameStore.getState().updatePlayer(gameState.player)
    }
    if (gameState.world) {
      useCoreGameStore.getState().updateWorld(gameState.world)
    }
    await waitForStoreUpdate()
  }
  
  // Add storylet to narrative store
  useNarrativeStore.getState().addUserStorylet(storylet)
  await waitForStoreUpdate()
  
  // Evaluate storylets
  useNarrativeStore.getState().evaluateStorylets()
  await waitForStoryletEvaluation()
  
  // Check if storylet is active
  const narrativeState = useNarrativeStore.getState()
  const activeIds = narrativeState.storylets.active
  
  if (!activeIds.includes(storylet.id)) {
    throw new Error(`Expected storylet "${storylet.id}" to be active, but it was not. Active IDs: ${activeIds.join(', ')}`)
  }
}

/**
 * Helper to simulate game progression (V2)
 */
export const simulateGameProgress = async (days: number) => {
  const coreStore = useCoreGameStore.getState()
  const narrativeStore = useNarrativeStore.getState()
  
  for (let i = 0; i < days; i++) {
    // Advance day
    const currentWorld = coreStore.world
    coreStore.updateWorld({
      ...currentWorld,
      day: currentWorld.day + 1
    })
    
    // Evaluate storylets
    narrativeStore.evaluateStorylets()
    await waitForStoryletEvaluation()
    
    // Simulate some resource changes
    const currentPlayer = coreStore.player
    coreStore.updatePlayer({
      ...currentPlayer,
      resources: {
        ...currentPlayer.resources,
        energy: Math.max(0, (currentPlayer.resources.energy || 100) - Math.random() * 10),
        stress: Math.min(100, (currentPlayer.resources.stress || 0) + Math.random() * 5)
      }
    })
    
    await waitForStoreUpdate()
  }
}

/**
 * Set up test concerns in V2 narrative store
 */
export const setupTestConcerns = (concerns: Record<string, number>) => {
  useNarrativeStore.getState().updateConcerns(concerns)
}

/**
 * Set storylet flags in V2 narrative store
 */
export const setTestFlags = (flags: Record<string, any>) => {
  const narrativeStore = useNarrativeStore.getState()
  Object.entries(flags).forEach(([key, value]) => {
    narrativeStore.setStoryletFlag(key, value)
  })
}

/**
 * Get current V2 store states for debugging
 */
export const getStoreStates = () => ({
  core: useCoreGameStore.getState(),
  narrative: useNarrativeStore.getState(),
  social: useSocialStore.getState()
})

/**
 * Assert that storylets exist in V2 narrative store
 */
export const expectStoryletsInStore = (storyletIds: string[]) => {
  const narrativeStore = useNarrativeStore.getState()
  const allStorylets = narrativeStore.getAllStorylets()
  
  storyletIds.forEach(id => {
    const storylet = allStorylets.find(s => s.id === id)
    if (!storylet) {
      throw new Error(`Expected storylet ${id} to exist in narrative store, but it doesn't`)
    }
  })
}

/**
 * Assert that storylets are active in V2 narrative store
 */
export const expectStoryletsActive = (storyletIds: string[]) => {
  const narrativeStore = useNarrativeStore.getState()
  const activeIds = narrativeStore.storylets.active
  
  storyletIds.forEach(id => {
    if (!activeIds.includes(id)) {
      throw new Error(`Expected storylet ${id} to be active, but active IDs are: ${activeIds.join(', ')}`)
    }
  })
}

/**
 * Complete a storylet in V2 narrative store
 */
export const completeStorylet = (storyletId: string, choiceId: string = 'default') => {
  const narrativeStore = useNarrativeStore.getState()
  narrativeStore.recordStoryletCompletion(storyletId, choiceId)
}

/**
 * Create test data for a complete game scenario (V2)
 */
export const createCompleteTestScenario = (scenarioType: 'early' | 'mid' | 'late' = 'early') => {
  resetAllV2Stores()
  
  const scenarios = {
    early: {
      day: 3,
      player: {
        level: 1,
        resources: { energy: 80, stress: 20, money: 30, knowledge: 120, social: 180 }
      },
      concerns: { academic: 20, social: 15, financial: 5 }
    },
    mid: {
      day: 30,
      player: {
        level: 3,
        resources: { energy: 60, stress: 40, money: 150, knowledge: 300, social: 250 }
      },
      concerns: { academic: 25, social: 20, financial: 15, career: 10 }
    },
    late: {
      day: 80,
      player: {
        level: 5,
        resources: { energy: 70, stress: 30, money: 500, knowledge: 600, social: 400 }
      },
      concerns: { career: 30, financial: 20, academic: 15, social: 10 }
    }
  }
  
  const config = scenarios[scenarioType]
  
  // Set up core game state
  useCoreGameStore.getState().updateWorld({ day: config.day })
  useCoreGameStore.getState().updatePlayer(config.player)
  
  // Set up concerns
  useNarrativeStore.getState().updateConcerns(config.concerns)
  
  // Create some relevant storylets
  const storylets = createTestStorylets(5, {
    requirements: {
      resources: { energy: 10 },
      flags: Object.keys(config.concerns).map(c => `concern_${c}`)
    }
  })
  
  storylets.forEach(storylet => {
    useNarrativeStore.getState().addUserStorylet(storylet)
  })
  
  return {
    scenario: config,
    storylets
  }
}