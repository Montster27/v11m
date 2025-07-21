// Test Data Generators
// Utilities for generating realistic test data for various game scenarios

import type { Storylet } from '../../types/storylet'

// Simplified faker-like utilities (to avoid external dependencies for now)
const simpleRandom = {
  arrayElement: <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)],
  number: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
  boolean: () => Math.random() > 0.5,
  string: (length: number = 8) => Math.random().toString(36).substring(2, length + 2),
  sentence: () => {
    const words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and', 'runs', 'fast', 'through', 'forest']
    const length = simpleRandom.number(3, 8)
    return Array.from({ length }, () => simpleRandom.arrayElement(words)).join(' ') + '.'
  },
  paragraph: () => {
    const sentences = simpleRandom.number(2, 5)
    return Array.from({ length: sentences }, () => simpleRandom.sentence()).join(' ')
  },
  name: () => {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn', 'Cameron', 'Dakota']
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas']
    return `${simpleRandom.arrayElement(firstNames)} ${simpleRandom.arrayElement(lastNames)}`
  }
}

/**
 * Generate a test character with realistic data
 */
export const generateTestCharacter = (overrides = {}) => {
  const backgrounds = ['academic', 'working', 'military', 'artistic', 'athletic']
  const tracks = ['college', 'trade', 'service', 'entrepreneurship', 'research']
  
  return {
    id: `char_${Date.now()}_${simpleRandom.string(4)}`,
    name: simpleRandom.name(),
    background: simpleRandom.arrayElement(backgrounds),
    track: simpleRandom.arrayElement(tracks),
    concerns: {
      academics: simpleRandom.number(0, 50),
      socialFitting: simpleRandom.number(0, 50),
      financial: simpleRandom.number(0, 50),
      isolation: simpleRandom.number(0, 30),
      genderIssues: simpleRandom.number(0, 25),
      raceIssues: simpleRandom.number(0, 25),
      classIssues: simpleRandom.number(0, 25)
    },
    traits: Array.from({ length: simpleRandom.number(2, 5) }, () => 
      simpleRandom.arrayElement(['studious', 'social', 'creative', 'analytical', 'outgoing', 'reserved', 'ambitious'])
    ),
    ...overrides
  }
}

/**
 * Generate a test storylet with varied content
 */
export const generateTestStorylet = (overrides = {}): Storylet => {
  const triggerTypes = ['time', 'flag', 'resource']
  const categories = ['academic', 'social', 'personal', 'career', 'crisis', 'opportunity']
  const deployments = ['dev', 'stage', 'live']
  
  const triggerType = simpleRandom.arrayElement(triggerTypes)
  let trigger: any
  
  switch (triggerType) {
    case 'time':
      trigger = {
        type: 'time',
        conditions: { day: simpleRandom.number(1, 100) }
      }
      break
    case 'flag':
      trigger = {
        type: 'flag',
        conditions: { 
          flags: Array.from({ length: simpleRandom.number(1, 3) }, () => 
            `flag_${simpleRandom.string(6)}`
          )
        }
      }
      break
    case 'resource':
      trigger = {
        type: 'resource',
        conditions: {
          resources: {
            knowledge: simpleRandom.number(50, 500),
            social: simpleRandom.number(50, 400)
          }
        }
      }
      break
    default:
      trigger = { type: 'flag', conditions: { flags: ['default_flag'] } }
  }
  
  const choiceCount = simpleRandom.number(2, 4)
  const choices = Array.from({ length: choiceCount }, (_, i) => ({
    id: `choice_${i + 1}`,
    text: simpleRandom.sentence(),
    effects: Array.from({ length: simpleRandom.number(1, 3) }, () => {
      const effectType = simpleRandom.arrayElement(['resource', 'flag', 'unlock_storylet'])
      
      switch (effectType) {
        case 'resource':
          return {
            type: 'resource',
            key: simpleRandom.arrayElement(['energy', 'stress', 'money', 'knowledge', 'social']),
            delta: simpleRandom.number(-20, 30)
          }
        case 'flag':
          return {
            type: 'flag',
            key: `generated_flag_${simpleRandom.string(4)}`,
            value: simpleRandom.boolean()
          }
        case 'unlock_storylet':
          return {
            type: 'unlock_storylet',
            storyletId: `unlock_${simpleRandom.string(6)}`
          }
        default:
          return {
            type: 'flag',
            key: 'default_flag',
            value: true
          }
      }
    })
  }))
  
  return {
    id: `storylet_${Date.now()}_${simpleRandom.string(6)}`,
    name: simpleRandom.sentence().replace('.', ''),
    description: simpleRandom.paragraph(),
    trigger,
    choices,
    metadata: {
      deployment: simpleRandom.arrayElement(deployments),
      createdAt: new Date().toISOString(),
      category: simpleRandom.arrayElement(categories),
      estimatedDuration: simpleRandom.number(60, 300) // seconds
    },
    cooldown: simpleRandom.boolean() ? simpleRandom.number(1, 7) : undefined,
    storyArc: simpleRandom.boolean() ? `arc_${simpleRandom.string(4)}` : undefined,
    ...overrides
  }
}

/**
 * Generate a complete game scenario with related data
 */
export const generateGameScenario = (scenarioType: 'tutorial' | 'early' | 'mid' | 'late' | 'crisis' = 'early') => {
  const character = generateTestCharacter()
  
  let gameState: any
  let storyletCount: number
  let storyletOverrides: any = {}
  
  switch (scenarioType) {
    case 'tutorial':
      gameState = {
        day: simpleRandom.number(1, 3),
        resources: {
          energy: simpleRandom.number(90, 100),
          stress: simpleRandom.number(0, 10),
          money: simpleRandom.number(10, 30),
          knowledge: simpleRandom.number(80, 120),
          social: simpleRandom.number(100, 150)
        }
      }
      storyletCount = simpleRandom.number(3, 6)
      storyletOverrides = {
        metadata: { category: 'tutorial' },
        trigger: { type: 'time', conditions: { day: simpleRandom.number(1, 3) } }
      }
      break
      
    case 'early':
      gameState = {
        day: simpleRandom.number(5, 20),
        resources: {
          energy: simpleRandom.number(60, 90),
          stress: simpleRandom.number(10, 30),
          money: simpleRandom.number(20, 100),
          knowledge: simpleRandom.number(100, 200),
          social: simpleRandom.number(150, 250)
        }
      }
      storyletCount = simpleRandom.number(8, 15)
      break
      
    case 'mid':
      gameState = {
        day: simpleRandom.number(25, 60),
        resources: {
          energy: simpleRandom.number(50, 80),
          stress: simpleRandom.number(20, 50),
          money: simpleRandom.number(100, 500),
          knowledge: simpleRandom.number(250, 600),
          social: simpleRandom.number(200, 400)
        }
      }
      storyletCount = simpleRandom.number(15, 25)
      break
      
    case 'late':
      gameState = {
        day: simpleRandom.number(70, 100),
        resources: {
          energy: simpleRandom.number(40, 70),
          stress: simpleRandom.number(30, 60),
          money: simpleRandom.number(500, 2000),
          knowledge: simpleRandom.number(600, 1000),
          social: simpleRandom.number(300, 600)
        }
      }
      storyletCount = simpleRandom.number(20, 35)
      break
      
    case 'crisis':
      gameState = {
        day: simpleRandom.number(30, 80),
        resources: {
          energy: simpleRandom.number(10, 40),
          stress: simpleRandom.number(60, 90),
          money: simpleRandom.number(0, 50),
          knowledge: simpleRandom.number(200, 400),
          social: simpleRandom.number(50, 200)
        }
      }
      storyletCount = simpleRandom.number(5, 12)
      storyletOverrides = {
        metadata: { category: 'crisis' }
      }
      break
      
    default:
      gameState = {
        day: simpleRandom.number(1, 100),
        resources: {
          energy: simpleRandom.number(0, 100),
          stress: simpleRandom.number(0, 100),
          money: simpleRandom.number(0, 1000),
          knowledge: simpleRandom.number(0, 1000),
          social: simpleRandom.number(0, 500)
        }
      }
      storyletCount = simpleRandom.number(5, 20)
  }
  
  const storylets = Array.from({ length: storyletCount }, () => 
    generateTestStorylet(storyletOverrides)
  )
  
  // Generate some flags based on scenario
  const flags: Record<string, boolean> = {}
  const flagCount = simpleRandom.number(3, 10)
  for (let i = 0; i < flagCount; i++) {
    flags[`${scenarioType}_flag_${i}`] = simpleRandom.boolean()
  }
  
  return {
    character,
    storylets,
    gameState: {
      ...gameState,
      activeCharacter: character,
      flags
    },
    metadata: {
      scenarioType,
      generatedAt: new Date().toISOString(),
      storyletCount,
      expectedDifficulty: scenarioType === 'crisis' ? 'high' : 
                          scenarioType === 'late' ? 'medium-high' :
                          scenarioType === 'mid' ? 'medium' : 'low'
    }
  }
}

/**
 * Generate test data for specific testing needs
 */
export const generateSpecificTestData = {
  // Generate storylets for performance testing
  performanceStorylets: (count: number = 1000) => {
    return Array.from({ length: count }, (_, i) => 
      generateTestStorylet({
        id: `perf_storylet_${i}`,
        name: `Performance Test ${i}`,
        trigger: {
          type: 'flag',
          conditions: { flags: [`perf_flag_${i % 10}`] }
        }
      })
    )
  },
  
  // Generate linked storylets (for testing story arcs)
  linkedStorylets: (arcName: string, count: number = 5) => {
    return Array.from({ length: count }, (_, i) => 
      generateTestStorylet({
        id: `${arcName}_part_${i + 1}`,
        name: `${arcName} - Part ${i + 1}`,
        storyArc: arcName,
        trigger: i === 0 ? 
          { type: 'time', conditions: { day: 1 } } :
          { type: 'flag', conditions: { flags: [`completed_${arcName}_part_${i}`] } }
      })
    )
  },
  
  // Generate edge case data
  edgeCaseData: () => ({
    emptyStrings: generateTestStorylet({
      name: '',
      description: ''
    }),
    longContent: generateTestStorylet({
      name: 'A'.repeat(1000),
      description: 'B'.repeat(5000)
    }),
    specialCharacters: generateTestStorylet({
      name: '🎮 Test with emojis & symbols: @#$%^&*()',
      description: 'Testing unicode: ñ, é, 中文, русский, العربية'
    }),
    nullValues: {
      ...generateTestStorylet(),
      cooldown: null,
      storyArc: null
    }
  }),
  
  // Generate data for migration testing
  v1FormatData: () => ({
    // Old format character data
    oldCharacter: {
      name: 'Legacy Character',
      skills: {
        academic: simpleRandom.number(0, 100),
        social: simpleRandom.number(0, 100)
      },
      money: simpleRandom.number(0, 1000),
      day: simpleRandom.number(1, 100)
    },
    
    // Old format storylet data
    oldStorylets: {
      activeStorylets: Array.from({ length: 5 }, () => `old_storylet_${simpleRandom.string(4)}`),
      completedStorylets: Array.from({ length: 10 }, () => `completed_${simpleRandom.string(4)}`),
      flags: Object.fromEntries(
        Array.from({ length: 8 }, () => [`old_flag_${simpleRandom.string(3)}`, simpleRandom.boolean()])
      )
    }
  })
}

/**
 * Generate realistic NPC data
 */
export const generateTestNPC = (overrides = {}) => {
  const relationships = ['friend', 'acquaintance', 'rival', 'mentor', 'romantic_interest', 'family']
  const traits = ['helpful', 'ambitious', 'creative', 'analytical', 'outgoing', 'reserved', 'competitive']
  
  return {
    id: `npc_${Date.now()}_${simpleRandom.string(4)}`,
    name: simpleRandom.name(),
    relationship: simpleRandom.arrayElement(relationships),
    relationshipLevel: simpleRandom.number(0, 100),
    traits: Array.from({ length: simpleRandom.number(2, 4) }, () => 
      simpleRandom.arrayElement(traits)
    ),
    backstory: simpleRandom.paragraph(),
    availability: {
      days: Array.from({ length: simpleRandom.number(3, 7) }, () => 
        simpleRandom.arrayElement(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
      ),
      timeSlots: Array.from({ length: simpleRandom.number(2, 4) }, () => 
        simpleRandom.arrayElement(['morning', 'afternoon', 'evening', 'night'])
      )
    },
    ...overrides
  }
}

/**
 * Generate batch test data efficiently
 */
export const generateBatchTestData = {
  characters: (count: number) => Array.from({ length: count }, () => generateTestCharacter()),
  storylets: (count: number) => Array.from({ length: count }, () => generateTestStorylet()),
  npcs: (count: number) => Array.from({ length: count }, () => generateTestNPC()),
  scenarios: (types: Array<'tutorial' | 'early' | 'mid' | 'late' | 'crisis'>) => 
    types.map(type => generateGameScenario(type))
}