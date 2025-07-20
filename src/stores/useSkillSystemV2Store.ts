// MMV Skill System 2.0: State Management Store
// Handles skill progression, class unlocking, and synergy management

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  SkillSystemV2, 
  FoundationExperienceId,
  FoundationCategory,
  CoreCompetency, 
  CharacterClass, 
  TradeSpecialization,
  SkillExperienceGain,
  SynergyEffect,
  WorldCondition,
  InfiltrationTeam,
  SkillIdentifier,
  ClassAbility
} from '../types/skillSystemV2';
import { 
  FOUNDATION_EXPERIENCES,
  CORE_COMPETENCIES,
  CHARACTER_CLASSES
} from '../data/skillSystemV2Data';

// Experience progression formulas
const LEVEL_FORMULA = {
  foundation: (xp: number) => Math.floor(Math.sqrt(xp / 10)),
  competency: (xp: number) => Math.floor(Math.sqrt(xp / 15)),
  characterClass: (xp: number) => Math.floor(Math.sqrt(xp / 20)),
  trade: (xp: number) => Math.floor(Math.sqrt(xp / 12))
};

const XP_FOR_LEVEL = {
  foundation: (level: number) => level * level * 10,
  competency: (level: number) => level * level * 15,
  characterClass: (level: number) => level * level * 20,
  trade: (level: number) => level * level * 12
};

interface SkillSystemV2Store extends SkillSystemV2 {
  // Actions
  addExperience: (gains: SkillExperienceGain) => void;
  unlockFoundation: (experienceId: FoundationExperienceId) => boolean;
  unlockCharacterClass: (classId: CharacterClass) => boolean;
  setPrimaryClass: (classId: CharacterClass | null) => void;
  setSecondaryClass: (classId: CharacterClass | null) => void;
  
  // Synergy management
  checkSynergies: () => void;
  activateSynergy: (synergyId: string) => boolean;
  deactivateSynergy: (synergyId: string) => void;
  
  // World condition management
  triggerWorldCondition: (conditionId: string) => void;
  endWorldCondition: (conditionId: string) => void;
  updateWorldConditions: (currentDay: number) => void;
  
  // Ability management
  useClassAbility: (abilityId: string) => boolean;
  isAbilityAvailable: (abilityId: string) => boolean;
  getAbilityCooldownRemaining: (abilityId: string) => number;
  
  // Calculations
  getEffectiveCompetencyLevel: (competency: CoreCompetency) => number;
  canUnlockClass: (classId: CharacterClass) => boolean;
  canUnlockFoundation: (experienceId: FoundationExperienceId) => boolean;
  getClassUnlockProgress: (classId: CharacterClass) => number;
  
  // Team operations
  canFormTeam: (teamId: string) => boolean;
  getTeamEffectiveness: (teamId: string) => number;
  
  // Analytics
  getSkillAnalytics: () => {
    totalLevels: number;
    highestFoundation: { experience: FoundationExperienceId; level: number };
    highestCompetency: { competency: CoreCompetency; level: number };
    unlockedClasses: number;
    activeSynergies: number;
    infiltrationPower: number;
  };
  
  // Utility
  resetSkillSystem: () => void;
  exportSkillData: () => string;
  importSkillData: (data: string) => boolean;
}

// Initial state factory
const createInitialState = (): Omit<SkillSystemV2, keyof SkillSystemV2Store> => ({
  foundationExperiences: { ...FOUNDATION_EXPERIENCES },
  coreCompetencies: { ...CORE_COMPETENCIES },
  
  characterClasses: { ...CHARACTER_CLASSES },
  
  primaryClass: null,
  secondaryClass: null,
  
  tradeSpecializations: {
    electrical: { level: 0, experience: 0, unlocked: false },
    plumbing: { level: 0, experience: 0, unlocked: false },
    hvac: { level: 0, experience: 0, unlocked: false },
    construction: { level: 0, experience: 0, unlocked: false },
    automotive: { level: 0, experience: 0, unlocked: false }
  },
  
  unlockedClasses: [],
  activeSynergies: [],
  worldConditions: [],
  infiltrationTeams: [],
  
  totalExperience: 0,
  skillPoints: 0,
  
  version: 2,
  lastUpdated: new Date()
});

// Ability cooldown tracking (not persisted)
const abilityCooldowns: Map<string, number> = new Map();
const abilityUsesToday: Map<string, number> = new Map();
let lastResetDay = 0;

export const useSkillSystemV2Store = create<SkillSystemV2Store>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      
      addExperience: (gains: SkillExperienceGain) => {
        set((state) => {
          const newState = { ...state };
          let totalGained = 0;
          
          // Reset daily ability uses if new day
          const currentDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
          if (currentDay > lastResetDay) {
            abilityUsesToday.clear();
            lastResetDay = currentDay;
          }
          
          // Apply foundation experience gains
          if (gains.foundationGains) {
            Object.entries(gains.foundationGains).forEach(([experienceId, xp]) => {
              const expId = experienceId as FoundationExperienceId;
              if (newState.foundationExperiences[expId] && xp > 0) {
                const foundation = { ...newState.foundationExperiences[expId] };
                foundation.experience += xp;
                foundation.level = LEVEL_FORMULA.foundation(foundation.experience);
                newState.foundationExperiences[expId] = foundation;
                totalGained += xp;
                
                // Update competencies that this foundation contributes to
                foundation.contributes.forEach(({ competency, multiplier }) => {
                  const comp = { ...newState.coreCompetencies[competency] };
                  const contributedXP = xp * multiplier * 0.3; // Foundation contributes 30% to competencies
                  comp.experience += contributedXP;
                  comp.level = LEVEL_FORMULA.competency(comp.experience);
                  newState.coreCompetencies[competency] = comp;
                });
              }
            });
          }
          
          // Apply competency experience gains
          if (gains.competencyGains) {
            Object.entries(gains.competencyGains).forEach(([competencyId, xp]) => {
              const competency = competencyId as CoreCompetency;
              if (newState.coreCompetencies[competency] && xp > 0) {
                const comp = { ...newState.coreCompetencies[competency] };
                comp.experience += xp;
                comp.level = LEVEL_FORMULA.competency(comp.experience);
                newState.coreCompetencies[competency] = comp;
                totalGained += xp;
              }
            });
          }
          
          // Apply class experience gains
          if (gains.classGains) {
            Object.entries(gains.classGains).forEach(([classId, xp]) => {
              const characterClass = classId as CharacterClass;
              if (newState.characterClasses[characterClass] && xp > 0) {
                const cls = { ...newState.characterClasses[characterClass] };
                cls.experience += xp;
                cls.level = LEVEL_FORMULA.characterClass(cls.experience);
                newState.characterClasses[characterClass] = cls;
                totalGained += xp;
              }
            });
          }
          
          // Apply trade experience gains
          if (gains.tradeGains) {
            Object.entries(gains.tradeGains).forEach(([tradeId, xp]) => {
              const trade = tradeId as TradeSpecialization;
              if (newState.tradeSpecializations[trade] && xp > 0) {
                const tradeSpec = { ...newState.tradeSpecializations[trade] };
                tradeSpec.experience += xp;
                tradeSpec.level = LEVEL_FORMULA.trade(tradeSpec.experience);
                newState.tradeSpecializations[trade] = tradeSpec;
                totalGained += xp;
              }
            });
          }
          
          newState.totalExperience += totalGained;
          newState.skillPoints += Math.floor(totalGained / 100); // 1 skill point per 100 XP
          newState.lastUpdated = gains.timestamp;
          
          return newState;
        });
        
        // Check for new unlocks after experience gain
        get().checkSynergies();
      },
      
      unlockFoundation: (trackId: FoundationTrack) => {
        const state = get();
        const foundation = state.foundationExperiences[trackId];
        
        if (!foundation || foundation.unlocked) return false;
        
        // Check requirements
        if (foundation.requirements) {
          if (foundation.requirements.minLevel) {
            const totalLevel = Object.values(state.foundationExperiences)
              .reduce((sum, f) => sum + f.level, 0);
            if (totalLevel < foundation.requirements.minLevel) return false;
          }
          
          if (foundation.requirements.requiredExperiences) {
            const hasRequired = foundation.requirements.requiredExperiences.every(
              req => state.foundationExperiences[req]?.unlocked
            );
            if (!hasRequired) return false;
          }
        }
        
        set((state) => ({
          ...state,
          foundationExperiences: {
            ...state.foundationExperiences,
            [trackId]: { ...state.foundationExperiences[trackId], unlocked: true }
          }
        }));
        
        return true;
      },
      
      
      setPrimaryClass: (classId: CharacterClass | null) => {
        set((state) => ({ ...state, primaryClass: classId }));
      },
      
      setSecondaryClass: (classId: CharacterClass | null) => {
        set((state) => ({ ...state, secondaryClass: classId }));
      },
      
      checkSynergies: () => {
        const state = get();
        const newSynergies: SynergyEffect[] = [];
        
        SYNERGY_EFFECTS.forEach(synergy => {
          if (synergy.unlocked) return; // Already unlocked
          
          const { requirements } = synergy;
          const trade = state.tradeSpecializations[requirements.tradeSpecialization];
          const competency = state.coreCompetencies[requirements.competency];
          
          if (trade.level >= requirements.minTradeLevel && 
              competency.level >= requirements.minCompetencyLevel) {
            newSynergies.push({ ...synergy, unlocked: true });
          }
        });
        
        if (newSynergies.length > 0) {
          set((state) => ({
            ...state,
            activeSynergies: [...state.activeSynergies, ...newSynergies]
          }));
        }
      },
      
      activateSynergy: (synergyId: string) => {
        const state = get();
        const synergy = SYNERGY_EFFECTS.find(s => s.id === synergyId);
        
        if (!synergy || state.activeSynergies.some(s => s.id === synergyId)) return false;
        
        // Check if requirements are met
        const { requirements } = synergy;
        const trade = state.tradeSpecializations[requirements.tradeSpecialization];
        const competency = state.coreCompetencies[requirements.competency];
        
        if (trade.level >= requirements.minTradeLevel && 
            competency.level >= requirements.minCompetencyLevel) {
          
          set((state) => ({
            ...state,
            activeSynergies: [...state.activeSynergies, { ...synergy, unlocked: true }]
          }));
          
          return true;
        }
        
        return false;
      },
      
      deactivateSynergy: (synergyId: string) => {
        set((state) => ({
          ...state,
          activeSynergies: state.activeSynergies.filter(s => s.id !== synergyId)
        }));
      },
      
      triggerWorldCondition: (conditionId: string) => {
        set((state) => ({
          ...state,
          worldConditions: state.worldConditions.map(condition =>
            condition.id === conditionId
              ? { ...condition, active: true }
              : condition
          )
        }));
      },
      
      endWorldCondition: (conditionId: string) => {
        set((state) => ({
          ...state,
          worldConditions: state.worldConditions.map(condition =>
            condition.id === conditionId
              ? { ...condition, active: false }
              : condition
          )
        }));
      },
      
      updateWorldConditions: (currentDay: number) => {
        set((state) => ({
          ...state,
          worldConditions: state.worldConditions.map(condition => {
            if (condition.active && condition.duration > 0) {
              const newDuration = condition.duration - 1;
              return {
                ...condition,
                duration: newDuration,
                active: newDuration > 0
              };
            }
            return condition;
          })
        }));
      },
      
      useClassAbility: (abilityId: string) => {
        const state = get();
        const currentDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
        
        // Find the ability across all classes
        let ability: ClassAbility | null = null;
        let owningClass: CharacterClass | null = null;
        
        for (const [classId, cls] of Object.entries(state.characterClasses)) {
          const foundAbility = cls.abilities.find(a => a.id === abilityId);
          if (foundAbility) {
            ability = foundAbility;
            owningClass = classId as CharacterClass;
            break;
          }
        }
        
        if (!ability || !owningClass || !ability.unlocked) return false;
        
        // Check if character has this class
        if (state.primaryClass !== owningClass && state.secondaryClass !== owningClass) return false;
        
        // Check cooldown
        const lastUsed = abilityCooldowns.get(abilityId) || 0;
        const daysSinceLastUse = currentDay - lastUsed;
        if (ability.cooldown && daysSinceLastUse < ability.cooldown) return false;
        
        // Check daily uses
        if (ability.usesPerDay) {
          const usedToday = abilityUsesToday.get(abilityId) || 0;
          if (usedToday >= ability.usesPerDay) return false;
        }
        
        // Use the ability
        abilityCooldowns.set(abilityId, currentDay);
        if (ability.usesPerDay) {
          abilityUsesToday.set(abilityId, (abilityUsesToday.get(abilityId) || 0) + 1);
        }
        
        return true;
      },
      
      isAbilityAvailable: (abilityId: string) => {
        const state = get();
        const currentDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
        
        // Find the ability
        let ability: ClassAbility | null = null;
        let owningClass: CharacterClass | null = null;
        
        for (const [classId, cls] of Object.entries(state.characterClasses)) {
          const foundAbility = cls.abilities.find(a => a.id === abilityId);
          if (foundAbility) {
            ability = foundAbility;
            owningClass = classId as CharacterClass;
            break;
          }
        }
        
        if (!ability || !owningClass || !ability.unlocked) return false;
        if (state.primaryClass !== owningClass && state.secondaryClass !== owningClass) return false;
        
        // Check cooldown
        if (ability.cooldown) {
          const lastUsed = abilityCooldowns.get(abilityId) || 0;
          const daysSinceLastUse = currentDay - lastUsed;
          if (daysSinceLastUse < ability.cooldown) return false;
        }
        
        // Check daily uses
        if (ability.usesPerDay) {
          const usedToday = abilityUsesToday.get(abilityId) || 0;
          if (usedToday >= ability.usesPerDay) return false;
        }
        
        return true;
      },
      
      getAbilityCooldownRemaining: (abilityId: string) => {
        const state = get();
        const currentDay = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
        
        // Find the ability
        let ability: ClassAbility | null = null;
        for (const cls of Object.values(state.characterClasses)) {
          const foundAbility = cls.abilities.find(a => a.id === abilityId);
          if (foundAbility) {
            ability = foundAbility;
            break;
          }
        }
        
        if (!ability || !ability.cooldown) return 0;
        
        const lastUsed = abilityCooldowns.get(abilityId) || 0;
        const daysSinceLastUse = currentDay - lastUsed;
        return Math.max(0, ability.cooldown - daysSinceLastUse);
      },
      
      getEffectiveCompetencyLevel: (competency: CoreCompetency) => {
        const state = get();
        const base = state.coreCompetencies[competency].level;
        const effectiveness = state.coreCompetencies[competency].effectiveness;
        
        // Apply world condition modifiers
        let modifier = 1.0;
        state.worldConditions.forEach(condition => {
          if (condition.active && condition.competencyModifiers[competency]) {
            modifier *= condition.competencyModifiers[competency]!.effectivenessMultiplier;
          }
        });
        
        return Math.floor(base * effectiveness * modifier);
      },
      
      
      canUnlockFoundation: (experienceId: FoundationExperienceId) => {
        const state = get();
        const foundation = state.foundationExperiences[experienceId];
        
        if (!foundation || foundation.unlocked) return false;
        
        if (foundation.requirements) {
          if (foundation.requirements.minLevel) {
            const totalLevel = Object.values(state.foundationExperiences)
              .reduce((sum, f) => sum + f.level, 0);
            if (totalLevel < foundation.requirements.minLevel) return false;
          }
          
          if (foundation.requirements.requiredExperiences) {
            const hasRequired = foundation.requirements.requiredExperiences.every(
              req => state.foundationExperiences[req]?.unlocked
            );
            if (!hasRequired) return false;
          }
        }
        
        return true;
      },
      
      getClassUnlockProgress: (classId: CharacterClass) => {
        const state = get();
        const classSpec = state.characterClasses[classId];
        
        if (!classSpec) return 0;
        if (classSpec.unlocked) return 1;
        
        let totalRequirements = 0;
        let metRequirements = 0;
        
        // Foundation requirements
        totalRequirements += classSpec.foundationRequirements.required.length;
        metRequirements += classSpec.foundationRequirements.required.filter(
          req => state.foundationExperiences[req]?.unlocked
        ).length;
        
        // Competency requirements
        const competencyReqs = Object.entries(classSpec.competencyRequirements || {});
        totalRequirements += competencyReqs.length;
        metRequirements += competencyReqs.filter(
          ([competency, level]) => state.coreCompetencies[competency as CoreCompetency].level >= level
        ).length;
        
        return totalRequirements > 0 ? metRequirements / totalRequirements : 0;
      },
      
      canFormTeam: (teamId: string) => {
        const state = get();
        const team = state.infiltrationTeams.find(t => t.id === teamId);
        
        if (!team || !team.unlocked) return false;
        
        // Check if player has the required primary class
        if (state.primaryClass !== team.requirements.playerClass) return false;
        
        // Check minimum class levels (simplified - assumes other team members are available)
        const hasRequiredLevels = Object.entries(team.requirements.minClassLevels || {}).every(
          ([classId, level]) => state.characterClasses[classId as CharacterClass].level >= level
        );
        
        return hasRequiredLevels;
      },
      
      getTeamEffectiveness: (teamId: string) => {
        const state = get();
        const team = state.infiltrationTeams.find(t => t.id === teamId);
        
        if (!team || !get().canFormTeam(teamId)) return 0;
        
        // Base effectiveness is team synergy
        let effectiveness = team.synergy;
        
        // Apply active synergies that benefit team operations
        state.activeSynergies.forEach(synergy => {
          if (synergy.effects.gameplayEffects.some(effect => 
            effect.type === 'storylet-unlock' || effect.type === 'special-action'
          )) {
            effectiveness *= 1.1; // 10% bonus per applicable synergy
          }
        });
        
        return effectiveness;
      },
      
      getSkillAnalytics: () => {
        const state = get();
        
        const totalLevels = Object.values(state.foundationExperiences).reduce((sum, f) => sum + f.level, 0) +
                           Object.values(state.coreCompetencies).reduce((sum, c) => sum + c.level, 0) +
                           Object.values(state.characterClasses).reduce((sum, c) => sum + c.level, 0) +
                           Object.values(state.tradeSpecializations).reduce((sum, t) => sum + t.level, 0);
        
        const highestFoundation = Object.entries(state.foundationExperiences)
          .reduce((highest, [track, foundation]) => 
            foundation.level > highest.level 
              ? { track: track as FoundationTrack, level: foundation.level }
              : highest
          , { track: 'stem' as FoundationTrack, level: 0 });
        
        const highestCompetency = Object.entries(state.coreCompetencies)
          .reduce((highest, [competency, comp]) => 
            comp.level > highest.level 
              ? { competency: competency as CoreCompetency, level: comp.level }
              : highest
          , { competency: 'bureaucratic-navigation' as CoreCompetency, level: 0 });
        
        const unlockedClasses = Object.values(state.characterClasses).filter(c => c.unlocked).length;
        
        const activeSynergies = state.activeSynergies.length;
        
        // Calculate infiltration power as a composite score
        const infiltrationPower = (
          Object.values(state.coreCompetencies).reduce((sum, c) => sum + c.level, 0) * 2 +
          unlockedClasses * 50 +
          activeSynergies * 25 +
          (state.primaryClass ? 100 : 0) +
          (state.secondaryClass ? 50 : 0)
        );
        
        return {
          totalLevels,
          highestFoundation,
          highestCompetency,
          unlockedClasses,
          activeSynergies,
          infiltrationPower
        };
      },
      
      
      exportSkillData: () => {
        const state = get();
        return JSON.stringify({
          skillSystem: state,
          cooldowns: Object.fromEntries(abilityCooldowns),
          usesToday: Object.fromEntries(abilityUsesToday),
          lastResetDay
        }, null, 2);
      },
      
      importSkillData: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.skillSystem && parsed.skillSystem.version === 2) {
            set(parsed.skillSystem);
            if (parsed.cooldowns) {
              abilityCooldowns.clear();
              Object.entries(parsed.cooldowns).forEach(([key, value]) => {
                abilityCooldowns.set(key, value as number);
              });
            }
            if (parsed.usesToday) {
              abilityUsesToday.clear();
              Object.entries(parsed.usesToday).forEach(([key, value]) => {
                abilityUsesToday.set(key, value as number);
              });
            }
            if (parsed.lastResetDay) {
              lastResetDay = parsed.lastResetDay;
            }
            return true;
          }
        } catch (e) {
          console.error('Failed to import skill data:', e);
        }
        return false;
      },
      
      // Helper functions for UI
      getFoundationLevel: (experienceId: FoundationExperienceId) => {
        const state = get();
        const foundation = state.foundationExperiences[experienceId];
        return foundation ? foundation.level : 0;
      },
      
      getFoundationsByCategory: (category: FoundationCategory) => {
        const state = get();
        return Object.values(state.foundationExperiences).filter(exp => exp.category === category);
      },
      
      getCategoryTotalXP: (category: FoundationCategory) => {
        const state = get();
        return Object.values(state.foundationExperiences)
          .filter(exp => exp.category === category)
          .reduce((total, exp) => total + exp.experience, 0);
      },
      
      getCategoryLevel: (category: FoundationCategory) => {
        const totalXP = get().getCategoryTotalXP(category);
        return Math.floor(totalXP / 100);
      },
      
      getCompetencyLevel: (competency: CoreCompetency) => {
        const state = get();
        const comp = state.coreCompetencies[competency];
        return comp ? comp.level : 1;
      },
      
      getUnlockedClasses: () => {
        const state = get();
        return state.unlockedClasses;
      },
      
      getNextClassUnlocks: () => {
        const state = get();
        return Object.values(CHARACTER_CLASSES)
          .filter(cls => !state.unlockedClasses.includes(cls.id))
          .filter(cls => get().canUnlockClass(cls.id))
          .map(cls => cls.id);
      },
      
      getOverallProgress: () => {
        const state = get();
        const foundationExp = Object.values(state.foundationExperiences).reduce((sum, foundation) => sum + foundation.experience, 0);
        const competencyExp = Object.values(state.coreCompetencies).reduce((sum, comp) => sum + comp.experience, 0);
        
        const foundationProgress = (foundationExp / 2000) * 100; // Out of 2000 total
        const competencyProgress = (competencyExp / 2500) * 100; // Out of 2500 total (5 * 500)
        
        return {
          foundationProgress: Math.min(foundationProgress, 100),
          competencyProgress: Math.min(competencyProgress, 100),
          classesUnlocked: state.unlockedClasses.length,
          totalClasses: Object.keys(CHARACTER_CLASSES).length
        };
      },
      
      calculateSynergyMultiplier: () => {
        const state = get();
        let multiplier = 1.0;
        
        // Add multiplier for each unlocked class
        multiplier += state.unlockedClasses.length * 0.1;
        
        // Add multiplier for high-level competencies
        Object.values(state.coreCompetencies).forEach(comp => {
          if (comp.level >= 5) multiplier += 0.2;
          if (comp.level >= 10) multiplier += 0.3;
        });
        
        return multiplier;
      },
      
      // Class unlock logic
      canUnlockClass: (classId: CharacterClass) => {
        const state = get();
        const classSpec = CHARACTER_CLASSES[classId];
        if (!classSpec || state.unlockedClasses.includes(classId)) {
          return false;
        }
        
        // Check foundation requirements
        const requiredFoundations = classSpec.foundationRequirements.required || [];
        const hasRequiredFoundations = requiredFoundations.every(foundationId => {
          const foundation = state.foundationExperiences[foundationId];
          return foundation && foundation.unlocked && foundation.level >= 1;
        });
        
        if (!hasRequiredFoundations) return false;
        
        // Check competency requirements
        const competencyReqs = classSpec.competencyRequirements || {};
        const hasCompetencyReqs = Object.entries(competencyReqs).every(([competency, requiredLevel]) => {
          const comp = state.coreCompetencies[competency as CoreCompetency];
          return comp && comp.level >= requiredLevel;
        });
        
        return hasCompetencyReqs;
      },
      
      unlockCharacterClass: (classId: CharacterClass) => {
        const canUnlock = get().canUnlockClass(classId);
        if (canUnlock) {
          set((state) => ({
            ...state,
            unlockedClasses: [...state.unlockedClasses, classId]
          }));
          return true;
        }
        return false;
      },
      
      // Convenience functions for UI
      addFoundationXP: (experienceId: FoundationExperienceId, amount: number) => {
        set((state) => {
          const foundation = state.foundationExperiences[experienceId];
          if (foundation) {
            const newExp = foundation.experience + amount;
            const newLevel = LEVEL_FORMULA.foundation(newExp);
            
            // Calculate competency contributions
            const updatedCompetencies = { ...state.coreCompetencies };
            foundation.contributes.forEach(({ competency, multiplier }) => {
              const contributedXP = Math.floor(amount * multiplier);
              const currentComp = updatedCompetencies[competency];
              if (currentComp) {
                const newCompExp = currentComp.experience + contributedXP;
                const newCompLevel = LEVEL_FORMULA.competency(newCompExp);
                updatedCompetencies[competency] = {
                  ...currentComp,
                  experience: newCompExp,
                  level: newCompLevel
                };
              }
            });
            
            return {
              ...state,
              foundationExperiences: {
                ...state.foundationExperiences,
                [experienceId]: {
                  ...foundation,
                  experience: newExp,
                  level: newLevel
                }
              },
              coreCompetencies: updatedCompetencies
            };
          }
          return state;
        });
      },
      
      addCompetencyXP: (competency: CoreCompetency, amount: number) => {
        set((state) => {
          const comp = state.coreCompetencies[competency];
          if (comp) {
            const newExp = comp.experience + amount;
            const newLevel = LEVEL_FORMULA.competency(newExp);
            
            return {
              ...state,
              coreCompetencies: {
                ...state.coreCompetencies,
                [competency]: {
                  ...comp,
                  experience: newExp,
                  level: newLevel
                }
              }
            };
          }
          return state;
        });
      },

      // Reset the entire skill system to initial state
      resetSkillSystem: () => {
        console.log('🔄 Resetting Skill System V2...');
        set(createInitialState());
        console.log('✅ Skill System V2 reset complete');
      }
    }),
    {
      name: 'mmv-skill-system-v2',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from version 0 to 1
          return createInitialState();
        }
        return persistedState;
      }
    }
  )
);

// Expose store globally for console access and cross-store communication
if (typeof window !== 'undefined') {
  (window as any).useSkillSystemV2Store = useSkillSystemV2Store;
}