// /Users/montysharma/V11M2/src/data/integratedStorylets.ts
// Example storylets that utilize the new integrated character system with domain XP

import type { Storylet } from '../types/storylet';

export const integratedStorylets: Record<string, Storylet> = {
  philosophy_debate: {
    id: 'philosophy_debate',
    name: 'The Great Philosophy Debate',
    trigger: {
      type: 'time',
      conditions: { day: 10 }
    },
    description: 'Professor Morrison has organized a campus-wide philosophy debate on "The Nature of Identity." Students from different majors are gathering in the main auditorium, and you notice the topic resonates deeply with your own journey of self-discovery.',
    choices: [
      {
        id: 'participate_actively',
        text: 'Participate actively in the debate',
        effects: [
          { type: 'domainXp', domain: 'intellectualCompetence', amount: 15 },
          { type: 'domainXp', domain: 'identityClarity', amount: 20 },
          { type: 'domainXp', domain: 'socialCompetence', amount: 10 },
          { type: 'resource', key: 'stress', delta: 5 },
          { type: 'resource', key: 'social', delta: 15 }
        ]
      },
      {
        id: 'listen_and_reflect',
        text: 'Listen carefully and reflect internally',
        effects: [
          { type: 'domainXp', domain: 'intellectualCompetence', amount: 10 },
          { type: 'domainXp', domain: 'identityClarity', amount: 25 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 15 },
          { type: 'resource', key: 'energy', delta: -5 }
        ]
      },
      {
        id: 'skip_debate',
        text: 'Skip the debate and focus on studies',
        effects: [
          { type: 'resource', key: 'knowledge', delta: 10 },
          { type: 'resource', key: 'social', delta: -5 }
        ]
      }
    ]
  },

  leadership_opportunity: {
    id: 'leadership_opportunity',
    name: 'Student Government Leadership',
    trigger: {
      type: 'flag',
      conditions: { flags: ['active_in_campus'] }
    },
    description: 'The Student Government is looking for a new committee chair to organize the upcoming Mental Health Awareness Week. This could be a great opportunity to develop leadership skills and make a real impact on campus wellbeing.',
    choices: [
      {
        id: 'accept_leadership',
        text: 'Accept the leadership role',
        effects: [
          { type: 'domainXp', domain: 'personalAutonomy', amount: 25 },
          { type: 'domainXp', domain: 'socialCompetence', amount: 20 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 15 },
          { type: 'domainXp', domain: 'lifePurpose', amount: 10 },
          { type: 'resource', key: 'stress', delta: 15 },
          { type: 'resource', key: 'social', delta: 20 },
          { type: 'flag', key: 'student_leader', value: true }
        ]
      },
      {
        id: 'support_role',
        text: 'Volunteer as a supporting member',
        effects: [
          { type: 'domainXp', domain: 'socialCompetence', amount: 15 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 10 },
          { type: 'domainXp', domain: 'lifePurpose', amount: 5 },
          { type: 'resource', key: 'social', delta: 10 },
          { type: 'resource', key: 'stress', delta: 5 }
        ]
      },
      {
        id: 'decline_politely',
        text: 'Decline politely due to other commitments',
        effects: [
          { type: 'domainXp', domain: 'personalAutonomy', amount: 5 },
          { type: 'resource', key: 'energy', delta: 5 },
          { type: 'resource', key: 'social', delta: -3 }
        ]
      }
    ]
  },

  identity_crisis: {
    id: 'identity_crisis',
    name: 'Quarter-Life Questioning',
    trigger: {
      type: 'resource',
      conditions: { stress: { min: 70 } }
    },
    description: 'Late at night in your dorm room, you find yourself staring at the ceiling, overwhelmed by questions: "Who am I really? What do I want from life? Am I on the right path?" The weight of uncertainty feels heavy on your chest.',
    choices: [
      {
        id: 'deep_self_reflection',
        text: 'Spend time in deep self-reflection and journaling',
        effects: [
          { type: 'domainXp', domain: 'identityClarity', amount: 30 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 20 },
          { type: 'domainXp', domain: 'lifePurpose', amount: 15 },
          { type: 'resource', key: 'stress', delta: -10 },
          { type: 'resource', key: 'energy', delta: -10 }
        ]
      },
      {
        id: 'seek_counseling',
        text: 'Schedule an appointment with campus counseling',
        effects: [
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 25 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 15 },
          { type: 'domainXp', domain: 'identityClarity', amount: 10 },
          { type: 'resource', key: 'stress', delta: -15 },
          { type: 'flag', key: 'seeks_help_when_needed', value: true }
        ]
      },
      {
        id: 'talk_to_friends',
        text: 'Open up to close friends about your struggles',
        effects: [
          { type: 'domainXp', domain: 'socialCompetence', amount: 20 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 15 },
          { type: 'domainXp', domain: 'identityClarity', amount: 10 },
          { type: 'resource', key: 'stress', delta: -8 },
          { type: 'resource', key: 'social', delta: 15 }
        ]
      },
      {
        id: 'distract_with_work',
        text: 'Bury yourself in schoolwork to avoid thinking about it',
        effects: [
          { type: 'resource', key: 'knowledge', delta: 15 },
          { type: 'resource', key: 'stress', delta: 5 },
          { type: 'domainXp', domain: 'identityClarity', amount: -5 } // negative development
        ]
      }
    ]
  },

  mentor_relationship: {
    id: 'mentor_relationship',
    name: 'Finding a Mentor',
    trigger: {
      type: 'time',
      conditions: { day: 21 }
    },
    description: 'Professor Chen, whom you\'ve admired from afar, approaches you after class. "I\'ve noticed your thoughtful questions and engagement. Would you be interested in meeting regularly to discuss your academic and personal development?" This could be the mentorship you\'ve been hoping for.',
    choices: [
      {
        id: 'accept_mentorship',
        text: 'Eagerly accept the mentorship opportunity',
        effects: [
          { type: 'domainXp', domain: 'intellectualCompetence', amount: 20 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 15 },
          { type: 'domainXp', domain: 'lifePurpose', amount: 25 },
          { type: 'domainXp', domain: 'identityClarity', amount: 15 },
          { type: 'resource', key: 'social', delta: 10 },
          { type: 'flag', key: 'has_mentor', value: true }
        ]
      },
      {
        id: 'accept_hesitantly',
        text: 'Accept but express concerns about time commitment',
        effects: [
          { type: 'domainXp', domain: 'intellectualCompetence', amount: 15 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 10 },
          { type: 'domainXp', domain: 'lifePurpose', amount: 15 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 10 },
          { type: 'flag', key: 'has_mentor', value: true }
        ]
      },
      {
        id: 'decline_respectfully',
        text: 'Decline respectfully, feeling you need to figure things out alone',
        effects: [
          { type: 'domainXp', domain: 'personalAutonomy', amount: 20 },
          { type: 'domainXp', domain: 'identityClarity', amount: 5 },
          { type: 'resource', key: 'social', delta: -5 }
        ]
      }
    ]
  },

  physical_challenge: {
    id: 'physical_challenge',
    name: 'Campus Fitness Challenge',
    trigger: {
      type: 'time',
      conditions: { day: 14 }
    },
    description: 'The Campus Recreation Center is hosting a month-long fitness challenge with teams competing in various physical activities. Your roommate suggests you both sign up together. "It could be fun, and we both need to get more active!"',
    choices: [
      {
        id: 'join_enthusiastically',
        text: 'Sign up enthusiastically and commit fully',
        effects: [
          { type: 'domainXp', domain: 'physicalCompetence', amount: 30 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 15 },
          { type: 'domainXp', domain: 'socialCompetence', amount: 10 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 10 },
          { type: 'resource', key: 'energy', delta: 10 },
          { type: 'resource', key: 'stress', delta: -5 },
          { type: 'resource', key: 'social', delta: 15 }
        ]
      },
      {
        id: 'join_casually',
        text: 'Sign up but plan to participate casually',
        effects: [
          { type: 'domainXp', domain: 'physicalCompetence', amount: 15 },
          { type: 'domainXp', domain: 'socialCompetence', amount: 10 },
          { type: 'resource', key: 'energy', delta: 5 },
          { type: 'resource', key: 'social', delta: 10 }
        ]
      },
      {
        id: 'support_from_sidelines',
        text: 'Support your roommate but don\'t participate yourself',
        effects: [
          { type: 'domainXp', domain: 'socialCompetence', amount: 5 },
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 5 },
          { type: 'resource', key: 'social', delta: 5 },
          { type: 'resource', key: 'energy', delta: 5 }
        ]
      }
    ]
  },

  ethical_dilemma: {
    id: 'ethical_dilemma',
    name: 'The Cheating Dilemma',
    trigger: {
      type: 'time',
      conditions: { day: 28 }
    },
    description: 'During a crucial exam, you notice your classmate Sarah, who\'s struggling academically, clearly cheating from hidden notes. She\'s a single mother working two jobs to afford college. You know she could be expelled if caught, but academic integrity is important to you.',
    choices: [
      {
        id: 'report_immediately',
        text: 'Report the cheating to the professor immediately',
        effects: [
          { type: 'domainXp', domain: 'lifePurpose', amount: 20 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 15 },
          { type: 'domainXp', domain: 'identityClarity', amount: 10 },
          { type: 'resource', key: 'stress', delta: 15 },
          { type: 'resource', key: 'social', delta: -10 },
          { type: 'flag', key: 'values_integrity_over_loyalty', value: true }
        ]
      },
      {
        id: 'talk_to_sarah',
        text: 'Approach Sarah privately after the exam',
        effects: [
          { type: 'domainXp', domain: 'emotionalIntelligence', amount: 25 },
          { type: 'domainXp', domain: 'socialCompetence', amount: 20 },
          { type: 'domainXp', domain: 'lifePurpose', amount: 15 },
          { type: 'domainXp', domain: 'personalAutonomy', amount: 10 },
          { type: 'resource', key: 'stress', delta: 10 },
          { type: 'flag', key: 'compassionate_approach', value: true }
        ]
      },
      {
        id: 'stay_silent',
        text: 'Stay silent and focus on your own exam',
        effects: [
          { type: 'domainXp', domain: 'personalAutonomy', amount: 5 },
          { type: 'resource', key: 'stress', delta: 8 },
          { type: 'domainXp', domain: 'lifePurpose', amount: -5 }, // negative development for avoiding moral responsibility
          { type: 'flag', key: 'avoided_difficult_choice', value: true }
        ]
      }
    ]
  }
};