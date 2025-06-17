# Clue Discovery Follow-up Storylets

## Overview

The clue discovery system now supports a hybrid approach for follow-up storylets:
1. **Pre-authored storylets** (preferred) - Full narrative control
2. **Dynamic generation** (fallback) - Automatic safety net

## How It Works

When a player completes a clue discovery minigame, the system:

1. **Checks for pre-authored storylets** using these exact IDs:
   - Success: `clue_followup_{clue_id}_success`
   - Failure: `clue_followup_{clue_id}_failure`

2. **Uses pre-authored if found**, with better narrative quality
3. **Falls back to dynamic generation** if no pre-authored storylet exists

## Creating Pre-authored Follow-ups

### Step 1: Determine the IDs
For a clue with ID `mysterious_letter`, create storylets with these exact IDs:
- Success: `clue_followup_mysterious_letter_success`
- Failure: `clue_followup_mysterious_letter_failure`

### Step 2: Create the storylets
Use the Story Arc Visualizer or storylet management tools to create storylets with:

**Required Trigger:**
```javascript
trigger: {
  type: 'flag',
  conditions: { 
    flags: ['clue_discovery_{clue_id}_success'] // or _failure
  }
}
```

**Example Success Storylet:**
```javascript
{
  id: 'clue_followup_mysterious_letter_success',
  name: 'Letter Decoded Successfully',
  description: 'The mysterious letter reveals its secrets...',
  trigger: {
    type: 'flag',
    conditions: { flags: ['clue_discovery_mysterious_letter_success'] }
  },
  choices: [
    {
      id: 'follow_lead',
      text: 'Follow the lead mentioned in the letter',
      effects: [
        { type: 'flag', key: 'investigation_continues', value: true }
      ]
    }
  ],
  storyArc: 'Mystery Investigation'
}
```

## Benefits of Pre-authored Follow-ups

✅ **Narrative Control**: Craft specific, high-quality story content
✅ **Branching Paths**: Create complex narrative trees
✅ **Story Arc Visualization**: See complete paths in the visualizer
✅ **Testing**: Test full narrative flows before players reach them
✅ **Character Development**: Tie follow-ups to specific character arcs

## When to Use Each Approach

### Use Pre-authored for:
- Main story path clues
- Character development moments
- Important plot revelations
- Complex branching narratives

### Use Dynamic Generation for:
- Side quest clues
- Flavor/atmosphere clues
- Rapid prototyping
- Background/world-building clues

## Example: Test Clue

The test utility creates a complete example:

**Clue**: `test_clue_discovery`
**Success Storylet**: `clue_followup_test_clue_discovery_success`
- 3 meaningful choices about investigating the mysterious note
- Each choice leads to different character development

**Failure Storylet**: `clue_followup_test_clue_discovery_failure`  
- 3 different approaches to retry or move forward
- Preserves player agency even in failure

## Testing

Run in browser console:
```javascript
createTestClueAndStorylet();
```

Then play through:
1. Planner → "Library Investigation"
2. "Carefully examine the mysterious object"
3. Complete/fail the memory-cards minigame
4. See pre-authored follow-up instead of generic text

## Implementation Details

The system checks `allStorylets[targetId]` before generating. If found:
- Uses pre-authored storylet
- Sets appropriate flags
- Unlocks the storylet
- Logs which approach was used

This gives narrative designers full control when needed, with automatic fallback for rapid development.