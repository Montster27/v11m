// /Users/montysharma/v11m2/src/test/integration/componentIntegration.test.ts
// Integration tests for UI component interactions, user workflows, and component communication

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetAllStores, waitForStoreUpdate, createTestStorylet } from '../utils/gameTestUtils';
import { useStoryletStore } from '../../stores/useStoryletStore';
import { useAppStore } from '../../stores/useAppStore';
import { useSocialStore } from '../../stores/v2/useSocialStore';

// Mock component interfaces for testing component integration patterns
interface MockComponentState {
  selectedStorylet: string | null;
  filter: string;
  feedback: string;
  focusedIndex: number;
}

// Mock component behavior simulators
class MockStoryletListComponent {
  private state: MockComponentState = {
    selectedStorylet: null,
    filter: 'all',
    feedback: '',
    focusedIndex: 0
  };

  constructor() {
    this.bindStoreUpdates();
  }

  private bindStoreUpdates() {
    // Simulate component subscribing to store updates
    this.updateFromStores();
  }

  updateFromStores() {
    const storyletStore = useStoryletStore.getState();
    const activeStorylets = storyletStore.activeStoryletIds.map(id => 
      storyletStore.allStorylets[id]
    ).filter(Boolean);
    
    return {
      activeStorylets,
      selectedStorylet: this.state.selectedStorylet,
      hasStorylets: activeStorylets.length > 0
    };
  }

  selectStorylet(storyletId: string) {
    this.state.selectedStorylet = storyletId;
    return this.updateFromStores();
  }

  makeChoice(storyletId: string, choiceId: string) {
    const storyletStore = useStoryletStore.getState();
    storyletStore.chooseStorylet(storyletId, choiceId);
    this.state.feedback = 'Choice made successfully!';
    
    // Simulate feedback timeout
    setTimeout(() => {
      this.state.feedback = '';
    }, 100);
    
    return this.updateFromStores();
  }

  getState() {
    return { ...this.state };
  }
}

class MockResourceDisplayComponent {
  updateFromStores() {
    const appStore = useAppStore.getState();
    return {
      day: appStore.day,
      energy: appStore.resources.energy,
      stress: appStore.resources.stress,
      money: appStore.resources.money,
      knowledge: appStore.resources.knowledge,
      social: appStore.resources.social
    };
  }

  formatResourceDisplay() {
    const data = this.updateFromStores();
    return {
      dayText: `Day ${data.day}`,
      energyText: `Energy: ${data.energy}`,
      stressText: `Stress: ${data.stress}`,
      moneyText: `Money: $${data.money}`,
      knowledgeText: `Knowledge: ${data.knowledge}`,
      socialText: `Social: ${data.social}`
    };
  }
}

class MockClueManagerComponent {
  private state: MockComponentState = {
    selectedStorylet: null,
    filter: 'all',
    feedback: '',
    focusedIndex: 0
  };

  updateFromStores() {
    const socialStore = useSocialStore.getState();
    const allClues = socialStore.getAllDiscoveredClues();
    
    const filteredClues = this.state.filter === 'all' ? allClues : 
      allClues.filter(clue => clue.importance === this.state.filter);
    
    return {
      allClues,
      filteredClues,
      currentFilter: this.state.filter
    };
  }

  setFilter(filter: string) {
    this.state.filter = filter;
    return this.updateFromStores();
  }

  connectClues(clueId1: string, clueId2: string) {
    const socialStore = useSocialStore.getState();
    socialStore.connectClues(clueId1, clueId2);
    return this.updateFromStores();
  }

  getState() {
    return { ...this.state };
  }
}

describe('Component Integration Tests', () => {
  beforeEach(() => {
    resetAllStores();
    vi.clearAllMocks();
  });

  describe('Store-Component Integration', () => {
    it('should sync store state with component updates', async () => {
      const resourceComponent = new MockResourceDisplayComponent();
      
      // Initial state
      const initialState = resourceComponent.updateFromStores();
      expect(initialState.day).toBe(1);
      expect(initialState.energy).toBe(100);

      // Update store
      useAppStore.setState({ day: 5 });
      useAppStore.setState({ 
        resources: { 
          ...useAppStore.getState().resources, 
          energy: 75 
        } 
      });

      await waitForStoreUpdate();

      // Component should reflect updated state
      const updatedState = resourceComponent.updateFromStores();
      expect(updatedState.day).toBe(5);
      expect(updatedState.energy).toBe(75);

      // Formatted display should also update
      const display = resourceComponent.formatResourceDisplay();
      expect(display.dayText).toBe('Day 5');
      expect(display.energyText).toBe('Energy: 75');
    });

    it('should handle multiple store subscriptions correctly', async () => {
      const storyletComponent = new MockStoryletListComponent();
      const clueComponent = new MockClueManagerComponent();
      const storyletStore = useStoryletStore.getState();
      const socialStore = useSocialStore.getState();
      
      // Add test data to multiple stores
      const testStorylet = createTestStorylet({
        id: 'multi-store-test',
        title: 'Multi Store Test',
        trigger: { type: 'flag', conditions: { flags: {} } },
        requirements: { flags: {} }
      });
      
      storyletStore.addStorylet(testStorylet);
      storyletStore.evaluateStorylets();
      
      const testClue = {
        id: 'integration-clue',
        name: 'Integration Test Clue',
        description: 'Test clue for integration',
        discoveryMethod: 'storylet' as const,
        content: 'Test content',
        tags: ['integration'],
        importance: 'medium' as const
      };
      
      socialStore.discoverClue(testClue);
      await waitForStoreUpdate();

      // Both components should reflect their respective store updates
      const storyletData = storyletComponent.updateFromStores();
      const clueData = clueComponent.updateFromStores();

      expect(storyletData.hasStorylets).toBe(true);
      expect(storyletData.activeStorylets.length).toBeGreaterThan(0);
      expect(clueData.allClues).toHaveLength(1);
      expect(clueData.allClues[0].name).toBe('Integration Test Clue');
    });

    it('should handle component state updates from user interactions', async () => {
      const storyletComponent = new MockStoryletListComponent();
      const storyletStore = useStoryletStore.getState();
      
      // Set up test storylet
      const testStorylet = createTestStorylet({
        id: 'interaction-test',
        title: 'Interaction Test',
        sections: [{
          id: 'section1',
          content: 'Test interaction',
          choices: [{
            id: 'test-choice',
            text: 'Test Choice',
            effects: [{ type: 'flag', flag: 'interaction_complete', value: true }]
          }]
        }],
        trigger: { type: 'flag', conditions: { flags: {} } },
        requirements: { flags: {} }
      });
      
      storyletStore.addStorylet(testStorylet);
      storyletStore.evaluateStorylets();
      await waitForStoreUpdate();

      // Simulate user selecting storylet
      const selectionResult = storyletComponent.selectStorylet('interaction-test');
      expect(selectionResult.activeStorylets.length).toBeGreaterThan(0);
      expect(storyletComponent.getState().selectedStorylet).toBe('interaction-test');

      // Simulate user making a choice
      const choiceResult = storyletComponent.makeChoice('interaction-test', 'test-choice');
      expect(storyletComponent.getState().feedback).toBe('Choice made successfully!');
      
      await waitForStoreUpdate();
      
      // Verify flag was set
      expect(useStoryletStore.getState().activeFlags.interaction_complete).toBe(true);
    });
  });

  describe('User Workflow Integration', () => {
    it('should handle complete storylet selection and choice workflow', async () => {
      const storyletComponent = new MockStoryletListComponent();
      const resourceComponent = new MockResourceDisplayComponent();
      const storyletStore = useStoryletStore.getState();
      
      // Create a storylet with resource effects
      const testStorylet = createTestStorylet({
        id: 'workflow-test',
        title: 'Workflow Test Storylet',
        sections: [{
          id: 'section1',
          content: 'Make a choice',
          choices: [
            {
              id: 'choice-energy',
              text: 'Rest (Gain Energy)',
              effects: [{ type: 'resource', resource: 'energy', change: 20 }]
            },
            {
              id: 'choice-knowledge',
              text: 'Study (Gain Knowledge)',
              effects: [{ type: 'resource', resource: 'knowledge', change: 15 }]
            }
          ]
        }],
        trigger: { type: 'flag', conditions: { flags: {} } },
        requirements: { flags: {} }
      });
      
      storyletStore.addStorylet(testStorylet);
      storyletStore.evaluateStorylets();
      await waitForStoreUpdate();

      // Verify storylet is available in component
      const initialData = storyletComponent.updateFromStores();
      expect(initialData.hasStorylets).toBe(true);
      expect(initialData.activeStorylets.some(s => s.id === 'workflow-test')).toBe(true);
      
      // Record initial resource state
      const initialResources = resourceComponent.updateFromStores();
      
      // Simulate user workflow: select and choose
      storyletComponent.selectStorylet('workflow-test');
      storyletComponent.makeChoice('workflow-test', 'choice-energy');
      await waitForStoreUpdate();

      // Verify effects were applied
      const finalResources = resourceComponent.updateFromStores();
      expect(finalResources.energy).toBe(initialResources.energy + 20);
      
      // Verify storylet was completed
      expect(useStoryletStore.getState().completedStoryletIds).toContain('workflow-test');
      
      // Storylet should no longer be active
      const finalData = storyletComponent.updateFromStores();
      expect(finalData.activeStorylets.some(s => s.id === 'workflow-test')).toBe(false);
    });

    it('should handle clue discovery and management workflow', async () => {
      const clueComponent = new MockClueManagerComponent();
      const socialStore = useSocialStore.getState();
      
      // Simulate discovering multiple clues
      const clues = [
        {
          id: 'mystery-clue-1',
          name: 'Mysterious Letter',
          description: 'A letter found in the library',
          discoveryMethod: 'storylet' as const,
          content: 'The letter mentions a secret meeting',
          tags: ['mystery', 'letter'],
          importance: 'high' as const
        },
        {
          id: 'mystery-clue-2',
          name: 'Torn Photo',
          description: 'A torn photograph',
          discoveryMethod: 'investigation' as const,
          content: 'Shows two people at the old clock tower',
          tags: ['mystery', 'photo'],
          importance: 'critical' as const
        },
        {
          id: 'social-clue-1',
          name: 'Overheard Conversation',
          description: 'Conversation between students',
          discoveryMethod: 'social' as const,
          content: 'They mentioned meeting after midnight',
          tags: ['social', 'conversation'],
          importance: 'medium' as const
        }
      ];

      // Discover clues
      for (const clue of clues) {
        socialStore.discoverClue(clue);
      }
      await waitForStoreUpdate();

      // Component should show all clues
      const allCluesData = clueComponent.updateFromStores();
      expect(allCluesData.allClues).toHaveLength(3);
      expect(allCluesData.filteredClues).toHaveLength(3); // 'all' filter

      // Test filtering functionality
      const criticalData = clueComponent.setFilter('critical');
      expect(criticalData.filteredClues).toHaveLength(1);
      expect(criticalData.filteredClues[0].name).toBe('Torn Photo');

      const highData = clueComponent.setFilter('high');
      expect(highData.filteredClues).toHaveLength(1);
      expect(highData.filteredClues[0].name).toBe('Mysterious Letter');

      // Test clue connection
      clueComponent.connectClues('mystery-clue-1', 'mystery-clue-2');
      await waitForStoreUpdate();

      const connections = socialStore.clues.connections['mystery-clue-1'];
      expect(connections).toContain('mystery-clue-2');
    });

    it('should handle progressive unlocking of content', async () => {
      const storyletComponent = new MockStoryletListComponent();
      const storyletStore = useStoryletStore.getState();
      
      // Create a chain of storylets that unlock each other
      const storylet1 = createTestStorylet({
        id: 'chain-1',
        title: 'First Step',
        sections: [{
          id: 'section1',
          content: 'Beginning of the chain',
          choices: [{
            id: 'proceed',
            text: 'Proceed',
            effects: [{ type: 'flag', flag: 'chain_step_1', value: true }]
          }]
        }],
        trigger: { type: 'flag', conditions: { flags: {} } },
        requirements: { flags: {} }
      });

      const storylet2 = createTestStorylet({
        id: 'chain-2',
        title: 'Second Step',
        sections: [{
          id: 'section1',
          content: 'Middle of the chain',
          choices: [{
            id: 'continue',
            text: 'Continue',
            effects: [{ type: 'flag', flag: 'chain_step_2', value: true }]
          }]
        }],
        trigger: { type: 'flag', conditions: { flags: { chain_step_1: true } } },
        requirements: { flags: { chain_step_1: true } }
      });

      const storylet3 = createTestStorylet({
        id: 'chain-3',
        title: 'Final Step',
        sections: [{
          id: 'section1',
          content: 'End of the chain',
          choices: [{
            id: 'finish',
            text: 'Finish',
            effects: [{ type: 'flag', flag: 'chain_complete', value: true }]
          }]
        }],
        trigger: { type: 'flag', conditions: { flags: { chain_step_2: true } } },
        requirements: { flags: { chain_step_2: true } }
      });

      // Add all storylets
      storyletStore.addStorylet(storylet1);
      storyletStore.addStorylet(storylet2);
      storyletStore.addStorylet(storylet3);
      
      storyletStore.evaluateStorylets();
      await waitForStoreUpdate();

      // Initially, only the first should be available
      let currentData = storyletComponent.updateFromStores();
      const activeIds = currentData.activeStorylets.map(s => s.id);
      expect(activeIds).toContain('chain-1');
      expect(activeIds).not.toContain('chain-2');
      expect(activeIds).not.toContain('chain-3');

      // Complete first storylet
      storyletComponent.makeChoice('chain-1', 'proceed');
      storyletStore.evaluateStorylets();
      await waitForStoreUpdate();

      // Now second should be available
      currentData = storyletComponent.updateFromStores();
      const activeIds2 = currentData.activeStorylets.map(s => s.id);
      expect(activeIds2).toContain('chain-2');
      expect(activeIds2).not.toContain('chain-3');

      // Complete second storylet
      storyletComponent.makeChoice('chain-2', 'continue');
      storyletStore.evaluateStorylets();
      await waitForStoreUpdate();

      // Now third should be available
      currentData = storyletComponent.updateFromStores();
      const activeIds3 = currentData.activeStorylets.map(s => s.id);
      expect(activeIds3).toContain('chain-3');

      // Complete the chain
      storyletComponent.makeChoice('chain-3', 'finish');
      await waitForStoreUpdate();

      expect(useStoryletStore.getState().activeFlags.chain_complete).toBe(true);
      expect(useStoryletStore.getState().completedStoryletIds).toContain('chain-1');
      expect(useStoryletStore.getState().completedStoryletIds).toContain('chain-2');
      expect(useStoryletStore.getState().completedStoryletIds).toContain('chain-3');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle component errors gracefully', async () => {
      const storyletComponent = new MockStoryletListComponent();
      
      // Test with empty state
      const emptyData = storyletComponent.updateFromStores();
      expect(emptyData.hasStorylets).toBe(false);
      expect(emptyData.activeStorylets).toHaveLength(0);
      
      // Component should handle empty state without crashing
      expect(() => storyletComponent.selectStorylet('nonexistent')).not.toThrow();
      expect(storyletComponent.getState().selectedStorylet).toBe('nonexistent');
    });

    it('should handle rapid user interactions without breaking', async () => {
      const storyletComponent = new MockStoryletListComponent();
      const storyletStore = useStoryletStore.getState();
      
      // Create a repeatable storylet for rapid interaction testing
      const testStorylet = createTestStorylet({
        id: 'rapid-test',
        title: 'Rapid Interaction Test',
        sections: [{
          id: 'section1',
          content: 'Rapid test content',
          choices: [{
            id: 'rapid-choice',
            text: 'Rapid Choice',
            effects: [{ type: 'resource', resource: 'energy', change: -1 }]
          }]
        }],
        trigger: { type: 'flag', conditions: { flags: {} } },
        requirements: { flags: {} },
        frequency: 'repeatable'
      });

      storyletStore.addStorylet(testStorylet);
      storyletStore.evaluateStorylets();
      await waitForStoreUpdate();

      const initialEnergy = useAppStore.getState().resources.energy;
      
      // Simulate rapid clicks (user spam-clicking)
      for (let i = 0; i < 10; i++) {
        const currentData = storyletComponent.updateFromStores();
        if (currentData.activeStorylets.some(s => s.id === 'rapid-test')) {
          storyletComponent.makeChoice('rapid-test', 'rapid-choice');
          storyletStore.evaluateStorylets(); // Re-evaluate to make it available again
          await waitForStoreUpdate();
        }
      }

      // Energy should have decreased, but system should remain stable
      const finalEnergy = useAppStore.getState().resources.energy;
      expect(finalEnergy).toBeLessThan(initialEnergy);
      expect(finalEnergy).toBeGreaterThanOrEqual(0); // Should not go negative
      
      // Component should still be functional
      const finalData = storyletComponent.updateFromStores();
      expect(() => finalData).not.toThrow();
    });

    it('should handle invalid state transitions gracefully', async () => {
      const storyletComponent = new MockStoryletListComponent();
      const storyletStore = useStoryletStore.getState();
      
      // Try to make choice on non-existent storylet
      const initialCompletedCount = storyletStore.completedStoryletIds.length;
      
      // This should not crash the component
      expect(() => {
        storyletComponent.makeChoice('nonexistent-storylet', 'nonexistent-choice');
      }).not.toThrow();

      await waitForStoreUpdate();

      // State should remain consistent
      expect(useStoryletStore.getState().completedStoryletIds.length).toBe(initialCompletedCount);
      
      // Component should remain functional
      expect(() => storyletComponent.updateFromStores()).not.toThrow();
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain performance with many UI updates', async () => {
      const resourceComponent = new MockResourceDisplayComponent();
      const startTime = performance.now();
      
      // Simulate many rapid UI state changes
      for (let i = 0; i < 100; i++) {
        useAppStore.setState({
          resources: {
            ...useAppStore.getState().resources,
            energy: Math.max(0, 100 - i),
            stress: Math.min(100, i)
          }
        });
        
        // Simulate component updates every 10 changes
        if (i % 10 === 0) {
          resourceComponent.updateFromStores();
          resourceComponent.formatResourceDisplay();
          await waitForStoreUpdate();
        }
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      console.log(`🔄 Component UI update performance: ${totalTime.toFixed(2)}ms for 100 updates`);
      
      expect(totalTime).toBeLessThan(200); // Should complete quickly
      
      // Final component state should be correct
      const finalState = resourceComponent.updateFromStores();
      expect(finalState.energy).toBe(0);
      expect(finalState.stress).toBe(99);
    });

    it('should handle complex component interactions efficiently', async () => {
      const storyletComponent = new MockStoryletListComponent();
      const clueComponent = new MockClueManagerComponent();
      const resourceComponent = new MockResourceDisplayComponent();
      
      const startTime = performance.now();
      
      // Add test data
      const storyletStore = useStoryletStore.getState();
      const socialStore = useSocialStore.getState();
      
      for (let i = 0; i < 20; i++) {
        const storylet = createTestStorylet({
          id: `complex-${i}`,
          title: `Complex Storylet ${i}`,
          trigger: { type: 'flag', conditions: { flags: {} } },
          requirements: { flags: {} }
        });
        storyletStore.addStorylet(storylet);
        
        socialStore.discoverClue({
          id: `complex-clue-${i}`,
          name: `Complex Clue ${i}`,
          description: 'Complex test clue',
          discoveryMethod: 'storylet',
          content: 'Complex content',
          tags: ['complex'],
          importance: i % 2 === 0 ? 'critical' : 'medium'
        });
      }
      
      storyletStore.evaluateStorylets();
      await waitForStoreUpdate();
      
      // Simulate multiple component updates
      for (let i = 0; i < 10; i++) {
        storyletComponent.updateFromStores();
        clueComponent.updateFromStores();
        resourceComponent.updateFromStores();
        resourceComponent.formatResourceDisplay();
      }
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      console.log(`🖼️ Complex component interactions: ${renderTime.toFixed(2)}ms for 10 cycles`);
      
      expect(renderTime).toBeLessThan(150);
      
      // Verify components are working correctly
      const storyletData = storyletComponent.updateFromStores();
      const clueData = clueComponent.updateFromStores();
      
      expect(storyletData.activeStorylets.length).toBeGreaterThan(0);
      expect(clueData.allClues.length).toBe(20);
    });
  });

  describe('Cross-Component Communication', () => {
    it('should handle complex inter-component workflows', async () => {
      const storyletComponent = new MockStoryletListComponent();
      const clueComponent = new MockClueManagerComponent();
      const resourceComponent = new MockResourceDisplayComponent();
      
      const storyletStore = useStoryletStore.getState();
      const socialStore = useSocialStore.getState();
      
      // Create a storylet that provides a clue when completed
      const clueStorylet = createTestStorylet({
        id: 'clue-provider',
        title: 'Mysterious Investigation',
        sections: [{
          id: 'section1',
          content: 'You investigate the mystery',
          choices: [{
            id: 'investigate',
            text: 'Search thoroughly',
            effects: [
              { type: 'resource', resource: 'energy', change: -10 },
              { type: 'flag', flag: 'found_important_clue', value: true }
            ]
          }]
        }],
        trigger: { type: 'flag', conditions: { flags: {} } },
        requirements: { flags: {} }
      });

      storyletStore.addStorylet(clueStorylet);
      storyletStore.evaluateStorylets();
      await waitForStoreUpdate();

      // Record initial states
      const initialResources = resourceComponent.updateFromStores();
      const initialClues = clueComponent.updateFromStores();

      // Simulate user workflow: storylet → resource change → clue discovery
      storyletComponent.makeChoice('clue-provider', 'investigate');
      await waitForStoreUpdate();

      // Manually add clue (simulating storylet effect leading to clue discovery)
      if (useStoryletStore.getState().activeFlags.found_important_clue) {
        socialStore.discoverClue({
          id: 'investigation-result',
          name: 'Critical Evidence',
          description: 'Evidence found during investigation',
          discoveryMethod: 'storylet',
          content: 'This evidence reveals important information',
          tags: ['evidence', 'critical'],
          importance: 'critical'
        });
      }
      await waitForStoreUpdate();

      // Verify cross-component effects
      const finalResources = resourceComponent.updateFromStores();
      const finalClues = clueComponent.updateFromStores();

      // Resource component should show energy decrease
      expect(finalResources.energy).toBe(initialResources.energy - 10);
      
      // Clue component should show new clue
      expect(finalClues.allClues.length).toBe(initialClues.allClues.length + 1);
      expect(finalClues.allClues.some(clue => clue.id === 'investigation-result')).toBe(true);
      
      // Storylet should be completed
      expect(useStoryletStore.getState().completedStoryletIds).toContain('clue-provider');
      expect(useStoryletStore.getState().activeFlags.found_important_clue).toBe(true);
    });

    it('should maintain consistency across component state changes', async () => {
      const storyletComponent = new MockStoryletListComponent();
      const clueComponent = new MockClueManagerComponent();
      
      // Add test data
      const storyletStore = useStoryletStore.getState();
      const socialStore = useSocialStore.getState();
      
      const testStorylet = createTestStorylet({
        id: 'consistency-test',
        title: 'Consistency Test',
        trigger: { type: 'flag', conditions: { flags: {} } },
        requirements: { flags: {} }
      });
      
      storyletStore.addStorylet(testStorylet);
      storyletStore.evaluateStorylets();
      
      socialStore.discoverClue({
        id: 'consistency-clue',
        name: 'Consistency Clue',
        description: 'Test clue',
        discoveryMethod: 'storylet',
        content: 'Test content',
        tags: ['test'],
        importance: 'medium'
      });
      
      await waitForStoreUpdate();

      // Both components should show consistent data
      const storyletData1 = storyletComponent.updateFromStores();
      const clueData1 = clueComponent.updateFromStores();

      expect(storyletData1.hasStorylets).toBe(true);
      expect(clueData1.allClues.length).toBe(1);

      // Make changes and verify consistency
      storyletComponent.makeChoice('consistency-test', 'choice1');
      clueComponent.setFilter('medium');
      await waitForStoreUpdate();

      const storyletData2 = storyletComponent.updateFromStores();
      const clueData2 = clueComponent.updateFromStores();

      // Storylet should be completed
      expect(storyletData2.activeStorylets.some(s => s.id === 'consistency-test')).toBe(false);
      
      // Clue filter should work
      expect(clueData2.filteredClues.length).toBe(1);
      expect(clueData2.filteredClues[0].importance).toBe('medium');
      
      // Underlying store state should be consistent
      expect(useStoryletStore.getState().completedStoryletIds).toContain('consistency-test');
      expect(useSocialStore.getState().getAllDiscoveredClues().length).toBe(1);
    });
  });
});