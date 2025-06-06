// /Users/montysharma/V11M2/src/pages/Planner.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useCharacterStore } from '../store/characterStore';
import { useStoryletStore } from '../store/useStoryletStore';
import TimeAllocationPanel from '../components/TimeAllocationPanel';
import StoryletPanel from '../components/StoryletPanel';
import ResourcePanel from '../components/ResourcePanel';
import SkillsPanel from '../components/SkillsPanel';
import DebugPanel from '../components/DebugPanel';
import { Button } from '../components/ui';
import { calculateResourceDeltas, type ResourceDeltas } from '../utils/resourceCalculations';
import { validateSliderSum, checkCrashConditions } from '../utils/validation';

interface CrashModalProps {
  isOpen: boolean;
  onComplete: () => void;
  type: 'exhaustion' | 'burnout';
}

const CrashModal: React.FC<CrashModalProps> = ({ isOpen, onComplete, type }) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 3000); // 3 seconds per day

    return () => clearInterval(timer);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="text-center">
          <div className="text-6xl mb-4">
            {type === 'exhaustion' ? '😴' : '🤯'}
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            {type === 'exhaustion' ? 'Energy Depleted!' : 'Maximum Stress!'}
          </h2>
          <p className="text-gray-700 mb-4">
            You've crashed from {type}! You must rest for 3 in-game days.
          </p>
          <div className="text-lg font-bold text-blue-600">
            Recovering... {countdown} days remaining
          </div>
        </div>
      </div>
    </div>
  );
};

const Planner: React.FC = () => {
  const { 
    userLevel, 
    experience, 
    allocations,
    getTotalTimeAllocated,
    resources,
    updateResource,
    day,
    updateTimeAllocation,
    incrementDay,
    activeCharacter,
    isTimePaused
  } = useAppStore();
  
  const { currentCharacter } = useCharacterStore();
  const { evaluateStorylets } = useStoryletStore();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCrashModal, setShowCrashModal] = useState(false);
  const [crashType, setCrashType] = useState<'exhaustion' | 'burnout'>('exhaustion');
  const [isCrashRecovery, setIsCrashRecovery] = useState(false);
  const [localDay, setLocalDay] = useState(day);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const totalAllocated = getTotalTimeAllocated();
  const validation = validateSliderSum(totalAllocated);
  const crashCheck = checkCrashConditions(resources.energy, resources.stress);
  
  // Determine if Play button should be disabled
  const canPlay = validation.isValid && !isCrashRecovery && crashCheck.isValid && !isTimePaused;
  
  // Update local day when store day changes
  useEffect(() => {
    console.log('🔄 Day changed in store:', day);
    setLocalDay(day);
    // Re-evaluate storylets when day changes
    setTimeout(() => {
      console.log('🎭 Re-evaluating storylets due to day change:', day);
      evaluateStorylets();
    }, 100);
  }, [day, evaluateStorylets]);
  
  // Initialize storylet system and re-evaluate when day changes
  useEffect(() => {
    evaluateStorylets();
  }, [day, evaluateStorylets]);
  
  // Initialize storylets on mount
  useEffect(() => {
    evaluateStorylets();
  }, []);
  
  // Calculate the current game date
  const getFormattedDate = (currentDay: number) => {
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
  };
  
  // Calculate next level XP and progress
  const nextLevelXP = userLevel * 100;
  const currentLevelProgress = experience % 100;
  
  // Real-time simulation tick (3 seconds = 1 in-game day)
  const simulateTick = () => {
    console.log('=== SIMULATION TICK CALLED ===');
    
    // Get fresh state from the store each tick
    const currentState = useAppStore.getState();
    
    // Don't simulate if time is paused (minigame active)
    if (currentState.isTimePaused) {
      console.log('⏸️ Simulation tick skipped - time is paused');
      return;
    }
    
    const currentResources = currentState.resources;
    const currentAllocations = currentState.allocations;
    const currentDay = currentState.day;
    
    if (!currentCharacter) {
      console.log('No current character, but continuing with default behavior');
    } else {
      console.log('Character found:', currentCharacter.name);
    }
    
    console.log('Current day:', currentDay);
    console.log('Current resources BEFORE:', currentResources);
    
    // Calculate resource changes using fresh state
    const deltas = calculateResourceDeltas(
      currentAllocations, 
      activeCharacter || currentCharacter, 
      24 // 24 hours per day
    );
    
    console.log('Resource deltas:', deltas);
    
    // Apply resource changes using fresh values
    const newEnergy = Math.max(0, Math.min(100, currentResources.energy + deltas.energy));
    const newStress = Math.max(0, Math.min(100, currentResources.stress + deltas.stress));
    const newKnowledge = Math.max(0, Math.min(100, currentResources.knowledge + deltas.knowledge));
    const newSocial = Math.max(0, Math.min(100, currentResources.social + deltas.social));
    const newMoney = Math.max(0, currentResources.money + deltas.money);
    
    const newDay = currentDay + 1;
    
    console.log('New resources will be:', {
      energy: newEnergy,
      stress: newStress,
      knowledge: newKnowledge,
      social: newSocial,
      money: newMoney,
      day: newDay
    });
    
    // Update all resources AND day in a single store update
    useAppStore.setState((state) => ({
      resources: {
        energy: newEnergy,
        stress: newStress,
        knowledge: newKnowledge,
        social: newSocial,
        money: newMoney
      },
      day: newDay
    }));
    
    // Update local day to sync
    setLocalDay(newDay);
    
    // Trigger storylet evaluation after both resource AND day changes
    setTimeout(() => {
      console.log('🎭 Triggering storylet evaluation after day', newDay);
      evaluateStorylets();
    }, 300);
    
    // Check for crash conditions
    if (newEnergy <= 0) {
      console.log('CRASH: Energy depleted!');
      handleCrash('exhaustion');
    } else if (newStress >= 100) {
      console.log('CRASH: Stress maxed out!');
      handleCrash('burnout');
    }
  };
  
  // Handle crash scenarios
  const handleCrash = (type: 'exhaustion' | 'burnout') => {
    setIsPlaying(false);
    setCrashType(type);
    setShowCrashModal(true);
    setIsCrashRecovery(true);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Force rest allocation
    updateTimeAllocation('study', 0);
    updateTimeAllocation('work', 0);
    updateTimeAllocation('social', 0);
    updateTimeAllocation('rest', 100);
    updateTimeAllocation('exercise', 0);
  };
  
  // Handle crash recovery completion
  const handleCrashRecovery = () => {
    setShowCrashModal(false);
    setIsCrashRecovery(false);
    
    // Restore some resources after forced rest
    updateResource('energy', Math.min(100, resources.energy + 50));
    updateResource('stress', Math.max(0, resources.stress - 30));
  };
  
  // Start/stop simulation
  const toggleSimulation = () => {
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
      
      console.log('Starting simulation - setting interval for 3000ms');
      setIsPlaying(true);
      intervalRef.current = setInterval(simulateTick, 3000);
      console.log('Interval set:', intervalRef.current);
    }
  };
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Auto-pause if crash conditions are met
  useEffect(() => {
    if (isPlaying && !crashCheck.isValid) {
      const type = resources.energy <= 0 ? 'exhaustion' : 'burnout';
      handleCrash(type);
    }
  }, [resources.energy, resources.stress, isPlaying]);

  // Auto-pause if time is paused (minigame active)
  useEffect(() => {
    if (isPlaying && isTimePaused) {
      console.log('⏸️ Auto-pausing simulation because time is paused');
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isTimePaused, isPlaying]);

  const getValidationMessageClass = () => {
    if (validation.type === 'error') return 'text-red-600';
    if (validation.type === 'warning') return 'text-amber-600';
    return 'text-green-600';
  };

  const getCrashCheckClass = () => {
    return crashCheck.type === 'error' ? 'text-red-600' : 'text-amber-600';
  };

  return (
    <div className="page-container min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="mb-6">
          {/* Top Row: Play Button & Date (Left) | Title & XP (Right) */}
          <div className="flex justify-between items-start mb-4">
            {/* Left Side: Play Button and Date */}
            <div className="flex flex-col items-start">
              <Button 
                onClick={toggleSimulation}
                variant={isPlaying ? "outline" : "primary"}
                disabled={!canPlay && !isPlaying}
                className="px-8 py-3 text-lg font-bold mb-2"
              >
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </Button>
              
              {/* Game Date Display */}
              <div className="text-lg font-semibold text-gray-700">
                {getFormattedDate(localDay)}
              </div>
              <div className="text-sm text-gray-500">
                Day {localDay}
              </div>
              
              {!canPlay && !isPlaying && (
                <div className="text-xs text-gray-500 mt-2 max-w-xs">
                  {!validation.isValid ? 'Reduce allocations to ≤ 100% before playing' : 
                   !crashCheck.isValid ? 'Resolve crash conditions before playing' :
                   isTimePaused ? 'Time is paused (minigame active)' :
                   'Cannot play during recovery'}
                </div>
              )}
            </div>
            
            {/* Right Side: Title and Level Progress */}
            <div className="text-right">
              <h1 className="text-4xl font-bold text-teal-800 mb-4">
                Time & Resource Allocation Dashboard
              </h1>
              
              {/* Level Progress Bar */}
              <div className="max-w-md ml-auto mb-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Level {userLevel} Progress</span>
                  <span>{currentLevelProgress}/{nextLevelXP}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(currentLevelProgress / nextLevelXP) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Validation Messages - Centered */}
          <div className="text-center">
            {validation.message && (
              <div className={`mb-3 text-sm font-medium ${getValidationMessageClass()}`}>
                {validation.message}
              </div>
            )}
            
            {crashCheck.message && crashCheck.type !== 'success' && (
              <div className={`mb-3 text-sm font-medium ${getCrashCheckClass()}`}>
                {crashCheck.message}
              </div>
            )}
          </div>
        </header>

        {/* Main Three-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Column 1: Time Allocation */}
          <div className="lg:col-span-1">
            <TimeAllocationPanel disabled={isPlaying || isCrashRecovery} />
          </div>
          
          {/* Column 2: Storylet Events */}
          <div className="lg:col-span-1">
            <StoryletPanel />
          </div>
          
          {/* Column 3: Resources */}
          <div className="lg:col-span-1">
            <ResourcePanel />
          </div>
        </div>
        
        {/* Skills Panel - Full Width Row */}
        <div className="mb-8">
          <SkillsPanel />
        </div>
        
        {/* Development Testing (only in dev mode) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">Development Testing</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const storyletStore = useStoryletStore.getState();
                  storyletStore.evaluateStorylets();
                  console.log('Storylets evaluated manually');
                }}
                className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm hover:bg-yellow-300"
              >
                Evaluate Storylets
              </button>
              <button
                onClick={() => {
                  const storyletStore = useStoryletStore.getState();
                  storyletStore.resetStorylets();
                  console.log('Storylets reset');
                }}
                className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm hover:bg-yellow-300"
              >
                Reset Storylets
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && (window as any).testStorylets) {
                    (window as any).testStorylets();
                  }
                }}
                className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm hover:bg-yellow-300"
              >
                Test Storylets (Console)
              </button>
              <button
                onClick={() => {
                  const currentState = useAppStore.getState();
                  const newDay = currentState.day + 1;
                  useAppStore.setState({ day: newDay });
                  console.log('📅 MANUAL: Advanced day to:', newDay);
                  setTimeout(() => {
                    const storyletStore = useStoryletStore.getState();
                    storyletStore.evaluateStorylets();
                    console.log('🎭 MANUAL: Re-evaluated storylets after day advance');
                  }, 200);
                }}
                className="bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-300"
              >
                📅 Advance Day Manually
              </button>
              <button
                onClick={() => {
                  const currentState = useAppStore.getState();
                  const newDay = currentState.day + 7;
                  useAppStore.setState({ day: newDay });
                  console.log('📅 MANUAL: Advanced week to day:', newDay);
                  setTimeout(() => {
                    const storyletStore = useStoryletStore.getState();
                    storyletStore.evaluateStorylets();
                    console.log('🎭 MANUAL: Re-evaluated storylets after week advance');
                  }, 200);
                }}
                className="bg-indigo-200 text-indigo-800 px-3 py-1 rounded text-sm hover:bg-indigo-300"
              >
                📅 Skip to Next Week
              </button>
            </div>
          </div>
        )}
        
        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500">
          <p>
          {isPlaying ? 'Simulation running - 3 seconds = 1 in-game day' : 'Simulation paused'} • 
          {activeCharacter ? ` Playing as ${activeCharacter.name}` : (currentCharacter ? ` Playing as ${currentCharacter.name}` : ' No character selected')}
          </p>
        </div>
      </div>
      
      {/* Crash Modal */}
      <CrashModal 
        isOpen={showCrashModal}
        onComplete={handleCrashRecovery}
        type={crashType}
      />
      
      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
};

export default Planner;