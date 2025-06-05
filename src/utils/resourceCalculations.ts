// /Users/montysharma/V11M2/src/utils/resourceCalculations.ts

import type { Character } from '../store/characterStore';
import type { IntegratedCharacter, DomainKey } from '../types/integratedCharacter';

export interface ResourceDeltas {
  energy: number;
  stress: number;
  money: number;
  knowledge: number;
  social: number;
}

export interface TimeAllocation {
  study: number;
  work: number;
  social: number;
  rest: number;
  exercise: number;
}

// Base rates per hour of activity
const BASE_RATES = {
  study: {
    energy: -0.1,
    stress: 0.1,
    knowledge: 5.1,
    social: 0,
    money: 0
  },
  work: {
    energy: -0.1,
    stress: 0.1,
    knowledge: 0.1,
    social: 0,
    money: 1.0
  },
  social: {
    energy: 0,
    stress: -0.1,
    knowledge: 0.1,
    social: 1.0,
    money: -0.4
  },
  rest: {
    energy: 0.1,
    stress: 0,
    knowledge: 0,
    social: 0,
    money: 0
  },
  exercise: {
    energy: 0,
    stress: 0,
    knowledge: 0,
    social: 0.1,
    money: 0
  }
};

// Get character modifiers based on attributes (legacy V1 character)
export function getCharacterModifiers(character: Character | null, activity: keyof TimeAllocation): number {
  if (!character) return 1;
  
  const attrs = character.attributes;
  
  switch (activity) {
    case 'study':
      return (attrs.intelligence + attrs.focus + attrs.memory) / 30;
    case 'work':
      return (attrs.perseverance + attrs.focus + attrs.selfControl) / 30;
    case 'social':
      return (attrs.charisma + attrs.empathy + attrs.communication) / 30;
    case 'rest':
      return (attrs.stressTolerance + attrs.selfControl) / 20;
    case 'exercise':
      return (attrs.endurance + attrs.strength + attrs.agility) / 30;
    default:
      return 1;
  }
}

// Get character modifiers based on integrated character domains (V2 character)
export function getIntegratedCharacterModifiers(character: IntegratedCharacter | null, activity: keyof TimeAllocation): number {
  if (!character) return 1;
  
  switch (activity) {
    case 'study':
      // Study efficiency based on intellectual competence and emotional intelligence
      return (
        (character.intellectualCompetence.level * 0.6) + 
        (character.emotionalIntelligence.level * 0.2) +
        (character.personalAutonomy.level * 0.2)
      ) / 100;
    case 'work':
      // Work performance based on intellectual competence, autonomy, and emotional intelligence
      return (
        (character.intellectualCompetence.level * 0.4) + 
        (character.personalAutonomy.level * 0.4) +
        (character.emotionalIntelligence.level * 0.2)
      ) / 100;
    case 'social':
      // Social activities based on social competence and emotional intelligence
      return (
        (character.socialCompetence.level * 0.7) + 
        (character.emotionalIntelligence.level * 0.3)
      ) / 100;
    case 'rest':
      // Rest effectiveness based on emotional intelligence and physical competence
      return (
        (character.emotionalIntelligence.level * 0.6) + 
        (character.physicalCompetence.level * 0.4)
      ) / 100;
    case 'exercise':
      // Exercise effectiveness based on physical competence and personal autonomy
      return (
        (character.physicalCompetence.level * 0.8) + 
        (character.personalAutonomy.level * 0.2)
      ) / 100;
    default:
      return 1;
  }
}

// Universal function to get modifiers for any character type
export function getUniversalCharacterModifiers(character: Character | IntegratedCharacter | null, activity: keyof TimeAllocation): number {
  if (!character) return 1;
  
  // Check character version
  if ('version' in character && character.version === 2) {
    return getIntegratedCharacterModifiers(character as IntegratedCharacter, activity);
  } else {
    return getCharacterModifiers(character as Character, activity);
  }
}

// Calculate resource deltas per tick based on time allocation (supports both character types)
export function calculateResourceDeltas(
  timeAllocation: TimeAllocation,
  character: Character | IntegratedCharacter | null,
  tickDurationHours: number = 1
): ResourceDeltas {
  const deltas: ResourceDeltas = {
    energy: 0,
    stress: 0,
    money: 0,
    knowledge: 0,
    social: 0
  };

  // Calculate for each activity
  Object.entries(timeAllocation).forEach(([activity, percent]) => {
    const activityKey = activity as keyof TimeAllocation;
    const hoursThisTick = tickDurationHours * (percent / 100);
    const modifier = getUniversalCharacterModifiers(character, activityKey);
    const rates = BASE_RATES[activityKey];

    deltas.energy += rates.energy * hoursThisTick * modifier;
    deltas.stress += rates.stress * hoursThisTick * (2 - modifier); // Inverse for stress
    deltas.knowledge += rates.knowledge * hoursThisTick * modifier;
    deltas.social += rates.social * hoursThisTick * modifier;
    deltas.money += rates.money * hoursThisTick * modifier;
  });

  // Special rest logic - better rest reduces stress more effectively
  if (timeAllocation.rest > 0) {
    const restHours = tickDurationHours * (timeAllocation.rest / 100);
    let restModifier = 1;
    
    if (character && 'version' in character && character.version === 2) {
      // For integrated characters, use emotional intelligence for stress reduction
      restModifier = (character as IntegratedCharacter).emotionalIntelligence.level / 100;
    } else if (character && 'attributes' in character) {
      // For legacy characters, use stress tolerance
      restModifier = (character as Character).attributes.stressTolerance / 10;
    }
    
    deltas.stress -= restHours * 0.5 * restModifier;
  }

  // Sleep deprivation penalty
  const restPercent = timeAllocation.rest;
  const sleepHours = (restPercent / 100) * 24; // Hours per day
  if (sleepHours < 4) {
    deltas.energy -= 10 * tickDurationHours / 24; // Spread over day
    deltas.stress += 20 * tickDurationHours / 24;
  }

  return deltas;
}

// Convert percentage to hours per week
export function percentToHoursPerWeek(percent: number): number {
  return (percent / 100) * 168; // 168 hours in a week
}

// Convert percentage to hours per day
export function percentToHoursPerDay(percent: number): number {
  return (percent / 100) * 24; // 24 hours in a day
}

// Get activity stats for display (supports both character types)
export function getActivityStats(activity: keyof TimeAllocation, character: Character | IntegratedCharacter | null) {
  const rates = BASE_RATES[activity];
  const modifier = getUniversalCharacterModifiers(character, activity);
  
  const stats = [];
  
  if (rates.energy !== 0) {
    stats.push({
      stat: 'E',
      value: Number((rates.energy * modifier).toFixed(1)),
      color: rates.energy > 0 ? 'bg-teal-500' : 'bg-red-500'
    });
  }
  
  if (rates.stress !== 0) {
    stats.push({
      stat: 'S',
      value: Number((rates.stress * (2 - modifier)).toFixed(1)),
      color: rates.stress > 0 ? 'bg-orange-500' : 'bg-green-500'
    });
  }
  
  if (rates.knowledge !== 0) {
    stats.push({
      stat: 'K',
      value: Number((rates.knowledge * modifier).toFixed(1)),
      color: 'bg-blue-500'
    });
  }
  
  if (rates.social !== 0) {
    stats.push({
      stat: 'SOC',
      value: Number((rates.social * modifier).toFixed(1)),
      color: 'bg-purple-500'
    });
  }
  
  if (rates.money !== 0) {
    stats.push({
      stat: '$',
      value: Number((rates.money * modifier).toFixed(1)),
      color: rates.money > 0 ? 'bg-green-500' : 'bg-red-500'
    });
  }
  
  return stats;
}

// Enhanced resource calculations for integrated characters with domain-specific effects
export function calculateDomainResourceEffects(
  timeAllocation: TimeAllocation,
  character: IntegratedCharacter,
  tickDurationHours: number = 1
): { deltas: ResourceDeltas; domainXP: Record<DomainKey, number> } {
  const baseDeltas = calculateResourceDeltas(timeAllocation, character, tickDurationHours);
  
  // Calculate XP gains for domains based on activities
  const domainXP: Record<DomainKey, number> = {
    intellectualCompetence: 0,
    physicalCompetence: 0,
    emotionalIntelligence: 0,
    socialCompetence: 0,
    personalAutonomy: 0,
    identityClarity: 0,
    lifePurpose: 0
  };
  
  // XP gains based on time allocation
  const studyHours = tickDurationHours * (timeAllocation.study / 100);
  const workHours = tickDurationHours * (timeAllocation.work / 100);
  const socialHours = tickDurationHours * (timeAllocation.social / 100);
  const exerciseHours = tickDurationHours * (timeAllocation.exercise / 100);
  
  // Study primarily develops intellectual competence
  if (studyHours > 0) {
    domainXP.intellectualCompetence += studyHours * 2;
    domainXP.personalAutonomy += studyHours * 0.5; // Discipline from studying
  }
  
  // Work develops autonomy and intellectual competence
  if (workHours > 0) {
    domainXP.personalAutonomy += workHours * 2;
    domainXP.intellectualCompetence += workHours * 1;
    domainXP.socialCompetence += workHours * 0.5; // Workplace interactions
  }
  
  // Social activities develop social competence and emotional intelligence
  if (socialHours > 0) {
    domainXP.socialCompetence += socialHours * 3;
    domainXP.emotionalIntelligence += socialHours * 1.5;
    domainXP.identityClarity += socialHours * 0.5; // Self-discovery through relationships
  }
  
  // Exercise develops physical competence and emotional intelligence
  if (exerciseHours > 0) {
    domainXP.physicalCompetence += exerciseHours * 3;
    domainXP.emotionalIntelligence += exerciseHours * 1; // Stress relief, mood regulation
    domainXP.personalAutonomy += exerciseHours * 0.5; // Self-discipline
  }
  
  // Balanced lifestyle develops life purpose
  const totalActiveHours = studyHours + workHours + socialHours + exerciseHours;
  if (totalActiveHours > 0) {
    const balance = 1 - (Math.abs(studyHours - workHours) + Math.abs(socialHours - exerciseHours)) / (totalActiveHours * 2);
    domainXP.lifePurpose += balance * totalActiveHours * 0.3;
  }
  
  // High-stress situations can develop emotional intelligence
  if (baseDeltas.stress > 5) {
    domainXP.emotionalIntelligence += (baseDeltas.stress / 10); // Learning from stress
  }
  
  return { deltas: baseDeltas, domainXP };
}