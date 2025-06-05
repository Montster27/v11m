// /Users/montysharma/V11M2/src/store/integratedCharacterStore.ts
// Zustand store for managing integrated characters (V2 character system)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  IntegratedCharacter, 
  DomainKey, 
  CharacterDomain, 
  DevelopmentEvent,
  EnhancedSkill,
  EXPERIENCE_MULTIPLIERS 
} from '../types/integratedCharacter';
import { Character } from '../types/character';
import { 
  addDomainExperience, 
  updateDomainLevel, 
  getOverallDevelopmentScore,
  suggestDevelopmentFocus,
  getMilestoneRewards,
  calculateDevelopmentVelocity
} from '../utils/developmentCalculations';
import { migrateCharacterToIntegrated, validateMigration } from '../utils/characterMigration';

interface IntegratedCharacterState {
  // Core character data
  currentCharacter: IntegratedCharacter | null;
  characters: IntegratedCharacter[];
  
  // Development tracking
  developmentStats: {
    totalXP: number;
    currentStreak: number;
    longestStreak: number;
    milestonesReached: number;
  };
  
  // Actions - Character Management
  createCharacter: (name: string) => IntegratedCharacter;
  selectCharacter: (id: string) => void;
  updateCharacter: (character: IntegratedCharacter) => void;
  deleteCharacter: (id: string) => void;
  
  // Actions - Development
  addExperience: (domainKey: DomainKey, points: number, source?: string) => boolean;
  updateDomainComponent: (domainKey: DomainKey, component: string, value: number) => void;
  addDevelopmentEvent: (event: Omit<DevelopmentEvent, 'id' | 'timestamp'>) => void;
  
  // Actions - Skills
  updateSkill: (skillId: string, skill: Partial<EnhancedSkill>) => void;
  addSkillXP: (skillId: string, xp: number) => void;
  
  // Actions - Migration
  migrateFromV1: (oldCharacter: Character) => IntegratedCharacter | null;
  batchMigrateFromV1: (oldCharacters: Character[]) => IntegratedCharacter[];
  
  // Getters
  getDevelopmentSummary: () => ReturnType<typeof getOverallDevelopmentScore> | null;
  getDevelopmentSuggestion: () => ReturnType<typeof suggestDevelopmentFocus> | null;
  getDevelopmentVelocity: () => ReturnType<typeof calculateDevelopmentVelocity> | null;
  getCharacterById: (id: string) => IntegratedCharacter | null;
  
  // Utility
  reset: () => void;
}

export const useIntegratedCharacterStore = create<IntegratedCharacterState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentCharacter: null,
      characters: [],
      developmentStats: {
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
        milestonesReached: 0
      },
      
      // Character Management Actions
      createCharacter: (name: string) => {
        const newCharacter: IntegratedCharacter = {
          id: 'integrated-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          name,
          version: 2,
          
          // Initialize all domains at stage 1 with basic levels
          intellectualCompetence: {
            level: 25,
            components: { reasoning: 25, innovation: 25, retention: 25 },
            developmentStage: 1,
            experiencePoints: 0,
            confidence: 30
          },
          physicalCompetence: {
            level: 25,
            components: { power: 25, coordination: 25, discipline: 25 },
            developmentStage: 1,
            experiencePoints: 0,
            confidence: 30
          },
          emotionalIntelligence: {
            level: 25,
            components: { awareness: 25, regulation: 25, resilience: 25 },
            developmentStage: 1,
            experiencePoints: 0,
            confidence: 30
          },
          socialCompetence: {
            level: 25,
            components: { connection: 25, communication: 25, relationships: 25 },
            developmentStage: 1,
            experiencePoints: 0,
            confidence: 30
          },
          personalAutonomy: {
            level: 20,
            components: { independence: 20, interdependence: 15, responsibility: 25 },
            developmentStage: 1,
            experiencePoints: 0,
            confidence: 25
          },
          identityClarity: {
            level: 15,
            components: { selfAwareness: 20, values: 15, authenticity: 10 },
            developmentStage: 1,
            experiencePoints: 0,
            confidence: 20
          },
          lifePurpose: {
            level: 10,
            components: { direction: 15, meaning: 10, integrity: 5 },
            developmentStage: 1,
            experiencePoints: 0,
            confidence: 15
          },
          
          initialResources: {
            grades: 75,
            money: 100,
            social: 50,
            energy: 80,
            stress: 20
          },
          
          totalDevelopmentPoints: 0,
          developmentHistory: [{
            id: 'creation-' + Date.now(),
            timestamp: new Date(),
            domain: 'intellectualCompetence',
            eventType: 'milestone',
            description: 'Character created with integrated development system',
            experienceGained: 0
          }],
          
          skills: {},
          
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set(state => ({
          characters: [...state.characters, newCharacter],
          currentCharacter: newCharacter
        }));
        
        return newCharacter;
      },
      
      selectCharacter: (id: string) => {
        const character = get().characters.find(c => c.id === id);
        if (character) {
          set({ currentCharacter: character });
        }
      },
      
      updateCharacter: (character: IntegratedCharacter) => {
        set(state => ({
          characters: state.characters.map(c => 
            c.id === character.id ? character : c
          ),
          currentCharacter: state.currentCharacter?.id === character.id ? character : state.currentCharacter
        }));
      },
      
      deleteCharacter: (id: string) => {
        set(state => ({
          characters: state.characters.filter(c => c.id !== id),
          currentCharacter: state.currentCharacter?.id === id ? null : state.currentCharacter
        }));
      },
      
      // Development Actions
      addExperience: (domainKey: DomainKey, points: number, source: string = 'Unknown') => {
        const { currentCharacter } = get();
        if (!currentCharacter) return false;
        
        const result = addDomainExperience(currentCharacter, domainKey, points, source);
        
        // Update character
        get().updateCharacter(result.character);
        
        // Update development stats
        if (result.stageAdvanced) {
          set(state => ({
            developmentStats: {
              ...state.developmentStats,
              totalXP: state.developmentStats.totalXP + points,
              milestonesReached: state.developmentStats.milestonesReached + 1
            }
          }));
        } else {
          set(state => ({
            developmentStats: {
              ...state.developmentStats,
              totalXP: state.developmentStats.totalXP + points
            }
          }));
        }
        
        return result.stageAdvanced;
      },
      
      updateDomainComponent: (domainKey: DomainKey, component: string, value: number) => {
        const { currentCharacter } = get();
        if (!currentCharacter) return;
        
        const domain = currentCharacter[domainKey];
        const updatedComponents = {
          ...domain.components,
          [component]: Math.max(0, Math.min(100, value))
        };
        
        const updatedDomain: CharacterDomain = {
          ...domain,
          components: updatedComponents
        };
        
        const characterWithUpdatedDomain = {
          ...currentCharacter,
          [domainKey]: updatedDomain
        };
        
        // Recalculate level based on new components
        const finalCharacter = updateDomainLevel(characterWithUpdatedDomain, domainKey);
        
        get().updateCharacter(finalCharacter);
      },
      
      addDevelopmentEvent: (event: Omit<DevelopmentEvent, 'id' | 'timestamp'>) => {
        const { currentCharacter } = get();
        if (!currentCharacter) return;
        
        const newEvent: DevelopmentEvent = {
          ...event,
          id: 'event-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          timestamp: new Date()
        };
        
        const updatedCharacter: IntegratedCharacter = {
          ...currentCharacter,
          developmentHistory: [...currentCharacter.developmentHistory, newEvent],
          updatedAt: new Date()
        };
        
        get().updateCharacter(updatedCharacter);
      },
      
      // Skill Actions
      updateSkill: (skillId: string, skillUpdate: Partial<EnhancedSkill>) => {
        const { currentCharacter } = get();
        if (!currentCharacter) return;
        
        const updatedSkills = {
          ...currentCharacter.skills,
          [skillId]: {
            ...currentCharacter.skills[skillId],
            ...skillUpdate
          }
        };
        
        const updatedCharacter: IntegratedCharacter = {
          ...currentCharacter,
          skills: updatedSkills,
          updatedAt: new Date()
        };
        
        get().updateCharacter(updatedCharacter);
      },
      
      addSkillXP: (skillId: string, xp: number) => {
        const { currentCharacter } = get();
        if (!currentCharacter || !currentCharacter.skills[skillId]) return;
        
        const skill = currentCharacter.skills[skillId];
        const newXP = skill.xp + xp;
        
        // Calculate new level (simplified: every 100 XP = 1 level)
        const newLevel = Math.floor(newXP / 100) + 1;
        const xpToNextLevel = (newLevel * 100) - newXP;
        
        const leveledUp = newLevel > skill.level;
        
        get().updateSkill(skillId, {
          xp: newXP,
          level: newLevel,
          xpToNextLevel
        });
        
        // Add XP to primary domain
        if (leveledUp) {
          get().addExperience(skill.primaryDomain, EXPERIENCE_MULTIPLIERS.SKILL_LEVEL_UP, `${skill.name} level up`);
          
          // Add smaller XP to secondary domains
          skill.secondaryDomains.forEach(domain => {
            get().addExperience(domain, Math.floor(EXPERIENCE_MULTIPLIERS.SKILL_LEVEL_UP / 3), `${skill.name} secondary benefit`);
          });
        }
      },
      
      // Migration Actions
      migrateFromV1: (oldCharacter: Character) => {
        try {
          const newCharacter = migrateCharacterToIntegrated(oldCharacter);
          
          if (validateMigration(oldCharacter, newCharacter)) {
            set(state => ({
              characters: [...state.characters, newCharacter],
              currentCharacter: newCharacter
            }));
            return newCharacter;
          } else {
            console.error('Migration validation failed for character:', oldCharacter.name);
            return null;
          }
        } catch (error) {
          console.error('Migration failed for character:', oldCharacter.name, error);
          return null;
        }
      },
      
      batchMigrateFromV1: (oldCharacters: Character[]) => {
        const migratedCharacters: IntegratedCharacter[] = [];
        
        oldCharacters.forEach(oldChar => {
          const migrated = get().migrateFromV1(oldChar);
          if (migrated) {
            migratedCharacters.push(migrated);
          }
        });
        
        return migratedCharacters;
      },
      
      // Getters
      getDevelopmentSummary: () => {
        const { currentCharacter } = get();
        return currentCharacter ? getOverallDevelopmentScore(currentCharacter) : null;
      },
      
      getDevelopmentSuggestion: () => {
        const { currentCharacter } = get();
        return currentCharacter ? suggestDevelopmentFocus(currentCharacter) : null;
      },
      
      getDevelopmentVelocity: () => {
        const { currentCharacter } = get();
        return currentCharacter ? calculateDevelopmentVelocity(currentCharacter) : null;
      },
      
      getCharacterById: (id: string) => {
        return get().characters.find(c => c.id === id) || null;
      },
      
      // Utility
      reset: () => {
        set({
          currentCharacter: null,
          characters: [],
          developmentStats: {
            totalXP: 0,
            currentStreak: 0,
            longestStreak: 0,
            milestonesReached: 0
          }
        });
      }
    }),
    {
      name: 'integrated-character-store',
      partialize: (state) => ({
        characters: state.characters,
        currentCharacter: state.currentCharacter,
        developmentStats: state.developmentStats
      })
    }
  )
);

// Global functions for development system integration
if (typeof window !== 'undefined') {
  // Expose store for storylet system integration
  (window as any).useIntegratedCharacterStore = useIntegratedCharacterStore;
  
  // Helper function for adding development XP from storylets
  (window as any).addDevelopmentXP = (domainKey: DomainKey, points: number, source: string = 'Storylet') => {
    const store = useIntegratedCharacterStore.getState();
    return store.addExperience(domainKey, points, source);
  };
  
  // Helper function for checking domain stage requirements
  (window as any).checkDomainStage = (domainKey: DomainKey, minStage: number) => {
    const store = useIntegratedCharacterStore.getState();
    const character = store.currentCharacter;
    return character ? character[domainKey].developmentStage >= minStage : false;
  };
  
  // Helper function for getting current domain level
  (window as any).getDomainLevel = (domainKey: DomainKey) => {
    const store = useIntegratedCharacterStore.getState();
    const character = store.currentCharacter;
    return character ? character[domainKey].level : 0;
  };
}