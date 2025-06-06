// Starting Arc Storylets - Based on MMV Twine Story
// The mysterious dining hall encounter that begins the journey

import type { Storylet } from '../types/storylet';

export const startingStorylets: Record<string, Storylet> = {
  // 1. Enter - The initial dining hall encounter
  dining_hall_enter: {
    id: 'dining_hall_enter',
    name: 'Enter the Dining Hall',
    description: 'You enter the dining hall and look around. There is another student who is sitting with two bowls of Fruit Loops in front of him.',
    deploymentStatus: 'live',
    storyArc: 'Starting',
    trigger: {
      type: 'time',
      conditions: { day: 1 } // Trigger on first day (app starts with day: 1)
    },
    choices: [
      {
        id: 'walk_over',
        text: 'Walk over to the student',
        effects: [
          {
            type: 'flag',
            key: 'metMysteriousStudent',
            value: true
          },
          {
            type: 'resource',
            key: 'social',
            delta: 5
          }
        ]
      },
      {
        id: 'ignore_student',
        text: 'Find another table and eat alone',
        effects: [
          {
            type: 'resource',
            key: 'energy',
            delta: 10
          },
          {
            type: 'resource',
            key: 'stress',
            delta: -5
          }
        ]
      }
    ]
  },

  // 2. Intro - Meeting the mysterious stranger
  dining_hall_intro: {
    id: 'dining_hall_intro',
    name: 'The Fruit Loops Stranger',
    description: '"Hi, that seems like a lot of Fruit Loops." He smiles and pushes a bowl towards you. "Try these before the health nuts take all the flavor out of them. They are even better than you remember them."',
    deploymentStatus: 'live',
    storyArc: 'Starting',
    trigger: {
      type: 'flag',
      conditions: { flags: ['metMysteriousStudent'] }
    },
    choices: [
      {
        id: 'question_knowledge',
        text: "I don't know you, how do you know what I remember?",
        effects: [
          {
            type: 'flag',
            key: 'questionedStranger',
            value: true
          },
          {
            type: 'resource',
            key: 'knowledge',
            delta: 5
          }
        ]
      },
      {
        id: 'ask_about_tape',
        text: 'Thanks, are you the one who sent the mix tape?',
        effects: [
          {
            type: 'flag',
            key: 'askedAboutTape',
            value: true
          },
          {
            type: 'resource',
            key: 'social',
            delta: 8
          }
        ]
      }
    ]
  },

  // 3. Don't Know Path - Questioning the stranger's knowledge
  stranger_dont_know: {
    id: 'stranger_dont_know',
    name: 'Déjà Vu',
    description: 'You feel like you have seen this before but not quite right? You shrug. "I can only tell you a bit but do you remember being older - like much older?" you say.',
    deploymentStatus: 'live',
    storyArc: 'Starting',
    trigger: {
      type: 'flag',
      conditions: { flags: ['questionedStranger'] }
    },
    choices: [
      {
        id: 'remember_kids',
        text: 'I seem to remember having kids',
        effects: [
          {
            type: 'flag',
            key: 'remembersKids',
            value: true
          },
          {
            type: 'resource',
            key: 'stress',
            delta: 10
          }
        ]
      },
      {
        id: 'demand_proof',
        text: 'Maybe but what do you really mean?',
        effects: [
          {
            type: 'flag',
            key: 'demandedProof',
            value: true
          },
          {
            type: 'resource',
            key: 'knowledge',
            delta: 8
          }
        ]
      }
    ]
  },

  // 4. Tape Path - Following the mix tape lead
  stranger_tape: {
    id: 'stranger_tape',
    name: 'The Mix Tape Mystery',
    description: 'He says "I did not put it in your room but I know about it, you recognize some of the songs don\'t you?" You say "Yeah all of them but..."',
    deploymentStatus: 'live',
    storyArc: 'Starting',
    trigger: {
      type: 'flag',
      conditions: { flags: ['askedAboutTape'] }
    },
    choices: [
      {
        id: 'time_revelation',
        text: 'Let me tell you a funny thing about time',
        effects: [
          {
            type: 'flag',
            key: 'readyForTimeRevelation',
            value: true
          },
          {
            type: 'resource',
            key: 'knowledge',
            delta: 15
          }
        ]
      }
    ]
  },

  // 5. Kids Path - Memory of having children
  stranger_kids: {
    id: 'stranger_kids',
    name: 'Strange Memories',
    description: '"Yes but how do you know? I feel kind of strange." He says "Sit down and let me tell you a story."',
    deploymentStatus: 'live',
    storyArc: 'Starting',
    trigger: {
      type: 'flag',
      conditions: { flags: ['remembersKids'] }
    },
    choices: [
      {
        id: 'listen_to_story',
        text: 'Time is a funny thing',
        effects: [
          {
            type: 'flag',
            key: 'readyForTimeRevelation',
            value: true
          },
          {
            type: 'resource',
            key: 'stress',
            delta: 5
          }
        ]
      }
    ]
  },

  // 6. Prove Path - The stranger demonstrates impossible knowledge
  stranger_prove: {
    id: 'stranger_prove',
    name: 'Impossible Knowledge',
    description: 'He says "You have $6 in your pocket." You do but... how could he possibly know that?',
    deploymentStatus: 'live',
    storyArc: 'Starting',
    trigger: {
      type: 'flag',
      conditions: { flags: ['demandedProof'] }
    },
    choices: [
      {
        id: 'accept_story',
        text: 'Sit down and let me tell you about a funny thing...',
        effects: [
          {
            type: 'flag',
            key: 'readyForTimeRevelation',
            value: true
          },
          {
            type: 'resource',
            key: 'stress',
            delta: 15
          }
        ]
      }
    ]
  },

  // 7. Time Revelation - The climactic explanation (completing the incomplete Twine passage)
  time_revelation: {
    id: 'time_revelation',
    name: 'The Truth About Time',
    description: 'He leans forward, his eyes taking on an otherworldly intensity. "Time isn\'t linear like they teach you. You\'ve lived this life before - many times. Each loop, you remember a little more. The songs on that tape? They\'re from your real timeline. The memories of having kids? That was three loops ago. The $6 in your pocket? You always keep exactly that amount, even though you don\'t remember why." He pauses, studying your face. "This college, this \'first\' day - it\'s your chance to break the cycle. But only if you choose differently this time."',
    deploymentStatus: 'live',
    storyArc: 'Starting',
    trigger: {
      type: 'flag',
      conditions: { flags: ['readyForTimeRevelation'] }
    },
    choices: [
      {
        id: 'break_cycle',
        text: 'How do I break the cycle?',
        effects: [
          {
            type: 'flag',
            key: 'timeLoopRevealed',
            value: true
          },
          {
            type: 'flag',
            key: 'chosenToBreakCycle',
            value: true
          },
          {
            type: 'resource',
            key: 'knowledge',
            delta: 25
          },
          {
            type: 'resource',
            key: 'stress',
            delta: 20
          },
        ]
      },
      {
        id: 'reject_truth',
        text: 'This is insane. I need to get out of here.',
        effects: [
          {
            type: 'flag',
            key: 'timeLoopRevealed',
            value: true
          },
          {
            type: 'flag',
            key: 'rejectedTruth',
            value: true
          },
          {
            type: 'resource',
            key: 'stress',
            delta: -10
          },
          {
            type: 'resource',
            key: 'energy',
            delta: 10
          }
        ]
      },
      {
        id: 'want_to_remember',
        text: 'Help me remember more',
        effects: [
          {
            type: 'flag',
            key: 'timeLoopRevealed',
            value: true
          },
          {
            type: 'flag',
            key: 'seekingMemories',
            value: true
          },
          {
            type: 'resource',
            key: 'knowledge',
            delta: 20
          },
          {
            type: 'resource',
            key: 'stress',
            delta: 15
          }
        ]
      }
    ]
  },

  // 8. True Beginning - What happens after the revelation
  college_true_beginning: {
    id: 'college_true_beginning',
    name: 'A New Path Forward',
    description: 'The stranger nods approvingly. "Good. The first step is awareness. Now, instead of following the same patterns, you need to make different choices. Take different classes, talk to different people, pursue knowledge they don\'t want you to have." He stands up, leaving his untouched bowl of cereal. "I\'ll be around when you need guidance, but this journey has to be yours. Remember - every choice matters now."',
    deploymentStatus: 'live',
    storyArc: 'Starting',
    trigger: {
      type: 'flag',
      conditions: { flags: ['chosenToBreakCycle'] }
    },
    choices: [
      {
        id: 'embrace_destiny',
        text: 'I understand. I\'ll find my own way.',
        effects: [
          {
            type: 'flag',
            key: 'startingArcComplete',
            value: true
          },
          {
            type: 'flag',
            key: 'freeWillActivated',
            value: true
          },
          {
            type: 'resource',
            key: 'knowledge',
            delta: 10
          },
          {
            type: 'resource',
            key: 'social',
            delta: 5
          }
        ]
      }
    ]
  }
};