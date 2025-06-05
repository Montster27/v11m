// /Users/montysharma/V11M2/src/utils/developmentCalculations.ts
// Development progression and experience calculations for integrated character system

import { 
  IntegratedCharacter, 
  DomainKey, 
  CharacterDomain, 
  DEVELOPMENT_STAGES, 
  EXPERIENCE_MULTIPLIERS,
  DevelopmentEvent
} from '../types/integratedCharacter';

/**
 * Calculate XP required for next stage
 */
export function getXPToNextStage(domain: CharacterDomain, domainKey: DomainKey): number {
  const stages = DEVELOPMENT_STAGES[domainKey];
  const currentStage = domain.developmentStage;
  
  if (currentStage >= stages.length) {
    return 0; // Already at max stage
  }
  
  const nextStageRequirements = stages[currentStage]?.requirements || 0;
  return Math.max(0, nextStageRequirements - domain.experiencePoints);
}

/**
 * Calculate total XP earned in a domain
 */
export function getTotalDomainXP(domain: CharacterDomain): number {
  return domain.experiencePoints;
}

/**
 * Calculate progress percentage within current stage
 */
export function getStageProgress(domain: CharacterDomain, domainKey: DomainKey): number {
  const stages = DEVELOPMENT_STAGES[domainKey];
  const currentStage = domain.developmentStage;
  
  if (currentStage >= stages.length) {
    return 100; // Max stage reached
  }
  
  const currentStageInfo = stages[currentStage - 1];
  const nextStageInfo = stages[currentStage];
  
  if (!nextStageInfo) {
    return 100; // No next stage
  }
  
  const stageXP = domain.experiencePoints - currentStageInfo.requirements;
  const stageRange = nextStageInfo.requirements - currentStageInfo.requirements;
  
  return Math.min(100, Math.max(0, (stageXP / stageRange) * 100));
}

/**
 * Add experience to a domain and handle stage advancement
 */
export function addDomainExperience(
  character: IntegratedCharacter,
  domainKey: DomainKey,
  experiencePoints: number,
  source: string = 'Unknown'
): { 
  character: IntegratedCharacter; 
  stageAdvanced: boolean; 
  newStage?: number; 
  events: DevelopmentEvent[] 
} {
  const domain = character[domainKey];
  const stages = DEVELOPMENT_STAGES[domainKey];
  const oldStage = domain.developmentStage;
  
  // Add experience
  const newExperience = domain.experiencePoints + experiencePoints;
  
  // Check for stage advancement
  let newStage = oldStage;
  while (newStage < stages.length && newExperience >= stages[newStage].requirements) {
    newStage++;
  }
  
  const stageAdvanced = newStage > oldStage;
  const events: DevelopmentEvent[] = [];
  
  // Create events for stage advancements
  if (stageAdvanced) {
    for (let stage = oldStage + 1; stage <= newStage; stage++) {
      events.push({
        id: `stage-advance-${domainKey}-${stage}-${Date.now()}`,
        timestamp: new Date(),
        domain: domainKey,
        eventType: 'stage_advance',
        description: `Advanced to ${stages[stage - 1].name} in ${domainKey}`,
        experienceGained: experiencePoints,
        previousStage: stage - 1,
        newStage: stage
      });
    }
  }
  
  // Update domain
  const updatedDomain: CharacterDomain = {
    ...domain,
    experiencePoints: newExperience,
    developmentStage: newStage,
    lastMilestone: stageAdvanced ? new Date() : domain.lastMilestone,
    confidence: Math.min(100, domain.confidence + (stageAdvanced ? 5 : 1))
  };
  
  // Update character
  const updatedCharacter: IntegratedCharacter = {
    ...character,
    [domainKey]: updatedDomain,
    totalDevelopmentPoints: character.totalDevelopmentPoints + experiencePoints,
    developmentHistory: [...character.developmentHistory, ...events],
    updatedAt: new Date()
  };
  
  return {
    character: updatedCharacter,
    stageAdvanced,
    newStage: stageAdvanced ? newStage : undefined,
    events
  };
}

/**
 * Calculate domain level based on components
 */
export function calculateDomainLevel(domain: CharacterDomain): number {
  const components = domain.components;
  const values = Object.values(components).filter(v => typeof v === 'number' && v > 0);
  
  if (values.length === 0) return 0;
  
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Apply stage multiplier (higher stages get bonus to level calculation)
  const stageBonus = (domain.developmentStage - 1) * 2;
  
  return Math.min(100, Math.round(average + stageBonus));
}

/**
 * Update domain level based on component changes
 */
export function updateDomainLevel(character: IntegratedCharacter, domainKey: DomainKey): IntegratedCharacter {
  const domain = character[domainKey];
  const newLevel = calculateDomainLevel(domain);
  
  const updatedDomain: CharacterDomain = {
    ...domain,
    level: newLevel
  };
  
  return {
    ...character,
    [domainKey]: updatedDomain,
    updatedAt: new Date()
  };
}

/**
 * Get unlocked capabilities for a domain at current stage
 */
export function getUnlockedCapabilities(domain: CharacterDomain, domainKey: DomainKey): string[] {
  const stages = DEVELOPMENT_STAGES[domainKey];
  const currentStage = domain.developmentStage;
  
  const unlocks: string[] = [];
  
  for (let i = 0; i < Math.min(currentStage, stages.length); i++) {
    unlocks.push(...stages[i].unlocks);
  }
  
  return unlocks;
}

/**
 * Get available benefits for a domain at current stage
 */
export function getAvailableBenefits(domain: CharacterDomain, domainKey: DomainKey): string[] {
  const stages = DEVELOPMENT_STAGES[domainKey];
  const currentStage = domain.developmentStage;
  
  const benefits: string[] = [];
  
  for (let i = 0; i < Math.min(currentStage, stages.length); i++) {
    benefits.push(...stages[i].benefits);
  }
  
  return benefits;
}

/**
 * Calculate overall character development score
 */
export function getOverallDevelopmentScore(character: IntegratedCharacter): {
  score: number;
  averageStage: number;
  strongestDomain: { domain: DomainKey; stage: number };
  weakestDomain: { domain: DomainKey; stage: number };
} {
  const domains: DomainKey[] = [
    'intellectualCompetence', 'physicalCompetence', 'emotionalIntelligence',
    'socialCompetence', 'personalAutonomy', 'identityClarity', 'lifePurpose'
  ];
  
  const domainScores = domains.map(domain => ({
    domain,
    level: character[domain].level,
    stage: character[domain].developmentStage
  }));
  
  const averageLevel = domainScores.reduce((sum, d) => sum + d.level, 0) / domains.length;
  const averageStage = domainScores.reduce((sum, d) => sum + d.stage, 0) / domains.length;
  
  const strongest = domainScores.reduce((max, current) => 
    current.stage > max.stage ? current : max
  );
  
  const weakest = domainScores.reduce((min, current) => 
    current.stage < min.stage ? current : min
  );
  
  // Calculate composite score (0-100) based on level and stage balance
  const stageVariance = Math.sqrt(
    domainScores.reduce((sum, d) => sum + Math.pow(d.stage - averageStage, 2), 0) / domains.length
  );
  
  const balanceBonus = Math.max(0, 20 - (stageVariance * 5)); // Bonus for balanced development
  const score = Math.min(100, averageLevel + balanceBonus);
  
  return {
    score: Math.round(score),
    averageStage: Math.round(averageStage * 10) / 10,
    strongestDomain: { domain: strongest.domain, stage: strongest.stage },
    weakestDomain: { domain: weakest.domain, stage: weakest.stage }
  };
}

/**
 * Suggest next development focus based on character state
 */
export function suggestDevelopmentFocus(character: IntegratedCharacter): {
  primaryFocus: DomainKey;
  secondaryFocus: DomainKey;
  reasoning: string;
} {
  const domains: DomainKey[] = [
    'intellectualCompetence', 'physicalCompetence', 'emotionalIntelligence',
    'socialCompetence', 'personalAutonomy', 'identityClarity', 'lifePurpose'
  ];
  
  const domainData = domains.map(domain => ({
    domain,
    stage: character[domain].developmentStage,
    level: character[domain].level,
    confidence: character[domain].confidence
  }));
  
  // Sort by stage (ascending) to find lowest development
  domainData.sort((a, b) => a.stage - b.stage);
  
  const lowest = domainData[0];
  const secondLowest = domainData[1];
  
  // Special logic for development path
  let reasoning = '';
  
  if (lowest.stage === 1) {
    reasoning = `Focus on ${lowest.domain} to build foundational skills`;
  } else if (lowest.stage < 3) {
    reasoning = `Develop ${lowest.domain} to reach intermediate competence`;
  } else {
    reasoning = `Advance ${lowest.domain} for deeper mastery and leadership`;
  }
  
  return {
    primaryFocus: lowest.domain,
    secondaryFocus: secondLowest.domain,
    reasoning
  };
}

/**
 * Calculate milestone rewards for reaching new stages
 */
export function getMilestoneRewards(domainKey: DomainKey, newStage: number): {
  experienceBonus: number;
  confidenceBonus: number;
  unlocks: string[];
  benefits: string[];
} {
  const stages = DEVELOPMENT_STAGES[domainKey];
  const stageInfo = stages[newStage - 1];
  
  if (!stageInfo) {
    return {
      experienceBonus: 0,
      confidenceBonus: 0,
      unlocks: [],
      benefits: []
    };
  }
  
  return {
    experienceBonus: EXPERIENCE_MULTIPLIERS.STAGE_ADVANCE_BONUS,
    confidenceBonus: 5 + (newStage * 2), // Higher stages give more confidence
    unlocks: stageInfo.unlocks,
    benefits: stageInfo.benefits
  };
}

/**
 * Track development velocity (XP gain rate over time)
 */
export function calculateDevelopmentVelocity(character: IntegratedCharacter, days: number = 7): {
  totalXPPerDay: number;
  domainVelocity: Record<DomainKey, number>;
  trending: 'up' | 'down' | 'stable';
} {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentEvents = character.developmentHistory.filter(
    event => event.timestamp >= cutoffDate
  );
  
  const totalXP = recentEvents.reduce((sum, event) => sum + event.experienceGained, 0);
  const xpPerDay = totalXP / days;
  
  const domainVelocity: Record<DomainKey, number> = {
    intellectualCompetence: 0,
    physicalCompetence: 0,
    emotionalIntelligence: 0,
    socialCompetence: 0,
    personalAutonomy: 0,
    identityClarity: 0,
    lifePurpose: 0
  };
  
  recentEvents.forEach(event => {
    domainVelocity[event.domain] += event.experienceGained;
  });
  
  // Normalize by days
  Object.keys(domainVelocity).forEach(domain => {
    domainVelocity[domain as DomainKey] /= days;
  });
  
  // Determine trend (simplified - compare with previous period)
  const previousCutoff = new Date(cutoffDate);
  previousCutoff.setDate(previousCutoff.getDate() - days);
  
  const previousEvents = character.developmentHistory.filter(
    event => event.timestamp >= previousCutoff && event.timestamp < cutoffDate
  );
  
  const previousXP = previousEvents.reduce((sum, event) => sum + event.experienceGained, 0);
  const previousXPPerDay = previousXP / days;
  
  let trending: 'up' | 'down' | 'stable' = 'stable';
  if (xpPerDay > previousXPPerDay * 1.1) trending = 'up';
  else if (xpPerDay < previousXPPerDay * 0.9) trending = 'down';
  
  return {
    totalXPPerDay: Math.round(xpPerDay * 10) / 10,
    domainVelocity,
    trending
  };
}