// /Users/montysharma/V11M2/src/store/useAppStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Skill } from '../types/character';

interface AppState {
  // User preferences
  theme: 'light' | 'dark';
  
  // Player stats
  userLevel: number;
  experience: number;
  day: number;
  
  // Active character
  activeCharacter: any | null;
  
  // Time allocation system (renamed for clarity)
  allocations: {
    study: number;
    work: number;
    social: number;
    rest: number;
    exercise: number;
  };
  
  // Resources
  resources: {
    energy: number;
    stress: number;
    money: number;
    knowledge: number;
    social: number;
  };
  
  // Storylet integration
  storyletFlags: Record<string, boolean>;
  activeStoryletIds: string[];
  
  // Skills (infiltration skills)
  skills: Record<string, {
    id: string;
    name: string;
    description: string;
    xp: number;
    level: number;
    xpToNextLevel: number;
  }>;
  
  // Skill Events tracking
  skillEvents: {
    skillId: string;
    amount: number;
    timestamp: number;
    source: string;
  }[];
  
  // Current event system
  currentEvent: Event | null;
  
  // Quest system
  activeQuests: Quest[];
  completedQuests: Quest[];
  
  // Planner data
  goals: Goal[];
  tasks: Task[];
  
  // Simulation state
  isSimulationRunning: boolean;
  lastEventCheck: number;
  
  // Time control
  isTimePaused: boolean;
  
  // Skill actions
  addSkillXp: (skillId: string, amount: number, source?: string) => void;
  addSkillEvent: (event: { skillId: string; amount: number; timestamp: number; source: string }) => void;
  getSkillEvents: (skillId: string, limit?: number) => { skillId: string; amount: number; timestamp: number; source: string }[];
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  addExperience: (amount: number) => void;
  updateTimeAllocation: (activity: keyof AppState['allocations'], value: number) => void;
  getTotalTimeAllocated: () => number;
  setActiveCharacter: (character: any) => void;
  updateResource: (resource: keyof AppState['resources'], value: number) => void;
  updateSkill: (skill: string, value: number) => void;
  getTotalSkillPoints: () => number;
  setCurrentEvent: (event: Event | null) => void;
  handleEventChoice: (choice: EventChoice) => void;
  addQuest: (quest: Quest) => void;
  updateQuest: (questId: string, updatedQuest: Quest) => void;
  deleteQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;
  convertStoryletToQuest: (storyletId: string, choiceId: string) => void;
  addGoal: (goal: Goal) => void;
  addTask: (task: Task) => void;
  toggleTaskComplete: (taskId: string) => void;
  simulateDay: () => void;
  incrementDay: () => void;
  resetGame: () => void;
  pauseTime: () => void;
  resumeTime: () => void;
  
  // New simulation methods
  setSimulationRunning: (running: boolean) => void;
  getFormattedDate: () => string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
}

interface EventChoice {
  id: string;
  title: string;
  description: string;
  consequences: {
    stat: string;
    value: number;
    color: string;
  }[];
}

interface Quest {
  id: string;
  title: string;
  description: string;
  experienceReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  completed: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  category: string;
  progress: number; // 0-100
}

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  goalId?: string;
}

export const useAppStore = create<AppState>()(persist((set, get) => ({
  // Initial state
  theme: 'light',
  userLevel: 1,
  experience: 0,
  day: 1,
  
  activeCharacter: null,
  
  allocations: {
    study: 40,
    work: 25,
    social: 15,
    rest: 15,
    exercise: 5
  },
  
  resources: {
    energy: 75,
    stress: 25,
    money: 150,
    knowledge: 100,  // Better starting value to show 1000 max
    social: 200       // Better starting value to show 1000 max
  },
  
  storyletFlags: {},
  activeStoryletIds: [],
  
  skills: {
    bureaucraticNavigation: {
      id: 'bureaucraticNavigation',
      name: 'Bureaucratic Navigation',
      description: 'Mastery of institutional systems, form-filling, and navigating complex bureaucratic structures efficiently.',
      xp: 0,
      level: 1,
      xpToNextLevel: 100
    },
    resourceAcquisition: {
      id: 'resourceAcquisition',
      name: 'Resource Acquisition',
      description: 'Skill in finding, securing, and optimizing access to materials, funding, and opportunities.',
      xp: 0,
      level: 1,
      xpToNextLevel: 100
    },
    informationWarfare: {
      id: 'informationWarfare',
      name: 'Information Warfare',
      description: 'Strategic intelligence gathering, data analysis, and leveraging information for competitive advantage.',
      xp: 0,
      level: 1,
      xpToNextLevel: 100
    },
    allianceBuilding: {
      id: 'allianceBuilding',
      name: 'Alliance Building',
      description: 'Creating and maintaining strategic partnerships, networking, and coalition formation.',
      xp: 0,
      level: 1,
      xpToNextLevel: 100
    },
    operationalSecurity: {
      id: 'operationalSecurity',
      name: 'Operational Security',
      description: 'Protecting sensitive activities, maintaining discretion, and managing risk in complex operations.',
      xp: 0,
      level: 1,
      xpToNextLevel: 100
    },
    perseverance: {
      id: 'perseverance',
      name: 'Perseverance',
      description: 'Mental toughness and determination to push through difficult challenges and setbacks.',
      xp: 0,
      level: 1,
      xpToNextLevel: 100
    }
  },
  
  skillEvents: [],
  
  currentEvent: null,
  
  activeQuests: [],
  completedQuests: [],
  goals: [],
  tasks: [],
  
  isSimulationRunning: false,
  lastEventCheck: 0,
  
  isTimePaused: false,
  
  // Actions
  setTheme: (theme) => set({ theme }),
  
  addExperience: (amount) => {
    const { experience, userLevel } = get();
    const newExperience = experience + amount;
    const newLevel = Math.floor(newExperience / 100) + 1;
    
    set({ 
      experience: newExperience,
      userLevel: newLevel > userLevel ? newLevel : userLevel
    });
  },
  
  updateTimeAllocation: (activity, value) => {
    set((state) => ({
      allocations: {
        ...state.allocations,
        [activity]: Math.max(0, Math.min(100, value))
      }
    }));
  },
  
  getTotalTimeAllocated: () => {
    const { allocations } = get();
    return Object.values(allocations).reduce((sum, value) => sum + value, 0);
  },
  
  setActiveCharacter: (character) => {
    set({ activeCharacter: character });
  },
  
  updateResource: (resource, value) => {
    set((state) => {
      const newResources = {
        ...state.resources,
        [resource]: resource === 'money' || resource === 'knowledge' || resource === 'social' 
          ? Math.max(0, Math.min(1000, value))  // Knowledge, money, social capped at 1000
          : Math.max(0, Math.min(100, value))   // Energy and stress capped at 100
      };
      
      // Trigger storylet evaluation after resource update
      setTimeout(() => {
        try {
          if (typeof window !== 'undefined' && (window as any).useStoryletStore) {
            (window as any).useStoryletStore.getState().evaluateStorylets();
          }
        } catch (error) {
          console.warn('Could not trigger storylet evaluation:', error);
        }
      }, 100);
      
      return { resources: newResources };
    });
  },
  
  updateSkill: (skill, value) => {
    // This method is deprecated - use addSkillXp instead
    console.warn('updateSkill is deprecated, use addSkillXp instead');
  },
  
  getTotalSkillPoints: () => {
    const { skills } = get();
    return Object.values(skills).reduce((sum, skill) => sum + skill.xp, 0);
  },
  
  setCurrentEvent: (event) => set({ currentEvent: event }),
  
  handleEventChoice: (choice) => {
    const { resources, updateResource, setCurrentEvent, addExperience } = get();
    
    // Apply consequences
    choice.consequences.forEach((consequence) => {
      const statMap: { [key: string]: keyof typeof resources } = {
        'ENERGY': 'energy',
        'STRESS': 'stress',
        'MONEY': 'money',
        'KNOWLEDGE': 'knowledge',
        'SOCIAL': 'social'
      };
      
      const resourceKey = statMap[consequence.stat];
      if (resourceKey) {
        const currentValue = resources[resourceKey];
        updateResource(resourceKey, currentValue + consequence.value);
      }
    });
    
    // Clear the current event
    setCurrentEvent(null);
    
    // Add experience for making a choice
    addExperience(10);
  },
  
  addQuest: (quest) => set((state) => ({
    activeQuests: [...state.activeQuests, quest]
  })),
  
  updateQuest: (questId, updatedQuest) => set((state) => ({
    activeQuests: state.activeQuests.map(quest => 
      quest.id === questId ? updatedQuest : quest
    )
  })),
  
  deleteQuest: (questId) => set((state) => ({
    activeQuests: state.activeQuests.filter(quest => quest.id !== questId)
  })),
  
  convertStoryletToQuest: (storyletId, choiceId) => {
    try {
      // Get storylet data from storylet store
      if (typeof window !== 'undefined' && (window as any).useStoryletStore) {
        const storyletStore = (window as any).useStoryletStore.getState();
        const storylet = storyletStore.allStorylets[storyletId];
        const choice = storylet?.choices.find((c: any) => c.id === choiceId);
        
        if (storylet && choice) {
          // Calculate XP reward based on choice effects
          const skillXpEffects = choice.effects.filter((e: any) => e.type === 'skillXp');
          const totalSkillXp = skillXpEffects.reduce((sum: number, effect: any) => sum + effect.amount, 0);
          const baseXp = Math.max(25, totalSkillXp * 10); // Convert skill XP to quest XP
          
          // Determine difficulty based on effects and complexity
          let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
          const effectCount = choice.effects.length;
          const hasNegativeEffects = choice.effects.some((e: any) => 
            e.type === 'resource' && e.delta < 0
          );
          
          if (effectCount >= 4 || totalSkillXp >= 5) {
            difficulty = 'hard';
          } else if (effectCount >= 2 || totalSkillXp >= 3 || hasNegativeEffects) {
            difficulty = 'medium';
          }
          
          // Map storylet themes to quest categories
          const categoryMap: Record<string, string> = {
            'midterm': 'Learning',
            'study': 'Learning',
            'library': 'Learning',
            'coffee': 'Social',
            'rival': 'Social',
            'dorm': 'Social',
            'stress': 'Health',
            'energy': 'Health',
            'sleep': 'Health',
            'money': 'Finance',
            'work': 'Career',
            'knowledge': 'Learning'
          };
          
          let category = 'General';
          for (const [keyword, cat] of Object.entries(categoryMap)) {
            if (storylet.name.toLowerCase().includes(keyword) || 
                storylet.description.toLowerCase().includes(keyword)) {
              category = cat;
              break;
            }
          }
          
          const completedQuest: Quest = {
            id: `storylet_${storyletId}_${choiceId}_${Date.now()}`,
            title: `${storylet.name}: ${choice.text}`,
            description: `Completed storylet choice: ${storylet.description.substring(0, 100)}...`,
            experienceReward: baseXp,
            difficulty,
            category,
            completed: true
          };
          
          // Add to completed quests and award experience
          set((state) => {
            const newExperience = state.experience + completedQuest.experienceReward;
            const newLevel = Math.floor(newExperience / 100) + 1;
            
            return {
              completedQuests: [...state.completedQuests, completedQuest],
              experience: newExperience,
              userLevel: newLevel > state.userLevel ? newLevel : state.userLevel
            };
          });
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`🎯 Converted storylet to quest: ${completedQuest.title} (+${completedQuest.experienceReward} XP)`);
          }
        }
      }
    } catch (error) {
      console.warn('Could not convert storylet to quest:', error);
    }
  },
  
  completeQuest: (questId) => set((state) => {
    const quest = state.activeQuests.find(q => q.id === questId);
    if (!quest) return state;
    
    const updatedActiveQuests = state.activeQuests.filter(q => q.id !== questId);
    const completedQuest = { ...quest, completed: true };
    
    // Add experience reward
    const newExperience = state.experience + quest.experienceReward;
    const newLevel = Math.floor(newExperience / 100) + 1;
    
    return {
      activeQuests: updatedActiveQuests,
      completedQuests: [...state.completedQuests, completedQuest],
      experience: newExperience,
      userLevel: newLevel > state.userLevel ? newLevel : state.userLevel
    };
  }),
  
  addGoal: (goal) => set((state) => ({
    goals: [...state.goals, goal]
  })),
  
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]
  })),
  
  toggleTaskComplete: (taskId) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    )
  })),
  
  simulateDay: () => {
    const { day, allocations, resources, updateResource, isTimePaused } = get();
    
    // Don't simulate if time is paused
    if (isTimePaused) {
      console.log('⏸️ Day simulation skipped - time is paused');
      return;
    }
    
    // Simulate daily effects based on time allocation (increased growth rates)
    const energyChange = (allocations.rest * 0.8) - (allocations.work * 0.5) - (allocations.study * 0.3);
    const stressChange = (allocations.work * 0.3) + (allocations.study * 0.2) - (allocations.rest * 0.5);
    const knowledgeChange = allocations.study * 0.5; // Increased from 0.1 to 0.5
    const socialChange = (allocations.social * 0.8) - (allocations.study * 0.05); // Increased from 0.2 to 0.8
    const moneyChange = allocations.work * 2;
    
    updateResource('energy', resources.energy + energyChange);
    updateResource('stress', resources.stress + stressChange);
    updateResource('knowledge', resources.knowledge + knowledgeChange);
    updateResource('social', resources.social + socialChange);
    updateResource('money', resources.money + moneyChange);
    
    set({ day: day + 1 });
    
    // Trigger storylet evaluation after day change
    setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && (window as any).useStoryletStore) {
          (window as any).useStoryletStore.getState().evaluateStorylets();
        }
      } catch (error) {
        console.warn('Could not trigger storylet evaluation:', error);
      }
    }, 100);
    
    // Auto-save current game if there's an active save
    setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && (window as any).useSaveStore) {
          const saveStore = (window as any).useSaveStore.getState();
          if (saveStore.currentSaveId) {
            saveStore.updateCurrentSave();
          }
        }
      } catch (error) {
        console.warn('Could not auto-save:', error);
      }
    }, 200);
  },
  
  incrementDay: () => {
    const { isTimePaused } = get();
    
    // Don't increment day if time is paused
    if (isTimePaused) {
      console.log('⏸️ Day increment skipped - time is paused');
      return;
    }
    
    console.log('incrementDay called - current day:', get().day);
    set((state) => {
      const newDay = state.day + 1;
      console.log('Setting new day to:', newDay);
      return { day: newDay };
    });
    console.log('After set - day is now:', get().day);
  },

  resetGame: () => {
    console.log('🔄 Resetting entire game state...');
    
    // Reset app store to initial state
    set({
      userLevel: 1,
      experience: 0,
      day: 1,
      activeCharacter: null,
      allocations: {
        study: 40,
        work: 25,
        social: 15,
        rest: 15,
        exercise: 5
      },
      resources: {
        energy: 75,
        stress: 25,
        money: 150,
        knowledge: 100,
        social: 200
      },
      storyletFlags: {},
      activeStoryletIds: [],
      skills: {
        bureaucraticNavigation: {
          id: 'bureaucraticNavigation',
          name: 'Bureaucratic Navigation',
          description: 'Mastery of institutional systems, form-filling, and navigating complex bureaucratic structures efficiently.',
          xp: 0,
          level: 1,
          xpToNextLevel: 100
        },
        resourceAcquisition: {
          id: 'resourceAcquisition',
          name: 'Resource Acquisition',
          description: 'Skill in finding, securing, and optimizing access to materials, funding, and opportunities.',
          xp: 0,
          level: 1,
          xpToNextLevel: 100
        },
        informationWarfare: {
          id: 'informationWarfare',
          name: 'Information Warfare',
          description: 'Strategic intelligence gathering, data analysis, and leveraging information for competitive advantage.',
          xp: 0,
          level: 1,
          xpToNextLevel: 100
        },
        allianceBuilding: {
          id: 'allianceBuilding',
          name: 'Alliance Building',
          description: 'Creating and maintaining strategic partnerships, networking, and coalition formation.',
          xp: 0,
          level: 1,
          xpToNextLevel: 100
        },
        operationalSecurity: {
          id: 'operationalSecurity',
          name: 'Operational Security',
          description: 'Protecting sensitive activities, maintaining discretion, and managing risk in complex operations.',
          xp: 0,
          level: 1,
          xpToNextLevel: 100
        },
        perseverance: {
          id: 'perseverance',
          name: 'Perseverance',
          description: 'Mental toughness and determination to push through difficult challenges and setbacks.',
          xp: 0,
          level: 1,
          xpToNextLevel: 100
        }
      },
      skillEvents: [],
      currentEvent: null,
      activeQuests: [],
      completedQuests: [],
      goals: [],
      tasks: [],
      isSimulationRunning: false,
      lastEventCheck: 0,
      isTimePaused: false
    });
    
    // Reset storylets via storylet store
    try {
      if (typeof window !== 'undefined' && (window as any).useStoryletStore) {
        (window as any).useStoryletStore.getState().resetStorylets();
      }
    } catch (error) {
      console.warn('Could not reset storylets:', error);
    }
    
    // Clear localStorage persistence
    try {
      localStorage.removeItem('life-sim-store');
      localStorage.removeItem('storylet-store');
      localStorage.removeItem('character-store');
    } catch (error) {
      console.warn('Could not clear localStorage:', error);
    }
    
    console.log('✅ Game reset complete! Refresh page for full reset.');
    alert('Game has been reset! Please refresh the page to see the clean state.');
  },
  
  // New simulation methods
  setSimulationRunning: (running) => set({ isSimulationRunning: running }),
  
  getFormattedDate: () => {
    const { day } = get();
    
    // Start date: September 1, 1983
    const startDate = new Date(1983, 8, 1); // Month is 0-indexed, so 8 = September
    
    // Add the number of days (day - 1 because day 1 should be Sept 1)
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + (day - 1));
    
    // Format the date
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric', 
      month: 'short',
      day: 'numeric'
    };
    
    return currentDate.toLocaleDateString('en-US', options);
  },
  
  // Skill management actions
  addSkillXp: (skillId, amount, source = 'Manual') => {
    const { skills } = get();
    const skill = skills[skillId];
    if (!skill) return;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✨ Adding ${amount} XP to ${skill.name} from ${source}`);
    }
    
    // Import skill calculations
    import('../utils/skillCalculations').then(({ getLevelFromXp }) => {
      const newXp = skill.xp + amount;
      const { level, xpToNext } = getLevelFromXp(newXp);
      
      set((state) => ({
        skills: {
          ...state.skills,
          [skillId]: {
            ...skill,
            xp: newXp,
            level,
            xpToNextLevel: xpToNext
          }
        }
      }));
      
      // Add skill event
      get().addSkillEvent({
        skillId,
        amount,
        timestamp: Date.now(),
        source
      });
    });
  },
  
  addSkillEvent: (event) => {
    set((state) => ({
      skillEvents: [...state.skillEvents, event]
    }));
  },
  
  getSkillEvents: (skillId, limit = 10) => {
    const { skillEvents } = get();
    return skillEvents
      .filter(event => event.skillId === skillId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
  
  // Time control functions
  pauseTime: () => {
    console.log('⏸️ Time paused');
    set({ isTimePaused: true });
  },
  
  resumeTime: () => {
    console.log('▶️ Time resumed');
    set({ isTimePaused: false });
  }
}), {
  name: 'life-sim-store',
  partialize: (state) => ({
    activeCharacter: state.activeCharacter,
    allocations: state.allocations,
    resources: state.resources,
    skills: state.skills,
    storyletFlags: state.storyletFlags,
    day: state.day,
    userLevel: state.userLevel,
    experience: state.experience,
    isTimePaused: state.isTimePaused
  })
}));

// Export types for use in components
export type { Quest, Goal, Task, Event, EventChoice };

// Expose store globally for console access
if (typeof window !== 'undefined') {
  (window as any).useAppStore = useAppStore;
}