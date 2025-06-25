// /Users/montysharma/V11M2/src/utils/fixV2StoreMigration.ts
// Emergency fix for V2 store migration issues

export const fixV2StoreMigration = () => {
  console.log('🔧 Starting V2 Store Migration Fix...');
  
  try {
    // Step 1: Clear V2 stores from localStorage to start fresh
    console.log('📦 Clearing V2 store data...');
    localStorage.removeItem('mmv-core-game-store');
    localStorage.removeItem('mmv-narrative-store');
    localStorage.removeItem('mmv-social-store');
    
    // Step 2: Get legacy store data
    const legacyData = localStorage.getItem('life-sim-store');
    if (!legacyData) {
      console.log('⚠️ No legacy data found. Setting up default values...');
      
      // Set up default V2 store data
      const defaultCoreState = {
        state: {
          player: {
            level: 1,
            experience: 0,
            skillPoints: 0,
            resources: {
              energy: 75,
              stress: 25,
              money: 20,
              knowledge: 100,
              social: 200
            }
          },
          character: {
            name: '',
            background: '',
            attributes: {},
            developmentStats: {}
          },
          skills: {
            foundationExperiences: {},
            coreCompetencies: {},
            characterClasses: {},
            totalExperience: 0
          },
          world: {
            day: 1,
            timeAllocation: {
              study: 40,
              work: 25,
              social: 15,
              rest: 15,
              exercise: 5
            },
            isTimePaused: false
          }
        },
        version: 1
      };
      
      localStorage.setItem('mmv-core-game-store', JSON.stringify(defaultCoreState));
      console.log('✅ Set up default V2 store data');
      
    } else {
      console.log('📊 Found legacy data, parsing...');
      const parsed = JSON.parse(legacyData);
      const legacyState = parsed.state;
      
      // Step 3: Create V2 store structure with migrated data
      const v2CoreState = {
        state: {
          player: {
            level: legacyState.userLevel || 1,
            experience: legacyState.experience || 0,
            skillPoints: 0,
            resources: legacyState.resources || {
              energy: 75,
              stress: 25,
              money: 20,
              knowledge: 100,
              social: 200
            }
          },
          character: {
            name: legacyState.activeCharacter?.name || '',
            background: legacyState.activeCharacter?.background || '',
            attributes: legacyState.activeCharacter?.attributes || {},
            developmentStats: legacyState.activeCharacter?.developmentStats || {}
          },
          skills: {
            foundationExperiences: {},
            coreCompetencies: {},
            characterClasses: {},
            totalExperience: legacyState.getTotalSkillPoints?.() || 0
          },
          world: {
            day: legacyState.day || 1,
            timeAllocation: legacyState.allocations || {
              study: 40,
              work: 25,
              social: 15,
              rest: 15,
              exercise: 5
            },
            isTimePaused: legacyState.isTimePaused || false
          }
        },
        version: 1
      };
      
      // Step 4: Save to localStorage
      localStorage.setItem('mmv-core-game-store', JSON.stringify(v2CoreState));
      console.log('✅ Migrated legacy data to V2 store');
      
      // Log the migration
      console.log('📋 Migration Summary:');
      console.log('- Player Level:', v2CoreState.state.player.level);
      console.log('- Experience:', v2CoreState.state.player.experience);
      console.log('- Day:', v2CoreState.state.world.day);
      console.log('- Resources:', v2CoreState.state.player.resources);
      console.log('- Character:', v2CoreState.state.character.name || 'No character');
    }
    
    console.log('🎉 Migration fix complete! Refreshing page...');
    setTimeout(() => location.reload(), 1000);
    
  } catch (error) {
    console.error('❌ Migration fix failed:', error);
  }
};

// Auto-expose to window
if (typeof window !== 'undefined') {
  (window as any).fixV2StoreMigration = fixV2StoreMigration;
  console.log('🔧 V2 Store Migration Fix loaded. Run: fixV2StoreMigration()');
}
