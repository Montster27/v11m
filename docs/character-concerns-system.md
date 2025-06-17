# Character Concerns System

## Overview

The Character Concerns System allows players to define their character's priorities and worries before character creation, providing rich narrative personalization throughout the game. Players distribute 50 points across 7 key concern areas, which then generate flags for storylet triggers.

## The 7 Concern Areas

### 1. Academic Performance (`academics`)
- **Description**: Concerns about grades, studying, and academic success
- **1980s Context**: College is competitive, and academic performance affects future opportunities
- **Storylet Uses**: Study habits, exam stress, academic achievement storylets

### 2. Social Fitting In (`socialFitting`)
- **Description**: Worries about making friends, being accepted, and social status
- **1980s Context**: Social connections are crucial for college life and networking
- **Storylet Uses**: Party invitations, social groups, peer pressure storylets

### 3. Financial Pressures (`financial`)
- **Description**: Money concerns including tuition, living expenses, and debt
- **1980s Context**: College costs are rising, and many students work while studying
- **Storylet Uses**: Job opportunities, spending decisions, financial aid storylets

### 4. Being Isolated (`isolation`)
- **Description**: Fear of loneliness and not finding your place or community
- **1980s Context**: Large campuses can feel impersonal, and it's easy to feel lost
- **Storylet Uses**: Roommate issues, weekend activities, reaching out storylets

### 5. Gender Issues (`genderIssues`)
- **Description**: Challenges related to gender expectations and equality
- **1980s Context**: Evolving gender roles, workplace equality debates, changing expectations
- **Storylet Uses**: Career path decisions, relationship dynamics, workplace scenarios

### 6. Racial Issues (`raceIssues`)
- **Description**: Experiences with racial dynamics and representation
- **1980s Context**: Civil rights progress continued, but institutional challenges remained
- **Storylet Uses**: Campus diversity, cultural events, discrimination scenarios

### 7. Social Class Issues (`classIssues`)
- **Description**: Economic background differences and class-based social dynamics
- **1980s Context**: Economic disparities affecting opportunities and social acceptance
- **Storylet Uses**: Cultural capital, networking events, lifestyle differences

## Point Distribution System

### Interface Features
- **50 Total Points**: Forces meaningful prioritization
- **Slider Controls**: Intuitive 0-50 point allocation per concern
- **Quick Buttons**: Fast set to 0, 10, or 20 points
- **Visual Feedback**: Progress bar and color-coded sliders
- **Real-time Validation**: Can't exceed 50 total points
- **Helper Functions**: Reset all or distribute evenly

### UI Components
```typescript
interface CharacterConcerns {
  academics: number;
  socialFitting: number;
  financial: number;
  isolation: number;
  genderIssues: number;
  raceIssues: number;
  classIssues: number;
}
```

## Flag Generation System

### Basic Flags
For each concern (e.g., `academics`):
- `concern_academics`: True if value > 0
- `concern_academics_none`: True if value = 0
- `concern_academics_low`: True if 1-10 points
- `concern_academics_moderate`: True if 11-20 points
- `concern_academics_high`: True if 21-30 points
- `concern_academics_extreme`: True if 31+ points

### Threshold Flags
For storylet trigger flexibility:
- `concern_academics_5plus`: True if ≥ 5 points
- `concern_academics_10plus`: True if ≥ 10 points
- `concern_academics_15plus`: True if ≥ 15 points
- `concern_academics_20plus`: True if ≥ 20 points
- `concern_academics_25plus`: True if ≥ 25 points

### Profile Flags
Character archetype identification:
- `primary_concern_academics`: True if academics is highest concern ≥15
- `secondary_concern_financial`: True if financial is second highest ≥10
- `has_primary_concern`: True if any concern ≥15
- `has_secondary_concern`: True if any second concern ≥10

### Combination Flags
Complex character patterns:
- `socially_concerned`: True if socialFitting ≥15 OR isolation ≥15
- `financially_stressed`: True if financial ≥15
- `academically_focused`: True if academics ≥20
- `culturally_aware`: True if (gender + race + class) ≥25
- `highly_concerned`: True if any concern ≥25
- `well_balanced`: True if all concerns 5-15 (no extremes)
- `minimally_concerned`: True if all concerns ≤10
- `social_and_isolated`: True if both social concerns ≥10
- `academic_and_financial`: True if both ≥15
- `cultural_issues_focused`: True if any cultural concern ≥10

## Storylet Integration

### Trigger Examples
```javascript
// Academic pressure storylet
trigger: {
  type: 'flag',
  conditions: { flags: ['concern_academics_high'] }
}

// Social anxiety storylet  
trigger: {
  type: 'flag',
  conditions: { flags: ['socially_concerned'] }
}

// Financial stress storylet
trigger: {
  type: 'flag', 
  conditions: { flags: ['concern_financial_15plus'] }
}

// Cultural awareness storylet
trigger: {
  type: 'flag',
  conditions: { flags: ['culturally_aware', 'cultural_issues_focused'] }
}
```

### Effect Examples
```javascript
// Academic storylet effects
effects: [
  { type: 'resource', key: 'stress', delta: 5 },
  { type: 'resource', key: 'knowledge', delta: 15 },
  { type: 'flag', key: 'academic_preparation_intense', value: true }
]

// Social storylet effects  
effects: [
  { type: 'resource', key: 'social', delta: 10 },
  { type: 'flag', key: 'joined_study_group', value: true }
]
```

## Character Creation Flow

### New Workflow
1. **Character Concerns** → Distribute 50 points across 7 areas
2. **Character Creation** → Name, appearance, skill adjustments
3. **Game Start** → Concerns influence available storylets

### Navigation
- **Back Button**: Return to concerns from character creation
- **Continue Button**: Only enabled when 50 points distributed
- **Reset/Even Distribution**: Helper buttons for quick setup

## Development Features

### Console Functions
```javascript
// Test concern flag generation
testConcernFlagGeneration();

// Create test storylets using concern flags
createTestConcernStorylets();

// Check specific concern flags
checkConcernFlag('concern_academics_high');

// Get concern values
getConcernValue('academics'); // Returns 0-50
getConcernLevel('academics'); // Returns 'none'|'low'|'moderate'|'high'|'extreme'
```

### Store Integration
- **Persistent Storage**: Concerns saved with character data
- **Flag Integration**: Automatically merged with storylet evaluation
- **Global Access**: Available to storylet system and other components

## Design Benefits

### For Players
- **Meaningful Choices**: Forces prioritization of character values
- **Personalized Narrative**: Storylets reflect individual concerns
- **Character Depth**: Rich psychological profile creation
- **Authentic Experience**: Concerns match real college student priorities

### For Narrative Design
- **Targeted Content**: Create storylets for specific character types
- **Branching Narratives**: Multiple paths based on concern profiles
- **Character Development**: Track how concerns evolve over time
- **Authentic Scenarios**: Address real 1980s college issues

### For Game Balance
- **Content Gating**: Ensure different players see different content
- **Replayability**: Different concern profiles = different experiences
- **Character Variety**: Support diverse character archetypes
- **Narrative Coherence**: Character actions match stated values

## Example Character Profiles

### The Academic Achiever
- `academics: 25, financial: 15, isolation: 10`
- Flags: `academically_focused`, `concern_academics_extreme`, `financially_stressed`
- Storylets: Study groups, exam stress, academic competitions

### The Social Butterfly
- `socialFitting: 20, isolation: 15, academics: 15`
- Flags: `socially_concerned`, `social_and_isolated`, `has_primary_concern`
- Storylets: Party invitations, social anxiety, friendship drama

### The Culturally Aware Activist
- `genderIssues: 15, raceIssues: 15, classIssues: 20`
- Flags: `culturally_aware`, `cultural_issues_focused`, `primary_concern_classIssues`
- Storylets: Campus activism, discrimination scenarios, social justice

### The Balanced Student
- `academics: 8, socialFitting: 7, financial: 8, isolation: 6, genderIssues: 7, raceIssues: 7, classIssues: 7`
- Flags: `well_balanced`, `minimally_concerned`
- Storylets: Leadership opportunities, helping others, exploration

This system provides rich character personalization while maintaining narrative coherence and supporting diverse player experiences.