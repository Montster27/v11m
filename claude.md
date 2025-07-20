# V11M2 Minigame System Migration Guide

## Overview
This guide covers migrating the minigame system from the legacy hardcoded approach to the modern plugin architecture, with a focus on implementing dynamic difficulty adjustment where winning makes the next play harder.

## Phase 1: Migrate to Modern Architecture

### Step 1: Create Plugin Definitions

Create a new file `/src/components/minigames/plugins/registerAllPlugins.ts`:

```typescript
// /src/components/minigames/plugins/registerAllPlugins.ts
import { MinigamePlugin } from '../core/types';
import registry from '../core/MinigameRegistry';

// Import all game components
import MemoryCardGame from '../MemoryCardGame';
import PathPlannerGame from '../PathPlannerGame';
import WordScrambleGame from '../WordScrambleGame';
import ColorMatchGame from '../ColorMatchGame';
import StroopTestGame from '../StroopTestGame';

// Define plugins for each game
const memoryCardPlugin: MinigamePlugin = {
  id: 'memory-cards',
  name: 'Memory Card Game',
  description: 'Match pairs of 1980s themed cards to test your memory',
  category: 'cognitive',
  version: '1.0.0',
  component: MemoryCardGame,
  difficultyConfig: {
    easy: { pairs: 6, rows: 3, cols: 4, timeLimit: 180 },
    medium: { pairs: 8, rows: 4, cols: 4, timeLimit: 150 },
    hard: { pairs: 10, rows: 4, cols: 5, timeLimit: 120 },
    expert: { pairs: 12, rows: 4, cols: 6, timeLimit: 90 }
  },
  defaultDifficulty: 'easy',
  tags: ['memory', 'matching', 'visual'],
  estimatedDuration: 180,
  cognitiveLoad: 'medium',
  requiredSkills: ['visual-memory', 'pattern-recognition']
};

const pathPlannerPlugin: MinigamePlugin = {
  id: 'path-planner',
  name: 'Path Planner',
  description: 'Navigate mazes with various challenges and constraints',
  category: 'cognitive',
  version: '1.0.0',
  component: PathPlannerGame,
  difficultyConfig: {
    easy: { gridSize: 8, wallDensity: 0.2, variant: 'classic' },
    medium: { gridSize: 10, wallDensity: 0.3, variant: 'keyLock' },
    hard: { gridSize: 12, wallDensity: 0.35, variant: 'dynamic' },
    expert: { gridSize: 14, wallDensity: 0.4, variant: 'costOptim' }
  },
  defaultDifficulty: 'easy',
  tags: ['puzzle', 'planning', 'spatial', 'logic'],
  estimatedDuration: 300,
  cognitiveLoad: 'high',
  requiredSkills: ['spatial-reasoning', 'planning', 'problem-solving']
};

const wordScramblePlugin: MinigamePlugin = {
  id: 'word-scramble',
  name: 'Word Scramble',
  description: 'Unscramble words related to college life and 1980s culture',
  category: 'academic',
  version: '1.0.0',
  component: WordScrambleGame,
  difficultyConfig: {
    easy: { wordLength: 4, timePerWord: 30, totalWords: 5 },
    medium: { wordLength: 6, timePerWord: 25, totalWords: 8 },
    hard: { wordLength: 8, timePerWord: 20, totalWords: 10 },
    expert: { wordLength: 10, timePerWord: 15, totalWords: 12 }
  },
  defaultDifficulty: 'easy',
  tags: ['vocabulary', 'language', 'spelling'],
  estimatedDuration: 180,
  cognitiveLoad: 'medium',
  requiredSkills: ['vocabulary', 'pattern-recognition']
};

const colorMatchPlugin: MinigamePlugin = {
  id: 'color-match',
  name: 'Color Match',
  description: 'Test your color recognition and matching skills',
  category: 'cognitive',
  version: '1.0.0',
  component: ColorMatchGame,
  difficultyConfig: {
    easy: { colors: 4, timeLimit: 60, matchesNeeded: 10 },
    medium: { colors: 6, timeLimit: 60, matchesNeeded: 15 },
    hard: { colors: 8, timeLimit: 60, matchesNeeded: 20 },
    expert: { colors: 10, timeLimit: 45, matchesNeeded: 25 }
  },
  defaultDifficulty: 'easy',
  tags: ['visual', 'reaction', 'color'],
  estimatedDuration: 120,
  cognitiveLoad: 'low',
  requiredSkills: ['visual-processing', 'reaction-time']
};

const stroopTestPlugin: MinigamePlugin = {
  id: 'stroop-test',
  name: 'Stroop Test',
  description: 'Classic cognitive test of color-word interference',
  category: 'cognitive',
  version: '1.0.0',
  component: StroopTestGame,
  difficultyConfig: {
    easy: { targetItems: 15, timeLimit: 120, congruentRatio: 0.6 },
    medium: { targetItems: 25, timeLimit: 90, congruentRatio: 0.4 },
    hard: { targetItems: 35, timeLimit: 75, congruentRatio: 0.3 },
    expert: { targetItems: 45, timeLimit: 60, congruentRatio: 0.2 }
  },
  defaultDifficulty: 'easy',
  tags: ['cognitive', 'attention', 'interference'],
  estimatedDuration: 90,
  cognitiveLoad: 'high',
  requiredSkills: ['attention', 'cognitive-control']
};

// Register all plugins
export function registerAllMinigamePlugins(): void {
  registry.register(memoryCardPlugin);
  registry.register(pathPlannerPlugin);
  registry.register(wordScramblePlugin);
  registry.register(colorMatchPlugin);
  registry.register(stroopTestPlugin);
  
  console.log('✅ Registered all minigame plugins:', registry.list().map(p => p.id));
}
```

### Step 2: Update Game Components to Use MinigameProps

Each game component needs to be updated to match the `MinigameProps` interface. Here's an example for MemoryCardGame:

```typescript
// /src/components/minigames/MemoryCardGame.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '../ui';
import type { MinigameProps, MinigameResult } from './core/types';

const MemoryCardGame: React.FC<MinigameProps> = ({
  difficulty,
  context,
  onGameComplete,
  onClose,
  onPause,
  onResume
}) => {
  // ... existing game state ...

  // Update game completion to use MinigameResult
  const handleGameComplete = (success: boolean) => {
    const timeElapsed = Date.now() - startTime;
    
    const result: MinigameResult = {
      success,
      stats: {
        score: matches.length * 10,
        timeElapsed,
        attempts: moves,
        accuracy: matches.length / moves * 100,
        hintsUsed: 0
      }
    };

    onGameComplete(result);
  };

  // ... rest of the component ...
};
```

### Step 3: Replace MinigameManager with ModernMinigameManager

Update the main app to use ModernMinigameManager:

```typescript
// In your main App component or wherever MinigameManager is imported
import ModernMinigameManager from './components/minigames/ModernMinigameManager';

// Initialize plugins on app start
import { registerAllMinigamePlugins } from './components/minigames/plugins/registerAllPlugins';

// In your app initialization
useEffect(() => {
  registerAllMinigamePlugins();
}, []);

// Replace MinigameManager usage
<ModernMinigameManager 
  gameId={activeMinigame}
  onGameComplete={handleMinigameComplete}
  onClose={handleMinigameClose}
/>
```

### Step 4: Update Storylet Integration

Update the storylet store to use the modern minigame system:

```typescript
// /src/stores/useStoryletStore.ts
import MinigameEngine from '../components/minigames/core/MinigameEngine';
import { useMinigameStore } from './useMinigameStore';

// In the launchMinigame action
launchMinigame: async (gameId: string, context?: any) => {
  const playerStats = useMinigameStore.getState().playerStats;
  
  try {
    const { component, props, sessionId } = await MinigameEngine.launchGame(
      gameId,
      {
        storyletId: get().currentStorylet?.id,
        ...context
      },
      playerStats
    );
    
    set({ 
      activeMinigame: gameId,
      minigameSessionId: sessionId,
      minigameComponent: component,
      minigameProps: props
    });
  } catch (error) {
    console.error('Failed to launch minigame:', error);
  }
};
```

## Phase 2: Enable Dynamic Difficulty System

### The Core Concept

When a player wins a minigame, the next time they play that specific game, it will be harder. If they lose, it stays at the same difficulty or potentially gets easier.

### Step 1: Update MinigameEngine to Use Player's Current Difficulty

The MinigameEngine already has difficulty calculation logic. We need to ensure it uses the player's stored difficulty:

```typescript
// In MinigameEngine.ts launchGame method
async launchGame(
  gameId: string, 
  context: MinigameContext,
  playerStats: PlayerMinigameStats
): Promise<{ component: React.ComponentType<any>; props: any; sessionId: string }> {
  // Get the player's current difficulty for this game
  const gameStats = playerStats[gameId];
  let difficulty = context.requiredDifficulty;
  
  if (!difficulty && gameStats) {
    // Use the player's current difficulty for this game
    difficulty = gameStats.currentDifficulty;
  }
  
  if (!difficulty) {
    // First time playing - use default
    const plugin = registry.get(gameId);
    difficulty = plugin?.defaultDifficulty || 'easy';
  }

  // ... rest of the method
}
```

### Step 2: Update Store to Increase Difficulty on Win

Modify the `recordGameResult` function in `useMinigameStore.ts`:

```typescript
// In useMinigameStore.ts
recordGameResult: (gameId: string, result: MinigameResult, difficulty: MinigameDifficulty) => {
  set((state) => {
    // Initialize game stats if not exists
    if (!state.playerStats[gameId]) {
      state.playerStats[gameId] = {
        totalPlays: 0,
        totalWins: 0,
        totalLosses: 0,
        averageScore: 0,
        bestScore: 0,
        averageTime: 0,
        bestTime: Infinity,
        currentStreak: 0,
        longestStreak: 0,
        currentDifficulty: difficulty,
        difficultyHistory: [],
        recentResults: [],
        preferences: {
          enableHints: state.preferences.enableHints,
          enableTimer: state.preferences.enableTimers,
          enableSounds: state.preferences.enableSounds
        }
      };
    }

    const gameStats = state.playerStats[gameId];
    
    // Update basic counters
    gameStats.totalPlays++;
    if (result.success) {
      gameStats.totalWins++;
      gameStats.currentStreak++;
      
      // INCREASE DIFFICULTY ON WIN
      const difficultyProgression: Record<MinigameDifficulty, MinigameDifficulty> = {
        'easy': 'medium',
        'medium': 'hard',
        'hard': 'expert',
        'expert': 'expert' // Stay at expert
      };
      
      const oldDifficulty = gameStats.currentDifficulty;
      const newDifficulty = difficultyProgression[oldDifficulty] || oldDifficulty;
      
      if (newDifficulty !== oldDifficulty) {
        // Record difficulty change
        gameStats.difficultyHistory.push({
          difficulty: oldDifficulty,
          timestamp: Date.now(),
          performance: 1 // Won
        });
        
        gameStats.currentDifficulty = newDifficulty;
        console.log(`📈 Difficulty increased for ${gameId}: ${oldDifficulty} → ${newDifficulty}`);
      }
    } else {
      gameStats.totalLosses++;
      gameStats.currentStreak = 0;
      
      // OPTIONAL: Decrease difficulty on multiple losses
      const recentLosses = gameStats.recentResults
        .slice(-3)
        .filter(r => !r.success).length;
      
      if (recentLosses >= 3 && gameStats.currentDifficulty !== 'easy') {
        // Player lost 3 times in a row, make it easier
        const difficultyRegression: Record<MinigameDifficulty, MinigameDifficulty> = {
          'expert': 'hard',
          'hard': 'medium',
          'medium': 'easy',
          'easy': 'easy'
        };
        
        const oldDifficulty = gameStats.currentDifficulty;
        const newDifficulty = difficultyRegression[oldDifficulty] || oldDifficulty;
        
        if (newDifficulty !== oldDifficulty) {
          gameStats.difficultyHistory.push({
            difficulty: oldDifficulty,
            timestamp: Date.now(),
            performance: 0 // Lost
          });
          
          gameStats.currentDifficulty = newDifficulty;
          console.log(`📉 Difficulty decreased for ${gameId}: ${oldDifficulty} → ${newDifficulty}`);
        }
      }
    }

    // ... rest of the existing logic for stats tracking
  });
};
```

### Step 3: Update ModernMinigameManager to Pass Difficulty

Ensure ModernMinigameManager correctly reads and uses the stored difficulty:

```typescript
// /src/components/minigames/ModernMinigameManager.tsx
const ModernMinigameManager: React.FC<MinigameManagerProps> = ({
  gameId,
  onGameComplete,
  onClose
}) => {
  const playerStats = useMinigameStore(state => state.playerStats);
  const recordGameResult = useMinigameStore(state => state.recordGameResult);
  
  // Get current difficulty for this game
  const currentDifficulty = playerStats[gameId]?.currentDifficulty || 'easy';
  
  useEffect(() => {
    const launchGame = async () => {
      try {
        const { component, props, sessionId } = await MinigameEngine.launchGame(
          gameId,
          {
            // Don't override with requiredDifficulty - let the engine use player's current
          },
          playerStats
        );
        
        // ... rest of launch logic
      } catch (error) {
        console.error('Failed to launch minigame:', error);
      }
    };
    
    launchGame();
  }, [gameId]);

  // ... rest of component
};
```

## Migration Checklist

- [ ] Create plugin definitions for all 5 games with 4 difficulty levels (easy, medium, hard, expert)
- [ ] Update each game component to use MinigameProps interface
- [ ] Update game completion handlers to return MinigameResult
- [ ] Register all plugins on app initialization
- [ ] Replace MinigameManager imports with ModernMinigameManager
- [ ] Ensure MinigameEngine reads player's current difficulty
- [ ] Update recordGameResult to increase difficulty on win
- [ ] Test difficulty progression (win → harder, lose 3x → easier)
- [ ] Remove legacy MinigameManager.tsx file

## How Dynamic Difficulty Works

1. **First Play**: Player starts at 'easy' difficulty
2. **Win**: Difficulty automatically increases (easy → medium → hard → expert)
3. **Loss**: Difficulty stays the same
4. **Multiple Losses**: After 3 losses in a row, difficulty decreases by one level
5. **Per Game**: Each minigame tracks its own difficulty independently

### Example Flow

```
Player plays Memory Cards:
- First game: Easy (6 pairs) → Wins
- Next game: Medium (8 pairs) → Wins
- Next game: Hard (10 pairs) → Loses
- Next game: Hard (10 pairs) → Loses
- Next game: Hard (10 pairs) → Loses
- Next game: Medium (8 pairs) → [Decreased due to 3 losses]
```

## Benefits of This System

1. **Adaptive Challenge**: Games get harder as players improve
2. **Prevents Frustration**: Automatic difficulty reduction after repeated failures
3. **Individual Progress**: Each game adapts independently
4. **Persistent Progress**: Difficulty levels are saved between sessions
5. **Natural Progression**: Players naturally advance through skill levels

## Next Steps

After completing this migration:
1. Add visual indicators showing current difficulty level
2. Create UI to show difficulty progression history
3. Add option for players to manually adjust difficulty if desired
4. Consider achievements for reaching expert level in each game
