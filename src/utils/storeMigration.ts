// /Users/montysharma/V11M2/src/utils/storeMigration.ts
// Migration utilities for transitioning between store architectures

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';

export const migrateFromLegacyStores = () => {
  console.log('🔄 Starting store migration from legacy to consolidated architecture...');
  
  try {
    // Migrate from useAppStore to useCoreGameStore
    const legacyAppStore = (window as any).useAppStore?.getState();
    if (legacyAppStore) {
      useCoreGameStore.getState().updatePlayerStats({
        userLevel: legacyAppStore.userLevel || 1,
        experience: legacyAppStore.experience || 0,
        day: legacyAppStore.day || 1,
        activeCharacter: legacyAppStore.activeCharacter || null,
        skills: legacyAppStore.skills || {},
        resources: legacyAppStore.resources || {}
      });
      console.log('✅ Migrated app store data to core game store');
    }

    // Migrate from useStoryletStore to useNarrativeStore  
    const legacyStoryletStore = (window as any).useStoryletStore?.getState();
    if (legacyStoryletStore) {
      const narrativeStore = useNarrativeStore.getState();
      if (legacyStoryletStore.allStorylets && Array.isArray(legacyStoryletStore.allStorylets)) {
        legacyStoryletStore.allStorylets.forEach((storylet: any) => {
          narrativeStore.addStorylet(storylet);
        });
      }
      // Migrate storylet flags if they exist
      if (legacyStoryletStore.flags) {
        Object.entries(legacyStoryletStore.flags).forEach(([key, value]) => {
          narrativeStore.setStoryFlag(key, value);
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
      hasCharacter: !!coreGame.activeCharacter,
      hasStats: coreGame.userLevel > 0,
      hasDay: coreGame.day > 0
    },
    narrative: {
      hasStorylets: narrative.allStorylets.length > 0,
      hasFlags: Object.keys(narrative.storyFlags).length > 0
    },
    social: {
      hasClues: social.discoveredClues.length > 0,
      hasRelationships: Object.keys(social.npcRelationships).length > 0
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