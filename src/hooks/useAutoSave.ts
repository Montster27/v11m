// /Users/montysharma/V11M2/src/hooks/useAutoSave.ts
import { useEffect, useRef } from 'react';
import { REFACTOR_CONFIG } from '../config/refactorFlags';
import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';
import { debouncedStorage } from '../utils/debouncedStorage';
import { saveManager } from '../utils/saveManager';
import { shallow } from 'zustand/shallow';

// Auto-save modes
type AutoSaveMode = 'legacy' | 'atomic' | 'hybrid';

const AUTO_SAVE_CONFIG = {
  mode: 'hybrid' as AutoSaveMode, // Start with hybrid for safety
  atomicSaveInterval: 30000, // 30 seconds for atomic saves
  legacyUpdateInterval: 5000,  // 5 seconds for legacy slot updates
  enableAtomicOnSignificantChanges: true
};

/**
 * Auto-save hook that supports both legacy debounced storage and new atomic saves
 * Gradually migrates from legacy to atomic save system
 */
export function useAutoSave() {
  // Check if autosave is enabled in config
  if (REFACTOR_CONFIG.AUTO_SAVE_DISABLED) {
    console.log('⚠️ Auto-save disabled via REFACTOR_CONFIG');
    return { 
      isEnabled: false, 
      status: 'disabled' as const,
      mode: AUTO_SAVE_CONFIG.mode,
      forceFlush: () => {},
      forceAtomicSave: async () => false
    };
  }

  // Track critical game state from v2 consolidated stores
  const day = useCoreGameStore(state => state.world.day);
  const playerLevel = useCoreGameStore(state => state.player.level);
  const resources = useCoreGameStore(state => state.player.resources, shallow);
  const skills = useCoreGameStore(state => state.skills.totalExperience);
  const gameState = useCoreGameStore(state => state.world.gameState);
  
  // Track current save info from social store
  const currentSaveId = useSocialStore(state => state.saves.currentSaveId);
  const updateSaveSlot = useSocialStore(state => state.updateSaveSlot);
  
  // Track previous values to prevent unnecessary saves
  const previousValuesRef = useRef({
    day,
    playerLevel,
    resources,
    skills,
    lastAtomicSave: 0,
    lastLegacySave: 0
  });

  // Force flush function for critical moments
  const forceFlush = () => {
    console.log('🚨 Force flushing debounced saves');
    debouncedStorage.flush();
  };

  // Force atomic save function
  const forceAtomicSave = async () => {
    console.log('🚨 Force triggering atomic save');
    return await saveManager.saveGame();
  };

  // Legacy auto-save logic (for gradual migration)
  useEffect(() => {
    if (AUTO_SAVE_CONFIG.mode === 'atomic') return; // Skip legacy in pure atomic mode
    
    // Skip if no current save to update
    if (!currentSaveId) {
      console.log('⏸️ Legacy auto-save skipped - no current save ID');
      return;
    }
    
    const hasSignificantChange = (
      previousValuesRef.current.day !== day ||
      previousValuesRef.current.playerLevel !== playerLevel ||
      JSON.stringify(previousValuesRef.current.resources) !== JSON.stringify(resources) ||
      previousValuesRef.current.skills !== skills
    );

    if (hasSignificantChange) {
      const now = Date.now();
      const timeSinceLastLegacy = now - previousValuesRef.current.lastLegacySave;
      
      if (timeSinceLastLegacy >= AUTO_SAVE_CONFIG.legacyUpdateInterval) {
        console.log('🛟 Legacy auto-save: updating save slot metadata');
        
        try {
          const saveData = {
            name: `Auto-save ${new Date().toLocaleDateString()}`,
            timestamp: now,
            day,
            level: playerLevel,
            autoSave: true
          };
          
          updateSaveSlot(currentSaveId, saveData);
          previousValuesRef.current.lastLegacySave = now;
          console.log('✅ Legacy auto-save metadata updated');
        } catch (error) {
          console.error('❌ Legacy auto-save failed:', error);
        }
      }
    }
  }, [day, playerLevel, resources, skills, currentSaveId, updateSaveSlot]);

  // Atomic auto-save logic
  useEffect(() => {
    if (AUTO_SAVE_CONFIG.mode === 'legacy') return; // Skip atomic in pure legacy mode
    
    const hasSignificantChange = (
      previousValuesRef.current.day !== day ||
      previousValuesRef.current.playerLevel !== playerLevel ||
      JSON.stringify(previousValuesRef.current.resources) !== JSON.stringify(resources) ||
      previousValuesRef.current.skills !== skills
    );

    if (hasSignificantChange) {
      const now = Date.now();
      const timeSinceLastAtomic = now - previousValuesRef.current.lastAtomicSave;
      
      // Trigger atomic save based on interval or significant changes
      const shouldAtomicSave = (
        timeSinceLastAtomic >= AUTO_SAVE_CONFIG.atomicSaveInterval ||
        (AUTO_SAVE_CONFIG.enableAtomicOnSignificantChanges && timeSinceLastAtomic >= 10000) // 10s minimum
      );
      
      if (shouldAtomicSave) {
        console.log('💾 Atomic auto-save: saving complete game state');
        
        saveManager.saveGame().then(success => {
          if (success) {
            previousValuesRef.current.lastAtomicSave = now;
            console.log('✅ Atomic auto-save completed successfully');
          } else {
            console.error('❌ Atomic auto-save failed');
          }
        });
      }
      
      // Update tracked values
      previousValuesRef.current = {
        ...previousValuesRef.current,
        day,
        playerLevel,
        resources: { ...resources },
        skills
      };
    }
  }, [day, playerLevel, resources, skills]);

  // Save on important game state changes
  useEffect(() => {
    if (gameState === 'paused' && AUTO_SAVE_CONFIG.mode !== 'legacy') {
      console.log('⏸️ Game paused - triggering atomic save');
      saveManager.saveGame();
    }
  }, [gameState]);

  // Setup page unload handler to trigger both save types
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🚨 Page unloading - triggering all save types');
      
      // Flush legacy saves immediately
      forceFlush();
      
      // Trigger atomic save (synchronous for page unload)
      if (AUTO_SAVE_CONFIG.mode !== 'legacy') {
        saveManager.saveGame();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    isEnabled: true,
    status: 'active' as const,
    mode: AUTO_SAVE_CONFIG.mode,
    forceFlush,
    forceAtomicSave,
    currentSaveId,
    stats: {
      day,
      playerLevel,
      totalSkills: skills,
      lastAtomicSave: previousValuesRef.current.lastAtomicSave,
      lastLegacySave: previousValuesRef.current.lastLegacySave
    }
  };
}

// Export configuration for runtime modification
export { AUTO_SAVE_CONFIG };