// /Users/montysharma/V11M2/src/utils/storeMigration.ts
// Migration utilities for transitioning between store architectures

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';

export const migrateFromLegacyStores = () => {
  console.log('🔄 Starting store migration from legacy to consolidated architecture...');
  
  try {
    // Migrate from useAppStore to useCoreGameStore
    const legacyAppStore = (window as any).useAppStore?.getState();
    if (legacyAppStore) {
      // Update player data
      useCoreGameStore.getState().updatePlayer({
        level: legacyAppStore.userLevel || 1,
        experience: legacyAppStore.experience || 0,
        skillPoints: 0,
        resources: legacyAppStore.resources || {
          energy: 75,
          stress: 25,
          money: 20,
          knowledge: 100,
          social: 200
        }
      });
      
      // Update character data
      if (legacyAppStore.activeCharacter) {
        useCoreGameStore.getState().updateCharacter({
          name: legacyAppStore.activeCharacter.name || '',
          background: legacyAppStore.activeCharacter.background || '',
          attributes: legacyAppStore.activeCharacter.attributes || {},
          developmentStats: legacyAppStore.activeCharacter.developmentStats || {}
        });
      }
      
      // Update world data
      useCoreGameStore.getState().updateWorld({
        day: legacyAppStore.day || 1,
        timeAllocation: legacyAppStore.allocations || {
          study: 40,
          work: 25,
          social: 15,
          rest: 15,
          exercise: 5
        },
        isTimePaused: legacyAppStore.isTimePaused || false
      });
      console.log('✅ Migrated app store data to core game store');
    }

    // Migrate from useStoryletStore to useNarrativeStore  
    const legacyStoryletStore = (window as any).useStoryletStore?.getState();
    if (legacyStoryletStore) {
      const narrativeStore = useNarrativeStore.getState();
      
      // Migrate completed storylets
      if (legacyStoryletStore.completedStorylets && Array.isArray(legacyStoryletStore.completedStorylets)) {
        legacyStoryletStore.completedStorylets.forEach((storyletId: string) => {
          narrativeStore.completeStorylet(storyletId);
        });
      }
      
      // Migrate active storylets
      if (legacyStoryletStore.activeStoryletIds && Array.isArray(legacyStoryletStore.activeStoryletIds)) {
        legacyStoryletStore.activeStoryletIds.forEach((storyletId: string) => {
          narrativeStore.addActiveStorylet(storyletId);
        });
      }
      
      // Migrate storylet flags if they exist
      if (legacyStoryletStore.flags) {
        Object.entries(legacyStoryletStore.flags).forEach(([key, value]) => {
          narrativeStore.setStoryletFlag(key, value as any);
        });
      }
      console.log('✅ Migrated storylet data to narrative store');
    }

    // Migrate from useClueStore to useSocialStore
    const legacyClueStore = (window as any).useClueStore?.getState();
    if (legacyClueStore) {
      const socialStore = useSocialStore.getState();
      if (legacyClueStore.discoveredClues && Array.isArray(legacyClueStore.discoveredClues)) {
        legacyClueStore.discoveredClues.forEach((clue: any) => {
          socialStore.discoverClue(clue);
        });
      }
      console.log('✅ Migrated clue data to social store');
    }

    // Migrate from useNPCStore to useSocialStore
    const legacyNPCStore = (window as any).useNPCStore?.getState();
    if (legacyNPCStore && legacyNPCStore.relationships) {
      const socialStore = useSocialStore.getState();
      Object.entries(legacyNPCStore.relationships).forEach(([npcId, relationship]: [string, any]) => {
        socialStore.updateRelationship(npcId, relationship.level || 0);
      });
      console.log('✅ Migrated NPC relationships to social store');
    }

    console.log('🎉 Store migration completed successfully');
    return { success: true, message: 'Migration completed' };
    
  } catch (error) {
    console.error('❌ Store migration failed:', error);
    return { success: false, error };
  }
};

export const validateMigration = () => {
  console.log('🔍 Validating store migration...');
  
  const coreGame = useCoreGameStore.getState();
  const narrative = useNarrativeStore.getState();
  const social = useSocialStore.getState();
  
  const validation = {
    coreGame: {
      hasCharacter: !!coreGame.character?.name,
      hasStats: coreGame.player.level > 0,
      hasDay: coreGame.world.day > 0,
      hasResources: Object.keys(coreGame.player.resources || {}).length > 0
    },
    narrative: {
      hasStorylets: narrative.storylets?.active?.length > 0 || false,
      hasFlags: Object.keys(narrative.storyFlags || {}).length > 0
    },
    social: {
      hasClues: social.clues?.discovered?.length > 0 || false,
      hasRelationships: Object.keys(social.relationships || {}).length > 0
    }
  };
  
  console.log('📊 Migration validation results:', validation);
  return validation;
};

// Global functions for easy access
if (typeof window !== 'undefined') {
  (window as any).migrateStores = migrateFromLegacyStores;
  (window as any).validateMigration = validateMigration;
  console.log('🔄 Store migration utilities loaded: migrateStores(), validateMigration()');
}