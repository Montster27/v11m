// Balance Testing System for Life Simulation Game
// Implements Monte Carlo simulation, stress testing, and metrics tracking

import { calculateResourceDeltas, calculateDomainResourceEffects } from './resourceCalculations';
import { IntegratedCharacter, DomainKey } from '../types/integratedCharacter';
import type { Character } from '../store/characterStore';

// Player archetype definitions for simulation
export interface PlayerArchetype {
  id: string;
  name: string;
  description: string;
  timeAllocationStrategy: (day: number, resources: any) => {
    study: number;
    work: number;
    social: number;
    rest: number;
    exercise: number;
  };
  decisionBias: {
    riskTolerance: number; // 0-1, affects choice selection
    socialPreference: number; // 0-1, prefers social activities
    academicFocus: number; // 0-1, prioritizes study
    balanceSeeker: number; // 0-1, tries to balance everything
  };
}

// Simulation result data structure
export interface SimulationResult {
  playerId: string;
  archetype: string;
  finalDay: number;
  finalResources: {
    energy: number;
    stress: number;
    knowledge: number;
    social: number;
    money: number;
  };
  finalDomains?: Record<DomainKey, number>;
  progressionCurve: {
    day: number;
    resources: any;
    domains?: any;
  }[];
  questsCompleted: number;
  storyletsCompleted: number;
  cluesTotalDiscovered: number;
  bottlenecks: string[];
  achievements: string[];
  playTime: number; // simulation time in ms
}

// Aggregated analysis results
export interface SimulationAnalysis {
  totalRuns: number;
  averageResults: {
    finalResources: any;
    questsCompleted: number;
    storyletsCompleted: number;
  };
  resourceProgression: {
    [resource: string]: {
      day: number;
      min: number;
      max: number;
      average: number;
      percentile25: number;
      percentile75: number;
    }[];
  };
  archetypeComparison: {
    [archetype: string]: {
      performance: number;
      strengths: string[];
      weaknesses: string[];
    };
  };
  balanceIssues: {
    overpoweredStrategies: string[];
    underpoweredStrategies: string[];
    resourceBottlenecks: string[];
    progressionProblems: string[];
  };
}

// Default player archetypes for testing
export const DEFAULT_ARCHETYPES: PlayerArchetype[] = [
  {
    id: 'academic-focused',
    name: 'Academic Focused',
    description: 'Prioritizes studying and knowledge acquisition',
    timeAllocationStrategy: (day, resources) => ({
      study: Math.min(70, 40 + (day * 0.5)), // Increases study over time
      work: 15,
      social: 5,
      rest: 10,
      exercise: 0
    }),
    decisionBias: {
      riskTolerance: 0.3,
      socialPreference: 0.2,
      academicFocus: 0.9,
      balanceSeeker: 0.1
    }
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Maximizes social connections and networking',
    timeAllocationStrategy: (day, resources) => ({
      study: 20,
      work: 15,
      social: Math.min(60, 30 + (day * 0.3)),
      rest: 5,
      exercise: 0
    }),
    decisionBias: {
      riskTolerance: 0.7,
      socialPreference: 0.9,
      academicFocus: 0.2,
      balanceSeeker: 0.3
    }
  },
  {
    id: 'balanced-optimizer',
    name: 'Balanced Optimizer',
    description: 'Tries to maintain optimal balance across all areas',
    timeAllocationStrategy: (day, resources) => {
      // Dynamic allocation based on current resource levels
      const total = Object.values(resources).reduce((sum: number, val: number) => sum + val, 0);
      const avg = total / 5;
      
      return {
        study: resources.knowledge < avg ? 35 : 25,
        work: resources.money < avg ? 30 : 20,
        social: resources.social < avg ? 25 : 15,
        rest: resources.stress > avg ? 15 : 10,
        exercise: resources.energy < avg ? 10 : 5
      };
    },
    decisionBias: {
      riskTolerance: 0.5,
      socialPreference: 0.5,
      academicFocus: 0.5,
      balanceSeeker: 0.9
    }
  },
  {
    id: 'grind-focused',
    name: 'Grind Focused',
    description: 'Works constantly for maximum resource accumulation',
    timeAllocationStrategy: (day, resources) => ({
      study: 25,
      work: Math.min(65, 35 + (day * 0.4)),
      social: 0,
      rest: 10,
      exercise: 0
    }),
    decisionBias: {
      riskTolerance: 0.2,
      socialPreference: 0.1,
      academicFocus: 0.4,
      balanceSeeker: 0.1
    }
  },
  {
    id: 'wellness-focused',
    name: 'Wellness Focused',
    description: 'Prioritizes mental and physical health',
    timeAllocationStrategy: (day, resources) => ({
      study: 20,
      work: 20,
      social: 15,
      rest: Math.max(20, 30 - (resources.stress * 0.1)),
      exercise: Math.min(25, 5 + (day * 0.2))
    }),
    decisionBias: {
      riskTolerance: 0.4,
      socialPreference: 0.6,
      academicFocus: 0.3,
      balanceSeeker: 0.7
    }
  }
];

// Main Balance Simulator class
export class BalanceSimulator {
  private progressCallback?: (progress: number, message: string) => void;

  constructor(progressCallback?: (progress: number, message: string) => void) {
    this.progressCallback = progressCallback;
  }

  // Create a test character for simulation
  private createTestCharacter(): IntegratedCharacter {
    return {
      id: `test-char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test Character',
      version: 2,
      createdAt: new Date(),
      
      // Starting domain levels (moderate across all domains)
      intellectualCompetence: {
        level: 25,
        experience: 0,
        components: {
          reasoning: 25,
          innovation: 25,
          retention: 25
        }
      },
      physicalCompetence: {
        level: 25,
        experience: 0,
        components: {
          power: 25,
          coordination: 25,
          discipline: 25
        }
      },
      emotionalIntelligence: {
        level: 25,
        experience: 0,
        components: {
          awareness: 25,
          regulation: 25,
          resilience: 25
        }
      },
      socialCompetence: {
        level: 25,
        experience: 0,
        components: {
          connection: 25,
          communication: 25,
          relationships: 25
        }
      },
      personalAutonomy: {
        level: 25,
        experience: 0,
        components: {
          independence: 25,
          interdependence: 25,
          responsibility: 25
        }
      },
      identityClarity: {
        level: 25,
        experience: 0,
        components: {
          confidence: 25,
          values: 25,
          purpose: 25
        }
      },
      lifePurpose: {
        level: 25,
        experience: 0,
        components: {
          direction: 25,
          meaning: 25,
          contribution: 25
        }
      },
      
      // Development tracking
      developmentStage: 'exploration',
      overallDevelopmentLevel: 25,
      experiencePoints: 0,
      
      // Metadata
      currentFocus: null,
      notes: 'Test character for balance simulation'
    };
  }

  // Simulate a single gameplay session
  private async simulateGameplay(
    character: IntegratedCharacter,
    archetype: PlayerArchetype,
    dayLength: number
  ): Promise<SimulationResult> {
    const startTime = Date.now();
    const result: SimulationResult = {
      playerId: character.id,
      archetype: archetype.id,
      finalDay: 0,
      finalResources: {
        energy: 75,
        stress: 25,
        knowledge: 50,
        social: 50,
        money: 150
      },
      finalDomains: {
        intellectualCompetence: character.intellectualCompetence.level,
        physicalCompetence: character.physicalCompetence.level,
        emotionalIntelligence: character.emotionalIntelligence.level,
        socialCompetence: character.socialCompetence.level,
        personalAutonomy: character.personalAutonomy.level,
        identityClarity: character.identityClarity.level,
        lifePurpose: character.lifePurpose.level
      },
      progressionCurve: [],
      questsCompleted: 0,
      storyletsCompleted: 0,
      cluesTotalDiscovered: 0,
      bottlenecks: [],
      achievements: [],
      playTime: 0
    };

    // Initial resources
    let resources = { ...result.finalResources };
    let domains = { ...result.finalDomains };

    // Simulate each day
    for (let day = 1; day <= dayLength; day++) {
      // Get time allocation strategy for this day
      const allocation = archetype.timeAllocationStrategy(day, resources);
      
      // Ensure allocation totals 100%
      const total = Object.values(allocation).reduce((sum, val) => sum + val, 0);
      if (total !== 100) {
        const factor = 100 / total;
        Object.keys(allocation).forEach(key => {
          allocation[key as keyof typeof allocation] *= factor;
        });
      }

      // Calculate resource changes
      const { deltas, domainXP } = calculateDomainResourceEffects(
        allocation,
        character,
        24 // Full day simulation
      );

      // Apply resource changes
      resources.energy = Math.max(0, Math.min(100, resources.energy + deltas.energy));
      resources.stress = Math.max(0, Math.min(100, resources.stress + deltas.stress));
      resources.knowledge = Math.max(0, resources.knowledge + deltas.knowledge);
      resources.social = Math.max(0, resources.social + deltas.social);
      resources.money = Math.max(0, resources.money + deltas.money);

      // Apply domain XP and level progression
      Object.entries(domainXP).forEach(([domain, xp]) => {
        const domainKey = domain as DomainKey;
        domains[domainKey] = Math.min(100, domains[domainKey] + (xp / 10)); // Scale XP to level progression
      });

      // Track progression
      if (day % 5 === 0 || day === dayLength) { // Sample every 5 days
        result.progressionCurve.push({
          day,
          resources: { ...resources },
          domains: { ...domains }
        });
      }

      // Detect bottlenecks
      if (resources.energy < 10) result.bottlenecks.push(`Low energy on day ${day}`);
      if (resources.stress > 90) result.bottlenecks.push(`High stress on day ${day}`);
      if (resources.money < 0) result.bottlenecks.push(`Negative money on day ${day}`);

      // Simulate random events (quest/storylet completion)
      if (Math.random() < 0.1) result.questsCompleted++;
      if (Math.random() < 0.15) result.storyletsCompleted++;
      if (Math.random() < 0.05) result.cluesTotalDiscovered++;

      // Update progress
      if (this.progressCallback && day % 10 === 0) {
        this.progressCallback(day / dayLength, `Simulating day ${day}/${dayLength} for ${archetype.name}`);
      }
    }

    // Final results
    result.finalDay = dayLength;
    result.finalResources = resources;
    result.finalDomains = domains;
    result.playTime = Date.now() - startTime;

    // Evaluate achievements
    if (resources.knowledge > 200) result.achievements.push('Knowledge Master');
    if (resources.social > 200) result.achievements.push('Social Butterfly');
    if (Object.values(domains).every(level => level > 50)) result.achievements.push('Well Rounded');
    if (result.questsCompleted > dayLength * 0.2) result.achievements.push('Quest Champion');

    return result;
  }

  // Run Monte Carlo simulation with multiple iterations
  public async runSimulation(
    iterations: number = 100,
    dayLength: number = 30,
    archetypes: PlayerArchetype[] = DEFAULT_ARCHETYPES
  ): Promise<SimulationAnalysis> {
    const results: SimulationResult[] = [];
    const totalRuns = iterations * archetypes.length;
    let completedRuns = 0;

    if (this.progressCallback) {
      this.progressCallback(0, 'Starting balance simulation...');
    }

    // Run simulations for each archetype
    for (const archetype of archetypes) {
      for (let i = 0; i < iterations; i++) {
        const character = this.createTestCharacter();
        const result = await this.simulateGameplay(character, archetype, dayLength);
        results.push(result);
        
        completedRuns++;
        if (this.progressCallback) {
          this.progressCallback(
            completedRuns / totalRuns,
            `Completed ${completedRuns}/${totalRuns} simulations`
          );
        }
      }
    }

    return this.analyzeResults(results);
  }

  // Analyze simulation results and identify balance issues
  private analyzeResults(results: SimulationResult[]): SimulationAnalysis {
    const analysis: SimulationAnalysis = {
      totalRuns: results.length,
      averageResults: {
        finalResources: {},
        questsCompleted: 0,
        storyletsCompleted: 0
      },
      resourceProgression: {},
      archetypeComparison: {},
      balanceIssues: {
        overpoweredStrategies: [],
        underpoweredStrategies: [],
        resourceBottlenecks: [],
        progressionProblems: []
      }
    };

    // Calculate averages
    const resourceKeys = ['energy', 'stress', 'knowledge', 'social', 'money'];
    resourceKeys.forEach(resource => {
      const values = results.map(r => r.finalResources[resource as keyof typeof r.finalResources]);
      analysis.averageResults.finalResources[resource] = {
        min: Math.min(...values),
        max: Math.max(...values),
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        std: this.calculateStandardDeviation(values)
      };
    });

    analysis.averageResults.questsCompleted = 
      results.reduce((sum, r) => sum + r.questsCompleted, 0) / results.length;
    analysis.averageResults.storyletsCompleted = 
      results.reduce((sum, r) => sum + r.storyletsCompleted, 0) / results.length;

    // Archetype comparison
    const archetypeGroups = this.groupBy(results, 'archetype');
    Object.entries(archetypeGroups).forEach(([archetype, archetypeResults]) => {
      const avgKnowledge = archetypeResults.reduce((sum, r) => sum + r.finalResources.knowledge, 0) / archetypeResults.length;
      const avgSocial = archetypeResults.reduce((sum, r) => sum + r.finalResources.social, 0) / archetypeResults.length;
      const avgQuests = archetypeResults.reduce((sum, r) => sum + r.questsCompleted, 0) / archetypeResults.length;
      
      const performance = (avgKnowledge + avgSocial + (avgQuests * 50)) / 3; // Composite score
      
      analysis.archetypeComparison[archetype] = {
        performance,
        strengths: this.identifyStrengths(archetypeResults),
        weaknesses: this.identifyWeaknesses(archetypeResults)
      };
    });

    // Identify balance issues
    analysis.balanceIssues = this.identifyBalanceIssues(results, analysis.archetypeComparison);

    return analysis;
  }

  // Helper methods
  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private calculateStandardDeviation(values: number[]): number {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private identifyStrengths(results: SimulationResult[]): string[] {
    const strengths: string[] = [];
    const avgKnowledge = results.reduce((sum, r) => sum + r.finalResources.knowledge, 0) / results.length;
    const avgSocial = results.reduce((sum, r) => sum + r.finalResources.social, 0) / results.length;
    const avgMoney = results.reduce((sum, r) => sum + r.finalResources.money, 0) / results.length;
    
    if (avgKnowledge > 150) strengths.push('High Knowledge Acquisition');
    if (avgSocial > 150) strengths.push('Strong Social Development');
    if (avgMoney > 300) strengths.push('Excellent Money Management');
    if (results.every(r => r.bottlenecks.length < 3)) strengths.push('Consistent Performance');
    
    return strengths;
  }

  private identifyWeaknesses(results: SimulationResult[]): string[] {
    const weaknesses: string[] = [];
    const avgStress = results.reduce((sum, r) => sum + r.finalResources.stress, 0) / results.length;
    const avgEnergy = results.reduce((sum, r) => sum + r.finalResources.energy, 0) / results.length;
    const bottleneckRate = results.filter(r => r.bottlenecks.length > 5).length / results.length;
    
    if (avgStress > 60) weaknesses.push('High Stress Levels');
    if (avgEnergy < 40) weaknesses.push('Low Energy Management');
    if (bottleneckRate > 0.3) weaknesses.push('Frequent Resource Bottlenecks');
    
    return weaknesses;
  }

  private identifyBalanceIssues(
    results: SimulationResult[],
    archetypeComparison: any
  ): SimulationAnalysis['balanceIssues'] {
    const issues = {
      overpoweredStrategies: [] as string[],
      underpoweredStrategies: [] as string[],
      resourceBottlenecks: [] as string[],
      progressionProblems: [] as string[]
    };

    // Find overpowered/underpowered strategies
    const performances = Object.entries(archetypeComparison).map(([name, data]: [string, any]) => ({
      name,
      performance: data.performance
    }));
    
    const avgPerformance = performances.reduce((sum, p) => sum + p.performance, 0) / performances.length;
    const std = this.calculateStandardDeviation(performances.map(p => p.performance));
    
    performances.forEach(p => {
      if (p.performance > avgPerformance + std) {
        issues.overpoweredStrategies.push(p.name);
      } else if (p.performance < avgPerformance - std) {
        issues.underpoweredStrategies.push(p.name);
      }
    });

    // Identify resource bottlenecks
    const commonBottlenecks = results.flatMap(r => r.bottlenecks);
    const bottleneckCounts = commonBottlenecks.reduce((counts, bottleneck) => {
      counts[bottleneck] = (counts[bottleneck] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    Object.entries(bottleneckCounts).forEach(([bottleneck, count]) => {
      if (count > results.length * 0.2) { // Appears in >20% of runs
        issues.resourceBottlenecks.push(bottleneck);
      }
    });

    return issues;
  }

  // Stress testing methods
  public async runStressTests(): Promise<any> {
    const stressResults = [];

    // Test extreme allocations
    const extremeAllocations = [
      { name: 'All Study', allocation: { study: 100, work: 0, social: 0, rest: 0, exercise: 0 } },
      { name: 'All Work', allocation: { study: 0, work: 100, social: 0, rest: 0, exercise: 0 } },
      { name: 'All Social', allocation: { study: 0, work: 0, social: 100, rest: 0, exercise: 0 } },
      { name: 'No Rest', allocation: { study: 40, work: 30, social: 30, rest: 0, exercise: 0 } },
      { name: 'All Rest', allocation: { study: 0, work: 0, social: 0, rest: 100, exercise: 0 } }
    ];

    for (const test of extremeAllocations) {
      const character = this.createTestCharacter();
      // Create custom archetype for this test
      const testArchetype: PlayerArchetype = {
        id: `stress-test-${test.name}`,
        name: test.name,
        description: `Stress test: ${test.name}`,
        timeAllocationStrategy: () => test.allocation,
        decisionBias: {
          riskTolerance: 0.5,
          socialPreference: 0.5,
          academicFocus: 0.5,
          balanceSeeker: 0.5
        }
      };

      const result = await this.simulateGameplay(character, testArchetype, 30);
      stressResults.push({
        testName: test.name,
        result: result,
        broken: result.bottlenecks.length > 10 || result.finalResources.energy < 5
      });
    }

    return stressResults;
  }
}

// Export simulation utilities for global access
if (typeof window !== 'undefined') {
  (window as any).BalanceSimulator = BalanceSimulator;
  (window as any).DEFAULT_ARCHETYPES = DEFAULT_ARCHETYPES;
}