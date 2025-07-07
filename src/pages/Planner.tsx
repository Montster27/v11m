// /Users/montysharma/V11M2/src/pages/Planner.tsx
// Refactored Planner component - clean UI orchestration with extracted business logic

import React, { useEffect } from 'react';
import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';
import { useTimeSimulation } from '../hooks/useTimeSimulation';
import { useResourceManager } from '../hooks/useResourceManager';
import { useCrashRecovery } from '../hooks/useCrashRecovery';
// SimulationEngine import removed - will be integrated into useTimeSimulation

// UI Components
import TimeAllocationPanel from '../components/TimeAllocationPanel';
import StoryletPanel from '../components/StoryletPanel';
import ResourcePanel from '../components/ResourcePanel';
import SkillsPanel from '../components/SkillsPanel';
import ContentStudio from '../components/ContentStudio';
import CrashModal from '../components/CrashModal';
import { Button } from '../components/ui';

const Planner: React.FC = () => {
  // Consolidated stores
  const coreStore = useCoreGameStore();
  const narrativeStore = useNarrativeStore();
  const socialStore = useSocialStore();
  
  const { player, character, world, skills } = coreStore;
  const { storylets } = narrativeStore;

  // Resource management hook
  const resourceManager = useResourceManager();
  const { state: resourceState, validation, actions: resourceActions } = resourceManager;

  // Crash recovery hook
  const crashRecovery = useCrashRecovery(
    resourceState.resources.energy,
    resourceState.resources.stress,
    {
      onCrashStart: (type) => {
        console.log(`Crash started: ${type}`);
        // Force rest allocation using store action
        const restAllocations = coreStore.generateCrashRecoveryAllocations();
        Object.entries(restAllocations).forEach(([activity, value]) => {
          resourceActions.updateTimeAllocation(activity, value);
        });
      },
      onRecoveryBonus: (energyBonus, stressReduction) => {
        resourceActions.updateResource('energy', 
          Math.min(100, resourceState.resources.energy + energyBonus));
        resourceActions.updateResource('stress', 
          Math.max(0, resourceState.resources.stress - stressReduction));
      }
    }
  );

  // Storylet evaluation function
  const evaluateStorylets = () => {
    console.log('📖 Evaluating storylets with consolidated stores');
    console.log('   Active storylets before:', storylets.active);
    console.log('   Tutorial storylet flag:', narrativeStore.getStoryletFlag('character_created'));
    
    // Actually call the storylet evaluation
    narrativeStore.evaluateStorylets();
    
    console.log('   Active storylets after:', narrativeStore.storylets.active);
  };

  // Resource processing now handled by SimulationEngine via useTimeSimulation

  // Time simulation hook with SimulationEngine integration
  const timeSimulation = useTimeSimulation({
    onCrash: crashRecovery.actions.handleCrash,
    onResourceProcessing: (resourceDeltas) => {
      console.log('📊 Applying resource deltas via resource manager:', resourceDeltas);
      resourceManager.actions.applyResourceChanges(resourceDeltas);
    },
    onStoryletEvaluation: () => {
      // Resources are now processed by the engine before this callback
      evaluateStorylets();
    },
    validationCheck: () => validation.canAllocate && !crashRecovery.state.isCrashRecovery,
    crashCheck: () => crashRecovery.state.crashCheck.isValid,
    tickInterval: 3000
  });

  // SimulationEngine integration moved to useTimeSimulation hook

  // Level progression calculations
  const nextLevelXP = player.level * 100;
  const currentLevelProgress = player.experience % 100;

  // Validation message styling
  const getValidationMessageClass = () => {
    if (validation.allocationValidation.type === 'error') return 'text-red-600';
    if (validation.allocationValidation.type === 'warning') return 'text-amber-600';
    return 'text-green-600';
  };

  const getCrashCheckClass = () => {
    return crashRecovery.state.crashCheck.type === 'error' ? 'text-red-600' : 'text-amber-600';
  };

  // Initialize on mount
  useEffect(() => {
    // Set character_created flag if character exists
    if (character && character.name) {
      narrativeStore.setStoryletFlag('character_created', true);
    }
    evaluateStorylets();
  }, []);

  return (
    <div className="page-container min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex justify-between items-start mb-4">
            {/* Play Controls & Date */}
            <div className="flex flex-col items-start">
              <Button 
                onClick={timeSimulation.toggleSimulation}
                variant={timeSimulation.isPlaying ? "outline" : "primary"}
                disabled={!timeSimulation.canPlay && !timeSimulation.isPlaying}
                className="px-8 py-3 text-lg font-bold mb-2"
              >
                {timeSimulation.isPlaying ? 'PAUSE' : 'PLAY'}
              </Button>
              
              <div className="text-lg font-semibold text-gray-700">
                {timeSimulation.getFormattedDate(world.day)}
              </div>
              <div className="text-sm text-gray-500">
                Day {world.day}
              </div>
              
              {!timeSimulation.canPlay && !timeSimulation.isPlaying && (
                <div className="text-xs text-gray-500 mt-2 max-w-xs">
                  {!validation.canAllocate ? 'Reduce allocations to ≤ 100% before playing' : 
                   !crashRecovery.state.crashCheck.isValid ? 'Resolve crash conditions before playing' :
                   timeSimulation.isTimePaused ? 'Time is paused (minigame active)' :
                   'Cannot play during recovery'}
                </div>
              )}
            </div>
            
            {/* Title & Level Progress */}
            <div className="text-right">
              {character && character.name && (
                <div className="text-xl font-semibold text-gray-700 mb-2">
                  {character.name}
                </div>
              )}
              <h1 className="text-4xl font-bold text-teal-800 mb-4">
                Planner
              </h1>
              
              <div className="max-w-md ml-auto mb-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Level {player.level} Progress</span>
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
          
          {/* Validation Messages */}
          <div className="text-center">
            {validation.allocationValidation.message && (
              <div className={`mb-3 text-sm font-medium ${getValidationMessageClass()}`}>
                {validation.allocationValidation.message}
              </div>
            )}
            
            {crashRecovery.state.crashCheck.message && crashRecovery.state.crashCheck.type !== 'success' && (
              <div className={`mb-3 text-sm font-medium ${getCrashCheckClass()}`}>
                {crashRecovery.state.crashCheck.message}
              </div>
            )}
          </div>
        </header>

        {/* Three-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <TimeAllocationPanel disabled={timeSimulation.isPlaying || crashRecovery.state.isCrashRecovery} />
          </div>
          
          <div className="lg:col-span-1">
            <StoryletPanel />
          </div>
          
          <div className="lg:col-span-1">
            <ResourcePanel />
          </div>
        </div>
        
        <div className="mb-8">
          <SkillsPanel />
        </div>
        
        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            {timeSimulation.isPlaying ? 'Simulation running - 3 seconds = 1 in-game day' : 'Simulation paused'}
          </p>
        </div>
      </div>
      
      {/* Modals */}
      <CrashModal 
        isOpen={crashRecovery.state.showCrashModal}
        onComplete={crashRecovery.actions.handleCrashRecovery}
        type={crashRecovery.state.crashType}
        countdown={crashRecovery.state.countdown}
      />
      
      <ContentStudio />
    </div>
  );
};

export default Planner;