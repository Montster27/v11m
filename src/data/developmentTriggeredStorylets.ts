// /Users/montysharma/V11M2/src/data/developmentTriggeredStorylets.ts
// Storylets that trigger based on character development stages

import type { Storylet } from '../types/storylet';

export const developmentTriggeredStorylets: Record<string, Storylet> = {
  emotional_mastery_opportunity: {
    id: 'emotional_mastery_opportunity',
    name: 'Teaching Emotional Intelligence',
    trigger: {
      type: 'flag',
      conditions: { flags: ['emotional_intelligence_stage_4'] } // Stage 4: Mastery
    },
    description: 'Your reputation for emotional maturity has spread around campus. The Resident Advisor asks if you\'d be willing to help facilitate a workshop on "Managing College Stress and Emotions" for incoming freshmen.',
    choices: [
      {
        id: 'lead_workshop',
        text: 'Agree to lead the workshop',
        effects: [
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 30 },
          { type: 'domainXp', domain: 'socialCompetence', amount: 25 },
          { type: 'domainXp', domain: 'lifePurpose', amount: 20 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 15 },
          { type: 'resource', key: 'social', delta: 25 },
          { type: 'flag', key: 'emotional_teacher', value: true }
        ]
      },
      {
        id: 'co_facilitate',
        text: 'Offer to co-facilitate with the RA',
        effects: [
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 20 },
          { type: 'domainXp', domain: 'socialCompetence', amount: 15 },
          { type: 'domainXp', domain: 'lifePurpose', amount: 10 },
          { type: 'resource', key: 'social', delta: 15 }
        ]
      },
      {
        id: 'suggest_alternative',
        text: 'Suggest connecting them with campus counseling instead',
        effects: [
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 10 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 10 },
          { type: 'resource', key: 'social', delta: 5 }
        ]
      }
    ]
  },

  intellectual_leadership: {
    id: 'intellectual_leadership',
    name: 'Research Opportunity',
    trigger: {
      type: 'flag',
      conditions: { flags: ['intellectual_competence_stage_4'] } // Stage 4: Expert
    },
    description: 'Professor Williams approaches you after your stellar performance on the midterm. "I\'m leading a research project on cognitive development in college students. Your analytical skills are exactly what we need. Would you be interested in joining as a research assistant?"',
    choices: [
      {
        id: 'accept_research_role',
        text: 'Accept the research assistant position',
        effects: [
          { type: 'domainXp', domain: 'intellectualCompetence', amount: 35 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 20 },
          { type: 'domainXp', domain: 'lifePurpose', amount: 25 },
          { type: 'resource', key: 'knowledge', delta: 30 },
          { type: 'resource', key: 'stress', delta: 10 },
          { type: 'flag', key: 'research_assistant', value: true }
        ]
      },
      {
        id: 'ask_for_details',
        text: 'Ask for more details about the time commitment',
        effects: [
          { type: 'domainXp', domain: 'intellectualCompetence', amount: 15 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 15 },
          { type: 'resource', key: 'knowledge', delta: 10 }
        ]
      },
      {
        id: 'decline_gracefully',
        text: 'Decline gracefully due to other commitments',
        effects: [
          { type: 'domainXp', domain: 'personalAutonomy', amount: 10 },
          { type: 'resource', key: 'energy', delta: 5 },
          { type: 'resource', key: 'social', delta: -3 }
        ]
      }
    ]
  },

  identity_breakthrough: {
    id: 'identity_breakthrough',
    name: 'The Identity Breakthrough',
    trigger: {
      type: 'flag',
      conditions: { flags: ['identity_clarity_stage_3'] } // Stage 3: Committing
    },
    description: 'After months of self-reflection and exploration, you feel a profound sense of clarity about who you are and what you value. This newfound self-understanding feels like a breakthrough moment in your personal development.',
    choices: [
      {
        id: 'share_with_mentor',
        text: 'Share this breakthrough with your mentor or advisor',
        effects: [
          { type: 'domainXp', domain: 'identityClarity', amount: 25 },
          { type: 'domainXp', domain: 'socialCompetence', amount: 15 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 15 },
          { type: 'resource', key: 'social', delta: 15 },
          { type: 'flag', key: 'shared_identity_insight', value: true }
        ]
      },
      {
        id: 'document_journey',
        text: 'Write extensively about your identity journey',
        effects: [
          { type: 'domainXp', domain: 'identityClarity', amount: 30 },
          { type: 'domainXp', domain: 'intellectualCompetence', amount: 10 },
          { type: 'domainXp', domain: 'lifePurpose', amount: 15 },
          { type: 'resource', key: 'knowledge', delta: 10 },
          { type: 'flag', key: 'documented_identity_journey', value: true }
        ]
      },
      {
        id: 'quietly_internalize',
        text: 'Quietly internalize this knowledge',
        effects: [
          { type: 'domainXp', domain: 'identityClarity', amount: 20 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 10 },
          { type: 'resource', key: 'stress', delta: -10 }
        ]
      }
    ]
  },

  purpose_calling: {
    id: 'purpose_calling',
    name: 'A Sense of Calling',
    trigger: {
      type: 'flag',
      conditions: { flags: ['life_purpose_stage_3'] } // Stage 3: Clarifying
    },
    description: 'You\'ve been feeling increasingly drawn to work that makes a meaningful difference in people\'s lives. When you see a flyer for a volunteer opportunity with a local literacy program, something inside you feels strongly called to respond.',
    choices: [
      {
        id: 'volunteer_immediately',
        text: 'Sign up to volunteer immediately',
        effects: [
          { type: 'domainXp', domain: 'lifePurpose', amount: 30 },
          { type: 'domainXp', domain: 'socialCompetence', amount: 20 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 15 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 10 },
          { type: 'resource', key: 'social', delta: 20 },
          { type: 'resource', key: 'stress', delta: -5 },
          { type: 'flag', key: 'follows_purpose_calling', value: true }
        ]
      },
      {
        id: 'research_opportunity',
        text: 'Research the organization first before committing',
        effects: [
          { type: 'domainXp', domain: 'lifePurpose', amount: 20 },
          { type: 'domainXp', domain: 'intellectualCompetence', amount: 15 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 15 },
          { type: 'resource', key: 'knowledge', delta: 10 }
        ]
      },
      {
        id: 'explore_alternatives',
        text: 'Use this insight to explore other purpose-driven opportunities',
        effects: [
          { type: 'domainXp', domain: 'lifePurpose', amount: 25 },
          { type: 'domainXp', domain: 'intellectualCompetence', amount: 10 },
          { type: 'resource', key: 'knowledge', delta: 15 }
        ]
      }
    ]
  },

  physical_confidence: {
    id: 'physical_confidence',
    name: 'Physical Achievement Recognition',
    trigger: {
      type: 'flag',
      conditions: { flags: ['physical_competence_stage_3'] } // Stage 3: Capable
    },
    description: 'Your consistent commitment to physical fitness has paid off. You feel stronger, more coordinated, and more confident in your body than ever before. The campus recreation center asks if you\'d be interested in becoming a peer fitness mentor.',
    choices: [
      {
        id: 'become_fitness_mentor',
        text: 'Accept the peer fitness mentor role',
        effects: [
          { type: 'domainXp', domain: 'physicalCompetence', amount: 25 },
          { type: 'domainXp', domain: 'socialCompetence', amount: 20 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 15 },
          { type: 'domainXp', domain: 'lifePurpose', amount: 10 },
          { type: 'resource', key: 'social', delta: 20 },
          { type: 'resource', key: 'energy', delta: 10 },
          { type: 'flag', key: 'fitness_mentor', value: true }
        ]
      },
      {
        id: 'focus_personal_goals',
        text: 'Continue focusing on personal fitness goals',
        effects: [
          { type: 'domainXp', domain: 'physicalCompetence', amount: 20 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 15 },
          { type: 'resource', key: 'energy', delta: 5 }
        ]
      },
      {
        id: 'explore_new_activities',
        text: 'Use this confidence to try new physical activities',
        effects: [
          { type: 'domainXp', domain: 'physicalCompetence', amount: 20 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 10 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 10 },
          { type: 'resource', key: 'energy', delta: 10 },
          { type: 'resource', key: 'social', delta: 10 }
        ]
      }
    ]
  },

  autonomy_independence: {
    id: 'autonomy_independence',
    name: 'The Independence Test',
    trigger: {
      type: 'flag',
      conditions: { flags: ['personal_autonomy_stage_3'] } // Stage 3: Interdependent
    },
    description: 'Your parents call with news that they\'re considering cutting back on your financial support to help you develop more independence. While initially stressful, you realize this could be an opportunity to prove your self-reliance.',
    choices: [
      {
        id: 'embrace_independence',
        text: 'Embrace the challenge and create a financial independence plan',
        effects: [
          { type: 'domainXp', domain: 'personalAutonomy', amount: 35 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 20 },
          { type: 'domainXp', domain: 'lifePurpose', amount: 15 },
          { type: 'resource', key: 'stress', delta: 15 },
          { type: 'resource', key: 'money', delta: -20 },
          { type: 'flag', key: 'financially_independent', value: true }
        ]
      },
      {
        id: 'negotiate_gradual_transition',
        text: 'Negotiate a gradual transition to independence',
        effects: [
          { type: 'domainXp', domain: 'personalAutonomy', amount: 25 },
          { type: 'domainXp', domain: 'socialCompetence', amount: 15 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 15 },
          { type: 'resource', key: 'stress', delta: 8 },
          { type: 'resource', key: 'money', delta: -10 }
        ]
      },
      {
        id: 'seek_financial_advice',
        text: 'Seek financial advice from campus resources',
        effects: [
          { type: 'domainXp', domain: 'personalAutonomy', amount: 20 },
          { type: 'domainXp', domain: 'intellectualCompetence', amount: 15 },
          { type: 'resource', key: 'knowledge', delta: 15 },
          { type: 'resource', key: 'stress', delta: 5 }
        ]
      }
    ]
  },

  social_leadership_opportunity: {
    id: 'social_leadership_opportunity',
    name: 'Building Community',
    trigger: {
      type: 'flag',
      conditions: { flags: ['social_competence_stage_4'] } // Stage 4: Interdependent
    },
    description: 'Your ability to build meaningful relationships and navigate social situations has become evident to everyone around you. The Dean of Students asks if you\'d be interested in helping design and implement a new peer mentoring program for the college.',
    choices: [
      {
        id: 'design_mentoring_program',
        text: 'Take the lead in designing the mentoring program',
        effects: [
          { type: 'domainXp', domain: 'socialCompetence', amount: 35 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 25 },
          { type: 'domainXp', domain: 'lifePurpose', amount: 30 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 20 },
          { type: 'resource', key: 'social', delta: 30 },
          { type: 'resource', key: 'stress', delta: 20 },
          { type: 'flag', key: 'program_designer', value: true }
        ]
      },
      {
        id: 'contribute_expertise',
        text: 'Contribute your expertise as part of a team',
        effects: [
          { type: 'domainXp', domain: 'socialCompetence', amount: 25 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 15 },
          { type: 'domainXp', domain: 'lifePurpose', amount: 20 },
          { type: 'resource', key: 'social', delta: 20 },
          { type: 'resource', key: 'stress', delta: 10 }
        ]
      },
      {
        id: 'recommend_others',
        text: 'Recommend other students who might be better suited',
        effects: [
          { type: 'domainXp', domain: 'socialCompetence', amount: 15 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 10 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 10 },
          { type: 'resource', key: 'social', delta: 10 }
        ]
      }
    ]
  }
};