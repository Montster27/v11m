// Test utility for character concerns and storylet flag integration
import { useStoryletStore } from '../store/useStoryletStore';
import { useCharacterConcernsStore } from '../store/useCharacterConcernsStore';

export const createTestConcernStorylets = () => {
  const storyletStore = useStoryletStore.getState();
  
  const testStorylets = [
    // Academic concern storylet
    {
      id: 'test_academic_concern_high',
      name: 'Academic Pressure Mounting',
      description: 'The upcoming midterms are weighing heavily on your mind. Your high academic concerns are making every assignment feel crucial.',
      trigger: {
        type: 'flag' as const,
        conditions: { flags: ['concern_academics_high'] }
      },
      choices: [
        {
          id: 'intensive_study',
          text: 'Create an intensive study schedule',
          effects: [
            { type: 'resource' as const, key: 'stress' as const, delta: 5 },
            { type: 'resource' as const, key: 'knowledge' as const, delta: 15 },
            { type: 'flag' as const, key: 'academic_preparation_intense', value: true }
          ]
        },
        {
          id: 'study_group',
          text: 'Form a study group with classmates',
          effects: [
            { type: 'resource' as const, key: 'social' as const, delta: 8 },
            { type: 'resource' as const, key: 'knowledge' as const, delta: 10 },
            { type: 'flag' as const, key: 'academic_collaboration', value: true }
          ]
        }
      ],
      storyArc: 'Academic Journey',
      deploymentStatus: 'dev' as const
    },

    // Financial concern storylet
    {
      id: 'test_financial_concern_moderate',
      name: 'Money Worries',
      description: 'Your financial concerns are starting to affect your daily decisions. Every purchase feels like it needs careful consideration.',
      trigger: {
        type: 'flag' as const,
        conditions: { flags: ['concern_financial_moderate', 'concern_financial_high'] }
      },
      choices: [
        {
          id: 'part_time_job',
          text: 'Look for a part-time job on campus',
          effects: [
            { type: 'resource' as const, key: 'money' as const, delta: 50 },
            { type: 'resource' as const, key: 'stress' as const, delta: 8 },
            { type: 'flag' as const, key: 'working_student', value: true }
          ]
        },
        {
          id: 'budget_carefully',
          text: 'Create a strict budget and stick to it',
          effects: [
            { type: 'resource' as const, key: 'stress' as const, delta: 3 },
            { type: 'flag' as const, key: 'financial_discipline', value: true }
          ]
        },
        {
          id: 'call_parents',
          text: 'Call home and discuss financial situation',
          effects: [
            { type: 'resource' as const, key: 'stress' as const, delta: -5 },
            { type: 'flag' as const, key: 'family_financial_discussion', value: true }
          ]
        }
      ],
      storyArc: 'Financial Independence',
      deploymentStatus: 'dev' as const
    },

    // Social concerns storylet
    {
      id: 'test_social_isolation_concern',
      name: 'Feeling Disconnected',
      description: 'Your concerns about social fitting in and isolation are creating a difficult cycle. You want to connect but feel overwhelmed by social situations.',
      trigger: {
        type: 'flag' as const,
        conditions: { flags: ['socially_concerned', 'social_and_isolated'] }
      },
      choices: [
        {
          id: 'join_club',
          text: 'Force yourself to join a campus organization',
          effects: [
            { type: 'resource' as const, key: 'stress' as const, delta: 10 },
            { type: 'resource' as const, key: 'social' as const, delta: 15 },
            { type: 'flag' as const, key: 'social_courage_shown', value: true }
          ]
        },
        {
          id: 'small_steps',
          text: 'Start with small social interactions',
          effects: [
            { type: 'resource' as const, key: 'stress' as const, delta: 2 },
            { type: 'resource' as const, key: 'social' as const, delta: 5 },
            { type: 'flag' as const, key: 'gradual_social_growth', value: true }
          ]
        },
        {
          id: 'counseling',
          text: 'Visit the campus counseling center',
          effects: [
            { type: 'resource' as const, key: 'stress' as const, delta: -8 },
            { type: 'flag' as const, key: 'seeking_professional_help', value: true }
          ]
        }
      ],
      storyArc: 'Social Development',
      deploymentStatus: 'dev' as const
    },

    // Cultural issues storylet (1980s context)
    {
      id: 'test_cultural_issues_aware',
      name: 'Navigating Social Change',
      description: 'The 1980s bring complex social dynamics around gender, race, and class. Your awareness of these issues shapes how you see campus life.',
      trigger: {
        type: 'flag' as const,
        conditions: { flags: ['culturally_aware', 'cultural_issues_focused'] }
      },
      choices: [
        {
          id: 'activism',
          text: 'Get involved in campus activism and social justice groups',
          effects: [
            { type: 'resource' as const, key: 'social' as const, delta: 12 },
            { type: 'resource' as const, key: 'stress' as const, delta: 5 },
            { type: 'flag' as const, key: 'social_activist', value: true }
          ]
        },
        {
          id: 'awareness',
          text: 'Focus on learning and understanding different perspectives',
          effects: [
            { type: 'resource' as const, key: 'knowledge' as const, delta: 8 },
            { type: 'flag' as const, key: 'cultural_understanding', value: true }
          ]
        },
        {
          id: 'support_others',
          text: 'Quietly support friends facing discrimination',
          effects: [
            { type: 'resource' as const, key: 'social' as const, delta: 6 },
            { type: 'flag' as const, key: 'supportive_ally', value: true }
          ]
        }
      ],
      storyArc: 'Cultural Awareness',
      deploymentStatus: 'dev' as const
    },

    // Balanced concerns storylet
    {
      id: 'test_well_balanced_character',
      name: 'Steady as She Goes',
      description: 'Your balanced approach to college concerns has you feeling relatively stable, though new challenges always arise.',
      trigger: {
        type: 'flag' as const,
        conditions: { flags: ['well_balanced'] }
      },
      choices: [
        {
          id: 'help_others',
          text: 'Use your stability to help struggling friends',
          effects: [
            { type: 'resource' as const, key: 'social' as const, delta: 10 },
            { type: 'flag' as const, key: 'supportive_friend', value: true }
          ]
        },
        {
          id: 'explore_new',
          text: 'Try something completely new and challenging',
          effects: [
            { type: 'resource' as const, key: 'stress' as const, delta: 3 },
            { type: 'resource' as const, key: 'knowledge' as const, delta: 8 },
            { type: 'flag' as const, key: 'adventure_seeker', value: true }
          ]
        }
      ],
      storyArc: 'Personal Growth',
      deploymentStatus: 'dev' as const
    }
  ];

  // Add all test storylets to the system
  testStorylets.forEach(storylet => {
    storyletStore.addStorylet(storylet);
  });

  console.log('✅ Created test concern-based storylets!');
  console.log('📋 Storylets:', testStorylets.map(s => ({ id: s.id, trigger: s.trigger.conditions.flags })));
  
  return testStorylets;
};

export const testConcernFlagGeneration = () => {
  const concernsStore = useCharacterConcernsStore.getState();
  
  if (!concernsStore.concerns) {
    console.log('❌ No character concerns set. Create a character first.');
    return;
  }
  
  console.log('📊 Current Character Concerns:', concernsStore.concerns);
  
  const flags = concernsStore.generateConcernFlags();
  console.log('🏷️ Generated Concern Flags:', flags);
  
  const profile = concernsStore.getConcernsProfile();
  console.log('👤 Character Profile:', profile);
  
  const topConcerns = concernsStore.getTopConcerns();
  console.log('🔝 Top Concerns:', topConcerns);
  
  return { flags, profile, topConcerns };
};

// Make globally available for console testing
if (typeof window !== 'undefined') {
  (window as any).createTestConcernStorylets = createTestConcernStorylets;
  (window as any).testConcernFlagGeneration = testConcernFlagGeneration;
  console.log('🧪 Concern flag test functions available:');
  console.log('• createTestConcernStorylets() - Creates storylets triggered by concern flags');
  console.log('• testConcernFlagGeneration() - Shows current concern flags and profile');
}