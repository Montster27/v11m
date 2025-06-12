// MMV Skill System 2.0: Complete Data Definitions
// Foundation experiences, competencies, classes, and configurations

import { 
  FoundationExperience, 
  CoreCompetencySkill, 
  CharacterClassSpec, 
  SynergyEffect,
  WorldCondition,
  InfiltrationTeam,
  ClassAbility,
  FoundationExperienceId,
  FoundationCategory,
  CoreCompetency,
  CharacterClass,
  TradeSpecialization,
  CompetencySkill
} from '../types/skillSystemV2';

// Foundation System Data
export const FOUNDATION_EXPERIENCES: { [key in FoundationExperienceId]: FoundationExperience } = {
  // Academic Track
  'stem': {
    id: 'stem',
    name: 'STEM Focus',
    description: 'Science, Technology, Engineering, and Mathematics education',
    category: 'academic',
    level: 0,
    experience: 0,
    unlocked: true,
    contributes: [
      { competency: 'operational-security', multiplier: 1.5 },
      { competency: 'resource-acquisition', multiplier: 1.2 }
    ]
  },
  'liberal-arts': {
    id: 'liberal-arts',
    name: 'Liberal Arts',
    description: 'Literature, philosophy, history, and critical thinking',
    category: 'academic',
    level: 0,
    experience: 0,
    unlocked: true,
    contributes: [
      { competency: 'information-warfare', multiplier: 1.5 },
      { competency: 'alliance-building', multiplier: 1.2 }
    ]
  },
  'business': {
    id: 'business',
    name: 'Business Studies',
    description: 'Business administration, economics, and management',
    category: 'academic',
    level: 0,
    experience: 0,
    unlocked: true,
    contributes: [
      { competency: 'resource-acquisition', multiplier: 1.5 },
      { competency: 'bureaucratic-navigation', multiplier: 1.3 }
    ]
  },
  'pre-med': {
    id: 'pre-med',
    name: 'Pre-Medical',
    description: 'Medical preparation with science focus',
    category: 'academic',
    level: 0,
    experience: 0,
    unlocked: true,
    contributes: [
      { competency: 'operational-security', multiplier: 1.3 },
      { competency: 'alliance-building', multiplier: 1.2 }
    ]
  },
  'extracurricular-leadership': {
    id: 'extracurricular-leadership',
    name: 'Extracurricular Leadership',
    description: 'Student government, clubs, sports leadership',
    category: 'academic',
    level: 0,
    experience: 0,
    unlocked: false,
    contributes: [
      { competency: 'bureaucratic-navigation', multiplier: 1.4 },
      { competency: 'alliance-building', multiplier: 1.5 }
    ],
    requirements: {
      minLevel: 25,
      requiredExperiences: ['stem', 'liberal-arts', 'business']
    }
  },
  'social-networks': {
    id: 'social-networks',
    name: 'Social Networks',
    description: 'Greek life, study groups, activism',
    category: 'academic',
    level: 0,
    experience: 0,
    unlocked: false,
    contributes: [
      { competency: 'alliance-building', multiplier: 1.5 },
      { competency: 'information-warfare', multiplier: 1.3 }
    ],
    requirements: {
      minLevel: 20
    }
  },
  'work-experience': {
    id: 'work-experience',
    name: 'Work Experience',
    description: 'Internships, part-time jobs, research',
    category: 'academic',
    level: 0,
    experience: 0,
    unlocked: false,
    contributes: [
      { competency: 'resource-acquisition', multiplier: 1.3 },
      { competency: 'bureaucratic-navigation', multiplier: 1.2 }
    ],
    requirements: {
      minLevel: 15
    }
  },

  // Working Track
  'trade-specialization': {
    id: 'trade-specialization',
    name: 'Trade Specialization',
    description: 'Electrical, plumbing, HVAC, construction, automotive',
    category: 'working',
    level: 0,
    experience: 0,
    unlocked: true,
    contributes: [
      { competency: 'operational-security', multiplier: 1.4 },
      { competency: 'resource-acquisition', multiplier: 1.3 }
    ]
  },
  'union-experience': {
    id: 'union-experience',
    name: 'Union Experience',
    description: 'Organizing, negotiations, solidarity networks',
    category: 'working',
    level: 0,
    experience: 0,
    unlocked: false,
    contributes: [
      { competency: 'alliance-building', multiplier: 1.5 },
      { competency: 'bureaucratic-navigation', multiplier: 1.4 }
    ],
    requirements: {
      minLevel: 30,
      requiredExperiences: ['trade-specialization']
    }
  },
  'service-industry': {
    id: 'service-industry',
    name: 'Service Industry',
    description: 'Customer relations, crisis management, multi-tasking',
    category: 'working',
    level: 0,
    experience: 0,
    unlocked: true,
    contributes: [
      { competency: 'alliance-building', multiplier: 1.3 },
      { competency: 'information-warfare', multiplier: 1.2 }
    ]
  },
  'military-service': {
    id: 'military-service',
    name: 'Military Service',
    description: 'Discipline, logistics, chain of command',
    category: 'working',
    level: 0,
    experience: 0,
    unlocked: false,
    contributes: [
      { competency: 'operational-security', multiplier: 1.6 },
      { competency: 'bureaucratic-navigation', multiplier: 1.4 }
    ],
    requirements: {
      minLevel: 40,
      storyletsCompleted: ['military-recruitment']
    }
  },
  'entrepreneurship': {
    id: 'entrepreneurship',
    name: 'Entrepreneurship',
    description: 'Small business, risk assessment, resource management',
    category: 'working',
    level: 0,
    experience: 0,
    unlocked: false,
    contributes: [
      { competency: 'resource-acquisition', multiplier: 1.6 },
      { competency: 'alliance-building', multiplier: 1.2 }
    ],
    requirements: {
      minLevel: 35,
      requiredExperiences: ['service-industry']
    }
  },
  'manufacturing-industrial': {
    id: 'manufacturing-industrial',
    name: 'Manufacturing/Industrial',
    description: 'Process optimization, safety protocols, team coordination',
    category: 'working',
    level: 0,
    experience: 0,
    unlocked: false,
    contributes: [
      { competency: 'operational-security', multiplier: 1.3 },
      { competency: 'resource-acquisition', multiplier: 1.4 }
    ],
    requirements: {
      minLevel: 25,
      requiredExperiences: ['trade-specialization']
    }
  }
};

// Core Life Competencies
export const CORE_COMPETENCIES: { [key in CoreCompetency]: CoreCompetencySkill } = {
  'bureaucratic-navigation': {
    id: 'bureaucratic-navigation',
    name: 'Bureaucratic Navigation',
    description: 'Understanding how systems actually work vs. how they\'re supposed to work',
    level: 0,
    experience: 0,
    skills: [
      {
        name: 'Policy Analysis',
        description: 'Understanding regulatory frameworks and policy structures',
        xpGain: 25,
        synergyEffect: 'Unlock regulatory bypass opportunities'
      },
      {
        name: 'Institutional Mapping',
        description: 'Identify key decision makers and influence networks',
        xpGain: 30,
        synergyEffect: 'Enhanced access to organizational hierarchies'
      },
      {
        name: 'Process Exploitation',
        description: 'Find and exploit bureaucratic loopholes',
        xpGain: 35,
        synergyEffect: 'Accelerated permit and approval processes'
      }
    ],
    developedBy: {
      academic: ['extracurricular-leadership', 'work-experience'],
      working: ['union-experience', 'military-service']
    },
    applications: [
      'Exploiting procedural loopholes',
      'Finding decision bottlenecks',
      'Navigating complex organizational structures'
    ],
    effectiveness: 1.0
  },
  'resource-acquisition': {
    id: 'resource-acquisition',
    name: 'Resource Acquisition',
    description: 'Getting funding, talent, materials, and infrastructure',
    level: 0,
    experience: 0,
    skills: [
      {
        name: 'Funding Networks',
        description: 'Access capital from formal and informal sources',
        xpGain: 30,
        synergyEffect: 'Improved resource multipliers from storylets'
      },
      {
        name: 'Supply Chain Control',
        description: 'Secure reliable access to materials and services',
        xpGain: 25,
        synergyEffect: 'Reduced resource costs for operations'
      },
      {
        name: 'Talent Recruitment',
        description: 'Identify and recruit skilled individuals',
        xpGain: 35,
        synergyEffect: 'Access to specialist team members'
      }
    ],
    developedBy: {
      academic: ['business', 'work-experience', 'extracurricular-leadership'],
      working: ['entrepreneurship', 'trade-specialization', 'manufacturing-industrial']
    },
    applications: [
      'Securing operational needs',
      'Territory control',
      'Black market systems',
      'Funding acquisition'
    ],
    effectiveness: 1.0
  },
  'information-warfare': {
    id: 'information-warfare',
    name: 'Information Warfare',
    description: 'Narrative manipulation and intelligence operations',
    level: 0,
    experience: 0,
    skills: [
      {
        name: 'Media Manipulation',
        description: 'Control information flow through media channels',
        xpGain: 40,
        synergyEffect: 'Enhanced narrative control in operations'
      },
      {
        name: 'Intelligence Gathering',
        description: 'Collect and analyze sensitive information',
        xpGain: 35,
        synergyEffect: 'Access to hidden storylet paths'
      },
      {
        name: 'Counter-Intelligence',
        description: 'Protect operations from enemy intelligence',
        xpGain: 45,
        synergyEffect: 'Reduced detection risk in covert activities'
      }
    ],
    subcategories: {
      'narrative-manipulation': { level: 0, experience: 0 },
      'intelligence-operations': { level: 0, experience: 0 }
    },
    developedBy: {
      academic: ['liberal-arts', 'social-networks'],
      working: ['service-industry', 'union-experience', 'military-service']
    },
    applications: [
      'Shaping public discourse',
      'Managing intelligence operations',
      'Media manipulation',
      'Surveillance and espionage'
    ],
    effectiveness: 1.0
  },
  'alliance-building': {
    id: 'alliance-building',
    name: 'Alliance Building',
    description: 'Creating coalitions, partnerships, and loyal networks',
    level: 0,
    experience: 0,
    skills: [
      {
        name: 'Network Cultivation',
        description: 'Build and maintain strategic relationships',
        xpGain: 30,
        synergyEffect: 'Access to insider contacts and opportunities'
      },
      {
        name: 'Coalition Building',
        description: 'Unite diverse groups around common goals',
        xpGain: 35,
        synergyEffect: 'Enhanced team operation effectiveness'
      },
      {
        name: 'Trust Management',
        description: 'Establish credibility and manage loyalty',
        xpGain: 25,
        synergyEffect: 'Reduced betrayal risk in operations'
      }
    ],
    developedBy: {
      academic: ['social-networks', 'extracurricular-leadership'],
      working: ['union-experience', 'service-industry', 'entrepreneurship']
    },
    applications: [
      'Multi-organizational coordination',
      'Insider recruitment',
      'Local-to-global movements',
      'Coalition building'
    ],
    effectiveness: 1.0
  },
  'operational-security': {
    id: 'operational-security',
    name: 'Operational Security',
    description: 'Protecting plans and operations from discovery while enabling covert action',
    level: 0,
    experience: 0,
    skills: [
      {
        name: 'Covert Communications',
        description: 'Secure, untraceable communication methods',
        xpGain: 40,
        synergyEffect: 'Enhanced operational coordination and security'
      },
      {
        name: 'Surveillance Detection',
        description: 'Identify and evade hostile surveillance',
        xpGain: 35,
        synergyEffect: 'Reduced detection chance in sensitive operations'
      },
      {
        name: 'Operational Planning',
        description: 'Design secure, compartmentalized operations',
        xpGain: 45,
        synergyEffect: 'Improved success rates for complex missions'
      }
    ],
    developedBy: {
      academic: ['stem', 'extracurricular-leadership'],
      working: ['military-service', 'trade-specialization', 'manufacturing-industrial']
    },
    applications: [
      'Communication security',
      'Stealth operations',
      'Counter-surveillance',
      'Sabotage operations'
    ],
    effectiveness: 1.0
  }
};

// Character Classes
export const CHARACTER_CLASSES: { [key in CharacterClass]: CharacterClassSpec } = {
  'corporate-climber': {
    id: 'corporate-climber',
    name: 'Corporate Climber',
    description: 'Masters corporate hierarchies and business systems',
    unlocked: false,
    level: 0,
    experience: 0,
    primaryCompetencies: ['bureaucratic-navigation', 'resource-acquisition'],
    foundationRequirements: {
      required: ['business'],
      recommended: ['extracurricular-leadership', 'work-experience']
    },
    competencyRequirements: {
      'bureaucratic-navigation': 30,
      'resource-acquisition': 30
    },
    infiltrationTargets: [
      'Corporate hierarchies',
      'Board structures', 
      'Shareholder systems'
    ],
    abilities: []
  },
  'political-operative': {
    id: 'political-operative',
    name: 'Political Operative',
    description: 'Specializes in political systems and public influence',
    unlocked: false,
    level: 0,
    experience: 0,
    primaryCompetencies: ['alliance-building', 'information-warfare'],
    foundationRequirements: {
      required: ['liberal-arts'],
      recommended: ['social-networks', 'union-experience']
    },
    competencyRequirements: {
      'alliance-building': 30,
      'information-warfare': 30
    },
    infiltrationTargets: [
      'Government agencies',
      'Political parties',
      'Regulatory bodies'
    ],
    abilities: []
  },
  'technical-specialist': {
    id: 'technical-specialist',
    name: 'Technical Specialist',
    description: 'Masters technical systems and infrastructure',
    unlocked: false,
    level: 0,
    experience: 0,
    primaryCompetencies: ['operational-security', 'resource-acquisition'],
    foundationRequirements: {
      required: ['stem'],
      recommended: ['trade-specialization', 'manufacturing-industrial']
    },
    competencyRequirements: {
      'operational-security': 35,
      'resource-acquisition': 25
    },
    infiltrationTargets: [
      'Infrastructure systems',
      'IT networks',
      'Production facilities'
    ],
    abilities: []
  },
  'security-expert': {
    id: 'security-expert',
    name: 'Security Expert',
    description: 'Specializes in security and intelligence operations',
    unlocked: false,
    level: 0,
    experience: 0,
    primaryCompetencies: ['information-warfare', 'operational-security'],
    foundationRequirements: {
      required: ['military-service'],
      recommended: ['stem', 'trade-specialization']
    },
    competencyRequirements: {
      'information-warfare': 35,
      'operational-security': 40
    },
    infiltrationTargets: [
      'Security apparatus',
      'Intelligence agencies',
      'Law enforcement'
    ],
    abilities: []
  },
  'financial-expert': {
    id: 'financial-expert',
    name: 'Financial Expert',
    description: 'Masters financial systems and economic leverage',
    unlocked: false,
    level: 0,
    experience: 0,
    primaryCompetencies: ['resource-acquisition', 'bureaucratic-navigation'],
    foundationRequirements: {
      required: ['business'],
      recommended: ['entrepreneurship', 'work-experience']
    },
    competencyRequirements: {
      'resource-acquisition': 40,
      'bureaucratic-navigation': 30
    },
    infiltrationTargets: [
      'Financial institutions',
      'Accounting firms',
      'Regulatory agencies'
    ],
    abilities: []
  },
  'legal-eagle': {
    id: 'legal-eagle',
    name: 'Legal Eagle',
    description: 'Navigates legal systems and regulatory frameworks',
    unlocked: false,
    level: 0,
    experience: 0,
    primaryCompetencies: ['bureaucratic-navigation', 'alliance-building'],
    foundationRequirements: {
      required: ['liberal-arts'],
      recommended: ['extracurricular-leadership', 'service-industry']
    },
    competencyRequirements: {
      'bureaucratic-navigation': 35,
      'alliance-building': 30
    },
    infiltrationTargets: [
      'Legal system',
      'Regulatory bodies',
      'Professional associations'
    ],
    abilities: []
  },
  'media-influencer': {
    id: 'media-influencer',
    name: 'Media Influencer',
    description: 'Shapes public narrative and media discourse',
    unlocked: false,
    level: 0,
    experience: 0,
    primaryCompetencies: ['information-warfare', 'alliance-building'],
    foundationRequirements: {
      required: ['liberal-arts'],
      recommended: ['social-networks', 'entrepreneurship']
    },
    competencyRequirements: {
      'information-warfare': 35,
      'alliance-building': 30
    },
    infiltrationTargets: [
      'Media organizations',
      'Social platforms',
      'Public opinion'
    ],
    abilities: []
  },
  'healthcare-professional': {
    id: 'healthcare-professional',
    name: 'Healthcare Professional',
    description: 'Operates within healthcare systems and institutions',
    unlocked: false,
    level: 0,
    experience: 0,
    primaryCompetencies: ['alliance-building', 'operational-security'],
    foundationRequirements: {
      required: ['pre-med'],
      recommended: ['service-industry', 'military-service']
    },
    competencyRequirements: {
      'alliance-building': 30,
      'operational-security': 30
    },
    infiltrationTargets: [
      'Healthcare systems',
      'Medical regulatory bodies',
      'Professional associations'
    ],
    abilities: []
  },
  'community-organizer': {
    id: 'community-organizer',
    name: 'Community Organizer',
    description: 'Mobilizes grassroots movements and local networks',
    unlocked: false,
    level: 0,
    experience: 0,
    primaryCompetencies: ['alliance-building', 'information-warfare'],
    foundationRequirements: {
      required: ['social-networks'],
      recommended: ['union-experience', 'service-industry']
    },
    competencyRequirements: {
      'alliance-building': 35,
      'information-warfare': 25
    },
    infiltrationTargets: [
      'Grassroots organizations',
      'Local government',
      'Community institutions'
    ],
    abilities: []
  },
  'education-specialist': {
    id: 'education-specialist',
    name: 'Education Specialist',
    description: 'Operates within educational systems and institutions',
    unlocked: false,
    level: 0,
    experience: 0,
    primaryCompetencies: ['information-warfare', 'bureaucratic-navigation'],
    foundationRequirements: {
      required: ['liberal-arts'],
      recommended: ['extracurricular-leadership', 'service-industry']
    },
    competencyRequirements: {
      'information-warfare': 30,
      'bureaucratic-navigation': 30
    },
    infiltrationTargets: [
      'Educational institutions',
      'Certification bodies',
      'Training systems'
    ],
    abilities: []
  },
  'logistics-commander': {
    id: 'logistics-commander',
    name: 'Logistics Commander',
    description: 'Masters supply chains and infrastructure management',
    unlocked: false,
    level: 0,
    experience: 0,
    primaryCompetencies: ['operational-security', 'resource-acquisition'],
    foundationRequirements: {
      required: ['trade-specialization'],
      recommended: ['military-service', 'entrepreneurship']
    },
    competencyRequirements: {
      'operational-security': 30,
      'resource-acquisition': 35
    },
    infiltrationTargets: [
      'Supply chains',
      'Zoning commissions',
      'Infrastructure management'
    ],
    abilities: []
  }
};

// Force Multiplier Synergies
export const SYNERGY_EFFECTS: SynergyEffect[] = [
  {
    id: 'electrical-opsec',
    name: 'Electrical + Operational Security',
    description: 'Undetectable power grid manipulation',
    unlocked: false,
    requirements: {
      tradeSpecialization: 'electrical',
      competency: 'operational-security',
      minTradeLevel: 40,
      minCompetencyLevel: 50
    },
    effects: {
      infiltrationPower: 'Can disable or manipulate power systems without detection',
      gameplayEffects: [
        { type: 'storylet-unlock', value: ['power-grid-sabotage', 'electrical-surveillance'] },
        { type: 'special-action', value: 'silent-blackout' }
      ]
    }
  },
  {
    id: 'hvac-intelligence',
    name: 'HVAC + Intelligence Operations',
    description: 'Covert surveillance installation',
    unlocked: false,
    requirements: {
      tradeSpecialization: 'hvac',
      competency: 'information-warfare',
      minTradeLevel: 35,
      minCompetencyLevel: 45
    },
    effects: {
      infiltrationPower: 'Install surveillance equipment through HVAC systems',
      gameplayEffects: [
        { type: 'storylet-unlock', value: ['hvac-surveillance', 'building-intelligence'] },
        { type: 'resource-multiplier', value: { 'intelligence-gathering': 2.0 } }
      ]
    }
  },
  {
    id: 'construction-alliance',
    name: 'Construction + Alliance Building',
    description: 'Worker networks across development projects',
    unlocked: false,
    requirements: {
      tradeSpecialization: 'construction',
      competency: 'alliance-building',
      minTradeLevel: 40,
      minCompetencyLevel: 40
    },
    effects: {
      infiltrationPower: 'Access to construction worker networks across multiple projects',
      gameplayEffects: [
        { type: 'storylet-unlock', value: ['construction-network', 'development-influence'] },
        { type: 'resource-multiplier', value: { 'alliance-strength': 1.5 } }
      ]
    }
  },
  {
    id: 'military-bureaucracy',
    name: 'Military + Bureaucratic Navigation',
    description: 'Exploiting command structure weaknesses',
    unlocked: false,
    requirements: {
      tradeSpecialization: 'automotive', // Military experience counts as trade
      competency: 'bureaucratic-navigation',
      minTradeLevel: 50,
      minCompetencyLevel: 45
    },
    effects: {
      infiltrationPower: 'Exploit military and government command structures',
      gameplayEffects: [
        { type: 'storylet-unlock', value: ['military-infiltration', 'chain-of-command'] },
        { type: 'special-action', value: 'authority-bypass' }
      ]
    }
  },
  {
    id: 'union-resources',
    name: 'Union + Resource Acquisition',
    description: 'Strike funds and solidarity networks',
    unlocked: false,
    requirements: {
      tradeSpecialization: 'construction', // Union experience through construction
      competency: 'resource-acquisition',
      minTradeLevel: 35,
      minCompetencyLevel: 40
    },
    effects: {
      infiltrationPower: 'Access to union strike funds and worker solidarity networks',
      gameplayEffects: [
        { type: 'resource-multiplier', value: { 'funding-access': 1.8 } },
        { type: 'storylet-unlock', value: ['union-solidarity', 'strike-coordination'] }
      ]
    }
  }
];

// World Conditions that affect competency effectiveness
export const WORLD_CONDITIONS: WorldCondition[] = [
  {
    id: 'media-crackdown',
    name: 'Media Crackdown',
    description: 'Government increases surveillance and control of media outlets',
    active: false,
    duration: -1,
    competencyModifiers: {
      'information-warfare': {
        effectivenessMultiplier: 0.7,
        riskIncrease: 0.3,
        newOpportunities: ['underground-media', 'encrypted-communications']
      }
    },
    triggerConditions: {
      dayRange: [100, 200],
      randomChance: 0.15
    }
  },
  {
    id: 'budget-collapse',
    name: 'Economic Crisis',
    description: 'Major economic downturn affects all sectors',
    active: false,
    duration: 60,
    competencyModifiers: {
      'resource-acquisition': {
        effectivenessMultiplier: 1.5,
        newOpportunities: ['crisis-profiteering', 'resource-hoarding']
      },
      'alliance-building': {
        effectivenessMultiplier: 1.2,
        newOpportunities: ['mutual-aid-networks']
      }
    },
    triggerConditions: {
      dayRange: [150, 300],
      randomChance: 0.1
    }
  },
  {
    id: 'system-reform',
    name: 'Institutional Reform',
    description: 'Government implements transparency and anti-corruption measures',
    active: false,
    duration: 90,
    competencyModifiers: {
      'bureaucratic-navigation': {
        effectivenessMultiplier: 0.8,
        riskIncrease: 0.2
      },
      'operational-security': {
        effectivenessMultiplier: 1.3,
        newOpportunities: ['reform-exploitation', 'transparency-gaming']
      }
    },
    triggerConditions: {
      dayRange: [80, 180],
      playerActions: ['political-corruption-exposure'],
      randomChance: 0.12
    }
  }
];

// Infiltration Teams
export const INFILTRATION_TEAMS: InfiltrationTeam[] = [
  {
    id: 'corporate-takeover',
    name: 'Corporate Takeover Team',
    target: 'corporate',
    members: [
      { class: 'financial-expert', role: 'Identifies financial vulnerabilities', required: true },
      { class: 'technical-specialist', role: 'Controls infrastructure', required: true },
      { class: 'legal-eagle', role: 'Navigates corporate law', required: true },
      { class: 'media-influencer', role: 'Shapes public narrative', required: false },
      { class: 'security-expert', role: 'Protects operation from discovery', required: false }
    ],
    synergy: 1.5,
    unlocked: false,
    requirements: {
      playerClass: 'financial-expert',
      minClassLevels: {
        'financial-expert': 50,
        'technical-specialist': 40,
        'legal-eagle': 40
      }
    }
  },
  {
    id: 'government-infiltration',
    name: 'Government Infiltration Team',
    target: 'government',
    members: [
      { class: 'political-operative', role: 'Builds insider coalitions', required: true },
      { class: 'community-organizer', role: 'Mobilizes public pressure', required: true },
      { class: 'technical-specialist', role: 'Manages secure communications', required: true },
      { class: 'legal-eagle', role: 'Exploits regulatory loopholes', required: false },
      { class: 'security-expert', role: 'Protects from surveillance', required: false }
    ],
    synergy: 1.4,
    unlocked: false,
    requirements: {
      playerClass: 'political-operative',
      minClassLevels: {
        'political-operative': 50,
        'community-organizer': 40,
        'technical-specialist': 35
      }
    }
  },
  {
    id: 'infrastructure-control',
    name: 'Infrastructure Control Team',
    target: 'infrastructure',
    members: [
      { class: 'technical-specialist', role: 'Direct system control', required: true },
      { class: 'security-expert', role: 'Neutralizes security measures', required: true },
      { class: 'community-organizer', role: 'Coordinates worker support', required: true },
      { class: 'corporate-climber', role: 'Secures funding and materials', required: false },
      { class: 'political-operative', role: 'Manages political cover', required: false }
    ],
    synergy: 1.6,
    unlocked: false,
    requirements: {
      playerClass: 'technical-specialist',
      minClassLevels: {
        'technical-specialist': 60,
        'security-expert': 45,
        'community-organizer': 40
      }
    }
  }
];

// Class Abilities (to be expanded)
export const CLASS_ABILITIES: { [key in CharacterClass]: ClassAbility[] } = {
  'corporate-climber': [
    {
      id: 'board-manipulation',
      name: 'Board Manipulation',
      description: 'Influence corporate board decisions through strategic positioning',
      unlocked: false,
      level: 0,
      requirements: {
        classLevel: 25,
        competencyLevels: { 'bureaucratic-navigation': 40 }
      },
      effects: [
        { type: 'storylet', target: 'corporate-board-influence', value: 1 }
      ],
      cooldown: 7
    }
  ],
  'political-operative': [
    {
      id: 'narrative-control',
      name: 'Narrative Control',
      description: 'Shape public discourse around key issues',
      unlocked: false,
      level: 0,
      requirements: {
        classLevel: 30,
        competencyLevels: { 'information-warfare': 45 }
      },
      effects: [
        { type: 'multiplier', target: 'public-opinion-influence', value: 2.0 }
      ],
      cooldown: 5
    }
  ],
  'technical-specialist': [
    {
      id: 'system-override',
      name: 'System Override',
      description: 'Temporarily disable or control technical systems',
      unlocked: false,
      level: 0,
      requirements: {
        classLevel: 35,
        competencyLevels: { 'operational-security': 50 }
      },
      effects: [
        { type: 'storylet', target: 'system-disable', value: 1 }
      ],
      cooldown: 10,
      usesPerDay: 2
    }
  ],
  'security-expert': [
    {
      id: 'counter-surveillance',
      name: 'Counter-Surveillance',
      description: 'Protect operations from detection and surveillance',
      unlocked: false,
      level: 0,
      requirements: {
        classLevel: 40,
        competencyLevels: { 'operational-security': 60 }
      },
      effects: [
        { type: 'multiplier', target: 'operation-stealth', value: 1.8 }
      ],
      cooldown: 3
    }
  ],
  'financial-expert': [
    {
      id: 'financial-leverage',
      name: 'Financial Leverage',
      description: 'Use financial pressure to influence targets',
      unlocked: false,
      level: 0,
      requirements: {
        classLevel: 30,
        competencyLevels: { 'resource-acquisition': 50 }
      },
      effects: [
        { type: 'resource', target: 'influence-points', value: 100 }
      ],
      cooldown: 14
    }
  ],
  'legal-eagle': [
    {
      id: 'legal-loophole',
      name: 'Legal Loophole',
      description: 'Find legal vulnerabilities in target organizations',
      unlocked: false,
      level: 0,
      requirements: {
        classLevel: 25,
        competencyLevels: { 'bureaucratic-navigation': 45 }
      },
      effects: [
        { type: 'storylet', target: 'legal-vulnerability', value: 1 }
      ],
      cooldown: 7
    }
  ],
  'media-influencer': [
    {
      id: 'viral-campaign',
      name: 'Viral Campaign',
      description: 'Create viral content to shift public opinion',
      unlocked: false,
      level: 0,
      requirements: {
        classLevel: 20,
        competencyLevels: { 'information-warfare': 40 }
      },
      effects: [
        { type: 'multiplier', target: 'social-media-reach', value: 3.0 }
      ],
      cooldown: 10
    }
  ],
  'healthcare-professional': [
    {
      id: 'medical-network',
      name: 'Medical Network',
      description: 'Leverage healthcare professional networks',
      unlocked: false,
      level: 0,
      requirements: {
        classLevel: 30,
        competencyLevels: { 'alliance-building': 40 }
      },
      effects: [
        { type: 'resource', target: 'medical-contacts', value: 50 }
      ],
      cooldown: 14
    }
  ],
  'community-organizer': [
    {
      id: 'grassroots-mobilization',
      name: 'Grassroots Mobilization',
      description: 'Quickly organize community action',
      unlocked: false,
      level: 0,
      requirements: {
        classLevel: 25,
        competencyLevels: { 'alliance-building': 45 }
      },
      effects: [
        { type: 'multiplier', target: 'protest-effectiveness', value: 2.5 }
      ],
      cooldown: 21
    }
  ],
  'education-specialist': [
    {
      id: 'curriculum-influence',
      name: 'Curriculum Influence',
      description: 'Influence educational content and policies',
      unlocked: false,
      level: 0,
      requirements: {
        classLevel: 35,
        competencyLevels: { 'bureaucratic-navigation': 40 }
      },
      effects: [
        { type: 'storylet', target: 'education-policy-change', value: 1 }
      ],
      cooldown: 30
    }
  ],
  'logistics-commander': [
    {
      id: 'supply-disruption',
      name: 'Supply Chain Disruption',
      description: 'Strategically disrupt target supply chains',
      unlocked: false,
      level: 0,
      requirements: {
        classLevel: 40,
        competencyLevels: { 'operational-security': 45, 'resource-acquisition': 40 }
      },
      effects: [
        { type: 'storylet', target: 'supply-chain-sabotage', value: 1 }
      ],
      cooldown: 14
    }
  ]
};