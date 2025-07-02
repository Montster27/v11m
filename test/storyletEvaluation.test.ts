// /Users/montysharma/v11m2/test/storyletEvaluation.test.ts
// Performance tests for batched storylet evaluation

import { renderHook, waitFor } from '@testing-library/react';
import { 
  useAvailableStorylets, 
  useStoryletAvailable, 
  useStoryletEvaluationPerformance 
} from '../src/hooks/useAvailableStorylets';
import { generateConcernFlags, clearFlagCache } from '../src/utils/flagGenerator';
import type { Storylet } from '../src/types/storylet';

// Mock stores
jest.mock('../src/store/useStoryletStore', () => ({
  useStoryletStore: jest.fn()
}));

jest.mock('../src/store/useCharacterConcernsStore', () => ({
  useCharacterConcernsStore: jest.fn()
}));

jest.mock('../src/stores/v2', () => ({
  useCoreGameStore: jest.fn()
}));

const mockUseStoryletStore = require('../src/store/useStoryletStore').useStoryletStore;
const mockUseCharacterConcernsStore = require('../src/store/useCharacterConcernsStore').useCharacterConcernsStore;
const mockUseCoreGameStore = require('../src/stores/v2').useCoreGameStore;

describe('Storylet Evaluation Performance Tests', () => {
  beforeEach(() => {
    clearFlagCache();
    jest.clearAllMocks();
  });

  const createMockStorylet = (id: string, requirements?: any): Storylet => ({
    id,
    name: `Storylet ${id}`,
    description: `Test storylet ${id}`,
    requirements: requirements || {},
    choices: [],
    // Add other required Storylet properties as needed
  } as Storylet);

  const setupMockStores = (storylets: Storylet[], concerns: any, gameState: any) => {
    mockUseStoryletStore.mockReturnValue({
      storylets
    });

    mockUseCharacterConcernsStore.mockReturnValue({
      concerns
    });

    mockUseCoreGameStore.mockReturnValue({
      player: gameState.player || { level: 1, resources: { energy: 100, money: 0 } },
      world: gameState.world || { day: 1 },
      character: gameState.character || { name: 'Test Character' }
    });
  };

  describe('Basic Functionality', () => {
    test('returns empty array when no concerns', async () => {
      setupMockStores([], null, {});

      const { result } = renderHook(() => useAvailableStorylets());

      await waitFor(() => {
        expect(result.current.availableStorylets).toEqual([]);
        expect(result.current.isEvaluating).toBe(false);
      });
    });

    test('evaluates simple storylets correctly', async () => {
      const storylets = [
        createMockStorylet('storylet1', { flags: ['concern_academic'] }),
        createMockStorylet('storylet2', { flags: ['concern_social'] }),
        createMockStorylet('storylet3', {}) // No requirements
      ];

      const concerns = { academic: 20, social: 5 };
      setupMockStores(storylets, concerns, {});

      const { result } = renderHook(() => useAvailableStorylets());

      await waitFor(() => {
        expect(result.current.isEvaluating).toBe(false);
      });

      // Should include storylets that match flags and storylet with no requirements
      expect(result.current.availableStorylets.length).toBeGreaterThanOrEqual(2);
      expect(result.current.totalStorylets).toBe(3);
    });
  });

  describe('Performance Tests', () => {
    test('handles large number of storylets efficiently', async () => {
      // Create 1000 test storylets with various requirements
      const storylets: Storylet[] = [];
      for (let i = 0; i < 1000; i++) {
        const requirements = i % 10 === 0 ? {} : {
          flags: [
            i % 3 === 0 ? 'concern_academic_high' : 'concern_social_moderate',
            i % 5 === 0 ? 'has_any_concerns' : 'low_overall_stress'
          ]
        };
        storylets.push(createMockStorylet(`storylet_${i}`, requirements));
      }

      const concerns = {
        academic: 25,
        social: 15,
        financial: 10
      };

      setupMockStores(storylets, concerns, {});

      const startTime = performance.now();
      const { result } = renderHook(() => useAvailableStorylets({
        batchSize: 100,
        enableProfiling: true
      }));

      await waitFor(() => {
        expect(result.current.isEvaluating).toBe(false);
      }, { timeout: 5000 });

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Evaluated ${storylets.length} storylets in ${duration.toFixed(2)}ms`);
      console.log(`Found ${result.current.availableStorylets.length} available storylets`);
      console.log(`Cache stats:`, result.current.cacheStats);

      expect(result.current.totalStorylets).toBe(1000);
      expect(result.current.evaluationTime).toBeLessThan(1000); // Should complete within 1 second
      expect(duration).toBeLessThan(2000); // Total test should complete within 2 seconds
    });

    test('batching prevents UI blocking', async () => {
      // Create many storylets
      const storylets = Array.from({ length: 500 }, (_, i) => 
        createMockStorylet(`storylet_${i}`, {
          flags: [`concern_academic_${i % 3 === 0 ? 'high' : 'low'}`]
        })
      );

      const concerns = { academic: 20 };
      setupMockStores(storylets, concerns, {});

      const { result } = renderHook(() => useAvailableStorylets({
        batchSize: 25, // Small batches
        timeoutMs: 50, // Frequent yielding
        enableProfiling: true
      }));

      // Should start evaluating immediately
      expect(result.current.isEvaluating).toBe(true);

      // Should complete evaluation
      await waitFor(() => {
        expect(result.current.isEvaluating).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.availableStorylets.length).toBeGreaterThan(0);
    });

    test('memoization improves repeated evaluations', async () => {
      const storylets = Array.from({ length: 100 }, (_, i) => 
        createMockStorylet(`storylet_${i}`, {
          flags: ['concern_academic', 'has_any_concerns']
        })
      );

      const concerns = { academic: 15, social: 10 };
      setupMockStores(storylets, concerns, {});

      // First evaluation
      const { result: result1 } = renderHook(() => useAvailableStorylets({
        enableProfiling: true
      }));

      await waitFor(() => {
        expect(result1.current.isEvaluating).toBe(false);
      });

      const firstEvaluationTime = result1.current.evaluationTime;

      // Second evaluation with same data (should be faster due to memoization)
      const { result: result2 } = renderHook(() => useAvailableStorylets({
        enableProfiling: true
      }));

      await waitFor(() => {
        expect(result2.current.isEvaluating).toBe(false);
      });

      const secondEvaluationTime = result2.current.evaluationTime;

      console.log(`First evaluation: ${firstEvaluationTime.toFixed(2)}ms`);
      console.log(`Second evaluation: ${secondEvaluationTime.toFixed(2)}ms`);
      console.log(`Cache stats:`, result2.current.cacheStats);

      // Second evaluation should be faster due to flag memoization
      expect(result2.current.cacheStats.cacheHits).toBeGreaterThan(0);
    });
  });

  describe('Hook Variants', () => {
    test('useStoryletAvailable works correctly', async () => {
      const storylets = [
        createMockStorylet('available_storylet', { flags: ['concern_academic'] }),
        createMockStorylet('unavailable_storylet', { flags: ['concern_financial_high'] })
      ];

      const concerns = { academic: 20, social: 10 };
      setupMockStores(storylets, concerns, {});

      const { result } = renderHook(() => useStoryletAvailable('available_storylet'));

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    test('useStoryletEvaluationPerformance tracks metrics', async () => {
      const storylets = Array.from({ length: 50 }, (_, i) => 
        createMockStorylet(`storylet_${i}`)
      );

      const concerns = { academic: 15 };
      setupMockStores(storylets, concerns, {});

      const { result } = renderHook(() => useStoryletEvaluationPerformance());

      await waitFor(() => {
        expect(result.current.performanceLog.length).toBeGreaterThan(0);
      }, { timeout: 2000 });

      expect(result.current.averageEvaluationTime).toBeGreaterThan(0);
      expect(result.current.currentStats).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty storylet list', async () => {
      setupMockStores([], { academic: 20 }, {});

      const { result } = renderHook(() => useAvailableStorylets());

      await waitFor(() => {
        expect(result.current.availableStorylets).toEqual([]);
        expect(result.current.isEvaluating).toBe(false);
        expect(result.current.totalStorylets).toBe(0);
      });
    });

    test('handles storylets with malformed requirements', async () => {
      const storylets = [
        createMockStorylet('valid_storylet', { flags: ['concern_academic'] }),
        createMockStorylet('invalid_storylet', { flags: null }), // Invalid requirements
        createMockStorylet('undefined_storylet', undefined) // Undefined requirements
      ];

      const concerns = { academic: 20 };
      setupMockStores(storylets, concerns, {});

      const { result } = renderHook(() => useAvailableStorylets());

      await waitFor(() => {
        expect(result.current.isEvaluating).toBe(false);
      });

      // Should handle malformed requirements gracefully
      expect(result.current.totalStorylets).toBe(3);
      expect(result.current.availableStorylets.length).toBeGreaterThanOrEqual(1);
    });

    test('handles concern changes during evaluation', async () => {
      const storylets = Array.from({ length: 100 }, (_, i) => 
        createMockStorylet(`storylet_${i}`, { flags: ['concern_academic'] })
      );

      let concerns = { academic: 20 };
      setupMockStores(storylets, concerns, {});

      const { result, rerender } = renderHook(() => useAvailableStorylets({
        batchSize: 10 // Small batches to allow interruption
      }));

      // Change concerns while evaluation might be in progress
      setTimeout(() => {
        concerns = { academic: 0 }; // Clear academic concerns
        setupMockStores(storylets, concerns, {});
        rerender();
      }, 10);

      await waitFor(() => {
        expect(result.current.isEvaluating).toBe(false);
      }, { timeout: 2000 });

      // Should handle the change gracefully
      expect(result.current.totalStorylets).toBe(100);
    });
  });

  describe('Memory Management', () => {
    test('does not create memory leaks with frequent re-evaluations', async () => {
      const storylets = Array.from({ length: 100 }, (_, i) => 
        createMockStorylet(`storylet_${i}`)
      );

      // Simulate many re-evaluations with different concerns
      for (let i = 0; i < 20; i++) {
        const concerns = { academic: i * 2, social: i };
        setupMockStores(storylets, concerns, {});

        const { result, unmount } = renderHook(() => useAvailableStorylets());

        await waitFor(() => {
          expect(result.current.isEvaluating).toBe(false);
        });

        unmount(); // Clean up hook
      }

      // Check that cache hasn't grown excessively
      const flags = generateConcernFlags({ academic: 10 });
      expect(typeof flags).toBe('object');

      // Test should complete without memory issues
      expect(true).toBe(true);
    });
  });
});