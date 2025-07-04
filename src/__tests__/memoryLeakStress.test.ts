// /Users/montysharma/v11m2/src/__tests__/memoryLeakStress.test.ts
// Stress tests for memory leak detection and prevention

import { renderHook, act } from '@testing-library/react';
import { render, unmount } from '@testing-library/react';
import subscriptionManager from '../utils/subscriptionManager';
import { useSubscriptionCleanup, memoryLeakDetector } from '../utils/memoryLeakDetector';

describe('Memory Leak Stress Tests', () => {
  beforeEach(() => {
    subscriptionManager.cleanupAll();
    memoryLeakDetector.reset();
  });

  afterEach(() => {
    subscriptionManager.cleanupAll();
  });

  describe('High Volume Subscription Tests', () => {
    it('should handle 1000+ subscriptions without performance degradation', () => {
      const startTime = performance.now();
      
      // Create 1000 subscriptions across 100 components
      for (let compId = 0; compId < 100; compId++) {
        for (let subId = 0; subId < 10; subId++) {
          subscriptionManager.add(
            `stress-component-${compId}`,
            jest.fn(),
            { type: 'store', target: `Store${subId}` }
          );
        }
      }

      const addTime = performance.now() - startTime;
      expect(addTime).toBeLessThan(1000); // Should complete within 1 second
      
      const stats = subscriptionManager.getStats();
      expect(stats.totalSubscriptions).toBe(1000);
      expect(stats.activeComponents).toBe(100);

      // Test cleanup performance
      const cleanupStartTime = performance.now();
      subscriptionManager.cleanupAll();
      const cleanupTime = performance.now() - cleanupStartTime;
      
      expect(cleanupTime).toBeLessThan(500); // Cleanup should be fast
      expect(subscriptionManager.getStats().totalSubscriptions).toBe(0);
    });

    it('should detect memory leaks in high-subscription scenarios', () => {
      // Create components with varying subscription counts
      const subscriptionCounts = [5, 15, 25, 50]; // Some exceed thresholds
      
      subscriptionCounts.forEach((count, index) => {
        for (let i = 0; i < count; i++) {
          subscriptionManager.add(
            `leak-test-${index}`,
            jest.fn(),
            { type: 'store', target: `Store${i}` }
          );
        }
      });

      const leaks = subscriptionManager.detectLeaks();
      
      // Should detect components with 15+ subscriptions as potential leaks
      const leakyComponents = leaks.filter(leak => leak.subscriptionCount >= 15);
      expect(leakyComponents.length).toBe(3); // Components with 15, 25, and 50 subscriptions
      
      const highestLeak = leaks.find(leak => leak.subscriptionCount === 50);
      expect(highestLeak).toBeDefined();
      expect(highestLeak?.severity).toBe('high');
    });

    it('should handle rapid subscription creation and cleanup cycles', () => {
      const cycles = 50;
      const subscriptionsPerCycle = 20;
      
      for (let cycle = 0; cycle < cycles; cycle++) {
        // Create subscriptions
        for (let sub = 0; sub < subscriptionsPerCycle; sub++) {
          subscriptionManager.add(
            `cycle-component-${cycle}`,
            jest.fn(),
            { type: 'event', target: 'window' }
          );
        }
        
        // Immediate cleanup
        subscriptionManager.cleanup(`cycle-component-${cycle}`);
      }
      
      // Should have no lingering subscriptions
      expect(subscriptionManager.getStats().totalSubscriptions).toBe(0);
      expect(subscriptionManager.getStats().activeComponents).toBe(0);
    });
  });

  describe('High Frequency Render Tests', () => {
    it('should track and detect excessive re-renders', () => {
      const componentName = 'high-frequency-component';
      const renderCount = 100;
      
      // Simulate high-frequency renders
      for (let i = 0; i < renderCount; i++) {
        memoryLeakDetector.trackRender(componentName);
      }
      
      expect(memoryLeakDetector.getRenderCount(componentName)).toBe(renderCount);
      
      const report = memoryLeakDetector.generateReport();
      const warnings = report.warnings || [];
      
      const renderWarning = warnings.find(w => 
        w.type === 'high_render_frequency' && 
        w.component === componentName
      );
      
      expect(renderWarning).toBeDefined();
      expect(renderWarning?.renderCount).toBe(renderCount);
      expect(renderWarning?.severity).toBe('high');
    });

    it('should handle multiple components with high render frequencies', () => {
      const components = Array.from({ length: 20 }, (_, i) => `component-${i}`);
      const renders = [5, 15, 25, 35, 50]; // Different render frequencies
      
      components.forEach((component, index) => {
        const renderCount = renders[index % renders.length];
        for (let i = 0; i < renderCount; i++) {
          memoryLeakDetector.trackRender(component);
        }
      });
      
      const report = memoryLeakDetector.generateReport();
      expect(report.totalComponents).toBe(20);
      
      // Should detect components with >20 renders as problematic
      const highRenderComponents = Object.entries(report.componentRenders)
        .filter(([, count]) => count > 20);
      
      expect(highRenderComponents.length).toBe(12); // 25, 35, 50 render counts × 4 components each
    });

    it('should maintain performance during continuous render tracking', () => {
      const startTime = performance.now();
      const components = 100;
      const rendersPerComponent = 50;
      
      // Track many renders across many components
      for (let comp = 0; comp < components; comp++) {
        for (let render = 0; render < rendersPerComponent; render++) {
          memoryLeakDetector.trackRender(`perf-component-${comp}`);
        }
      }
      
      const trackingTime = performance.now() - startTime;
      expect(trackingTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Generate report performance
      const reportStartTime = performance.now();
      const report = memoryLeakDetector.generateReport();
      const reportTime = performance.now() - reportStartTime;
      
      expect(reportTime).toBeLessThan(500); // Report generation should be fast
      expect(report.totalComponents).toBe(components);
      expect(Object.keys(report.componentRenders)).toHaveLength(components);
    });
  });

  describe('Real-world Simulation Tests', () => {
    it('should handle component mount/unmount cycles with subscriptions', () => {
      const TestComponent = ({ componentId }: { componentId: string }) => {
        const { addSubscription } = useSubscriptionCleanup(componentId);
        
        React.useEffect(() => {
          // Simulate multiple subscription types
          const storeUnsub = jest.fn();
          const eventUnsub = jest.fn();
          const timerUnsub = jest.fn();
          
          addSubscription(storeUnsub, 'store', 'TestStore');
          addSubscription(eventUnsub, 'event', 'window');
          addSubscription(timerUnsub, 'timer', 'interval');
        }, [addSubscription]);
        
        return null;
      };

      const components: Array<() => void> = [];
      
      // Mount 50 components
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(
          React.createElement(TestComponent, { componentId: `sim-component-${i}` })
        );
        components.push(unmount);
      }
      
      expect(subscriptionManager.getStats().totalSubscriptions).toBe(150); // 50 × 3 subscriptions
      expect(subscriptionManager.getStats().activeComponents).toBe(50);
      
      // Unmount components in random order
      const indices = Array.from({ length: 50 }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      
      indices.forEach(index => {
        components[index]();
      });
      
      expect(subscriptionManager.getStats().totalSubscriptions).toBe(0);
      expect(subscriptionManager.getStats().activeComponents).toBe(0);
    });

    it('should detect memory leaks in a simulated game scenario', () => {
      // Simulate a game with various component types
      const componentTypes = [
        { name: 'GameUI', subscriptions: 3 },
        { name: 'MinigameManager', subscriptions: 8 },
        { name: 'SoundManager', subscriptions: 5 },
        { name: 'AnimationController', subscriptions: 12 }, // This should trigger leak detection
        { name: 'NetworkManager', subscriptions: 6 },
        { name: 'InputHandler', subscriptions: 15 }, // This should also trigger leak detection
      ];

      const instances = 10; // Create 10 instances of each type
      
      componentTypes.forEach(type => {
        for (let i = 0; i < instances; i++) {
          for (let sub = 0; sub < type.subscriptions; sub++) {
            subscriptionManager.add(
              `${type.name}-${i}`,
              jest.fn(),
              { type: 'store', target: `${type.name}Store` }
            );
          }
        }
      });

      const totalExpectedSubscriptions = componentTypes.reduce(
        (total, type) => total + (type.subscriptions * instances), 
        0
      );
      
      expect(subscriptionManager.getStats().totalSubscriptions).toBe(totalExpectedSubscriptions);
      
      const leaks = subscriptionManager.detectLeaks();
      const leakyComponentTypes = leaks.map(leak => 
        leak.componentKey.split('-')[0] // Extract component type
      );
      
      expect(leakyComponentTypes).toContain('AnimationController');
      expect(leakyComponentTypes).toContain('InputHandler');
      
      // Generate comprehensive memory report
      const report = memoryLeakDetector.generateReport();
      expect(report.totalSubscriptions).toBe(totalExpectedSubscriptions);
      expect(report.totalComponents).toBe(60); // 6 types × 10 instances
    });

    it('should handle emergency cleanup scenarios', () => {
      // Create a scenario that would trigger emergency cleanup
      const excessiveSubscriptions = 500;
      
      // Create excessive subscriptions for a single component
      for (let i = 0; i < excessiveSubscriptions; i++) {
        subscriptionManager.add(
          'emergency-test-component',
          jest.fn(),
          { type: 'store', target: `Store${i}` }
        );
      }
      
      expect(subscriptionManager.getStats().totalSubscriptions).toBe(excessiveSubscriptions);
      
      // Trigger emergency cleanup
      memoryLeakDetector.emergencyCleanup();
      
      // Should have cleaned up the problematic component
      expect(subscriptionManager.getStats().totalSubscriptions).toBe(0);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should maintain performance with large numbers of tracked components', () => {
      const startTime = performance.now();
      
      // Create 1000 components with varying subscription counts
      for (let i = 0; i < 1000; i++) {
        const subscriptionCount = Math.floor(Math.random() * 10) + 1;
        for (let j = 0; j < subscriptionCount; j++) {
          subscriptionManager.add(
            `benchmark-component-${i}`,
            jest.fn(),
            { type: 'store', target: `Store${j}` }
          );
        }
        
        // Also track renders
        const renderCount = Math.floor(Math.random() * 5) + 1;
        for (let k = 0; k < renderCount; k++) {
          memoryLeakDetector.trackRender(`benchmark-component-${i}`);
        }
      }
      
      const setupTime = performance.now() - startTime;
      console.log(`Setup time for 1000 components: ${setupTime}ms`);
      
      // Test statistics generation performance
      const statsStartTime = performance.now();
      const stats = subscriptionManager.getStats();
      const statsTime = performance.now() - statsStartTime;
      
      console.log(`Stats generation time: ${statsTime}ms`);
      expect(statsTime).toBeLessThan(100); // Should be very fast
      
      // Test leak detection performance
      const leakStartTime = performance.now();
      const leaks = subscriptionManager.detectLeaks();
      const leakTime = performance.now() - leakStartTime;
      
      console.log(`Leak detection time: ${leakTime}ms`);
      expect(leakTime).toBeLessThan(200);
      
      // Test report generation performance
      const reportStartTime = performance.now();
      const report = memoryLeakDetector.generateReport();
      const reportTime = performance.now() - reportStartTime;
      
      console.log(`Report generation time: ${reportTime}ms`);
      expect(reportTime).toBeLessThan(300);
      
      expect(stats.activeComponents).toBe(1000);
      expect(report.totalComponents).toBe(1000);
    });

    it('should handle cleanup of large numbers of subscriptions efficiently', () => {
      // Setup many subscriptions
      const componentCount = 500;
      const subscriptionsPerComponent = 10;
      
      for (let comp = 0; comp < componentCount; comp++) {
        for (let sub = 0; sub < subscriptionsPerComponent; sub++) {
          subscriptionManager.add(
            `cleanup-test-${comp}`,
            jest.fn(),
            { type: 'store', target: `Store${sub}` }
          );
        }
      }
      
      expect(subscriptionManager.getStats().totalSubscriptions).toBe(
        componentCount * subscriptionsPerComponent
      );
      
      // Time the cleanup
      const cleanupStartTime = performance.now();
      subscriptionManager.cleanupAll();
      const cleanupTime = performance.now() - cleanupStartTime;
      
      console.log(`Cleanup time for ${componentCount * subscriptionsPerComponent} subscriptions: ${cleanupTime}ms`);
      expect(cleanupTime).toBeLessThan(1000); // Should complete within 1 second
      expect(subscriptionManager.getStats().totalSubscriptions).toBe(0);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not create memory leaks in the tracking system itself', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Create and cleanup many tracking cycles
      for (let cycle = 0; cycle < 100; cycle++) {
        // Create subscriptions
        for (let i = 0; i < 50; i++) {
          subscriptionManager.add(`cycle-${cycle}-comp-${i}`, jest.fn());
          memoryLeakDetector.trackRender(`cycle-${cycle}-comp-${i}`);
        }
        
        // Generate reports
        memoryLeakDetector.generateReport();
        subscriptionManager.getStats();
        subscriptionManager.detectLeaks();
        
        // Cleanup
        subscriptionManager.cleanupAll();
        
        if (cycle % 10 === 0) {
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
        }
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Memory growth should be minimal (allowing for some variance)
      console.log(`Memory growth: ${memoryGrowth} bytes`);
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
    });
  });
});