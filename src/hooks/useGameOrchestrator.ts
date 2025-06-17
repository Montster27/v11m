// /Users/montysharma/V11M2/src/hooks/useGameOrchestrator.ts
import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useStoryletStore } from '../store/useStoryletStore';

/**
 * Orchestrator hook that coordinates reactive updates between stores
 * This replaces the setTimeout pattern that was causing race conditions
 */
export function useGameOrchestrator() {
  const evaluateStorylets = useStoryletStore(state => state.evaluateStorylets);
  
  // Track values that should trigger storylet evaluation
  const resources = useAppStore(state => state.resources);
  const day = useAppStore(state => state.day);
  const storyletFlags = useAppStore(state => state.storyletFlags);
  const skills = useAppStore(state => state.skills);
  
  // Also track storylet store internal state changes that should trigger re-evaluation
  const activeStoryletIds = useStoryletStore(state => state.activeStoryletIds);
  const completedStoryletIds = useStoryletStore(state => state.completedStoryletIds);
  const activeFlags = useStoryletStore(state => state.activeFlags);
  const deploymentFilter = useStoryletStore(state => state.deploymentFilter);
  
  // Use refs to track previous values and prevent unnecessary evaluations
  const previousValuesRef = useRef({
    resources: resources,
    day: day,
    storyletFlags: storyletFlags,
    skills: skills,
    activeStoryletIds: activeStoryletIds,
    completedStoryletIds: completedStoryletIds,
    activeFlags: activeFlags,
    deploymentFilter: deploymentFilter
  });

  // Reactive evaluation when relevant state changes
  useEffect(() => {
    const hasChanged = (
      JSON.stringify(previousValuesRef.current.resources) !== JSON.stringify(resources) ||
      previousValuesRef.current.day !== day ||
      JSON.stringify(previousValuesRef.current.storyletFlags) !== JSON.stringify(storyletFlags) ||
      JSON.stringify(previousValuesRef.current.skills) !== JSON.stringify(skills) ||
      JSON.stringify(previousValuesRef.current.activeStoryletIds) !== JSON.stringify(activeStoryletIds) ||
      JSON.stringify(previousValuesRef.current.completedStoryletIds) !== JSON.stringify(completedStoryletIds) ||
      JSON.stringify(previousValuesRef.current.activeFlags) !== JSON.stringify(activeFlags) ||
      JSON.stringify(Array.from(previousValuesRef.current.deploymentFilter)) !== JSON.stringify(Array.from(deploymentFilter))
    );

    if (hasChanged) {
      console.log('🎯 Game state changed, evaluating storylets reactively');
      
      // Update previous values
      previousValuesRef.current = {
        resources: { ...resources },
        day,
        storyletFlags: { ...storyletFlags },
        skills: { ...skills },
        activeStoryletIds: [...activeStoryletIds],
        completedStoryletIds: [...completedStoryletIds],
        activeFlags: { ...activeFlags },
        deploymentFilter: new Set(deploymentFilter)
      };

      // Evaluate storylets reactively instead of with setTimeout
      // Use a small delay to allow for batched state updates
      const timeoutId = setTimeout(() => {
        evaluateStorylets();
      }, 10);

      return () => clearTimeout(timeoutId);
    }
  }, [resources, day, storyletFlags, skills, activeStoryletIds, completedStoryletIds, activeFlags, deploymentFilter, evaluateStorylets]);

  return null; // This hook manages side effects only
}

/**
 * Hook for managing storylet-triggered notifications reactively
 * This replaces the window-based notification system
 */
export function useStoryletNotifications() {
  const newlyDiscoveredClue = useStoryletStore(state => state.newlyDiscoveredClue);
  const clueDiscoveryRequest = useStoryletStore(state => state.clueDiscoveryRequest);
  const clearDiscoveredClue = useStoryletStore(state => state.clearDiscoveredClue);
  const clearClueDiscoveryRequest = useStoryletStore(state => state.clearClueDiscoveryRequest);

  return {
    newlyDiscoveredClue,
    clueDiscoveryRequest,
    clearDiscoveredClue,
    clearClueDiscoveryRequest
  };
}