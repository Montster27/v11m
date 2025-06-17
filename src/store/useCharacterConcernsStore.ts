import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CharacterConcerns } from '../components/CharacterCreation/ConcernsDistribution';

interface CharacterConcernsState {
  // Current character's concerns
  concerns: CharacterConcerns | null;
  
  // Historical data for analytics
  concernsHistory: Array<{
    id: string;
    concerns: CharacterConcerns;
    createdAt: Date;
    characterId?: string;
  }>;
  
  // Actions
  setConcerns: (concerns: CharacterConcerns) => void;
  clearConcerns: () => void;
  getConcernValue: (concernType: keyof CharacterConcerns) => number;
  getConcernLevel: (concernType: keyof CharacterConcerns) => 'none' | 'low' | 'moderate' | 'high' | 'extreme';
  
  // Flag generation for storylets
  generateConcernFlags: () => Record<string, boolean>;
  
  // Analytics
  getTopConcerns: (limit?: number) => Array<{ concern: keyof CharacterConcerns; value: number; label: string }>;
  getConcernsProfile: () => {
    primary: keyof CharacterConcerns | null;
    secondary: keyof CharacterConcerns | null;
    minimal: Array<keyof CharacterConcerns>;
  };
  
  // Utility
  hasActiveConcerns: () => boolean;
  getTotalConcernPoints: () => number;
}

const concernLabels: Record<keyof CharacterConcerns, string> = {
  academics: 'Academic Performance',
  socialFitting: 'Social Fitting In',
  financial: 'Financial Pressures',
  isolation: 'Being Isolated',
  genderIssues: 'Gender Issues',
  raceIssues: 'Racial Issues',
  classIssues: 'Social Class Issues'
};

export const useCharacterConcernsStore = create<CharacterConcernsState>()(
  persist(
    (set, get) => ({
      concerns: null,
      concernsHistory: [],
      
      setConcerns: (concerns: CharacterConcerns) => {
        const historyEntry = {
          id: `concerns_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          concerns,
          createdAt: new Date()
        };
        
        set((state) => ({
          concerns,
          concernsHistory: [...state.concernsHistory, historyEntry]
        }));
        
        console.log('📊 Character concerns set:', concerns);
        console.log('🏷️ Generated flags:', get().generateConcernFlags());
      },
      
      clearConcerns: () => {
        set({ concerns: null });
        console.log('🧹 Character concerns cleared');
      },
      
      getConcernValue: (concernType: keyof CharacterConcerns) => {
        const { concerns } = get();
        return concerns ? concerns[concernType] : 0;
      },
      
      getConcernLevel: (concernType: keyof CharacterConcerns) => {
        const value = get().getConcernValue(concernType);
        if (value === 0) return 'none';
        if (value <= 10) return 'low';
        if (value <= 20) return 'moderate';
        if (value <= 30) return 'high';
        return 'extreme';
      },
      
      generateConcernFlags: () => {
        const { concerns } = get();
        if (!concerns) return {};
        
        const flags: Record<string, boolean> = {};
        
        // Generate basic concern flags
        Object.entries(concerns).forEach(([key, value]) => {
          const concernKey = key as keyof CharacterConcerns;
          
          // Basic presence flags
          flags[`concern_${key}`] = value > 0;
          flags[`concern_${key}_none`] = value === 0;
          flags[`concern_${key}_low`] = value > 0 && value <= 10;
          flags[`concern_${key}_moderate`] = value > 10 && value <= 20;
          flags[`concern_${key}_high`] = value > 20 && value <= 30;
          flags[`concern_${key}_extreme`] = value > 30;
          
          // Threshold flags for storylet triggers
          flags[`concern_${key}_5plus`] = value >= 5;
          flags[`concern_${key}_10plus`] = value >= 10;
          flags[`concern_${key}_15plus`] = value >= 15;
          flags[`concern_${key}_20plus`] = value >= 20;
          flags[`concern_${key}_25plus`] = value >= 25;
        });
        
        // Generate profile flags
        const profile = get().getConcernsProfile();
        if (profile.primary) {
          flags[`primary_concern_${profile.primary}`] = true;
          flags['has_primary_concern'] = true;
        }
        if (profile.secondary) {
          flags[`secondary_concern_${profile.secondary}`] = true;
          flags['has_secondary_concern'] = true;
        }
        
        // Combination flags for complex storylet triggers
        flags['socially_concerned'] = concerns.socialFitting >= 15 || concerns.isolation >= 15;
        flags['financially_stressed'] = concerns.financial >= 15;
        flags['academically_focused'] = concerns.academics >= 20;
        flags['culturally_aware'] = (concerns.genderIssues + concerns.raceIssues + concerns.classIssues) >= 25;
        flags['highly_concerned'] = Object.values(concerns).some(v => v >= 25);
        flags['well_balanced'] = Object.values(concerns).every(v => v >= 5 && v <= 15);
        flags['minimally_concerned'] = Object.values(concerns).every(v => v <= 10);
        
        // Social dynamics flags
        flags['social_and_isolated'] = concerns.socialFitting >= 10 && concerns.isolation >= 10;
        flags['academic_and_financial'] = concerns.academics >= 15 && concerns.financial >= 15;
        flags['cultural_issues_focused'] = concerns.genderIssues >= 10 || concerns.raceIssues >= 10 || concerns.classIssues >= 10;
        
        return flags;
      },
      
      getTopConcerns: (limit = 3) => {
        const { concerns } = get();
        if (!concerns) return [];
        
        return Object.entries(concerns)
          .map(([key, value]) => ({
            concern: key as keyof CharacterConcerns,
            value,
            label: concernLabels[key as keyof CharacterConcerns]
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, limit)
          .filter(item => item.value > 0);
      },
      
      getConcernsProfile: () => {
        const topConcerns = get().getTopConcerns(7);
        
        return {
          primary: topConcerns.length > 0 && topConcerns[0].value >= 15 ? topConcerns[0].concern : null,
          secondary: topConcerns.length > 1 && topConcerns[1].value >= 10 ? topConcerns[1].concern : null,
          minimal: topConcerns.filter(c => c.value <= 5).map(c => c.concern)
        };
      },
      
      hasActiveConcerns: () => {
        const { concerns } = get();
        return concerns ? Object.values(concerns).some(v => v > 0) : false;
      },
      
      getTotalConcernPoints: () => {
        const { concerns } = get();
        return concerns ? Object.values(concerns).reduce((sum, value) => sum + value, 0) : 0;
      }
    }),
    {
      name: 'character-concerns-store',
      partialize: (state) => ({
        concerns: state.concerns,
        concernsHistory: state.concernsHistory
      })
    }
  )
);

// Global function for storylet integration
if (typeof window !== 'undefined') {
  (window as any).useCharacterConcernsStore = useCharacterConcernsStore;
  
  // Helper function for storylets to check concern flags
  (window as any).checkConcernFlag = (flagName: string): boolean => {
    const store = useCharacterConcernsStore.getState();
    const flags = store.generateConcernFlags();
    return flags[flagName] || false;
  };
  
  // Helper function to get concern value
  (window as any).getConcernValue = (concernType: keyof CharacterConcerns): number => {
    const store = useCharacterConcernsStore.getState();
    return store.getConcernValue(concernType);
  };
  
  // Helper function to get concern level
  (window as any).getConcernLevel = (concernType: keyof CharacterConcerns): string => {
    const store = useCharacterConcernsStore.getState();
    return store.getConcernLevel(concernType);
  };
}