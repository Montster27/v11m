// /Users/montysharma/V11M2/src/test/clueConnectionValidation.test.ts
// Test to validate clue connections in the arc visualizer

import { describe, it, expect, beforeEach } from 'vitest';
import { findConnections } from '../utils/graphLayout';
import type { Storylet } from '../types/storylet';
import type { Clue } from '../types/clue';

describe('Clue Connection Graph Layout', () => {
  let storylets: Storylet[];
  let clues: Clue[];

  beforeEach(() => {
    // Set up test storylets
    storylets = [
      {
        id: 'trigger-storylet',
        name: 'Investigation Trigger',
        description: 'A storylet that can trigger clue discovery',
        trigger: { type: 'time', conditions: { day: 1 } },
        choices: [],
        storyArc: 'TestArc',
        deploymentStatus: 'dev'
      },
      {
        id: 'success-storylet',
        name: 'Successful Discovery',
        description: 'What happens when the clue is found',
        trigger: { type: 'time', conditions: { day: 2 } },
        choices: [],
        storyArc: 'TestArc',
        deploymentStatus: 'dev'
      },
      {
        id: 'failure-storylet',
        name: 'Failed Investigation',
        description: 'What happens when the clue is not found',
        trigger: { type: 'time', conditions: { day: 3 } },
        choices: [],
        storyArc: 'TestArc',
        deploymentStatus: 'dev'
      }
    ];

    // Set up test clue with proper connections
    clues = [
      {
        id: 'test-clue',
        title: 'Mysterious Letter',
        description: 'A letter with cryptic symbols',
        content: 'The letter contains strange markings...',
        category: 'mystery',
        difficulty: 'medium',
        storyArc: 'TestArc',
        arcOrder: 1,
        minigameTypes: ['memory_cards'],
        associatedStorylets: ['trigger-storylet'], // This is the key field
        positiveOutcomeStorylet: 'success-storylet',
        negativeOutcomeStorylet: 'failure-storylet',
        isDiscovered: false,
        tags: ['test'],
        rarity: 'common',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  });

  it('should create connections from trigger storylets to outcome storylets', () => {
    const { connections, edges } = findConnections(storylets, clues);

    // Verify that the trigger storylet has connections to both outcome storylets
    expect(connections.has('trigger-storylet')).toBe(true);
    
    const triggerConnections = connections.get('trigger-storylet');
    expect(triggerConnections).toContain('success-storylet');
    expect(triggerConnections).toContain('failure-storylet');
  });

  it('should create edges with correct clue types', () => {
    const { edges } = findConnections(storylets, clues);

    // Find the clue-related edges
    const positiveEdge = edges.find(edge => 
      edge.from === 'trigger-storylet' && 
      edge.to === 'success-storylet' && 
      edge.edgeType === 'clue_positive'
    );

    const negativeEdge = edges.find(edge => 
      edge.from === 'trigger-storylet' && 
      edge.to === 'failure-storylet' && 
      edge.edgeType === 'clue_negative'
    );

    expect(positiveEdge).toBeDefined();
    expect(negativeEdge).toBeDefined();

    // Verify edge properties
    expect(positiveEdge?.choiceText).toBe('✅ Success: Mysterious Letter');
    expect(negativeEdge?.choiceText).toBe('❌ Failure: Mysterious Letter');
    expect(positiveEdge?.clueId).toBe('test-clue');
    expect(negativeEdge?.clueId).toBe('test-clue');
  });

  it('should handle clues without outcome storylets', () => {
    const clueWithoutOutcomes: Clue = {
      ...clues[0],
      id: 'incomplete-clue',
      positiveOutcomeStorylet: undefined,
      negativeOutcomeStorylet: undefined
    };

    const { connections, edges } = findConnections(storylets, [clueWithoutOutcomes]);

    // Should not create any connections for clues without outcomes
    const clueEdges = edges.filter(edge => edge.clueId === 'incomplete-clue');
    expect(clueEdges).toHaveLength(0);
  });

  it('should handle clues without associated storylets', () => {
    const clueWithoutTriggers: Clue = {
      ...clues[0],
      id: 'orphaned-clue',
      associatedStorylets: []
    };

    const { connections, edges } = findConnections(storylets, [clueWithoutTriggers]);

    // Should not create connections for clues without trigger storylets
    const clueEdges = edges.filter(edge => edge.clueId === 'orphaned-clue');
    expect(clueEdges).toHaveLength(0);
  });

  it('should handle missing storylets gracefully', () => {
    const clueWithMissingStorylets: Clue = {
      ...clues[0],
      id: 'missing-storylets-clue',
      associatedStorylets: ['nonexistent-storylet'],
      positiveOutcomeStorylet: 'nonexistent-success',
      negativeOutcomeStorylet: 'nonexistent-failure'
    };

    const { connections, edges } = findConnections(storylets, [clueWithMissingStorylets]);

    // Should not create connections to nonexistent storylets
    const clueEdges = edges.filter(edge => edge.clueId === 'missing-storylets-clue');
    expect(clueEdges).toHaveLength(0);
  });

  it('should prioritize associatedStorylets over clue discovery effects', () => {
    // Add a storylet with explicit clue discovery effect
    const storyletWithEffect: Storylet = {
      id: 'effect-storylet',
      name: 'Storylet with Clue Effect',
      description: 'Has explicit clue discovery',
      trigger: { type: 'time', conditions: { day: 4 } },
      choices: [{
        id: 'choice-1',
        text: 'Investigate',
        effects: [
          {
            type: 'clue_discovery',
            clueId: 'test-clue',
            key: 'discovery',
            value: 'test-clue'
          }
        ]
      }],
      storyArc: 'TestArc',
      deploymentStatus: 'dev'
    };

    const modifiedStorylets = [...storylets, storyletWithEffect];
    const { connections } = findConnections(modifiedStorylets, clues);

    // Should still use associatedStorylets (trigger-storylet) as primary source
    expect(connections.has('trigger-storylet')).toBe(true);
    
    // Effect storylet should not be used since associatedStorylets is defined
    expect(connections.has('effect-storylet')).toBe(false);
  });
});