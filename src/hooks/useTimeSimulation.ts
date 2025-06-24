// /Users/montysharma/V11M2/src/hooks/useTimeSimulation.ts
// Time simulation hook - manages day progression, tick rates, pause/play state

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCoreGameStore } from '../stores/v2';

export interface TimeSimulationState {
  isPlaying: boolean;
  localDay: number;
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
  validationCheck?: () => boolean;
  crashCheck?: () => boolean;
  tickInterval?: number; // milliseconds, default 3000 (3 seconds = 1 day)
}

export const useTimeSimulation = (options: UseTimeSimulationOptions = {}): UseTimeSimulationReturn => {
  const {
    onCrash,
    onStoryletEvaluation,
    validationCheck = () => true,
    crashCheck = () => true,
    tickInterval = 3000
  } = options;

  const coreStore = useCoreGameStore();
  const { player, world } = coreStore;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [localDay, setLocalDay] = useState(world.day);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());

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

  // Core simulation tick logic
  const simulateTick = useCallback(() => {
    console.log('=== SIMULATION TICK CALLED ===');
    
    // Don't simulate if time is paused (minigame active)
    if (world.isTimePaused) {
      console.log('⏸️ Simulation tick skipped - time is paused');
      return;
    }
    
    const currentResources = player.resources;
    const newDay = world.day + 1;
    
    console.log('Current day:', world.day, '-> New day:', newDay);
    console.log('Current resources BEFORE tick:', currentResources);
    
    // Update day in store
    coreStore.updateWorld({ day: newDay });
    setLocalDay(newDay);
    
    // Trigger storylet evaluation after day change
    if (onStoryletEvaluation) {
      createTimeout(() => {
        console.log('🎭 Triggering storylet evaluation after day', newDay);
        onStoryletEvaluation();
      }, 300);
    }
    
    // Check for crash conditions after resource updates (handled externally)
    const { energy, stress } = currentResources;
    if (energy <= 0 && onCrash) {
      console.log('CRASH: Energy depleted!');
      onCrash('exhaustion');
    } else if (stress >= 100 && onCrash) {
      console.log('CRASH: Stress maxed out!');
      onCrash('burnout');
    }
  }, [world.isTimePaused, world.day, player.resources, coreStore, createTimeout, onStoryletEvaluation, onCrash]);

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
      intervalRef.current = setInterval(simulateTick, tickInterval);
      console.log('Interval set:', intervalRef.current);
    }
  }, [isPlaying, canPlay, simulateTick, tickInterval]);

  // Sync local day with store day changes
  useEffect(() => {
    console.log('🔄 Day changed in store:', world.day);
    setLocalDay(world.day);
    
    // Trigger storylet evaluation on external day changes
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
    localDay,
    canPlay,
    isTimePaused: world.isTimePaused,
    
    // Actions
    toggleSimulation,
    simulateTick,
    getFormattedDate
  };
};