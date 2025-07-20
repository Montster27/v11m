// V12 Pattern: EventBus for decoupling components and engines
// This enables loose coupling between modules without direct store dependencies

export interface GameEvent {
  type: string;
  payload?: any;
  timestamp?: number;
  source?: string;
}

export interface EventListener {
  (event: GameEvent): void | Promise<void>;
}

export class EventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private wildcardListeners: Set<EventListener> = new Set();
  
  // Subscribe to specific event types
  on(eventType: string, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener);
      if (this.listeners.get(eventType)?.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }
  
  // Subscribe to all events (wildcard)
  onAny(listener: EventListener): () => void {
    this.wildcardListeners.add(listener);
    
    return () => {
      this.wildcardListeners.delete(listener);
    };
  }
  
  // Emit an event
  async emit(event: GameEvent | string, payload?: any): Promise<void> {
    const gameEvent: GameEvent = typeof event === 'string' 
      ? { type: event, payload, timestamp: Date.now() }
      : { ...event, timestamp: event.timestamp || Date.now() };
    
    // Emit to specific listeners
    const specificListeners = this.listeners.get(gameEvent.type);
    if (specificListeners) {
      const promises = Array.from(specificListeners).map(listener => 
        Promise.resolve(listener(gameEvent))
      );
      await Promise.all(promises);
    }
    
    // Emit to wildcard listeners
    if (this.wildcardListeners.size > 0) {
      const promises = Array.from(this.wildcardListeners).map(listener =>
        Promise.resolve(listener(gameEvent))
      );
      await Promise.all(promises);
    }
  }
  
  // Remove all listeners for an event type
  off(eventType: string): void {
    this.listeners.delete(eventType);
  }
  
  // Remove all listeners
  clear(): void {
    this.listeners.clear();
    this.wildcardListeners.clear();
  }
  
  // Get listener count for debugging
  getListenerCount(eventType?: string): number {
    if (eventType) {
      return this.listeners.get(eventType)?.size || 0;
    }
    
    let total = this.wildcardListeners.size;
    for (const listeners of this.listeners.values()) {
      total += listeners.size;
    }
    return total;
  }
}

// Global event bus instance (V12 pattern)
export const globalEventBus = new EventBus();

// Typed event creators for better DX
export const createEvent = {
  storylet: {
    activated: (storyletId: string): GameEvent => ({
      type: 'storylet.activated',
      payload: { storyletId }
    }),
    completed: (storyletId: string, outcome?: any): GameEvent => ({
      type: 'storylet.completed',
      payload: { storyletId, outcome }
    }),
    evaluate: (): GameEvent => ({
      type: 'storylets.evaluate'
    })
  },
  
  resource: {
    updated: (resource: string, value: number, delta: number): GameEvent => ({
      type: 'resource.updated',
      payload: { resource, value, delta }
    }),
    depleted: (resource: string): GameEvent => ({
      type: 'resource.depleted',
      payload: { resource }
    })
  },
  
  time: {
    dayAdvanced: (newDay: number): GameEvent => ({
      type: 'time.dayAdvanced',
      payload: { newDay }
    }),
    allocationChanged: (activity: string, value: number): GameEvent => ({
      type: 'time.allocationChanged',
      payload: { activity, value }
    })
  },
  
  game: {
    crashed: (type: 'exhaustion' | 'burnout'): GameEvent => ({
      type: 'game.crashed',
      payload: { type }
    }),
    recovered: (): GameEvent => ({
      type: 'game.recovered'
    })
  }
};

// Example usage patterns:
// 
// // Engine module (no direct store access)
// class NarrativeEngine {
//   constructor(private eventBus: EventBus) {
//     this.eventBus.on('time.dayAdvanced', this.evaluateStorylets);
//   }
//   
//   private evaluateStorylets = async (event: GameEvent) => {
//     // Evaluate storylets
//     this.eventBus.emit(createEvent.storylet.activated('tutorial'));
//   };
// }
//
// // Component (subscribes to events)
// const StoryletPanel = () => {
//   useEffect(() => {
//     const unsubscribe = globalEventBus.on('storylet.activated', (event) => {
//       // Update UI
//     });
//     return unsubscribe;
//   }, []);
// };
//
// // Store action (emits events)
// const updateTimeAllocation = (key: string, value: number) => {
//   // Update store
//   set((state) => /* ... */);
//   
//   // Emit event for other systems
//   globalEventBus.emit(createEvent.time.allocationChanged(key, value));
// };