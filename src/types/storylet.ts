// /Users/montysharma/V11M2/src/types/storylet.ts

export type StoryletDeploymentStatus = 'dev' | 'stage' | 'live';

export interface Storylet {
  id: string;                     // unique identifier, e.g. "midterm_mastery_1"
  name: string;                   // display title, e.g. "Midterm Mastery: Identify Weakness"
  trigger: {
    type: "time" | "flag" | "resource";  // what triggers availability
    conditions: Record<string, any>;     // e.g. { week: 5 } or { flags: ["metTutor"] } or { energy: { min: 20 } }
  };
  description: string;            // narrative text shown to player
  choices: Choice[];              // array of possible actions in this storylet
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
  | { type: "minigame"; gameId: string; onSuccess?: Effect[]; onFailure?: Effect[] }; // launch a minigame

// Available minigames
export type MinigameType = 
  | "memory-cards"
  | "pattern-sequence" 
  | "math-quiz"
  | "reaction-time"
  | "word-scramble"
  | "logic-puzzle"
  | "typing-test"
  | "color-match"
  | "stroop-test";
