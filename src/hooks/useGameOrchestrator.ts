// /Users/montysharma/V11M2/src/hooks/useGameOrchestrator.ts
import { useEffect, useRef } from 'react';
import { useCoreGameStore, useNarrativeStore } from '../stores/v2';

/**
 * Orchestrator hook that coordinates reactive updates between consolidated v2 stores
 * This replaces the setTimeout pattern that was causing race conditions
 */
export function useGameOrchestrator() {
  // For now, we'll temporarily disable evaluation until v2 stores have full evaluation logic
  // TODO: Implement evaluateStorylets in useNarrativeStore
  const evaluateStorylets = () => {
    console.log('📖 Storylet evaluation temporarily disabled during v2 migration');
  };
  
  // Track values from v2 consolidated stores that should trigger storylet evaluation
  const resources = useCoreGameStore(state => state.player.resources);
  const day = useCoreGameStore(state => state.world.day);
  const skills = useCoreGameStore(state => state.skills);
  
  // Track narrative state changes from v2 store
  const activeStoryletIds = useNarrativeStore(state => state.storylets.active);
  const completedStoryletIds = useNarrativeStore(state => state.storylets.completed);
  const storyletFlags = useNarrativeStore(state => state.flags.storylet);
  
  // Use refs to track previous values and prevent unnecessary evaluations  
  const previousValuesRef = useRef({
    resources: resources,
    day: day,
    storyletFlags: storyletFlags instanceof Map ? new Map(storyletFlags) : storyletFlags,
    skills: skills,
    activeStoryletIds: activeStoryletIds,
    completedStoryletIds: completedStoryletIds
  });

  // Reactive evaluation when relevant state changes (using v2 stores)
  useEffect(() => {
    // Safe comparison for Maps
    const compareMapLike = (a: any, b: any) => {
      if (a instanceof Map && b instanceof Map) {
        return JSON.stringify(Array.from(a.entries())) === JSON.stringify(Array.from(b.entries()));
      }
      return JSON.stringify(a) === JSON.stringify(b);
    };
    
    const hasChanged = (
      JSON.stringify(previousValuesRef.current.resources) !== JSON.stringify(resources) ||
      previousValuesRef.current.day !== day ||
      !compareMapLike(previousValuesRef.current.storyletFlags, storyletFlags) ||
      JSON.stringify(previousValuesRef.current.skills) !== JSON.stringify(skills) ||
      JSON.stringify(previousValuesRef.current.activeStoryletIds) !== JSON.stringify(activeStoryletIds) ||
      JSON.stringify(previousValuesRef.current.completedStoryletIds) !== JSON.stringify(completedStoryletIds)
    );

    if (hasChanged) {
      console.log('🎯 Game state changed (v2 stores), storylet evaluation temporarily disabled during migration');
      
      // Update previous values
      previousValuesRef.current = {
        resources: { ...resources },
        day,
        storyletFlags: storyletFlags instanceof Map ? new Map(storyletFlags) : storyletFlags,
        skills: { ...skills },
        activeStoryletIds: [...activeStoryletIds],
        completedStoryletIds: [...completedStoryletIds]
      };

      // Temporarily disable evaluation during migration
      // TODO: Re-enable once evaluateStorylets is implemented in useNarrativeStore
      // const timeoutId = setTimeout(() => {
      //   evaluateStorylets();
      // }, 10);
      // return () => clearTimeout(timeoutId);
    }
  }, [resources, day, storyletFlags, skills, activeStoryletIds, completedStoryletIds, evaluateStorylets]);

  return null; // This hook manages side effects only
}

/**
 * Hook for managing storylet-triggered notifications reactively
 * This replaces the window-based notification system
 * TODO: Migrate notification system to v2 stores
 */
export function useStoryletNotifications() {
  // Temporarily return null values during v2 migration
  // TODO: Implement notification system in useSocialStore
  
  return {
    newlyDiscoveredClue: null,
    clueDiscoveryRequest: null,
    clearDiscoveredClue: () => console.log('Clue notifications temporarily disabled during v2 migration'),
    clearClueDiscoveryRequest: () => console.log('Clue discovery requests temporarily disabled during v2 migration')
  };
}