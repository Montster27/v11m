// /Users/montysharma/V11M2/src/data/collegeStorylets.ts

import { Storylet } from "../types/storylet";

export const collegeStorylets: Record<string, Storylet> = {
  // 1. Campus Politics: Student Council Election
  student_council_announcement: {
    id: "student_council_announcement",
    name: "Student Council Election Announcement",
    trigger: { type: "time", conditions: { week: 2 } },
    description:
      "The Student Council is holding elections next month. You see flyers in every hallway and social media posts urging candidates to apply. Do you throw your hat in the ring?",
    choices: [
      {
        id: "run_for_council",
        text: "Run for Student Council",
        effects: [
          { type: "resource", key: "energy", delta: -5 },
          { type: "flag", key: "running_for_council", value: true },
          { type: "skillXp", key: "bureaucraticNavigation", amount: 5 }
        ],
        nextStoryletId: "campaign_poster_creation"
      },
      {
        id: "support_friend",
        text: "Volunteer for a friend's campaign",
        effects: [
          { type: "resource", key: "social", delta: 10 },
          { type: "skillXp", key: "allianceBuilding", amount: 3 },
          { type: "flag", key: "volunteered_council", value: true }
        ],
        nextStoryletId: "campaign_poster_creation"
      },
      {
        id: "ignore_election",
        text: "Ignore the election and focus on studies",
        effects: [
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "resource", key: "stress", delta: -5 },
          { type: "flag", key: "focused_on_studies", value: true }
        ]
      }
    ]
  },

  campaign_poster_creation: {
    id: "campaign_poster_creation",
    name: "Designing Campaign Posters",
    trigger: {
      type: "flag",
      conditions: { flags: ["running_for_council", "volunteered_council"] }
    },
    description:
      "You need attractive posters to catch attention across campus. Will you design them yourself, hire a design major, or repurpose old templates?",
    choices: [
      {
        id: "self_design",
        text: "Design the posters yourself",
        effects: [
          { type: "resource", key: "energy", delta: -10 },
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "skillXp", key: "perseverance", amount: 4 },
          { type: "flag", key: "designed_own_posters", value: true }
        ],
        nextStoryletId: "start_campaign_rally"
      },
      {
        id: "hire_design_major",
        text: "Hire the design major (Cost: $20)",
        effects: [
          { type: "resource", key: "money", delta: -20 },
          { type: "resource", key: "social", delta: 5 },
          { type: "skillXp", key: "resourceAcquisition", amount: 4 },
          { type: "flag", key: "hired_designer", value: true }
        ],
        nextStoryletId: "start_campaign_rally"
      },
      {
        id: "reuse_templates",
        text: "Repurpose old campus campaign templates",
        effects: [
          { type: "resource", key: "knowledge", delta: 2 },
          { type: "resource", key: "energy", delta: -5 },
          { type: "flag", key: "used_templates", value: true }
        ],
        nextStoryletId: "start_campaign_rally"
      }
    ]
  },

  start_campaign_rally: {
    id: "start_campaign_rally",
    name: "Hold a Campaign Rally",
    trigger: {
      type: "flag",
      conditions: {
        flags: ["designed_own_posters", "hired_designer", "used_templates"]
      }
    },
    description:
      "Your posters are up, and it's time for a rally. Do you rent the main auditorium, gather volunteers to set up a smaller event, or simply pass out flyers outside the cafeteria?",
    choices: [
      {
        id: "rent_auditorium",
        text: "Rent the auditorium (Cost: $50)",
        effects: [
          { type: "resource", key: "money", delta: -50 },
          { type: "resource", key: "social", delta: 15 },
          { type: "skillXp", key: "resourceAcquisition", amount: 6 },
          { type: "flag", key: "auditorium_rented", value: true }
        ],
        nextStoryletId: "election_day"
      },
      {
        id: "volunteer_setup",
        text: "Gather volunteers for a smaller event",
        effects: [
          { type: "resource", key: "social", delta: 10 },
          { type: "skillXp", key: "allianceBuilding", amount: 5 },
          { type: "resource", key: "energy", delta: -10 },
          { type: "flag", key: "small_rally", value: true }
        ],
        nextStoryletId: "election_day"
      },
      {
        id: "flyer_outside",
        text: "Pass out flyers outside the cafeteria",
        effects: [
          { type: "resource", key: "social", delta: 5 },
          { type: "skillXp", key: "bureaucraticNavigation", amount: 2 },
          { type: "resource", key: "energy", delta: -5 },
          { type: "flag", key: "flyers_distributed", value: true }
        ],
        nextStoryletId: "election_day"
      }
    ]
  },

  election_day: {
    id: "election_day",
    name: "Election Day: Voting Begins",
    trigger: {
      type: "flag",
      conditions: {
        flags: ["auditorium_rented", "small_rally", "flyers_distributed"]
      }
    },
    description:
      "It's election day. As votes are counted, nerves are high. Will you watch silently, give a last‐minute speech, or console supporters regardless of the result?",
    choices: [
      {
        id: "last_minute_speech",
        text: "Give a last-minute speech",
        effects: [
          { type: "resource", key: "social", delta: 20 },
          { type: "skillXp", key: "allianceBuilding", amount: 8 },
          { type: "resource", key: "energy", delta: -15 },
          { type: "flag", key: "gave_speech", value: true }
        ],
        nextStoryletId: "council_result"
      },
      {
        id: "watch_silently",
        text: "Watch silently from the sidelines",
        effects: [
          { type: "resource", key: "stress", delta: 10 },
          { type: "skillXp", key: "perseverance", amount: 3 },
          { type: "flag", key: "watched_silently", value: true }
        ],
        nextStoryletId: "council_result"
      },
      {
        id: "console_supporters",
        text: "Console supporters regardless of the result",
        effects: [
          { type: "resource", key: "social", delta: 10 },
          { type: "skillXp", key: "empathy", amount: 5 },
          { type: "flag", key: "consoled_supporters", value: true }
        ],
        nextStoryletId: "council_result"
      }
    ]
  },

  council_result: {
    id: "council_result",
    name: "Council Election Results",
    trigger: {
      type: "flag",
      conditions: {
        flags: ["gave_speech", "watched_silently", "consoled_supporters"]
      }
    },
    description:
      "Results are in: the votes are too close to call. Your fate depends on a recount. Do you lobby council members behind the scenes, trust the process, or stir drama in the student newspaper?",
    choices: [
      {
        id: "lobby_council",
        text: "Lobby council members privately",
        effects: [
          { type: "resource", key: "money", delta: -10 },
          { type: "resource", key: "social", delta: 15 },
          { type: "skillXp", key: "bureaucraticNavigation", amount: 7 },
          { type: "flag", key: "lobbied_members", value: true }
        ],
        nextStoryletId: "council_final"
      },
      {
        id: "trust_process",
        text: "Trust the election process and wait",
        effects: [
          { type: "resource", key: "stress", delta: 15 },
          { type: "skillXp", key: "perseverance", amount: 4 },
          { type: "flag", key: "trusted_process", value: true }
        ],
        nextStoryletId: "council_final"
      },
      {
        id: "stir_drama",
        text: "Stir drama in the student newspaper",
        effects: [
          { type: "resource", key: "social", delta: 10 },
          { type: "resource", key: "stress", delta: 5 },
          { type: "skillXp", key: "informationWarfare", amount: 6 },
          { type: "flag", key: "stirred_drama", value: true }
        ],
        nextStoryletId: "council_final"
      }
    ]
  },

  council_final: {
    id: "council_final",
    name: "Final Recount: The Winner",
    trigger: {
      type: "flag",
      conditions: {
        flags: ["lobbied_members", "trusted_process", "stirred_drama"]
      }
    },
    description:
      "The recount concludes. By a narrow margin, you have won the Student Council seat! Congratulations. How will you celebrate?",
    choices: [
      {
        id: "host_celebration",
        text: "Host a big celebration (Cost: $30)",
        effects: [
          { type: "resource", key: "money", delta: -30 },
          { type: "resource", key: "social", delta: 25 },
          { type: "skillXp", key: "allianceBuilding", amount: 10 },
          { type: "flag", key: "celebrated_win", value: true }
        ]
      },
      {
        id: "study_next_class",
        text: "Keep your head down and study for next midterm",
        effects: [
          { type: "resource", key: "knowledge", delta: 15 },
          { type: "resource", key: "energy", delta: -5 },
          { type: "skillXp", key: "perseverance", amount: 5 },
          { type: "flag", key: "studied_instead", value: true }
        ]
      }
    ]
  },

  // 2. Early Internship: Research Assistant
  research_lab_application: {
    id: "research_lab_application",
    name: "Apply for Research Lab Assistant",
    trigger: { type: "time", conditions: { week: 4 } },
    description:
      "Your favorite professor is seeking a research assistant for her lab. Applications close soon. Do you submit yours?",
    choices: [
      {
        id: "apply_assistant",
        text: "Submit application",
        effects: [
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "resource", key: "energy", delta: -5 },
          { type: "skillXp", key: "resourceAcquisition", amount: 4 },
          { type: "flag", key: "applied_lab", value: true }
        ],
        nextStoryletId: "lab_interview"
      },
      {
        id: "focus_books",
        text: "Focus on coursework instead",
        effects: [
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "skillXp", key: "perseverance", amount: 3 },
          { type: "flag", key: "skipped_internship", value: true }
        ]
      }
    ]
  },

  lab_interview: {
    id: "lab_interview",
    name: "Interview at the Research Lab",
    trigger: { type: "flag", conditions: { flags: ["applied_lab"] } },
    description:
      "You're invited to interview for the lab assistant position. The lab manager quizzes you on basic research protocols. How do you prepare?",
    choices: [
      {
        id: "study_protocols",
        text: "Study lab protocols and methods",
        effects: [
          { type: "resource", key: "knowledge", delta: 15 },
          { type: "resource", key: "energy", delta: -10 },
          { type: "skillXp", key: "bureaucraticNavigation", amount: 5 },
          { type: "flag", key: "prepared_lab", value: true }
        ],
        nextStoryletId: "lab_offer"
      },
      {
        id: "wing_interview",
        text: "Wing the interview (hope your GPA helps)",
        effects: [
          { type: "resource", key: "stress", delta: 10 },
          { type: "skillXp", key: "perseverance", amount: 2 },
          { type: "flag", key: "winged_interview", value: true }
        ],
        nextStoryletId: "lab_offer"
      }
    ]
  },

  lab_offer: {
    id: "lab_offer",
    name: "Research Lab Offer",
    trigger: {
      type: "flag",
      conditions: { flags: ["prepared_lab", "winged_interview"] }
    },
    description:
      "After deliberation, the lab manager offers you the assistant role. The position pays $15/week. Do you accept?",
    choices: [
      {
        id: "accept_lab",
        text: "Accept the lab assistant position",
        effects: [
          { type: "resource", key: "money", delta: 15 },
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "skillXp", key: "informationWarfare", amount: 4 },
          { type: "flag", key: "accepted_lab", value: true }
        ],
        nextStoryletId: "lab_first_task"
      },
      {
        id: "decline_lab",
        text: "Decline and keep looking",
        effects: [
          { type: "resource", key: "social", delta: 5 },
          { type: "skillXp", key: "perseverance", amount: 3 },
          { type: "flag", key: "declined_lab", value: true }
        ]
      }
    ]
  },

  lab_first_task: {
    id: "lab_first_task",
    name: "First Research Task",
    trigger: { type: "flag", conditions: { flags: ["accepted_lab"] } },
    description:
      "Your first task is to prepare samples for DNA extraction. It's your first real taste of lab work. Do you follow protocol exactly or improvise a shortcut to save time?",
    choices: [
      {
        id: "follow_protocol",
        text: "Follow the protocol exactly",
        effects: [
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "resource", key: "energy", delta: -10 },
          { type: "skillXp", key: "operationalSecurity", amount: 5 },
          { type: "flag", key: "followed_protocol", value: true }
        ]
      },
      {
        id: "improvise_shortcut",
        text: "Improvise a shortcut (Risky)",
        effects: [
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "resource", key: "stress", delta: 10 },
          { type: "skillXp", key: "informationWarfare", amount: 6 },
          { type: "flag", key: "shortcut_improvised", value: true }
        ]
      }
    ]
  },

  // 3. Social Milestone: Fraternity Rush
  fraternity_rush_invite: {
    id: "fraternity_rush_invite",
    name: "Fraternity Rush Invitation",
    trigger: { type: "time", conditions: { week: 3 } },
    description:
      "Flyers for fraternity rush parties are everywhere. One big frat invites you personally. Do you attend their rush event?",
    choices: [
      {
        id: "attend_rush",
        text: "Attend the fraternity rush",
        effects: [
          { type: "resource", key: "social", delta: 10 },
          { type: "resource", key: "energy", delta: -5 },
          { type: "skillXp", key: "allianceBuilding", amount: 5 },
          { type: "flag", key: "attended_rush", value: true }
        ],
        nextStoryletId: "rush_interview"
      },
      {
        id: "skip_rush",
        text: "Skip it and hang out with friends",
        effects: [
          { type: "resource", key: "social", delta: 5 },
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "flag", key: "skipped_rush", value: true }
        ]
      }
    ]
  },

  rush_interview: {
    id: "rush_interview",
    name: "Fraternity Rush Interview",
    trigger: { type: "flag", conditions: { flags: ["attended_rush"] } },
    description:
      "The fraternity brothers ask for a brief interview to see if you fit their image. Do you brag about connections or be humble and genuine?",
    choices: [
      {
        id: "brag_connections",
        text: "Brag about your high‐profile connections",
        effects: [
          { type: "resource", key: "social", delta: 5 },
          { type: "resource", key: "stress", delta: 10 },
          { type: "skillXp", key: "bureaucraticNavigation", amount: 3 },
          { type: "flag", key: "bragged", value: true }
        ],
        nextStoryletId: "rush_outcome"
      },
      {
        id: "be_humble",
        text: "Be humble and genuine",
        effects: [
          { type: "resource", key: "social", delta: 15 },
          { type: "skillXp", key: "empathy", amount: 5 },
          { type: "flag", key: "humble", value: true }
        ],
        nextStoryletId: "rush_outcome"
      }
    ]
  },

  rush_outcome: {
    id: "rush_outcome",
    name: "Rush Outcome",
    trigger: {
      type: "flag",
      conditions: { flags: ["bragged", "humble"] }
    },
    description:
      "The fraternity will announce acceptance tomorrow. Tonight, you can study, party at another campus event, or just rest. What do you choose?",
    choices: [
      {
        id: "study_tonight",
        text: "Study for tomorrow's exam",
        effects: [
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "resource", key: "energy", delta: -10 },
          { type: "skillXp", key: "perseverance", amount: 5 },
          { type: "flag", key: "studied_tonight", value: true }
        ],
        nextStoryletId: "rush_decision_day"
      },
      {
        id: "party_elsewhere",
        text: "Party at another campus event",
        effects: [
          { type: "resource", key: "social", delta: 10 },
          { type: "resource", key: "energy", delta: -15 },
          { type: "flag", key: "partied_tonight", value: true }
        ],
        nextStoryletId: "rush_decision_day"
      },
      {
        id: "rest_up",
        text: "Rest up for the big day",
        effects: [
          { type: "resource", key: "energy", delta: 20 },
          { type: "resource", key: "stress", delta: -5 },
          { type: "flag", key: "rested_tonight", value: true }
        ],
        nextStoryletId: "rush_decision_day"
      }
    ]
  },

  rush_decision_day: {
    id: "rush_decision_day",
    name: "Fraternity Decision Day",
    trigger: {
      type: "flag",
      conditions: {
        flags: ["studied_tonight", "partied_tonight", "rested_tonight"]
      }
    },
    description:
      "You receive an email: the fraternity has decided. Do they offer you a bid or not? Regardless, how do you react?",
    choices: [
      {
        id: "accepted_bid",
        text: "You got accepted! Celebrate with a big party",
        effects: [
          { type: "resource", key: "social", delta: 25 },
          { type: "resource", key: "money", delta: -10 },
          { type: "skillXp", key: "allianceBuilding", amount: 10 },
          { type: "flag", key: "friended_fraternity", value: true }
        ]
      },
      {
        id: "rejected_bid",
        text: "You were rejected. You feel down but pick yourself up",
        effects: [
          { type: "resource", key: "stress", delta: 15 },
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "skillXp", key: "perseverance", amount: 5 },
          { type: "flag", key: "rejected_fraternity", value: true }
        ]
      }
    ]
  },

  // 4. Family Crisis: House Fire
  family_house_fire_news: {
    id: "family_house_fire_news",
    name: "Family House Fire News",
    trigger: {
      type: "time",
      conditions: { week: 6 }
    },
    description:
      "You get a call: there's been a small fire at your parents' home. They're safe but need help with repairs. How do you respond?",
    choices: [
      {
        id: "fly_home",
        text: "Fly home immediately (Cost: $100)",
        effects: [
          { type: "resource", key: "money", delta: -100 },
          { type: "resource", key: "energy", delta: -20 },
          { type: "resource", key: "stress", delta: 10 },
          { type: "skillXp", key: "perseverance", amount: 5 },
          { type: "flag", key: "flew_home", value: true }
        ],
        nextStoryletId: "handle_repairs"
      },
      {
        id: "call_for_help",
        text: "Call a cousin to check on things",
        effects: [
          { type: "resource", key: "social", delta: 5 },
          { type: "resource", key: "stress", delta: 5 },
          { type: "skillXp", key: "allianceBuilding", amount: 3 },
          { type: "flag", key: "called_cousin", value: true }
        ]
      },
      {
        id: "stay_safe",
        text: "Stay on campus to finish midterms",
        effects: [
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "resource", key: "stress", delta: 15 },
          { type: "skillXp", key: "perseverance", amount: 4 },
          { type: "flag", key: "stayed_campus", value: true }
        ]
      }
    ]
  },

  handle_repairs: {
    id: "handle_repairs",
    name: "Handling Home Repairs",
    trigger: {
      type: "flag",
      conditions: { flags: ["flew_home"] }
    },
    description:
      "At home, your parents ask you to hire contractors. Will you save money by doing repairs yourself, or hire professionals?",
    choices: [
      {
        id: "do_it_yourself",
        text: "Do the repairs yourself",
        effects: [
          { type: "resource", key: "energy", delta: -30 },
          { type: "resource", key: "stress", delta: 20 },
          { type: "skillXp", key: "operationalSecurity", amount: 5 },
          { type: "flag", key: "self_repaired", value: true }
        ]
      },
      {
        id: "hire_professionals",
        text: "Hire professionals (Cost: $200)",
        effects: [
          { type: "resource", key: "money", delta: -200 },
          { type: "resource", key: "social", delta: 10 },
          { type: "flag", key: "hired_pros", value: true }
        ]
      }
    ]
  },

  // 5. Pop‐Culture Vignette: Arcade Tournament
  arcade_tournament_ad: {
    id: "arcade_tournament_ad",
    name: "Arcade Tournament Flyer",
    trigger: { type: "time", conditions: { week: 1 } },
    description:
      "A flyer advertises an 80s arcade tournament with a $50 grand prize. Entry fee is $5. Do you enter?",
    choices: [
      {
        id: "enter_tournament",
        text: "Enter the tournament (Cost: $5)",
        effects: [
          { type: "resource", key: "money", delta: -5 },
          { type: "resource", key: "energy", delta: -5 },
          { type: "skillXp", key: "operationalSecurity", amount: 2 },
          { type: "flag", key: "entered_arcade", value: true }
        ],
        nextStoryletId: "arcade_first_match"
      },
      {
        id: "watch_tournament",
        text: "Watch others play from the sidelines",
        effects: [
          { type: "resource", key: "social", delta: 5 },
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "skillXp", key: "informationWarfare", amount: 2 },
          { type: "flag", key: "watched_arcade", value: true }
        ]
      }
    ]
  },

  arcade_first_match: {
    id: "arcade_first_match",
    name: "Arcade Tournament: First Match",
    trigger: {
      type: "flag",
      conditions: { flags: ["entered_arcade"] }
    },
    description:
      "Your first match is against the campus gaming champ. Do you play aggressively for high scores or focus on consistency?",
    choices: [
      {
        id: "play_aggressively",
        text: "Play aggressively for high scores",
        effects: [
          { type: "resource", key: "energy", delta: -10 },
          { type: "resource", key: "stress", delta: 10 },
          { type: "skillXp", key: "operationalSecurity", amount: 5 },
          { type: "flag", key: "played_aggressively", value: true }
        ],
        nextStoryletId: "arcade_semifinal"
      },
      {
        id: "play_consistently",
        text: "Focus on consistency and survival",
        effects: [
          { type: "resource", key: "social", delta: 5 },
          { type: "skillXp", key: "perseverance", amount: 4 },
          { type: "flag", key: "played_consistently", value: true }
        ],
        nextStoryletId: "arcade_semifinal"
      }
    ]
  },

  arcade_semifinal: {
    id: "arcade_semifinal",
    name: "Arcade Tournament: Semifinal",
    trigger: {
      type: "flag",
      conditions: { flags: ["played_aggressively", "played_consistently"] }
    },
    description:
      "You made it to the semifinals. The stakes are higher. Do you stick with your previous strategy or switch tactics?",
    choices: [
      {
        id: "switch_tactics",
        text: "Switch tactics for surprise",
        effects: [
          { type: "resource", key: "energy", delta: -10 },
          { type: "resource", key: "stress", delta: 15 },
          { type: "skillXp", key: "informationWarfare", amount: 6 },
          { type: "flag", key: "switched_tactics", value: true }
        ],
        nextStoryletId: "arcade_final"
      },
      {
        id: "stay_strategy",
        text: "Stay with your original strategy",
        effects: [
          { type: "skillXp", key: "operationalSecurity", amount: 5 },
          { type: "resource", key: "social", delta: 10 },
          { type: "flag", key: "stayed_strategy", value: true }
        ],
        nextStoryletId: "arcade_final"
      }
    ]
  },

  arcade_final: {
    id: "arcade_final",
    name: "Arcade Tournament: Finals",
    trigger: {
      type: "flag",
      conditions: {
        flags: ["switched_tactics", "stayed_strategy"]
      }
    },
    description:
      "Final match! The prize is within reach. Do you push for a risky high‐score combo or play safe and hope for the best?",
    choices: [
      {
        id: "risky_combo",
        text: "Go for the risky high‐score combo",
        effects: [
          { type: "resource", key: "energy", delta: -15 },
          { type: "resource", key: "stress", delta: 20 },
          { type: "skillXp", key: "perseverance", amount: 8 },
          { type: "flag", key: "went_for_combo", value: true }
        ]
      },
      {
        id: "play_safe",
        text: "Play safe and hope for stability",
        effects: [
          { type: "skillXp", key: "operationalSecurity", amount: 6 },
          { type: "resource", key: "social", delta: 10 },
          { type: "flag", key: "played_safe", value: true }
        ]
      }
    ]
  },

  // 6. Pop‐Culture Vignette: Mixtape Swap
  mixtape_swap_announcement: {
    id: "mixtape_swap_announcement",
    name: "Mixtape Swap Club Fair",
    trigger: { type: "time", conditions: { week: 5 } },
    description:
      "A new club is hosting a 'mixtape swap' event where students exchange homemade cassettes. Your favorite band's songs could make a killer mix. Do you participate?",
    choices: [
      {
        id: "participate_swap",
        text: "Bring your homemade mixtape to swap",
        effects: [
          { type: "resource", key: "social", delta: 10 },
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "skillXp", key: "informationWarfare", amount: 4 },
          { type: "flag", key: "participated_mix", value: true }
        ],
        nextStoryletId: "best_mixtape_award"
      },
      {
        id: "browse_swap",
        text: "Browse others' tapes first",
        effects: [
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "skillXp", key: "operationalSecurity", amount: 3 },
          { type: "flag", key: "browsed_mix", value: true }
        ]
      }
    ]
  },

  best_mixtape_award: {
    id: "best_mixtape_award",
    name: "Best Mixtape Award",
    trigger: {
      type: "flag",
      conditions: { flags: ["participated_mix"] }
    },
    description:
      "Your mixtape is a hit! You've been nominated for 'Best Mixtape' and must choose a judge's panel style: digital poll or handwritten ballots?",
    choices: [
      {
        id: "digital_poll",
        text: "Opt for the digital poll",
        effects: [
          { type: "skillXp", key: "informationWarfare", amount: 5 },
          { type: "resource", key: "social", delta: 10 },
          { type: "flag", key: "chose_digital", value: true }
        ],
        nextStoryletId: "mixtape_winner"
      },
      {
        id: "handwritten_ballots",
        text: "Choose handwritten ballots",
        effects: [
          { type: "skillXp", key: "bureaucraticNavigation", amount: 5 },
          { type: "resource", key: "energy", delta: -5 },
          { type: "flag", key: "chose_handwritten", value: true }
        ],
        nextStoryletId: "mixtape_winner"
      }
    ]
  },

  mixtape_winner: {
    id: "mixtape_winner",
    name: "Mixtape Winner Announced",
    trigger: {
      type: "flag",
      conditions: { flags: ["chose_digital", "chose_handwritten"] }
    },
    description:
      "The winner is announced, and it's you! Your reputation as a trendsetter soars. How do you leverage this fame?",
    choices: [
      {
        id: "start_radio_show",
        text: "Pitch a late-night campus radio show",
        effects: [
          { type: "resource", key: "social", delta: 20 },
          { type: "skillXp", key: "allianceBuilding", amount: 8 },
          { type: "flag", key: "started_radio_show", value: true }
        ]
      },
      {
        id: "sell_mixtapes",
        text: "Sell copies of your mix for profit",
        effects: [
          { type: "resource", key: "money", delta: 20 },
          { type: "skillXp", key: "resourceAcquisition", amount: 6 },
          { type: "flag", key: "sold_mixtapes", value: true }
        ]
      }
    ]
  },

  // STEP 3: Additional 1980s Storylets (60% loaded) - 5 New Storylets
  // Converted from Obsidian document

  morning_america_debate: {
    id: "morning_america_debate",
    name: "The Morning in America Debate",
    trigger: { type: "time", conditions: { week: 8 } },
    description:
      "A campus debate watch-party pits optimistic Young Republicans against cynical liberal arts majors as President Reagan gives a rousing speech. One student proudly echoes Reagan's 'Morning in America' optimism, while others counter with concerns about rising Cold War tensions and cuts to student aid. The scene balances humor with serious discussion about national politics in the Reagan era.",
    choices: [
      {
        id: "support_reagan",
        text: "Echo Reagan's optimism and support his policies",
        effects: [
          { type: "resource", key: "social", delta: 10 },
          { type: "resource", key: "stress", delta: -5 },
          { type: "skillXp", key: "bureaucraticNavigation", amount: 5 },
          { type: "flag", key: "young_republican", value: true }
        ]
      },
      {
        id: "counter_concerns",
        text: "Counter with concerns about Cold War and student aid cuts",
        effects: [
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "resource", key: "stress", delta: 5 },
          { type: "skillXp", key: "informationWarfare", amount: 6 },
          { type: "flag", key: "liberal_activist", value: true }
        ]
      },
      {
        id: "stay_neutral",
        text: "Listen to both sides without taking a stance",
        effects: [
          { type: "resource", key: "social", delta: 5 },
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "skillXp", key: "operationalSecurity", amount: 3 },
          { type: "flag", key: "political_moderate", value: true }
        ]
      }
    ]
  },

  reaganomics_ramen: {
    id: "reaganomics_ramen",
    name: "Reaganomics and Ramen",
    trigger: { type: "resource", conditions: { money: { max: 25 } } },
    description:
      "You find your budget dwindling due to Reagan-era financial aid cuts and an early '80s recession. Tuition is up while grants are down, leaving you surviving on instant ramen. This storylet uses dark humor – the cafeteria jokes that ketchup counts as a vegetable (a real Reagan-era controversy) – to highlight economic pressure on students. An upperclassman quips about 'trickle-down' economics not yet trickling into their wallet.",
    choices: [
      {
        id: "find_part_time_job",
        text: "Look for a part-time job to make ends meet",
        effects: [
          { type: "resource", key: "money", delta: 30 },
          { type: "resource", key: "energy", delta: -15 },
          { type: "resource", key: "stress", delta: 10 },
          { type: "skillXp", key: "resourceAcquisition", amount: 8 },
          { type: "flag", key: "working_student", value: true }
        ]
      },
      {
        id: "apply_more_aid",
        text: "Apply for additional financial aid and scholarships",
        effects: [
          { type: "resource", key: "energy", delta: -10 },
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "skillXp", key: "bureaucraticNavigation", amount: 6 },
          { type: "flag", key: "aid_applicant", value: true }
        ]
      },
      {
        id: "embrace_ramen_life",
        text: "Embrace the ramen lifestyle and make jokes about it",
        effects: [
          { type: "resource", key: "social", delta: 15 },
          { type: "resource", key: "stress", delta: -10 },
          { type: "skillXp", key: "perseverance", amount: 7 },
          { type: "flag", key: "ramen_philosopher", value: true }
        ]
      }
    ]
  },

  selective_service_showdown: {
    id: "selective_service_showdown",
    name: "Selective Service Showdown",
    trigger: { type: "time", conditions: { week: 12 } },
    description:
      "It's 1981 and the draft registration is back: you (or a close friend) turn 18 and receive a Selective Service notice, stirring anxiety about a possible war. In a tense, emotional scene, you recall Vietnam's shadow and fret about Reagan's confrontations with the 'Evil Empire' (USSR). You can comply with the law or join a quiet campus protest burning draft cards in defiance. The tone is serious, touching on fear of being called to fight if Cold War escalates.",
    choices: [
      {
        id: "register_comply",
        text: "Register with Selective Service as required by law",
        effects: [
          { type: "resource", key: "stress", delta: 5 },
          { type: "skillXp", key: "bureaucraticNavigation", amount: 4 },
          { type: "flag", key: "registered_draft", value: true }
        ]
      },
      {
        id: "join_protest",
        text: "Join the campus protest and burn draft cards",
        effects: [
          { type: "resource", key: "stress", delta: 15 },
          { type: "resource", key: "social", delta: 10 },
          { type: "skillXp", key: "informationWarfare", amount: 8 },
          { type: "flag", key: "draft_protester", value: true }
        ],
        nextStoryletId: "anti_war_activism"
      },
      {
        id: "conscientious_objector",
        text: "File as a conscientious objector",
        effects: [
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "resource", key: "stress", delta: 10 },
          { type: "skillXp", key: "perseverance", amount: 6 },
          { type: "flag", key: "conscientious_objector", value: true }
        ]
      }
    ]
  },

  young_republicans_wine_cheese: {
    id: "young_republicans_wine_cheese",
    name: "The Young Republicans' Wine and Cheese",
    trigger: { type: "flag", conditions: { flags: ["young_republican"] } },
    description:
      "A lighthearted, satirical event where the campus Young Republicans club hosts a 'Reagan Re-election Rally' social. It features 80s yuppie culture in microcosm: preppy students in polo shirts toast with cheap wine, praising Reagan's latest tax cuts and discussing Wall Street internships. Meanwhile, a couple of punk-rock classmates crash the party with 'Reagan sucks' buttons, providing comedic culture clash. This storylet highlights the emerging conservative youth movement on campus in a humorous tone.",
    choices: [
      {
        id: "network_yuppies",
        text: "Network with the preppy students about internships",
        effects: [
          { type: "resource", key: "social", delta: 15 },
          { type: "resource", key: "money", delta: 10 },
          { type: "skillXp", key: "allianceBuilding", amount: 6 },
          { type: "flag", key: "yuppie_connections", value: true }
        ]
      },
      {
        id: "support_punks",
        text: "Secretly support the punk-rock party crashers",
        effects: [
          { type: "resource", key: "social", delta: 10 },
          { type: "resource", key: "stress", delta: 5 },
          { type: "skillXp", key: "informationWarfare", amount: 5 },
          { type: "flag", key: "punk_sympathizer", value: true }
        ]
      },
      {
        id: "enjoy_irony",
        text: "Enjoy the cultural clash and irony of the situation",
        effects: [
          { type: "resource", key: "social", delta: 8 },
          { type: "resource", key: "knowledge", delta: 8 },
          { type: "skillXp", key: "operationalSecurity", amount: 4 },
          { type: "flag", key: "cultural_observer", value: true }
        ]
      }
    ]
  },

  apartheid_divestment_rally: {
    id: "apartheid_divestment_rally",
    name: "Apartheid Divestment Rally",
    trigger: { type: "time", conditions: { week: 20 } },
    description:
      "A passionate, realistic storylet in which students mobilize against the college's investments in apartheid South Africa. Activists set up a mock 'shantytown' of cardboard shacks on the quad to symbolize black South Africans' living conditions. They chant 'Divest Now!' and cite how over 50 U.S. colleges have partly or fully divested by 1985 under student pressure. The college administration, weary from post-60s protest fatigue, attempts to quietly dismantle the shanties at night. You can join the protest or watch from the sidelines as idealism collides with administrative caution.",
    choices: [
      {
        id: "join_shantytown",
        text: "Join the protesters in building and defending the shantytown",
        effects: [
          { type: "resource", key: "energy", delta: -15 },
          { type: "resource", key: "social", delta: 20 },
          { type: "resource", key: "stress", delta: 10 },
          { type: "skillXp", key: "informationWarfare", amount: 10 },
          { type: "flag", key: "divestment_activist", value: true }
        ],
        nextStoryletId: "divestment_confrontation"
      },
      {
        id: "support_from_sidelines",
        text: "Support the cause but watch from the sidelines",
        effects: [
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "resource", key: "social", delta: 5 },
          { type: "skillXp", key: "operationalSecurity", amount: 4 },
          { type: "flag", key: "divestment_supporter", value: true }
        ]
      },
      {
        id: "focus_on_studies",
        text: "Stay focused on your studies and avoid the controversy",
        effects: [
          { type: "resource", key: "knowledge", delta: 15 },
          { type: "resource", key: "stress", delta: -5 },
          { type: "skillXp", key: "perseverance", amount: 5 },
          { type: "flag", key: "apolitical_student", value: true }
        ]
      }
    ]
  },

  // STEP 4: Additional 1980s Storylets (80% loaded) - 5 More Storylets
  // Continued from Obsidian document

  mtv_music_television: {
    id: "mtv_music_television",
    name: "MTV: Music Television or More Television?",
    trigger: { type: "time", conditions: { week: 4 } },
    description:
      "The dorm floor splits over the new MTV channel that launched August 1, 1981. Some students are glued to the TV watching music videos for hours ('Video Killed the Radio Star' was the first), while others complain it's rotting their brains and they can't study. You find yourself caught between a music-obsessed roommate who knows every VJ's name and schedule, and a serious pre-med student who threatens to throw the TV out the window.",
    choices: [
      {
        id: "support_mtv_access",
        text: "Support getting MTV and argue for its artistic value",
        effects: [
          { type: "resource", key: "social", delta: 15 },
          { type: "resource", key: "knowledge", delta: -5 },
          { type: "skillXp", key: "allianceBuilding", amount: 6 },
          { type: "flag", key: "mtv_fan", value: true }
        ]
      },
      {
        id: "oppose_mtv_access",
        text: "Side with the pre-med student and oppose MTV",
        effects: [
          { type: "resource", key: "knowledge", delta: 15 },
          { type: "resource", key: "social", delta: -10 },
          { type: "skillXp", key: "perseverance", amount: 5 },
          { type: "flag", key: "mtv_critic", value: true }
        ]
      },
      {
        id: "compromise_solution",
        text: "Propose a compromise: designated MTV hours",
        effects: [
          { type: "resource", key: "social", delta: 10 },
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "skillXp", key: "bureaucraticNavigation", amount: 7 },
          { type: "flag", key: "mtv_mediator", value: true }
        ]
      }
    ]
  },

  pac_man_addiction: {
    id: "pac_man_addiction",
    name: "The Pac-Man Addiction",
    trigger: { type: "time", conditions: { week: 6 } },
    description:
      "The student union's new Pac-Man machine has created an obsession epidemic – students skip classes to chase high scores, quarter donations meant for charity get diverted to gaming, and heated arguments break out over turn-taking. You discover your study partner has spent their textbook money on tokens and is now failing courses.",
    choices: [
      {
        id: "help_addicted_friend",
        text: "Intervene to help your addicted study partner",
        effects: [
          { type: "resource", key: "energy", delta: -10 },
          { type: "resource", key: "social", delta: 15 },
          { type: "skillXp", key: "empathy", amount: 8 },
          { type: "flag", key: "intervention_helper", value: true }
        ]
      },
      {
        id: "join_arcade_scene",
        text: "Join the arcade scene and compete for high scores",
        effects: [
          { type: "resource", key: "stress", delta: -10 },
          { type: "resource", key: "social", delta: 10 },
          { type: "resource", key: "money", delta: -15 },
          { type: "skillXp", key: "operationalSecurity", amount: 5 },
          { type: "flag", key: "arcade_gamer", value: true }
        ]
      },
      {
        id: "study_phenomenon",
        text: "Study the psychological phenomenon academically",
        effects: [
          { type: "resource", key: "knowledge", delta: 20 },
          { type: "resource", key: "energy", delta: -5 },
          { type: "skillXp", key: "informationWarfare", amount: 6 },
          { type: "flag", key: "psychology_researcher", value: true }
        ]
      }
    ]
  },

  rubiks_cube_mania: {
    id: "rubiks_cube_mania",
    name: "Rubik's Cube Mania",
    trigger: { type: "time", conditions: { week: 10 } },
    description:
      "Everyone on campus seems to carry the colorful cube, from jocks to professors, creating an unlikely common ground. The storylet focuses on a campus-wide competition announced by an enterprising student entrepreneur who's selling 'speedcubing' guides.",
    choices: [
      {
        id: "enter_competition",
        text: "Enter the campus-wide Rubik's Cube competition",
        effects: [
          { type: "resource", key: "energy", delta: -10 },
          { type: "resource", key: "social", delta: 15 },
          { type: "skillXp", key: "operationalSecurity", amount: 8 },
          { type: "flag", key: "cube_competitor", value: true }
        ]
      },
      {
        id: "teach_others",
        text: "Learn to solve it and teach others",
        effects: [
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "resource", key: "social", delta: 20 },
          { type: "skillXp", key: "allianceBuilding", amount: 7 },
          { type: "flag", key: "cube_teacher", value: true }
        ]
      },
      {
        id: "ignore_fad",
        text: "Ignore the fad and focus on other activities",
        effects: [
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "resource", key: "stress", delta: -5 },
          { type: "skillXp", key: "perseverance", amount: 3 },
          { type: "flag", key: "fad_resistant", value: true }
        ]
      }
    ]
  },

  new_wave_classic_rock: {
    id: "new_wave_classic_rock",
    name: "New Wave vs. Classic Rock Showdown",
    trigger: { type: "flag", conditions: { flags: ["mtv_fan", "started_radio_show"] } },
    description:
      "The campus radio station becomes a battleground between old-school rock fans and New Wave enthusiasts. When the station announces a format change to include more 'weird synthesizer music,' protests erupt outside the broadcast booth.",
    choices: [
      {
        id: "champion_new_wave",
        text: "Champion the New Wave format change",
        effects: [
          { type: "resource", key: "social", delta: 10 },
          { type: "resource", key: "stress", delta: 10 },
          { type: "skillXp", key: "informationWarfare", amount: 8 },
          { type: "flag", key: "new_wave_champion", value: true }
        ]
      },
      {
        id: "defend_classic_rock",
        text: "Defend the classic rock tradition",
        effects: [
          { type: "resource", key: "social", delta: 15 },
          { type: "resource", key: "knowledge", delta: 5 },
          { type: "skillXp", key: "allianceBuilding", amount: 6 },
          { type: "flag", key: "classic_rock_defender", value: true }
        ]
      },
      {
        id: "propose_compromise",
        text: "Propose a compromise programming schedule",
        effects: [
          { type: "resource", key: "social", delta: 20 },
          { type: "resource", key: "energy", delta: -10 },
          { type: "skillXp", key: "bureaucraticNavigation", amount: 10 },
          { type: "flag", key: "music_mediator", value: true }
        ]
      }
    ]
  },

  preppy_handbook_phenomenon: {
    id: "preppy_handbook_phenomenon",
    name: "The Preppy Handbook Phenomenon",
    trigger: { type: "time", conditions: { week: 14 } },
    description:
      "The unexpected bestseller 'The Official Preppy Handbook' (1980) has turned preppy fashion into a national trend. When copies start circulating on campus, it creates an identity crisis: are students adopting preppy style ironically, aspirationally, or rebelliously?",
    choices: [
      {
        id: "embrace_preppy_style",
        text: "Embrace the preppy style and buy the uniform",
        effects: [
          { type: "resource", key: "money", delta: -25 },
          { type: "resource", key: "social", delta: 15 },
          { type: "skillXp", key: "allianceBuilding", amount: 5 },
          { type: "flag", key: "preppy_identity", value: true }
        ]
      },
      {
        id: "reject_preppy_trend",
        text: "Reject the trend as manufactured consumerism",
        effects: [
          { type: "resource", key: "social", delta: -5 },
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "skillXp", key: "informationWarfare", amount: 6 },
          { type: "flag", key: "anti_consumerist", value: true }
        ]
      },
      {
        id: "study_phenomenon",
        text: "Study the phenomenon academically for sociology class",
        effects: [
          { type: "resource", key: "knowledge", delta: 20 },
          { type: "resource", key: "energy", delta: -10 },
          { type: "skillXp", key: "informationWarfare", amount: 8 },
          { type: "flag", key: "sociology_researcher", value: true }
        ]
      }
    ]
  },

  // STEP 5: Final 1980s Storylets (100% loaded) - 5 Final Storylets
  // Completing the Obsidian document integration

  walkman_revolution: {
    id: "walkman_revolution",
    name: "The Walkman Revolution",
    trigger: { type: "time", conditions: { week: 16 } },
    description:
      "Students are suddenly walking around campus with headphones, creating a new form of social isolation that worries professors and administrators. The player witnesses debates about whether this technology is liberating (allowing personal soundtrack to life) or antisocial (cutting off human interaction). A psychology professor assigns a paper on 'The Social Impact of Personal Audio Devices,' while the campus newspaper runs editorials both praising and condemning the trend.",
    choices: [
      {
        id: "buy_walkman",
        text: "Buy a Walkman and embrace personal music freedom",
        effects: [
          { type: "resource", key: "money", delta: -40 },
          { type: "resource", key: "stress", delta: -15 },
          { type: "resource", key: "social", delta: -5 },
          { type: "skillXp", key: "operationalSecurity", amount: 5 },
          { type: "flag", key: "walkman_owner", value: true }
        ]
      },
      {
        id: "oppose_walkman_trend",
        text: "Oppose the trend and maintain traditional social engagement",
        effects: [
          { type: "resource", key: "social", delta: 15 },
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "skillXp", key: "allianceBuilding", amount: 6 },
          { type: "flag", key: "walkman_critic", value: true }
        ]
      },
      {
        id: "study_social_impact",
        text: "Write the psychology paper on personal audio devices",
        effects: [
          { type: "resource", key: "knowledge", delta: 25 },
          { type: "resource", key: "energy", delta: -15 },
          { type: "skillXp", key: "informationWarfare", amount: 10 },
          { type: "flag", key: "technology_researcher", value: true }
        ]
      }
    ]
  },

  jane_fonda_workout_craze: {
    id: "jane_fonda_workout_craze",
    name: "The Jane Fonda Workout Craze",
    trigger: { type: "time", conditions: { week: 18 } },
    description:
      "Aerobics fever hits campus following Jane Fonda's workout videos. The rec center starts offering aerobics classes, and suddenly everyone is wearing leg warmers and leotards. You find yourself caught between friends who are obsessed with the fitness trend and others who mock it as vapid narcissism. A feminist studies professor uses it as an example of how women's liberation can be co-opted by consumer culture, while the athletics department celebrates increased student fitness participation.",
    choices: [
      {
        id: "join_aerobics_craze",
        text: "Join the aerobics classes and embrace the fitness trend",
        effects: [
          { type: "resource", key: "energy", delta: 10 },
          { type: "resource", key: "social", delta: 15 },
          { type: "resource", key: "stress", delta: -10 },
          { type: "skillXp", key: "allianceBuilding", amount: 6 },
          { type: "flag", key: "fitness_enthusiast", value: true }
        ]
      },
      {
        id: "critique_from_feminist_perspective",
        text: "Critique it from a feminist perspective in class",
        effects: [
          { type: "resource", key: "knowledge", delta: 20 },
          { type: "resource", key: "social", delta: -5 },
          { type: "skillXp", key: "informationWarfare", amount: 8 },
          { type: "flag", key: "feminist_critic", value: true }
        ]
      },
      {
        id: "ignore_fitness_trend",
        text: "Ignore the trend and focus on other activities",
        effects: [
          { type: "resource", key: "knowledge", delta: 10 },
          { type: "resource", key: "stress", delta: -5 },
          { type: "skillXp", key: "perseverance", amount: 4 },
          { type: "flag", key: "fitness_indifferent", value: true }
        ]
      }
    ]
  },

  valley_girl_invasion: {
    id: "valley_girl_invasion",
    name: "Valley Girl Invasion",
    trigger: { type: "time", conditions: { week: 22 } },
    description:
      "The 'Valley Girl' speech pattern (popularized by Frank Zappa's song and Moon Unit Zappa) spreads across campus like wildfire. Students ironically adopt phrases like 'totally,' 'gag me with a spoon,' and 'grody' while others cringe at what they see as the dumbing-down of discourse. The English department is horrified, linguistics professors are fascinated, and you must decide whether to embrace, mock, or study this linguistic phenomenon.",
    choices: [
      {
        id: "adopt_valley_speak",
        text: "Totally adopt Valley Girl speak, like, for sure!",
        effects: [
          { type: "resource", key: "social", delta: 15 },
          { type: "resource", key: "knowledge", delta: -10 },
          { type: "skillXp", key: "allianceBuilding", amount: 5 },
          { type: "flag", key: "valley_girl_speaker", value: true }
        ]
      },
      {
        id: "study_linguistics",
        text: "Study it academically for linguistics class",
        effects: [
          { type: "resource", key: "knowledge", delta: 25 },
          { type: "resource", key: "energy", delta: -10 },
          { type: "skillXp", key: "informationWarfare", amount: 9 },
          { type: "flag", key: "linguistics_researcher", value: true }
        ]
      },
      {
        id: "reject_valley_speak",
        text: "Reject it and maintain intellectual discourse",
        effects: [
          { type: "resource", key: "knowledge", delta: 15 },
          { type: "resource", key: "social", delta: -10 },
          { type: "skillXp", key: "perseverance", amount: 6 },
          { type: "flag", key: "intellectual_purist", value: true }
        ]
      }
    ]
  },

  personal_computer_invasion: {
    id: "personal_computer_invasion",
    name: "The Personal Computer Invasion",
    trigger: { type: "time", conditions: { week: 24 } },
    description:
      "The first personal computers appear on campus. The computer science building gets a few Apple IIe machines, creating intense competition for access time. Most students are baffled by these 'electronic brains,' while a few tech-savvy pioneers predict they'll change everything. You can join the long lines to try programming BASIC, dismiss computers as an expensive fad, or remain curious but intimidated. A computer science professor evangelizes about the coming 'personal computer revolution,' while traditionalists worry about job displacement.",
    choices: [
      {
        id: "learn_computers_early",
        text: "Wait in line and learn to use computers",
        effects: [
          { type: "resource", key: "energy", delta: -20 },
          { type: "resource", key: "knowledge", delta: 30 },
          { type: "skillXp", key: "operationalSecurity", amount: 12 },
          { type: "flag", key: "computer_literate", value: true }
        ]
      },
      {
        id: "dismiss_computer_fad",
        text: "Dismiss computers as an expensive fad",
        effects: [
          { type: "resource", key: "social", delta: 10 },
          { type: "resource", key: "stress", delta: -5 },
          { type: "skillXp", key: "perseverance", amount: 3 },
          { type: "flag", key: "computer_skeptic", value: true }
        ]
      },
      {
        id: "worry_about_automation",
        text: "Express concerns about job displacement and automation",
        effects: [
          { type: "resource", key: "knowledge", delta: 15 },
          { type: "resource", key: "stress", delta: 10 },
          { type: "skillXp", key: "informationWarfare", amount: 7 },
          { type: "flag", key: "automation_worried", value: true }
        ]
      }
    ]
  },

  cabbage_patch_kids_craze: {
    id: "cabbage_patch_kids_craze",
    name: "The Cabbage Patch Kids Craze",
    trigger: { type: "time", conditions: { week: 26 } },
    description:
      "The bizarre phenomenon of college students obsessing over Cabbage Patch Kids dolls hits campus. What started as ironic appreciation becomes genuine collecting mania, with students camping out at toy stores and paying inflated prices. Psychology majors analyze the 'mass hysteria,' economics students study artificial scarcity, and you must decide whether to join the madness, profit from it (scalping dolls), or observe with anthropological fascination. The event highlights consumer culture's power and the thin line between irony and sincerity.",
    choices: [
      {
        id: "join_collecting_mania",
        text: "Join the collecting mania and camp out for dolls",
        effects: [
          { type: "resource", key: "money", delta: -30 },
          { type: "resource", key: "energy", delta: -15 },
          { type: "resource", key: "stress", delta: -20 },
          { type: "skillXp", key: "perseverance", amount: 8 },
          { type: "flag", key: "cabbage_patch_collector", value: true }
        ]
      },
      {
        id: "scalp_dolls_profit",
        text: "Buy dolls cheap and resell them for profit",
        effects: [
          { type: "resource", key: "money", delta: 50 },
          { type: "resource", key: "social", delta: -15 },
          { type: "skillXp", key: "resourceAcquisition", amount: 10 },
          { type: "flag", key: "cabbage_patch_scalper", value: true }
        ]
      },
      {
        id: "study_mass_hysteria",
        text: "Study the phenomenon for psychology/economics class",
        effects: [
          { type: "resource", key: "knowledge", delta: 30 },
          { type: "resource", key: "energy", delta: -10 },
          { type: "skillXp", key: "informationWarfare", amount: 12 },
          { type: "flag", key: "consumer_culture_researcher", value: true }
        ]
      }
    ]
  }
};

// Export with logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🎭 Loaded', Object.keys(collegeStorylets).length, 'storylets - INTEGRATION COMPLETE!');
  console.log('🎯 Step 5 Complete: 100% loaded (Added 15 new storylets from Obsidian document)');
  console.log('🚀 All storylets from your 1980s college document are now integrated!');
  console.log('📚 Total storylets available:', Object.keys(collegeStorylets).length);
}