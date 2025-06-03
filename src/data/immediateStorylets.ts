// /Users/montysharma/V11M2/src/data/immediateStorylets.ts

import { Storylet } from "../types/storylet";

export const immediateStorylets: Record<string, Storylet> = {
  // Day 1 storylets for immediate engagement
  first_day_orientation: {
    id: "first_day_orientation",
    name: "First Day Orientation",
    trigger: { type: "time", conditions: { day: 1 } },
    description: "It's your first day at college! The orientation session is starting, and you need to decide how to approach this new chapter of your life. Do you dive in head-first or take a more cautious approach?",
    choices: [
      {
        id: "enthusiastic_approach",
        text: "Approach everything with enthusiasm",
        effects: [
          { type: "resource", key: "energy", delta: -5 },
          { type: "resource", key: "social", delta: 15 },
          { type: "skillXp", key: "allianceBuilding", amount: 3 },
          { type: "flag", key: "enthusiastic_start", value: true }
        ]
      },
      {
        id: "cautious_approach",
        text: "Take a cautious, observational approach",
        effects: [
          { type: "resource", key: "stress", delta: -5 },
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "skillXp", key: "operationalSecurity", amount: 3 },
          { type: "flag", key: "cautious_start", value: true }
        ]
      },
      {
        id: "balanced_approach",
        text: "Find a balanced middle ground",
        effects: [
          { type: "resource", key: "social", delta: 5 },
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "skillXp", key: "perseverance", amount: 2 },
          { type: "flag", key: "balanced_start", value: true }
        ]
      }
    ]
  },

  dorm_room_setup: {
    id: "dorm_room_setup",
    name: "Dorm Room Setup",
    trigger: { type: "time", conditions: { day: 1 } },
    description: "Time to set up your dorm room! You need to decide how to arrange your space and what kind of environment you want to create for your college experience.",
    choices: [
      {
        id: "study_focused",
        text: "Create a study-focused environment",
        effects: [
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "resource", key: "stress", delta: -5 },
          { type: "skillXp", key: "perseverance", amount: 2 },
          { type: "flag", key: "study_room_setup", value: true }
        ]
      },
      {
        id: "social_friendly",
        text: "Make it welcoming for socializing",
        effects: [
          { type: "resource", key: "social", delta: 10 },
          { type: "resource", key: "energy", delta: 5 },
          { type: "skillXp", key: "allianceBuilding", amount: 3 },
          { type: "flag", key: "social_room_setup", value: true }
        ]
      },
      {
        id: "minimalist_practical",
        text: "Keep it minimalist and practical",
        effects: [
          { type: "resource", key: "money", delta: 5 },
          { type: "resource", key: "stress", delta: -3 },
          { type: "skillXp", key: "resourceAcquisition", amount: 2 },
          { type: "flag", key: "minimalist_setup", value: true }
        ]
      }
    ]
  }
};

// Export with logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Loaded', Object.keys(immediateStorylets).length, 'immediate storylets for day 1');
}
