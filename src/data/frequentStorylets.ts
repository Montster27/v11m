// /Users/montysharma/V11M2/src/data/frequentStorylets.ts

import { Storylet } from "../types/storylet";

export const frequentStorylets: Record<string, Storylet> = {
  // === DAILY LIFE STORYLETS (FREQUENT) ===
  
  // Day 3 (changed from day 2)
  campus_exploration: {
    id: "campus_exploration",
    name: "Campus Exploration Day",
    trigger: { type: "time", conditions: { day: 3 } }, // Changed trigger day
    description: "It's your third day and you have some free time to explore campus. There are so many places to discover - the library, student center, various clubs, and hidden spots only upperclassmen know about. You also notice there's a campus tour happening nearby.", // Enhanced description
    choices: [
      {
        id: "explore_library",
        text: "Spend time exploring the library",
        effects: [
          { type: "resource", key: "knowledge", delta: 20 }, // Increased from 15
          { type: "resource", key: "stress", delta: -5 },
          { type: "skillXp", key: "informationWarfare", amount: 3 },
          { type: "flag", key: "library_familiar", value: true }
        ]
      },
      {
        id: "find_clubs",
        text: "Look for interesting clubs to join",
        effects: [
          { type: "resource", key: "social", delta: 20 },
          { type: "resource", key: "energy", delta: -5 },
          { type: "skillXp", key: "allianceBuilding", amount: 4 },
          { type: "flag", key: "club_interested", value: true }
        ]
      },
      {
        id: "discover_secrets",
        text: "Try to find the secret spots upperclassmen talk about",
        effects: [
          { type: "resource", key: "social", delta: 10 },
          { type: "resource", key: "energy", delta: -10 },
          { type: "skillXp", key: "operationalSecurity", amount: 5 },
          { type: "flag", key: "secret_spots_found", value: true }
        ]
      },
      {
        id: "join_campus_tour", // NEW CHOICE
        text: "Join the official campus tour and meet other new students",
        effects: [
          { type: "resource", key: "social", delta: 25 },
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "resource", key: "energy", delta: -5 },
          { type: "skillXp", key: "allianceBuilding", amount: 6 },
          { type: "flag", key: "campus_tour_taken", value: true }
        ]
      }
    ]
  },

  // Day 4
  dining_hall_drama: {
    id: "dining_hall_drama",
    name: "Dining Hall Drama",
    trigger: { type: "time", conditions: { day: 4 } },
    description: "At dinner, you witness a heated argument between students from different floors about whose turn it is to clean the shared kitchen area. The tension is escalating and someone needs to step in.",
    choices: [
      {
        id: "mediate_conflict",
        text: "Try to mediate the conflict",
        effects: [
          { type: "resource", key: "social", delta: 15 },
          { type: "resource", key: "stress", delta: 5 },
          { type: "skillXp", key: "allianceBuilding", amount: 6 },
          { type: "flag", key: "conflict_mediator", value: true }
        ]
      },
      {
        id: "side_with_floor",
        text: "Side with your floor",
        effects: [
          { type: "resource", key: "social", delta: 10 },
          { type: "resource", key: "stress", delta: 8 },
          { type: "skillXp", key: "perseverance", amount: 3 },
          { type: "flag", key: "floor_loyalty", value: true }
        ]
      },
      {
        id: "avoid_drama",
        text: "Quietly finish your meal and leave",
        effects: [
          { type: "resource", key: "stress", delta: -3 },
          { type: "resource", key: "social", delta: -5 },
          { type: "skillXp", key: "operationalSecurity", amount: 2 },
          { type: "flag", key: "drama_avoider", value: true }
        ]
      }
    ]
  },

  // Day 6
  study_group_formation: {
    id: "study_group_formation",
    name: "Study Group Formation",
    trigger: { type: "time", conditions: { day: 6 } },
    description: "Several classmates are forming study groups for upcoming assignments. You've been invited to join one, but you're also considering starting your own or just studying alone.",
    choices: [
      {
        id: "join_existing",
        text: "Join an existing study group",
        effects: [
          { type: "resource", key: "social", delta: 15 },
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "skillXp", key: "allianceBuilding", amount: 4 },
          { type: "flag", key: "study_group_member", value: true }
        ]
      },
      {
        id: "start_own_group",
        text: "Start your own study group",
        effects: [
          { type: "resource", key: "energy", delta: -10 },
          { type: "resource", key: "social", delta: 20 },
          { type: "skillXp", key: "bureaucraticNavigation", amount: 5 },
          { type: "flag", key: "study_group_leader", value: true }
        ]
      },
      {
        id: "study_solo",
        text: "Prefer to study alone",
        effects: [
          { type: "resource", key: "knowledge", delta: 15 },
          { type: "resource", key: "social", delta: -5 },
          { type: "skillXp", key: "perseverance", amount: 4 },
          { type: "flag", key: "solo_studier", value: true }
        ]
      }
    ]
  },

  // === RESOURCE-BASED STORYLETS (REPEATABLE) ===

  energy_boost_opportunity: {
    id: "energy_boost_opportunity",
    name: "Energy Boost Opportunity",
    trigger: { type: "resource", conditions: { energy: { max: 40 } } },
    description: "You're feeling pretty tired lately. Your floor is organizing a group fitness session, there's a new energy drink being sampled at the student center, or you could just take a proper nap.",
    choices: [
      {
        id: "group_fitness",
        text: "Join the group fitness session",
        effects: [
          { type: "resource", key: "energy", delta: 15 },
          { type: "resource", key: "social", delta: 10 },
          { type: "skillXp", key: "perseverance", amount: 3 },
          { type: "flag", key: "fitness_participant", value: true }
        ]
      },
      {
        id: "energy_drink",
        text: "Try the free energy drink samples",
        effects: [
          { type: "resource", key: "energy", delta: 20 },
          { type: "resource", key: "stress", delta: 5 },
          { type: "skillXp", key: "resourceAcquisition", amount: 2 }
        ]
      },
      {
        id: "power_nap",
        text: "Take a strategic power nap",
        effects: [
          { type: "resource", key: "energy", delta: 25 },
          { type: "resource", key: "stress", delta: -10 },
          { type: "skillXp", key: "operationalSecurity", amount: 2 }
        ]
      }
    ]
  },

  stress_relief_needed: {
    id: "stress_relief_needed",
    name: "Stress Relief Needed",
    trigger: { type: "resource", conditions: { stress: { min: 60 } } },
    description: "The pressure is really building up and you need to find a way to decompress. The campus wellness center offers free yoga, there's a stress-busting movie marathon in the common room, or you could find a quiet outdoor space.",
    choices: [
      {
        id: "wellness_yoga",
        text: "Try the free yoga class",
        effects: [
          { type: "resource", key: "stress", delta: -20 },
          { type: "resource", key: "energy", delta: 5 },
          { type: "skillXp", key: "perseverance", amount: 4 },
          { type: "flag", key: "yoga_practitioner", value: true }
        ]
      },
      {
        id: "movie_marathon",
        text: "Join the stress-busting movie marathon",
        effects: [
          { type: "resource", key: "stress", delta: -15 },
          { type: "resource", key: "social", delta: 15 },
          { type: "skillXp", key: "allianceBuilding", amount: 3 }
        ]
      },
      {
        id: "nature_escape",
        text: "Find a peaceful outdoor spot to relax",
        effects: [
          { type: "resource", key: "stress", delta: -25 },
          { type: "resource", key: "energy", delta: 10 },
          { type: "skillXp", key: "operationalSecurity", amount: 3 }
        ]
      }
    ]
  }
};
