// /Users/montysharma/V11M2/src/types/storylet.ts
import type { NPCMemoryInput, NPCStatus } from './npc';

export type StoryletDeploymentStatus = 'dev' | 'stage' | 'live';

export interface Storylet {
  id: string;                     // unique identifier, e.g. "midterm_mastery_1"
  name: string;                   // display title, e.g. "Midterm Mastery: Identify Weakness"
  trigger: {
    type: "time" | "flag" | "resource" | "npc_relationship" | "npc_availability";  // what triggers availability
    conditions: Record<string, any>;     // e.g. { week: 5 } or { flags: ["metTutor"] } or { energy: { min: 20 } } or { npcId: "sarah_chen", minLevel: 60 }
  };
  description: string;            // narrative text shown to player
  choices: Choice[];              // array of possible actions in this storylet
  
  // NPC integration fields
  involvedNPCs?: string[];        // NPCs that appear in this storylet
  primaryNPC?: string;            // main NPC focus
  locationId?: string;            // where this storylet takes place
  
  deploymentStatus?: StoryletDeploymentStatus; // deployment status: dev, stage, or live (defaults to live)
  storyArc?: string;              // optional story arc this storylet belongs to
}

export interface Choice {
  id: string;                     // unique within this storylet, e.g. "study_group"
  text: string;                   // button label, e.g. "Form a Study Group"
  effects: Effect[];              // list of resource/flag changes, XP gains, etc.
  nextStoryletId?: string;        // id of the next storylet if chosen (branch)
}

export type Effect =
  | { type: "resource"; key: "energy" | "stress" | "knowledge" | "social" | "money"; delta: number }
  | { type: "flag"; key: string; value: boolean }    // set or clear a game flag
  | { type: "skillXp"; key: string; amount: number } // award XP to a skill
  | { type: "foundationXp"; key: string; amount: number } // award XP to a foundation experience (V2 skill system)
  | { type: "domainXp"; domain: "intellectualCompetence" | "physicalCompetence" | "emotionalIntelligence" | "socialCompetence" | "personalAutonomy" | "identityClarity" | "lifePurpose"; amount: number } // award XP to a domain (V2 characters)
  | { type: "unlock"; storyletId: string }           // unlock a new storylet immediately
  | { type: "minigame"; gameId: string; onSuccess?: Effect[]; onFailure?: Effect[] } // launch a minigame
  | { type: "clueDiscovery"; clueId: string; minigameType?: MinigameType; onSuccess?: Effect[]; onFailure?: Effect[] } // trigger clue discovery (minigame determined by clue or specified)
  | { type: "arcJump"; destinationArc: string; targetStoryletId?: string; unlockStorylets?: string[] } // jump to different story arc and unlock specific storylets
  // NPC-related effects
  | { type: "npcRelationship"; npcId: string; delta: number; reason?: string }
  | { type: "npcMemory"; npcId: string; memory: NPCMemoryInput }
  | { type: "npcFlag"; npcId: string; flag: string; value: boolean }
  | { type: "npcMood"; npcId: string; mood: NPCStatus["mood"]; duration?: number }
  | { type: "npcAvailability"; npcId: string; availability: NPCStatus["availability"]; duration?: number };

// Available minigames (only implemented ones)
export type MinigameType = 
  | "memory-cards"
  | "word-scramble"
  | "color-match"
  | "stroop-test"
  | "path-planner";
