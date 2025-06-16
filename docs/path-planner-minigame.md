# Path Planner Minigame Documentation

## Overview

The Path Planner is a cognitive training minigame focused on route-planning puzzles. It supports four distinct variations, each targeting different aspects of spatial reasoning, planning, and problem-solving skills.

## Features

### 🎯 Four Game Variations

1. **Classic Grid Maze Planner** - Navigate from start to finish through a static maze
2. **Sequential Key-and-Lock Route Planner** - Collect keys in sequence to unlock gates  
3. **Dynamic Obstacle Planner** - Avoid moving obstacles with timing considerations
4. **Cost-Weighted Network Optimizer** - Traverse paths while minimizing total cost

### 🎮 Core Gameplay

- **Grid-based navigation** with arrow keys or mouse clicks
- **Real-time feedback** for valid/invalid moves
- **Adaptive difficulty** scaling (easy/medium/hard)
- **Performance tracking** (moves, time, efficiency)
- **Accessibility support** with keyboard navigation and screen reader compatibility

## Implementation Architecture

### Component Structure

```
PathPlannerGame.tsx           # Main game container
├── PuzzleBoard.tsx          # Interactive game board
├── KeyLockHUD.tsx           # Key collection interface
├── ObstacleTimeline.tsx     # Moving obstacle tracker
└── CostTracker.tsx          # Cost optimization display
```

### Data Flow

```typescript
// Level generation or loading
PuzzleLevel → PathPlannerGame → PuzzleBoard

// User interaction
PuzzleBoard → handleMove() → validateMove() → updateGameState()

// Game completion
checkWinCondition() → onGameComplete() → MinigameManager
```

## Game Variants

### 1. Classic Maze (`classic`)

**Objective**: Navigate from start (🏁) to goal (🎯) through a maze.

**Rules**:
- Move one cell at a time (orthogonal only)
- Cannot pass through walls (█)
- Any path to goal constitutes a win

**UI Elements**:
- Basic grid with walls and open spaces
- Move counter display
- Simple completion feedback

### 2. Key & Lock System (`keyLock`)

**Objective**: Collect keys (🔑) to unlock doors (🔒) and reach the goal.

**Rules**:
- Walk over keys to collect them
- Collected keys automatically unlock corresponding locks
- Cannot pass through locked doors
- Must collect all required keys to access goal

**UI Elements**:
- Key collection HUD showing progress
- Lock status indicators
- Sequential unlock feedback

### 3. Dynamic Obstacles (`dynamic`)

**Objective**: Reach the goal while avoiding moving obstacles (💀).

**Rules**:
- Obstacles move in predetermined patterns
- Player and obstacles move simultaneously each turn
- Collision with obstacle results in failure
- Must time movements to avoid obstacle paths

**UI Elements**:
- Obstacle timeline showing future positions
- Turn counter
- Movement pattern displays
- Collision warnings

### 4. Cost Optimization (`costOptim`)

**Objective**: Reach the goal within a specified cost budget.

**Rules**:
- Each cell has a movement cost (1-5+)
- Total path cost must not exceed budget
- Lower-cost paths are more efficient
- Success requires both reaching goal and staying within budget

**UI Elements**:
- Live cost tracker
- Budget progress bar
- Cost visualization on cells
- Efficiency metrics

## Integration

### Storylet Integration

```typescript
// Example storylet effect
{
  type: "minigame",
  gameId: "path-planner",
  onSuccess: [
    { type: "resource", key: "knowledge", delta: 10 },
    { type: "domainXp", domain: "intellectualCompetence", amount: 15 }
  ],
  onFailure: [
    { type: "resource", key: "stress", delta: 5 }
  ]
}
```

### Clue Discovery Integration

The Path Planner can be triggered as part of clue discovery challenges:

```typescript
{
  type: "clueDiscovery",
  clueId: "navigation_puzzle",
  minigameType: "path-planner"
}
```

## Configuration

### Difficulty Settings

| Difficulty | Grid Size | Complexity | Entities |
|------------|-----------|------------|----------|
| Easy       | 6×6       | 20%        | 1        |
| Medium     | 8×8       | 30%        | 2        |
| Hard       | 10×10     | 40%        | 3        |

### Puzzle Generation

```typescript
// Procedural generation
const puzzle = generatePuzzle('classic', 'medium', 12345);

// Or use predefined level data
const customLevel: PuzzleLevel = {
  variant: 'keyLock',
  size: { x: 8, y: 8 },
  start: { x: 0, y: 0 },
  goal: { x: 7, y: 7 },
  walls: [...],
  keys: [...],
  locks: [...]
};
```

## Testing

### Console Testing Functions

The following functions are available in the browser console during development:

```javascript
// Test individual variants
testPathPlannerVariant('classic');
testPathPlannerVariant('keyLock');
testPathPlannerVariant('dynamic');
testPathPlannerVariant('costOptim');

// Test all variants
testAllPathPlannerVariants();

// Test puzzle generation
testPuzzleGeneration('classic', 'hard');

// Create test storylets
createTestPathPlannerStorylets();

// Run diagnostics
runPathPlannerDiagnostics();
```

### Test Storylets

When `createTestPathPlannerStorylets()` is run, four test storylets are created:

1. **Navigation Challenge - Classic** - Basic maze navigation
2. **Security Challenge - Key & Lock** - Facility infiltration scenario
3. **Evasion Training - Dynamic Obstacles** - Stealth training with patrol guards
4. **Resource Management - Cost Optimization** - Efficient route planning

## Performance

### Optimization Features

- **Memoized calculations** for complex game state
- **Efficient grid rendering** with minimal re-renders
- **Seeded random generation** for reproducible puzzles
- **A* pathfinding** for optimal cost calculation

### Memory Management

- Local state management within game component
- Cleanup on game completion
- No persistent global state pollution

## Accessibility

### Keyboard Support

- **Arrow Keys/WASD**: Move player
- **R**: Reset puzzle
- **H**: Toggle help/controls
- **Tab Navigation**: Focus game elements
- **Enter/Space**: Activate focused cells

### Screen Reader Support

- **ARIA labels** for all game elements
- **Live regions** for move announcements
- **Semantic HTML** structure
- **High contrast** visual design

### Responsive Design

- **Scalable grid** based on puzzle size
- **Mobile-friendly** touch controls
- **Adaptive text sizes** for readability
- **Flexible layouts** for different screen sizes

## Future Enhancements

### Potential Features

1. **Save/Resume** - Allow players to save puzzle progress
2. **Daily Challenges** - Seeded puzzles that change daily
3. **Hint System** - Optional pathfinding assistance
4. **Animation** - Smooth movement transitions
5. **Sound Effects** - Audio feedback for actions
6. **Custom Levels** - Player-created puzzle editor
7. **Multiplayer** - Racing or collaborative modes
8. **Statistics** - Long-term performance tracking

### Image Assets (Optional)

While the current implementation uses emoji and text characters, these image assets could enhance the visual experience:

- **Player avatar** (24×24px) - Character sprite
- **Goal marker** (24×24px) - Target/finish flag
- **Wall tiles** (24×24px) - Stone or barrier texture
- **Key sprites** (16×16px) - Different colored keys
- **Lock sprites** (24×24px) - Matching lock designs
- **Obstacle sprites** (24×24px) - Guards or hazards
- **Background texture** (tileable) - Floor pattern

## API Reference

### Main Component

```typescript
interface PathPlannerGameProps {
  onGameComplete: (success: boolean, stats: GameStats) => void;
  onClose: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  variant?: PathPlannerVariant;
  levelData?: PuzzleLevel;
}
```

### Game Statistics

```typescript
interface GameStats {
  moves: number;
  time: number;
  cost?: number;
  efficiency: number;
  keysCollected?: number;
  variant: PathPlannerVariant;
}
```

### Level Configuration

```typescript
interface PuzzleLevel {
  variant: PathPlannerVariant;
  size: Coordinate;
  start: Coordinate;
  goal: Coordinate;
  walls: Coordinate[];
  keys?: Key[];
  locks?: Lock[];
  obstacles?: Obstacle[];
  costs?: CellCost[];
  budget?: number;
  timeLimit?: number;
}
```

## Conclusion

The Path Planner minigame provides a robust, configurable cognitive training experience that integrates seamlessly with the V11M2 platform. Its modular design allows for easy extension and customization while maintaining consistent performance and accessibility standards.

The four variants offer diverse gameplay experiences that can be targeted to specific learning objectives or player preferences, making it a valuable addition to the platform's minigame ecosystem.