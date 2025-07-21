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
      const catalogStore = useStoryletCatalogStore.getState();
      const storyletStore = useStoryletStore.getState();

      // Create test storylets with different deployment statuses
      const testStorylets: Record<string, Storylet> = {
        'live-storylet': {
          id: 'live-storylet',
          title: 'Live Storylet',
          description: 'Production storylet',
          sections: [{ 
            id: 'section1', 
            content: 'Live content',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [{ type: 'flag', flag: 'live_seen', value: true }] 
            }]
          }],
          requirements: { flags: {} },
          effects: [],
          tags: ['live'],
          frequency: 'once',
          deployment: 'live'
        },
        'dev-storylet': {
          id: 'dev-storylet',
          title: 'Dev Storylet',
          description: 'Development storylet',
          sections: [{ 
            id: 'section1', 
            content: 'Dev content',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [{ type: 'flag', flag: 'dev_seen', value: true }] 
            }]
          }],
          requirements: { flags: {} },
          effects: [],
          tags: ['dev'],
          frequency: 'once',
          deployment: 'dev'
        },
        'stage-storylet': {
          id: 'stage-storylet',
          title: 'Stage Storylet',
          description: 'Staging storylet',
          sections: [{ 
            id: 'section1', 
            content: 'Stage content',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [{ type: 'flag', flag: 'stage_seen', value: true }] 
            }]
          }],
          requirements: { flags: {} },
          effects: [],
          tags: ['stage'],
          frequency: 'once',
          deployment: 'stage'
        }
      };

      // Load storylets into catalog
      useStoryletCatalogStore.setState({
        allStorylets: testStorylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      expect(Object.keys(catalogStore.allStorylets)).toHaveLength(3);
      expect(catalogStore.allStorylets['live-storylet']).toBeDefined();
      expect(catalogStore.allStorylets['dev-storylet']).toBeDefined();
      expect(catalogStore.allStorylets['stage-storylet']).toBeDefined();

      // Sync to main store
      storyletStore.syncFromCatalogStore();

      // Should have loaded storylets based on deployment filter
      const loadedStoryletIds = Object.keys(storyletStore.allStorylets);
      expect(loadedStoryletIds).toContain('live-storylet');
      expect(loadedStoryletIds).toContain('dev-storylet');
    });

    it('should filter storylets by deployment status', () => {
      const catalogStore = useStoryletCatalogStore.getState();
      const storyletStore = useStoryletStore.getState();

      const testStorylets: Record<string, Storylet> = {
        'live-only': {
          id: 'live-only',
          title: 'Live Only',
          description: 'Production only storylet',
          sections: [{ 
            id: 'section1', 
            content: 'Live content',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [] 
            }]
          }],
          requirements: { flags: {} },
          effects: [],
          tags: ['live'],
          frequency: 'once',
          deployment: 'live'
        },
        'dev-only': {
          id: 'dev-only',
          title: 'Dev Only',
          description: 'Development only storylet',
          sections: [{ 
            id: 'section1', 
            content: 'Dev content',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [] 
            }]
          }],
          requirements: { flags: {} },
          effects: [],
          tags: ['dev'],
          frequency: 'once',
          deployment: 'dev'
        }
      };

      useStoryletCatalogStore.setState({
        allStorylets: testStorylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      // Set deployment filter to only live
      storyletStore.setState({
        deploymentFilter: new Set(['live'])
      });

      storyletStore.syncFromCatalogStore();

      // Should only have live storylets
      expect(Object.keys(storyletStore.allStorylets)).toContain('live-only');
      expect(Object.keys(storyletStore.allStorylets)).not.toContain('dev-only');

      // Change filter to include dev
      storyletStore.setState({
        deploymentFilter: new Set(['live', 'dev'])
      });

      storyletStore.syncFromCatalogStore();

      // Should now have both
      expect(Object.keys(storyletStore.allStorylets)).toContain('live-only');
      expect(Object.keys(storyletStore.allStorylets)).toContain('dev-only');
    });

    it('should handle storylet data validation', () => {
      const catalogStore = useStoryletCatalogStore.getState();

      // Test with invalid storylet data
      const invalidStorylets = {
        'invalid-storylet': {
          id: 'invalid-storylet',
          // Missing required fields
          deployment: 'dev'
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
      const storyletStore = useStoryletStore.getState();

      // Create storylets that belong to the same arc
      const arcStorylets: Record<string, Storylet> = {
        'arc1-intro': {
          id: 'arc1-intro',
          title: 'Arc 1 Introduction',
          description: 'Beginning of arc 1',
          sections: [{ 
            id: 'section1', 
            content: 'Arc intro',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [{ type: 'flag', flag: 'arc1_started', value: true }] 
            }]
          }],
          requirements: { flags: {} },
          effects: [],
          tags: ['story-arc-1'],
          frequency: 'once',
          deployment: 'dev',
          storyArc: 'test-arc-1'
        },
        'arc1-middle': {
          id: 'arc1-middle',
          title: 'Arc 1 Middle',
          description: 'Middle of arc 1',
          sections: [{ 
            id: 'section1', 
            content: 'Arc middle',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [{ type: 'flag', flag: 'arc1_progressed', value: true }] 
            }]
          }],
          requirements: { flags: { arc1_started: true } },
          effects: [],
          tags: ['story-arc-1'],
          frequency: 'once',
          deployment: 'dev',
          storyArc: 'test-arc-1'
        },
        'arc1-end': {
          id: 'arc1-end',
          title: 'Arc 1 Conclusion',
          description: 'End of arc 1',
          sections: [{ 
            id: 'section1', 
            content: 'Arc conclusion',
            choices: [{ 
              id: 'choice1', 
              text: 'Finish', 
              effects: [{ type: 'flag', flag: 'arc1_completed', value: true }] 
            }]
          }],
          requirements: { flags: { arc1_progressed: true } },
          effects: [],
          tags: ['story-arc-1'],
          frequency: 'once',
          deployment: 'dev',
          storyArc: 'test-arc-1'
        }
      };

      useStoryletCatalogStore.setState({
        allStorylets: arcStorylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();

      // Test story arc functionality
      storyletStore.addStoryArc('test-arc-1');
      expect(storyletStore.storyArcs).toContain('test-arc-1');

      const arcStoryletList = storyletStore.getStoryletsByArc('test-arc-1');
      expect(arcStoryletList).toHaveLength(3);
      expect(arcStoryletList.some(s => s.id === 'arc1-intro')).toBe(true);
      expect(arcStoryletList.some(s => s.id === 'arc1-middle')).toBe(true);
      expect(arcStoryletList.some(s => s.id === 'arc1-end')).toBe(true);

      // Test arc progression
      const arcProgress = storyletStore.getArcProgress('test-arc-1');
      expect(arcProgress.total).toBe(3);
      expect(arcProgress.completed).toBe(0);
      expect(arcProgress.percentage).toBe(0);
    });

    it('should track arc completion progression', () => {
      const storyletStore = useStoryletStore.getState();

      // Add arc storylets
      const arcStorylets: Record<string, Storylet> = {
        'progression-1': {
          id: 'progression-1',
          title: 'Step 1',
          description: 'First step',
          sections: [{ 
            id: 'section1', 
            content: 'Step 1 content',
            choices: [{ 
              id: 'choice1', 
              text: 'Complete', 
              effects: [{ type: 'flag', flag: 'step1_done', value: true }] 
            }]
          }],
          requirements: { flags: {} },
          effects: [],
          tags: ['progression'],
          frequency: 'once',
          deployment: 'dev',
          storyArc: 'progression-arc'
        },
        'progression-2': {
          id: 'progression-2',
          title: 'Step 2',
          description: 'Second step',
          sections: [{ 
            id: 'section1', 
            content: 'Step 2 content',
            choices: [{ 
              id: 'choice1', 
              text: 'Complete', 
              effects: [{ type: 'flag', flag: 'step2_done', value: true }] 
            }]
          }],
          requirements: { flags: { step1_done: true } },
          effects: [],
          tags: ['progression'],
          frequency: 'once',
          deployment: 'dev',
          storyArc: 'progression-arc'
        }
      };

      useStoryletCatalogStore.setState({
        allStorylets: arcStorylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();
      storyletStore.addStoryArc('progression-arc');

      // Initial state
      let progress = storyletStore.getArcProgress('progression-arc');
      expect(progress.completed).toBe(0);
      expect(progress.percentage).toBe(0);

      // Complete first storylet
      storyletStore.chooseStorylet('progression-1', 'choice1');
      expect(storyletStore.completedStoryletIds).toContain('progression-1');
      expect(storyletStore.activeFlags.step1_done).toBe(true);

      progress = storyletStore.getArcProgress('progression-arc');
      expect(progress.completed).toBe(1);
      expect(progress.percentage).toBe(50);

      // Complete second storylet
      storyletStore.evaluateStorylets(); // Should make progression-2 available
      storyletStore.chooseStorylet('progression-2', 'choice1');
      expect(storyletStore.completedStoryletIds).toContain('progression-2');

      progress = storyletStore.getArcProgress('progression-arc');
      expect(progress.completed).toBe(2);
      expect(progress.percentage).toBe(100);

      // Arc should be complete
      expect(storyletStore.isArcComplete('progression-arc')).toBe(true);
    });
  });

  describe('Data Persistence and Loading', () => {
    it('should handle catalog loading states', () => {
      const catalogStore = useStoryletCatalogStore.getState();

      // Initial state
      expect(catalogStore.isLoading).toBe(false);
      expect(catalogStore.lastLoaded).toBe(0);
      expect(Object.keys(catalogStore.allStorylets)).toHaveLength(0);

      // Set loading state
      useStoryletCatalogStore.setState({ isLoading: true });
      expect(catalogStore.isLoading).toBe(true);

      // Complete loading
      const testStorylets = {
        'loaded-storylet': {
          id: 'loaded-storylet',
          title: 'Loaded Storylet',
          description: 'A storylet that was loaded',
          sections: [{ 
            id: 'section1', 
            content: 'Loaded content',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [] 
            }]
          }],
          requirements: { flags: {} },
          effects: [],
          tags: ['loaded'],
          frequency: 'once',
          deployment: 'dev'
        }
      };

      const loadTime = Date.now();
      useStoryletCatalogStore.setState({
        allStorylets: testStorylets,
        lastLoaded: loadTime,
        isLoading: false
      });

      expect(catalogStore.isLoading).toBe(false);
      expect(catalogStore.lastLoaded).toBe(loadTime);
      expect(Object.keys(catalogStore.allStorylets)).toHaveLength(1);
    });

    it('should handle incremental storylet updates', () => {
      const catalogStore = useStoryletCatalogStore.getState();

      // Initial load
      const initialStorylets = {
        'story-1': {
          id: 'story-1',
          title: 'Story 1',
          description: 'First story',
          sections: [{ 
            id: 'section1', 
            content: 'Story 1 content',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [] 
            }]
          }],
          requirements: { flags: {} },
          effects: [],
          tags: ['initial'],
          frequency: 'once',
          deployment: 'dev'
        }
      };

      useStoryletCatalogStore.setState({
        allStorylets: initialStorylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      expect(Object.keys(catalogStore.allStorylets)).toHaveLength(1);

      // Add new storylet
      const updatedStorylets = {
        ...initialStorylets,
        'story-2': {
          id: 'story-2',
          title: 'Story 2',
          description: 'Second story',
          sections: [{ 
            id: 'section1', 
            content: 'Story 2 content',
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [] 
            }]
          }],
          requirements: { flags: {} },
          effects: [],
          tags: ['added'],
          frequency: 'once',
          deployment: 'dev'
        }
      };

      useStoryletCatalogStore.setState({
        allStorylets: updatedStorylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      expect(Object.keys(catalogStore.allStorylets)).toHaveLength(2);
      expect(catalogStore.allStorylets['story-1']).toBeDefined();
      expect(catalogStore.allStorylets['story-2']).toBeDefined();
    });
  });

  describe('Data Format Validation', () => {
    it('should handle storylets with different section structures', () => {
      const storyletStore = useStoryletStore.getState();

      const multiSectionStorylet: Storylet = {
        id: 'multi-section',
        title: 'Multi Section Story',
        description: 'A story with multiple sections',
        sections: [
          { 
            id: 'section1', 
            content: 'First section',
            choices: [{ 
              id: 'continue', 
              text: 'Continue to section 2', 
              effects: [],
              nextSection: 'section2'
            }]
          },
          { 
            id: 'section2', 
            content: 'Second section',
            choices: [
              { 
                id: 'option-a', 
                text: 'Choice A', 
                effects: [{ type: 'flag', flag: 'chose_a', value: true }] 
              },
              { 
                id: 'option-b', 
                text: 'Choice B', 
                effects: [{ type: 'flag', flag: 'chose_b', value: true }] 
              }
            ]
          }
        ],
        requirements: { flags: {} },
        effects: [],
        tags: ['multi-section'],
        frequency: 'once',
        deployment: 'dev'
      };

      useStoryletCatalogStore.setState({
        allStorylets: { 'multi-section': multiSectionStorylet },
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();

      expect(storyletStore.allStorylets['multi-section']).toBeDefined();
      expect(storyletStore.allStorylets['multi-section'].sections).toHaveLength(2);
      expect(storyletStore.allStorylets['multi-section'].sections[0].choices[0].nextSection).toBe('section2');
    });

    it('should handle storylets with complex requirements', () => {
      const storyletStore = useStoryletStore.getState();

      const complexStorylet: Storylet = {
        id: 'complex-requirements',
        title: 'Complex Story',
        description: 'Story with complex requirements',
        sections: [{ 
          id: 'section1', 
          content: 'Complex content',
          choices: [{ 
            id: 'choice1', 
            text: 'Continue', 
            effects: [] 
          }]
        }],
        requirements: { 
          flags: {
            flag1: true,
            flag2: false
          },
          resources: {
            energy: 50,
            money: 100
          },
          day: 5
        },
        effects: [],
        tags: ['complex'],
        frequency: 'repeatable',
        cooldown: 3,
        deployment: 'dev'
      };

      useStoryletCatalogStore.setState({
        allStorylets: { 'complex-requirements': complexStorylet },
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();

      const loaded = storyletStore.allStorylets['complex-requirements'];
      expect(loaded).toBeDefined();
      expect(loaded.requirements.flags.flag1).toBe(true);
      expect(loaded.requirements.flags.flag2).toBe(false);
      expect(loaded.requirements.resources?.energy).toBe(50);
      expect(loaded.requirements.resources?.money).toBe(100);
      expect(loaded.requirements.day).toBe(5);
      expect(loaded.cooldown).toBe(3);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of storylets efficiently', () => {
      const catalogStore = useStoryletCatalogStore.getState();
      const storyletStore = useStoryletStore.getState();

      // Generate 100 test storylets
      const largeStoryletSet: Record<string, Storylet> = {};
      for (let i = 0; i < 100; i++) {
        largeStoryletSet[`story-${i}`] = {
          id: `story-${i}`,
          title: `Story ${i}`,
          description: `Description for story ${i}`,
          sections: [{ 
            id: 'section1', 
            content: `Content for story ${i}`,
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [{ type: 'flag', flag: `story_${i}_completed`, value: true }] 
            }]
          }],
          requirements: { flags: {} },
          effects: [],
          tags: [`story-${i}`],
          frequency: 'once',
          deployment: 'dev'
        };
      }

      const startTime = performance.now();
      
      useStoryletCatalogStore.setState({
        allStorylets: largeStoryletSet,
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(Object.keys(catalogStore.allStorylets)).toHaveLength(100);
      expect(Object.keys(storyletStore.allStorylets)).toHaveLength(100);
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should efficiently filter and evaluate large storylet sets', () => {
      const storyletStore = useStoryletStore.getState();

      // Create storylets with varying requirements
      const storylets: Record<string, Storylet> = {};
      for (let i = 0; i < 50; i++) {
        storylets[`always-available-${i}`] = {
          id: `always-available-${i}`,
          title: `Always Available ${i}`,
          description: `Always available story ${i}`,
          sections: [{ 
            id: 'section1', 
            content: `Content ${i}`,
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [] 
            }]
          }],
          requirements: { flags: {} }, // No requirements
          effects: [],
          tags: ['always'],
          frequency: 'repeatable',
          deployment: 'dev'
        };

        storylets[`conditional-${i}`] = {
          id: `conditional-${i}`,
          title: `Conditional ${i}`,
          description: `Conditional story ${i}`,
          sections: [{ 
            id: 'section1', 
            content: `Conditional content ${i}`,
            choices: [{ 
              id: 'choice1', 
              text: 'Continue', 
              effects: [] 
            }]
          }],
          requirements: { flags: { [`requirement_${i}`]: true } },
          effects: [],
          tags: ['conditional'],
          frequency: 'once',
          deployment: 'dev'
        };
      }

      useStoryletCatalogStore.setState({
        allStorylets: storylets,
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();

      const startTime = performance.now();
      storyletStore.evaluateStorylets();
      const endTime = performance.now();

      const evaluationTime = endTime - startTime;
      expect(evaluationTime).toBeLessThan(500); // Should complete within 500ms

      // Should have found the always-available storylets
      expect(storyletStore.activeStoryletIds.length).toBe(50); // Only the always-available ones
    });
  });
});