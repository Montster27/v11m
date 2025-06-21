// Test utility for creating storylets with clue discovery effects for arc testing
import type { Storylet } from '../types/storylet';
import { useStoryletCatalogStore } from '../store/useStoryletCatalogStore';
import { useClueStore } from '../store/useClueStore';

/**
 * Creates test storylets with clue discovery effects for testing arc functionality
 */
export function createTestArcClueStorylets() {
  const catalogStore = useStoryletCatalogStore.getState();
  const clueStore = useClueStore.getState();

  // Create test clues first
  const testClueData = [
    {
      id: 'memory_test_clue',
      title: 'Memory Test Evidence',
      description: 'A collection of memory-related evidence requiring careful analysis.',
      content: 'This evidence contains patterns that need to be memorized and recalled to unlock its secrets.',
      category: 'mystery' as const,
      difficulty: 'medium' as const,
      storyArc: 'Main Story',
      arcOrder: 1,
      minigameTypes: ['memory-cards'],
      associatedStorylets: ['main_story_memory_investigation'],
      tags: ['memory', 'test', 'evidence'],
      rarity: 'uncommon' as const
    },
    {
      id: 'path_puzzle_clue',
      title: 'Path Planning Puzzle',
      description: 'A complex route-finding challenge that reveals hidden information.',
      content: 'Navigate through this intricate path to discover what lies at the end.',
      category: 'mystery' as const,
      difficulty: 'hard' as const,
      storyArc: 'Main Story',
      arcOrder: 2,
      minigameTypes: ['path-planner'],
      associatedStorylets: ['main_story_path_challenge'],
      tags: ['path', 'puzzle', 'navigation'],
      rarity: 'rare' as const
    },
    {
      id: 'word_mystery_clue',
      title: 'Scrambled Message',
      description: 'An encrypted message that needs to be unscrambled.',
      content: 'The words are all mixed up, but they contain an important message.',
      category: 'mystery' as const,
      difficulty: 'easy' as const,
      storyArc: 'Main Story',
      arcOrder: 3,
      minigameTypes: ['word-scramble'],
      associatedStorylets: ['main_story_word_puzzle'],
      tags: ['word', 'message', 'encrypted'],
      rarity: 'common' as const
    }
  ];

  // Add clues to store using createClue method
  const createdClues = testClueData.map(clueData => {
    return clueStore.createClue(clueData);
  });

  // Create test storylets with clue discovery effects
  const testStorylets: Storylet[] = [
    {
      id: 'main_story_memory_investigation',
      name: 'Memory Investigation',
      description: 'You discover some evidence that requires careful memory analysis to understand.',
      trigger: {
        type: 'time',
        conditions: { day: 1 }
      },
      choices: [
        {
          id: 'analyze_evidence',
          text: 'Carefully analyze the evidence using memory techniques',
          effects: [
            {
              type: 'clueDiscovery',
              clueId: 'memory_test_clue',
              minigameType: 'memory-cards',
              onSuccess: [
                { type: 'resource', key: 'knowledge', delta: 15 },
                { type: 'flag', key: 'memory_evidence_found', value: true }
              ],
              onFailure: [
                { type: 'resource', key: 'stress', delta: 10 },
                { type: 'flag', key: 'memory_investigation_failed', value: true }
              ]
            }
          ]
        },
        {
          id: 'skip_analysis',
          text: 'Leave the evidence for later',
          effects: [
            { type: 'resource', key: 'energy', delta: 5 }
          ]
        }
      ],
      storyArc: 'Main Story'
    },
    {
      id: 'main_story_path_challenge',
      name: 'Navigation Challenge',
      description: 'A complex route through campus reveals hidden secrets.',
      trigger: {
        type: 'flag',
        conditions: { flags: ['memory_evidence_found'] }
      },
      choices: [
        {
          id: 'solve_path',
          text: 'Navigate the complex route to uncover secrets',
          effects: [
            {
              type: 'clueDiscovery',
              clueId: 'path_puzzle_clue',
              minigameType: 'path-planner',
              onSuccess: [
                { type: 'resource', key: 'knowledge', delta: 20 },
                { type: 'resource', key: 'social', delta: 10 },
                { type: 'flag', key: 'path_secrets_unlocked', value: true }
              ],
              onFailure: [
                { type: 'resource', key: 'energy', delta: -15 },
                { type: 'resource', key: 'stress', delta: 8 }
              ]
            }
          ]
        }
      ],
      storyArc: 'Main Story'
    },
    {
      id: 'main_story_word_puzzle',
      name: 'Encrypted Message Discovery',
      description: 'You find a scrambled message that might contain important information.',
      trigger: {
        type: 'resource',
        conditions: { knowledge: { min: 25 } }
      },
      choices: [
        {
          id: 'decode_message',
          text: 'Attempt to decode the scrambled message',
          effects: [
            {
              type: 'clueDiscovery',
              clueId: 'word_mystery_clue',
              minigameType: 'word-scramble',
              onSuccess: [
                { type: 'resource', key: 'knowledge', delta: 25 },
                { type: 'flag', key: 'message_decoded', value: true },
                { type: 'unlock', storyletId: 'main_story_final_revelation' }
              ],
              onFailure: [
                { type: 'resource', key: 'stress', delta: 5 }
              ]
            }
          ]
        },
        {
          id: 'ignore_message',
          text: 'The message looks too complicated to decode',
          effects: [
            { type: 'resource', key: 'energy', delta: 3 }
          ]
        }
      ],
      storyArc: 'Main Story'
    },
    {
      id: 'main_story_final_revelation',
      name: 'The Final Revelation',
      description: 'All your clue discoveries have led to this moment of truth.',
      trigger: {
        type: 'flag',
        conditions: { flags: ['message_decoded'] }
      },
      choices: [
        {
          id: 'complete_investigation',
          text: 'Piece together all the evidence',
          effects: [
            { type: 'resource', key: 'knowledge', delta: 50 },
            { type: 'flag', key: 'investigation_complete', value: true }
          ]
        }
      ],
      storyArc: 'Main Story'
    }
  ];

  // Add storylets to catalog
  testStorylets.forEach(storylet => {
    catalogStore.addStorylet(storylet);
  });

  console.log('🧪 Created test storylets with clue discovery effects for Main Story arc:');
  console.log('- Memory Investigation (memory-cards minigame)');
  console.log('- Navigation Challenge (path-planner minigame)'); 
  console.log('- Encrypted Message Discovery (word-scramble minigame)');
  console.log('- The Final Revelation (completion storylet)');
  console.log('');
  console.log('🎯 To test: Start arc testing for "Main Story" and look for these storylets');
  console.log('📝 Created clues:', createdClues.map(c => c.id));

  return { clues: createdClues, storylets: testStorylets };
}

// Function to remove test data
export function removeTestArcClueStorylets() {
  const catalogStore = useStoryletCatalogStore.getState();
  const clueStore = useClueStore.getState();

  const testStoryletIds = [
    'main_story_memory_investigation',
    'main_story_path_challenge', 
    'main_story_word_puzzle',
    'main_story_final_revelation'
  ];

  const testClueIds = [
    'memory_test_clue',
    'path_puzzle_clue',
    'word_mystery_clue'
  ];

  testStoryletIds.forEach(id => {
    catalogStore.deleteStorylet(id);
  });

  testClueIds.forEach(id => {
    clueStore.deleteClue(id);
  });

  console.log('🧹 Removed test storylets and clues for arc testing');
}