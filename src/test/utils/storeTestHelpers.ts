// Store Test Helpers
// Utilities for proper store isolation and clean testing

import { vi } from 'vitest';
import { act } from '@testing-library/react';
import { useAppStore } from '../../stores/useAppStore';
import { useStoryletStore } from '../../stores/useStoryletStore';
import type { Storylet } from '../../types/storylet';

/**
 * Reset all stores to clean state - no contamination between tests
 */
export const resetAllStores = async () => {
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

  // Clear storylet store completely
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
  try {
    const { useStoryletCatalogStore } = require('../../stores/useStoryletCatalogStore');
    useStoryletCatalogStore.setState({
      allStorylets: {},
      lastLoaded: 0,
      isLoading: false
    });
  } catch (error) {
    // Catalog store might not exist, that's okay
  }

  // Clear any persistent storage
  localStorage.clear();
  sessionStorage.clear();

  // Wait for state to settle
  await new Promise(resolve => setTimeout(resolve, 10));
};

/**
 * Create a valid storylet with guaranteed structure
 */
export const createValidStorylet = (overrides: Partial<Storylet> = {}): Storylet => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  
  return {
    id: `valid-storylet-${timestamp}-${randomId}`,
    name: 'Valid Test Storylet',
    description: 'A properly structured test storylet',
    trigger: {
      type: 'flag',
      conditions: { flags: ['valid_test_flag'] }
    },
    choices: [
      {
        id: 'valid_choice_1',
        text: 'Valid Choice Option',
        effects: []
      }
    ],
    deploymentStatus: 'dev',
    ...overrides
  };
};

/**
 * Wait for async storylet evaluation to complete
 */
export const waitForAsyncEvaluation = async (timeout: number = 100) => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, timeout);
  });
};

/**
 * Wait for React state updates to propagate
 */
export const waitForStateUpdate = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
  });
};

/**
 * Mock the storylet catalog store to prevent file loading
 */
export const mockCatalogStore = () => {
  // Mock the catalog loading so tests don't try to load from disk
  vi.mock('../../data/storylets', () => ({
    default: []
  }));
  
  // Mock any catalog store if it exists
  try {
    const catalogStore = require('../../stores/useStoryletCatalogStore');
    if (catalogStore?.useStoryletCatalogStore) {
      vi.spyOn(catalogStore.useStoryletCatalogStore.getState(), 'loadFromDisk').mockResolvedValue([]);
    }
  } catch {
    // Catalog store might not exist, that's okay
  }
};

/**
 * Create storylets with specific trigger types for testing
 */
export const createTriggerTestStorylets = () => {
  return {
    timeBasedStorylet: createValidStorylet({
      id: 'time-test-storylet',
      name: 'Time-based Storylet',
      trigger: {
        type: 'time',
        conditions: { day: 5 }
      }
    }),
    
    flagBasedStorylet: createValidStorylet({
      id: 'flag-test-storylet',
      name: 'Flag-based Storylet',
      trigger: {
        type: 'flag',
        conditions: { flags: ['prerequisite_met'] }
      }
    }),
    
    resourceBasedStorylet: createValidStorylet({
      id: 'resource-test-storylet',
      name: 'Resource-based Storylet',
      trigger: {
        type: 'resource',
        conditions: { 
          resources: { 
            money: 100,
            energy: 50 
          } 
        }
      }
    })
  };
};

/**
 * Setup common test conditions
 */
export const setupTestConditions = {
  /**
   * Setup for time-based storylet testing
   */
  async timeBasedTest(day: number = 5) {
    await resetAllStores();
    useAppStore.setState({ day });
    await waitForStateUpdate();
  },

  /**
   * Setup for flag-based storylet testing
   */
  async flagBasedTest(flags: Record<string, boolean> = { 'prerequisite_met': true }) {
    await resetAllStores();
    Object.entries(flags).forEach(([key, value]) => {
      useStoryletStore.getState().setFlag(key, value);
    });
    await waitForStateUpdate();
  },

  /**
   * Setup for resource-based storylet testing
   */
  async resourceBasedTest(resources: Record<string, number> = { money: 150, energy: 75 }) {
    await resetAllStores();
    useAppStore.setState(state => ({
      resources: {
        ...state.resources,
        ...resources
      }
    }));
    await waitForStateUpdate();
  }
};

/**
 * Debug helper to log store states
 */
export const debugStoreStates = () => {
  const appState = useAppStore.getState();
  const storyletState = useStoryletStore.getState();
  
  console.log('🐛 Debug Store States:');
  console.log('App State:', {
    day: appState.day,
    resources: appState.resources,
    activeCharacter: appState.activeCharacter?.id
  });
  console.log('Storylet State:', {
    allStorylets: Object.keys(storyletState.allStorylets),
    activeStoryletIds: storyletState.activeStoryletIds,
    completedStoryletIds: storyletState.completedStoryletIds,
    activeFlags: storyletState.activeFlags
  });
};

/**
 * Validate that a storylet has proper structure
 */
export const validateStoryletStructure = (storylet: any): storylet is Storylet => {
  const required = ['id', 'name', 'description', 'trigger', 'choices'];
  const missing = required.filter(field => !storylet[field]);
  
  if (missing.length > 0) {
    console.warn(`Storylet missing required fields: ${missing.join(', ')}`);
    return false;
  }
  
  if (!storylet.trigger.type || !storylet.trigger.conditions) {
    console.warn('Storylet trigger is invalid');
    return false;
  }
  
  if (!Array.isArray(storylet.choices) || storylet.choices.length === 0) {
    console.warn('Storylet choices must be a non-empty array');
    return false;
  }
  
  return true;
};

/**
 * Helper to safely add storylets with validation
 */
export const safeAddStorylet = (storylet: Storylet) => {
  if (!validateStoryletStructure(storylet)) {
    throw new Error(`Invalid storylet structure: ${storylet.id}`);
  }
  
  const store = useStoryletStore.getState();
  store.addStorylet(storylet);
};

/**
 * Test isolation wrapper - ensures clean state before and after
 */
export const withCleanState = async (testFn: () => Promise<void> | void) => {
  await resetAllStores();
  try {
    await testFn();
  } finally {
    await resetAllStores();
  }
};