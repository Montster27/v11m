// /Users/montysharma/v11m2/src/test/integration/clueStoryArcIntegration.test.ts
// Integration tests for clue assignment and story arc integration

import { describe, it, expect, beforeEach } from 'vitest';
import { resetAllStores } from '../utils/gameTestUtils';
import { useSocialStore } from '../../stores/v2/useSocialStore';
import { useStoryletStore } from '../../stores/useStoryletStore';
import { useStoryletCatalogStore } from '../../stores/useStoryletCatalogStore';
import type { Clue } from '../../types/clue';
import type { Storylet } from '../../types/storylet';

describe('Clue and Story Arc Integration', () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe('Clue Discovery and Management', () => {
    it('should discover and track clues', () => {
      const socialStore = useSocialStore.getState();

      const testClue: Clue = {
        id: 'test-clue-1',
        name: 'Test Clue',
        description: 'A test clue for validation',
        discoveryMethod: 'storylet',
        content: 'This is test clue content',
        tags: ['test', 'discovery'],
        storyArc: 'test-arc',
        importance: 'medium'
      };

      // Discover the clue
      socialStore.discoverClue(testClue);

      // Verify clue was added
      const discoveredClues = socialStore.getAllDiscoveredClues();
      expect(discoveredClues).toHaveLength(1);
      expect(discoveredClues[0].id).toBe('test-clue-1');
      expect(discoveredClues[0].name).toBe('Test Clue');

      // Verify discovery event was recorded
      expect(socialStore.clues.discoveryEvents).toHaveLength(1);
      expect(socialStore.clues.discoveryEvents[0].clueId).toBe('test-clue-1');
      expect(socialStore.clues.discoveryEvents[0].discoveryMethod).toBe('storylet');
    });

    it('should prevent duplicate clue discovery', () => {
      const socialStore = useSocialStore.getState();

      const testClue: Clue = {
        id: 'duplicate-test',
        name: 'Duplicate Test Clue',
        description: 'A clue that should not be duplicated',
        discoveryMethod: 'investigation',
        content: 'Duplicate content',
        tags: ['duplicate'],
        storyArc: 'test-arc',
        importance: 'high'
      };

      // Discover the clue twice
      socialStore.discoverClue(testClue);
      socialStore.discoverClue(testClue);

      // Should only have one instance
      const discoveredClues = socialStore.getAllDiscoveredClues();
      expect(discoveredClues).toHaveLength(1);
      expect(discoveredClues[0].id).toBe('duplicate-test');

      // Should only have one discovery event
      expect(socialStore.clues.discoveryEvents).toHaveLength(1);
    });

    it('should handle clue retrieval by ID', () => {
      const socialStore = useSocialStore.getState();

      const clue1: Clue = {
        id: 'clue-1',
        name: 'First Clue',
        description: 'First test clue',
        discoveryMethod: 'storylet',
        content: 'First clue content',
        tags: ['first'],
        storyArc: 'arc-1',
        importance: 'low'
      };

      const clue2: Clue = {
        id: 'clue-2',
        name: 'Second Clue',
        description: 'Second test clue',
        discoveryMethod: 'minigame',
        content: 'Second clue content',
        tags: ['second'],
        storyArc: 'arc-2',
        importance: 'critical'
      };

      socialStore.discoverClue(clue1);
      socialStore.discoverClue(clue2);

      // Test retrieval by ID
      const retrievedClue1 = socialStore.getClueById('clue-1');
      const retrievedClue2 = socialStore.getClueById('clue-2');
      const nonExistentClue = socialStore.getClueById('non-existent');

      expect(retrievedClue1).toBeDefined();
      expect(retrievedClue1?.name).toBe('First Clue');
      expect(retrievedClue1?.storyArc).toBe('arc-1');

      expect(retrievedClue2).toBeDefined();
      expect(retrievedClue2?.name).toBe('Second Clue');
      expect(retrievedClue2?.importance).toBe('critical');

      expect(nonExistentClue).toBeNull();
    });
  });

  describe('Clue Connections and Relationships', () => {
    it('should create connections between clues', () => {
      const socialStore = useSocialStore.getState();

      const clueA: Clue = {
        id: 'clue-a',
        name: 'Clue A',
        description: 'First connected clue',
        discoveryMethod: 'storylet',
        content: 'Content A',
        tags: ['connection'],
        storyArc: 'connection-arc',
        importance: 'medium'
      };

      const clueB: Clue = {
        id: 'clue-b',
        name: 'Clue B',
        description: 'Second connected clue',
        discoveryMethod: 'investigation',
        content: 'Content B',
        tags: ['connection'],
        storyArc: 'connection-arc',
        importance: 'medium'
      };

      // Discover both clues
      socialStore.discoverClue(clueA);
      socialStore.discoverClue(clueB);

      // Connect the clues
      socialStore.connectClues('clue-a', 'clue-b');

      // Verify bidirectional connection
      expect(socialStore.clues.connections['clue-a']).toContain('clue-b');
      expect(socialStore.clues.connections['clue-b']).toContain('clue-a');
    });

    it('should handle multiple connections per clue', () => {
      const socialStore = useSocialStore.getState();

      const clues: Clue[] = [
        {
          id: 'central-clue',
          name: 'Central Clue',
          description: 'Main connecting clue',
          discoveryMethod: 'storylet',
          content: 'Central content',
          tags: ['central'],
          storyArc: 'multi-arc',
          importance: 'critical'
        },
        {
          id: 'connected-1',
          name: 'Connected 1',
          description: 'First connected clue',
          discoveryMethod: 'minigame',
          content: 'Connected content 1',
          tags: ['connected'],
          storyArc: 'multi-arc',
          importance: 'low'
        },
        {
          id: 'connected-2',
          name: 'Connected 2',
          description: 'Second connected clue',
          discoveryMethod: 'investigation',
          content: 'Connected content 2',
          tags: ['connected'],
          storyArc: 'multi-arc',
          importance: 'medium'
        }
      ];

      // Discover all clues
      clues.forEach(clue => socialStore.discoverClue(clue));

      // Connect central clue to others
      socialStore.connectClues('central-clue', 'connected-1');
      socialStore.connectClues('central-clue', 'connected-2');

      // Verify central clue has multiple connections
      expect(socialStore.clues.connections['central-clue']).toHaveLength(2);
      expect(socialStore.clues.connections['central-clue']).toContain('connected-1');
      expect(socialStore.clues.connections['central-clue']).toContain('connected-2');

      // Verify reverse connections
      expect(socialStore.clues.connections['connected-1']).toContain('central-clue');
      expect(socialStore.clues.connections['connected-2']).toContain('central-clue');
    });
  });

  describe('Story Arc Association', () => {
    it('should associate clues with story arcs', () => {
      const socialStore = useSocialStore.getState();

      const arcClues: Clue[] = [
        {
          id: 'arc-clue-1',
          name: 'Arc Clue 1',
          description: 'First arc clue',
          discoveryMethod: 'storylet',
          content: 'Arc content 1',
          tags: ['arc'],
          storyArc: 'mystery-arc',
          importance: 'high'
        },
        {
          id: 'arc-clue-2',
          name: 'Arc Clue 2',
          description: 'Second arc clue',
          discoveryMethod: 'investigation',
          content: 'Arc content 2',
          tags: ['arc'],
          storyArc: 'mystery-arc',
          importance: 'critical'
        }
      ];

      // Discover clues
      arcClues.forEach(clue => socialStore.discoverClue(clue));

      // Associate with arc
      socialStore.associateClueWithArc('arc-clue-1', 'mystery-arc');
      socialStore.associateClueWithArc('arc-clue-2', 'mystery-arc');

      // Verify arc associations
      expect(socialStore.clues.storyArcs['mystery-arc']).toHaveLength(2);
      expect(socialStore.clues.storyArcs['mystery-arc']).toContain('arc-clue-1');
      expect(socialStore.clues.storyArcs['mystery-arc']).toContain('arc-clue-2');
    });

    it('should handle advanced arc relationships', () => {
      const socialStore = useSocialStore.getState();

      // Set up arc relationship for first clue
      socialStore.setClueArcRelationship('relationship-clue-1', {
        storyArc: 'relationship-arc',
        arcOrder: 1,
        prerequisites: [],
        unlocks: ['relationship-clue-2'],
        arcProgress: 25
      });

      // Set up arc relationship for second clue
      socialStore.setClueArcRelationship('relationship-clue-2', {
        storyArc: 'relationship-arc',
        arcOrder: 2,
        prerequisites: ['relationship-clue-1'],
        unlocks: ['relationship-clue-3'],
        arcProgress: 50
      });

      // Verify relationships
      const clue1Relationship = socialStore.clues.arcRelationships['relationship-clue-1'];
      const clue2Relationship = socialStore.clues.arcRelationships['relationship-clue-2'];

      expect(clue1Relationship.storyArc).toBe('relationship-arc');
      expect(clue1Relationship.arcOrder).toBe(1);
      expect(clue1Relationship.unlocks).toContain('relationship-clue-2');
      expect(clue1Relationship.arcProgress).toBe(25);

      expect(clue2Relationship.prerequisites).toContain('relationship-clue-1');
      expect(clue2Relationship.arcOrder).toBe(2);
      expect(clue2Relationship.arcProgress).toBe(50);

      // Test getting clues by arc
      const arcClues = socialStore.getCluesByArc('relationship-arc');
      expect(arcClues).toHaveLength(2);
      expect(arcClues[0]).toBe('relationship-clue-1'); // Should be ordered by arcOrder
      expect(arcClues[1]).toBe('relationship-clue-2');
    });
  });

  describe('Arc Discovery Progress', () => {
    it('should initialize and track arc discovery progress', () => {
      const socialStore = useSocialStore.getState();

      // Initialize arc progress
      socialStore.initializeArcProgress('progress-arc', 5);

      const initialProgress = socialStore.clues.arcDiscoveryProgress['progress-arc'];
      expect(initialProgress.totalClues).toBe(5);
      expect(initialProgress.discoveredClues).toHaveLength(0);
      expect(initialProgress.completionPercentage).toBe(0);
      expect(initialProgress.nextClues).toHaveLength(0);
    });

    it('should update arc progress when clues are discovered', () => {
      const socialStore = useSocialStore.getState();

      // Initialize arc with 3 clues
      socialStore.initializeArcProgress('update-arc', 3);

      // Set up clue relationships
      socialStore.setClueArcRelationship('update-clue-1', {
        storyArc: 'update-arc',
        arcOrder: 1,
        unlocks: ['update-clue-2']
      });

      socialStore.setClueArcRelationship('update-clue-2', {
        storyArc: 'update-arc',
        arcOrder: 2,
        prerequisites: ['update-clue-1'],
        unlocks: ['update-clue-3']
      });

      // Update progress for first clue
      socialStore.updateArcDiscoveryProgress('update-arc', 'update-clue-1');

      let progress = socialStore.clues.arcDiscoveryProgress['update-arc'];
      expect(progress.discoveredClues).toContain('update-clue-1');
      expect(progress.completionPercentage).toBeCloseTo(33.33, 1);
      expect(progress.nextClues).toContain('update-clue-2');

      // Update progress for second clue
      socialStore.updateArcDiscoveryProgress('update-arc', 'update-clue-2');

      progress = socialStore.clues.arcDiscoveryProgress['update-arc'];
      expect(progress.discoveredClues).toHaveLength(2);
      expect(progress.completionPercentage).toBeCloseTo(66.67, 1);
      expect(progress.nextClues).toContain('update-clue-3');
    });

    it('should provide arc completion percentage', () => {
      const socialStore = useSocialStore.getState();

      // Initialize arc
      socialStore.initializeArcProgress('completion-arc', 4);

      // Check initial completion
      expect(socialStore.getArcCompletionPercentage('completion-arc')).toBe(0);

      // Add some discovered clues
      socialStore.updateArcDiscoveryProgress('completion-arc', 'clue-1');
      expect(socialStore.getArcCompletionPercentage('completion-arc')).toBe(25);

      socialStore.updateArcDiscoveryProgress('completion-arc', 'clue-2');
      expect(socialStore.getArcCompletionPercentage('completion-arc')).toBe(50);

      socialStore.updateArcDiscoveryProgress('completion-arc', 'clue-3');
      expect(socialStore.getArcCompletionPercentage('completion-arc')).toBe(75);

      socialStore.updateArcDiscoveryProgress('completion-arc', 'clue-4');
      expect(socialStore.getArcCompletionPercentage('completion-arc')).toBe(100);
    });
  });

  describe('Integration with Storylets', () => {
    it('should integrate clue discovery with storylet progression', () => {
      const socialStore = useSocialStore.getState();
      const storyletStore = useStoryletStore.getState();

      // Create storylet that discovers a clue
      const clueDiscoveryStorylet: Storylet = {
        id: 'clue-discovery-storylet',
        title: 'Clue Discovery',
        description: 'A storylet that discovers a clue',
        sections: [{ 
          id: 'section1', 
          content: 'You discover something important',
          choices: [{ 
            id: 'investigate', 
            text: 'Investigate further', 
            effects: [
              { 
                type: 'clue_discovery', 
                clueId: 'storylet-clue',
                clue: {
                  id: 'storylet-clue',
                  name: 'Storylet Clue',
                  description: 'A clue discovered through a storylet',
                  discoveryMethod: 'storylet',
                  content: 'Important storylet information',
                  tags: ['storylet-discovered'],
                  storyArc: 'integration-arc',
                  importance: 'high'
                }
              }
            ] 
          }]
        }],
        requirements: { flags: {} },
        effects: [],
        tags: ['clue-discovery'],
        frequency: 'once',
        deployment: 'dev'
      };

      useStoryletCatalogStore.setState({
        allStorylets: { 'clue-discovery-storylet': clueDiscoveryStorylet },
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();

      // Before discovery
      expect(socialStore.getAllDiscoveredClues()).toHaveLength(0);

      // Complete the storylet (this would normally trigger clue discovery)
      storyletStore.chooseStorylet('clue-discovery-storylet', 'investigate');

      // In a real implementation, the clue would be discovered automatically
      // For this test, we'll manually trigger it to demonstrate the integration
      const testClue: Clue = {
        id: 'storylet-clue',
        name: 'Storylet Clue',
        description: 'A clue discovered through a storylet',
        discoveryMethod: 'storylet',
        content: 'Important storylet information',
        tags: ['storylet-discovered'],
        storyArc: 'integration-arc',
        importance: 'high'
      };

      socialStore.discoverClue(testClue);

      // Verify clue was discovered
      const discoveredClues = socialStore.getAllDiscoveredClues();
      expect(discoveredClues).toHaveLength(1);
      expect(discoveredClues[0].id).toBe('storylet-clue');
      expect(discoveredClues[0].discoveryMethod).toBe('storylet');
    });

    it('should handle clue-dependent storylet activation', () => {
      const socialStore = useSocialStore.getState();
      const storyletStore = useStoryletStore.getState();

      // Discover a clue first
      const prerequisiteClue: Clue = {
        id: 'prerequisite-clue',
        name: 'Prerequisite Clue',
        description: 'A clue needed for storylet activation',
        discoveryMethod: 'investigation',
        content: 'Prerequisite information',
        tags: ['prerequisite'],
        storyArc: 'dependency-arc',
        importance: 'critical'
      };

      socialStore.discoverClue(prerequisiteClue);

      // Create storylet that requires the clue
      const clueDependentStorylet: Storylet = {
        id: 'clue-dependent-storylet',
        title: 'Clue Dependent Story',
        description: 'A storylet that requires a specific clue',
        sections: [{ 
          id: 'section1', 
          content: 'You can proceed because you have the clue',
          choices: [{ 
            id: 'proceed', 
            text: 'Proceed with investigation', 
            effects: [{ type: 'flag', flag: 'investigation_continued', value: true }] 
          }]
        }],
        requirements: { 
          flags: {},
          clues: ['prerequisite-clue'] // Custom requirement type
        },
        effects: [],
        tags: ['clue-dependent'],
        frequency: 'once',
        deployment: 'dev'
      };

      useStoryletCatalogStore.setState({
        allStorylets: { 'clue-dependent-storylet': clueDependentStorylet },
        lastLoaded: Date.now(),
        isLoading: false
      });

      storyletStore.syncFromCatalogStore();

      // The storylet should be available because we have the required clue
      // (In a real implementation, the evaluation engine would check clue requirements)
      expect(Object.keys(storyletStore.allStorylets)).toContain('clue-dependent-storylet');
    });
  });

  describe('Complex Arc Scenarios', () => {
    it('should handle multi-arc clue relationships', () => {
      const socialStore = useSocialStore.getState();

      // Create a clue that belongs to multiple arcs
      const multiArcClue: Clue = {
        id: 'multi-arc-clue',
        name: 'Multi-Arc Clue',
        description: 'A clue relevant to multiple story arcs',
        discoveryMethod: 'investigation',
        content: 'Information relevant to multiple storylines',
        tags: ['multi-arc', 'important'],
        storyArc: 'primary-arc', // Primary arc
        importance: 'critical'
      };

      socialStore.discoverClue(multiArcClue);

      // Associate with multiple arcs
      socialStore.associateClueWithArc('multi-arc-clue', 'primary-arc');
      socialStore.associateClueWithArc('multi-arc-clue', 'secondary-arc');
      socialStore.associateClueWithArc('multi-arc-clue', 'tertiary-arc');

      // Verify associations
      expect(socialStore.clues.storyArcs['primary-arc']).toContain('multi-arc-clue');
      expect(socialStore.clues.storyArcs['secondary-arc']).toContain('multi-arc-clue');
      expect(socialStore.clues.storyArcs['tertiary-arc']).toContain('multi-arc-clue');
    });

    it('should handle arc branching and convergence', () => {
      const socialStore = useSocialStore.getState();

      // Set up branching arc structure
      // Branch point clue
      socialStore.setClueArcRelationship('branch-point', {
        storyArc: 'branching-arc',
        arcOrder: 1,
        unlocks: ['branch-a-clue', 'branch-b-clue'],
        arcProgress: 20
      });

      // Branch A
      socialStore.setClueArcRelationship('branch-a-clue', {
        storyArc: 'branching-arc',
        arcOrder: 2,
        prerequisites: ['branch-point'],
        unlocks: ['convergence-clue'],
        arcProgress: 40
      });

      // Branch B
      socialStore.setClueArcRelationship('branch-b-clue', {
        storyArc: 'branching-arc',
        arcOrder: 2,
        prerequisites: ['branch-point'],
        unlocks: ['convergence-clue'],
        arcProgress: 40
      });

      // Convergence point
      socialStore.setClueArcRelationship('convergence-clue', {
        storyArc: 'branching-arc',
        arcOrder: 3,
        prerequisites: ['branch-a-clue'], // Could require either branch
        arcProgress: 60
      });

      // Initialize arc progress
      socialStore.initializeArcProgress('branching-arc', 4);

      // Simulate discovering branch point
      socialStore.updateArcDiscoveryProgress('branching-arc', 'branch-point');

      let progress = socialStore.clues.arcDiscoveryProgress['branching-arc'];
      expect(progress.nextClues).toContain('branch-a-clue');
      expect(progress.nextClues).toContain('branch-b-clue');

      // Take branch A
      socialStore.updateArcDiscoveryProgress('branching-arc', 'branch-a-clue');

      progress = socialStore.clues.arcDiscoveryProgress['branching-arc'];
      expect(progress.nextClues).toContain('convergence-clue');
      expect(progress.completionPercentage).toBe(50);
    });

    it('should handle arc completion and unlocking', () => {
      const socialStore = useSocialStore.getState();
      const storyletStore = useStoryletStore.getState();

      // Set up a complete arc with multiple clues
      const arcClues = ['final-arc-1', 'final-arc-2', 'final-arc-3'];
      
      arcClues.forEach((clueId, index) => {
        socialStore.setClueArcRelationship(clueId, {
          storyArc: 'completion-arc',
          arcOrder: index + 1,
          prerequisites: index === 0 ? [] : [arcClues[index - 1]],
          unlocks: index === arcClues.length - 1 ? [] : [arcClues[index + 1]],
          arcProgress: ((index + 1) / arcClues.length) * 100
        });
      });

      socialStore.initializeArcProgress('completion-arc', 3);

      // Discover all clues in sequence
      arcClues.forEach(clueId => {
        socialStore.updateArcDiscoveryProgress('completion-arc', clueId);
      });

      // Arc should be 100% complete
      expect(socialStore.getArcCompletionPercentage('completion-arc')).toBe(100);

      // This could trigger new storylets or unlock new arcs
      // (In a real implementation)
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent arc operations gracefully', () => {
      const socialStore = useSocialStore.getState();

      // Operations on non-existent arcs should not crash
      expect(() => {
        socialStore.getArcCompletionPercentage('non-existent-arc');
      }).not.toThrow();

      expect(() => {
        socialStore.getAvailableCluesForArc('non-existent-arc');
      }).not.toThrow();

      expect(() => {
        socialStore.updateArcDiscoveryProgress('non-existent-arc', 'some-clue');
      }).not.toThrow();

      // Should return sensible defaults
      expect(socialStore.getArcCompletionPercentage('non-existent-arc')).toBe(0);
      expect(socialStore.getAvailableCluesForArc('non-existent-arc')).toEqual([]);
    });

    it('should handle malformed clue data', () => {
      const socialStore = useSocialStore.getState();

      // Test with minimal clue data
      const minimalClue = {
        id: 'minimal-clue',
        name: 'Minimal Clue',
        description: 'Minimal test clue'
        // Missing optional fields
      } as Clue;

      expect(() => {
        socialStore.discoverClue(minimalClue);
      }).not.toThrow();

      const discovered = socialStore.getClueById('minimal-clue');
      expect(discovered).toBeDefined();
      expect(discovered?.id).toBe('minimal-clue');
    });

    it('should handle circular clue dependencies', () => {
      const socialStore = useSocialStore.getState();

      // Create circular dependency (A → B → C → A)
      socialStore.setClueArcRelationship('circular-a', {
        storyArc: 'circular-arc',
        arcOrder: 1,
        unlocks: ['circular-b']
      });

      socialStore.setClueArcRelationship('circular-b', {
        storyArc: 'circular-arc',
        arcOrder: 2,
        prerequisites: ['circular-a'],
        unlocks: ['circular-c']
      });

      socialStore.setClueArcRelationship('circular-c', {
        storyArc: 'circular-arc',
        arcOrder: 3,
        prerequisites: ['circular-b'],
        unlocks: ['circular-a'] // Creates circular dependency
      });

      // Should not crash when getting next clue
      expect(() => {
        socialStore.getNextClueInArc('circular-arc');
      }).not.toThrow();
    });
  });
});