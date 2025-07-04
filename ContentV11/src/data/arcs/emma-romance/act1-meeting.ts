// Emma Romance Arc - Act 1: First Meeting
import type { Storylet } from '../../../types/storylet';

export const emmaRomanceAct1: Record<string, Storylet> = {
  "emma_01_coffee_shop": {
    id: "emma_01_coffee_shop",
    name: "Philosophy and Foam",
    description: "You notice Emma in the campus coffee shop, absorbed in reading what looks like a philosophy text. Steam rises from her untouched latte as she takes careful notes in the margins.",
    storyArc: "Emma Romance",
    deploymentStatus: "dev",
    trigger: {
      type: "flag",
      conditions: { 
        flags: ["college_started"] 
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
  }
};