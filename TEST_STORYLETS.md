// /Users/montysharma/V11M2/TEST_STORYLETS.md

# Storylet System Testing Instructions

## 🧪 **Quick Testing Guide**

### 1. Access the Planner
- Navigate to `/planner` in your browser
- The storylet system is now integrated in the middle column

### 2. Trigger Time-Based Storylets

#### Option A: Wait for Natural Progression
- Start the simulation (click PLAY)
- Wait for Day 2 to see "Rival Dorm Feud: Prank or Peace?"
- Wait for Day 5 to see "Midterm Mastery: Identify Weakness"

#### Option B: Quick Testing (Console)
```javascript
// Open browser console and run:

// Force advance to day 2
useAppStore.setState({ day: 2 });
useStoryletStore.getState().evaluateStorylets();

// Force advance to day 5  
useAppStore.setState({ day: 5 });
useStoryletStore.getState().evaluateStorylets();

// Check current state
testStorylets();
```

### 3. Test Storylet Interactions

#### Rival Dorm Storylet (Day 2):
1. **Choose "Prank them"**:
   - Social +2
   - Operational Security skill +1 XP
   - Sets `rival_pranked` flag
   - Unlocks "Rival Dorm Feud: Consequences"

2. **Choose "Negotiate a truce"**:
   - Social +3  
   - Alliance Building skill +5 XP
   - Sets `rival_truce` flag
   - Unlocks "Rival Dorm Feud: Consequences"

3. **Choose "Ignore it"**:
   - Stress -2, Energy +2
   - Sets `rival_ignored` flag
   - Unlocks "Rival Dorm Feud: Consequences"

#### Midterm Mastery Chain (Day 5):
1. **"Identify Weakness"** → Choose self-assess or skip
2. **"Study Sprint"** → Choose study group or solo
3. **"Tutor Session"** → Choose hire tutor or cram
4. **"Exam Day"** → Take the exam (end of chain)

### 4. Verify Effects

#### Resource Changes:
- Open Resources panel (right column)
- Watch values change when making choices
- Verify money decreases when hiring tutor ($10)

#### Skill XP:
- Open Skills panel (bottom row)  
- Watch XP bars fill when gaining experience
- Different choices award different skills

#### Flags & Branching:
- Use console: `useStoryletStore.getState().activeFlags`
- Verify flags are set correctly
- Confirm next storylets unlock automatically

### 5. Development Testing Tools

#### In-UI Testing (Development Mode):
- Yellow testing panel appears in development
- "Evaluate Storylets" - Manual trigger
- "Reset Storylets" - Clear all progress
- "Test Storylets (Console)" - Debug output

#### Console Functions:
```javascript
// View current storylet state
testStorylets();

// Reset all storylets
resetStorylets();

// Manual evaluation
useStoryletStore.getState().evaluateStorylets();

// Check flags
console.log(useStoryletStore.getState().activeFlags);

// Set custom flags for testing
useStoryletStore.getState().setFlag('custom_flag', true);
```

## ✅ **Expected Results**

### Working Features:
- ✅ Storylets appear at correct days
- ✅ Choice buttons are clickable
- ✅ Resource effects apply immediately
- ✅ Skill XP is awarded to correct skills
- ✅ Flags are set for storylet progression
- ✅ Next storylets unlock automatically
- ✅ Completed storylets are removed from active list
- ✅ No active storylets shows placeholder message

### Integration Points:
- ✅ Works with existing resource system
- ✅ Works with existing skill system
- ✅ Updates in real-time with simulation
- ✅ Respects game day progression
- ✅ Maintains state during play/pause

## 🐛 **Troubleshooting**

### No Storylets Appearing:
1. Check current day: `useAppStore.getState().day`
2. Manual evaluation: `useStoryletStore.getState().evaluateStorylets()`
3. Check active list: `useStoryletStore.getState().activeStoryletIds`

### Effects Not Working:
1. Check console for errors
2. Verify resource values before/after
3. Check skill XP in Skills panel

### Flags Not Setting:
1. Check flag state: `useStoryletStore.getState().activeFlags`
2. Verify choice effects in storylet data
3. Try manual flag setting for testing

## 🎯 **Success Criteria**

The implementation is successful when:
- ✅ Time-based storylets appear on correct days
- ✅ Choices apply effects to resources and skills
- ✅ Storylet chains progress through flags
- ✅ UI updates in real-time
- ✅ System integrates seamlessly with existing features
- ✅ Development tools work for testing and debugging

**Status**: ✅ All criteria met - System ready for production use!
