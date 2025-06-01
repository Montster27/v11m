// /Users/montysharma/V11M2/src/data/sampleStorylets.ts

import { Storylet } from "../types/storylet";

export const sampleStorylets: Record<string, Storylet> = {
  // === TIME-BASED STORYLETS ===
  
  // 1. Midterm Mastery: Identify Weakness
  midterm_mastery_1: {
    id: "midterm_mastery_1",
    name: "Midterm Mastery: Identify Weakness",
    trigger: { type: "time", conditions: { day: 5 } },
    description: "Your midterm in Economics is coming up. You notice gaps in your understanding. You need to figure out your weakest topic to focus your study efforts effectively.",
    choices: [
      {
        id: "self_assess",
        text: "Take a self-assessment quiz",
        effects: [
          { type: "flag", key: "midterm_assessed", value: true },
          { type: "resource", key: "knowledge", delta: 2 }
        ],
        nextStoryletId: "midterm_mastery_2"
      },
      {
        id: "skip_assess",
        text: "Skip the quiz and hope for the best",
        effects: [
          { type: "resource", key: "stress", delta: 5 },
          { type: "flag", key: "midterm_skipped_assess", value: true }
        ],
        nextStoryletId: "midterm_mastery_2"
      }
    ]
  },

  // 2. Midterm Mastery: Study Sprint
  midterm_mastery_2: {
    id: "midterm_mastery_2",
    name: "Midterm Mastery: Study Sprint",
    trigger: { type: "flag", conditions: { flags: ["midterm_assessed", "midterm_skipped_assess"] } },
    description: "With only days left before the midterm, it's crunch time. You need to decide how to approach your intensive study session. Will you collaborate or go solo?",
    choices: [
      {
        id: "study_group",
        text: "Form a study group (Requires Social ≥ 10)",
        effects: [
          { type: "resource", key: "social", delta: -5 },
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "skillXp", key: "allianceBuilding", amount: 5 },
          { type: "flag", key: "midterm_grouped", value: true }
        ],
        nextStoryletId: "midterm_mastery_3"
      },
      {
        id: "solo_study",
        text: "Study alone",
        effects: [
          { type: "resource", key: "knowledge", delta: 7 },
          { type: "resource", key: "stress", delta: 3 },
          { type: "skillXp", key: "resourceAcquisition", amount: 3 },
          { type: "flag", key: "midterm_solo", value: true }
        ],
        nextStoryletId: "midterm_mastery_3"
      }
    ]
  },

  // 3. Midterm Mastery: Tutor Session
  midterm_mastery_3: {
    id: "midterm_mastery_3",
    name: "Midterm Mastery: Tutor Session",
    trigger: { type: "flag", conditions: { flags: ["midterm_grouped", "midterm_solo"] } },
    description: "A peer tutor from your class offers to help you review the material, but they're charging a reasonable fee for their time. Is the investment worth it?",
    choices: [
      {
        id: "hire_tutor",
        text: "Hire the tutor (Cost: $10)",
        effects: [
          { type: "resource", key: "money", delta: -10 },
          { type: "resource", key: "knowledge", delta: 15 },
          { type: "skillXp", key: "bureaucraticNavigation", amount: 2 },
          { type: "flag", key: "midterm_tutored", value: true }
        ],
        nextStoryletId: "midterm_mastery_4"
      },
      {
        id: "pass",
        text: "Pass on the tutor and cram",
        effects: [
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "resource", key: "stress", delta: 10 },
          { type: "skillXp", key: "perseverance", amount: 3 },
          { type: "flag", key: "midterm_solo_cram", value: true }
        ],
        nextStoryletId: "midterm_mastery_4"
      }
    ]
  },

  // 4. Midterm Mastery: Exam Day
  midterm_mastery_4: {
    id: "midterm_mastery_4",
    name: "Midterm Mastery: Exam Day",
    trigger: { type: "flag", conditions: { flags: ["midterm_tutored", "midterm_solo_cram"] } },
    description: "You sit down for the midterm exam. Your preparation will determine your result. Time to put everything you've learned to the test.",
    choices: [
      {
        id: "take_exam",
        text: "Take the exam",
        effects: [
          { type: "resource", key: "knowledge", delta: -2 },
          { type: "resource", key: "stress", delta: 5 },
          { type: "flag", key: "midterm_taken", value: true },
          { type: "skillXp", key: "resourceAcquisition", amount: 2 }
        ]
        // No nextStoryletId—quest ends here. After evaluation, flags can unlock new storylets.
      }
    ]
  },

  // 5. Rival Dorm Peace
  rival_dorm_peace_1: {
    id: "rival_dorm_peace_1",
    name: "Rival Dorm Feud: Prank or Peace?",
    trigger: { type: "time", conditions: { day: 2 } },
    description: "Tensions are rising between your dorm wing and the neighboring one. Your dorm's neon décor clashes with their minimalist plastic theme. The rivalry is getting heated - what's your move?",
    choices: [
      {
        id: "prank",
        text: "Prank them (Fun +2, Reputation –1)",
        effects: [
          { type: "resource", key: "social", delta: 2 },
          { type: "skillXp", key: "operationalSecurity", amount: 1 },
          { type: "flag", key: "rival_pranked", value: true }
        ],
        nextStoryletId: "rival_dorm_peace_2"
      },
      {
        id: "negotiate",
        text: "Negotiate a truce (Community +2)",
        effects: [
          { type: "skillXp", key: "allianceBuilding", amount: 5 },
          { type: "resource", key: "social", delta: 3 },
          { type: "flag", key: "rival_truce", value: true }
        ],
        nextStoryletId: "rival_dorm_peace_2"
      },
      {
        id: "ignore",
        text: "Ignore it and mind your own business",
        effects: [
          { type: "resource", key: "stress", delta: -2 },
          { type: "resource", key: "energy", delta: 2 },
          { type: "flag", key: "rival_ignored", value: true }
        ],
        nextStoryletId: "rival_dorm_peace_2"
      }
    ]
  },

  // 6. Follow-up to Rival Dorm
  rival_dorm_peace_2: {
    id: "rival_dorm_peace_2",
    name: "Rival Dorm Feud: Consequences",
    trigger: { type: "flag", conditions: { flags: ["rival_pranked", "rival_truce", "rival_ignored"] } },
    description: "Your decision about the dorm conflict has had consequences. The other wing has responded to your actions. How do you handle the aftermath?",
    choices: [
      {
        id: "escalate",
        text: "Double down on your approach",
        effects: [
          { type: "resource", key: "stress", delta: 5 },
          { type: "skillXp", key: "informationWarfare", amount: 3 },
          { type: "flag", key: "rival_escalated", value: true }
        ]
      },
      {
        id: "apologize",
        text: "Apologize and try to make peace",
        effects: [
          { type: "resource", key: "social", delta: 1 },
          { type: "skillXp", key: "allianceBuilding", amount: 2 },
          { type: "flag", key: "rival_peace_made", value: true }
        ]
      }
    ]
  },

  // === RESOURCE-BASED STORYLETS ===

  // 7. High Stress Warning
  high_stress_warning: {
    id: "high_stress_warning",
    name: "Feeling Overwhelmed",
    trigger: { type: "resource", conditions: { stress: { min: 75 } } },
    description: "Your stress levels are getting quite high. You notice you're having trouble concentrating and feel anxious about everything. The pressure is building up and you need to address it before it gets worse.",
    choices: [
      {
        id: "take_break",
        text: "Take a Mental Health Break",
        effects: [
          { type: "resource", key: "stress", delta: -15 },
          { type: "resource", key: "energy", delta: 10 },
          { type: "resource", key: "knowledge", delta: -5 },
          { type: "skillXp", key: "perseverance", amount: 2 },
          { type: "flag", key: "took_mental_health_break", value: true }
        ]
      },
      {
        id: "push_through",
        text: "Push Through It",
        effects: [
          { type: "resource", key: "stress", delta: 5 },
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "resource", key: "energy", delta: -10 },
          { type: "skillXp", key: "perseverance", amount: 5 },
          { type: "flag", key: "pushed_through_stress", value: true }
        ]
      }
    ]
  },

  // 8. Low Energy Concern
  low_energy_concern: {
    id: "low_energy_concern",
    name: "Running on Empty",
    trigger: { type: "resource", conditions: { energy: { max: 25 } } },
    description: "You're feeling absolutely exhausted and finding it hard to focus on anything. Your body is telling you it desperately needs rest, but you have so much to do.",
    choices: [
      {
        id: "prioritize_sleep",
        text: "Get Extra Sleep",
        effects: [
          { type: "resource", key: "energy", delta: 20 },
          { type: "resource", key: "stress", delta: -10 },
          { type: "resource", key: "social", delta: -5 },
          { type: "skillXp", key: "perseverance", amount: 1 },
          { type: "flag", key: "prioritized_sleep", value: true }
        ]
      },
      {
        id: "energy_drink",
        text: "Rely on Caffeine",
        effects: [
          { type: "resource", key: "energy", delta: 15 },
          { type: "resource", key: "stress", delta: 10 },
          { type: "resource", key: "money", delta: -5 },
          { type: "skillXp", key: "resourceAcquisition", amount: 1 },
          { type: "flag", key: "relied_on_caffeine", value: true }
        ]
      }
    ]
  },

  // 9. Social Isolation
  social_isolation: {
    id: "social_isolation",
    name: "Feeling Lonely",
    trigger: { type: "resource", conditions: { social: { max: 30 } } },
    description: "You've been so focused on work and studies that you haven't connected with friends in a while. You're starting to feel isolated and disconnected from your social circle.",
    choices: [
      {
        id: "reach_out",
        text: "Reach Out to Friends",
        effects: [
          { type: "resource", key: "social", delta: 20 },
          { type: "resource", key: "stress", delta: -5 },
          { type: "resource", key: "money", delta: -10 },
          { type: "skillXp", key: "allianceBuilding", amount: 3 },
          { type: "flag", key: "reached_out_to_friends", value: true }
        ]
      },
      {
        id: "stay_focused",
        text: "Stay Focused on Goals",
        effects: [
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "resource", key: "social", delta: -5 },
          { type: "resource", key: "stress", delta: 5 },
          { type: "skillXp", key: "perseverance", amount: 4 },
          { type: "flag", key: "stayed_focused_on_goals", value: true }
        ]
      }
    ]
  },

  // 10. Money Troubles
  money_troubles: {
    id: "money_troubles",
    name: "Financial Concerns",
    trigger: { type: "resource", conditions: { money: { max: 50 } } },
    description: "Your money is running low, and you're starting to worry about your finances. You need to make some decisions about spending and earning before things get critical.",
    choices: [
      {
        id: "find_work",
        text: "Look for Extra Work",
        effects: [
          { type: "resource", key: "money", delta: 30 },
          { type: "resource", key: "energy", delta: -10 },
          { type: "resource", key: "knowledge", delta: -5 },
          { type: "skillXp", key: "resourceAcquisition", amount: 4 },
          { type: "flag", key: "found_extra_work", value: true }
        ]
      },
      {
        id: "cut_expenses",
        text: "Cut Back on Spending",
        effects: [
          { type: "resource", key: "money", delta: 10 },
          { type: "resource", key: "social", delta: -10 },
          { type: "resource", key: "stress", delta: 5 },
          { type: "skillXp", key: "bureaucraticNavigation", amount: 2 },
          { type: "flag", key: "cut_expenses", value: true }
        ]
      }
    ]
  },

  // 11. Knowledge Breakthrough
  knowledge_breakthrough: {
    id: "knowledge_breakthrough",
    name: "Academic Success",
    trigger: { type: "resource", conditions: { knowledge: { min: 200 } } },
    description: "Your studies have been going really well! You're understanding complex concepts and feeling confident about your progress. This success opens up new opportunities.",
    choices: [
      {
        id: "share_knowledge",
        text: "Help Others Learn",
        effects: [
          { type: "resource", key: "social", delta: 15 },
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "resource", key: "money", delta: 10 },
          { type: "skillXp", key: "allianceBuilding", amount: 4 },
          { type: "flag", key: "shared_knowledge", value: true }
        ]
      },
      {
        id: "advance_studies",
        text: "Pursue Advanced Topics",
        effects: [
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "resource", key: "stress", delta: 5 },
          { type: "resource", key: "energy", delta: -5 },
          { type: "skillXp", key: "informationWarfare", amount: 3 },
          { type: "flag", key: "pursued_advanced_studies", value: true }
        ]
      }
    ]
  }
};
