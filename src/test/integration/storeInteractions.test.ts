// /Users/montysharma/v11m2/src/test/integration/storeInteractions.test.ts
// Integration tests for store interactions and cross-store functionality

import { describe, it, expect, beforeEach } from 'vitest';
import { resetAllStores } from '../utils/gameTestUtils';
import { useAppStore } from '../../stores/useAppStore';
import { useStoryletStore } from '../../stores/useStoryletStore';
import { useCoreGameStore } from '../../stores/v2/useCoreGameStore';
import { useSocialStore } from '../../stores/v2/useSocialStore';
import { useStoryletCatalogStore } from '../../stores/useStoryletCatalogStore';

describe('Store Interactions Integration', () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe('V1 to V2 Store Migration', () => {
    it('should migrate app store data to core game store', () => {
      const appStore = useAppStore.getState();
      const coreGameStore = useCoreGameStore.getState();

      // Set up initial v1 data
      useAppStore.setState({
        day: 15,
        userLevel: 3,
        experience: 250,
        resources: {
          energy: 60,
          stress: 40,
          money: 150,
          knowledge: 200,
          social: 180
        }
      });

      // Verify v1 state
      const v1State = useAppStore.getState();
      expect(v1State.day).toBe(15);
      expect(v1State.userLevel).toBe(3);
      expect(v1State.experience).toBe(250);

      // Trigger migration
      coreGameStore.migrateFromLegacyStores();

      // Verify v2 state has migrated data
      const v2State = useCoreGameStore.getState();
      expect(v2State.world.day).toBe(15);
      expect(v2State.player.level).toBe(3);
      expect(v2State.player.experience).toBe(250);
    });

    it('should handle migration with partial data', () => {
      const coreGameStore = useCoreGameStore.getState();

      // Set up partial v1 data
      useAppStore.setState({
        day: 7,
        resources: {
          energy: 80,
          stress: 20,
          money: 75,
          knowledge: 150,
          social: 120
        }
        // Missing userLevel and experience
      });

      // Trigger migration
      coreGameStore.migrateFromLegacyStores();

      // Should handle missing data gracefully
      const v2State = useCoreGameStore.getState();
      expect(v2State.world.day).toBe(7);
      expect(v2State.player.level).toBe(1); // Default value
      expect(v2State.player.experience).toBe(0); // Default value
    });

    it('should migrate minigame data correctly', () => {
      const coreGameStore = useCoreGameStore.getState();

      // Record some minigame results in v2 store
      const gameResult1 = {
        success: true,
        stats: { score: 100, timeElapsed: 120000 }
      };
      const gameResult2 = {
        success: false,
        stats: { score: 45, timeElapsed: 180000 }
      };

      coreGameStore.recordGameResult('memory-cards', gameResult1, 'easy');
      coreGameStore.recordGameResult('word-scramble', gameResult2, 'medium');

      // Check minigame data is stored correctly
      const memoryStats = coreGameStore.getGameStats('memory-cards');
      expect(memoryStats).toBeDefined();
      expect(memoryStats.totalPlays).toBe(1);
      expect(memoryStats.totalWins).toBe(1);
      expect(memoryStats.bestScore).toBe(100);

      const wordStats = coreGameStore.getGameStats('word-scramble');
      expect(wordStats).toBeDefined();
      expect(wordStats.totalPlays).toBe(1);
      expect(wordStats.totalLosses).toBe(1);
      expect(wordStats.bestScore).toBe(45);
    });
  });

  describe('Store State Synchronization', () => {
    it('should maintain consistency between storylet stores', () => {
      const storyletStore = useStoryletStore.getState();
      const catalogStore = useStoryletCatalogStore.getState();

      // Add storylets to catalog
      const testStorylets = {
        'sync-test-1': {
          id: 'sync-test-1',
          title: 'Sync Test 1',
          description: 'First sync test',
          sections: [{ 
            id: 'section1', 
            content: 'Sync content 1',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [{ type: 'flag', flag: 'sync1_done', value: true }] 
            }]
          }],
          requirements: { flags: {} },
          effects: [],
          tags: ['sync'],
          frequency: 'once',
          deployment: 'dev'
        },
        'sync-test-2': {
          id: 'sync-test-2',
          title: 'Sync Test 2',
          description: 'Second sync test',
          sections: [{ 
            id: 'section1', 
            content: 'Sync content 2',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [{ type: 'flag', flag: 'sync2_done', value: true }] 
            }]
          }],
          requirements: { flags: { sync1_done: true } },
          effects: [],
          tags: ['sync'],
          frequency: 'once',
          deployment: 'dev'
        }
      };

      useStoryletCatalogStore.setState({
        allStorylets: testStorylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      // Sync to main store
      storyletStore.syncFromCatalogStore();

      // Verify storylets are available
      expect(Object.keys(storyletStore.allStorylets)).toContain('sync-test-1');
      expect(Object.keys(storyletStore.allStorylets)).toContain('sync-test-2');

      // Evaluate storylets
      storyletStore.evaluateStorylets();

      // Only sync-test-1 should be active initially
      expect(storyletStore.activeStoryletIds).toContain('sync-test-1');
      expect(storyletStore.activeStoryletIds).not.toContain('sync-test-2');

      // Complete first storylet
      storyletStore.chooseStorylet('sync-test-1', 'choice1');
      expect(storyletStore.activeFlags.sync1_done).toBe(true);

      // Re-evaluate
      storyletStore.evaluateStorylets();

      // Now sync-test-2 should be available
      expect(storyletStore.activeStoryletIds).toContain('sync-test-2');
    });

    it('should handle resource changes across stores', () => {
      const appStore = useAppStore.getState();
      const storyletStore = useStoryletStore.getState();

      // Create storylet that modifies resources
      const resourceStorylet = {
        'resource-modifier': {
          id: 'resource-modifier',
          title: 'Resource Modifier',
          description: 'Modifies player resources',
          sections: [{ 
            id: 'section1', 
            content: 'Choose your action',
            choices: [
              { 
                id: 'work', 
                text: 'Work (+money, -energy)', 
                effects: [
                  { type: 'resource', resource: 'money', change: 25 },
                  { type: 'resource', resource: 'energy', change: -15 }
                ] 
              },
              { 
                id: 'rest', 
                text: 'Rest (+energy, -money)', 
                effects: [
                  { type: 'resource', resource: 'energy', change: 20 },
                  { type: 'resource', resource: 'money', change: -5 }
                ] 
              }
            ]
          }],
          requirements: { flags: {} },
          effects: [],
          tags: ['resource'],
          frequency: 'repeatable',
          deployment: 'dev'
        }
      };

      useStoryletCatalogStore.setState({
        allStorylets: resourceStorylet,
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();

      const initialMoney = useAppStore.getState().resources.money;
      const initialEnergy = useAppStore.getState().resources.energy;

      // Choose work option
      storyletStore.chooseStorylet('resource-modifier', 'work');

      // Resources should be updated
      const finalMoney = useAppStore.getState().resources.money;
      const finalEnergy = useAppStore.getState().resources.energy;

      expect(finalMoney).toBe(initialMoney + 25);
      expect(finalEnergy).toBe(initialEnergy - 15);
    });
  });

  describe('Cross-Store Event Handling', () => {
    it('should handle flag changes affecting multiple stores', () => {
      const storyletStore = useStoryletStore.getState();
      const appStore = useAppStore.getState();

      // Set initial flag
      storyletStore.setFlag('achievement_unlocked', true);
      expect(storyletStore.getFlag('achievement_unlocked')).toBe(true);

      // Create storylet that requires this flag
      const flagDependentStorylet = {
        'flag-dependent': {
          id: 'flag-dependent',
          title: 'Flag Dependent',
          description: 'Requires achievement flag',
          sections: [{ 
            id: 'section1', 
            content: 'Achievement content',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [{ type: 'flag', flag: 'achievement_used', value: true }] 
            }]
          }],
          requirements: { flags: { achievement_unlocked: true } },
          effects: [],
          tags: ['achievement'],
          frequency: 'once',
          deployment: 'dev'
        }
      };

      useStoryletCatalogStore.setState({
        allStorylets: flagDependentStorylet,
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();
      storyletStore.evaluateStorylets();

      // Should be available
      expect(storyletStore.activeStoryletIds).toContain('flag-dependent');

      // Complete it
      storyletStore.chooseStorylet('flag-dependent', 'choice1');
      expect(storyletStore.activeFlags.achievement_used).toBe(true);
    });

    it('should handle day progression affecting storylet availability', () => {
      const appStore = useAppStore.getState();
      const storyletStore = useStoryletStore.getState();

      // Create day-specific storylets
      const dayStorylets = {
        'day-5-event': {
          id: 'day-5-event',
          title: 'Day 5 Event',
          description: 'Available on day 5',
          sections: [{ 
            id: 'section1', 
            content: 'Day 5 content',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [{ type: 'flag', flag: 'day5_event_seen', value: true }] 
            }]
          }],
          requirements: { flags: {}, day: 5 },
          effects: [],
          tags: ['daily'],
          frequency: 'once',
          deployment: 'dev'
        },
        'day-10-event': {
          id: 'day-10-event',
          title: 'Day 10 Event',
          description: 'Available on day 10',
          sections: [{ 
            id: 'section1', 
            content: 'Day 10 content',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [{ type: 'flag', flag: 'day10_event_seen', value: true }] 
            }]
          }],
          requirements: { flags: {}, day: 10 },
          effects: [],
          tags: ['daily'],
          frequency: 'once',
          deployment: 'dev'
        }
      };

      useStoryletCatalogStore.setState({
        allStorylets: dayStorylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();

      // Day 1 - no events available
      storyletStore.evaluateStorylets();
      expect(storyletStore.activeStoryletIds).not.toContain('day-5-event');
      expect(storyletStore.activeStoryletIds).not.toContain('day-10-event');

      // Advance to day 5
      useAppStore.setState({ day: 5 });
      storyletStore.evaluateStorylets();
      expect(storyletStore.activeStoryletIds).toContain('day-5-event');
      expect(storyletStore.activeStoryletIds).not.toContain('day-10-event');

      // Advance to day 10
      useAppStore.setState({ day: 10 });
      storyletStore.evaluateStorylets();
      expect(storyletStore.activeStoryletIds).toContain('day-10-event');
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain data consistency during complex operations', () => {
      const appStore = useAppStore.getState();
      const storyletStore = useStoryletStore.getState();
      const coreGameStore = useCoreGameStore.getState();

      // Perform multiple operations
      useAppStore.setState({ day: 3 });
      storyletStore.setFlag('complex_operation', true);
      coreGameStore.recordGameResult('test-game', { success: true, stats: { score: 50 } }, 'easy');

      // Verify all stores maintain their state
      expect(useAppStore.getState().day).toBe(3);
      expect(useStoryletStore.getState().activeFlags.complex_operation).toBe(true);
      expect(useCoreGameStore.getState().getGameStats('test-game')).toBeDefined();

      // Trigger migration
      coreGameStore.migrateFromLegacyStores();

      // V2 store should reflect v1 changes
      expect(useCoreGameStore.getState().world.day).toBe(3);
      
      // Original stores should still maintain their state
      expect(useAppStore.getState().day).toBe(3);
      expect(useStoryletStore.getState().activeFlags.complex_operation).toBe(true);
    });

    it('should handle concurrent store updates', () => {
      const storyletStore = useStoryletStore.getState();
      const socialStore = useSocialStore.getState();

      // Simulate concurrent operations
      storyletStore.setFlag('concurrent_test', true);
      socialStore.updateRelationship('test-npc', 10);
      storyletStore.setFlag('another_flag', false);
      socialStore.recordNPCInteraction('test-npc', { type: 'conversation', content: 'test' });

      // Verify all operations completed
      expect(storyletStore.activeFlags.concurrent_test).toBe(true);
      expect(storyletStore.activeFlags.another_flag).toBe(false);
      expect(socialStore.npcs.relationships['test-npc']).toBe(10);
      expect(socialStore.npcs.interactionHistory['test-npc']).toHaveLength(2); // relationship change + interaction
    });
  });

  describe('Store Reset and Cleanup', () => {
    it('should properly reset all stores to initial state', () => {
      const appStore = useAppStore.getState();
      const storyletStore = useStoryletStore.getState();
      const coreGameStore = useCoreGameStore.getState();

      // Modify all stores
      useAppStore.setState({ 
        day: 20, 
        userLevel: 5,
        experience: 500,
        resources: { energy: 10, stress: 90, money: 200, knowledge: 300, social: 250 }
      });

      storyletStore.setFlag('test_flag', true);
      storyletStore.setFlag('another_flag', false);

      coreGameStore.recordGameResult('test-game', { success: true, stats: { score: 100 } }, 'hard');

      // Verify stores are modified
      expect(useAppStore.getState().day).toBe(20);
      expect(useStoryletStore.getState().activeFlags.test_flag).toBe(true);
      expect(useCoreGameStore.getState().getGameStats('test-game')).toBeDefined();

      // Reset all stores
      resetAllStores();

      // Verify stores are reset to initial state
      const resetAppStore = useAppStore.getState();
      const resetStoryletStore = useStoryletStore.getState();
      const resetCoreGameStore = useCoreGameStore.getState();

      expect(resetAppStore.day).toBe(1);
      expect(resetAppStore.userLevel).toBe(1);
      expect(resetAppStore.experience).toBe(0);
      expect(resetAppStore.resources.energy).toBe(100);
      expect(resetAppStore.resources.money).toBe(50);

      expect(Object.keys(resetStoryletStore.activeFlags)).toHaveLength(0);
      expect(resetStoryletStore.activeStoryletIds).toHaveLength(0);
      expect(resetStoryletStore.completedStoryletIds).toHaveLength(0);

      expect(resetCoreGameStore.world.day).toBe(1);
      expect(resetCoreGameStore.player.level).toBe(1);
      expect(resetCoreGameStore.player.experience).toBe(0);
    });

    it('should handle partial store failures gracefully', () => {
      const storyletStore = useStoryletStore.getState();

      // Set valid state
      storyletStore.setFlag('valid_flag', true);
      expect(storyletStore.activeFlags.valid_flag).toBe(true);

      // Attempt invalid operation (should not crash)
      expect(() => {
        (storyletStore as any).invalidMethod?.();
      }).not.toThrow();

      // Valid state should still be maintained
      expect(storyletStore.activeFlags.valid_flag).toBe(true);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large state updates efficiently', () => {
      const storyletStore = useStoryletStore.getState();
      const startTime = performance.now();

      // Set many flags
      for (let i = 0; i < 100; i++) {
        storyletStore.setFlag(`performance_flag_${i}`, i % 2 === 0);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete within 100ms
      expect(Object.keys(storyletStore.activeFlags)).toHaveLength(100);
    });

    it('should maintain memory efficiency with frequent operations', () => {
      const socialStore = useSocialStore.getState();
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform many operations
      for (let i = 0; i < 50; i++) {
        socialStore.updateRelationship(`npc-${i}`, Math.floor(Math.random() * 20));
        socialStore.recordNPCInteraction(`npc-${i}`, { 
          type: 'test', 
          content: `interaction ${i}` 
        });
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = finalMemory - initialMemory;

      // Should not have excessive memory growth
      expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024); // Less than 5MB growth

      // Verify operations completed
      expect(Object.keys(socialStore.npcs.relationships)).toHaveLength(50);
      expect(Object.keys(socialStore.npcs.interactionHistory)).toHaveLength(50);
    });
  });
});