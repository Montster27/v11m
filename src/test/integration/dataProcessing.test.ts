// /Users/montysharma/v11m2/src/test/integration/dataProcessing.test.ts
// Integration tests for data loading and processing functionality

import { describe, it, expect, beforeEach } from 'vitest';
import { resetAllStores } from '../utils/gameTestUtils';
import { useStoryletCatalogStore } from '../../stores/useStoryletCatalogStore';
import { useStoryletStore } from '../../stores/useStoryletStore';
import type { Storylet } from '../../types/storylet';

describe('Data Processing Integration', () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe('Storylet Data Loading', () => {
    it('should load and process storylets from catalog', () => {
      // Disable test mode to allow syncing
      useStoryletStore.setState({ _testMode: false });

      // Create test storylets with different deployment statuses
      const testStorylets: Record<string, Storylet> = {
        'live-storylet': {
          id: 'live-storylet',
          name: 'Live Storylet',
          description: 'Production storylet',
          trigger: { type: 'flag', conditions: {} },
          choices: [{ 
            id: 'choice1', 
            text: 'Continue', 
            effects: [{ type: 'flag', key: 'live_seen', value: true }] 
          }],
          deploymentStatus: 'live'
        },
        'dev-storylet': {
          id: 'dev-storylet',
          name: 'Dev Storylet',
          description: 'Development storylet',
          trigger: { type: 'flag', conditions: {} },
          choices: [{ 
            id: 'choice1', 
            text: 'Continue', 
            effects: [{ type: 'flag', key: 'dev_seen', value: true }] 
          }],
          deploymentStatus: 'dev'
        },
        'stage-storylet': {
          id: 'stage-storylet',
          name: 'Stage Storylet',
          description: 'Staging storylet',
          trigger: { type: 'flag', conditions: {} },
          choices: [{ 
            id: 'choice1', 
            text: 'Continue', 
            effects: [{ type: 'flag', key: 'stage_seen', value: true }] 
          }],
          deploymentStatus: 'stage'
        }
      };

      // Load storylets into catalog
      useStoryletCatalogStore.setState({
        allStorylets: testStorylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      // Get fresh state after setState
      const updatedCatalogState = useStoryletCatalogStore.getState();
      expect(Object.keys(updatedCatalogState.allStorylets)).toHaveLength(3);
      expect(updatedCatalogState.allStorylets['live-storylet']).toBeDefined();
      expect(updatedCatalogState.allStorylets['dev-storylet']).toBeDefined();
      expect(updatedCatalogState.allStorylets['stage-storylet']).toBeDefined();

      // Sync to main store
      useStoryletStore.getState().syncFromCatalogStore();

      // Get fresh state after sync
      const updatedStoryletState = useStoryletStore.getState();
      const loadedStoryletIds = Object.keys(updatedStoryletState.allStorylets);
      expect(loadedStoryletIds).toHaveLength(2); // Only live and dev should be loaded (default filter)
      expect(loadedStoryletIds).toContain('live-storylet');
      expect(loadedStoryletIds).toContain('dev-storylet');
    });

    it('should filter storylets by deployment status', () => {
      // Disable test mode to allow syncing
      useStoryletStore.setState({ _testMode: false });

      const testStorylets: Record<string, Storylet> = {
        'live-only': {
          id: 'live-only',
          name: 'Live Only',
          description: 'Production only storylet',
          trigger: { type: 'flag', conditions: {} },
          choices: [{ 
            id: 'choice1', 
            text: 'Continue', 
            effects: [] 
          }],
          deploymentStatus: 'live'
        },
        'dev-only': {
          id: 'dev-only',
          name: 'Dev Only',
          description: 'Development only storylet',
          trigger: { type: 'flag', conditions: {} },
          choices: [{ 
            id: 'choice1', 
            text: 'Continue', 
            effects: [] 
          }],
          deploymentStatus: 'dev'
        }
      };

      useStoryletCatalogStore.setState({
        allStorylets: testStorylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      // Set deployment filter to only live
      useStoryletStore.setState({
        deploymentFilter: new Set(['live'])
      });

      useStoryletStore.getState().syncFromCatalogStore();

      // Get fresh state after sync
      const liveOnlyState = useStoryletStore.getState();
      expect(Object.keys(liveOnlyState.allStorylets)).toContain('live-only');
      expect(Object.keys(liveOnlyState.allStorylets)).not.toContain('dev-only');

      // Change filter to include dev
      useStoryletStore.setState({
        deploymentFilter: new Set(['live', 'dev'])
      });

      useStoryletStore.getState().syncFromCatalogStore();

      // Get fresh state after sync
      const bothState = useStoryletStore.getState();
      expect(Object.keys(bothState.allStorylets)).toContain('live-only');
      expect(Object.keys(bothState.allStorylets)).toContain('dev-only');
    });

    it('should handle storylet data validation', () => {
      // Test with invalid storylet data
      const invalidStorylets = {
        'invalid-storylet': {
          id: 'invalid-storylet',
          // Missing required fields
          deploymentStatus: 'dev'
        }
      };

      // Should handle invalid data gracefully
      expect(() => {
        useStoryletCatalogStore.setState({
          allStorylets: invalidStorylets as any,
          lastLoaded: Date.now(),
          isLoading: false
        });
      }).not.toThrow();
    });
  });

  describe('Story Arc Data Processing', () => {
    it('should process story arc relationships', () => {
      // Disable test mode to allow syncing
      useStoryletStore.setState({ _testMode: false });

      // Create storylets that belong to the same arc
      const arcStorylets: Record<string, Storylet> = {
        'arc1-intro': {
          id: 'arc1-intro',
          name: 'Arc 1 Introduction',
          description: 'Beginning of arc 1',
          trigger: { type: 'flag', conditions: {} },
          choices: [{ 
            id: 'choice1', 
            text: 'Continue', 
            effects: [{ type: 'flag', key: 'arc1_started', value: true }] 
          }],
          deploymentStatus: 'dev',
          storyArc: 'test-arc-1'
        },
        'arc1-middle': {
          id: 'arc1-middle',
          name: 'Arc 1 Middle',
          description: 'Middle of arc 1',
          trigger: { type: 'flag', conditions: { flags: ['arc1_started'] } },
          choices: [{ 
            id: 'choice1', 
            text: 'Continue', 
            effects: [{ type: 'flag', key: 'arc1_progressed', value: true }] 
          }],
          deploymentStatus: 'dev',
          storyArc: 'test-arc-1'
        },
        'arc1-end': {
          id: 'arc1-end',
          name: 'Arc 1 Conclusion',
          description: 'End of arc 1',
          trigger: { type: 'flag', conditions: { flags: ['arc1_progressed'] } },
          choices: [{ 
            id: 'choice1', 
            text: 'Finish', 
            effects: [{ type: 'flag', key: 'arc1_completed', value: true }] 
          }],
          deploymentStatus: 'dev',
          storyArc: 'test-arc-1'
        }
      };

      useStoryletCatalogStore.setState({
        allStorylets: arcStorylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      useStoryletStore.getState().syncFromCatalogStore();

      // Test story arc functionality
      const currentState = useStoryletStore.getState();
      currentState.addStoryArc('test-arc-1');
      const updatedState = useStoryletStore.getState();
      expect(updatedState.storyArcs).toContain('test-arc-1');

      const arcStoryletList = useStoryletStore.getState().getStoryletsByArc('test-arc-1');
      expect(arcStoryletList).toHaveLength(3);
      expect(arcStoryletList.some(s => s.id === 'arc1-intro')).toBe(true);
      expect(arcStoryletList.some(s => s.id === 'arc1-middle')).toBe(true);
      expect(arcStoryletList.some(s => s.id === 'arc1-end')).toBe(true);

      // Test arc progression
      const arcProgress = useStoryletStore.getState().getArcProgress('test-arc-1');
      expect(arcProgress.total).toBe(3);
      expect(arcProgress.completed).toBe(0);
      expect(arcProgress.percentage).toBe(0);
    });

    it('should track arc completion progression', () => {
      // Disable test mode to allow syncing  
      useStoryletStore.setState({ _testMode: false });

      // Add arc storylets
      const arcStorylets: Record<string, Storylet> = {
        'progression-1': {
          id: 'progression-1',
          name: 'Step 1',
          description: 'First step',
          trigger: { type: 'flag', conditions: {} },
          choices: [{ 
            id: 'choice1', 
            text: 'Complete', 
            effects: [{ type: 'flag', key: 'step1_done', value: true }] 
          }],
          deploymentStatus: 'dev',
          storyArc: 'progression-arc'
        },
        'progression-2': {
          id: 'progression-2',
          name: 'Step 2',
          description: 'Second step',
          trigger: { type: 'flag', conditions: { flags: ['step1_done'] } },
          choices: [{ 
            id: 'choice1', 
            text: 'Complete', 
            effects: [{ type: 'flag', key: 'step2_done', value: true }] 
          }],
          deploymentStatus: 'dev',
          storyArc: 'progression-arc'
        }
      };

      useStoryletCatalogStore.setState({
        allStorylets: arcStorylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      useStoryletStore.getState().syncFromCatalogStore();
      useStoryletStore.getState().addStoryArc('progression-arc');

      // Initial state
      let progress = useStoryletStore.getState().getArcProgress('progression-arc');
      expect(progress.completed).toBe(0);
      expect(progress.percentage).toBe(0);

      // First, evaluate storylets to make them available
      useStoryletStore.getState().evaluateStorylets();
      
      // Complete first storylet
      useStoryletStore.getState().chooseStorylet('progression-1', 'choice1');
      let state1 = useStoryletStore.getState();
      expect(state1.completedStoryletIds).toContain('progression-1');
      expect(state1.activeFlags.step1_done).toBe(true);

      progress = useStoryletStore.getState().getArcProgress('progression-arc');
      expect(progress.completed).toBe(1);
      expect(progress.percentage).toBe(50);

      // Complete second storylet
      useStoryletStore.getState().evaluateStorylets(); // Should make progression-2 available
      useStoryletStore.getState().chooseStorylet('progression-2', 'choice1');
      let state2 = useStoryletStore.getState();
      expect(state2.completedStoryletIds).toContain('progression-2');

      progress = useStoryletStore.getState().getArcProgress('progression-arc');
      expect(progress.completed).toBe(2);
      expect(progress.percentage).toBe(100);

      // Arc should be complete
      expect(useStoryletStore.getState().isArcComplete('progression-arc')).toBe(true);
    });
  });

  describe('Data Persistence and Loading', () => {
    it('should handle catalog loading states', () => {
      // Initial state - get fresh state
      const initialState = useStoryletCatalogStore.getState();
      expect(initialState.isLoading).toBe(false);
      expect(initialState.lastLoaded).toBe(0);
      expect(Object.keys(initialState.allStorylets)).toHaveLength(0);

      // Set loading state
      useStoryletCatalogStore.setState({ isLoading: true });
      const loadingState = useStoryletCatalogStore.getState();
      expect(loadingState.isLoading).toBe(true);

      // Complete loading
      const testStorylets = {
        'loaded-storylet': {
          id: 'loaded-storylet',
          name: 'Loaded Storylet',
          description: 'A storylet that was loaded',
          trigger: { type: 'flag', conditions: {} },
          choices: [{ 
            id: 'choice1', 
            text: 'Continue', 
            effects: [] 
          }],
          deploymentStatus: 'dev'
        }
      };

      const loadTime = Date.now();
      useStoryletCatalogStore.setState({
        allStorylets: testStorylets,
        lastLoaded: loadTime,
        isLoading: false
      });

      const updatedCatalogState = useStoryletCatalogStore.getState();
      expect(updatedCatalogState.isLoading).toBe(false);
      expect(updatedCatalogState.lastLoaded).toBe(loadTime);
      expect(Object.keys(updatedCatalogState.allStorylets)).toHaveLength(1);
    });

    it('should handle incremental storylet updates', () => {
      // Initial load
      const initialStorylets = {
        'story-1': {
          id: 'story-1',
          name: 'Story 1',
          description: 'First story',
          trigger: { type: 'flag', conditions: {} },
          choices: [{ 
            id: 'choice1', 
            text: 'Continue', 
            effects: [] 
          }],
          deploymentStatus: 'dev'
        }
      };

      useStoryletCatalogStore.setState({
        allStorylets: initialStorylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      const state1 = useStoryletCatalogStore.getState();
      expect(Object.keys(state1.allStorylets)).toHaveLength(1);

      // Add new storylet
      const updatedStorylets = {
        ...initialStorylets,
        'story-2': {
          id: 'story-2',
          name: 'Story 2',
          description: 'Second story',
          trigger: { type: 'flag', conditions: {} },
          choices: [{ 
            id: 'choice1', 
            text: 'Continue', 
            effects: [] 
          }],
          deploymentStatus: 'dev'
        }
      };

      useStoryletCatalogStore.setState({
        allStorylets: updatedStorylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      const state2 = useStoryletCatalogStore.getState();
      expect(Object.keys(state2.allStorylets)).toHaveLength(2);
      expect(state2.allStorylets['story-1']).toBeDefined();
      expect(state2.allStorylets['story-2']).toBeDefined();
    });
  });

  describe('Data Format Validation', () => {
    it('should handle storylets with different section structures', () => {
      // Disable test mode to allow syncing
      useStoryletStore.setState({ _testMode: false });

      const multiSectionStorylet: Storylet = {
        id: 'multi-section',
        name: 'Multi Section Story',
        description: 'A story with multiple sections',
        trigger: { type: 'flag', conditions: {} },
        choices: [
          { 
            id: 'option-a', 
            text: 'Choice A', 
            effects: [{ type: 'flag', key: 'chose_a', value: true }] 
          },
          { 
            id: 'option-b', 
            text: 'Choice B', 
            effects: [{ type: 'flag', key: 'chose_b', value: true }] 
          }
        ],
        deploymentStatus: 'dev'
      };

      useStoryletCatalogStore.setState({
        allStorylets: { 'multi-section': multiSectionStorylet },
        lastLoaded: Date.now(),
        isLoading: false
      });

      useStoryletStore.getState().syncFromCatalogStore();

      const state = useStoryletStore.getState();
      expect(state.allStorylets['multi-section']).toBeDefined();
      expect(state.allStorylets['multi-section'].choices).toHaveLength(2);
      expect(state.allStorylets['multi-section'].choices[0].id).toBe('option-a');
    });

    it('should handle storylets with complex requirements', () => {
      // Disable test mode to allow syncing
      useStoryletStore.setState({ _testMode: false });

      const complexStorylet: Storylet = {
        id: 'complex-requirements',
        name: 'Complex Story',
        description: 'Story with complex requirements',
        trigger: { 
          type: 'resource',
          conditions: {
            energy: { min: 50 },
            money: { min: 100 }
          }
        },
        choices: [{ 
          id: 'choice1', 
          text: 'Continue', 
          effects: [] 
        }],
        deploymentStatus: 'dev'
      };

      useStoryletCatalogStore.setState({
        allStorylets: { 'complex-requirements': complexStorylet },
        lastLoaded: Date.now(),
        isLoading: false
      });

      useStoryletStore.getState().syncFromCatalogStore();

      const state = useStoryletStore.getState();
      const loaded = state.allStorylets['complex-requirements'];
      expect(loaded).toBeDefined();
      expect(loaded.trigger.type).toBe('resource');
      expect(loaded.trigger.conditions.energy.min).toBe(50);
      expect(loaded.trigger.conditions.money.min).toBe(100);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of storylets efficiently', () => {
      // Disable test mode to allow syncing
      useStoryletStore.setState({ _testMode: false });

      // Generate 100 test storylets
      const largeStoryletSet: Record<string, Storylet> = {};
      for (let i = 0; i < 100; i++) {
        largeStoryletSet[`story-${i}`] = {
          id: `story-${i}`,
          name: `Story ${i}`,
          description: `Description for story ${i}`,
          trigger: { type: 'flag', conditions: {} },
          choices: [{ 
            id: 'choice1', 
            text: 'Continue', 
            effects: [{ type: 'flag', key: `story_${i}_completed`, value: true }] 
          }],
          deploymentStatus: 'dev'
        };
      }

      const startTime = performance.now();
      
      useStoryletCatalogStore.setState({
        allStorylets: largeStoryletSet,
        lastLoaded: Date.now(),
        isLoading: false
      });

      useStoryletStore.getState().syncFromCatalogStore();
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      const catalogState = useStoryletCatalogStore.getState();
      const storyletState = useStoryletStore.getState();
      expect(Object.keys(catalogState.allStorylets)).toHaveLength(100);
      expect(Object.keys(storyletState.allStorylets)).toHaveLength(100);
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should efficiently filter and evaluate large storylet sets', () => {
      // Disable test mode to allow syncing
      useStoryletStore.setState({ _testMode: false });

      // Create storylets with varying requirements
      const storylets: Record<string, Storylet> = {};
      for (let i = 0; i < 50; i++) {
        storylets[`always-available-${i}`] = {
          id: `always-available-${i}`,
          name: `Always Available ${i}`,
          description: `Always available story ${i}`,
          trigger: { type: 'flag', conditions: {} }, // No requirements
          choices: [{ 
            id: 'choice1', 
            text: 'Continue', 
            effects: [] 
          }],
          deploymentStatus: 'dev'
        };

        storylets[`conditional-${i}`] = {
          id: `conditional-${i}`,
          name: `Conditional ${i}`,
          description: `Conditional story ${i}`,
          trigger: { type: 'flag', conditions: { flags: [`requirement_${i}`] } },
          choices: [{ 
            id: 'choice1', 
            text: 'Continue', 
            effects: [] 
          }],
          deploymentStatus: 'dev'
        };
      }

      useStoryletCatalogStore.setState({
        allStorylets: storylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      useStoryletStore.getState().syncFromCatalogStore();

      const startTime = performance.now();
      useStoryletStore.getState().evaluateStorylets();
      const endTime = performance.now();

      const evaluationTime = endTime - startTime;
      expect(evaluationTime).toBeLessThan(500); // Should complete within 500ms

      // Should have found the always-available storylets
      const finalState = useStoryletStore.getState();
      expect(finalState.activeStoryletIds.length).toBe(50); // Only the always-available ones
    });
  });
});