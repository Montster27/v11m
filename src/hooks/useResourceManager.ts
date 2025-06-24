// /Users/montysharma/V11M2/src/hooks/useResourceManager.ts
// Resource management hook - handles resource calculations, validation, and updates

import { useState, useEffect, useCallback } from 'react';
import { useCoreGameStore } from '../stores/v2';
import { calculateResourceDeltas, type ResourceDeltas } from '../utils/resourceCalculations';
import { validateSliderSum, type ValidationResult } from '../utils/validation';

export interface ResourceState {
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
}

export interface ResourceValidation {
  allocationValidation: ValidationResult;
  totalAllocated: number;
  canAllocate: boolean;
}

export interface ResourceActions {
  updateResource: (resource: string, value: number) => void;
  updateTimeAllocation: (activity: string, value: number) => void;
  getTotalTimeAllocated: () => number;
  calculateResourceChanges: (character: any, hours: number) => ResourceDeltas;
  applyResourceChanges: (deltas: ResourceDeltas) => void;
  initializeResources: () => void;
}

export interface UseResourceManagerReturn {
  state: ResourceState;
  validation: ResourceValidation;
  actions: ResourceActions;
}

export const useResourceManager = (): UseResourceManagerReturn => {
  const coreStore = useCoreGameStore();
  const { player, character } = coreStore;
  
  // Local allocation state (could be moved to store later)
  const [allocations, setAllocations] = useState({
    study: 40,
    work: 25,
    social: 15,
    rest: 15,
    exercise: 5
  });

  // Calculate total time allocated
  const getTotalTimeAllocated = useCallback(() => {
    return Object.values(allocations).reduce((sum, value) => sum + value, 0);
  }, [allocations]);

  // Validation state
  const totalAllocated = getTotalTimeAllocated();
  const allocationValidation = validateSliderSum(totalAllocated);
  const canAllocate = allocationValidation.isValid;

  // Update individual resource values
  const updateResource = useCallback((resource: string, value: number) => {
    coreStore.updatePlayer({
      resources: {
        ...player.resources,
        [resource]: resource === 'energy' || resource === 'stress'
          ? Math.max(0, Math.min(100, value))
          : Math.max(0, value)
      }
    });
  }, [coreStore, player.resources]);

  // Update time allocation for specific activity
  const updateTimeAllocation = useCallback((activity: string, value: number) => {
    setAllocations(prev => ({
      ...prev,
      [activity]: Math.max(0, Math.min(100, value))
    }));
  }, []);

  // Calculate resource changes based on allocations and character
  const calculateResourceChanges = useCallback((currentCharacter: any, hours: number = 24): ResourceDeltas => {
    return calculateResourceDeltas(allocations, currentCharacter, hours);
  }, [allocations]);

  // Apply calculated resource changes to the store
  const applyResourceChanges = useCallback((deltas: ResourceDeltas) => {
    const currentResources = player.resources;
    
    console.log('Applying resource changes:', deltas);
    console.log('Current resources before:', currentResources);
    
    const newResources = {
      energy: Math.max(0, Math.min(100, currentResources.energy + deltas.energy)),
      stress: Math.max(0, Math.min(100, currentResources.stress + deltas.stress)),
      knowledge: Math.max(0, currentResources.knowledge + deltas.knowledge),
      social: Math.max(0, currentResources.social + deltas.social),
      money: Math.max(0, currentResources.money + deltas.money)
    };
    
    console.log('New resources after:', newResources);
    
    coreStore.updatePlayer({ resources: newResources });
  }, [coreStore, player.resources]);

  // Initialize resources if they don't exist
  const initializeResources = useCallback(() => {
    if (Object.keys(player.resources).length === 0) {
      console.log('Initializing default resources');
      coreStore.updatePlayer({
        resources: {
          energy: 75,
          stress: 20,
          money: 0,
          knowledge: 0,
          social: 0
        }
      });
    }
  }, [coreStore, player.resources]);

  // Initialize resources on mount
  useEffect(() => {
    initializeResources();
  }, [initializeResources]);

  return {
    state: {
      resources: player.resources,
      allocations
    },
    validation: {
      allocationValidation,
      totalAllocated,
      canAllocate
    },
    actions: {
      updateResource,
      updateTimeAllocation,
      getTotalTimeAllocated,
      calculateResourceChanges,
      applyResourceChanges,
      initializeResources
    }
  };
};