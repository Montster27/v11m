// /Users/montysharma/V11M2/src/utils/testPathPlanner.ts
// Testing utilities for Path Planner minigame development and verification

import { PathPlannerVariant, PuzzleLevel } from '../types/pathPlanner';
import { generatePuzzle, validateMove, checkWinCondition } from './pathPlannerUtils';

// Test puzzle configurations for each variant
export const TEST_PUZZLES: Record<PathPlannerVariant, PuzzleLevel> = {
  classic: {
    variant: 'classic',
    size: { x: 6, y: 6 },
    start: { x: 0, y: 0 },
    goal: { x: 5, y: 5 },
    walls: [
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
      { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 },
      { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }
    ]
  },
  
  keyLock: {
    variant: 'keyLock',
    size: { x: 6, y: 6 },
    start: { x: 0, y: 0 },
    goal: { x: 5, y: 5 },
    walls: [
      { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }
    ],
    keys: [
      { id: 'A', position: { x: 1, y: 2 }, collected: false },
      { id: 'B', position: { x: 4, y: 1 }, collected: false }
    ],
    locks: [
      { id: 'lock-A', position: { x: 3, y: 2 }, keyId: 'A', unlocked: false },
      { id: 'lock-B', position: { x: 4, y: 4 }, keyId: 'B', unlocked: false }
    ]
  },
  
  dynamic: {
    variant: 'dynamic',
    size: { x: 6, y: 6 },
    start: { x: 0, y: 0 },
    goal: { x: 5, y: 5 },
    walls: [
      { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }
    ],
    obstacles: [
      {
        id: 'patrol-1',
        path: [
          { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 4 }, { x: 2, y: 4 }
        ],
        currentIndex: 0,
        period: 4
      },
      {
        id: 'patrol-2',
        path: [
          { x: 4, y: 1 }, { x: 4, y: 2 }
        ],
        currentIndex: 0,
        period: 2
      }
    ]
  },
  
  costOptim: {
    variant: 'costOptim',
    size: { x: 5, y: 5 },
    start: { x: 0, y: 0 },
    goal: { x: 4, y: 4 },
    walls: [
      { x: 2, y: 1 }, { x: 2, y: 2 }
    ],
    costs: [
      { position: { x: 1, y: 0 }, cost: 3 },
      { position: { x: 0, y: 1 }, cost: 1 },
      { position: { x: 1, y: 1 }, cost: 5 },
      { position: { x: 3, y: 0 }, cost: 2 },
      { position: { x: 4, y: 0 }, cost: 1 },
      { position: { x: 3, y: 1 }, cost: 1 },
      { position: { x: 4, y: 1 }, cost: 2 },
      { position: { x: 0, y: 2 }, cost: 2 },
      { position: { x: 1, y: 2 }, cost: 1 },
      { position: { x: 3, y: 2 }, cost: 4 },
      { position: { x: 4, y: 2 }, cost: 1 },
      { position: { x: 0, y: 3 }, cost: 1 },
      { position: { x: 1, y: 3 }, cost: 2 },
      { position: { x: 2, y: 3 }, cost: 3 },
      { position: { x: 3, y: 3 }, cost: 1 },
      { position: { x: 4, y: 3 }, cost: 2 },
      { position: { x: 0, y: 4 }, cost: 2 },
      { position: { x: 1, y: 4 }, cost: 1 },
      { position: { x: 2, y: 4 }, cost: 2 },
      { position: { x: 3, y: 4 }, cost: 1 }
    ],
    budget: 12
  }
};

// Test functions to be exposed globally for console testing
export function testPathPlannerVariant(variant: PathPlannerVariant): void {
  console.log(`🧪 Testing Path Planner - ${variant.toUpperCase()} variant`);
  console.log('=====================================');
  
  const puzzle = TEST_PUZZLES[variant];
  console.log('Test puzzle configuration:', puzzle);
  
  // Test move validation
  console.log('\n🔍 Testing move validation:');
  const testMoves = [
    { x: 1, y: 0 }, // Valid move right
    { x: 0, y: 1 }, // Valid move down  
    { x: -1, y: 0 }, // Invalid - out of bounds
    { x: 1, y: 1 } // May be wall depending on variant
  ];
  
  testMoves.forEach(move => {
    const result = validateMove(move, puzzle, [], [], 0);
    console.log(`Move to (${move.x}, ${move.y}):`, result);
  });
  
  // Test win condition
  console.log('\n🏆 Testing win condition:');
  const winResult = checkWinCondition(puzzle.goal, puzzle, [], 0);
  console.log('Win check at goal:', winResult);
  
  console.log(`\n✅ ${variant} variant test complete`);
}

export function testAllPathPlannerVariants(): void {
  console.log('🎮 Testing ALL Path Planner variants');
  console.log('====================================');
  
  Object.keys(TEST_PUZZLES).forEach(variant => {
    testPathPlannerVariant(variant as PathPlannerVariant);
    console.log('\n');
  });
  
  console.log('🎯 All variant tests complete!');
}

export function testPuzzleGeneration(variant: PathPlannerVariant, difficulty: 'easy' | 'medium' | 'hard'): void {
  console.log(`🏗️ Testing puzzle generation - ${variant} (${difficulty})`);
  console.log('================================================');
  
  // Generate multiple puzzles with different seeds
  const seeds = [12345, 67890, 11111];
  
  seeds.forEach((seed, index) => {
    console.log(`\nPuzzle ${index + 1} (seed: ${seed}):`);
    const puzzle = generatePuzzle(variant, difficulty, seed);
    console.log('Generated puzzle:', puzzle);
    
    // Validate the generated puzzle has required components
    const hasStartGoal = puzzle.start && puzzle.goal;
    const hasCorrectVariant = puzzle.variant === variant;
    const hasAppropriateSize = puzzle.size.x >= 4 && puzzle.size.y >= 4;
    
    console.log('Validation:', {
      hasStartGoal,
      hasCorrectVariant,
      hasAppropriateSize,
      wallCount: puzzle.walls.length,
      keyCount: puzzle.keys?.length || 0,
      lockCount: puzzle.locks?.length || 0,
      obstacleCount: puzzle.obstacles?.length || 0,
      costCellCount: puzzle.costs?.length || 0
    });
  });
  
  console.log(`\n✅ Generation test for ${variant} (${difficulty}) complete`);
}

export function createTestPathPlannerStorylets(): void {
  console.log('📖 Creating test storylets for Path Planner minigame');
  console.log('==================================================');
  
  const testStorylets = [
    {
      id: 'test_path_planner_classic',
      name: 'Navigation Challenge - Classic',
      trigger: { type: 'flag', conditions: { flags: ['test_path_planner'] } },
      description: 'A simple maze navigation challenge to test your pathfinding skills.',
      choices: [
        {
          id: 'attempt_classic',
          text: 'Navigate the maze',
          effects: [
            {
              type: 'minigame',
              gameId: 'path-planner',
              onSuccess: [
                { type: 'resource', key: 'knowledge', delta: 5 },
                { type: 'flag', key: 'classic_maze_completed', value: true }
              ],
              onFailure: [
                { type: 'resource', key: 'stress', delta: 3 },
                { type: 'flag', key: 'classic_maze_attempted', value: true }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'test_path_planner_keylock',
      name: 'Security Challenge - Key & Lock',
      trigger: { type: 'flag', conditions: { flags: ['test_path_planner'] } },
      description: 'Navigate through a secure facility by collecting access cards and unlocking doors.',
      choices: [
        {
          id: 'attempt_keylock',
          text: 'Infiltrate the facility',
          effects: [
            {
              type: 'minigame',
              gameId: 'path-planner',
              onSuccess: [
                { type: 'resource', key: 'knowledge', delta: 8 },
                { type: 'resource', key: 'social', delta: 3 },
                { type: 'flag', key: 'security_challenge_completed', value: true }
              ],
              onFailure: [
                { type: 'resource', key: 'stress', delta: 5 },
                { type: 'flag', key: 'security_challenge_attempted', value: true }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'test_path_planner_dynamic',
      name: 'Evasion Training - Dynamic Obstacles',
      trigger: { type: 'flag', conditions: { flags: ['test_path_planner'] } },
      description: 'Practice timing and evasion by navigating around moving patrol guards.',
      choices: [
        {
          id: 'attempt_dynamic',
          text: 'Begin stealth training',
          effects: [
            {
              type: 'minigame',
              gameId: 'path-planner',
              onSuccess: [
                { type: 'resource', key: 'knowledge', delta: 6 },
                { type: 'domainXp', domain: 'intellectualCompetence', amount: 15 },
                { type: 'flag', key: 'evasion_training_completed', value: true }
              ],
              onFailure: [
                { type: 'resource', key: 'stress', delta: 4 },
                { type: 'resource', key: 'energy', delta: -5 },
                { type: 'flag', key: 'evasion_training_attempted', value: true }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'test_path_planner_cost',
      name: 'Resource Management - Cost Optimization',
      trigger: { type: 'flag', conditions: { flags: ['test_path_planner'] } },
      description: 'Plan an efficient route while managing limited resources and energy.',
      choices: [
        {
          id: 'attempt_cost',
          text: 'Optimize your path',
          effects: [
            {
              type: 'minigame',
              gameId: 'path-planner',
              onSuccess: [
                { type: 'resource', key: 'knowledge', delta: 10 },
                { type: 'resource', key: 'money', delta: 25 },
                { type: 'domainXp', domain: 'intellectualCompetence', amount: 20 },
                { type: 'flag', key: 'optimization_challenge_completed', value: true }
              ],
              onFailure: [
                { type: 'resource', key: 'stress', delta: 6 },
                { type: 'resource', key: 'money', delta: -10 },
                { type: 'flag', key: 'optimization_challenge_attempted', value: true }
              ]
            }
          ]
        }
      ]
    }
  ];
  
  // Add storylets to the store if available
  try {
    if (typeof window !== 'undefined' && (window as any).useStoryletStore) {
      const { addCustomStorylet } = (window as any).useStoryletStore.getState();
      testStorylets.forEach(storylet => {
        addCustomStorylet(storylet);
        console.log(`✅ Added test storylet: ${storylet.name}`);
      });
      
      // Set the test flag to make storylets available
      const { setFlag } = (window as any).useStoryletStore.getState();
      setFlag('test_path_planner', true);
      console.log('✅ Set test_path_planner flag to unlock all test storylets');
      
      console.log('\n🎯 All test storylets created successfully!');
      console.log('   Go to the Planner to see the new challenges.');
    } else {
      console.log('⚠️ Storylet store not available. Make sure you run this in the browser with the app loaded.');
    }
  } catch (error) {
    console.error('❌ Error creating test storylets:', error);
  }
}

export function runPathPlannerDiagnostics(): void {
  console.log('🔧 Path Planner Diagnostics');
  console.log('===========================');
  
  // Check if components are available
  console.log('Component availability:');
  try {
    const PathPlannerGame = require('../components/minigames/PathPlannerGame').default;
    console.log('✅ PathPlannerGame component loaded');
  } catch (error) {
    console.log('❌ PathPlannerGame component failed to load:', error);
  }
  
  // Check utils
  console.log('\nUtility functions:');
  try {
    const utils = require('./pathPlannerUtils');
    console.log('✅ pathPlannerUtils loaded');
    console.log('   Available functions:', Object.keys(utils));
  } catch (error) {
    console.log('❌ pathPlannerUtils failed to load:', error);
  }
  
  // Test generation for all variants
  console.log('\nTesting puzzle generation:');
  const variants: PathPlannerVariant[] = ['classic', 'keyLock', 'dynamic', 'costOptim'];
  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
  
  variants.forEach(variant => {
    difficulties.forEach(difficulty => {
      try {
        const puzzle = generatePuzzle(variant, difficulty, 12345);
        console.log(`✅ ${variant} ${difficulty}: generated successfully`);
      } catch (error) {
        console.log(`❌ ${variant} ${difficulty}: generation failed:`, error);
      }
    });
  });
  
  console.log('\n🎯 Diagnostics complete!');
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testPathPlannerVariant = testPathPlannerVariant;
  (window as any).testAllPathPlannerVariants = testAllPathPlannerVariants;
  (window as any).testPuzzleGeneration = testPuzzleGeneration;
  (window as any).createTestPathPlannerStorylets = createTestPathPlannerStorylets;
  (window as any).runPathPlannerDiagnostics = runPathPlannerDiagnostics;
  
  console.log('🎮 Path Planner test functions loaded!');
  console.log('Available commands:');
  console.log('  testPathPlannerVariant("classic|keyLock|dynamic|costOptim")');
  console.log('  testAllPathPlannerVariants()');
  console.log('  testPuzzleGeneration("variant", "difficulty")');
  console.log('  createTestPathPlannerStorylets()');
  console.log('  runPathPlannerDiagnostics()');
}