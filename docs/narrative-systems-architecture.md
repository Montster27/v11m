# Narrative Systems Architecture
# /Users/montysharma/V11M2/docs/narrative-systems-architecture.md

## Overview

This document provides a comprehensive technical overview of the storylet, story arc, and NPC systems that form the narrative engine of the Life Simulator (MMV). These interconnected systems create dynamic, branching narratives that respond to player choices, resource states, and relationship dynamics.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Storylet      │◄──►│   Story Arc     │◄──►│      NPC        │
│    System       │    │    System       │    │    System       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │    Resource & Skill     │
                    │       Systems           │
                    └─────────────────────────┘
```

## 1. Storylet System

### Core Concept
Storylets are discrete narrative units that can be triggered by various conditions (time, resources, flags, NPC relationships). They represent moments of choice and consequence in the player's journey.

### Technical Structure

#### Type Definitions (`/src/types/storylet.ts`)
```typescript
interface Storylet {
  id: string;                     // Unique identifier
  name: string;                   // Display title
  trigger: StoryletTrigger;       // Conditions for availability
  description: string;            // Narrative text
  choices: Choice[];              // Available player actions
  involvedNPCs?: string[];        // NPCs that appear
  primaryNPC?: string;            // Main NPC focus
  locationId?: string;            // Where this takes place
  deploymentStatus?: string;      // dev/stage/live
  storyArc?: string;              // Optional arc grouping
}
```

#### Trigger System
Storylets can be triggered by multiple condition types:

- **Time Triggers**: Activate on specific days/weeks
  ```typescript
  trigger: { type: "time", conditions: { day: 5 } }
  ```

- **Flag Triggers**: Activate when specific flags are set
  ```typescript
  trigger: { type: "flag", conditions: { flags: ["midterm_assessed"] } }
  ```

- **Resource Triggers**: Activate based on resource thresholds
  ```typescript
  trigger: { type: "resource", conditions: { stress: { min: 75 } } }
  ```

- **NPC Relationship Triggers**: Activate based on relationship levels
  ```typescript
  trigger: { type: "npc_relationship", conditions: { npcId: "emma", minLevel: 60 } }
  ```

- **NPC Availability Triggers**: Activate when NPCs are available
  ```typescript
  trigger: { type: "npc_availability", conditions: { npcId: "emma", locationId: "library" } }
  ```

#### Choice and Effect System
Each storylet choice can produce multiple effects:

```typescript
type Effect = 
  | { type: "resource"; key: string; delta: number }           // Modify resources
  | { type: "flag"; key: string; value: boolean }             // Set game flags
  | { type: "skillXp"; key: string; amount: number }          // Award skill XP
  | { type: "foundationXp"; key: string; amount: number }     // V2 skill system
  | { type: "domainXp"; domain: string; amount: number }      // V2 character system
  | { type: "unlock"; storyletId: string }                    // Unlock next storylet
  | { type: "minigame"; gameId: string; onSuccess?: Effect[]; onFailure?: Effect[] }
  | { type: "npcRelationship"; npcId: string; delta: number; reason?: string }
  | { type: "npcMemory"; npcId: string; memory: NPCMemoryInput }
  | { type: "npcFlag"; npcId: string; flag: string; value: boolean }
  | { type: "npcMood"; npcId: string; mood: string; duration?: number }
  | { type: "npcAvailability"; npcId: string; availability: string; duration?: number };
```

### Store Management (`/src/store/useStoryletStore.ts`)

#### Key State
```typescript
interface StoryletState {
  allStorylets: Record<string, Storylet>;     // Full catalog
  activeFlags: Record<string, boolean>;       // Boolean game flags
  activeStoryletIds: string[];                // Currently available
  completedStoryletIds: string[];             // Finished storylets
  storyletCooldowns: Record<string, number>;  // Cooldown system
  storyArcs: string[];                        // Available arcs
  deploymentFilter: Set<string>;              // Dev/stage/live filter
}
```

#### Core Functions
- **`evaluateStorylets()`**: Scans all storylets, checks triggers, unlocks eligible ones
- **`chooseStorylet(storyletId, choiceId)`**: Processes player choice and applies effects
- **`applyEffect(effect)`**: Handles individual effect application
- **`unlockStorylet(storyletId)`**: Manually unlock specific storylets

#### Data Sources
Storylets are loaded from multiple data files:
- `startingStorylets.ts` - Tutorial and onboarding
- `collegeStorylets.ts` - Academic storylines
- `frequentStorylets.ts` - Resource-based recurring events
- `immediateStorylets.ts` - Quick one-off events
- `minigameStorylets.ts` - Minigame integration
- `emmaRomanceArc.ts` - Character relationship arcs
- `developmentTriggeredStorylets.ts` - Development/testing

### Deployment System
Storylets support deployment filtering:
- **`live`**: Production-ready content
- **`stage`**: Testing phase content
- **`dev`**: Development-only content

## 2. Story Arc System

### Purpose
Story arcs group related storylets into coherent narrative chains with progress tracking and failure states.

### Arc Structure
```typescript
interface ArcProgress {
  total: number;                    // Total storylets in arc
  completed: number;                // Completed storylets
  failed: boolean;                  // Terminal failure state
  failureReason?: string;           // Why arc failed
  current?: string;                 // Current active storylet
  percentage: number;               // Completion percentage
}
```

### Arc Types
- **Linear Arcs**: Sequential storylets (A → B → C → D)
- **Branching Arcs**: Multiple paths with convergence points
- **Failed Arcs**: Terminal failure states with consequences
- **Cross-Arc Influence**: Arcs that affect other storylines

### Example: Emma Romance Arc
```typescript
// Entry point with multiple paths
"emma_01_coffee_shop" → {
  "awkward_interruption" → Terminal Failure
  "literary_connection" → "emma_02_study_group" → Direct Path
  "respectful_distance" → "emma_02_library_encounter" → Respectful Path
}

// Convergence and resolution
Multiple paths converge at "emma_03_coffee_date"
Final outcomes: Romance, Friendship, or Academic Partnership
```

### Arc Management Functions
```typescript
getArcProgress(arcName: string): ArcProgress
getActiveArcs(): string[]
isArcComplete(arcName: string): boolean
isArcFailed(arcName: string): boolean
getArcStats(): ArcStats[]
```

### Flag Naming Convention
Arc-related flags follow a structured pattern:
```typescript
"{arc_key}:{storylet_id}_complete"     // Individual completion
"{arc_key}:terminal_failure"           // Arc failure
"{arc_key}:failure_reason"             // Failure explanation
"{arc_key}:outcome"                    // Final arc result
```

## 3. NPC System

### Purpose
NPCs are persistent characters with memory, relationships, and dynamic availability that evolve based on player interactions.

### NPC Structure (`/src/types/npc.ts`)
```typescript
interface NPC {
  id: string;                           // Unique identifier
  name: string;                         // Display name
  description: string;                  // Character description
  personality: NPCPersonality;          // Traits, interests, values
  background: NPCBackground;            // Academic and personal history
  currentStatus: NPCStatus;             // Current mood and availability
  relationshipLevel: number;            // 0-100 relationship score
  relationshipType: RelationshipType;   // Categorical relationship
  memories: NPCMemory[];                // Interaction history
  flags: Record<string, boolean>;       // NPC-specific flags
  locations: NPCLocation[];             // Where they can be found
  schedule?: NPCSchedule;               // Time-based availability
  associatedStorylets: string[];        // Related storylets
  storyArc?: string;                    // Story arc they belong to
}
```

### Relationship System
- **Levels**: 0-100 numeric scale
- **Types**: Stranger → Acquaintance → Friend → Close Friend → Romantic Interest → Dating
- **Automatic Type Updates**: Relationship types update based on level changes
- **Bidirectional**: Relationships affect storylet availability and NPC behavior

### Memory System
NPCs remember player interactions:
```typescript
interface NPCMemory {
  id: string;
  storyletId: string;                   // Source storylet
  choiceId: string;                     // Player choice
  description: string;                  // What they remember
  sentiment: "positive" | "neutral" | "negative";
  importance: number;                   // 1-10, affects retention
  timestamp: Date;                      // When it happened
}
```

### Location and Scheduling
NPCs have location-based availability:
```typescript
interface NPCLocation {
  id: string;                           // "library", "dining_hall"
  name: string;                         // "Main Library"
  probability: number;                  // 0-1 chance of being there
  timeRanges?: string[];                // ["14:00-16:00", "18:00-20:00"]
}
```

### NPC Store Functions (`/src/store/useNPCStore.ts`)
```typescript
// Relationship Management
adjustRelationship(npcId: string, delta: number, reason?: string)
setRelationshipType(npcId: string, type: RelationshipType)
getRelationshipLevel(npcId: string): number

// Memory Management
addMemory(npcId: string, memory: NPCMemoryInput, storyletId: string, choiceId: string)
getMemories(npcId: string): NPCMemory[]
getMemoriesBySentiment(npcId: string, sentiment: string): NPCMemory[]

// Location and Availability
getNPCsByLocation(locationId: string, currentTime?: Date): NPC[]
isNPCAvailableAt(npcId: string, locationId: string, time?: Date): boolean

// Storylet Integration
getNPCsForStorylet(storyletId: string): NPC[]
addStoryletToNPC(npcId: string, storyletId: string)
```

## 4. System Integration

### Storylet-NPC Integration
Storylets can affect NPCs through effects:
```typescript
// Relationship changes
{ type: "npcRelationship", npcId: "emma", delta: 5, reason: "Helped with studies" }

// Memory creation
{ type: "npcMemory", npcId: "emma", memory: { 
  description: "Player helped me with philosophy assignment", 
  sentiment: "positive", 
  importance: 7 
}}

// Flag setting
{ type: "npcFlag", npcId: "emma", flag: "study_partner", value: true }

// Status changes
{ type: "npcMood", npcId: "emma", mood: "happy", duration: 3600 }
```

### NPC-Triggered Storylets
Storylets can be triggered by NPC states:
```typescript
// Relationship-based triggers
trigger: { 
  type: "npc_relationship", 
  conditions: { npcId: "emma", minLevel: 70, relationshipType: "close_friend" } 
}

// Availability-based triggers
trigger: { 
  type: "npc_availability", 
  conditions: { npcId: "emma", locationId: "library", availability: "available" } 
}
```

### Cross-System Effects
Effects can cascade across systems:
1. Player chooses storylet option
2. Resource changes applied to AppStore
3. Skill XP awarded to SkillSystem
4. NPC relationship adjusted in NPCStore
5. NPC memory created
6. New storylets unlocked based on changed conditions
7. Story arc progress updated

## 5. Quest Engine Legacy

The original Quest Engine (`/src/engine/questEngine.ts`) handles resource-based events:
- High stress warnings
- Low energy concerns
- Social isolation
- Financial troubles
- Academic breakthroughs

This system works alongside storylets for reactive content based on resource thresholds.

## 6. Development and Testing

### Console Tools
```javascript
// Storylet testing
testStorylets()                     // Show current state
resetStorylets()                    // Reset all progress
useStoryletStore.getState().evaluateStorylets()  // Force evaluation

// NPC testing
useNPCStore.getState().getStats()   // Get NPC statistics
useNPCStore.getState().resetNPCRelationships()  // Reset relationships

// Flag manipulation
useStoryletStore.getState().setFlag("test_flag", true)
useStoryletStore.getState().getFlag("test_flag")
```

### Development Features
- **Deployment Filtering**: Show/hide content by deployment status
- **Real-time Evaluation**: Storylets re-evaluate on state changes
- **Debug Logging**: Comprehensive console output in development mode
- **Manual Triggers**: Force storylet unlocks for testing

## 7. Data Flow

### Typical Storylet Execution Flow
1. **Trigger Evaluation**: `evaluateStorylets()` checks all storylets against current conditions
2. **Storylet Unlock**: Matching storylets added to `activeStoryletIds`
3. **Player Choice**: User selects choice in `StoryletPanel` component
4. **Effect Application**: `chooseStorylet()` processes all effects via `applyEffect()`
5. **Resource Updates**: Resources/skills updated in respective stores
6. **NPC Updates**: Relationship/memory changes applied to NPCStore
7. **Flag Setting**: Boolean flags set for future storylet triggers
8. **Storylet Completion**: Storylet moved to `completedStoryletIds`
9. **Chain Progression**: If `nextStoryletId` exists, unlock next storylet
10. **Re-evaluation**: System re-evaluates for newly available storylets

### Cross-Arc Influence Example
Emma Romance Arc affecting Political Awareness Arc:
1. Player builds intellectual connection with Emma
2. `emma_romance:intellectual_connection` flag set
3. Political storylets check for Emma influence
4. New political storylets unlock with Emma-influenced choices
5. Player's political development shaped by relationship with Emma

## 8. Performance Considerations

### Optimization Patterns
- **Selective Evaluation**: Only evaluate storylets when conditions could have changed
- **Cooldown System**: Prevent resource-based storylets from triggering too frequently
- **Memory Limits**: NPCs maintain only top 50 most important/recent memories
- **Lazy Loading**: Story arcs loaded on-demand
- **Efficient Triggers**: Use Set operations for flag checks

### Memory Management
- **Storylet Cooldowns**: Automatic cleanup of old cooldown entries
- **NPC Memory Pruning**: Keep only most important memories (importance + recency)
- **Flag Cleanup**: Remove obsolete flags during arc completion
- **State Persistence**: Use Zustand persistence for save/load functionality

## 9. Future Extensions

### Planned Features
- **Dynamic Story Generation**: AI-generated storylets based on player behavior
- **Multi-Character Arcs**: Storylets involving multiple NPCs simultaneously
- **Seasonal Events**: Time-based storylets tied to academic calendar
- **Reputation System**: Campus-wide reputation affecting NPC interactions
- **Location-Based Stories**: Storylets that only trigger in specific locations

### Technical Roadmap
- **Performance Monitoring**: Track storylet evaluation performance
- **Analytics Integration**: Player choice tracking and arc completion rates
- **Content Management**: Admin interface for storylet creation/editing
- **Localization Support**: Multi-language storylet content
- **Mobile Optimization**: Touch-friendly storylet interface

## 10. Best Practices

### Creating New Storylets
1. **Clear Triggers**: Use specific, testable trigger conditions
2. **Meaningful Choices**: Each choice should feel distinctly different
3. **Proportional Effects**: Consequences should match choice significance
4. **Arc Integration**: Consider how storylet fits into larger narrative
5. **NPC Consistency**: Maintain character voice and personality
6. **Testing Coverage**: Include dev/stage deployment for testing

### Managing Story Arcs
1. **Clear Entry Points**: Multiple ways to start arc based on player type
2. **Failure States**: Provide meaningful consequences for poor choices
3. **Cross-Arc Influence**: Consider how arcs affect each other
4. **Completion Tracking**: Use consistent flag naming conventions
5. **Resolution Quality**: Satisfying conclusions for all arc paths

### NPC Development
1. **Personality Consistency**: Maintain character traits across interactions
2. **Memory Relevance**: Create memories that feel natural and important
3. **Relationship Progression**: Logical relationship development over time
4. **Location Logic**: Realistic availability patterns
5. **Story Integration**: Clear connections to relevant storylets

This narrative system architecture provides a robust foundation for creating engaging, branching storylines that respond dynamically to player choices, relationship development, and character progression within the life simulation experience.