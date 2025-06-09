// Emma Romance Arc - Demonstrates flag-based arc progression
import type { Storylet } from '../types/storylet';

export const emmaRomanceStorylets: Record<string, Storylet> = {
  // Arc Entry Point
  "emma_01_coffee_shop": {
    id: "emma_01_coffee_shop",
    name: "Philosophy and Foam",
    description: "You notice Emma in the campus coffee shop, absorbed in reading what looks like a philosophy text. Steam rises from her untouched latte as she takes careful notes in the margins.",
    storyArc: "Emma Romance",
    deploymentStatus: "dev",
    trigger: {
      type: "flag",
      conditions: { 
        flags: ["college_started"] // Simple prerequisite - college has started
      }
    },
    choices: [
      {
        id: "awkward_interruption",
        text: "Walk up and immediately ask what she's reading",
        effects: [
          { type: "flag", key: "emma_romance:terminal_failure", value: true },
          { type: "flag", key: "emma_romance:failure_reason", value: "social_awkwardness" },
          { type: "flag", key: "emma_romance:arc_ended", value: true },
          { type: "resource", key: "stress", delta: 10 }
        ]
      },
      {
        id: "literary_connection",
        text: "Order your coffee nearby and casually comment on her book",
        effects: [
          { type: "flag", key: "emma_romance:coffee_success", value: true },
          { type: "flag", key: "emma_romance:approach_thoughtful", value: true },
          { type: "flag", key: "emma_romance:emma_01_coffee_shop_complete", value: true },
          { type: "unlock", storyletId: "emma_02_study_group" },
          { type: "resource", key: "social", delta: 5 }
        ]
      },
      {
        id: "respectful_distance",
        text: "Admire from afar and don't interrupt her studies",
        effects: [
          { type: "flag", key: "emma_romance:respectful_start", value: true },
          { type: "flag", key: "emma_romance:emma_01_coffee_shop_complete", value: true },
          { type: "unlock", storyletId: "emma_02_library_encounter" },
          { type: "resource", key: "knowledge", delta: 2 }
        ]
      }
    ]
  },

  // Branch A: Direct Approach Path
  "emma_02_study_group": {
    id: "emma_02_study_group",
    name: "Between the Lines",
    description: "Emma mentions she's struggling with a philosophy assignment. She seems genuinely interested in your perspective on existential literature.",
    storyArc: "Emma Romance",
    deploymentStatus: "dev",
    trigger: {
      type: "flag",
      conditions: { 
        flags: ["emma_romance:coffee_success"] 
      }
    },
    choices: [
      {
        id: "offer_help",
        text: "Offer to study together for the assignment",
        effects: [
          { type: "flag", key: "emma_romance:study_partnership", value: true },
          { type: "flag", key: "emma_romance:connection_academic", value: true },
          { type: "flag", key: "emma_romance:emma_02_study_group_complete", value: true },
          { type: "unlock", storyletId: "emma_03_late_night_discussion" },
          { type: "resource", key: "knowledge", delta: 8 }
        ]
      },
      {
        id: "share_insights",
        text: "Share your own interpretation of the text",
        effects: [
          { type: "flag", key: "emma_romance:intellectual_connection", value: true },
          { type: "flag", key: "emma_romance:emma_02_study_group_complete", value: true },
          { type: "unlock", storyletId: "emma_03_coffee_date" },
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "resource", key: "social", delta: 3 }
        ]
      }
    ]
  },

  // Branch B: Respectful Path
  "emma_02_library_encounter": {
    id: "emma_02_library_encounter", 
    name: "Chance Encounters",
    description: "A few days later, you run into Emma at the library. She's in the same spot, different book. This time she notices you first.",
    storyArc: "Emma Romance",
    deploymentStatus: "dev",
    trigger: {
      type: "flag",
      conditions: { 
        flags: ["emma_romance:respectful_start"] 
      }
    },
    choices: [
      {
        id: "natural_conversation",
        text: "Let the conversation develop naturally",
        effects: [
          { type: "flag", key: "emma_romance:natural_progression", value: true },
          { type: "flag", key: "emma_romance:emma_02_library_encounter_complete", value: true },
          { type: "unlock", storyletId: "emma_03_coffee_date" },
          { type: "resource", key: "social", delta: 8 }
        ]
      },
      {
        id: "book_recommendation",
        text: "Recommend a book you think she'd enjoy",
        effects: [
          { type: "flag", key: "emma_romance:shared_interests", value: true },
          { type: "flag", key: "emma_romance:emma_02_library_encounter_complete", value: true },
          { type: "unlock", storyletId: "emma_03_book_discussion" },
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "resource", key: "social", delta: 5 }
        ]
      }
    ]
  },

  // Convergence Point: Coffee Date
  "emma_03_coffee_date": {
    id: "emma_03_coffee_date",
    name: "More Than Caffeine",
    description: "Emma suggests meeting for coffee to continue your discussion. The conversation flows easily, moving from academics to personal interests to shared dreams.",
    storyArc: "Emma Romance",
    deploymentStatus: "dev",
    trigger: {
      type: "flag",
      conditions: { 
        flags: ["emma_romance:intellectual_connection", "emma_romance:natural_progression"] 
      }
    },
    choices: [
      {
        id: "romantic_progression",
        text: "Suggest this could be the start of something special",
        effects: [
          { type: "flag", key: "emma_romance:romantic_interest_expressed", value: true },
          { type: "flag", key: "emma_romance:emma_03_coffee_date_complete", value: true },
          { type: "unlock", storyletId: "emma_04_relationship_begins" },
          { type: "resource", key: "social", delta: 10 }
        ]
      },
      {
        id: "friendship_focus", 
        text: "Value the intellectual connection without rushing",
        effects: [
          { type: "flag", key: "emma_romance:friendship_foundation", value: true },
          { type: "flag", key: "emma_romance:emma_03_coffee_date_complete", value: true },
          { type: "unlock", storyletId: "emma_04_deep_friendship" },
          { type: "resource", key: "knowledge", delta: 8 },
          { type: "resource", key: "social", delta: 5 }
        ]
      }
    ]
  },

  // Alternative Branch: Book Discussion
  "emma_03_book_discussion": {
    id: "emma_03_book_discussion",
    name: "Literary Hearts",
    description: "Emma loved your book recommendation. She's already finished it and wants to discuss the themes with you over lunch.",
    storyArc: "Emma Romance",
    deploymentStatus: "dev", 
    trigger: {
      type: "flag",
      conditions: { 
        flags: ["emma_romance:shared_interests"] 
      }
    },
    choices: [
      {
        id: "deep_analysis",
        text: "Dive deep into the book's philosophical implications",
        effects: [
          { type: "flag", key: "emma_romance:intellectual_bond", value: true },
          { type: "flag", key: "emma_romance:emma_03_book_discussion_complete", value: true },
          { type: "unlock", storyletId: "emma_04_study_partners" },
          { type: "resource", key: "knowledge", delta: 12 }
        ]
      },
      {
        id: "personal_connection",
        text: "Share how the book's themes relate to your own life",
        effects: [
          { type: "flag", key: "emma_romance:emotional_openness", value: true },
          { type: "flag", key: "emma_romance:emma_03_book_discussion_complete", value: true },
          { type: "unlock", storyletId: "emma_04_relationship_begins" },
          { type: "resource", key: "social", delta: 8 },
          { type: "resource", key: "stress", delta: -5 }
        ]
      }
    ]
  },

  // Arc Resolution: Romance Path
  "emma_04_relationship_begins": {
    id: "emma_04_relationship_begins",
    name: "New Chapter",
    description: "Emma takes your hand as you walk across campus. 'I'm glad we found each other,' she says, her eyes bright with possibility.",
    storyArc: "Emma Romance",
    deploymentStatus: "dev",
    trigger: {
      type: "flag",
      conditions: { 
        flags: ["emma_romance:romantic_interest_expressed", "emma_romance:emotional_openness"] 
      }
    },
    choices: [
      {
        id: "embrace_romance",
        text: "Begin your romantic relationship with Emma",
        effects: [
          { type: "flag", key: "emma_romance:arc_complete", value: true },
          { type: "flag", key: "emma_romance:outcome", value: "romantic_success" },
          { type: "flag", key: "relationship_status:emma", value: true },
          { type: "flag", key: "academic_focus:distracted_by_romance", value: true },
          { type: "resource", key: "social", delta: 15 },
          { type: "resource", key: "stress", delta: -10 }
        ]
      }
    ]
  },

  // Arc Resolution: Friendship Path  
  "emma_04_deep_friendship": {
    id: "emma_04_deep_friendship",
    name: "Kindred Spirits",
    description: "Your friendship with Emma has become one of the most meaningful connections in your college experience. Some bonds transcend romance.",
    storyArc: "Emma Romance",
    deploymentStatus: "dev",
    trigger: {
      type: "flag",
      conditions: { 
        flags: ["emma_romance:friendship_foundation"] 
      }
    },
    choices: [
      {
        id: "cherish_friendship",
        text: "Value this deep friendship above all else",
        effects: [
          { type: "flag", key: "emma_romance:arc_complete", value: true },
          { type: "flag", key: "emma_romance:outcome", value: "friendship_success" },
          { type: "flag", key: "social_network:emma_close_friend", value: true },
          { type: "flag", key: "academic_focus:enhanced_by_friendship", value: true },
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "resource", key: "social", delta: 8 }
        ]
      }
    ]
  },

  // Arc Resolution: Study Partners Path
  "emma_04_study_partners": {
    id: "emma_04_study_partners",
    name: "Academic Alliance",
    description: "You and Emma have become the philosophy department's most formidable study partnership. Your collaborative approach to learning has elevated both your academic performances.",
    storyArc: "Emma Romance",
    deploymentStatus: "dev",
    trigger: {
      type: "flag",
      conditions: { 
        flags: ["emma_romance:intellectual_bond"] 
      }
    },
    choices: [
      {
        id: "academic_focus",
        text: "Commit to this powerful academic partnership",
        effects: [
          { type: "flag", key: "emma_romance:arc_complete", value: true },
          { type: "flag", key: "emma_romance:outcome", value: "academic_success" },
          { type: "flag", key: "academic_network:emma_study_partner", value: true },
          { type: "flag", key: "academic_focus:enhanced_by_partnership", value: true },
          { type: "resource", key: "knowledge", delta: 20 },
          { type: "resource", key: "social", delta: 5 }
        ]
      }
    ]
  }
};

// Cross-arc influence examples
export const emmaInfluenceStorylets: Record<string, Storylet> = {
  // Political awareness influenced by Emma's social consciousness
  "political_emma_influence": {
    id: "political_emma_influence",
    name: "Socratic Questions",
    description: "Emma's questions about social justice have you reconsidering your political assumptions.",
    storyArc: "Political Awakening",
    deploymentStatus: "dev",
    trigger: {
      type: "flag",
      conditions: { 
        flags: ["emma_romance:intellectual_connection", "political_awareness:questioning_begins"] 
      }
    },
    choices: [
      {
        id: "embrace_activism",
        text: "Let Emma's passion inspire your own political engagement",
        effects: [
          { type: "flag", key: "political_awareness:influenced_by_emma", value: true },
          { type: "flag", key: "political_awareness:activism_sparked", value: true },
          { type: "resource", key: "social", delta: 8 }
        ]
      }
    ]
  }
};