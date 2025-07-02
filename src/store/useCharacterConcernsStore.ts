import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CharacterConcerns } from '../components/CharacterCreation/ConcernsDistribution';
import { generateConcernFlags as generateMemoizedFlags, clearFlagCache, getFlagGeneratorStats } from '../utils/flagGenerator';

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
  
  // Flag generation for storylets (memoized)
  generateConcernFlags: () => Record<string, boolean>;
  
  // Cache management
  clearFlagCache: () => void;
  getFlagCacheStats: () => any;
  
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

// Map our CharacterConcerns interface to the memoized flag generator's interface
const mapConcernsToFlagGenerator = (concerns: CharacterConcerns | null): import('../utils/flagGenerator').CharacterConcerns => {
  if (!concerns) return {};
  
  return {
    academic: concerns.academics || 0,
    social: (concerns.socialFitting || 0) + (concerns.isolation || 0), // Combine social concerns
    financial: concerns.financial || 0,
    personal: (concerns.genderIssues || 0) + (concerns.raceIssues || 0) + (concerns.classIssues || 0), // Combine identity concerns
    health: 0, // Not tracked in our interface
    family: 0, // Not tracked in our interface
    career: concerns.academics || 0, // Academic concerns often relate to career
    romantic: 0 // Not tracked in our interface
  };
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
        
        // Map to the flag generator's format and get memoized flags
        const mappedConcerns = mapConcernsToFlagGenerator(concerns);
        const memoizedFlags = generateMemoizedFlags(mappedConcerns);
        
        // Add our custom flags for backward compatibility
        const customFlags: Record<string, boolean> = {};
        
        // Generate basic concern flags for our specific concerns
        (Object.entries(concerns) as Array<[keyof CharacterConcerns, number]>).forEach(([key, value]) => {
          const keyStr = String(key);
          // Basic presence flags
          customFlags[`concern_${keyStr}`] = value > 0;
          customFlags[`concern_${keyStr}_none`] = value === 0;
          customFlags[`concern_${keyStr}_low`] = value > 0 && value <= 10;
          customFlags[`concern_${keyStr}_moderate`] = value > 10 && value <= 20;
          customFlags[`concern_${keyStr}_high`] = value > 20 && value <= 30;
          customFlags[`concern_${keyStr}_extreme`] = value > 30;
          
          // Threshold flags for storylet triggers
          customFlags[`concern_${keyStr}_5plus`] = value >= 5;
          customFlags[`concern_${keyStr}_10plus`] = value >= 10;
          customFlags[`concern_${keyStr}_15plus`] = value >= 15;
          customFlags[`concern_${keyStr}_20plus`] = value >= 20;
          customFlags[`concern_${keyStr}_25plus`] = value >= 25;
        });
        
        // Generate profile flags
        const profile = get().getConcernsProfile();
        if (profile.primary) {
          customFlags[`primary_concern_${String(profile.primary)}`] = true;
          customFlags['has_primary_concern'] = true;
        }
        if (profile.secondary) {
          customFlags[`secondary_concern_${String(profile.secondary)}`] = true;
          customFlags['has_secondary_concern'] = true;
        }
        
        // Combination flags for complex storylet triggers (specific to our concerns)
        customFlags['socially_concerned'] = concerns.socialFitting >= 15 || concerns.isolation >= 15;
        customFlags['financially_stressed'] = concerns.financial >= 15;
        customFlags['academically_focused'] = concerns.academics >= 20;
        customFlags['culturally_aware'] = (concerns.genderIssues + concerns.raceIssues + concerns.classIssues) >= 25;
        customFlags['highly_concerned'] = (Object.values(concerns) as number[]).some(v => v >= 25);
        customFlags['well_balanced'] = (Object.values(concerns) as number[]).every(v => v >= 5 && v <= 15);
        customFlags['minimally_concerned'] = (Object.values(concerns) as number[]).every(v => v <= 10);
        
        // Social dynamics flags
        customFlags['social_and_isolated'] = concerns.socialFitting >= 10 && concerns.isolation >= 10;
        customFlags['academic_and_financial'] = concerns.academics >= 15 && concerns.financial >= 15;
        customFlags['cultural_issues_focused'] = concerns.genderIssues >= 10 || concerns.raceIssues >= 10 || concerns.classIssues >= 10;
        
        // Merge memoized flags with custom flags (custom flags take precedence)
        return { ...memoizedFlags, ...customFlags };
      },
      
      clearFlagCache: () => {
        clearFlagCache();
        console.log('🧹 Character concerns flag cache cleared');
      },
      
      getFlagCacheStats: () => {
        return getFlagGeneratorStats();
      },
      
      getTopConcerns: (limit = 3) => {
        const { concerns } = get();
        if (!concerns) return [];
        
        return (Object.entries(concerns) as Array<[keyof CharacterConcerns, number]>)
          .map(([key, value]) => ({
            concern: key,
            value,
            label: concernLabels[key]
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
        return concerns ? (Object.values(concerns) as number[]).some(v => v > 0) : false;
      },
      
      getTotalConcernPoints: () => {
        const { concerns } = get();
        return concerns ? (Object.values(concerns) as number[]).reduce((sum, value) => sum + value, 0) : 0;
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
  
  // Cache management functions for dev/debugging
  (window as any).clearConcernFlagCache = (): void => {
    const store = useCharacterConcernsStore.getState();
    store.clearFlagCache();
  };
  
  (window as any).getConcernFlagCacheStats = (): any => {
    const store = useCharacterConcernsStore.getState();
    return store.getFlagCacheStats();
  };
}