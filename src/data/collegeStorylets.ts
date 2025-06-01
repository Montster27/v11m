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
  }
};