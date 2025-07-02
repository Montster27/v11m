// /Users/montysharma/v11m2/src/hooks/useAvailableStorylets.ts
// Optimized hook for batched storylet evaluation with memoized flag generation

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStoryletStore } from '../store/useStoryletStore';
import { useCharacterConcernsStore } from '../store/useCharacterConcernsStore';
import { useCoreGameStore } from '../stores/v2';
import { generateAllFlags, getFlagGeneratorStats } from '../utils/flagGenerator';
import type { Storylet } from '../types/storylet';

export interface StoryletEvaluationResult {
  availableStorylets: Storylet[];
  isEvaluating: boolean;
  evaluationTime: number;
  totalStorylets: number;
  flagCount: number;
  cacheStats: ReturnType<typeof getFlagGeneratorStats>;
}

export interface StoryletEvaluationOptions {
  batchSize?: number;
  timeoutMs?: number;
  enableIdleCallback?: boolean;
  enableProfiling?: boolean;
}

/**
 * Evaluates if a storylet meets its requirements
 * This function should match your existing storylet evaluation logic
 */
const evaluateStoryletRequirements = (storylet: Storylet, flags: Record<string, boolean>): boolean => {
  // Basic null checks
  if (!storylet || !flags) return false;
  
  // If no requirements, storylet is available
  if (!storylet.requirements || Object.keys(storylet.requirements).length === 0) {
    return true;
  }
  
  const { requirements } = storylet;
  
  // Check flag requirements
  if (requirements.flags) {
    const flagRequirements = Array.isArray(requirements.flags) ? requirements.flags : [requirements.flags];
    
    for (const flagReq of flagRequirements) {
      if (typeof flagReq === 'string') {
        // Simple flag presence check
        if (!flags[flagReq]) return false;
      } else if (typeof flagReq === 'object') {
        // Complex flag object with value checks
        for (const [flagName, expectedValue] of Object.entries(flagReq)) {
          if (flags[flagName] !== expectedValue) return false;
        }
      }
    }
  }
  
  // Check resource requirements (integrate with game state)
  if (requirements.resources) {
    // This would need to be implemented based on your resource system
    // For now, assume resource checks pass
  }
  
  // Check other requirement types as needed
  // Add more requirement checks based on your storylet system
  
  return true;
};

/**
 * Batched storylet evaluation with performance optimization
 */
export function useAvailableStorylets(options: StoryletEvaluationOptions = {}): StoryletEvaluationResult {
  const {
    batchSize = 50,
    timeoutMs = 100,
    enableIdleCallback = true,
    enableProfiling = process.env.NODE_ENV === 'development'
  } = options;

  // State management
  const [availableStorylets, setAvailableStorylets] = useState<Storylet[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationTime, setEvaluationTime] = useState(0);

  // Store hooks
  const allStorylets = useStoryletStore(state => state.storylets || []);
  const concerns = useCharacterConcernsStore(state => state.concerns);
  const coreGameState = useCoreGameStore(state => ({
    player: state.player,
    world: state.world,
    character: state.character
  }));

  // Memoized flag generation - only regenerates when dependencies change
  const allFlags = useMemo(() => {
    if (!concerns) return {};
    
    const gameFlags = {
      // Extract relevant game state as flags
      player_level: coreGameState.player?.level || 1,
      day: coreGameState.world?.day || 1,
      player_energy: coreGameState.player?.resources?.energy || 100,
      player_money: coreGameState.player?.resources?.money || 0,
      // Add more game state flags as needed
    };

    const playerStats = {
      level: coreGameState.player?.level || 1,
      energy: coreGameState.player?.resources?.energy || 100,
      // Add more player stats as needed
    };

    if (enableProfiling) {
      console.time('[useAvailableStorylets] Flag generation');
    }

    const flags = generateAllFlags(concerns, gameFlags, playerStats);

    if (enableProfiling) {
      console.timeEnd('[useAvailableStorylets] Flag generation');
      console.log(`[useAvailableStorylets] Generated ${Object.keys(flags).length} flags`);
    }

    return flags;
  }, [concerns, coreGameState, enableProfiling]);

  // Batched evaluation function
  const evaluateStoryletsBatched = useCallback(async (
    storylets: Storylet[],
    flags: Record<string, boolean>
  ): Promise<Storylet[]> => {
    return new Promise((resolve) => {
      const available: Storylet[] = [];
      let currentIndex = 0;

      const processBatch = () => {
        const startTime = performance.now();
        const endIndex = Math.min(currentIndex + batchSize, storylets.length);

        // Process current batch
        for (let i = currentIndex; i < endIndex; i++) {
          try {
            if (evaluateStoryletRequirements(storylets[i], flags)) {
              available.push(storylets[i]);
            }
          } catch (error) {
            console.warn(`[useAvailableStorylets] Error evaluating storylet ${storylets[i]?.id}:`, error);
          }
        }

        currentIndex = endIndex;
        const batchTime = performance.now() - startTime;

        if (enableProfiling) {
          console.log(`[useAvailableStorylets] Processed batch ${Math.ceil(endIndex / batchSize)}/${Math.ceil(storylets.length / batchSize)} in ${batchTime.toFixed(2)}ms`);
        }

        // Continue with next batch or finish
        if (currentIndex < storylets.length) {
          // Schedule next batch
          if (enableIdleCallback && 'requestIdleCallback' in window) {
            const idleId = requestIdleCallback(processBatch, { timeout: timeoutMs });
            // Store the ID for cleanup if needed
          } else {
            setTimeout(processBatch, 0);
          }
        } else {
          // All batches complete
          resolve(available);
        }
      };

      // Start processing
      processBatch();
    });
  }, [batchSize, timeoutMs, enableIdleCallback, enableProfiling]);

  // Main evaluation effect
  useEffect(() => {
    if (!concerns || !allStorylets.length) {
      setAvailableStorylets([]);
      setEvaluationTime(0);
      return;
    }

    setIsEvaluating(true);
    const startTime = performance.now();

    if (enableProfiling) {
      console.log(`[useAvailableStorylets] Starting evaluation of ${allStorylets.length} storylets`);
    }

    evaluateStoryletsBatched(allStorylets, allFlags)
      .then((available) => {
        const endTime = performance.now();
        const totalTime = endTime - startTime;

        setAvailableStorylets(available);
        setEvaluationTime(totalTime);
        setIsEvaluating(false);

        if (enableProfiling) {
          console.log(`[useAvailableStorylets] Evaluation complete: ${available.length}/${allStorylets.length} storylets available in ${totalTime.toFixed(2)}ms`);
        }
      })
      .catch((error) => {
        console.error('[useAvailableStorylets] Evaluation failed:', error);
        setAvailableStorylets([]);
        setIsEvaluating(false);
      });

  }, [allStorylets, allFlags, evaluateStoryletsBatched, enableProfiling, concerns]);

  // Performance monitoring
  const cacheStats = useMemo(() => {
    return getFlagGeneratorStats();
  }, [allFlags]); // Update when flags change

  return {
    availableStorylets,
    isEvaluating,
    evaluationTime,
    totalStorylets: allStorylets.length,
    flagCount: Object.keys(allFlags).length,
    cacheStats
  };
}

/**
 * Lightweight version for simple storylet availability checks
 * Use this when you only need a boolean check, not the full list
 */
export function useStoryletAvailable(storyletId: string): boolean {
  const { availableStorylets } = useAvailableStorylets({
    enableProfiling: false,
    batchSize: 100 // Larger batches for simple checks
  });

  return useMemo(() => {
    return availableStorylets.some(s => s.id === storyletId);
  }, [availableStorylets, storyletId]);
}

/**
 * Hook for getting specific storylets by category or criteria
 */
export function useAvailableStoryletsByCategory(category?: string): Storylet[] {
  const { availableStorylets } = useAvailableStorylets();

  return useMemo(() => {
    if (!category) return availableStorylets;
    return availableStorylets.filter(s => s.category === category);
  }, [availableStorylets, category]);
}

/**
 * Performance monitoring hook for storylet evaluation
 */
export function useStoryletEvaluationPerformance() {
  const [performanceLog, setPerformanceLog] = useState<Array<{
    timestamp: number;
    evaluationTime: number;
    storyletCount: number;
    flagCount: number;
    cacheHits: number;
    cacheMisses: number;
  }>>([]);

  const { evaluationTime, totalStorylets, flagCount, cacheStats } = useAvailableStorylets({
    enableProfiling: true
  });

  useEffect(() => {
    if (evaluationTime > 0) {
      const entry = {
        timestamp: Date.now(),
        evaluationTime,
        storyletCount: totalStorylets,
        flagCount,
        cacheHits: cacheStats.cacheHits,
        cacheMisses: cacheStats.cacheMisses
      };

      setPerformanceLog(prev => [...prev.slice(-9), entry]); // Keep last 10 entries
    }
  }, [evaluationTime, totalStorylets, flagCount, cacheStats]);

  return {
    performanceLog,
    averageEvaluationTime: performanceLog.length > 0 
      ? performanceLog.reduce((sum, entry) => sum + entry.evaluationTime, 0) / performanceLog.length 
      : 0,
    currentStats: cacheStats
  };
}