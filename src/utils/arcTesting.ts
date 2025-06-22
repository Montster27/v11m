// Arc Testing Framework
// Provides interactive testing and validation of story arcs with playthrough simulation

import type { Storylet, Choice, Effect, Trigger } from '../types/storylet';

export interface TestingGameState {
  day: number;
  resources: Record<string, number>;
  flags: Record<string, boolean>;
  activeStoryletIds: string[];
  completedStoryletIds: string[];
  storyletCooldowns: Record<string, number>;
}

export interface PlaythroughStep {
  id: string;
  storyletId: string;
  storylet: Storylet;
  choiceId?: string;
  choice?: Choice;
  timestamp: number;
  gameStateBefore: TestingGameState;
  gameStateAfter: TestingGameState;
  effects: Effect[];
  unlockedStorylets: string[];
  flags: string[];
}

export interface ArcTestSession {
  arcName: string;
  sessionId: string;
  startTime: number;
  currentStepIndex: number;
  steps: PlaythroughStep[];
  gameState: TestingGameState;
  availableStorylets: string[];
  branchingPoints: { stepIndex: number; choices: Choice[] }[];
  metadata: {
    totalStorylets: number;
    completedStorylets: number;
    exploredPaths: number;
    issues: ArcIssue[];
  };
  // Clue discovery state
  pendingClueDiscovery?: {
    clueId: string;
    minigameType?: string;
    onSuccess?: Effect[];
    onFailure?: Effect[];
    stepIndex: number;
  };
}

export interface ArcIssue {
  type: 'dead_end' | 'unreachable' | 'broken_trigger' | 'missing_storylet' | 'infinite_loop' | 'resource_imbalance';
  severity: 'error' | 'warning' | 'info';
  storyletId?: string;
  choiceId?: string;
  message: string;
  suggestion?: string;
}

export interface ArcTestResults {
  arcName: string;
  totalStorylets: number;
  reachableStorylets: number;
  unreachableStorylets: string[];
  deadEndStorylets: string[];
  branchingPoints: number;
  averagePathLength: number;
  longestPath: number;
  shortestPath: number;
  issues: ArcIssue[];
  completeness: number; // 0-100%
  playability: number; // 0-100%
}

export class ArcTester {
  private storylets: Record<string, Storylet>;
  private arcName: string;
  private session: ArcTestSession | null = null;

  constructor(storylets: Record<string, Storylet>, arcName: string) {
    this.storylets = storylets;
    this.arcName = arcName;
  }

  /**
   * Start a new testing session for the arc
   */
  startTestSession(): ArcTestSession {
    const arcStorylets = this.getArcStorylets();
    const entryPoints = this.findEntryPoints(arcStorylets);
    
    if (entryPoints.length === 0) {
      throw new Error(`No entry points found for arc "${this.arcName}"`);
    }

    const initialGameState: TestingGameState = {
      day: 1,
      resources: {
        energy: 100,
        stress: 0,
        knowledge: 0,
        social: 0,
        money: 100
      },
      flags: {},
      activeStoryletIds: [],
      completedStoryletIds: [],
      storyletCooldowns: {}
    };

    // Evaluate which storylets should be initially available
    const availableStorylets = this.evaluateAvailableStorylets(arcStorylets, initialGameState);

    this.session = {
      arcName: this.arcName,
      sessionId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      currentStepIndex: -1,
      steps: [],
      gameState: { ...initialGameState },
      availableStorylets,
      branchingPoints: [],
      metadata: {
        totalStorylets: arcStorylets.length,
        completedStorylets: 0,
        exploredPaths: 0,
        issues: []
      }
    };

    console.log(`🧪 Started arc test session for "${this.arcName}"`, {
      totalStorylets: arcStorylets.length,
      entryPoints: entryPoints.length,
      availableStorylets: availableStorylets.length
    });

    return this.session;
  }

  /**
   * Execute a storylet choice and advance the test session
   */
  executeChoice(storyletId: string, choiceId: string): PlaythroughStep {
    if (!this.session) {
      throw new Error('No active test session');
    }

    const storylet = this.storylets[storyletId];
    if (!storylet) {
      throw new Error(`Storylet not found: ${storyletId}`);
    }

    const choice = storylet.choices.find(c => c.id === choiceId);
    if (!choice) {
      throw new Error(`Choice not found: ${choiceId} in storylet ${storyletId}`);
    }

    // Check for clue discovery effects (both camelCase and snake_case)
    console.log(`🔍 Choice effects:`, choice.effects);
    const clueDiscoveryEffect = choice.effects.find(effect => 
      effect.type === 'clueDiscovery' || effect.type === 'clue_discovery'
    );
    console.log(`🔍 Found clueDiscovery effect:`, clueDiscoveryEffect);
    
    if (clueDiscoveryEffect) {
      // Set up pending clue discovery - handle different field names
      const clueId = clueDiscoveryEffect.clueId || clueDiscoveryEffect.value;
      const minigameType = clueDiscoveryEffect.minigameType || 'memory_cards'; // default minigame
      
      this.session.pendingClueDiscovery = {
        clueId: clueId,
        minigameType: minigameType,
        onSuccess: clueDiscoveryEffect.onSuccess,
        onFailure: clueDiscoveryEffect.onFailure,
        stepIndex: this.session.steps.length
      };
      
      console.log(`🔍 Clue discovery effect detected: ${clueId} with minigame: ${minigameType}`);
      console.log(`🔍 Full effect:`, clueDiscoveryEffect);
      console.log(`🔍 Set pending clue discovery:`, this.session.pendingClueDiscovery);
    } else {
      console.log(`ℹ️ No clue discovery effect found in choice effects`);
    }

    const gameStateBefore = { ...this.session.gameState };
    const gameStateAfter = this.applyEffects(choice.effects, { ...gameStateBefore });
    
    // Track unlocked storylets
    const unlockedStorylets: string[] = [];
    choice.effects.forEach(effect => {
      if (effect.type === 'unlock' && effect.storyletId) {
        unlockedStorylets.push(effect.storyletId);
      }
    });

    // Track flags set
    const flags: string[] = [];
    choice.effects.forEach(effect => {
      if (effect.type === 'flag') {
        flags.push(`${effect.key}=${effect.value}`);
      }
    });

    const step: PlaythroughStep = {
      id: `step_${this.session.steps.length}`,
      storyletId,
      storylet,
      choiceId,
      choice,
      timestamp: Date.now(),
      gameStateBefore,
      gameStateAfter,
      effects: choice.effects,
      unlockedStorylets,
      flags
    };

    // Update session state
    this.session.gameState = gameStateAfter;
    this.session.steps.push(step);
    this.session.currentStepIndex = this.session.steps.length - 1;
    
    // Mark storylet as completed
    if (!this.session.gameState.completedStoryletIds.includes(storyletId)) {
      this.session.gameState.completedStoryletIds.push(storyletId);
      this.session.metadata.completedStorylets++;
    }

    // Check if this is a branching point (storylet with multiple choices)
    if (storylet.choices.length > 1) {
      const existingBranch = this.session.branchingPoints.find(
        bp => bp.stepIndex === this.session.currentStepIndex
      );
      if (!existingBranch) {
        this.session.branchingPoints.push({
          stepIndex: this.session.currentStepIndex,
          choices: storylet.choices
        });
      }
    }

    // Re-evaluate available storylets
    const arcStorylets = this.getArcStorylets();
    this.session.availableStorylets = this.evaluateAvailableStorylets(arcStorylets, this.session.gameState);

    // Handle next storylet if specified
    if (choice.nextStoryletId && this.storylets[choice.nextStoryletId]) {
      if (!this.session.availableStorylets.includes(choice.nextStoryletId)) {
        this.session.availableStorylets.push(choice.nextStoryletId);
      }
    }

    console.log(`🎭 Executed choice "${choice.text}" in storylet "${storylet.name}"`, {
      effects: choice.effects.length,
      unlockedStorylets: unlockedStorylets.length,
      availableNext: this.session.availableStorylets.length,
      clueDiscovery: !!clueDiscoveryEffect
    });

    return step;
  }

  /**
   * Go back to a previous step and restore game state
   */
  goToStep(stepIndex: number): void {
    if (!this.session) {
      throw new Error('No active test session');
    }

    if (stepIndex < 0 || stepIndex >= this.session.steps.length) {
      throw new Error(`Invalid step index: ${stepIndex}`);
    }

    // Restore to the game state after the specified step
    const targetStep = this.session.steps[stepIndex];
    this.session.currentStepIndex = stepIndex;
    this.session.gameState = { ...targetStep.gameStateAfter };

    // Truncate steps after the target step
    this.session.steps = this.session.steps.slice(0, stepIndex + 1);

    // Re-evaluate available storylets from this state
    const arcStorylets = this.getArcStorylets();
    this.session.availableStorylets = this.evaluateAvailableStorylets(arcStorylets, this.session.gameState);

    console.log(`⏪ Restored to step ${stepIndex}: "${targetStep.storylet.name}"`, {
      gameState: this.session.gameState,
      availableStorylets: this.session.availableStorylets.length
    });
  }

  /**
   * Complete a pending clue discovery with success or failure
   */
  completeClueDiscovery(success: boolean): void {
    if (!this.session || !this.session.pendingClueDiscovery) {
      throw new Error('No pending clue discovery to complete');
    }

    const pendingClue = this.session.pendingClueDiscovery;
    const effects = success ? (pendingClue.onSuccess || []) : (pendingClue.onFailure || []);
    
    console.log(`🎯 Clue discovery ${success ? 'succeeded' : 'failed'}: ${pendingClue.clueId}`, {
      effectsToApply: effects.length,
      minigameType: pendingClue.minigameType
    });

    // If no specific effects are defined, create default effects
    if (effects.length === 0 && success) {
      console.log(`🎯 No specific success effects defined, marking clue as discovered`);
      // Add a flag to mark the clue as discovered
      const defaultEffect = {
        type: 'flag' as const,
        key: `clue_discovered_${pendingClue.clueId}`,
        value: true
      };
      this.session.gameState = this.applyEffects([defaultEffect], this.session.gameState);
      
      // Update the step with the default effect
      const stepIndex = pendingClue.stepIndex;
      if (this.session.steps[stepIndex]) {
        this.session.steps[stepIndex].effects = [
          ...this.session.steps[stepIndex].effects,
          defaultEffect
        ];
      }
    } else if (effects.length > 0) {
      // Apply success/failure effects
      this.session.gameState = this.applyEffects(effects, this.session.gameState);
      
      // Update the step with the additional effects
      const stepIndex = pendingClue.stepIndex;
      if (this.session.steps[stepIndex]) {
        this.session.steps[stepIndex].effects = [
          ...this.session.steps[stepIndex].effects,
          ...effects
        ];
      }
    }

    // Clear pending clue discovery
    this.session.pendingClueDiscovery = undefined;

    // Re-evaluate available storylets after clue effects
    const arcStorylets = this.getArcStorylets();
    this.session.availableStorylets = this.evaluateAvailableStorylets(arcStorylets, this.session.gameState);
  }

  /**
   * Check if there's a pending clue discovery
   */
  hasPendingClueDiscovery(): boolean {
    return !!(this.session && this.session.pendingClueDiscovery);
  }

  /**
   * Get pending clue discovery details
   */
  getPendingClueDiscovery() {
    return this.session?.pendingClueDiscovery || null;
  }

  /**
   * Get current session state
   */
  getSession(): ArcTestSession | null {
    return this.session;
  }

  /**
   * Get all storylets in the current arc
   */
  private getArcStorylets(): Storylet[] {
    return Object.values(this.storylets).filter(storylet => storylet.storyArc === this.arcName);
  }

  /**
   * Find entry points (storylets that can be triggered initially)
   */
  private findEntryPoints(storylets: Storylet[]): Storylet[] {
    const entryPoints = storylets.filter(storylet => {
      const trigger = storylet.trigger;
      
      // Time-based triggers that start early
      if (trigger.type === 'time') {
        const dayReq = trigger.conditions?.day;
        const weekReq = trigger.conditions?.week;
        return (dayReq && dayReq <= 7) || (weekReq && weekReq <= 1);
      }
      
      // Flag triggers with common starting flags
      if (trigger.type === 'flag') {
        const flags = trigger.conditions?.flags || [];
        return flags.some((flag: string) => 
          flag.includes('start') || 
          flag.includes('college') || 
          flag.includes('begin')
        );
      }
      
      // Resource triggers with low requirements
      if (trigger.type === 'resource') {
        return true; // Most resource triggers can be entry points
      }
      
      return false;
    });
    
    // If no traditional entry points found, use any time-based trigger as fallback
    if (entryPoints.length === 0) {
      console.log(`⚠️ No traditional entry points found for arc "${this.arcName}", using time-based triggers as fallback`);
      const timeBasedStorylets = storylets.filter(s => s.trigger.type === 'time');
      if (timeBasedStorylets.length > 0) {
        console.log(`📍 Found ${timeBasedStorylets.length} time-based storylets as entry points`);
        return timeBasedStorylets;
      }
    }
    
    // Final fallback: use the first storylet if nothing else works
    if (entryPoints.length === 0 && storylets.length > 0) {
      console.log(`⚠️ No time-based triggers found, using first storylet as entry point for testing`);
      return [storylets[0]];
    }
    
    return entryPoints;
  }

  /**
   * Evaluate which storylets should be available given the current game state
   */
  private evaluateAvailableStorylets(storylets: Storylet[], gameState: TestingGameState): string[] {
    const available: string[] = [];

    for (const storylet of storylets) {
      // Skip if already completed (unless it's repeatable)
      if (gameState.completedStoryletIds.includes(storylet.id)) {
        if (storylet.trigger.type !== 'resource') {
          continue;
        }
      }

      // Skip if on cooldown
      if (gameState.storyletCooldowns[storylet.id] && 
          gameState.day < gameState.storyletCooldowns[storylet.id]) {
        continue;
      }

      // Check if trigger conditions are met
      if (this.evaluateTrigger(storylet.trigger, gameState)) {
        available.push(storylet.id);
      }
    }

    return available;
  }

  /**
   * Evaluate if a trigger condition is met
   */
  private evaluateTrigger(trigger: Trigger, gameState: TestingGameState): boolean {
    switch (trigger.type) {
      case 'time':
        if (trigger.conditions?.day) {
          return gameState.day >= trigger.conditions.day;
        }
        if (trigger.conditions?.week) {
          return gameState.day >= (trigger.conditions.week * 7);
        }
        return false;

      case 'flag':
        const flags = trigger.conditions?.flags || [];
        return flags.some((flag: string) => gameState.flags[flag]);

      case 'resource':
        if (!trigger.conditions) return true;
        return Object.entries(trigger.conditions).every(([resource, condition]) => {
          if (typeof condition !== 'object') return true;
          const value = gameState.resources[resource];
          if (value === undefined) return false;
          
          if (condition.min !== undefined && value < condition.min) return false;
          if (condition.max !== undefined && value > condition.max) return false;
          return true;
        });

      default:
        return false;
    }
  }

  /**
   * Apply effects to game state
   */
  private applyEffects(effects: Effect[], gameState: TestingGameState): TestingGameState {
    const newState = { ...gameState };

    effects.forEach(effect => {
      switch (effect.type) {
        case 'resource':
          if (newState.resources[effect.key] !== undefined) {
            newState.resources[effect.key] = Math.max(0, newState.resources[effect.key] + effect.delta);
          }
          break;

        case 'flag':
          newState.flags[effect.key] = effect.value;
          break;

        case 'unlock':
          if (effect.storyletId && !newState.activeStoryletIds.includes(effect.storyletId)) {
            newState.activeStoryletIds.push(effect.storyletId);
          }
          break;

        case 'clueDiscovery':
        case 'clue_discovery':
          // Don't apply clue discovery effects immediately - they are handled separately
          // through the pending clue discovery mechanism
          const clueId = effect.clueId || effect.value;
          console.log(`📝 Clue discovery effect noted: ${clueId}`);
          break;

        default:
          console.log(`⚠️ Unhandled effect type in arc testing: ${(effect as any).type}`);
          break;
      }
    });

    return newState;
  }

  /**
   * Run comprehensive arc analysis
   */
  analyzeArc(): ArcTestResults {
    const arcStorylets = this.getArcStorylets();
    const entryPoints = this.findEntryPoints(arcStorylets);
    const issues: ArcIssue[] = [];

    // Find unreachable storylets
    const reachableStorylets = new Set<string>();
    const deadEndStorylets: string[] = [];
    
    // Simple reachability analysis
    const visited = new Set<string>();
    const queue = [...entryPoints.map(s => s.id)];
    
    while (queue.length > 0) {
      const storyletId = queue.shift()!;
      if (visited.has(storyletId)) continue;
      
      visited.add(storyletId);
      reachableStorylets.add(storyletId);
      
      const storylet = this.storylets[storyletId];
      if (!storylet) continue;
      
      // Check for dead ends (no valid next storylets)
      let hasValidNext = false;
      
      storylet.choices.forEach(choice => {
        if (choice.nextStoryletId) {
          queue.push(choice.nextStoryletId);
          hasValidNext = true;
        }
        
        // Check unlock effects
        choice.effects.forEach(effect => {
          if (effect.type === 'unlock' && effect.storyletId) {
            queue.push(effect.storyletId);
            hasValidNext = true;
          }
        });
      });
      
      if (!hasValidNext && storylet.choices.length > 0) {
        deadEndStorylets.push(storyletId);
      }
    }

    const unreachableStorylets = arcStorylets
      .filter(s => !reachableStorylets.has(s.id))
      .map(s => s.id);

    // Calculate metrics
    const totalStorylets = arcStorylets.length;
    const reachableCount = reachableStorylets.size;
    const completeness = totalStorylets > 0 ? (reachableCount / totalStorylets) * 100 : 0;
    const playability = Math.max(0, 100 - (issues.length * 10));

    // Add issues
    if (entryPoints.length === 0) {
      issues.push({
        type: 'unreachable',
        severity: 'error',
        message: 'No entry points found for this arc',
        suggestion: 'Add storylets with time-based triggers (day <= 7) or common starting flags'
      });
    }

    unreachableStorylets.forEach(storyletId => {
      issues.push({
        type: 'unreachable',
        severity: 'warning',
        storyletId,
        message: `Storylet "${storyletId}" is unreachable`,
        suggestion: 'Add triggers or connections from other storylets'
      });
    });

    deadEndStorylets.forEach(storyletId => {
      issues.push({
        type: 'dead_end',
        severity: 'warning',
        storyletId,
        message: `Storylet "${storyletId}" is a dead end`,
        suggestion: 'Add nextStoryletId or unlock effects to continue the arc'
      });
    });

    return {
      arcName: this.arcName,
      totalStorylets,
      reachableStorylets: reachableCount,
      unreachableStorylets,
      deadEndStorylets,
      branchingPoints: arcStorylets.filter(s => s.choices.length > 1).length,
      averagePathLength: 0, // Would need path simulation to calculate
      longestPath: 0,
      shortestPath: 0,
      issues,
      completeness,
      playability
    };
  }
}