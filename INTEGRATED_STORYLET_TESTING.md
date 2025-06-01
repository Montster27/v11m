# Integrated Storylet System Testing Guide

## 🎯 **System Integration Complete!**

The old quest engine has been successfully merged into the storylet system. You now have **one unified narrative system** that handles both time-based AND resource-based storylets.

## 📋 **What Changed**

### ✅ **Before (Two Systems)**
- **Old Quest Engine**: Resource-based events in middle column
- **Manual Quests**: Generate/complete in Quests tab  
- **New Storylets**: Time-based narratives

### ✅ **After (Unified System)**
- **Integrated Storylets**: Both time-based AND resource-based in middle column
- **Manual Quests**: Still work in Quests tab (unchanged)
- **Single Interface**: All narrative events in one place

## 🧪 **Testing the Integrated System**

### 1. Time-Based Storylets (Original)
```javascript
// Console testing
useAppStore.setState({ day: 2 });  // Triggers "Rival Dorm Feud"
useAppStore.setState({ day: 5 });  // Triggers "Midterm Mastery"
```

### 2. Resource-Based Storylets (New!)

#### Test High Stress:
```javascript
useAppStore.getState().updateResource('stress', 80);
useStoryletStore.getState().evaluateStorylets();
// Should trigger "Feeling Overwhelmed"
```

#### Test Low Energy:
```javascript  
useAppStore.getState().updateResource('energy', 20);
useStoryletStore.getState().evaluateStorylets();
// Should trigger "Running on Empty"
```

#### Test Low Social:
```javascript
useAppStore.getState().updateResource('social', 25);
useStoryletStore.getState().evaluateStorylets();
// Should trigger "Feeling Lonely"
```

#### Test Low Money:
```javascript
useAppStore.getState().updateResource('money', 40);
useStoryletStore.getState().evaluateStorylets();
// Should trigger "Financial Concerns"
```

#### Test High Knowledge:
```javascript
useAppStore.getState().updateResource('knowledge', 85);
useStoryletStore.getState().evaluateStorylets();
// Should trigger "Academic Success"
```

### 3. Real-Time Integration Testing

#### Natural Resource Changes:
1. **Start simulation** (click PLAY)
2. **Adjust time allocation** to extreme values:
   - Set Study to 80%, Rest to 10% → Watch stress build up
   - Set Work to 0%, Rest to 0% → Watch energy deplete
   - Set Social to 0% → Watch social decline
3. **Watch for storylets** to appear automatically when thresholds hit

#### Cooldown System Testing:
1. Trigger a resource-based storylet (e.g., high stress)
2. Make a choice to resolve it
3. Trigger the same condition again
4. Verify storylet doesn't appear immediately (3-day cooldown)

## 🔧 **New Features**

### Cooldown System
- **Resource storylets**: 3-day cooldown to prevent spam
- **Time/flag storylets**: One-time only (no repeats)
- **Automatic management**: No manual intervention needed

### Enhanced Resource Triggers
- **Min conditions**: `{ stress: { min: 75 } }` (stress ≥ 75)
- **Max conditions**: `{ energy: { max: 25 } }` (energy ≤ 25)  
- **Multiple conditions**: Can check multiple resources at once

### Automatic Integration
- **Resource changes**: Auto-trigger storylet evaluation
- **Day advancement**: Auto-trigger storylet evaluation
- **Real-time responsiveness**: Storylets appear immediately when conditions met

## 📊 **All Available Storylets**

### Time-Based (Days)
1. **Day 2**: Rival Dorm Feud: Prank or Peace?
2. **Day 5**: Midterm Mastery: Identify Weakness

### Resource-Based (Automatic)
3. **Stress ≥ 75**: Feeling Overwhelmed
4. **Energy ≤ 25**: Running on Empty  
5. **Social ≤ 30**: Feeling Lonely
6. **Money ≤ 50**: Financial Concerns
7. **Knowledge ≥ 80**: Academic Success

### Flag-Based (Chains)
8. **Multiple follow-ups**: Based on previous choices

## 🎮 **Expected Behavior**

### What You Should See:
- ✅ Time-based storylets appear on specific days
- ✅ Resource-based storylets appear when thresholds hit
- ✅ Choices immediately affect resources and skills
- ✅ Branching storylets unlock based on flags
- ✅ Resource storylets respect 3-day cooldowns
- ✅ No more duplicate/conflicting events

### What Changed from Before:
- ❌ Old quest engine events no longer appear
- ✅ All narrative content now goes through storylet system
- ✅ More responsive to resource changes
- ✅ Better narrative integration with skill system

## 🐛 **Troubleshooting**

### No Resource Storylets Appearing:
```javascript
// Check current resources
console.log(useAppStore.getState().resources);

// Force evaluation
useStoryletStore.getState().evaluateStorylets();

// Check cooldowns
console.log(useStoryletStore.getState().storyletCooldowns);
```

### Multiple Storylets at Once:
- System shows **first storylet** in queue
- Others remain in `activeStoryletIds` for later
- Complete current storylet to see next one

### Cooldown Issues:
```javascript
// Clear all cooldowns for testing
useStoryletStore.setState({ storyletCooldowns: {} });
```

## ✅ **Success Criteria**

The integration is successful when:
- ✅ Time-based storylets work as before
- ✅ Resource-based storylets trigger automatically  
- ✅ No old quest engine events appear
- ✅ Manual quests still work in Quests tab
- ✅ Cooldown system prevents spam
- ✅ Real-time resource monitoring works
- ✅ All effects (resources, skills, flags) apply correctly

**Result**: You now have a **unified, responsive narrative system** that reacts to both time progression AND player resource management! 🚀
