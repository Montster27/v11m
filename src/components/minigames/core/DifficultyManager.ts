// /Users/montysharma/V11M2/src/components/minigames/core/DifficultyManager.ts
// Adaptive difficulty progression system for minigames

import { 
  MinigameDifficulty, 
  MinigameContext, 
  MinigameResult,
  DifficultyAdjustment,
  PlayerMinigameStats 
} from './types';

interface DifficultyWeights {
  winRate: number;
  averageScore: number;
  averageTime: number;
  streakBonus: number;
  skillLevel: number;
}

interface PerformanceMetrics {
  winRate: number;        // 0-1
  averageScore: number;   // 0-1 normalized
  averageTime: number;    // 0-1 normalized (lower is better)
  currentStreak: number;
  skillLevel: number;     // 0-1 from player attributes
}

export class DifficultyManager {
  private weights: DifficultyWeights = {
    winRate: 0.4,     // Most important factor
    averageScore: 0.3,
    averageTime: 0.15,
    streakBonus: 0.1,
    skillLevel: 0.05  // Slight influence from player skills
  };

  // Thresholds for difficulty changes (0-1 performance scale)
  private thresholds = {
    increaseToMedium: 0.75,   // From easy to medium
    increaseToHard: 0.8,      // From medium to hard  
    increaseToExpert: 0.85,   // From hard to expert
    decreaseFromExpert: 0.4,  // From expert to hard
    decreaseFromHard: 0.35,   // From hard to medium
    decreaseFromMedium: 0.3   // From medium to easy
  };

  // Minimum games required before adjusting difficulty
  private minGamesForAdjustment = 3;

  // Recent games window for performance calculation
  private recentGamesWindow = 10;

  constructor(weights?: Partial<DifficultyWeights>) {
    if (weights) {
      this.weights = { ...this.weights, ...weights };
    }
    console.log('🎯 DifficultyManager initialized with weights:', this.weights);
  }

  /**
   * Calculate recommended difficulty based on player performance and context
   */
  calculateDifficulty(
    gameId: string,
    playerStats: PlayerMinigameStats,
    context: MinigameContext
  ): MinigameDifficulty {
    // Use context override if specified
    if (context.requiredDifficulty) {
      console.log(`🎯 Using context-specified difficulty: ${context.requiredDifficulty}`);
      return context.requiredDifficulty;
    }

    // Check if player has played this game before
    const gameStats = playerStats[gameId];
    if (!gameStats || gameStats.totalPlays < this.minGamesForAdjustment) {
      console.log(`🎯 Insufficient data for ${gameId}, using default: medium`);
      return 'medium'; // Default for new players
    }

    // Calculate performance metrics
    const performance = this.calculatePerformanceScore(gameStats, context);
    const currentDifficulty = gameStats.currentDifficulty;

    console.log(`🎯 Performance score for ${gameId}: ${performance.toFixed(3)} (current: ${currentDifficulty})`);

    // Determine if difficulty should change
    const adjustment = this.shouldAdjustDifficulty(currentDifficulty, performance);
    
    if (adjustment) {
      console.log(`🎯 Recommending difficulty change: ${currentDifficulty} → ${adjustment.newDifficulty} (${adjustment.reason})`);
      return adjustment.newDifficulty;
    }

    return currentDifficulty;
  }

  /**
   * Calculate overall performance score (0-1) based on recent games
   */
  private calculatePerformanceScore(
    gameStats: PlayerMinigameStats[string],
    context: MinigameContext
  ): number {
    // Get recent results for analysis
    const recentResults = gameStats.recentResults
      .slice(-this.recentGamesWindow)
      .filter(result => result.stats);

    if (recentResults.length === 0) {
      return 0.5; // Neutral performance if no recent data
    }

    // Calculate individual metrics
    const metrics = this.extractPerformanceMetrics(gameStats, recentResults, context);

    // Weighted performance score
    const score = 
      metrics.winRate * this.weights.winRate +
      metrics.averageScore * this.weights.averageScore +
      (1 - metrics.averageTime) * this.weights.averageTime + // Invert time (faster = better)
      Math.min(metrics.currentStreak / 5, 1) * this.weights.streakBonus + // Cap streak bonus
      metrics.skillLevel * this.weights.skillLevel;

    return Math.max(0, Math.min(1, score)); // Clamp to 0-1
  }

  /**
   * Extract normalized performance metrics from game statistics
   */
  private extractPerformanceMetrics(
    gameStats: PlayerMinigameStats[string],
    recentResults: MinigameResult[],
    context: MinigameContext
  ): PerformanceMetrics {
    // Win rate from recent games
    const wins = recentResults.filter(r => r.success).length;
    const winRate = wins / recentResults.length;

    // Average score (normalize to 0-1 based on game-specific scaling)
    const avgScore = recentResults.reduce((sum, r) => sum + r.stats.score, 0) / recentResults.length;
    const normalizedScore = this.normalizeScore(avgScore, gameStats.bestScore);

    // Average time (normalize relative to typical completion times)
    const avgTime = recentResults.reduce((sum, r) => sum + r.stats.timeElapsed, 0) / recentResults.length;
    const normalizedTime = this.normalizeTime(avgTime, gameStats.averageTime);

    // Current streak
    const currentStreak = gameStats.currentStreak;

    // Skill level from player context
    const skillLevel = this.extractSkillLevel(context);

    return {
      winRate,
      averageScore: normalizedScore,
      averageTime: normalizedTime,
      currentStreak,
      skillLevel
    };
  }

  /**
   * Normalize score to 0-1 scale
   */
  private normalizeScore(score: number, bestScore: number): number {
    if (bestScore <= 0) return 0.5;
    return Math.min(score / bestScore, 1);
  }

  /**
   * Normalize time to 0-1 scale (0 = very slow, 1 = very fast)
   */
  private normalizeTime(currentTime: number, averageTime: number): number {
    if (averageTime <= 0) return 0.5;
    
    // Times much faster than average get higher scores
    // Times much slower than average get lower scores
    const ratio = averageTime / currentTime;
    return Math.max(0, Math.min(1, ratio));
  }

  /**
   * Extract skill level from player context (0-1)
   */
  private extractSkillLevel(context: MinigameContext): number {
    if (!context.playerStats?.skills) return 0.5;

    // Average relevant skills (implementation can be game-specific)
    const relevantSkills = ['academics', 'creativity', 'problemSolving', 'memory'];
    const skills = context.playerStats.skills;
    
    let totalSkill = 0;
    let skillCount = 0;

    for (const skill of relevantSkills) {
      if (skills[skill] !== undefined) {
        totalSkill += skills[skill];
        skillCount++;
      }
    }

    if (skillCount === 0) return 0.5;

    // Normalize to 0-1 (assuming skills are 0-100)
    return Math.min(totalSkill / (skillCount * 100), 1);
  }

  /**
   * Determine if difficulty should be adjusted based on performance
   */
  private shouldAdjustDifficulty(
    currentDifficulty: MinigameDifficulty,
    performanceScore: number
  ): DifficultyAdjustment | null {
    const { thresholds } = this;

    // Check for increases
    switch (currentDifficulty) {
      case 'easy':
        if (performanceScore >= thresholds.increaseToMedium) {
          return {
            gameId: '', // Will be filled by caller
            oldDifficulty: currentDifficulty,
            newDifficulty: 'medium',
            reason: 'performance',
            confidence: Math.min((performanceScore - thresholds.increaseToMedium) * 4, 1)
          };
        }
        break;

      case 'medium':
        if (performanceScore >= thresholds.increaseToHard) {
          return {
            gameId: '',
            oldDifficulty: currentDifficulty,
            newDifficulty: 'hard',
            reason: 'performance',
            confidence: Math.min((performanceScore - thresholds.increaseToHard) * 5, 1)
          };
        } else if (performanceScore <= thresholds.decreaseFromMedium) {
          return {
            gameId: '',
            oldDifficulty: currentDifficulty,
            newDifficulty: 'easy',
            reason: 'performance',
            confidence: Math.min((thresholds.decreaseFromMedium - performanceScore) * 3, 1)
          };
        }
        break;

      case 'hard':
        if (performanceScore >= thresholds.increaseToExpert) {
          return {
            gameId: '',
            oldDifficulty: currentDifficulty,
            newDifficulty: 'expert',
            reason: 'performance',
            confidence: Math.min((performanceScore - thresholds.increaseToExpert) * 6, 1)
          };
        } else if (performanceScore <= thresholds.decreaseFromHard) {
          return {
            gameId: '',
            oldDifficulty: currentDifficulty,
            newDifficulty: 'medium',
            reason: 'performance',
            confidence: Math.min((thresholds.decreaseFromHard - performanceScore) * 3, 1)
          };
        }
        break;

      case 'expert':
        if (performanceScore <= thresholds.decreaseFromExpert) {
          return {
            gameId: '',
            oldDifficulty: currentDifficulty,
            newDifficulty: 'hard',
            reason: 'performance',
            confidence: Math.min((thresholds.decreaseFromExpert - performanceScore) * 2, 1)
          };
        }
        break;
    }

    return null; // No adjustment needed
  }

  /**
   * Get recommended difficulty for a new player
   */
  getDefaultDifficulty(context: MinigameContext): MinigameDifficulty {
    // In practice mode, allow manual selection
    if (context.practiceMode) {
      return 'medium';
    }

    // Base on player skill level if available
    const skillLevel = this.extractSkillLevel(context);
    
    if (skillLevel >= 0.8) return 'hard';
    if (skillLevel >= 0.6) return 'medium';
    if (skillLevel <= 0.3) return 'easy';
    
    return 'medium'; // Safe default
  }

  /**
   * Update configuration (for runtime tuning)
   */
  updateWeights(newWeights: Partial<DifficultyWeights>): void {
    this.weights = { ...this.weights, ...newWeights };
    console.log('🎯 Updated difficulty weights:', this.weights);
  }

  updateThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    console.log('🎯 Updated difficulty thresholds:', this.thresholds);
  }

  /**
   * Get current configuration for debugging/tuning
   */
  getConfiguration() {
    return {
      weights: { ...this.weights },
      thresholds: { ...this.thresholds },
      minGamesForAdjustment: this.minGamesForAdjustment,
      recentGamesWindow: this.recentGamesWindow
    };
  }
}