// /Users/montysharma/V11M2/src/hooks/useAutoSave.ts
import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

/**
 * Auto-save hook that reactively saves game progress when significant changes occur
 * This replaces the setTimeout-based auto-save pattern that could cause race conditions
 */
export function useAutoSave() {
  const day = useAppStore(state => state.day);
  const resources = useAppStore(state => state.resources);
  const skills = useAppStore(state => state.skills);
  const isResetting = useAppStore(state => state.isResetting);
  
  // Track previous values to debounce saves
  const previousValuesRef = useRef({
    day: day,
    resources: resources,
    skills: skills
  });

  // Auto-save when significant game state changes
  useEffect(() => {
    // Skip auto-save during character reset to prevent race conditions
    if (isResetting) {
      console.log('⏸️ Auto-save skipped - character reset in progress');
      return;
    }
    
    // Additional safety: Skip if we detect fresh start values during potential reset
    if (day === 1 && useAppStore.getState().experience === 0 && useAppStore.getState().userLevel === 1) {
      console.log('⏸️ Auto-save skipped - fresh start detected');
      return;
    }
    
    const hasSignificantChange = (
      previousValuesRef.current.day !== day ||
      JSON.stringify(previousValuesRef.current.resources) !== JSON.stringify(resources) ||
      JSON.stringify(previousValuesRef.current.skills) !== JSON.stringify(skills)
    );

    if (hasSignificantChange) {
      console.log('🛟 Auto-saving game progress reactively');
      
      // Update previous values
      previousValuesRef.current = {
        day,
        resources: { ...resources },
        skills: { ...skills }
      };

      // Perform auto-save through proper store integration
      try {
        // Check for save store availability without using window global
        const useSaveStore = require('../store/useSaveStore').useSaveStore;
        const saveState = useSaveStore.getState();
        
        if (saveState.currentSaveId) {
          saveState.updateCurrentSave();
        }
      } catch (error) {
        console.warn('Auto-save not available:', error);
      }
    }
  }, [day, resources, skills, isResetting]);

  return null; // This hook manages side effects only
}