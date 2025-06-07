// /Users/montysharma/V11M2/src/types/npc.ts
export interface NPC {
  id: string;                           // unique identifier, e.g., "sarah_chen"
  name: string;                         // display name, e.g., "Sarah Chen"
  description: string;                  // brief character description
  avatar?: string;                      // optional avatar image path
  
  // Character traits
  personality: NPCPersonality;
  background: NPCBackground;
  currentStatus: NPCStatus;
  
  // Relationship tracking
  relationshipLevel: number;            // 0-100, starts at neutral (50)
  relationshipType: RelationshipType;
  lastInteraction?: Date;
  
  // Memory system
  memories: NPCMemory[];                // what they remember about interactions
  flags: Record<string, boolean>;       // NPC-specific flags
  
  // Location and availability
  locations: NPCLocation[];             // where they can be found
  schedule?: NPCSchedule;               // time-based availability
  
  // Storylet integration
  associatedStorylets: string[];        // storylets this NPC appears in
  storyArc?: string;                    // story arc they belong to
}

export interface NPCPersonality {
  traits: string[];                     // ["studious", "artistic", "shy", "outgoing"]
  interests: string[];                  // ["radio", "literature", "art", "music"]
  values: string[];                     // ["honesty", "creativity", "independence"]
  speechStyle: "formal" | "casual" | "academic" | "artistic";
}

export interface NPCBackground {
  major?: string;                       // "English Literature"
  year?: string;                        // "Sophomore", "Junior"
  hometown?: string;                    // "San Francisco, CA"
  activities: string[];                 // ["Campus Radio", "Literary Magazine"]
  family?: string;                      // "First-generation college student"
}

export interface NPCStatus {
  mood: "happy" | "neutral" | "stressed" | "excited" | "sad" | "angry";
  currentActivity?: string;             // "Studying for midterms"
  availability: "available" | "busy" | "unavailable";
  healthStatus?: "healthy" | "sick" | "tired";
}

export type RelationshipType = 
  | "stranger" 
  | "acquaintance" 
  | "friend" 
  | "close_friend" 
  | "romantic_interest" 
  | "dating" 
  | "rival" 
  | "enemy";

export interface NPCMemory {
  id: string;
  storyletId: string;                   // which storylet created this memory
  choiceId: string;                     // which choice triggered it
  description: string;                  // what they remember
  sentiment: "positive" | "neutral" | "negative";
  importance: number;                   // 1-10, affects how long they remember
  timestamp: Date;
}

export interface NPCLocation {
  id: string;                           // "dining_hall", "radio_station", "library"
  name: string;                         // "Hartwell Dining Hall"
  probability: number;                  // 0-1, chance of finding them there
  timeRanges?: string[];                // ["18:00-19:30"] for dining hall
}

export interface NPCSchedule {
  [key: string]: NPCLocation[];         // "monday": [locations], "tuesday": [locations]
}

export interface NPCMemoryInput {
  description: string;
  sentiment: "positive" | "neutral" | "negative";
  importance: number;
}

// For development and management
export interface NPCStats {
  totalNPCs: number;
  relationshipDistribution: Record<RelationshipType, number>;
  averageRelationshipLevel: number;
  memoriesCount: number;
  activeFlags: number;
}