// /Users/montysharma/V11M2/src/utils/resourceCalculations.ts

import type { Character } from '../store/characterStore';

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

// Get character modifiers based on attributes
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

// Calculate resource deltas per tick based on time allocation
export function calculateResourceDeltas(
  timeAllocation: TimeAllocation,
  character: Character | null,
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
    const modifier = getCharacterModifiers(character, activityKey);
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
    const restModifier = character ? (character.attributes.stressTolerance / 10) : 1;
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

// Get activity stats for display
export function getActivityStats(activity: keyof TimeAllocation, character: Character | null) {
  const rates = BASE_RATES[activity];
  const modifier = getCharacterModifiers(character, activity);
  
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