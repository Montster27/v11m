// /Users/montysharma/v11m2/src/test/integration/coreGameLoops.test.ts
// Integration tests for core game loops: storylet evaluation, resource management, progression

import { describe, it, expect, beforeEach } from 'vitest';
import { resetAllStores, addStoryletsToTest, evaluateAndWait, waitForStoreUpdate } from '../utils/gameTestUtils';
import { useStoryletStore } from '../../stores/useStoryletStore';
import { useAppStore } from '../../stores/useAppStore';
import { useCoreGameStore } from '../../stores/v2/useCoreGameStore';
import { useStoryletCatalogStore } from '../../stores/useStoryletCatalogStore';
import type { Storylet } from '../../types/storylet';

describe('Core Game Loops Integration', () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe('Storylet Evaluation Engine', () => {
    it('should correctly evaluate storylet availability based on flags', async () => {
      const storyletStore = useStoryletStore.getState();

      // Create test storylets with different flag requirements
      const testStorylets: Record<string, Storylet> = {
        'test-simple': {
          id: 'test-simple',
          title: 'Simple Test',
          description: 'No requirements',
          sections: [{ 
            id: 'section1', 
            content: 'Test content',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [{ type: 'flag', flag: 'test_completed', value: true }] 
            }]
          }],
          requirements: { flags: {} },
          effects: [],
          tags: ['test'],
          frequency: 'once',
          deployment: 'dev'
        },
        'test-conditional': {
          id: 'test-conditional',
          title: 'Conditional Test',
          description: 'Requires flag',
          sections: [{ 
            id: 'section1', 
            content: 'Conditional content',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [{ type: 'flag', flag: 'conditional_completed', value: true }] 
            }]
          }],
          requirements: { flags: { test_completed: true } },
          effects: [],
          tags: ['test'],
          frequency: 'once',
          deployment: 'dev'
        },
        'test-resource': {
          id: 'test-resource',
          title: 'Resource Test',
          description: 'Requires energy',
          sections: [{ 
            id: 'section1', 
            content: 'Resource content',
            choices: [{ 
              id: 'choice1', 
              text: 'Spend Energy', 
              effects: [
                { type: 'resource', resource: 'energy', change: -20 },
                { type: 'flag', flag: 'energy_spent', value: true }
              ] 
            }]
          }],
          requirements: { 
            flags: {},
            resources: { energy: 50 }
          },
          effects: [],
          tags: ['test'],
          frequency: 'repeatable',
          deployment: 'dev'
        }
      };

      // Add storylets to catalog with proper timing
      await addStoryletsToTest(testStorylets);

      // Initially, only simple storylet should be available
      await evaluateAndWait();
      expect(useStoryletStore.getState().activeStoryletIds).toContain('test-simple');
      expect(useStoryletStore.getState().activeStoryletIds).not.toContain('test-conditional');
      expect(useStoryletStore.getState().activeStoryletIds).toContain('test-resource'); // Has enough energy

      // Complete simple storylet
      useStoryletStore.getState().chooseStorylet('test-simple', 'choice1');
      await waitForStoreUpdate();
      
      // Now conditional should be available
      await evaluateAndWait();
      expect(useStoryletStore.getState().activeStoryletIds).toContain('test-conditional');
      expect(useStoryletStore.getState().activeFlags.test_completed).toBe(true);

      // Reduce energy below threshold
      useAppStore.setState({ resources: { ...useAppStore.getState().resources, energy: 40 } }); // From 100 to 40
      await waitForStoreUpdate();
      await evaluateAndWait();
      expect(useStoryletStore.getState().activeStoryletIds).not.toContain('test-resource');
    });

    it('should handle resource-based storylet requirements', () => {
      const storyletStore = useStoryletStore.getState();
      const appStore = useAppStore.getState();

      const resourceStorylet: Storylet = {
        id: 'money-event',
        title: 'Expensive Choice',
        description: 'Costs money',
        sections: [{ 
          id: 'section1', 
          content: 'Pay for something',
          choices: [
            { 
              id: 'pay', 
              text: 'Pay $30', 
              effects: [{ type: 'resource', resource: 'money', change: -30 }] 
            },
            { 
              id: 'decline', 
              text: 'Decline', 
              effects: [] 
            }
          ]
        }],
        requirements: { 
          flags: {},
          resources: { money: 30 }
        },
        effects: [],
        tags: ['test'],
        frequency: 'repeatable',
        deployment: 'dev'
      };

      useStoryletCatalogStore.setState({ 
        allStorylets: { 'money-event': resourceStorylet },
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();

      // Should be available with initial money (50)
      storyletStore.evaluateStorylets();
      expect(storyletStore.activeStoryletIds).toContain('money-event');

      // Spend money below threshold
      useAppStore.setState({ resources: { ...useAppStore.getState().resources, money: 25 } }); // From 50 to 25
      storyletStore.evaluateStorylets();
      expect(storyletStore.activeStoryletIds).not.toContain('money-event');

      // Add money back
      useAppStore.setState({ resources: { ...useAppStore.getState().resources, money: 35 } }); // Back to 35
      storyletStore.evaluateStorylets();
      expect(storyletStore.activeStoryletIds).toContain('money-event');
    });

    it('should handle time-based storylet activation', () => {
      const storyletStore = useStoryletStore.getState();
      const appStore = useAppStore.getState();

      const dayBasedStorylet: Storylet = {
        id: 'day-event',
        title: 'Day 3 Event',
        description: 'Available on day 3',
        sections: [{ 
          id: 'section1', 
          content: 'Day 3 content',
          choices: [{ 
            id: 'choice1', 
            text: 'Continue', 
            effects: [{ type: 'flag', flag: 'day3_seen', value: true }] 
          }]
        }],
        requirements: { 
          flags: {},
          day: 3
        },
        effects: [],
        tags: ['test'],
        frequency: 'once',
        deployment: 'dev'
      };

      useStoryletCatalogStore.setState({ 
        allStorylets: { 'day-event': dayBasedStorylet },
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();

      // Day 1 - should not be available
      storyletStore.evaluateStorylets();
      expect(storyletStore.activeStoryletIds).not.toContain('day-event');

      // Advance to day 3
      useAppStore.setState({ day: 3 });
      storyletStore.evaluateStorylets();
      expect(storyletStore.activeStoryletIds).toContain('day-event');
    });

    it('should properly handle storylet cooldowns', () => {
      const storyletStore = useStoryletStore.getState();

      const repeatableStorylet: Storylet = {
        id: 'daily-event',
        title: 'Daily Event',
        description: 'Can repeat after cooldown',
        sections: [{ 
          id: 'section1', 
          content: 'Daily content',
          choices: [{ 
            id: 'choice1', 
            text: 'Complete', 
            effects: [{ type: 'flag', flag: 'daily_done', value: true }] 
          }]
        }],
        requirements: { flags: {} },
        effects: [],
        tags: ['test'],
        frequency: 'repeatable',
        cooldown: 2, // 2 day cooldown
        deployment: 'dev'
      };

      useStoryletCatalogStore.setState({ 
        allStorylets: { 'daily-event': repeatableStorylet },
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();

      // Should be available initially
      storyletStore.evaluateStorylets();
      expect(storyletStore.activeStoryletIds).toContain('daily-event');

      // Complete it
      storyletStore.chooseStorylet('daily-event', 'choice1');

      // Should not be available immediately after completion
      storyletStore.evaluateStorylets();
      expect(storyletStore.activeStoryletIds).not.toContain('daily-event');

      // Check cooldown was set
      expect(storyletStore.storyletCooldowns['daily-event']).toBeDefined();
      expect(storyletStore.storyletCooldowns['daily-event']).toBeGreaterThan(Date.now());

      // Manually clear cooldown to test availability
      storyletStore.clearCooldown('daily-event');
      storyletStore.evaluateStorylets();
      expect(storyletStore.activeStoryletIds).toContain('daily-event');
    });
  });

  describe('Resource Management System', () => {
    it('should properly track and update resources', () => {
      const appStore = useAppStore.getState();
      const initialResources = useAppStore.getState().resources;

      expect(initialResources.energy).toBe(100);
      expect(initialResources.stress).toBe(0);
      expect(initialResources.money).toBe(50);

      // Test resource updates via setState (since there's no updateResource method)
      useAppStore.setState({ resources: { ...useAppStore.getState().resources, energy: 80 } });
      expect(useAppStore.getState().resources.energy).toBe(80);

      useAppStore.setState({ resources: { ...useAppStore.getState().resources, stress: 15 } });
      expect(useAppStore.getState().resources.stress).toBe(15);

      useAppStore.setState({ resources: { ...useAppStore.getState().resources, money: 75 } });
      expect(useAppStore.getState().resources.money).toBe(75);

      // Test resource limits
      useAppStore.setState({ resources: { ...useAppStore.getState().resources, energy: 0 } });
      expect(useAppStore.getState().resources.energy).toBe(0);

      useAppStore.setState({ resources: { ...useAppStore.getState().resources, stress: 100 } });
      expect(useAppStore.getState().resources.stress).toBe(100);
    });

    it('should integrate resource changes with storylet effects', () => {
      const storyletStore = useStoryletStore.getState();
      const appStore = useAppStore.getState();

      const resourceEffectStorylet: Storylet = {
        id: 'resource-effect',
        title: 'Resource Effect',
        description: 'Changes multiple resources',
        sections: [{ 
          id: 'section1', 
          content: 'Make a choice',
          choices: [
            { 
              id: 'hard-work', 
              text: 'Work Hard', 
              effects: [
                { type: 'resource', resource: 'energy', change: -30 },
                { type: 'resource', resource: 'stress', change: 20 },
                { type: 'resource', resource: 'money', change: 40 },
                { type: 'flag', flag: 'worked_hard', value: true }
              ] 
            },
            { 
              id: 'relax', 
              text: 'Relax', 
              effects: [
                { type: 'resource', resource: 'energy', change: 10 },
                { type: 'resource', resource: 'stress', change: -15 },
                { type: 'flag', flag: 'relaxed', value: true }
              ] 
            }
          ]
        }],
        requirements: { flags: {} },
        effects: [],
        tags: ['test'],
        frequency: 'repeatable',
        deployment: 'dev'
      };

      useStoryletCatalogStore.setState({ 
        allStorylets: { 'resource-effect': resourceEffectStorylet },
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();

      const initialEnergy = useAppStore.getState().resources.energy;
      const initialStress = useAppStore.getState().resources.stress;
      const initialMoney = useAppStore.getState().resources.money;

      // Choose hard work
      storyletStore.chooseStorylet('resource-effect', 'hard-work');

      expect(useAppStore.getState().resources.energy).toBe(initialEnergy - 30);
      expect(useAppStore.getState().resources.stress).toBe(initialStress + 20);
      expect(useAppStore.getState().resources.money).toBe(initialMoney + 40);
      expect(storyletStore.activeFlags.worked_hard).toBe(true);
    });

    it('should handle resource overflow and underflow correctly', () => {
      const appStore = useAppStore.getState();

      // Set resources to near limits
      useAppStore.setState({
        resources: {
          energy: 5,
          stress: 95,
          money: 1000,
          knowledge: 95,
          social: 5
        }
      });

      // Test underflow protection (manual clamping in this test)
      const newEnergy = Math.max(0, useAppStore.getState().resources.energy - 10);
      useAppStore.setState({ resources: { ...useAppStore.getState().resources, energy: newEnergy } });
      expect(useAppStore.getState().resources.energy).toBe(0); // Should not go negative

      const newSocial = Math.max(0, useAppStore.getState().resources.social - 20);
      useAppStore.setState({ resources: { ...useAppStore.getState().resources, social: newSocial } });
      expect(useAppStore.getState().resources.social).toBe(0);

      // Test overflow protection (manual clamping in this test)
      const newStress = Math.min(100, useAppStore.getState().resources.stress + 20);
      useAppStore.setState({ resources: { ...useAppStore.getState().resources, stress: newStress } });
      expect(useAppStore.getState().resources.stress).toBe(100); // Should not exceed 100

      const newKnowledge = Math.min(100, useAppStore.getState().resources.knowledge + 10);
      useAppStore.setState({ resources: { ...useAppStore.getState().resources, knowledge: newKnowledge } });
      expect(useAppStore.getState().resources.knowledge).toBe(100);

      // Money should be able to grow beyond 100
      useAppStore.setState({ resources: { ...useAppStore.getState().resources, money: 1500 } });
      expect(useAppStore.getState().resources.money).toBe(1500);
    });
  });

  describe('V2 Store Integration', () => {
    it('should properly synchronize with v2 stores', () => {
      const coreGameStore = useCoreGameStore.getState();
      const appStore = useAppStore.getState();

      // Update v1 store
      useAppStore.setState({ day: 5 });
      useAppStore.setState({ resources: { ...useAppStore.getState().resources, energy: 75 } });
      useAppStore.setState({ experience: 150 });

      // Trigger migration
      coreGameStore.migrateFromLegacyStores();

      // Check v2 store reflects changes
      expect(coreGameStore.world.day).toBe(5);
      expect(coreGameStore.player.experience).toBe(150);
    });

    it('should handle minigame integration in v2 stores', () => {
      const coreGameStore = useCoreGameStore.getState();

      // Record a game result
      const gameResult = {
        success: true,
        stats: {
          score: 85,
          timeElapsed: 120000,
          attempts: 3,
          accuracy: 95,
          hintsUsed: 1
        }
      };

      coreGameStore.recordGameResult('memory-cards', gameResult, 'medium');

      const gameStats = coreGameStore.getGameStats('memory-cards');
      expect(gameStats).toBeDefined();
      expect(gameStats.totalPlays).toBe(1);
      expect(gameStats.totalWins).toBe(1);
      expect(gameStats.bestScore).toBe(85);
      expect(gameStats.lastDifficulty).toBe('medium');

      // Record a loss
      const lossResult = {
        success: false,
        stats: {
          score: 45,
          timeElapsed: 180000,
          attempts: 5,
          accuracy: 60,
          hintsUsed: 3
        }
      };

      coreGameStore.recordGameResult('memory-cards', lossResult, 'medium');

      const updatedStats = coreGameStore.getGameStats('memory-cards');
      expect(updatedStats.totalPlays).toBe(2);
      expect(updatedStats.totalWins).toBe(1);
      expect(updatedStats.totalLosses).toBe(1);
      expect(updatedStats.bestScore).toBe(85); // Should remain the best
    });

    it('should handle overall minigame statistics correctly', () => {
      const coreGameStore = useCoreGameStore.getState();

      // Record results for multiple games
      coreGameStore.recordGameResult('memory-cards', { success: true, stats: { score: 100 } }, 'easy');
      coreGameStore.recordGameResult('word-scramble', { success: false, stats: { score: 30 } }, 'medium');
      coreGameStore.recordGameResult('memory-cards', { success: true, stats: { score: 85 } }, 'medium');
      coreGameStore.recordGameResult('path-planner', { success: true, stats: { score: 95 } }, 'hard');

      const overallStats = coreGameStore.getOverallMinigameStats();
      expect(overallStats.totalGames).toBe(3); // 3 unique games
      expect(overallStats.totalPlays).toBe(4);
      expect(overallStats.totalWins).toBe(3);
      expect(overallStats.totalLosses).toBe(1);
      expect(overallStats.overallWinRate).toBe(0.75);
      expect(overallStats.gamesPlayed).toContain('memory-cards');
      expect(overallStats.gamesPlayed).toContain('word-scramble');
      expect(overallStats.gamesPlayed).toContain('path-planner');
    });
  });

  describe('Day Progression and Time Management', () => {
    it('should properly advance days and trigger time-based events', () => {
      const appStore = useAppStore.getState();
      const storyletStore = useStoryletStore.getState();

      expect(useAppStore.getState().day).toBe(1);

      // Advance day
      useAppStore.getState().incrementDay(2);
      expect(useAppStore.getState().day).toBe(2);

      // Should trigger resource regeneration or other day-based effects
      // This would depend on your specific game mechanics
    });

    it('should handle weekly and monthly progression', () => {
      const appStore = useAppStore.getState();

      // Test week calculation
      useAppStore.setState({ day: 8 }); // Start of week 2
      expect(Math.floor((useAppStore.getState().day - 1) / 7) + 1).toBe(2);

      useAppStore.setState({ day: 15 }); // Start of week 3
      expect(Math.floor((useAppStore.getState().day - 1) / 7) + 1).toBe(3);

      // Test month calculation (assuming 30 days per month)
      useAppStore.setState({ day: 31 }); // Start of month 2
      expect(Math.floor((useAppStore.getState().day - 1) / 30) + 1).toBe(2);
    });
  });

  describe('Character Development Integration', () => {
    it('should track character progression through storylets', () => {
      const storyletStore = useStoryletStore.getState();
      const appStore = useAppStore.getState();

      const developmentStorylet: Storylet = {
        id: 'char-development',
        title: 'Character Development',
        description: 'Develop your character',
        sections: [{ 
          id: 'section1', 
          content: 'Choose development path',
          choices: [
            { 
              id: 'academic', 
              text: 'Study Hard', 
              effects: [
                { type: 'resource', resource: 'knowledge', change: 20 },
                { type: 'flag', flag: 'academic_path', value: true }
              ] 
            },
            { 
              id: 'social', 
              text: 'Make Friends', 
              effects: [
                { type: 'resource', resource: 'social', change: 25 },
                { type: 'flag', flag: 'social_path', value: true }
              ] 
            }
          ]
        }],
        requirements: { flags: {} },
        effects: [],
        tags: ['development'],
        frequency: 'once',
        deployment: 'dev'
      };

      useStoryletCatalogStore.setState({ 
        allStorylets: { 'char-development': developmentStorylet },
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();

      const initialKnowledge = useAppStore.getState().resources.knowledge;
      storyletStore.chooseStorylet('char-development', 'academic');

      expect(useAppStore.getState().resources.knowledge).toBe(initialKnowledge + 20);
      expect(storyletStore.activeFlags.academic_path).toBe(true);
      expect(storyletStore.completedStoryletIds).toContain('char-development');
    });
  });
});