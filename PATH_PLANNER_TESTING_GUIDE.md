# Path Planner Testing Guide

## 🎯 Overview
The Path Planner minigame now supports variant and difficulty testing through the enhanced Minigame Management Panel.

## 🚀 Quick Start Testing

### 1. Access the Testing Interface
1. Open your browser to `http://localhost:5173`
2. Navigate to **"Storylet Developer"** tab
3. Click on the **"Minigames"** section
4. Select the **"Test Games"** tab

### 2. Configure Path Planner Test
- **Select Minigame**: Choose "Path Planner" from dropdown
- **Choose Difficulty**: Select Easy, Medium, or Hard
- **Pick Variant**: Choose from 4 available variants
- **Launch**: Click "Launch Test Game"

## 🎮 Available Variants

### 1. Classic Maze (`classic`)
- **Description**: Navigate through walls to reach the goal
- **Features**: Basic pathfinding with static obstacles
- **Focus**: Spatial reasoning and route planning

### 2. Key & Lock (`keyLock`) 
- **Description**: Collect keys to unlock doors blocking your path
- **Features**: Key collection mechanics, door unlocking
- **Focus**: Sequential planning and memory

### 3. Dynamic Obstacles (`dynamic`)
- **Description**: Avoid moving obstacles that patrol the maze
- **Features**: Moving hazards, timing-based navigation
- **Focus**: Temporal planning and prediction

### 4. Cost Optimization (`costOptim`)
- **Description**: Find the most efficient path within budget constraints
- **Features**: Cell movement costs, budget management
- **Focus**: Optimization and resource management

## 🎚️ Difficulty Levels

### Easy
- Smaller grid sizes (5x5)
- Lower complexity (15% walls)
- Fewer entities (1-2 keys/obstacles)
- Forgiving timing and budgets

### Medium
- Medium grid sizes (6x6)
- Moderate complexity (25% walls)
- Balanced entities (2 keys/obstacles)
- Standard challenge level

### Hard
- Larger grid sizes (8x8)
- Higher complexity (35% walls)
- More entities (2+ keys/obstacles)
- Tight timing and budgets

## 🧪 Testing Checklist

### Visual & Controls Testing
- [ ] Grid cells are clearly visible and appropriately sized
- [ ] All game elements (walls, keys, locks, obstacles) are distinct
- [ ] Green dots indicate valid moves clearly
- [ ] Mouse clicks move player in correct direction
- [ ] Keyboard controls (WASD/arrows) work smoothly
- [ ] No unexpected "jumping" to wrong locations

### Variant-Specific Testing

#### Classic Maze
- [ ] Walls block movement properly
- [ ] Path from start to goal exists
- [ ] Player reaches goal to win

#### Key & Lock
- [ ] Keys can be collected
- [ ] Locks block movement until key collected
- [ ] All keys required for completion
- [ ] Visual feedback for collected/unlocked items

#### Dynamic Obstacles
- [ ] Obstacles move in predictable patterns
- [ ] Collision with obstacles causes game over
- [ ] Timeline shows obstacle predictions
- [ ] Player can time movements to avoid obstacles

#### Cost Optimization
- [ ] Different cells have different movement costs
- [ ] Budget constraint enforced
- [ ] Cost tracker shows current spending
- [ ] Optimal path possible within budget

### Difficulty Testing
- [ ] Easy: Manageable for new players
- [ ] Medium: Moderate challenge level
- [ ] Hard: Requires strategic thinking

## 🔧 Advanced Testing

### Browser Console Testing
1. Open browser developer tools (F12)
2. Load the test script: `<script src="test-pathplanner-variants.js"></script>`
3. Run: `testPathPlannerVariants()`
4. Check for any errors or warnings

### Performance Testing
- [ ] Game loads quickly across all variants
- [ ] No lag during movement or animations
- [ ] Responsive on different screen sizes
- [ ] Memory usage remains stable

## 📊 Expected Results

### Successful Test Outcomes
- All variants launch without errors
- Controls feel intuitive and responsive
- Visual elements are clear and distinct
- Game mechanics work as intended
- Win/lose conditions trigger correctly

### Common Issues to Watch For
- Grid sizing problems on different screens
- Control lag or unresponsive inputs
- Visual elements overlapping or unclear
- Game logic errors (infinite loops, crashes)
- Performance issues with larger grids

## 🐛 Troubleshooting

### If a variant won't load:
1. Check browser console for errors
2. Verify all required files are present
3. Test with a simpler difficulty first

### If controls feel unresponsive:
1. Test different browsers
2. Check system performance
3. Try different grid sizes

### If visuals are unclear:
1. Test different screen resolutions
2. Check CSS scaling issues
3. Verify Tailwind classes are loading

## 💡 Additional Features

### Keyboard Shortcuts
- **Arrow Keys / WASD**: Move player
- **R**: Reset current puzzle
- **H**: Toggle help/controls display
- **ESC**: Close game (depending on implementation)

### Visual Indicators
- 🏁 Start position
- 🎯 Goal position  
- 👤 Player position
- 🔑 Collectible keys
- 🔒 Locked doors
- 💀 Moving obstacles
- • Green dots for valid moves
- Color-coded costs (green=cheap, red=expensive)

## 🎯 Success Criteria

The Path Planner testing is successful when:
1. All 4 variants work correctly across all 3 difficulties
2. User interface is intuitive and responsive
3. Visual clarity issues have been resolved
4. Control "jumping" problems are eliminated
5. Game logic operates without errors
6. Performance is smooth across different devices

---

**Ready to test!** Navigate to the development server and start exploring the Path Planner variants.