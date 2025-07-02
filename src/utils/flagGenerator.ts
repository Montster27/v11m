// /Users/montysharma/v11m2/src/utils/flagGenerator.ts
// Memoized flag generation for improved performance

import * as _ from 'lodash';

export interface CharacterConcerns {
  academic?: number;
  social?: number;
  financial?: number;
  health?: number;
  family?: number;
  career?: number;
  romantic?: number;
  personal?: number;
  [key: string]: number | undefined;
}

export interface FlagGeneratorStats {
  cacheHits: number;
  cacheMisses: number;
  lastGenerationTime: number;
  cacheSize: number;
}

// Internal statistics tracking
let stats: FlagGeneratorStats = {
  cacheHits: 0,
  cacheMisses: 0,
  lastGenerationTime: 0,
  cacheSize: 0
};

/**
 * Serialize concerns for stable memoization key
 * Ensures consistent cache keys regardless of object property order
 */
const serializeConcerns = (concerns: CharacterConcerns): string => {
  if (!concerns || typeof concerns !== 'object') {
    return 'empty';
  }
  
  return Object.entries(concerns)
    .filter(([_, value]) => typeof value === 'number') // Only include valid numbers
    .sort(([a], [b]) => a.localeCompare(b)) // Stable sorting
    .map(([key, value]) => `${key}:${value}`)
    .join(',');
};

/**
 * Generate concern-based flags from character concerns
 * Creates flags for various concern levels and combinations
 */
const _generateConcernFlags = (concerns: CharacterConcerns): Record<string, boolean> => {
  const startTime = performance.now();
  console.log('[FlagGenerator] Computing flags for concerns:', Object.keys(concerns));
  
  const flags: Record<string, boolean> = {};

  if (!concerns || typeof concerns !== 'object') {
    console.warn('[FlagGenerator] Invalid concerns object provided');
    return flags;
  }

  // Generate individual concern flags
  Object.entries(concerns).forEach(([key, value]) => {
    if (typeof value !== 'number') return;
    
    // Basic presence flags
    flags[`concern_${key}`] = value > 0;
    flags[`has_concern_${key}`] = value > 0;
    
    // Level-based flags
    flags[`concern_${key}_none`] = value === 0;
    flags[`concern_${key}_low`] = value > 0 && value <= 10;
    flags[`concern_${key}_moderate`] = value > 10 && value <= 20;
    flags[`concern_${key}_high`] = value > 20 && value <= 30;
    flags[`concern_${key}_critical`] = value > 30;
    
    // Threshold flags for storylet conditions
    flags[`concern_${key}_gt_5`] = value > 5;
    flags[`concern_${key}_gt_10`] = value > 10;
    flags[`concern_${key}_gt_15`] = value > 15;
    flags[`concern_${key}_gt_20`] = value > 20;
    flags[`concern_${key}_gt_25`] = value > 25;
    
    // Range flags
    flags[`concern_${key}_minor`] = value > 0 && value < 5;
    flags[`concern_${key}_manageable`] = value >= 5 && value < 15;
    flags[`concern_${key}_significant`] = value >= 15 && value < 25;
    flags[`concern_${key}_overwhelming`] = value >= 25;
  });

  // Generate aggregate flags
  const concernValues = Object.values(concerns).filter((v): v is number => typeof v === 'number');
  const totalConcerns = concernValues.reduce((sum, val) => sum + val, 0);
  const averageConcern = concernValues.length > 0 ? totalConcerns / concernValues.length : 0;
  const maxConcern = Math.max(...concernValues, 0);
  const activeConcernCount = concernValues.filter(v => v > 0).length;

  // Overall concern state flags
  flags['has_any_concerns'] = activeConcernCount > 0;
  flags['has_multiple_concerns'] = activeConcernCount > 1;
  flags['has_many_concerns'] = activeConcernCount >= 3;
  flags['overwhelmed'] = activeConcernCount >= 4 && averageConcern > 15;
  
  // Severity aggregate flags
  flags['low_overall_stress'] = maxConcern <= 10;
  flags['moderate_overall_stress'] = maxConcern > 10 && maxConcern <= 20;
  flags['high_overall_stress'] = maxConcern > 20;
  flags['crisis_mode'] = maxConcern > 30 || (activeConcernCount >= 3 && averageConcern > 20);
  
  // Total concern flags
  flags['total_concerns_low'] = totalConcerns <= 20;
  flags['total_concerns_moderate'] = totalConcerns > 20 && totalConcerns <= 50;
  flags['total_concerns_high'] = totalConcerns > 50;
  
  // Specific concern combinations for storylets
  const academic = concerns.academic || 0;
  const social = concerns.social || 0;
  const financial = concerns.financial || 0;
  const health = concerns.health || 0;
  
  flags['academic_social_stress'] = academic > 15 && social > 15;
  flags['financial_health_crisis'] = financial > 20 && health > 15;
  flags['triple_threat'] = [academic, social, financial].filter(v => v > 15).length >= 3;
  flags['balanced_concerns'] = activeConcernCount >= 3 && Math.max(...concernValues) - Math.min(...concernValues.filter(v => v > 0)) <= 10;

  const endTime = performance.now();
  stats.lastGenerationTime = endTime - startTime;
  stats.cacheMisses++;
  
  console.log(`[FlagGenerator] Generated ${Object.keys(flags).length} flags in ${stats.lastGenerationTime.toFixed(2)}ms`);
  
  return flags;
};

/**
 * Memoized version of flag generation for performance optimization
 * Uses lodash memoize with custom resolver for stable cache keys
 */
export const generateConcernFlags = _.memoize(
  _generateConcernFlags,
  (concerns: CharacterConcerns) => {
    const key = serializeConcerns(concerns);
    
    // Check if this is a cache hit
    if (generateConcernFlags.cache.has(key)) {
      stats.cacheHits++;
      console.log('[FlagGenerator] Cache hit for key:', key.substring(0, 50) + '...');
    }
    
    return key;
  }
);

/**
 * Generate flags from multiple sources efficiently
 * Combines concern flags with game flags
 */
export const generateAllFlags = _.memoize(
  (
    concerns: CharacterConcerns, 
    gameFlags: Record<string, any> = {}, 
    playerStats: Record<string, any> = {}
  ): Record<string, boolean> => {
    const startTime = performance.now();
    
    // Get memoized concern flags
    const concernFlags = generateConcernFlags(concerns);
    
    // Convert game flags to boolean flags
    const booleanGameFlags: Record<string, boolean> = {};
    Object.entries(gameFlags).forEach(([key, value]) => {
      booleanGameFlags[key] = Boolean(value);
      
      // Generate typed flags for common value types
      if (typeof value === 'number') {
        booleanGameFlags[`${key}_positive`] = value > 0;
        booleanGameFlags[`${key}_zero`] = value === 0;
        booleanGameFlags[`${key}_negative`] = value < 0;
      }
    });
    
    // Generate player stat flags
    const statFlags: Record<string, boolean> = {};
    Object.entries(playerStats).forEach(([key, value]) => {
      if (typeof value === 'number') {
        statFlags[`stat_${key}_high`] = value > 75;
        statFlags[`stat_${key}_medium`] = value > 25 && value <= 75;
        statFlags[`stat_${key}_low`] = value <= 25;
      }
    });
    
    const allFlags = {
      ...concernFlags,
      ...booleanGameFlags,
      ...statFlags
    };
    
    const endTime = performance.now();
    console.log(`[FlagGenerator] Generated ${Object.keys(allFlags).length} total flags in ${(endTime - startTime).toFixed(2)}ms`);
    
    return allFlags;
  },
  (concerns, gameFlags, playerStats) => {
    return `${serializeConcerns(concerns)}|${JSON.stringify(gameFlags)}|${JSON.stringify(playerStats)}`;
  }
);

/**
 * Clear memoization cache when needed
 * Useful for testing or when memory needs to be freed
 */
export const clearFlagCache = (): void => {
  console.log('[FlagGenerator] Clearing flag cache');
  
  // Clear individual caches
  generateConcernFlags.cache.clear();
  generateAllFlags.cache.clear();
  
  // Reset stats
  stats = {
    cacheHits: 0,
    cacheMisses: 0,
    lastGenerationTime: 0,
    cacheSize: 0
  };
  
  console.log('[FlagGenerator] Cache cleared');
};

/**
 * Get cache statistics for monitoring performance
 */
export const getFlagGeneratorStats = (): FlagGeneratorStats => {
  return {
    ...stats,
    cacheSize: Object.keys(generateConcernFlags.cache || {}).length + Object.keys(generateAllFlags.cache || {}).length
  };
};

/**
 * Optimize cache by removing old entries
 * Keeps only the most recently used entries
 */
export const optimizeFlagCache = (maxEntries: number = 100): void => {
  console.log('[FlagGenerator] Optimizing cache...');
  
  // For lodash memoize, we'll clear and let it rebuild naturally
  // This is a simple approach - in production you might want LRU cache
  const currentCacheSize = Object.keys(generateConcernFlags.cache || {}).length;
  if (currentCacheSize > maxEntries) {
    console.log(`[FlagGenerator] Cache size (${currentCacheSize}) exceeds limit (${maxEntries}), clearing`);
    clearFlagCache();
  }
};

/**
 * Warm up cache with common concern patterns
 * Pre-generates flags for typical concern combinations
 */
export const warmUpFlagCache = (): void => {
  console.log('[FlagGenerator] Warming up flag cache...');
  
  const commonPatterns: CharacterConcerns[] = [
    {}, // No concerns
    { academic: 10 }, // Single low concern
    { academic: 20, social: 15 }, // Moderate dual concerns
    { academic: 25, social: 20, financial: 15 }, // High triple concerns
    { academic: 30, social: 25, financial: 20, health: 15 }, // Crisis mode
  ];
  
  commonPatterns.forEach((pattern, index) => {
    generateConcernFlags(pattern);
    console.log(`[FlagGenerator] Warmed pattern ${index + 1}/${commonPatterns.length}`);
  });
  
  console.log('[FlagGenerator] Cache warm-up complete');
};

// Auto-cleanup: periodically optimize cache to prevent memory leaks
if (typeof window !== 'undefined') {
  setInterval(() => {
    optimizeFlagCache(50); // Keep max 50 entries
  }, 5 * 60 * 1000); // Every 5 minutes
}