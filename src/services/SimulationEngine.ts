// /Users/montysharma/V11M2/src/services/SimulationEngine.ts
// Core simulation business logic service - orchestrates time progression and resource management

import { calculateResourceDeltas, type ResourceDeltas } from '../utils/resourceCalculations';

export interface SimulationState {
  day: number;
  resources: {
    energy: number;
    stress: number;
    money: number;
    knowledge: number;
    social: number;
  };
  allocations: {
    study: number;
    work: number;
    social: number;
    rest: number;
    exercise: number;
  };
  isTimePaused: boolean;
}

export interface SimulationResult {
  newDay: number;
  resourceDeltas: ResourceDeltas;
  newResources: {
    energy: number;
    stress: number;
    money: number;
    knowledge: number;
    social: number;
  };
  crashConditions: {
    hasEnergyDepletion: boolean;
    hasStressBurnout: boolean;
    crashType?: 'exhaustion' | 'burnout';
  };
  shouldTriggerStorylets: boolean;
}

export interface SimulationOptions {
  hoursPerDay?: number;
  enableCrashDetection?: boolean;
  enableStoryletTriggers?: boolean;
}

export class SimulationEngine {
  private static instance: SimulationEngine;
  
  private constructor() {}
  
  public static getInstance(): SimulationEngine {
    if (!SimulationEngine.instance) {
      SimulationEngine.instance = new SimulationEngine();
    }
    return SimulationEngine.instance;
  }

  /**
   * Processes a single simulation tick
   * @param state Current simulation state
   * @param character Character data for calculations
   * @param options Simulation configuration options
   * @returns Complete simulation result
   */
  public processTick(
    state: SimulationState,
    character: any,
    options: SimulationOptions = {}
  ): SimulationResult {
    const {
      hoursPerDay = 24,
      enableCrashDetection = true,
      enableStoryletTriggers = true
    } = options;

    console.log('=== SIMULATION ENGINE: Processing Tick ===');
    console.log('Current state:', state);

    // Skip if time is paused
    if (state.isTimePaused) {
      console.log('⏸️ Simulation paused - returning current state');
      return this.createNoChangeResult(state);
    }

    // Calculate resource deltas
    const resourceDeltas = calculateResourceDeltas(
      state.allocations,
      character,
      hoursPerDay
    );

    console.log('Calculated resource deltas:', resourceDeltas);

    // Apply resource changes with bounds checking
    const newResources = this.applyResourceDeltas(state.resources, resourceDeltas);

    // Advance day
    const newDay = state.day + 1;

    // Check crash conditions
    const crashConditions = this.checkCrashConditions(newResources, enableCrashDetection);

    // Determine if storylets should be triggered
    const shouldTriggerStorylets = enableStoryletTriggers && this.shouldTriggerStoryletEvaluation(state, newDay);

    const result: SimulationResult = {
      newDay,
      resourceDeltas,
      newResources,
      crashConditions,
      shouldTriggerStorylets
    };

    console.log('Simulation result:', result);
    return result;
  }

  /**
   * Validates if simulation can proceed
   * @param state Current simulation state
   * @param validationCheck External validation function
   * @returns Whether simulation can proceed
   */
  public canProceed(
    state: SimulationState,
    validationCheck?: () => boolean
  ): boolean {
    // Check if time is paused
    if (state.isTimePaused) {
      return false;
    }

    // Check external validation
    if (validationCheck && !validationCheck()) {
      return false;
    }

    // Check crash conditions
    const crashConditions = this.checkCrashConditions(state.resources, true);
    if (crashConditions.hasEnergyDepletion || crashConditions.hasStressBurnout) {
      return false;
    }

    return true;
  }

  /**
   * Applies resource deltas with proper bounds checking
   */
  private applyResourceDeltas(
    currentResources: SimulationState['resources'],
    deltas: ResourceDeltas
  ): SimulationState['resources'] {
    return {
      energy: Math.max(0, Math.min(100, currentResources.energy + deltas.energy)),
      stress: Math.max(0, Math.min(100, currentResources.stress + deltas.stress)),
      knowledge: Math.max(0, currentResources.knowledge + deltas.knowledge),
      social: Math.max(0, currentResources.social + deltas.social),
      money: Math.max(0, currentResources.money + deltas.money)
    };
  }

  /**
   * Checks for crash conditions
   */
  private checkCrashConditions(
    resources: SimulationState['resources'],
    enableDetection: boolean
  ) {
    if (!enableDetection) {
      return {
        hasEnergyDepletion: false,
        hasStressBurnout: false
      };
    }

    const hasEnergyDepletion = resources.energy <= 0;
    const hasStressBurnout = resources.stress >= 100;

    const crashType: 'exhaustion' | 'burnout' | undefined = hasEnergyDepletion ? 'exhaustion' : 
                     hasStressBurnout ? 'burnout' : undefined;

    return {
      hasEnergyDepletion,
      hasStressBurnout,
      crashType
    };
  }

  /**
   * Determines if storylets should be evaluated
   */
  private shouldTriggerStoryletEvaluation(
    previousState: SimulationState,
    newDay: number
  ): boolean {
    // Always trigger on day change
    return newDay !== previousState.day;
  }

  /**
   * Creates a result with no changes (used when simulation is paused)
   */
  private createNoChangeResult(state: SimulationState): SimulationResult {
    return {
      newDay: state.day,
      resourceDeltas: {
        energy: 0,
        stress: 0,
        money: 0,
        knowledge: 0,
        social: 0
      },
      newResources: { ...state.resources },
      crashConditions: {
        hasEnergyDepletion: false,
        hasStressBurnout: false
      },
      shouldTriggerStorylets: false
    };
  }

  /**
   * Calculates recovery values after a crash
   */
  public calculateCrashRecovery(
    crashType: 'exhaustion' | 'burnout',
    currentResources: SimulationState['resources']
  ): { energyBonus: number; stressReduction: number } {
    const baseEnergyRecovery = 50;
    const baseStressReduction = 30;

    // Adjust recovery based on crash type
    if (crashType === 'exhaustion') {
      return {
        energyBonus: Math.min(100 - currentResources.energy, baseEnergyRecovery + 10),
        stressReduction: Math.min(currentResources.stress, baseStressReduction)
      };
    } else {
      return {
        energyBonus: Math.min(100 - currentResources.energy, baseEnergyRecovery),
        stressReduction: Math.min(currentResources.stress, baseStressReduction + 20)
      };
    }
  }

  /**
   * Generates forced rest allocations during crash recovery
   */
  public generateCrashRecoveryAllocations(): SimulationState['allocations'] {
    return {
      study: 0,
      work: 0,
      social: 0,
      rest: 100,
      exercise: 0
    };
  }
}