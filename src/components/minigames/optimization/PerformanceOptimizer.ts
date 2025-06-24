// /Users/montysharma/V11M2/src/components/minigames/optimization/PerformanceOptimizer.ts
// Performance optimization utilities for minigame system

interface PerformanceMetrics {
  frameRate: number;
  memoryUsage: number;
  renderTime: number;
  updateCount: number;
}

interface OptimizationSuggestion {
  type: 'memory' | 'performance' | 'rendering' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action: string;
  impact: string;
}

class PerformanceOptimizer {
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsHistory = 100;
  private lastCleanup = Date.now();
  private cleanupInterval = 60000; // 1 minute

  // Add performance metric
  addMetric(metric: PerformanceMetrics): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    } as any);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Periodic cleanup
    this.periodicCleanup();
  }

  // Analyze performance and provide suggestions
  analyzePerformance(): OptimizationSuggestion[] {
    if (this.metrics.length < 10) {
      return [{
        type: 'general',
        priority: 'low',
        description: 'Insufficient data for analysis',
        action: 'Continue playing games to gather performance data',
        impact: 'Better optimization recommendations'
      }];
    }

    const suggestions: OptimizationSuggestion[] = [];
    const recentMetrics = this.metrics.slice(-20); // Last 20 metrics
    
    // Analyze frame rate
    const avgFrameRate = recentMetrics.reduce((sum, m) => sum + m.frameRate, 0) / recentMetrics.length;
    if (avgFrameRate < 30) {
      suggestions.push({
        type: 'performance',
        priority: 'critical',
        description: `Low frame rate detected (${avgFrameRate.toFixed(1)} fps)`,
        action: 'Reduce visual effects, close other applications',
        impact: 'Smoother gameplay experience'
      });
    } else if (avgFrameRate < 45) {
      suggestions.push({
        type: 'performance',
        priority: 'medium',
        description: `Frame rate could be improved (${avgFrameRate.toFixed(1)} fps)`,
        action: 'Consider reducing browser tabs or background processes',
        impact: 'Better responsiveness'
      });
    }

    // Analyze memory usage
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    if (avgMemory > 200) {
      suggestions.push({
        type: 'memory',
        priority: 'high',
        description: `High memory usage (${avgMemory.toFixed(1)}MB)`,
        action: 'Restart browser, close unused tabs',
        impact: 'Prevent crashes and improve stability'
      });
    } else if (avgMemory > 100) {
      suggestions.push({
        type: 'memory',
        priority: 'medium',
        description: `Elevated memory usage (${avgMemory.toFixed(1)}MB)`,
        action: 'Monitor memory usage, consider restarting occasionally',
        impact: 'Maintain optimal performance'
      });
    }

    // Analyze render time
    const avgRenderTime = recentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / recentMetrics.length;
    if (avgRenderTime > 16) {
      suggestions.push({
        type: 'rendering',
        priority: 'medium',
        description: `Slow rendering detected (${avgRenderTime.toFixed(2)}ms)`,
        action: 'Update graphics drivers, enable hardware acceleration',
        impact: 'Faster game loading and smoother animations'
      });
    }

    // Memory leak detection
    const memoryTrend = this.detectMemoryTrend();
    if (memoryTrend > 2) {
      suggestions.push({
        type: 'memory',
        priority: 'high',
        description: 'Potential memory leak detected',
        action: 'Restart browser session',
        impact: 'Prevent progressive performance degradation'
      });
    }

    return suggestions;
  }

  // Detect memory usage trends
  private detectMemoryTrend(): number {
    if (this.metrics.length < 50) return 0;

    const recent = this.metrics.slice(-25);
    const older = this.metrics.slice(-50, -25);

    const recentAvg = recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.memoryUsage, 0) / older.length;

    return recentAvg - olderAvg; // Positive indicates increasing memory usage
  }

  // Get performance grade
  getPerformanceGrade(): { grade: string; score: number; color: string } {
    if (this.metrics.length === 0) {
      return { grade: 'N/A', score: 0, color: 'gray' };
    }

    const recent = this.metrics.slice(-10);
    const avgFrameRate = recent.reduce((sum, m) => sum + m.frameRate, 0) / recent.length;
    const avgMemory = recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length;
    const avgRenderTime = recent.reduce((sum, m) => sum + m.renderTime, 0) / recent.length;

    // Calculate score (0-100)
    const frameScore = Math.min(100, (avgFrameRate / 60) * 40);
    const memoryScore = Math.max(0, (200 - avgMemory) / 200 * 30);
    const renderScore = Math.max(0, (16 - avgRenderTime) / 16 * 30);

    const totalScore = frameScore + memoryScore + renderScore;

    let grade: string;
    let color: string;

    if (totalScore >= 85) {
      grade = 'A';
      color = 'green';
    } else if (totalScore >= 70) {
      grade = 'B';
      color = 'blue';
    } else if (totalScore >= 55) {
      grade = 'C';
      color = 'yellow';
    } else if (totalScore >= 40) {
      grade = 'D';
      color = 'orange';
    } else {
      grade = 'F';
      color = 'red';
    }

    return { grade, score: Math.round(totalScore), color };
  }

  // Auto-optimization features
  enableAutoOptimization(): void {
    // Automatically adjust settings based on performance
    const suggestions = this.analyzePerformance();
    const criticalIssues = suggestions.filter(s => s.priority === 'critical');

    if (criticalIssues.length > 0) {
      console.log('🔧 Auto-optimization: Reducing effects due to performance issues');
      this.reduceVisualEffects();
    }
  }

  private reduceVisualEffects(): void {
    // This would integrate with the minigame settings to reduce visual complexity
    const event = new CustomEvent('minigame:reduceEffects', {
      detail: { reason: 'performance' }
    });
    window.dispatchEvent(event);
  }

  // Periodic cleanup to prevent memory leaks
  private periodicCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.cleanup();
      this.lastCleanup = now;
    }
  }

  private cleanup(): void {
    // Clear old metrics
    const cutoff = Date.now() - (5 * 60 * 1000); // Keep last 5 minutes
    this.metrics = this.metrics.filter(m => (m as any).timestamp > cutoff);

    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }

    console.log('🧹 Performance optimizer: Cleaned up old metrics');
  }

  // Get detailed performance report
  getPerformanceReport(): {
    summary: any;
    suggestions: OptimizationSuggestion[];
    grade: any;
    history: PerformanceMetrics[];
  } {
    const recent = this.metrics.slice(-20);
    
    const summary = {
      avgFrameRate: recent.length > 0 ? recent.reduce((sum, m) => sum + m.frameRate, 0) / recent.length : 0,
      avgMemoryUsage: recent.length > 0 ? recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length : 0,
      avgRenderTime: recent.length > 0 ? recent.reduce((sum, m) => sum + m.renderTime, 0) / recent.length : 0,
      totalSamples: this.metrics.length,
      memoryTrend: this.detectMemoryTrend()
    };

    return {
      summary,
      suggestions: this.analyzePerformance(),
      grade: this.getPerformanceGrade(),
      history: this.metrics.slice(-50) // Last 50 samples
    };
  }

  // Reset all metrics
  reset(): void {
    this.metrics = [];
    console.log('🔄 Performance optimizer: Reset all metrics');
  }
}

// Singleton instance
const performanceOptimizer = new PerformanceOptimizer();

// Export functions for console access
export const getPerformanceReport = () => performanceOptimizer.getPerformanceReport();
export const enableAutoOptimization = () => performanceOptimizer.enableAutoOptimization();
export const resetPerformanceMetrics = () => performanceOptimizer.reset();

// Global access
declare global {
  interface Window {
    getMinigamePerformanceReport: () => any;
    enableMinigameAutoOptimization: () => void;
    resetMinigamePerformanceMetrics: () => void;
  }
}

if (typeof window !== 'undefined') {
  window.getMinigamePerformanceReport = getPerformanceReport;
  window.enableMinigameAutoOptimization = enableAutoOptimization;
  window.resetMinigamePerformanceMetrics = resetPerformanceMetrics;
}

export default performanceOptimizer;
export { PerformanceOptimizer, type PerformanceMetrics, type OptimizationSuggestion };