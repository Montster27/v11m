// /Users/montysharma/v11m2/src/data/arcs/restoreArcData.ts
// Restore story arc data from previous branch to V2 architecture
// Creates sample arcs with proper V2 integration

import { storyArcManager } from '../../utils/storyArcManager';

export interface SampleArcData {
  name: string;
  description: string;
  storylets: string[];
  clues: Array<{
    id: string;
    title: string;
    description: string;
    order: number;
    prerequisites?: string[];
    unlocks?: string[];
  }>;
  metadata?: {
    estimatedLength?: string;
    prerequisites?: string[];
    outcomes?: string[];
    crossArcInfluence?: string[];
  };
}

/**
 * Restore Emma Romance arc data
 */
export function restoreEmmaRomanceArc(): string {
  console.log('🌹 Restoring Emma Romance arc...');
  
  const emmaRomanceData: SampleArcData = {
    name: 'Emma Romance',
    description: 'A branching romance storyline exploring intellectual and emotional connections with Emma, a fellow college student.',
    storylets: [
      'emma-first-meeting',
      'emma-coffee-date',
      'emma-study-session',
      'emma-relationship-choice',
      'emma-romantic-success',
      'emma-friendship-success',
      'emma-academic-collaboration'
    ],
    clues: [
      {
        id: 'emma-likes-coffee',
        title: 'Emma\'s Coffee Preference',
        description: 'Emma always orders a cortado with oat milk',
        order: 1
      },
      {
        id: 'emma-favorite-book',
        title: 'Emma\'s Favorite Book',
        description: 'She mentions loving "Educated" by Tara Westover',
        order: 2,
        prerequisites: ['emma-likes-coffee']
      },
      {
        id: 'emma-background',
        title: 'Emma\'s Background',
        description: 'She\'s studying psychology with a focus on cognitive behavioral therapy',
        order: 3,
        prerequisites: ['emma-favorite-book']
      },
      {
        id: 'emma-family-situation',
        title: 'Emma\'s Family Situation',
        description: 'She mentions being the first in her family to attend college',
        order: 4,
        prerequisites: ['emma-background'],
        unlocks: ['emma-deeper-connection']
      },
      {
        id: 'emma-deeper-connection',
        title: 'Deeper Connection with Emma',
        description: 'You understand Emma\'s motivations and challenges better',
        order: 5,
        prerequisites: ['emma-family-situation']
      }
    ],
    metadata: {
      estimatedLength: '6-8 storylets',
      prerequisites: ['college_started'],
      outcomes: ['romantic_success', 'friendship_success', 'academic_success', 'terminal_failure'],
      crossArcInfluence: ['Political Awakening', 'Academic Journey']
    }
  };

  return createArcFromData(emmaRomanceData);
}

/**
 * Restore Political Awakening arc data
 */
export function restorePoliticalAwakeningArc(): string {
  console.log('🗳️ Restoring Political Awakening arc...');
  
  const politicalAwakeningData: SampleArcData = {
    name: 'Political Awakening',
    description: 'Explore political consciousness and social justice through campus activism and community engagement.',
    storylets: [
      'campus-protest-encounter',
      'political-discussion-group',
      'activism-choice',
      'community-organizing',
      'political-campaign-involvement',
      'activist-leadership-role'
    ],
    clues: [
      {
        id: 'campus-inequality-awareness',
        title: 'Campus Inequality Awareness',
        description: 'Notice disparities in campus resources and representation',
        order: 1
      },
      {
        id: 'local-political-issues',
        title: 'Local Political Issues',
        description: 'Learn about housing, education, and environmental concerns affecting the community',
        order: 2,
        prerequisites: ['campus-inequality-awareness']
      },
      {
        id: 'activist-network-connections',
        title: 'Activist Network Connections',
        description: 'Meet established activists and learn about ongoing campaigns',
        order: 3,
        prerequisites: ['local-political-issues']
      },
      {
        id: 'effective-organizing-strategies',
        title: 'Effective Organizing Strategies',
        description: 'Understand how to mobilize people and create meaningful change',
        order: 4,
        prerequisites: ['activist-network-connections'],
        unlocks: ['leadership-opportunities']
      },
      {
        id: 'leadership-opportunities',
        title: 'Leadership Opportunities',
        description: 'Opportunities to take on leadership roles in political movements',
        order: 5,
        prerequisites: ['effective-organizing-strategies']
      }
    ],
    metadata: {
      estimatedLength: '7-10 storylets',
      prerequisites: ['second_semester_started'],
      outcomes: ['activist_leader', 'informed_citizen', 'disillusioned', 'radical_path'],
      crossArcInfluence: ['Emma Romance', 'Academic Journey', 'Financial Struggles']
    }
  };

  return createArcFromData(politicalAwakeningData);
}

/**
 * Restore Academic Journey arc data
 */
export function restoreAcademicJourneyArc(): string {
  console.log('📚 Restoring Academic Journey arc...');
  
  const academicJourneyData: SampleArcData = {
    name: 'Academic Journey',
    description: 'Navigate the challenges and opportunities of higher education, from choosing a major to building relationships with professors.',
    storylets: [
      'major-declaration-pressure',
      'professor-office-hours',
      'research-opportunity',
      'academic-mentor-relationship',
      'thesis-project-choice',
      'graduate-school-decision'
    ],
    clues: [
      {
        id: 'academic-strengths-discovery',
        title: 'Academic Strengths Discovery',
        description: 'Identify subjects and skills where you excel naturally',
        order: 1
      },
      {
        id: 'professor-research-interests',
        title: 'Professor Research Interests',
        description: 'Learn about faculty research projects and potential mentorship opportunities',
        order: 2,
        prerequisites: ['academic-strengths-discovery']
      },
      {
        id: 'career-path-clarity',
        title: 'Career Path Clarity',
        description: 'Gain insight into potential career directions and required preparation',
        order: 3,
        prerequisites: ['professor-research-interests']
      },
      {
        id: 'research-methodology-skills',
        title: 'Research Methodology Skills',
        description: 'Develop competency in academic research methods and critical thinking',
        order: 4,
        prerequisites: ['career-path-clarity'],
        unlocks: ['advanced-academic-opportunities']
      },
      {
        id: 'advanced-academic-opportunities',
        title: 'Advanced Academic Opportunities',
        description: 'Access to honors programs, research positions, and graduate school recommendations',
        order: 5,
        prerequisites: ['research-methodology-skills']
      }
    ],
    metadata: {
      estimatedLength: '8-12 storylets',
      prerequisites: ['college_started'],
      outcomes: ['academic_excellence', 'graduate_school_bound', 'industry_focused', 'undecided_but_informed'],
      crossArcInfluence: ['Emma Romance', 'Political Awakening', 'Financial Struggles']
    }
  };

  return createArcFromData(academicJourneyData);
}

/**
 * Create an arc from structured data
 */
function createArcFromData(arcData: SampleArcData): string {
  try {
    // Create the arc
    const arcId = storyArcManager.createArc({
      name: arcData.name,
      description: arcData.description,
      progress: 0,
      isCompleted: false,
      failures: 0
    });

    // Initialize arc progress tracking
    storyArcManager.initializeArcProgress(arcId, arcData.storylets, arcData.clues.map(c => c.id));

    // Set up clue relationships
    const socialStore = (window as any).useSocialStore;
    if (socialStore) {
      arcData.clues.forEach(clue => {
        socialStore.getState().setClueArcRelationship(clue.id, {
          storyArc: arcId,
          arcOrder: clue.order,
          prerequisites: clue.prerequisites || [],
          unlocks: clue.unlocks || [],
          arcProgress: (clue.order / arcData.clues.length) * 100
        });
      });

      // Initialize arc discovery progress
      socialStore.getState().initializeArcProgress(arcId, arcData.clues.length);
    }

    console.log(`✅ Created arc: ${arcData.name} with ${arcData.clues.length} clues and ${arcData.storylets.length} storylets`);
    return arcId;

  } catch (error) {
    console.error(`❌ Failed to create arc: ${arcData.name}`, error);
    throw error;
  }
}

/**
 * Restore all sample arcs
 */
export function restoreAllSampleArcs(): string[] {
  console.log('🔄 Restoring all sample story arcs...');
  
  const createdArcs: string[] = [];
  
  try {
    createdArcs.push(restoreEmmaRomanceArc());
    createdArcs.push(restorePoliticalAwakeningArc());
    createdArcs.push(restoreAcademicJourneyArc());
    
    console.log(`✅ Successfully restored ${createdArcs.length} story arcs`);
    
    // Log arc relationships for verification
    createdArcs.forEach(arcId => {
      const arc = storyArcManager.getArc(arcId);
      const clues = storyArcManager.getArcClues(arcId);
      console.log(`📊 Arc: ${arc?.name} - ${clues.length} clues assigned`);
    });
    
  } catch (error) {
    console.error('❌ Failed to restore some arcs:', error);
  }
  
  return createdArcs;
}

/**
 * Create additional sample clues for testing
 */
export function createSampleClues(): void {
  console.log('🔍 Creating sample clues for testing...');
  
  const sampleClues = [
    {
      id: 'college-orientation-info',
      title: 'College Orientation Information',
      description: 'Key details about campus resources and academic expectations',
      content: 'The orientation packet contains important information about campus life, academic requirements, and support services available to students.',
      category: 'academic' as const,
      difficulty: 'easy' as const,
      minigameTypes: ['memory_cards'],
      associatedStorylets: ['college-orientation'],
      tags: 'orientation, campus, academic',
      rarity: 'common' as const
    },
    {
      id: 'library-study-spots',
      title: 'Best Library Study Spots',
      description: 'Locations in the library that are quiet and conducive to focused study',
      content: 'The third floor of the library has quiet study carrels near the windows. The basement level has group study rooms that can be reserved.',
      category: 'academic' as const,
      difficulty: 'easy' as const,
      minigameTypes: ['memory_cards', 'pattern_matching'],
      associatedStorylets: ['library-exploration'],
      tags: 'library, study, academic',
      rarity: 'common' as const
    },
    {
      id: 'professor-contact-hours',
      title: 'Professor Contact Information',
      description: 'Office hours and contact details for key professors',
      content: 'Dr. Smith holds office hours Tuesdays and Thursdays 2-4pm. Dr. Johnson prefers email communication and responds within 24 hours.',
      category: 'academic' as const,
      difficulty: 'medium' as const,
      minigameTypes: ['memory_cards'],
      associatedStorylets: ['professor-meeting'],
      tags: 'professors, office hours, contact',
      rarity: 'uncommon' as const
    }
  ];

  // Create clues using the clue store
  const clueStore = (window as any).useClueStore;
  if (clueStore) {
    sampleClues.forEach(clueData => {
      try {
        clueStore.getState().createClue(clueData);
        console.log(`✅ Created sample clue: ${clueData.title}`);
      } catch (error) {
        console.warn(`⚠️ Failed to create clue: ${clueData.title}`, error);
      }
    });
  }
}

/**
 * Verify arc data integrity after restoration
 */
export function verifyArcDataIntegrity(): { success: boolean; issues: string[] } {
  console.log('🔍 Verifying arc data integrity...');
  
  const issues: string[] = [];
  const allArcs = storyArcManager.getAllArcs();
  
  if (allArcs.length === 0) {
    issues.push('No arcs found - restoration may have failed');
    return { success: false, issues };
  }

  allArcs.forEach(arc => {
    // Check basic arc properties
    if (!arc.name || !arc.description) {
      issues.push(`Arc ${arc.id} missing name or description`);
    }

    // Check arc validation
    const validation = storyArcManager.validateArc(arc.id);
    if (!validation.isValid) {
      issues.push(`Arc ${arc.name} validation failed: ${validation.issues.join(', ')}`);
    }

    // Check clue relationships
    const arcClues = storyArcManager.getArcClues(arc.id);
    if (arcClues.length === 0) {
      issues.push(`Arc ${arc.name} has no associated clues`);
    }
  });

  const success = issues.length === 0;
  console.log(success ? 
    '✅ Arc data integrity verification passed' : 
    `⚠️ Arc data integrity issues found: ${issues.length}`
  );

  return { success, issues };
}

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).restoreAllSampleArcs = restoreAllSampleArcs;
  (window as any).verifyArcDataIntegrity = verifyArcDataIntegrity;
  (window as any).createSampleClues = createSampleClues;
}