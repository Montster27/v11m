// /Users/montysharma/V11M2/src/hooks/useAutoSave.ts
import { useEffect, useRef, useCallback } from 'react';
import { REFACTOR_CONFIG } from '../config/refactorFlags';
import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';
import { shallow } from 'zustand/shallow';

/**
 * Auto-save hook that reactively saves game progress when significant changes occur
 * Now uses v2 consolidated stores to prevent infinite loops and conflicts
 */
export function useAutoSave() {
  // Check if autosave is enabled in config
  if (REFACTOR_CONFIG.AUTO_SAVE_DISABLED) {
    console.log('⚠️ Auto-save disabled via REFACTOR_CONFIG');
    return null;
  }

  // Track critical game state from v2 consolidated stores
  const day = useCoreGameStore(state => state.world.day);
  const playerLevel = useCoreGameStore(state => state.player.level);
  const resources = useCoreGameStore(state => state.player.resources, shallow);
  const skills = useCoreGameStore(state => state.skills.totalExperience);
  
  // Track current save info from social store
  const currentSaveId = useSocialStore(state => state.saves.currentSaveId);
  const updateSaveSlot = useSocialStore(state => state.updateSaveSlot);
  
  // Prevent re-entrant saves and debounce
  const saveInProgressRef = useRef(false);
  const saveTimerRef = useRef<NodeJS.Timeout>();
  
  // Track previous values to prevent unnecessary saves
  const previousValuesRef = useRef({
    day,
    playerLevel,
    resources,
    skills
  });

  // Auto-save when significant game state changes
  useEffect(() => {
    // Skip if no current save to update
    if (!currentSaveId) {
      console.log('⏸️ Auto-save skipped - no current save ID');
      return;
    }

    // Skip if save already in progress
    if (saveInProgressRef.current) {
      console.log('⏸️ Auto-save skipped - save in progress');
      return;
    }
    
    const hasSignificantChange = (
      previousValuesRef.current.day !== day ||
      previousValuesRef.current.playerLevel !== playerLevel ||
      JSON.stringify(previousValuesRef.current.resources) !== JSON.stringify(resources) ||
      previousValuesRef.current.skills !== skills
    );

    if (hasSignificantChange) {
      console.log('🛟 Auto-saving game progress (v2 stores)');
      
      // Update previous values
      previousValuesRef.current = {
        day,
        playerLevel,
        resources: { ...resources },
        skills
      };

      // Debounce saves by 5 seconds to prevent rapid firing
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        saveInProgressRef.current = true;
        
        try {
          // Create save data from current v2 store state
          const saveData = {
            name: `Auto-save ${new Date().toLocaleDateString()}`,
            timestamp: Date.now(),
            day,
            playerLevel,
            autoSave: true
          };
          
          updateSaveSlot(currentSaveId, saveData);
          console.log('✅ Auto-save completed successfully');
        } catch (error) {
          console.error('❌ Auto-save failed:', error);
        } finally {
          saveInProgressRef.current = false;
        }
      }, 5000);

      return () => clearTimeout(saveTimerRef.current);
    }
  }, [day, playerLevel, resources, skills, currentSaveId, updateSaveSlot]);

  return null; // This hook manages side effects only
}