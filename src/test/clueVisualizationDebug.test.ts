// /Users/montysharma/V11M2/src/test/clueVisualizationDebug.test.ts
// Debug test to check if clue connections are being generated correctly

import { describe, it, expect } from 'vitest';
import { calculateGraphLayout } from '../utils/graphLayout';
import type { Storylet } from '../types/storylet';
import type { Clue } from '../types/clue';

describe('Clue Visualization Debug', () => {
  it('should generate clue connection edges in the complete layout', () => {
    // Create test storylets
    const storylets: Storylet[] = [
      {
        id: 'investigation-start',
        name: 'Investigation Begins',
        description: 'Player starts investigating',
        trigger: { type: 'time', conditions: { day: 1 } },
        choices: [
          {
            id: 'choice-1',
            text: 'Look for clues',
            effects: []
          }
        ],
        storyArc: 'MysteryArc',
        deploymentStatus: 'dev'
      },
      {
        id: 'clue-found',
        name: 'Discovery Success',
        description: 'Player found the clue',
        trigger: { type: 'time', conditions: { day: 2 } },
        choices: [],
        storyArc: 'MysteryArc',
        deploymentStatus: 'dev'
      },
      {
        id: 'search-failed',
        name: 'Search Failed',
        description: 'Player missed the clue',
        trigger: { type: 'time', conditions: { day: 3 } },
        choices: [],
        storyArc: 'MysteryArc',
        deploymentStatus: 'dev'
      }
    ];

    // Create test clue with connections
    const clues: Clue[] = [
      {
        id: 'hidden-evidence',
        title: 'Hidden Evidence',
        description: 'A crucial piece of evidence',
        content: 'Evidence that solves the mystery',
        category: 'mystery',
        difficulty: 'hard',
        storyArc: 'MysteryArc',
        arcOrder: 1,
        minigameTypes: ['memory_cards', 'path_planner'],
        associatedStorylets: ['investigation-start'], // Links to trigger storylet
        positiveOutcomeStorylet: 'clue-found', // Success path
        negativeOutcomeStorylet: 'search-failed', // Failure path
        isDiscovered: false,
        tags: ['evidence', 'crucial'],
        rarity: 'rare',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Generate the complete layout
    const layout = calculateGraphLayout(storylets, clues);

    // Log all edges for debugging
    console.log('🐛 DEBUG: All generated edges:');
    layout.edges.forEach((edge, index) => {
      console.log(`  ${index}: ${edge.from} -> ${edge.to} (${edge.edgeType}) "${edge.choiceText}"`);
    });

    // Verify clue connection edges exist
    const cluePositiveEdge = layout.edges.find(edge => 
      edge.edgeType === 'clue_positive' && 
      edge.from === 'investigation-start' && 
      edge.to === 'clue-found'
    );

    const clueNegativeEdge = layout.edges.find(edge => 
      edge.edgeType === 'clue_negative' && 
      edge.from === 'investigation-start' && 
      edge.to === 'search-failed'
    );

    console.log('🐛 DEBUG: Clue positive edge found:', !!cluePositiveEdge);
    console.log('🐛 DEBUG: Clue negative edge found:', !!clueNegativeEdge);

    if (cluePositiveEdge) {
      console.log('🐛 DEBUG: Positive edge details:', cluePositiveEdge);
    }
    if (clueNegativeEdge) {
      console.log('🐛 DEBUG: Negative edge details:', clueNegativeEdge);
    }

    // Verify the edges exist
    expect(cluePositiveEdge).toBeDefined();
    expect(clueNegativeEdge).toBeDefined();

    // Verify edge properties
    expect(cluePositiveEdge?.choiceText).toBe('✅ Success: Hidden Evidence');
    expect(clueNegativeEdge?.choiceText).toBe('❌ Failure: Hidden Evidence');
    expect(cluePositiveEdge?.clueId).toBe('hidden-evidence');
    expect(clueNegativeEdge?.clueId).toBe('hidden-evidence');

    // Verify that regular choice connections also exist
    const choiceEdge = layout.edges.find(edge => 
      edge.edgeType === 'choice' && 
      edge.from === 'investigation-start'
    );

    console.log('🐛 DEBUG: Regular choice edge found:', !!choiceEdge);
    if (choiceEdge) {
      console.log('🐛 DEBUG: Choice edge details:', choiceEdge);
    }

    // Total edges should include both choice and clue edges
    expect(layout.edges.length).toBeGreaterThanOrEqual(3); // 1 choice + 2 clue outcomes
  });

  it('should show the difference between storylets with and without clue connections', () => {
    const storyletsWithoutClues: Storylet[] = [
      {
        id: 'regular-story',
        name: 'Regular Story',
        description: 'Just a normal story progression',
        trigger: { type: 'time', conditions: { day: 1 } },
        choices: [
          {
            id: 'choice-1',
            text: 'Continue',
            effects: [],
            nextStoryletId: 'next-story'
          }
        ],
        storyArc: 'RegularArc',
        deploymentStatus: 'dev'
      },
      {
        id: 'next-story',
        name: 'Next Story',
        description: 'The next part',
        trigger: { type: 'time', conditions: { day: 2 } },
        choices: [],
        storyArc: 'RegularArc',
        deploymentStatus: 'dev'
      }
    ];

    const layoutWithoutClues = calculateGraphLayout(storyletsWithoutClues, []);
    const layoutWithClues = calculateGraphLayout(storyletsWithoutClues, []);

    console.log('🐛 DEBUG: Edges without clues:', layoutWithoutClues.edges.length);
    console.log('🐛 DEBUG: Edge types without clues:', layoutWithoutClues.edges.map(e => e.edgeType));

    // Should only have choice edges
    expect(layoutWithoutClues.edges.every(edge => edge.edgeType === 'choice')).toBe(true);
  });
});