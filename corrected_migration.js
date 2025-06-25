// CORRECTED Store Migration - Fix the "caching" issue
console.log('Starting CORRECTED Store Migration Process...');

// Use the actual method names from the V2 stores
try {
    console.log('=== CHECKING STORE AVAILABILITY ===');
    
    // Check what stores are available
    const hasCoreGameStore = typeof window.useCoreGameStore !== 'undefined';
    const hasNarrativeStore = typeof window.useNarrativeStore !== 'undefined';
    const hasLegacyAppStore = typeof window.useAppStore !== 'undefined';
    const hasLegacyStoryletStore = typeof window.useStoryletStore !== 'undefined';
    
    console.log('Core Game Store available:', hasCoreGameStore);
    console.log('Narrative Store available:', hasNarrativeStore);
    console.log('Legacy App Store available:', hasLegacyAppStore);
    console.log('Legacy Storylet Store available:', hasLegacyStoryletStore);
    
    if (!hasCoreGameStore || !hasNarrativeStore) {
        console.error('V2 stores not available. Make sure app is fully loaded.');
        return;
    }
    
    console.log('=== STARTING MIGRATION ===');
    
    // 1. Migrate Core Game Store data
    if (hasLegacyAppStore) {
        console.log('Migrating from useAppStore to useCoreGameStore...');
        
        const legacyAppStore = window.useAppStore.getState();
        const coreStore = window.useCoreGameStore.getState();
        
        console.log('Legacy app data:', {
            userLevel: legacyAppStore.userLevel,
            experience: legacyAppStore.experience,
            day: legacyAppStore.day,
            resources: legacyAppStore.resources
        });
        
        // Use the actual method names from useCoreGameStore
        coreStore.updatePlayer({
            level: legacyAppStore.userLevel || 1,
            experience: legacyAppStore.experience || 0,
            resources: legacyAppStore.resources || {}
        });
        
        coreStore.updateWorld({
            day: legacyAppStore.day || 1,
            isTimePaused: legacyAppStore.isTimePaused || false
        });
        
        // Migrate character data if available
        if (legacyAppStore.activeCharacter) {
            coreStore.updateCharacter({
                name: legacyAppStore.activeCharacter.name || '',
                background: legacyAppStore.activeCharacter.background || '',
                attributes: legacyAppStore.activeCharacter.attributes || {},
                developmentStats: legacyAppStore.activeCharacter.developmentStats || {}
            });
        }
        
        console.log('✅ Core Game Store migration completed');
    }
    
    // 2. Migrate Narrative Store data
    if (hasLegacyStoryletStore) {
        console.log('Migrating from useStoryletStore to useNarrativeStore...');
        
        const legacyStoryletStore = window.useStoryletStore.getState();
        const narrativeStore = window.useNarrativeStore.getState();
        
        console.log('Legacy storylet data:', {
            activeStoryletIds: legacyStoryletStore.activeStoryletIds,
            completedStoryletIds: legacyStoryletStore.completedStoryletIds,
            activeFlags: legacyStoryletStore.activeFlags
        });
        
        // Use the actual methods from useNarrativeStore
        // Add completed storylets
        if (legacyStoryletStore.completedStoryletIds) {
            legacyStoryletStore.completedStoryletIds.forEach(storyletId => {
                try {
                    narrativeStore.completeStorylet(storyletId);
                } catch (e) {
                    console.warn('Could not migrate storylet:', storyletId, e);
                }
            });
        }
        
        // Add active storylets
        if (legacyStoryletStore.activeStoryletIds) {
            legacyStoryletStore.activeStoryletIds.forEach(storyletId => {
                try {
                    narrativeStore.addActiveStorylet(storyletId);
                } catch (e) {
                    console.warn('Could not migrate active storylet:', storyletId, e);
                }
            });
        }
        
        // Migrate flags
        if (legacyStoryletStore.activeFlags) {
            Object.entries(legacyStoryletStore.activeFlags).forEach(([key, value]) => {
                try {
                    narrativeStore.setStoryletFlag(key, value);
                } catch (e) {
                    console.warn('Could not migrate flag:', key, e);
                }
            });
        }
        
        console.log('✅ Narrative Store migration completed');
    }
    
    console.log('=== VERIFYING MIGRATION ===');
    
    // Verify the migration worked
    const coreState = window.useCoreGameStore.getState();
    const narrativeState = window.useNarrativeStore.getState();
    
    console.log('Final Core Game State:', {
        playerLevel: coreState.player.level,
        playerExperience: coreState.player.experience,
        worldDay: coreState.world.day,
        characterName: coreState.character.name,
        playerResources: coreState.player.resources
    });
    
    console.log('Final Narrative State:', {
        activeStorylets: narrativeState.storylets.active,
        completedStorylets: narrativeState.storylets.completed,
        hasFlags: narrativeState.flags.storylet.size > 0
    });
    
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('Please refresh the page to see changes in the UI');
    alert('Store migration completed successfully! Please refresh the page to see changes.');
    
} catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('Error details:', error.message);
    alert('Migration failed. Check console for details.');
}