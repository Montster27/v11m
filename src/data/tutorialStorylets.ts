// /Users/montysharma/V11M2/src/data/tutorialStorylets.ts
// Tutorial storylet system to replace missing starting content

import type { Storylet } from '../types/storylet';

export const tutorialStorylets: Record<string, Storylet> = {
  welcome_to_college: {
    id: 'welcome_to_college',
    title: 'Welcome to College Life',
    description: 'Your university journey begins. The campus stretches out before you, full of possibilities and challenges.',
    content: `
      You stand at the entrance to your new university, backpack slung over your shoulder, 
      looking at the bustling campus life around you. Students walk past in groups, 
      some looking confident, others nervous like yourself.
      
      This is it - the beginning of your college experience. How do you want to start?
    `,
    triggers: [
      { type: 'flag', flag: 'character_created', value: true }
    ],
    choices: [
      {
        id: 'explore_campus',
        text: 'Explore the campus and get oriented',
        description: 'Take time to familiarize yourself with the layout and facilities',
        effects: [
          { type: 'flag', flag: 'campus_explored', value: true },
          { type: 'experience', amount: 10 },
          { type: 'concern', concern: 'academic', change: 0.1 }
        ]
      },
      {
        id: 'find_people',
        text: 'Look for other students to meet',
        description: 'Social connections are important in college life',
        effects: [
          { type: 'flag', flag: 'social_exploration', value: true },
          { type: 'experience', amount: 10 },
          { type: 'concern', concern: 'social', change: 0.1 }
        ]
      },
      {
        id: 'find_dorm',
        text: 'Head straight to your dorm to settle in',
        description: 'Get organized and create a comfortable living space',
        effects: [
          { type: 'flag', flag: 'dorm_visited', value: true },
          { type: 'experience', amount: 5 },
          { type: 'concern', concern: 'family', change: 0.05 }
        ]
      }
    ],
    deployment: 'live',
    priority: 1000, // High priority to ensure it appears first
    cooldown: 0,
    storyArc: 'tutorial',
    tags: ['tutorial', 'starting', 'introduction']
  },
  
  campus_exploration: {
    id: 'campus_exploration',
    title: 'Exploring Your New Campus',
    description: 'You decide to explore the campus and learn about the facilities available to you.',
    content: `
      Walking around campus, you discover the library, student center, various academic buildings, 
      and recreational facilities. Each location offers different opportunities for growth and learning.
      
      Where would you like to focus your exploration?
    `,
    triggers: [
      { type: 'flag', flag: 'campus_explored', value: true }
    ],
    choices: [
      {
        id: 'visit_library',
        text: 'Visit the library and study areas',
        description: 'Academic resources and quiet study spaces',
        effects: [
          { type: 'flag', flag: 'library_discovered', value: true },
          { type: 'experience', amount: 15 },
          { type: 'skill', skill: 'academics', change: 5 }
        ]
      },
      {
        id: 'visit_rec_center',
        text: 'Check out the recreational center',
        description: 'Physical fitness and sports facilities',
        effects: [
          { type: 'flag', flag: 'rec_center_discovered', value: true },
          { type: 'experience', amount: 10 },
          { type: 'skill', skill: 'athletics', change: 5 }
        ]
      },
      {
        id: 'visit_student_center',
        text: 'Explore the student center',
        description: 'Social spaces and student organizations',
        effects: [
          { type: 'flag', flag: 'student_center_discovered', value: true },
          { type: 'experience', amount: 12 },
          { type: 'skill', skill: 'socializing', change: 5 }
        ]
      }
    ],
    deployment: 'live',
    priority: 900,
    cooldown: 0,
    storyArc: 'tutorial'
  }
};

// Development logging
if (process.env.NODE_ENV === 'development') {
  console.log('🎓 Loaded', Object.keys(tutorialStorylets).length, 'tutorial storylets');
}