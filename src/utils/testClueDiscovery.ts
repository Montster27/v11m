// Test utility for clue discovery system
import { useClueStore } from '../store/useClueStore';
import { useStoryletStore } from '../store/useStoryletStore';

export const createTestClueAndStorylet = () => {
  const clueStore = useClueStore.getState();
  const storyletStore = useStoryletStore.getState();

  // Create a test clue
  const testClue = clueStore.createClue({
    id: 'test_clue_discovery',
    title: 'The Mysterious Note',
    description: 'A crumpled piece of paper found under a library book. Its contents might reveal important information.',
    content: 'The note reads: "Meet me at the old oak tree behind the science building at midnight. Come alone. - A Friend"\n\nThis cryptic message suggests a secret meeting. Who could this mysterious friend be? And what do they want to discuss in such a secretive manner?',
    category: 'mystery',
    difficulty: 'medium',
    storyArc: 'Test Discovery Arc',
    arcOrder: 1,
    minigameTypes: ['memory-cards', 'word-scramble', 'stroop-test', 'color-match'],
    associatedStorylets: ['test_clue_discovery_storylet'],
    tags: ['test', 'mystery', 'note'],
    rarity: 'uncommon'
  });

  // Create a test storylet that triggers clue discovery
  const testStorylet = {
    id: 'test_clue_discovery_storylet',
    name: 'Library Investigation',
    description: 'While studying in the library, you notice something unusual between the pages of a book.',
    trigger: {
      type: 'immediate' as const,
      conditions: {}
    },
    choices: [
      {
        id: 'investigate_note',
        text: 'Carefully examine the mysterious object',
        effects: [
          {
            type: 'clueDiscovery' as const,
            clueId: 'test_clue_discovery',
            minigameType: 'memory-cards',
            onSuccess: [
              { type: 'resource' as const, key: 'knowledge' as const, delta: 10 },
              { type: 'flag' as const, key: 'mysterious_note_found', value: true }
            ],
            onFailure: [
              { type: 'resource' as const, key: 'stress' as const, delta: 5 },
              { type: 'flag' as const, key: 'investigation_failed', value: true }
            ]
          }
        ]
      },
      {
        id: 'ignore',
        text: 'Ignore it and continue studying',
        effects: [
          { type: 'resource' as const, key: 'knowledge' as const, delta: 2 }
        ]
      }
    ],
    storyArc: 'Test Discovery Arc',
    deploymentStatus: 'dev' as const
  };

  // Create pre-authored follow-up storylets (these will be used instead of dynamic generation)
  const successFollowUp = {
    id: 'clue_followup_test_clue_discovery_success',
    name: 'The Mysterious Note - Discovery Successful',
    description: 'The cryptic message opens up new possibilities. You carefully consider what this revelation might mean and who this mysterious friend could be.',
    trigger: {
      type: 'flag' as const,
      conditions: { flags: ['clue_discovery_test_clue_discovery_success'] }
    },
    choices: [
      {
        id: 'investigate_further',
        text: 'Research the handwriting and paper',
        effects: [
          { type: 'resource' as const, key: 'knowledge' as const, delta: 8 },
          { type: 'flag' as const, key: 'handwriting_analysis_started', value: true }
        ]
      },
      {
        id: 'plan_meeting',
        text: 'Prepare to attend the midnight meeting',
        effects: [
          { type: 'resource' as const, key: 'stress' as const, delta: 2 },
          { type: 'flag' as const, key: 'meeting_planned', value: true }
        ]
      },
      {
        id: 'seek_advice',
        text: 'Ask a trusted friend for advice',
        effects: [
          { type: 'resource' as const, key: 'social' as const, delta: 3 },
          { type: 'flag' as const, key: 'sought_advice', value: true }
        ]
      }
    ],
    storyArc: 'Test Discovery Arc',
    deploymentStatus: 'dev' as const
  };

  const failureFollowUp = {
    id: 'clue_followup_test_clue_discovery_failure',
    name: 'The Mysterious Note - Investigation Failed',
    description: 'Your attempt to decipher the mysterious object proves fruitless. Perhaps you need a different approach or better tools.',
    trigger: {
      type: 'flag' as const,
      conditions: { flags: ['clue_discovery_test_clue_discovery_failure'] }
    },
    choices: [
      {
        id: 'get_magnifying_glass',
        text: 'Find a magnifying glass to examine it closer',
        effects: [
          { type: 'resource' as const, key: 'knowledge' as const, delta: 2 },
          { type: 'flag' as const, key: 'got_magnifying_glass', value: true }
        ]
      },
      {
        id: 'ask_librarian',
        text: 'Ask the librarian about the book',
        effects: [
          { type: 'resource' as const, key: 'social' as const, delta: 1 },
          { type: 'flag' as const, key: 'asked_librarian', value: true }
        ]
      },
      {
        id: 'try_again_later',
        text: 'Return when you feel more prepared',
        effects: [
          { type: 'resource' as const, key: 'stress' as const, delta: -1 },
          { type: 'flag' as const, key: 'will_retry_later', value: true }
        ]
      }
    ],
    storyArc: 'Test Discovery Arc',
    deploymentStatus: 'dev' as const
  };

  // Add all storylets to the system
  storyletStore.addStorylet(testStorylet);
  storyletStore.addStorylet(successFollowUp);
  storyletStore.addStorylet(failureFollowUp);
  
  // Unlock the storylet immediately for testing
  storyletStore.unlockStorylet('test_clue_discovery_storylet');
  
  console.log('✅ Test clue and storylets created!');
  console.log('📋 Clue:', testClue);
  console.log('📖 Main Storylet:', testStorylet);
  console.log('📖 Success Follow-up:', successFollowUp);
  console.log('📖 Failure Follow-up:', failureFollowUp);
  console.log('🎮 To test: Go to Planner and look for "Library Investigation" storylet');
  console.log('🔄 The follow-up storylets are pre-authored and will be used instead of dynamic generation');
  
  return { testClue, testStorylet, successFollowUp, failureFollowUp };
};

// Make it globally available for console testing
if (typeof window !== 'undefined') {
  (window as any).createTestClueAndStorylet = createTestClueAndStorylet;
  console.log('🧪 Test function available: createTestClueAndStorylet()');
}