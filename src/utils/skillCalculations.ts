// /Users/montysharma/V11M2/src/utils/skillCalculations.ts

export interface LevelInfo {
  level: number;
  xpToNext: number;
}

/**
 * Calculate level and XP to next level based on total XP
 * Using exponential progression:
 * Level 1:   0–99 XP
 * Level 2: 100–249 XP  
 * Level 3: 250–499 XP
 * Level 4: 500–999 XP
 * Level 5: 1000–1999 XP
 * etc.
 */
export function getLevelFromXp(xp: number): LevelInfo {
  if (xp < 0) {
    return { level: 1, xpToNext: 100 };
  }
  
  let level = 1;
  let currentThreshold = 100;
  let totalRequired = 0;
  
  // Calculate which level this XP amount corresponds to
  while (xp >= totalRequired + currentThreshold) {
    totalRequired += currentThreshold;
    level++;
    currentThreshold = Math.floor(currentThreshold * 1.5); // Exponential scaling
  }
  
  // Calculate XP needed for next level
  const xpInCurrentLevel = xp - totalRequired;
  const xpToNext = currentThreshold - xpInCurrentLevel;
  
  return {
    level,
    xpToNext
  };
}

/**
 * Get the XP threshold for a specific level
 */
export function getXpThresholdForLevel(targetLevel: number): number {
  if (targetLevel <= 1) return 0;
  
  let totalXp = 0;
  let threshold = 100;
  
  for (let level = 1; level < targetLevel; level++) {
    totalXp += threshold;
    threshold = Math.floor(threshold * 1.5);
  }
  
  return totalXp;
}

/**
 * Get XP required for current level (for progress bar)
 */
export function getCurrentLevelXpRange(xp: number): { currentLevelXp: number; totalLevelXp: number } {
  const levelInfo = getLevelFromXp(xp);
  const currentLevelStartXp = getXpThresholdForLevel(levelInfo.level);
  const nextLevelStartXp = getXpThresholdForLevel(levelInfo.level + 1);
  
  return {
    currentLevelXp: xp - currentLevelStartXp,
    totalLevelXp: nextLevelStartXp - currentLevelStartXp
  };
}
