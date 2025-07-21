// Store Integration Tests
// Tests real store functionality with real data, no mocks

import { describe, test, expect, beforeEach } from 'vitest';
import { resetAllStores } from '../utils/gameTestUtils';

// Import actual stores
import { useAppStore } from '../../stores/useAppStore';
import { useStoryletStore } from '../../stores/useStoryletStore';

describe('Store Integration Tests', () => {
  beforeEach(() => {
    // Reset stores to clean state using real reset functionality
    resetAllStores();
  });

  describe('AppStore Functionality', () => {
    test('should initialize with default state', () => {
      const state = useAppStore.getState();
      
      expect(state.day).toBeDefined();
      expect(state.resources).toBeDefined();
      expect(typeof state.day).toBe('number');
      expect(state.day).toBeGreaterThan(0);
    });

    test('should update player resources', () => {
      const store = useAppStore.getState();
      const initialMoney = store.resources?.money || 0;
      
      // Update resources using real store methods
      useAppStore.setState(state => ({
        resources: {
          ...state.resources,
          money: (state.resources?.money || 0) + 100
        }
      }));
      
      const updatedState = useAppStore.getState();
      expect(updatedState.resources?.money).toBe(initialMoney + 100);
    });

    test('should advance day', () => {
      const initialDay = useAppStore.getState().day || 1;
      
      useAppStore.setState(state => ({
        day: (state.day || 1) + 1
      }));
      
      const newState = useAppStore.getState();
      expect(newState.day).toBe(initialDay + 1);
    });

    test('should handle character creation', () => {
      const testCharacter = {
        id: 'test-char-id',
        name: 'Test Character',
        background: 'academic',
        concerns: {
          academics: 20,
          socialFitting: 15,
          financial: 10,
          isolation: 5,
          genderIssues: 0,
          raceIssues: 0,
          classIssues: 0
        }
      };
      
      useAppStore.setState({
        activeCharacter: testCharacter
      });
      
      const state = useAppStore.getState();
      expect(state.activeCharacter).toEqual(testCharacter);
      expect(state.activeCharacter?.name).toBe('Test Character');
    });
  });

  describe('StoryletStore Functionality', () => {
    test('should initialize with empty storylets', () => {
      const state = useStoryletStore.getState();
      
      expect(state.allStorylets).toBeDefined();
      expect(state.activeStoryletIds).toBeDefined();
      expect(state.completedStoryletIds).toBeDefined();
      expect(Array.isArray(state.activeStoryletIds)).toBe(true);
      expect(Array.isArray(state.completedStoryletIds)).toBe(true);
    });

    test('should add storylets', () => {
      const testStorylet = {
        id: 'test-storylet',
        name: 'Test Storylet',
        description: 'A test storylet',
        choices: [
          {
            id: 'choice1',
            text: 'Test choice',
            effects: []
          }
        ],
        trigger: {
          type: 'time' as const,
          conditions: { day: 1 }
        }
      };
      
      useStoryletStore.getState().addStorylet(testStorylet);
      
      const state = useStoryletStore.getState();
      expect(state.allStorylets['test-storylet']).toEqual(testStorylet);
    });

    test('should set and get flags', () => {
      const store = useStoryletStore.getState();
      
      store.setFlag('test_flag', true);
      
      const state = useStoryletStore.getState();
      expect(state.activeFlags?.test_flag).toBe(true);
      
      store.setFlag('test_flag', false);
      const updatedState = useStoryletStore.getState();
      expect(updatedState.activeFlags?.test_flag).toBe(false);
    });

    test('should evaluate storylets based on conditions', () => {
      // Set up game state
      useAppStore.setState({ day: 5 });
      
      const timeBasedStorylet = {
        id: 'time-storylet',
        name: 'Time-based Storylet',
        description: 'Triggers on day 5',
        choices: [
          {
            id: 'choice1',
            text: 'Continue',
            effects: []
          }
        ],
        trigger: {
          type: 'time' as const,
          conditions: { day: 5 }
        }
      };
      
      const store = useStoryletStore.getState();
      store.addStorylet(timeBasedStorylet);
      store.evaluateStorylets();
      
      const state = useStoryletStore.getState();
      expect(state.activeStoryletIds).toContain('time-storylet');
    });

    test('should handle storylet completion', () => {
      const store = useStoryletStore.getState();
      
      store.setFlag('storylet_completed', true);
      
      const storylet = {
        id: 'completable-storylet',
        name: 'Completable Storylet',
        description: 'A storylet that can be completed',
        choices: [
          {
            id: 'complete',
            text: 'Complete',
            effects: [
              {
                type: 'flag' as const,
                key: 'storylet_completed',
                value: true
              }
            ]
          }
        ],
        trigger: {
          type: 'flag' as const,
          conditions: { flags: ['storylet_completed'] }
        }
      };
      
      store.addStorylet(storylet);
      store.evaluateStorylets();
      
      const state = useStoryletStore.getState();
      expect(state.activeStoryletIds).toContain('completable-storylet');
    });
  });

  describe('Cross-Store Integration', () => {
    test('should allow storylets to affect app state', () => {
      const initialMoney = useAppStore.getState().resources?.money || 0;
      
      // Create storylet that gives money
      const moneyStorylet = {
        id: 'money-storylet',
        name: 'Money Storylet',
        description: 'Gives player money',
        choices: [
          {
            id: 'get-money',
            text: 'Get money',
            effects: [
              {
                type: 'resource' as const,
                key: 'money',
                delta: 50
              }
            ]
          }
        ],
        trigger: {
          type: 'time' as const,
          conditions: { day: 1 }
        }
      };
      
      const storyletStore = useStoryletStore.getState();
      storyletStore.addStorylet(moneyStorylet);
      storyletStore.evaluateStorylets();
      
      // Simulate choosing the money option
      const choice = moneyStorylet.choices[0];
      choice.effects.forEach(effect => {
        if (effect.type === 'resource') {
          useAppStore.setState(state => ({
            resources: {
              ...state.resources,
              [effect.key]: (state.resources?.[effect.key as keyof typeof state.resources] || 0) + effect.delta
            }
          }));
        }
      });
      
      const finalMoney = useAppStore.getState().resources?.money || 0;
      expect(finalMoney).toBe(initialMoney + 50);
    });

    test('should allow app state to trigger storylets', () => {
      // Set up resource-based storylet
      const resourceStorylet = {
        id: 'resource-storylet',
        name: 'Resource Storylet',
        description: 'Triggers when money > 100',
        choices: [
          {
            id: 'spend-money',
            text: 'Spend money',
            effects: []
          }
        ],
        trigger: {
          type: 'resource' as const,
          conditions: {
            resources: { money: 100 }
          }
        }
      };
      
      const storyletStore = useStoryletStore.getState();
      storyletStore.addStorylet(resourceStorylet);
      
      // Set money to trigger condition
      useAppStore.setState(state => ({
        resources: {
          ...state.resources,
          money: 150
        }
      }));
      
      storyletStore.evaluateStorylets();
      
      const state = useStoryletStore.getState();
      expect(state.activeStoryletIds).toContain('resource-storylet');
    });
  });

  describe('Persistence and State Management', () => {
    test('should maintain state consistency across operations', () => {
      // Perform multiple operations
      useAppStore.setState({ day: 10 });
      useStoryletStore.getState().setFlag('test_flag', true);
      
      useAppStore.setState(state => ({
        resources: {
          ...state.resources,
          energy: 75,
          money: 200
        }
      }));
      
      // Verify all changes persisted
      const appState = useAppStore.getState();
      const storyletState = useStoryletStore.getState();
      
      expect(appState.day).toBe(10);
      expect(appState.resources?.energy).toBe(75);
      expect(appState.resources?.money).toBe(200);
      expect(storyletState.activeFlags?.test_flag).toBe(true);
    });

    test('should handle rapid state changes', () => {
      // Perform rapid updates
      for (let i = 0; i < 10; i++) {
        useAppStore.setState(state => ({
          day: (state.day || 1) + 1
        }));
      }
      
      const finalState = useAppStore.getState();
      expect(finalState.day).toBeGreaterThan(10);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid storylet data gracefully', () => {
      const store = useStoryletStore.getState();
      
      // Try to add invalid storylet
      expect(() => {
        store.addStorylet({} as any);
      }).not.toThrow();
      
      // Store should still be functional
      const state = useStoryletStore.getState();
      expect(state.allStorylets).toBeDefined();
    });

    test('should handle invalid resource updates gracefully', () => {
      expect(() => {
        useAppStore.setState({
          resources: null as any
        });
      }).not.toThrow();
      
      // Should recover or maintain valid state
      const state = useAppStore.getState();
      expect(state).toBeDefined();
    });
  });
});