// /Users/montysharma/v11m2/test/flagGenerator.test.ts
// Comprehensive performance tests for memoized flag generation

import { 
  generateConcernFlags, 
  generateAllFlags, 
  clearFlagCache, 
  getFlagGeneratorStats,
  warmUpFlagCache,
  optimizeFlagCache,
  type CharacterConcerns 
} from '../src/utils/flagGenerator';

describe('Flag Generator Performance Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearFlagCache();
  });

  describe('Memoization Performance', () => {
    test('flag generation is memoized correctly', () => {
      const concerns: CharacterConcerns = {
        academic: 25,
        social: 15,
        financial: 10
      };

      // First generation - should be slow (cache miss)
      console.time('First generation');
      const flags1 = generateConcernFlags(concerns);
      console.timeEnd('First generation');

      // Second generation - should be fast (cache hit)
      console.time('Second generation (memoized)');
      const flags2 = generateConcernFlags(concerns);
      console.timeEnd('Second generation');

      // Should be the same reference (memoized)
      expect(flags1).toBe(flags2);
      expect(Object.keys(flags1).length).toBeGreaterThan(0);

      // Verify specific flags are generated correctly
      expect(flags1.concern_academic).toBe(true);
      expect(flags1.concern_academic_high).toBe(true);
      expect(flags1.concern_social_moderate).toBe(true);
      expect(flags1.concern_financial_low).toBe(true);
    });

    test('cache invalidation works correctly', () => {
      const concerns1: CharacterConcerns = { academic: 20 };
      const concerns2: CharacterConcerns = { academic: 30 }; // Different value

      const flags1 = generateConcernFlags(concerns1);
      const flags2 = generateConcernFlags(concerns2);

      // Should be different objects (different input)
      expect(flags1).not.toBe(flags2);
      
      // Should have different flag values
      expect(flags1.concern_academic_moderate).toBe(true);
      expect(flags1.concern_academic_critical).toBe(false);
      expect(flags2.concern_academic_critical).toBe(true);
    });

    test('memoization with identical objects but different references', () => {
      const concerns1: CharacterConcerns = { academic: 15, social: 10 };
      const concerns2: CharacterConcerns = { academic: 15, social: 10 }; // Same values, different object

      const flags1 = generateConcernFlags(concerns1);
      const flags2 = generateConcernFlags(concerns2);

      // Should be the same reference due to memoization
      expect(flags1).toBe(flags2);
    });

    test('object property order does not affect memoization', () => {
      const concerns1: CharacterConcerns = { academic: 15, social: 10, financial: 5 };
      const concerns2: CharacterConcerns = { social: 10, financial: 5, academic: 15 }; // Different order

      const flags1 = generateConcernFlags(concerns1);
      const flags2 = generateConcernFlags(concerns2);

      // Should be the same reference (order-independent serialization)
      expect(flags1).toBe(flags2);
    });
  });

  describe('Performance Benchmarks', () => {
    test('handles many storylet evaluations efficiently', async () => {
      // Create realistic concern data
      const concerns: CharacterConcerns = {
        academic: 20,
        social: 15,
        financial: 10,
        health: 5
      };

      // Warm up cache
      generateConcernFlags(concerns);

      // Simulate many storylet evaluations
      const iterations = 1000;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const flags = generateConcernFlags(concerns);
        // Simulate some flag checks
        const hasAcademicConcern = flags.concern_academic;
        const isStressed = flags.high_overall_stress;
        expect(typeof hasAcademicConcern).toBe('boolean');
        expect(typeof isStressed).toBe('boolean');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Evaluated ${iterations} flag generations in ${duration.toFixed(2)}ms`);
      console.log(`Average: ${(duration / iterations).toFixed(4)}ms per evaluation`);
      
      // Should be very fast due to memoization
      expect(duration).toBeLessThan(50); // Less than 50ms for 1000 calls
      expect(duration / iterations).toBeLessThan(0.1); // Less than 0.1ms per call
    });

    test('generateAllFlags performance with complex state', () => {
      const concerns: CharacterConcerns = {
        academic: 25,
        social: 20,
        financial: 15,
        health: 10,
        family: 12,
        career: 18,
        romantic: 8,
        personal: 22
      };

      const gameFlags = {
        player_level: 5,
        day: 50,
        completed_tutorial: true,
        has_scholarship: false,
        energy_level: 75,
        money: 500
      };

      const playerStats = {
        intelligence: 80,
        charisma: 60,
        fitness: 45,
        creativity: 70
      };

      const startTime = performance.now();
      
      // First call (cache miss)
      const allFlags1 = generateAllFlags(concerns, gameFlags, playerStats);
      const firstCallTime = performance.now() - startTime;
      
      // Second call (cache hit)
      const secondStartTime = performance.now();
      const allFlags2 = generateAllFlags(concerns, gameFlags, playerStats);
      const secondCallTime = performance.now() - secondStartTime;
      
      console.log(`First call (cache miss): ${firstCallTime.toFixed(2)}ms`);
      console.log(`Second call (cache hit): ${secondCallTime.toFixed(2)}ms`);
      console.log(`Total flags generated: ${Object.keys(allFlags1).length}`);
      
      // Should be memoized
      expect(allFlags1).toBe(allFlags2);
      
      // Second call should be much faster
      expect(secondCallTime).toBeLessThan(firstCallTime / 10);
      
      // Should generate comprehensive flags
      expect(Object.keys(allFlags1).length).toBeGreaterThan(50);
    });

    test('cache statistics tracking', () => {
      const concerns1: CharacterConcerns = { academic: 10 };
      const concerns2: CharacterConcerns = { academic: 20 };

      // Clear stats
      clearFlagCache();
      
      // Generate flags (cache miss)
      generateConcernFlags(concerns1);
      generateConcernFlags(concerns2);
      
      // Generate same flags again (cache hits)
      generateConcernFlags(concerns1);
      generateConcernFlags(concerns2);
      generateConcernFlags(concerns1);
      
      const stats = getFlagGeneratorStats();
      
      expect(stats.cacheHits).toBe(3); // 3 cache hits
      expect(stats.cacheMisses).toBe(2); // 2 cache misses
      expect(stats.cacheSize).toBe(2); // 2 unique entries
      expect(stats.lastGenerationTime).toBeGreaterThan(0);
    });
  });

  describe('Memory Management', () => {
    test('cache can be cleared manually', () => {
      const concerns: CharacterConcerns = { academic: 15 };
      
      // Generate flags
      generateConcernFlags(concerns);
      let stats = getFlagGeneratorStats();
      expect(stats.cacheSize).toBeGreaterThan(0);
      
      // Clear cache
      clearFlagCache();
      stats = getFlagGeneratorStats();
      expect(stats.cacheSize).toBe(0);
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(0);
    });

    test('cache optimization prevents memory leaks', () => {
      // Create many different concern patterns
      for (let i = 0; i < 150; i++) {
        const concerns: CharacterConcerns = {
          academic: i % 50,
          social: (i * 2) % 30,
          financial: (i * 3) % 25
        };
        generateConcernFlags(concerns);
      }
      
      let stats = getFlagGeneratorStats();
      const initialCacheSize = stats.cacheSize;
      
      // Optimize cache (should limit to 100 entries)
      optimizeFlagCache(100);
      
      stats = getFlagGeneratorStats();
      expect(stats.cacheSize).toBeLessThanOrEqual(100);
      
      console.log(`Cache optimized: ${initialCacheSize} -> ${stats.cacheSize} entries`);
    });

    test('warm up cache improves performance', () => {
      clearFlagCache();
      
      // Measure time without warm-up
      const coldStart = performance.now();
      generateConcernFlags({ academic: 20, social: 15 });
      const coldTime = performance.now() - coldStart;
      
      clearFlagCache();
      
      // Warm up cache
      warmUpFlagCache();
      
      // Measure time after warm-up (should be faster due to related patterns)
      const warmStart = performance.now();
      generateConcernFlags({ academic: 20, social: 15 });
      const warmTime = performance.now() - warmStart;
      
      console.log(`Cold start: ${coldTime.toFixed(2)}ms, Warm start: ${warmTime.toFixed(2)}ms`);
      
      // Warm start should be faster or at least not significantly slower
      expect(warmTime).toBeLessThanOrEqual(coldTime * 2);
    });
  });

  describe('Edge Cases and Reliability', () => {
    test('handles empty concerns gracefully', () => {
      const emptyFlags = generateConcernFlags({});
      
      expect(typeof emptyFlags).toBe('object');
      expect(emptyFlags.has_any_concerns).toBe(false);
      expect(emptyFlags.low_overall_stress).toBe(true);
    });

    test('handles null/undefined concerns', () => {
      const nullFlags = generateConcernFlags(null as any);
      const undefinedFlags = generateConcernFlags(undefined as any);
      
      expect(typeof nullFlags).toBe('object');
      expect(typeof undefinedFlags).toBe('object');
      expect(Object.keys(nullFlags).length).toBe(0);
      expect(Object.keys(undefinedFlags).length).toBe(0);
    });

    test('handles concerns with zero values', () => {
      const concerns: CharacterConcerns = {
        academic: 0,
        social: 0,
        financial: 10
      };
      
      const flags = generateConcernFlags(concerns);
      
      expect(flags.concern_academic).toBe(false);
      expect(flags.concern_academic_none).toBe(true);
      expect(flags.concern_social).toBe(false);
      expect(flags.concern_financial).toBe(true);
      expect(flags.concern_financial_low).toBe(true);
    });

    test('handles extreme concern values', () => {
      const concerns: CharacterConcerns = {
        academic: 100,
        social: -5, // Invalid, should be ignored
        financial: 50
      };
      
      const flags = generateConcernFlags(concerns);
      
      expect(flags.concern_academic_critical).toBe(true);
      expect(flags.concern_academic_overwhelming).toBe(true);
      expect(flags.crisis_mode).toBe(true);
      
      // Negative values should be handled gracefully
      expect(flags.concern_social).toBeDefined();
    });

    test('serialization stability with special values', () => {
      const concerns1: CharacterConcerns = {
        academic: 10.5,
        social: 20,
        financial: 15.7
      };
      
      const concerns2: CharacterConcerns = {
        academic: 10.5,
        social: 20,
        financial: 15.7
      };
      
      const flags1 = generateConcernFlags(concerns1);
      const flags2 = generateConcernFlags(concerns2);
      
      // Should be memoized despite floating point values
      expect(flags1).toBe(flags2);
    });
  });

  describe('Integration Tests', () => {
    test('works with realistic game scenarios', () => {
      // Scenario 1: New student with minor concerns
      const newStudent: CharacterConcerns = {
        academic: 8,
        social: 12,
        financial: 5
      };
      
      const newStudentFlags = generateConcernFlags(newStudent);
      expect(newStudentFlags.low_overall_stress).toBe(true);
      expect(newStudentFlags.has_multiple_concerns).toBe(true);
      
      // Scenario 2: Stressed student mid-semester
      const stressedStudent: CharacterConcerns = {
        academic: 22,
        social: 18,
        financial: 25,
        health: 15
      };
      
      const stressedFlags = generateConcernFlags(stressedStudent);
      expect(stressedFlags.high_overall_stress).toBe(true);
      expect(stressedFlags.overwhelmed).toBe(true);
      expect(stressedFlags.has_many_concerns).toBe(true);
      
      // Scenario 3: Crisis situation
      const crisisStudent: CharacterConcerns = {
        academic: 35,
        social: 28,
        financial: 32,
        health: 25,
        family: 20
      };
      
      const crisisFlags = generateConcernFlags(crisisStudent);
      expect(crisisFlags.crisis_mode).toBe(true);
      expect(crisisFlags.triple_threat).toBe(true);
    });

    test('generateAllFlags integration', () => {
      const concerns: CharacterConcerns = {
        academic: 20,
        financial: 15
      };
      
      const gameFlags = {
        has_scholarship: true,
        tutorial_complete: false,
        day: 45
      };
      
      const playerStats = {
        intelligence: 85,
        charisma: 60
      };
      
      const allFlags = generateAllFlags(concerns, gameFlags, playerStats);
      
      // Should include concern flags
      expect(allFlags.concern_academic_moderate).toBe(true);
      expect(allFlags.concern_financial_moderate).toBe(true);
      
      // Should include game flags
      expect(allFlags.has_scholarship).toBe(true);
      expect(allFlags.tutorial_complete).toBe(false);
      
      // Should include derived flags
      expect(allFlags.has_scholarship_positive).toBe(true);
      expect(allFlags.tutorial_complete_zero).toBe(true);
      
      // Should include stat flags
      expect(allFlags.stat_intelligence_high).toBe(true);
      expect(allFlags.stat_charisma_medium).toBe(true);
    });
  });
});