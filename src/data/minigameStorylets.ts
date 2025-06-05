import type { Storylet } from '../types/storylet';
import { testEditMinigameStorylet } from './testEditMinigame';

export const minigameStorylets: Record<string, Storylet> = {
  [testEditMinigameStorylet.id]: testEditMinigameStorylet,
  memory_game_test: {
    id: 'memory_game_test',
    name: 'Memory Challenge',
    trigger: {
      type: 'time',
      conditions: { day: 1 }
    },
    description: 'A mysterious figure approaches you with a deck of cards. "Let\'s test your memory," they say with a grin. "Match the pairs, and I\'ll reward you handsomely."',
    choices: [
      {
        id: 'accept_challenge',
        text: 'Accept the memory challenge',
        effects: [
          {
            type: 'minigame',
            gameId: 'memory-cards',
            onSuccess: [
              { type: 'resource', key: 'knowledge', delta: 15 },
              { type: 'resource', key: 'money', delta: 25 },
              { type: 'flag', key: 'memory_master', value: true }
            ],
            onFailure: [
              { type: 'resource', key: 'stress', delta: 10 },
              { type: 'resource', key: 'knowledge', delta: 5 }
            ]
          }
        ]
      },
      {
        id: 'decline_challenge',
        text: 'Politely decline',
        effects: [
          { type: 'resource', key: 'social', delta: -5 },
          { type: 'flag', key: 'missed_memory_challenge', value: true }
        ]
      }
    ]
  },
  
  brain_training_session: {
    id: 'brain_training_session',
    name: 'Brain Training Session',
    trigger: {
      type: 'flag',
      conditions: { flags: ['memory_master'] }
    },
    description: 'Your reputation as a memory master has spread. A cognitive scientist offers you a chance to participate in various brain training exercises for research.',
    choices: [
      {
        id: 'memory_cards',
        text: 'Play Memory Cards',
        effects: [
          {
            type: 'minigame',
            gameId: 'memory-cards',
            onSuccess: [
              { type: 'resource', key: 'knowledge', delta: 10 },
              { type: 'skillXp', key: 'observation', amount: 25 }
            ],
            onFailure: [
              { type: 'resource', key: 'knowledge', delta: 3 }
            ]
          }
        ]
      },
      {
        id: 'word_scramble',
        text: 'Try Word Scramble Challenge',
        effects: [
          {
            type: 'minigame',
            gameId: 'word-scramble',
            onSuccess: [
              { type: 'resource', key: 'knowledge', delta: 15 },
              { type: 'skillXp', key: 'linguistics', amount: 20 },
              { type: 'flag', key: 'word_master', value: true }
            ],
            onFailure: [
              { type: 'resource', key: 'knowledge', delta: 5 },
              { type: 'resource', key: 'stress', delta: 3 }
            ]
          }
        ]
      },
      {
        id: 'pattern_sequence',
        text: 'Try Pattern Sequence (Demo)',
        effects: [
          {
            type: 'minigame',
            gameId: 'pattern-sequence',
            onSuccess: [
              { type: 'resource', key: 'knowledge', delta: 12 },
              { type: 'skillXp', key: 'research', amount: 20 }
            ],
            onFailure: [
              { type: 'resource', key: 'stress', delta: 5 }
            ]
          }
        ]
      },
      {
        id: 'color_match',
        text: 'Try Color Vision Test',
        effects: [
          {
            type: 'minigame',
            gameId: 'color-match',
            onSuccess: [
              { type: 'resource', key: 'knowledge', delta: 12 },
              { type: 'skillXp', key: 'observation', amount: 25 },
              { type: 'flag', key: 'color_vision_expert', value: true }
            ],
            onFailure: [
              { type: 'resource', key: 'knowledge', delta: 4 },
              { type: 'resource', key: 'stress', delta: 5 }
            ]
          }
        ]
      },
      {
        id: 'stroop_test',
        text: 'Take Stroop Interference Test',
        effects: [
          {
            type: 'minigame',
            gameId: 'stroop-test',
            onSuccess: [
              { type: 'resource', key: 'knowledge', delta: 18 },
              { type: 'skillXp', key: 'observation', amount: 30 },
              { type: 'skillXp', key: 'perseverance', amount: 15 },
              { type: 'flag', key: 'cognitive_control_master', value: true }
            ],
            onFailure: [
              { type: 'resource', key: 'knowledge', delta: 6 },
              { type: 'resource', key: 'stress', delta: 8 },
              { type: 'skillXp', key: 'perseverance', amount: 5 }
            ]
          }
        ]
      },
      {
        id: 'math_quiz',
        text: 'Take Math Quiz (Demo)',
        effects: [
          {
            type: 'minigame',
            gameId: 'math-quiz',
            onSuccess: [
              { type: 'resource', key: 'knowledge', delta: 20 },
              { type: 'skillXp', key: 'research', amount: 30 }
            ],
            onFailure: [
              { type: 'resource', key: 'stress', delta: 8 }
            ]
          }
        ]
      },
      {
        id: 'skip_training',
        text: 'Not interested today',
        effects: [
          { type: 'resource', key: 'energy', delta: 5 }
        ]
      }
    ]
  },

  word_scramble_scholar: {
    id: 'word_scramble_scholar',
    name: 'The Linguistic Scholar',
    trigger: {
      type: 'time',
      conditions: { day: 3 }
    },
    description: 'A renowned linguistic scholar approaches you in the library. "I have observed your academic pursuits," she says, pulling out a scroll of scrambled words. "These are ancient terms related to scholarship and medieval life. Can you decipher them all?"',
    choices: [
      {
        id: 'accept_word_challenge',
        text: 'Accept the word scramble challenge',
        effects: [
          {
            type: 'minigame',
            gameId: 'word-scramble',
            onSuccess: [
              { type: 'resource', key: 'knowledge', delta: 25 },
              { type: 'resource', key: 'social', delta: 10 },
              { type: 'skillXp', key: 'linguistics', amount: 30 },
              { type: 'flag', key: 'scholar_approved', value: true }
            ],
            onFailure: [
              { type: 'resource', key: 'knowledge', delta: 8 },
              { type: 'resource', key: 'stress', delta: 5 },
              { type: 'flag', key: 'tried_word_challenge', value: true }
            ]
          }
        ]
      },
      {
        id: 'request_easier_challenge',
        text: 'Ask for an easier version',
        effects: [
          { type: 'resource', key: 'social', delta: -3 },
          { type: 'resource', key: 'knowledge', delta: 5 },
          { type: 'flag', key: 'requested_easier_words', value: true }
        ]
      },
      {
        id: 'decline_politely',
        text: 'Politely decline the challenge',
        effects: [
          { type: 'resource', key: 'social', delta: -5 },
          { type: 'resource', key: 'energy', delta: 3 }
        ]
      }
    ]
  },

  color_vision_lab: {
    id: 'color_vision_lab',
    name: 'The Color Vision Laboratory',
    trigger: {
      type: 'time',
      conditions: { day: 5 }
    },
    description: 'A cognitive psychology researcher approaches you with a tablet displaying colorful patterns. "We\'re studying color perception and visual processing," she explains. "This test will evaluate your ability to quickly identify and match colors under time pressure. Interested in contributing to science?"',
    choices: [
      {
        id: 'accept_color_test',
        text: 'Accept the color vision challenge',
        effects: [
          {
            type: 'minigame',
            gameId: 'color-match',
            onSuccess: [
              { type: 'resource', key: 'knowledge', delta: 20 },
              { type: 'resource', key: 'social', delta: 8 },
              { type: 'skillXp', key: 'observation', amount: 35 },
              { type: 'flag', key: 'color_researcher_approved', value: true }
            ],
            onFailure: [
              { type: 'resource', key: 'knowledge', delta: 10 },
              { type: 'resource', key: 'stress', delta: 8 },
              { type: 'flag', key: 'tried_color_vision_test', value: true }
            ]
          }
        ]
      },
      {
        id: 'ask_about_research',
        text: 'Ask more about the research first',
        effects: [
          { type: 'resource', key: 'knowledge', delta: 8 },
          { type: 'resource', key: 'social', delta: 5 },
          { type: 'flag', key: 'learned_about_color_research', value: true }
        ]
      },
      {
        id: 'decline_color_test',
        text: 'Politely decline the test',
        effects: [
          { type: 'resource', key: 'social', delta: -3 },
          { type: 'resource', key: 'energy', delta: 2 }
        ]
      }
    ]
  },

  cognitive_psychology_lab: {
    id: 'cognitive_psychology_lab',
    name: 'The Cognitive Psychology Laboratory',
    trigger: {
      type: 'time',
      conditions: { day: 7 }
    },
    description: 'A psychology professor approaches you with a tablet displaying colored words. "We\'re conducting research on cognitive interference and executive function," she explains. "The Stroop test measures your ability to suppress automatic responses. It\'s quite challenging - are you ready to test your mental flexibility?"',
    choices: [
      {
        id: 'accept_stroop_test',
        text: 'Accept the Stroop interference challenge',
        effects: [
          {
            type: 'minigame',
            gameId: 'stroop-test',
            onSuccess: [
              { type: 'resource', key: 'knowledge', delta: 25 },
              { type: 'resource', key: 'social', delta: 12 },
              { type: 'skillXp', key: 'observation', amount: 40 },
              { type: 'skillXp', key: 'perseverance', amount: 25 },
              { type: 'flag', key: 'psychology_lab_champion', value: true }
            ],
            onFailure: [
              { type: 'resource', key: 'knowledge', delta: 12 },
              { type: 'resource', key: 'stress', delta: 10 },
              { type: 'skillXp', key: 'perseverance', amount: 10 },
              { type: 'flag', key: 'attempted_stroop_test', value: true }
            ]
          }
        ]
      },
      {
        id: 'ask_about_stroop',
        text: 'Ask about the Stroop effect first',
        effects: [
          { type: 'resource', key: 'knowledge', delta: 15 },
          { type: 'resource', key: 'social', delta: 8 },
          { type: 'flag', key: 'learned_about_stroop_effect', value: true }
        ]
      },
      {
        id: 'decline_stroop_test',
        text: 'Politely decline the test',
        effects: [
          { type: 'resource', key: 'social', delta: -4 },
          { type: 'resource', key: 'energy', delta: 3 }
        ]
      }
    ]
  }
};