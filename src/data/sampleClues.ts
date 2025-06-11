import { ClueFormData } from '../types/clue';

export const sampleClues: ClueFormData[] = [
  // Test clue for storylet integration
  {
    id: "first_discovery_clue",
    title: "Library Discovery",
    description: "Your first clue discovered on campus",
    content: "Hidden behind some old books, you found a note that seems to be part of something larger. The handwriting is recent, and it mentions meeting places around campus.",
    category: "mystery",
    difficulty: "easy",
    storyArc: "Starting",
    arcOrder: 1,
    minigameTypes: [],
    associatedStorylets: ["first_step_discovery"],
    tags: ["campus", "library", "first"],
    rarity: "common"
  },
  
  // Memory Card Game Clues
  {
    title: "Hidden Pattern in the Dorm",
    description: "A strange pattern found under your roommate's bed",
    content: "You notice that the memory cards seem to match locations around campus. Your roommate has been collecting them systematically.",
    category: "mystery",
    difficulty: "easy",
    storyArc: "campus-mystery",
    arcOrder: 1,
    minigameTypes: ["memory-cards"],
    associatedStorylets: ["dorm-room-mystery", "roommate-investigation"],
    tags: ["campus", "dorm", "pattern"],
    rarity: "common"
  },
  {
    title: "Memory Palace Discovery",
    description: "Understanding how memory techniques work",
    content: "Playing memory games has improved your ability to remember course material. You've discovered the ancient technique of memory palaces.",
    category: "academic",
    difficulty: "medium",
    storyArc: "study-techniques",
    arcOrder: 1,
    minigameTypes: ["memory-cards"],
    associatedStorylets: ["study-session", "academic-breakthrough"],
    tags: ["memory", "study", "technique"],
    rarity: "uncommon"
  },

  // Word Scramble Clues
  {
    title: "Anagram Message",
    description: "Words that spell something else when rearranged",
    content: "The scrambled words weren't random - they form a hidden message when the first letters are arranged correctly: 'MEET AT LIBRARY'",
    category: "social",
    difficulty: "medium",
    storyArc: "secret-society",
    arcOrder: 2,
    minigameTypes: ["word-scramble"],
    associatedStorylets: ["library-encounter", "mysterious-note"],
    tags: ["anagram", "message", "secret"],
    rarity: "rare"
  },
  {
    title: "Linguistic Pattern",
    description: "A discovery about language and communication",
    content: "Your word puzzle skills reveal that the campus graffiti follows a specific linguistic pattern, suggesting it's not random vandalism but coded messages.",
    category: "mystery",
    difficulty: "hard",
    storyArc: "campus-mystery",
    arcOrder: 3,
    minigameTypes: ["word-scramble"],
    associatedStorylets: ["graffiti-investigation", "code-breaking"],
    tags: ["language", "code", "graffiti"],
    rarity: "rare"
  },

  // Color Match Game Clues
  {
    title: "Synesthetic Connection",
    description: "Colors trigger unexpected memories and associations",
    content: "During the color matching game, you experience synesthesia-like effects. Colors begin to have sounds, numbers have colors, and you realize your perception is unique.",
    category: "personal",
    difficulty: "hard",
    storyArc: "self-discovery",
    arcOrder: 2,
    minigameTypes: ["color-match"],
    associatedStorylets: ["psychology-class", "perception-experiment"],
    tags: ["synesthesia", "perception", "unique"],
    rarity: "legendary"
  },
  {
    title: "Art Therapy Insight",
    description: "Colors reveal emotional patterns",
    content: "Your color choices in the game reveal unconscious emotional patterns. This insight could be valuable for understanding your stress responses.",
    category: "personal",
    difficulty: "medium",
    storyArc: "mental-health",
    arcOrder: 1,
    minigameTypes: ["color-match"],
    associatedStorylets: ["counseling-session", "stress-management"],
    tags: ["emotions", "therapy", "stress"],
    rarity: "uncommon"
  },

  // Pattern Sequence Clues  
  {
    title: "Fibonacci in Nature",
    description: "Mathematical patterns in the natural world",
    content: "The pattern sequences remind you of Fibonacci spirals. You start noticing these mathematical patterns everywhere on campus - in plant growth, architecture, even social dynamics.",
    category: "academic",
    difficulty: "medium",
    storyArc: "mathematical-discovery",
    arcOrder: 1,
    minigameTypes: ["pattern-sequence"],
    associatedStorylets: ["math-class", "nature-walk"],
    tags: ["fibonacci", "nature", "mathematics"],
    rarity: "uncommon"
  },

  // Stroop Test Clues
  {
    title: "Cognitive Interference",
    description: "Understanding how the mind processes conflicting information",
    content: "The Stroop test reveals how your brain processes conflicting information. This insight helps you recognize when you're being manipulated by misleading presentations.",
    category: "personal",
    difficulty: "hard",
    storyArc: "critical-thinking",
    arcOrder: 2,
    minigameTypes: ["stroop-test"],
    associatedStorylets: ["media-literacy", "critical-thinking-class"],
    tags: ["cognition", "manipulation", "awareness"],
    rarity: "rare"
  },

  // General Academic Clues
  {
    title: "Study Group Secret",
    description: "Your study group has been meeting in a restricted area",
    content: "You discover that your study group has been using an 'abandoned' classroom that's actually reserved for graduate research. Someone has been giving you access.",
    category: "academic",
    difficulty: "easy",
    storyArc: "academic-conspiracy",
    arcOrder: 1,
    minigameTypes: ["memory-cards", "word-scramble"],
    associatedStorylets: ["study-group", "restricted-access"],
    tags: ["study", "secret", "access"],
    rarity: "common"
  },

  // Campus Social Clues
  {
    title: "Social Network Analysis",
    description: "Patterns in campus social connections",
    content: "Your gaming skills help you map social connections on campus. You realize there's an invisible network of students who all share certain characteristics and meet regularly.",
    category: "social",
    difficulty: "medium",
    storyArc: "secret-society",
    arcOrder: 1,
    minigameTypes: ["pattern-sequence", "logic-puzzle"],
    associatedStorylets: ["social-gathering", "network-discovery"],
    tags: ["social", "network", "connections"],
    rarity: "uncommon"
  },

  // Achievement Clues
  {
    title: "Gaming Mastery",
    description: "Your reflexes and pattern recognition have significantly improved",
    content: "Your consistent success in various mental games has attracted attention from the Psychology Department. They want to study your cognitive improvement patterns.",
    category: "achievement",
    difficulty: "easy",
    storyArc: "recognition",
    arcOrder: 1,
    minigameTypes: ["memory-cards", "word-scramble", "color-match", "pattern-sequence", "stroop-test"],
    associatedStorylets: ["psychology-study", "cognitive-research"],
    tags: ["achievement", "recognition", "research"],
    rarity: "common"
  }
];

// Story arcs for the sample clues
export const sampleStoryArcs = [
  {
    name: "Campus Mystery",
    description: "Strange patterns and hidden messages around campus suggest something bigger is happening",
    category: "mystery"
  },
  {
    name: "Secret Society",
    description: "Evidence points to an underground organization of students with their own agenda",
    category: "social"
  },
  {
    name: "Self Discovery", 
    description: "Personal insights and unique abilities that set you apart from your peers",
    category: "personal"
  },
  {
    name: "Academic Conspiracy",
    description: "The academic system isn't quite what it appears to be on the surface",
    category: "academic"
  },
  {
    name: "Study Techniques",
    description: "Advanced learning methods that give you an academic edge",
    category: "academic"
  },
  {
    name: "Mental Health",
    description: "Understanding your psychological patterns and emotional wellbeing",
    category: "personal"
  },
  {
    name: "Mathematical Discovery",
    description: "Seeing mathematical patterns in unexpected places",
    category: "academic"
  },
  {
    name: "Critical Thinking",
    description: "Developing skills to see through deception and manipulation",
    category: "personal"
  },
  {
    name: "Recognition",
    description: "Your abilities are being noticed by others",
    category: "achievement"
  }
];