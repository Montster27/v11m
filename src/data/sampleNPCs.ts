import type { NPC } from '../types/npc';

export const sarahChen: NPC = {
  id: "sarah_chen",
  name: "Sarah Chen",
  description: "A thoughtful English Literature major with a warm laugh and an interest in radio broadcasting.",
  
  personality: {
    traits: ["thoughtful", "artistic", "warm", "intelligent", "slightly_shy"],
    interests: ["literature", "radio_broadcasting", "victorian_novels", "indie_music", "creative_writing"],
    values: ["authenticity", "creativity", "intellectual_growth", "meaningful_connections"],
    speechStyle: "academic"
  },
  
  background: {
    major: "English Literature",
    year: "Junior",
    hometown: "San Francisco, CA",
    activities: ["Campus Radio WXRU", "Literary Magazine", "Victorian Literature Study Group"],
    family: "Second-generation Chinese-American, parents own a bookstore"
  },
  
  currentStatus: {
    mood: "neutral",
    currentActivity: "Preparing for midterm exams",
    availability: "available",
    healthStatus: "healthy"
  },
  
  relationshipLevel: 50,  // neutral starting point
  relationshipType: "stranger",
  
  memories: [],
  flags: {},
  
  locations: [
    {
      id: "dining_hall",
      name: "Hartwell Dining Hall",
      probability: 0.8,
      timeRanges: ["18:00-19:30"]  // 6:00-7:30 PM
    },
    {
      id: "radio_station",
      name: "WXRU Radio Station",
      probability: 0.9,
      timeRanges: ["20:00-22:00"]  // Thursday nights, 8-10 PM
    },
    {
      id: "library",
      name: "University Library",
      probability: 0.6,
      timeRanges: ["14:00-17:00", "19:30-22:00"]
    },
    {
      id: "english_building",
      name: "English Department",
      probability: 0.7,
      timeRanges: ["10:00-15:00"]  // Weekdays
    }
  ],
  
  schedule: {
    "monday": [
      { id: "english_building", name: "English Department", probability: 0.8, timeRanges: ["10:00-12:00"] },
      { id: "library", name: "University Library", probability: 0.6, timeRanges: ["14:00-17:00"] },
      { id: "dining_hall", name: "Hartwell Dining Hall", probability: 0.8, timeRanges: ["18:00-19:30"] }
    ],
    "tuesday": [
      { id: "english_building", name: "English Department", probability: 0.8, timeRanges: ["10:00-12:00"] },
      { id: "library", name: "University Library", probability: 0.6, timeRanges: ["14:00-17:00"] },
      { id: "dining_hall", name: "Hartwell Dining Hall", probability: 0.8, timeRanges: ["18:00-19:30"] }
    ],
    "wednesday": [
      { id: "english_building", name: "English Department", probability: 0.8, timeRanges: ["10:00-12:00"] },
      { id: "library", name: "University Library", probability: 0.6, timeRanges: ["14:00-17:00"] },
      { id: "dining_hall", name: "Hartwell Dining Hall", probability: 0.8, timeRanges: ["18:00-19:30"] }
    ],
    "thursday": [
      { id: "english_building", name: "English Department", probability: 0.8, timeRanges: ["10:00-12:00"] },
      { id: "dining_hall", name: "Hartwell Dining Hall", probability: 0.8, timeRanges: ["18:00-19:30"] },
      { id: "radio_station", name: "WXRU Radio Station", probability: 0.9, timeRanges: ["20:00-22:00"] }
    ],
    "friday": [
      { id: "english_building", name: "English Department", probability: 0.8, timeRanges: ["10:00-12:00"] },
      { id: "library", name: "University Library", probability: 0.6, timeRanges: ["14:00-17:00"] },
      { id: "dining_hall", name: "Hartwell Dining Hall", probability: 0.8, timeRanges: ["18:00-19:30"] }
    ]
  },
  
  associatedStorylets: [
    "dining_hall_encounter_1",
    "dining_hall_research_2", 
    "dining_hall_approach_3",
    "dining_hall_conversation_4",
    "radio_station_visit_1",
    "library_study_session_1"
  ],
  storyArc: "Campus Romance"
};

export const mikeTaylor: NPC = {
  id: "mike_taylor",
  name: "Mike Taylor",
  description: "Your energetic roommate who plays intramural basketball and studies business. Always ready with a joke or to grab food.",
  
  personality: {
    traits: ["outgoing", "energetic", "loyal", "competitive", "optimistic"],
    interests: ["basketball", "business", "video_games", "sports_podcasts", "social_events"],
    values: ["friendship", "teamwork", "success", "fun"],
    speechStyle: "casual"
  },
  
  background: {
    major: "Business Administration",
    year: "Sophomore",
    hometown: "Denver, CO",
    activities: ["Intramural Basketball", "Business Club", "Residence Hall Council"],
    family: "Middle child of three, parents are both teachers"
  },
  
  currentStatus: {
    mood: "happy",
    currentActivity: "Basketball practice",
    availability: "available",
    healthStatus: "healthy"
  },
  
  relationshipLevel: 65,  // friendly roommate level
  relationshipType: "friend",
  
  memories: [],
  flags: {},
  
  locations: [
    {
      id: "dorm_room",
      name: "Your Dorm Room",
      probability: 0.9,
      timeRanges: ["22:00-08:00", "12:00-14:00"]  // Sleep and lunch break
    },
    {
      id: "dining_hall",
      name: "Hartwell Dining Hall",
      probability: 0.7,
      timeRanges: ["17:30-19:00"]
    },
    {
      id: "gym",
      name: "Recreation Center",
      probability: 0.8,
      timeRanges: ["16:00-18:00", "20:00-21:30"]
    },
    {
      id: "business_building",
      name: "Business School",
      probability: 0.7,
      timeRanges: ["09:00-16:00"]
    }
  ],
  
  associatedStorylets: [
    "roommate_intro_1",
    "basketball_invite_1",
    "study_together_1",
    "dining_hall_buddy_1"
  ],
  storyArc: "College Friendship"
};

export const professorWilson: NPC = {
  id: "professor_wilson",
  name: "Professor Wilson",
  description: "Your Statistics professor who is known for challenging assignments but also for genuinely caring about student success.",
  
  personality: {
    traits: ["intellectual", "demanding", "fair", "patient", "insightful"],
    interests: ["statistics", "data_analysis", "research", "teaching", "coffee"],
    values: ["academic_excellence", "critical_thinking", "student_growth", "integrity"],
    speechStyle: "formal"
  },
  
  background: {
    major: "PhD in Statistics",
    year: "Professor",
    hometown: "Boston, MA",
    activities: ["Research", "Academic Publications", "Department Committees"],
    family: "Married with two teenage daughters"
  },
  
  currentStatus: {
    mood: "neutral",
    currentActivity: "Grading assignments",
    availability: "busy",
    healthStatus: "healthy"
  },
  
  relationshipLevel: 55,  // professional but neutral
  relationshipType: "acquaintance",
  
  memories: [],
  flags: {},
  
  locations: [
    {
      id: "statistics_classroom",
      name: "Statistics Classroom",
      probability: 1.0,
      timeRanges: ["10:00-11:30", "14:00-15:30"]  // Class times
    },
    {
      id: "professor_office",
      name: "Professor Wilson's Office",
      probability: 0.8,
      timeRanges: ["11:30-12:30", "15:30-17:00"]  // Office hours
    },
    {
      id: "faculty_lounge",
      name: "Faculty Lounge",
      probability: 0.6,
      timeRanges: ["12:30-13:30"]  // Lunch
    }
  ],
  
  associatedStorylets: [
    "statistics_struggle_1",
    "office_hours_1",
    "midterm_feedback_1",
    "research_opportunity_1"
  ],
  storyArc: "Academic Development"
};

// Export all sample NPCs
export const sampleNPCs: NPC[] = [
  sarahChen,
  mikeTaylor,
  professorWilson
];