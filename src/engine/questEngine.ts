// /Users/montysharma/V11M2/src/engine/questEngine.ts

// Define the required types locally to avoid circular dependencies
type AppStoreState = {
  resources: {
    energy: number;
    stress: number;
    money: number;
    knowledge: number;
    social: number;
  };
  day: number;
};

interface QuestCondition {
  type: 'resource' | 'time' | 'day';
  resource?: keyof AppStoreState['resources'];
  operator: '>=' | '<=' | '>' | '<' | '=';
  value: number;
}

interface QuestEvent {
  id: string;
  title: string;
  description: string;
  conditions: QuestCondition[];
  choices: {
    id: string;
    title: string;
    description?: string;
    consequences: {
      stat: string;
      value: number;
      color: string;
    }[];
  }[];
  priority: number; // Higher number = higher priority
}

// Sample events that can be triggered based on conditions
const AVAILABLE_EVENTS: QuestEvent[] = [
  {
    id: 'high-stress-warning',
    title: 'Feeling Overwhelmed',
    description: 'Your stress levels are getting quite high. You notice you\'re having trouble concentrating and feel anxious. How do you want to handle this?',
    conditions: [
      { type: 'resource', resource: 'stress', operator: '>=', value: 75 }
    ],
    choices: [
      {
        id: 'take-break',
        title: 'Take a Mental Health Break',
        description: 'Step back from work/study and focus on rest',
        consequences: [
          { stat: 'STRESS', value: -15, color: 'bg-green-500' },
          { stat: 'ENERGY', value: 10, color: 'bg-teal-500' },
          { stat: 'KNOWLEDGE', value: -5, color: 'bg-red-500' }
        ]
      },
      {
        id: 'push-through',
        title: 'Push Through It',
        description: 'Continue with current schedule despite stress',
        consequences: [
          { stat: 'STRESS', value: 5, color: 'bg-red-500' },
          { stat: 'KNOWLEDGE', value: 5, color: 'bg-blue-500' },
          { stat: 'ENERGY', value: -10, color: 'bg-red-500' }
        ]
      }
    ],
    priority: 8
  },
  {
    id: 'low-energy-concern',
    title: 'Running on Empty',
    description: 'You\'re feeling exhausted and finding it hard to focus on anything. Your body is telling you it needs rest.',
    conditions: [
      { type: 'resource', resource: 'energy', operator: '<=', value: 25 }
    ],
    choices: [
      {
        id: 'prioritize-sleep',
        title: 'Get Extra Sleep',
        description: 'Cancel plans and get some much-needed rest',
        consequences: [
          { stat: 'ENERGY', value: 20, color: 'bg-teal-500' },
          { stat: 'STRESS', value: -10, color: 'bg-green-500' },
          { stat: 'SOCIAL', value: -5, color: 'bg-red-500' }
        ]
      },
      {
        id: 'energy-drink',
        title: 'Rely on Caffeine',
        description: 'Use energy drinks/coffee to push through',
        consequences: [
          { stat: 'ENERGY', value: 15, color: 'bg-teal-500' },
          { stat: 'STRESS', value: 10, color: 'bg-red-500' },
          { stat: 'MONEY', value: -5, color: 'bg-red-500' }
        ]
      }
    ],
    priority: 9
  },
  {
    id: 'social-isolation',
    title: 'Feeling Lonely',
    description: 'You\'ve been so focused on work and studies that you haven\'t connected with friends in a while. You\'re starting to feel isolated.',
    conditions: [
      { type: 'resource', resource: 'social', operator: '<=', value: 30 }
    ],
    choices: [
      {
        id: 'reach-out',
        title: 'Reach Out to Friends',
        description: 'Make plans to hang out with friends',
        consequences: [
          { stat: 'SOCIAL', value: 20, color: 'bg-purple-500' },
          { stat: 'STRESS', value: -5, color: 'bg-green-500' },
          { stat: 'MONEY', value: -10, color: 'bg-red-500' }
        ]
      },
      {
        id: 'stay-focused',
        title: 'Stay Focused on Goals',
        description: 'Continue prioritizing work/study over social life',
        consequences: [
          { stat: 'KNOWLEDGE', value: 10, color: 'bg-blue-500' },
          { stat: 'SOCIAL', value: -5, color: 'bg-red-500' },
          { stat: 'STRESS', value: 5, color: 'bg-red-500' }
        ]
      }
    ],
    priority: 6
  },
  {
    id: 'money-troubles',
    title: 'Financial Concerns',
    description: 'Your money is running low, and you\'re starting to worry about your finances. You need to make some decisions about spending and earning.',
    conditions: [
      { type: 'resource', resource: 'money', operator: '<=', value: 50 }
    ],
    choices: [
      {
        id: 'find-work',
        title: 'Look for Extra Work',
        description: 'Spend time finding additional income sources',
        consequences: [
          { stat: 'MONEY', value: 30, color: 'bg-green-500' },
          { stat: 'ENERGY', value: -10, color: 'bg-red-500' },
          { stat: 'KNOWLEDGE', value: -5, color: 'bg-red-500' }
        ]
      },
      {
        id: 'cut-expenses',
        title: 'Cut Back on Spending',
        description: 'Reduce social activities and entertainment',
        consequences: [
          { stat: 'MONEY', value: 10, color: 'bg-green-500' },
          { stat: 'SOCIAL', value: -10, color: 'bg-red-500' },
          { stat: 'STRESS', value: 5, color: 'bg-red-500' }
        ]
      }
    ],
    priority: 7
  },
  {
    id: 'knowledge-breakthrough',
    title: 'Academic Success',
    description: 'Your studies have been going really well! You\'re understanding complex concepts and feeling confident about your progress.',
    conditions: [
      { type: 'resource', resource: 'knowledge', operator: '>=', value: 80 }
    ],
    choices: [
      {
        id: 'share-knowledge',
        title: 'Help Others Learn',
        description: 'Tutor classmates and share your knowledge',
        consequences: [
          { stat: 'SOCIAL', value: 15, color: 'bg-purple-500' },
          { stat: 'KNOWLEDGE', value: 5, color: 'bg-blue-500' },
          { stat: 'MONEY', value: 10, color: 'bg-green-500' }
        ]
      },
      {
        id: 'advance-studies',
        title: 'Pursue Advanced Topics',
        description: 'Dive deeper into challenging subjects',
        consequences: [
          { stat: 'KNOWLEDGE', value: 10, color: 'bg-blue-500' },
          { stat: 'STRESS', value: 5, color: 'bg-red-500' },
          { stat: 'ENERGY', value: -5, color: 'bg-red-500' }
        ]
      }
    ],
    priority: 4
  }
];

// Previously triggered events to avoid repetition
let triggeredEvents: Set<string> = new Set();

// Quest Engine class
export class QuestEngine {
  // Evaluate current state and return appropriate event
  evaluate(currentState: AppStoreState): QuestEvent | null {
    // Find all events that meet their conditions
    const eligibleEvents = AVAILABLE_EVENTS.filter(event => 
      this.meetsConditions(event.conditions, currentState) && !triggeredEvents.has(event.id)
    );

    if (eligibleEvents.length === 0) {
      return null;
    }

    // Sort by priority and return the highest priority event
    eligibleEvents.sort((a, b) => b.priority - a.priority);
    const selectedEvent = eligibleEvents[0];
    
    // Mark as triggered to avoid immediate repetition
    triggeredEvents.add(selectedEvent.id);
    
    // Clear triggered events after some time to allow events to repeat
    if (triggeredEvents.size > 5) {
      const eventsArray = Array.from(triggeredEvents);
      triggeredEvents.clear();
      // Keep only the most recent 3 events
      eventsArray.slice(-3).forEach(id => triggeredEvents.add(id));
    }
    
    return selectedEvent;
  }

  // Check if conditions are met
  private meetsConditions(conditions: QuestCondition[], state: AppStoreState): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'resource':
          if (!condition.resource) return false;
          const resourceValue = state.resources[condition.resource];
          return this.evaluateCondition(resourceValue, condition.operator, condition.value);
        
        case 'day':
          return this.evaluateCondition(state.day, condition.operator, condition.value);
        
        default:
          return false;
      }
    });
  }

  // Evaluate a single condition
  private evaluateCondition(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case '>=': return actual >= expected;
      case '<=': return actual <= expected;
      case '>': return actual > expected;
      case '<': return actual < expected;
      case '=': return actual === expected;
      default: return false;
    }
  }

  // Reset triggered events (for testing or when starting new game)
  resetTriggeredEvents(): void {
    triggeredEvents.clear();
  }
}

// Create singleton instance
export const questEngine = new QuestEngine();