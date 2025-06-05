import type { Storylet } from '../types/storylet';

export const testEditMinigameStorylet: Storylet = {
  id: 'test_edit_minigame',
  name: 'Edit Test: Brain Challenge',
  trigger: {
    type: 'time',
    conditions: { day: 2 }
  },
  description: 'A test storylet for editing minigame effects. This storylet contains both regular effects and minigame effects to test the editing functionality.',
  choices: [
    {
      id: 'take_memory_test',
      text: 'Take the memory test',
      effects: [
        {
          type: 'minigame',
          gameId: 'memory-cards',
          onSuccess: [
            { type: 'resource', key: 'knowledge', delta: 20 },
            { type: 'skillXp', key: 'observation', amount: 15 }
          ],
          onFailure: [
            { type: 'resource', key: 'stress', delta: 5 }
          ]
        }
      ]
    },
    {
      id: 'regular_choice',
      text: 'Just study normally',
      effects: [
        { type: 'resource', key: 'knowledge', delta: 10 },
        { type: 'resource', key: 'energy', delta: -5 }
      ]
    },
    {
      id: 'combined_choice',
      text: 'Study and then play a brain game',
      effects: [
        { type: 'resource', key: 'knowledge', delta: 5 },
        {
          type: 'minigame',
          gameId: 'pattern-sequence',
          onSuccess: [
            { type: 'resource', key: 'knowledge', delta: 15 },
            { type: 'flag', key: 'pattern_master', value: true }
          ],
          onFailure: [
            { type: 'resource', key: 'knowledge', delta: 3 }
          ]
        }
      ]
    }
  ]
};