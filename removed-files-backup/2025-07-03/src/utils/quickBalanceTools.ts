// Quick Balance Analysis Tools
// Provides instant feedback on current game balance without running full simulations

export interface BalanceSnapshot {
  resources: any;
  allocations: any;
  day: number;
  efficiency: {
    knowledgePerDay: number;
    socialPerDay: number;
    moneyPerDay: number;
    overallScore: number;
  };
  warnings: string[];
  recommendations: string[];
  projections: {
    oneWeek: any;
    oneMonth: any;
  };
}

export interface OptimalStrategy {
  name: string;
  description: string;
  allocation: {
    study: number;
    work: number;
    social: number;
    rest: number;
    exercise: number;
  };
  expectedOutcome: {
    knowledgeGain: number;
    socialGain: number;
    moneyGain: number;
    stressLevel: number;
  };
}

// Predefined optimal strategies
export const OPTIMAL_STRATEGIES: OptimalStrategy[] = [
  {
    name: 'Knowledge Maximizer',
    description: 'Maximize knowledge acquisition while maintaining basic needs',
    allocation: { study: 60, work: 15, social: 10, rest: 15, exercise: 0 },
    expectedOutcome: { knowledgeGain: 30, socialGain: 3, moneyGain: 15, stressLevel: 45 }
  },
  {
    name: 'Social Butterfly',
    description: 'Build extensive social networks and connections',
    allocation: { study: 20, work: 15, social: 50, rest: 15, exercise: 0 },
    expectedOutcome: { knowledgeGain: 10, socialGain: 25, moneyGain: 15, stressLevel: 35 }
  },
  {
    name: 'Balanced Growth',
    description: 'Steady progress across all areas without burnout',
    allocation: { study: 35, work: 25, social: 25, rest: 15, exercise: 0 },
    expectedOutcome: { knowledgeGain: 18, socialGain: 13, moneyGain: 25, stressLevel: 40 }
  },
  {
    name: 'Financial Focus',
    description: 'Prioritize earning money and financial security',
    allocation: { study: 20, work: 60, social: 5, rest: 15, exercise: 0 },
    expectedOutcome: { knowledgeGain: 10, socialGain: 2, moneyGain: 60, stressLevel: 50 }
  },
  {
    name: 'Wellness Focused',
    description: 'Prioritize mental and physical health for sustainability',
    allocation: { study: 25, work: 25, social: 20, rest: 20, exercise: 10 },
    expectedOutcome: { knowledgeGain: 13, socialGain: 10, moneyGain: 25, stressLevel: 25 }
  }
];

export class QuickBalanceAnalyzer {
  // Analyze current game state and provide instant feedback
  public static analyzeCurrentBalance(): BalanceSnapshot | null {
    if (typeof window === 'undefined' || !(window as any).useAppStore) {
      return null;
    }

    const appStore = (window as any).useAppStore.getState();
    const resources = appStore.resources;
    const allocations = appStore.allocations;
    const day = appStore.day;

    // Calculate efficiency metrics
    const efficiency = {
      knowledgePerDay: day > 0 ? resources.knowledge / day : 0,
      socialPerDay: day > 0 ? resources.social / day : 0,
      moneyPerDay: day > 0 ? resources.money / day : 0,
      overallScore: 0
    };

    efficiency.overallScore = (
      efficiency.knowledgePerDay * 0.4 +
      efficiency.socialPerDay * 0.3 +
      (efficiency.moneyPerDay * 0.2) +
      ((100 - resources.stress) * 0.1)
    );

    // Generate warnings
    const warnings = [];
    if (resources.energy < 30) warnings.push('⚠️ Low Energy - increase rest allocation');
    if (resources.stress > 70) warnings.push('⚠️ High Stress - reduce work/study allocation');
    if (resources.money < 50) warnings.push('💰 Low Money - increase work allocation');
    if (efficiency.knowledgePerDay < 2) warnings.push('📚 Knowledge growth too slow - increase study');
    if (efficiency.socialPerDay < 1.5) warnings.push('👥 Social development lagging - increase social time');
    if (Object.values(allocations).reduce((sum: number, val: number) => sum + val, 0) !== 100) {
      warnings.push('⚖️ Time allocation doesn\'t total 100%');
    }

    // Generate recommendations
    const recommendations = [];
    if (resources.stress > 60 && allocations.rest < 20) {
      recommendations.push('💤 Increase rest to 20% to manage stress');
    }
    if (efficiency.knowledgePerDay > 5 && efficiency.socialPerDay < 1) {
      recommendations.push('🎯 Consider shifting some study time to social activities for balance');
    }
    if (resources.money > 200 && allocations.work > 40) {
      recommendations.push('📚 You have sufficient money - consider reducing work for more study/social time');
    }
    if (resources.energy > 80 && allocations.exercise === 0) {
      recommendations.push('💪 High energy levels - consider adding exercise for long-term benefits');
    }

    // Simple projections
    const weeklyGains = this.calculateWeeklyProjection(allocations, resources);
    const monthlyGains = {
      knowledge: weeklyGains.knowledge * 4,
      social: weeklyGains.social * 4,
      money: weeklyGains.money * 4,
      stress: Math.min(100, resources.stress + (weeklyGains.stress * 4)),
      energy: Math.max(0, Math.min(100, resources.energy + (weeklyGains.energy * 4)))
    };

    return {
      resources,
      allocations,
      day,
      efficiency,
      warnings,
      recommendations,
      projections: {
        oneWeek: {
          ...resources,
          knowledge: resources.knowledge + weeklyGains.knowledge,
          social: resources.social + weeklyGains.social,
          money: resources.money + weeklyGains.money,
          stress: Math.min(100, resources.stress + weeklyGains.stress),
          energy: Math.max(0, Math.min(100, resources.energy + weeklyGains.energy))
        },
        oneMonth: {
          ...resources,
          knowledge: resources.knowledge + monthlyGains.knowledge,
          social: resources.social + monthlyGains.social,
          money: resources.money + monthlyGains.money,
          stress: monthlyGains.stress,
          energy: monthlyGains.energy
        }
      }
    };
  }

  // Calculate expected gains over one week with current allocation
  private static calculateWeeklyProjection(allocations: any, currentResources: any) {
    // Simplified calculation - could be enhanced with proper character modifiers
    const baseRates = {
      study: { knowledge: 5.1, stress: 0.1, energy: -0.1 },
      work: { money: 1.0, knowledge: 0.1, stress: 0.1, energy: -0.1 },
      social: { social: 1.0, stress: -0.1, money: -0.4 },
      rest: { energy: 0.1, stress: -0.5 },
      exercise: { energy: 0.05, stress: -0.1, social: 0.1 }
    };

    const weeklyGains = { knowledge: 0, social: 0, money: 0, stress: 0, energy: 0 };

    Object.entries(allocations).forEach(([activity, percent]: [string, any]) => {
      const hoursPerWeek = (percent / 100) * 168; // 168 hours in a week
      const rates = baseRates[activity as keyof typeof baseRates];
      
      if (rates) {
        Object.entries(rates).forEach(([resource, rate]: [string, any]) => {
          if (weeklyGains.hasOwnProperty(resource)) {
            weeklyGains[resource as keyof typeof weeklyGains] += rate * hoursPerWeek;
          }
        });
      }
    });

    return weeklyGains;
  }

  // Compare current strategy against optimal strategies
  public static compareToOptimalStrategies(): any {
    const current = this.analyzeCurrentBalance();
    if (!current) return null;

    const comparisons = OPTIMAL_STRATEGIES.map(strategy => {
      // Calculate similarity score
      const allocDiff = Object.entries(strategy.allocation).reduce((total, [key, value]) => {
        return total + Math.abs(value - (current.allocations[key] || 0));
      }, 0);
      
      const similarity = Math.max(0, 100 - allocDiff) / 100;

      // Estimate performance difference
      const projectedWeekly = this.calculateWeeklyProjection(strategy.allocation, current.resources);
      const currentWeekly = this.calculateWeeklyProjection(current.allocations, current.resources);
      
      const performanceDiff = {
        knowledge: projectedWeekly.knowledge - currentWeekly.knowledge,
        social: projectedWeekly.social - currentWeekly.social,
        money: projectedWeekly.money - currentWeekly.money,
        stress: projectedWeekly.stress - currentWeekly.stress
      };

      return {
        strategy,
        similarity,
        performanceDiff,
        recommendation: similarity > 0.8 ? 'You\'re already following this strategy!' :
                       similarity > 0.6 ? 'Close to this strategy - minor adjustments needed' :
                       'Consider this alternative approach'
      };
    });

    return {
      currentStrategy: current,
      comparisons: comparisons.sort((a, b) => b.similarity - a.similarity)
    };
  }

  // Detect bottlenecks and suggest immediate fixes
  public static detectBottlenecks(): any {
    const current = this.analyzeCurrentBalance();
    if (!current) return null;

    const bottlenecks = [];
    const solutions = [];

    // Energy bottleneck
    if (current.resources.energy < 30) {
      bottlenecks.push({
        type: 'energy',
        severity: 'high',
        description: 'Low energy is limiting daily activities',
        currentValue: current.resources.energy,
        threshold: 30
      });
      solutions.push({
        action: 'Increase rest allocation',
        from: current.allocations.rest,
        to: Math.min(30, current.allocations.rest + 10),
        expectedImprovement: '+15 energy over 3 days'
      });
    }

    // Stress bottleneck
    if (current.resources.stress > 70) {
      bottlenecks.push({
        type: 'stress',
        severity: 'high',
        description: 'High stress is affecting performance and wellbeing',
        currentValue: current.resources.stress,
        threshold: 70
      });
      
      if (current.allocations.work > 40) {
        solutions.push({
          action: 'Reduce work allocation',
          from: current.allocations.work,
          to: Math.max(20, current.allocations.work - 15),
          expectedImprovement: '-20 stress over 5 days'
        });
      }
      
      if (current.allocations.study > 50) {
        solutions.push({
          action: 'Reduce study allocation',
          from: current.allocations.study,
          to: Math.max(30, current.allocations.study - 10),
          expectedImprovement: '-15 stress over 5 days'
        });
      }
    }

    // Money bottleneck
    if (current.resources.money < 50) {
      bottlenecks.push({
        type: 'money',
        severity: 'medium',
        description: 'Low funds may limit future opportunities',
        currentValue: current.resources.money,
        threshold: 50
      });
      solutions.push({
        action: 'Increase work allocation',
        from: current.allocations.work,
        to: Math.min(50, current.allocations.work + 15),
        expectedImprovement: '+100 money over 7 days'
      });
    }

    // Knowledge progression bottleneck
    if (current.efficiency.knowledgePerDay < 2 && current.day > 7) {
      bottlenecks.push({
        type: 'knowledge',
        severity: 'medium',
        description: 'Knowledge growth is slower than expected',
        currentValue: current.efficiency.knowledgePerDay,
        threshold: 2
      });
      solutions.push({
        action: 'Increase study allocation',
        from: current.allocations.study,
        to: Math.min(60, current.allocations.study + 15),
        expectedImprovement: '+3 knowledge per day'
      });
    }

    return {
      bottlenecks,
      solutions,
      priority: bottlenecks.length > 0 ? bottlenecks[0].type : null,
      overallHealth: bottlenecks.filter(b => b.severity === 'high').length === 0 ? 'good' : 'needs_attention'
    };
  }

  // Generate automated balance report
  public static generateBalanceReport(): string {
    const analysis = this.analyzeCurrentBalance();
    const bottlenecks = this.detectBottlenecks();
    const strategyComparison = this.compareToOptimalStrategies();

    if (!analysis || !bottlenecks || !strategyComparison) {
      return 'Unable to generate balance report - game state not available';
    }

    let report = '📊 BALANCE ANALYSIS REPORT\n';
    report += '================================\n\n';

    // Current Status
    report += '📈 CURRENT STATUS:\n';
    report += `Day: ${analysis.day}\n`;
    report += `Overall Score: ${analysis.efficiency.overallScore.toFixed(1)}\n`;
    report += `Knowledge/Day: ${analysis.efficiency.knowledgePerDay.toFixed(1)}\n`;
    report += `Social/Day: ${analysis.efficiency.socialPerDay.toFixed(1)}\n`;
    report += `Money/Day: ${analysis.efficiency.moneyPerDay.toFixed(1)}\n\n`;

    // Health Check
    report += `🏥 HEALTH CHECK: ${bottlenecks.overallHealth.toUpperCase()}\n`;
    if (bottlenecks.bottlenecks.length > 0) {
      report += 'Issues detected:\n';
      bottlenecks.bottlenecks.forEach((bottleneck: any) => {
        report += `  • ${bottleneck.description} (${bottleneck.currentValue.toFixed(1)})\n`;
      });
    } else {
      report += 'No critical issues detected!\n';
    }
    report += '\n';

    // Recommendations
    if (analysis.recommendations.length > 0) {
      report += '💡 RECOMMENDATIONS:\n';
      analysis.recommendations.forEach(rec => {
        report += `  • ${rec}\n`;
      });
      report += '\n';
    }

    // Strategy Match
    const topMatch = strategyComparison.comparisons[0];
    report += '🎯 STRATEGY ANALYSIS:\n';
    report += `Best match: ${topMatch.strategy.name} (${(topMatch.similarity * 100).toFixed(0)}% similar)\n`;
    report += `${topMatch.recommendation}\n\n`;

    // Projections
    report += '🔮 PROJECTIONS:\n';
    report += 'One week from now:\n';
    Object.entries(analysis.projections.oneWeek).forEach(([resource, value]: [string, any]) => {
      if (typeof value === 'number') {
        const change = value - analysis.resources[resource];
        const sign = change >= 0 ? '+' : '';
        report += `  ${resource}: ${value.toFixed(0)} (${sign}${change.toFixed(0)})\n`;
      }
    });

    return report;
  }
}

// Make available globally for console access
if (typeof window !== 'undefined') {
  (window as any).QuickBalanceAnalyzer = QuickBalanceAnalyzer;
  (window as any).OPTIMAL_STRATEGIES = OPTIMAL_STRATEGIES;
  
  // Convenience functions
  (window as any).analyzeBalance = () => {
    const report = QuickBalanceAnalyzer.generateBalanceReport();
    console.log(report);
    return QuickBalanceAnalyzer.analyzeCurrentBalance();
  };
  
  (window as any).checkBottlenecks = () => {
    const bottlenecks = QuickBalanceAnalyzer.detectBottlenecks();
    console.log('🚨 BOTTLENECK ANALYSIS:', bottlenecks);
    return bottlenecks;
  };
  
  (window as any).compareStrategies = () => {
    const comparison = QuickBalanceAnalyzer.compareToOptimalStrategies();
    console.log('🎯 STRATEGY COMPARISON:', comparison);
    return comparison;
  };
}