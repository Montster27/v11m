# Balance Testing System Documentation

## Overview

The Balance Testing System provides comprehensive tools for analyzing and optimizing the game balance of the Life Simulation Game. It includes Monte Carlo simulation, stress testing, and quick analysis tools to identify balance issues and optimization opportunities.

## Components

### 1. BalanceSimulator Class (`/src/utils/balanceSimulator.ts`)

**Main Features:**
- Monte Carlo simulation with configurable iterations and day length
- 5 predefined player archetypes (Academic, Social, Balanced, Grind, Wellness)
- Automated gameplay simulation using real resource calculation logic
- Comprehensive analysis and balance issue detection

**Player Archetypes:**
- **Academic Focused**: Prioritizes studying (Study 70%, Work 15%, Social 5%)
- **Social Butterfly**: Maximizes social connections (Social 60%, Study 20%, Work 15%)
- **Balanced Optimizer**: Dynamic allocation based on current resources
- **Grind Focused**: Works constantly for resources (Work 65%, Study 25%)
- **Wellness Focused**: Prioritizes mental/physical health (Rest 30%, Exercise 25%)

### 2. Balance Testing Panel (`/src/components/BalanceTestingPanel.tsx`)

**Three Main Tabs:**

#### 🎲 Monte Carlo Simulation
- Configure iterations (10-500) and simulation length (7-365 days)
- Select which archetypes to test
- Real-time progress tracking
- Comprehensive results analysis

#### 🔥 Stress Tests
- Test extreme time allocation scenarios
- Identify breaking points and edge cases
- Detect when game mechanics fail under stress

#### ⚡ Quick Tools
- Instant balance checks without full simulation
- Resource snapshots and projections
- Strategy recommendations

### 3. Quick Balance Analyzer (`/src/utils/quickBalanceTools.ts`)

**Instant Analysis Tools:**
- `analyzeBalance()` - Complete balance report
- `checkBottlenecks()` - Identify resource bottlenecks
- `compareStrategies()` - Compare current play to optimal strategies

**5 Optimal Strategies:**
- Knowledge Maximizer, Social Butterfly, Balanced Growth, Financial Focus, Wellness Focused

## How to Use

### Access the Balance Testing System

1. **Start Development Server**: `npm run dev`
2. **Open Debug Panel**: Look for the 🐞 Debug tab on the right side of screen
3. **Navigate to Balance Tab**: Click "⚖️ Balance" in the debug panel

### Running a Monte Carlo Simulation

1. **Set Parameters**:
   - Iterations: 50-100 for quick tests, 200+ for comprehensive analysis
   - Days: 30 for short-term, 90+ for long-term balance
   - Select archetypes to include

2. **Analyze Results**:
   - **Summary Stats**: Overall performance metrics
   - **Archetype Comparison**: Which strategies perform best/worst
   - **Balance Issues**: Overpowered/underpowered strategies detected
   - **Resource Analysis**: Final resource distributions

### Quick Balance Checks

**Console Commands** (available globally):
```javascript
// Get comprehensive balance analysis
analyzeBalance()

// Check for immediate bottlenecks
checkBottlenecks()

// Compare to optimal strategies
compareStrategies()
```

**Debug Panel Quick Tools**:
- 📊 Resource Snapshot - Log current state
- 📈 Weekly Projection - Project 1 week ahead
- 🎯 Strategy Guide - Show optimal allocations
- 🚨 Balance Warnings - Check for issues

## Key Metrics Tracked

### Resource Balance
- **Resource Generation vs Consumption**: Are players gaining/losing resources over time?
- **Time Allocation Efficiency**: Which allocations provide best returns?
- **Bottleneck Detection**: What resources commonly limit progress?

### Player Progression
- **Skill/Domain Development**: How quickly do characters develop?
- **Quest/Storylet Completion**: Are content unlock rates appropriate?
- **Milestone Timing**: When do players reach key progression points?

### Balance Issues
- **Overpowered Strategies**: Strategies that significantly outperform others
- **Underpowered Strategies**: Strategies that consistently underperform
- **Resource Bottlenecks**: Resources that frequently limit progression
- **Progression Problems**: Issues with pacing or difficulty scaling

## Interpreting Results

### Performance Scores
- **Above 1.2x Average**: Potentially overpowered
- **Below 0.8x Average**: Potentially underpowered
- **0.8x - 1.2x Average**: Well balanced

### Resource Warnings
- **Energy < 30**: Low energy limiting activities
- **Stress > 70**: High stress affecting performance
- **Knowledge/Day < 2**: Slow academic progress
- **Social/Day < 1.5**: Insufficient social development

### Strategy Recommendations
- **High Similarity (>80%)**: Already following optimal strategy
- **Medium Similarity (60-80%)**: Minor adjustments needed
- **Low Similarity (<60%)**: Consider alternative approach

## Balance Adjustment Guidelines

### Overpowered Strategies
1. **Reduce Resource Generation**: Lower base rates for dominant activities
2. **Add Costs/Penalties**: Introduce stress, energy costs, or diminishing returns
3. **Increase Requirements**: Make achievements require more diverse development

### Underpowered Strategies
1. **Increase Rewards**: Boost resource generation or add unique benefits
2. **Reduce Costs**: Lower stress/energy costs for struggling activities
3. **Add Synergies**: Create bonuses for combining multiple activities

### Resource Bottlenecks
1. **Increase Generation**: Boost generation rates for bottlenecked resources
2. **Reduce Consumption**: Lower costs that drain bottlenecked resources
3. **Add Alternative Sources**: Provide multiple ways to gain critical resources

## Technical Implementation

### Simulation Architecture
- Uses actual game resource calculation functions
- Simulates character progression using domain XP system
- Tracks bottlenecks, achievements, and progression milestones
- Provides statistical analysis with standard deviation and percentiles

### Integration Points
- **Resource Calculations**: `calculateDomainResourceEffects()`
- **Character System**: Integrated character domains and progression
- **Storylet System**: Quest/storylet completion simulation
- **Save System**: No interference with actual game saves

### Performance Considerations
- Large simulations (500+ iterations) may take several minutes
- Progress callbacks provide real-time feedback
- Results cached for analysis without re-running
- Stress tests are lighter weight for quick feedback

## Example Workflow

1. **Initial Assessment**:
   ```javascript
   // Quick check of current balance
   analyzeBalance()
   ```

2. **Comprehensive Analysis**:
   - Run 100-iteration, 30-day Monte Carlo simulation
   - Review archetype performance comparison
   - Identify overpowered/underpowered strategies

3. **Stress Testing**:
   - Run stress tests to check edge cases
   - Verify extreme allocations don't break the game

4. **Balance Adjustments**:
   - Modify resource calculation rates in `resourceCalculations.ts`
   - Adjust storylet rewards/penalties
   - Re-test with simulations

5. **Validation**:
   - Run follow-up simulations to confirm improvements
   - Use quick tools for ongoing monitoring

This system provides data-driven insights for maintaining engaging and balanced gameplay across different player styles and strategies.