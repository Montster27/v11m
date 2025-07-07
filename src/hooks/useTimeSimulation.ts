// /Users/montysharma/V11M2/src/hooks/useTimeSimulation.ts
// Time simulation hook - manages day progression, tick rates, pause/play state
// FIXED: Stale closure issue that caused time to stop at day 2

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCoreGameStore } from '../stores/v2';
import { SimulationEngine } from '../services/SimulationEngine';

export interface TimeSimulationState {
  isPlaying: boolean;
  canPlay: boolean;
  isTimePaused: boolean;
}

export interface TimeSimulationActions {
  toggleSimulation: () => void;
  simulateTick: () => void;
  getFormattedDate: (day: number) => string;
}

export interface UseTimeSimulationReturn extends TimeSimulationState, TimeSimulationActions {}

interface UseTimeSimulationOptions {
  onCrash?: (type: 'exhaustion' | 'burnout') => void;
  onStoryletEvaluation?: () => void;
  onResourceProcessing?: (resourceDeltas: any) => void;
  validationCheck?: () => boolean;
  crashCheck?: () => boolean;
  tickInterval?: number; // milliseconds, default 3000 (3 seconds = 1 day)
}

export const useTimeSimulation = (options: UseTimeSimulationOptions = {}): UseTimeSimulationReturn => {
  const {
    onCrash,
    onStoryletEvaluation,
    onResourceProcessing,
    validationCheck = () => true,
    crashCheck = () => true,
    tickInterval = 3000
  } = options;

  const coreStore = useCoreGameStore();
  const { player, world, character } = coreStore;
  const simulationEngine = SimulationEngine.getInstance();
  
  const [isPlaying, setIsPlaying] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());

  // CRITICAL FIX: Use ref to always call the latest simulateTick
  const simulateTickRef = useRef<() => void>();

  // Determine if simulation can be played
  const canPlay = validationCheck() && crashCheck() && !world.isTimePaused;
  
  // Utility function to create timeout with cleanup tracking
  const createTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      timeoutRefs.current.delete(timeoutId);
      callback();
    }, delay);
    timeoutRefs.current.add(timeoutId);
    return timeoutId;
  }, []);

  // Utility function to clear all timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutRefs.current.clear();
  }, []);

  // Calculate the current game date from day number
  const getFormattedDate = useCallback((currentDay: number): string => {
    const startDate = new Date(1983, 8, 1); // September 1, 1983
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + (currentDay - 1));
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric', 
      month: 'short',
      day: 'numeric'
    };
    
    return currentDate.toLocaleDateString('en-US', options);
  }, []);

  // Core simulation tick logic using SimulationEngine
  const simulateTick = useCallback(() => {
    // Get fresh values from store on each tick
    const currentState = useCoreGameStore.getState();
    const { player: currentPlayer, world: currentWorld, character: currentCharacter } = currentState;
    
    console.log('=== V2 SIMULATION TICK (ENGINE-POWERED) ===');
    console.log('Store state:', { 
      worldDay: currentWorld.day,
      resources: currentPlayer.resources,
      timeAllocation: currentWorld.timeAllocation,
      isTimePaused: currentWorld.isTimePaused 
    });
    
    // CRITICAL SAFETY CHECK: Validate resources before processing
    if (!currentPlayer.resources || Object.keys(currentPlayer.resources).length === 0) {
      console.error('❌ CRITICAL: Resources are empty, cannot simulate');
      setIsPlaying(false); // Stop simulation
      return;
    }
    
    // Check for NaN values
    const hasNaN = Object.entries(currentPlayer.resources).some(([key, value]) => 
      typeof value !== 'number' || isNaN(value) || !isFinite(value)
    );
    
    if (hasNaN) {
      console.error('❌ CRITICAL: Resources contain NaN values:', currentPlayer.resources);
      setIsPlaying(false); // Stop simulation
      return;
    }
    
    // Don't simulate if time is paused (minigame active)
    if (currentWorld.isTimePaused) {
      console.log('⏸️ Simulation tick skipped - time is paused');
      return;
    }
    
    // Create simulation state for engine
    const simulationState = {
      day: currentWorld.day,
      resources: currentPlayer.resources,
      allocations: currentWorld.timeAllocation,
      isTimePaused: currentWorld.isTimePaused
    };
    
    console.log('🔧 Processing with SimulationEngine...');
    const result = simulationEngine.processTick(simulationState, currentCharacter);
    
    console.log('🔧 Engine result:', result);
    
    // CRITICAL SAFETY CHECK: Validate engine result
    if (!result || !result.newResources) {
      console.error('❌ CRITICAL: SimulationEngine returned invalid result');
      setIsPlaying(false);
      return;
    }
    
    // Check if engine result has NaN values
    const resultHasNaN = Object.entries(result.newResources).some(([key, value]) => 
      typeof value !== 'number' || isNaN(value) || !isFinite(value)
    );
    
    if (resultHasNaN) {
      console.error('❌ CRITICAL: Engine result contains NaN values:', result.newResources);
      setIsPlaying(false);
      return;
    }
    
    // Apply all changes atomically using fresh store reference
    currentState.updateWorld({ day: result.newDay });
    
    // Apply resource changes via callback to resource manager
    if (onResourceProcessing) {
      onResourceProcessing(result.resourceDeltas);
    } else {
      // Fallback: apply directly to store
      currentState.updatePlayer({ resources: result.newResources });
    }
    
    // Handle crash conditions FIRST (before storylets)
    if (result.crashConditions.crashType && onCrash) {
      console.log(`🚨 CRASH DETECTED: ${result.crashConditions.crashType}`);
      onCrash(result.crashConditions.crashType);
      return; // Don't evaluate storylets during crash
    }
    
    // Trigger storylet evaluation after all updates are complete
    if (result.shouldTriggerStorylets && onStoryletEvaluation) {
      createTimeout(() => {
        console.log('🎭 Triggering storylet evaluation after day', result.newDay);
        onStoryletEvaluation();
      }, 100); // Reduced timeout for better responsiveness
    }
    
  }, [simulationEngine, createTimeout, onStoryletEvaluation, onResourceProcessing, onCrash]);

  // CRITICAL FIX: Update the ref whenever simulateTick changes
  simulateTickRef.current = simulateTick;

  // Start/stop simulation
  const toggleSimulation = useCallback(() => {
    console.log('=== TOGGLE SIMULATION CALLED ===');
    console.log('Currently playing:', isPlaying);
    console.log('Can play:', canPlay);
    
    if (isPlaying) {
      console.log('Pausing simulation');
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('Interval cleared');
      }
    } else {
      if (!canPlay) {
        console.log('Cannot play - validation failed');
        return;
      }
      
      console.log(`Starting simulation - setting interval for ${tickInterval}ms`);
      setIsPlaying(true);
      // CRITICAL FIX: Use ref to always call the latest simulateTick
      intervalRef.current = setInterval(() => {
        if (simulateTickRef.current) {
          simulateTickRef.current();
        }
      }, tickInterval);
      console.log('Interval set:', intervalRef.current);
    }
  }, [isPlaying, canPlay, tickInterval]);

  // Trigger storylet evaluation on external day changes
  useEffect(() => {
    if (onStoryletEvaluation) {
      createTimeout(() => {
        console.log('🎭 Re-evaluating storylets due to day change:', world.day);
        onStoryletEvaluation();
      }, 100);
    }
  }, [world.day, onStoryletEvaluation, createTimeout]);

  // Auto-pause if time is paused (minigame active)
  useEffect(() => {
    if (isPlaying && world.isTimePaused) {
      console.log('⏸️ Auto-pausing simulation because time is paused');
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [world.isTimePaused, isPlaying]);

  // Auto-pause if crash conditions are met
  useEffect(() => {
    if (isPlaying && !crashCheck()) {
      const type = player.resources.energy <= 0 ? 'exhaustion' : 'burnout';
      if (onCrash) {
        onCrash(type);
      }
    }
  }, [player.resources.energy, player.resources.stress, isPlaying, crashCheck, onCrash]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      // Clear main simulation interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Clear all tracked timeouts
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  return {
    // State
    isPlaying,
    canPlay,
    isTimePaused: world.isTimePaused,
    
    // Actions
    toggleSimulation,
    simulateTick,
    getFormattedDate
  };
};