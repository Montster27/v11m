# Clue Connection Visualization Test

This document provides a step-by-step guide to test the clue connection visualization in the Arc Manager.

## Quick Test Setup

### 1. Create a Story Arc
1. Go to **Arc Manager** > **Overview** 
2. Click **+ New Arc**
3. Name it "Mystery Investigation"

### 2. Create Storylets for the Arc
You need at least 3 storylets:

#### Trigger Storylet (Investigation Start)
- **ID**: `investigation-trigger`
- **Name**: "Start Investigation"
- **Description**: "Begin investigating the mysterious case"
- **Story Arc**: "Mystery Investigation"
- **Trigger**: Time trigger (Day 1)

#### Success Outcome Storylet 
- **ID**: `clue-discovered`
- **Name**: "Evidence Found"
- **Description**: "Successfully found the crucial evidence"
- **Story Arc**: "Mystery Investigation"
- **Trigger**: Time trigger (Day 2)

#### Failure Outcome Storylet
- **ID**: `search-failed`
- **Name**: "Investigation Dead End"
- **Description**: "The search yielded no results"
- **Story Arc**: "Mystery Investigation"
- **Trigger**: Time trigger (Day 3)

### 3. Create a Clue with Connections
1. Go to **Clue Manager**
2. Click **+ New Clue**
3. Fill in the form:
   - **Title**: "Suspicious Letter"
   - **Description**: "A letter with strange markings"
   - **Content**: "The letter contains cryptic symbols that might be important"
   - **Category**: Mystery
   - **Difficulty**: Medium
   - **Story Arc**: "Mystery Investigation"

4. **Configure Discovery Minigames**:
   - Check "Memory Cards" and/or "Path Planner"

5. **Configure Trigger Storylets** (NEW SECTION):
   - Check "Start Investigation" in the storylets list

6. **Configure Outcome Paths**:
   - **Success Path**: "Evidence Found"
   - **Failure Path**: "Investigation Dead End"

7. Click **Create Clue**

### 4. Test the Visualization
1. Go to **Arc Manager** > **Visualizer**
2. Select "Mystery Investigation" from the dropdown
3. You should see:
   - **3 storylet nodes** arranged hierarchically
   - **Dashed green line** from "Start Investigation" to "Evidence Found" (labeled "✅ Success: Suspicious Letter")
   - **Dashed red line** from "Start Investigation" to "Investigation Dead End" (labeled "❌ Failure: Suspicious Letter")

### 5. Check Browser Console
Open browser dev tools and look for debug messages:
```
🎨 Edge types breakdown: {clue_positive: 1, clue_negative: 1}
🎨 Clue edges found: ['investigation-trigger -> clue-discovered (clue_positive)', 'investigation-trigger -> search-failed (clue_negative)']
```

## Expected Visual Result

The arc visualizer should show:

```
[Start Investigation] 
    |
    |--- ✅ Success: Suspicious Letter ----> [Evidence Found]
    |
    |--- ❌ Failure: Suspicious Letter ----> [Investigation Dead End]
```

Where:
- Solid lines = regular story choices
- **Dashed GREEN lines** = successful clue discovery paths
- **Dashed RED lines** = failed clue discovery paths

## Troubleshooting

### No Clue Connections Visible
1. **Check Browser Console** for debug messages
2. **Verify Clue Setup**:
   - Clue has same Story Arc as storylets
   - Associated Storylets field is populated
   - Outcome storylets are set
3. **Verify Storylets Exist**:
   - All storylets are assigned to the same arc
   - Outcome storylet IDs match exactly

### Debug Checklist
- [ ] Arc has storylets assigned
- [ ] Clue is assigned to same arc
- [ ] Clue has "Associated Storylets" selected
- [ ] Clue has outcome storylets configured
- [ ] All storylet IDs match exactly
- [ ] Browser console shows clue edges being generated

## Test Validation

A successful test should show:
- ✅ Clue connections rendered as dashed lines
- ✅ Different colors for success (green) vs failure (red) paths  
- ✅ Proper labels showing clue name and outcome type
- ✅ Console logs confirming edge generation