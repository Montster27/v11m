// /Users/montysharma/v11m2/src/__tests__/subscriptionCleanup.test.ts
// Test suite for subscription cleanup system

import { renderHook, act } from '@testing-library/react';
import subscriptionManager from '../utils/subscriptionManager';
import { useSubscriptionCleanup, memoryLeakDetector } from '../utils/memoryLeakDetector';

describe('Subscription Cleanup System', () => {
  beforeEach(() => {
    // Reset subscription manager state
    subscriptionManager.cleanupAll();
    
    // Reset memory leak detector
    memoryLeakDetector.reset();
  });

  afterEach(() => {
    // Cleanup after each test
    subscriptionManager.cleanupAll();
  });

  describe('SubscriptionManager', () => {
    it('should track subscriptions correctly', () => {
      const unsubscribe1 = jest.fn();
      const unsubscribe2 = jest.fn();

      subscriptionManager.add('component1', unsubscribe1, {
        type: 'store',
        target: 'TestStore'
      });

      subscriptionManager.add('component1', unsubscribe2, {
        type: 'event',
        target: 'window'
      });

      const stats = subscriptionManager.getStats();
      expect(stats.totalSubscriptions).toBe(2);
      expect(stats.activeComponents).toBe(1);
      expect(stats.subscriptionsByStore.TestStore).toBe(1);
    });

    it('should cleanup subscriptions properly', () => {
      const unsubscribe1 = jest.fn();
      const unsubscribe2 = jest.fn();

      subscriptionManager.add('component1', unsubscribe1);
      subscriptionManager.add('component2', unsubscribe2);

      expect(subscriptionManager.getStats().totalSubscriptions).toBe(2);

      const cleanedCount = subscriptionManager.cleanup('component1');
      expect(cleanedCount).toBe(1);
      expect(unsubscribe1).toHaveBeenCalled();
      expect(unsubscribe2).not.toHaveBeenCalled();

      expect(subscriptionManager.getStats().totalSubscriptions).toBe(1);
    });

    it('should detect potential memory leaks', () => {
      // Create many subscriptions for the same component
      for (let i = 0; i < 15; i++) {
        subscriptionManager.add(`leak-component`, jest.fn(), {
          type: 'store',
          target: 'TestStore'
        });
      }

      const leaks = subscriptionManager.detectLeaks();
      expect(leaks.length).toBeGreaterThan(0);
      expect(leaks[0].componentKey).toBe('leak-component');
      expect(leaks[0].subscriptionCount).toBe(15);
    });

    it('should handle cleanup of non-existent components gracefully', () => {
      const cleanedCount = subscriptionManager.cleanup('non-existent');
      expect(cleanedCount).toBe(0);
    });

    it('should provide accurate statistics', () => {
      subscriptionManager.add('comp1', jest.fn(), { type: 'store', target: 'Store1' });
      subscriptionManager.add('comp1', jest.fn(), { type: 'store', target: 'Store2' });
      subscriptionManager.add('comp2', jest.fn(), { type: 'event', target: 'window' });

      const stats = subscriptionManager.getStats();
      expect(stats.totalSubscriptions).toBe(3);
      expect(stats.activeComponents).toBe(2);
      expect(stats.subscriptionsByStore.Store1).toBe(1);
      expect(stats.subscriptionsByStore.Store2).toBe(1);
      expect(stats.subscriptionsByType.store).toBe(2);
      expect(stats.subscriptionsByType.event).toBe(1);
    });
  });

  describe('useSubscriptionCleanup Hook', () => {
    it('should register and cleanup subscriptions automatically', () => {
      const unsubscribe = jest.fn();

      const { result, unmount } = renderHook(() =>
        useSubscriptionCleanup('test-component')
      );

      act(() => {
        result.current.addSubscription(unsubscribe, 'store', 'TestStore');
      });

      expect(result.current.getSubscriptionCount()).toBe(1);
      expect(subscriptionManager.getStats().totalSubscriptions).toBe(1);

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
      expect(subscriptionManager.getStats().totalSubscriptions).toBe(0);
    });

    it('should handle dependency changes correctly', () => {
      const unsubscribe1 = jest.fn();
      const unsubscribe2 = jest.fn();

      let deps = ['dep1'];
      const { result, rerender } = renderHook(() =>
        useSubscriptionCleanup('test-component', deps)
      );

      act(() => {
        result.current.addSubscription(unsubscribe1, 'store', 'Store1');
      });

      expect(result.current.getSubscriptionCount()).toBe(1);

      // Change dependencies
      deps = ['dep2'];
      rerender();

      act(() => {
        result.current.addSubscription(unsubscribe2, 'store', 'Store2');
      });

      // Should have cleaned up previous subscription and added new one
      expect(unsubscribe1).toHaveBeenCalled();
      expect(result.current.getSubscriptionCount()).toBe(1);
    });

    it('should provide accurate subscription counts', () => {
      const { result } = renderHook(() =>
        useSubscriptionCleanup('test-component')
      );

      expect(result.current.getSubscriptionCount()).toBe(0);

      act(() => {
        result.current.addSubscription(jest.fn(), 'store', 'Store1');
        result.current.addSubscription(jest.fn(), 'event', 'window');
      });

      expect(result.current.getSubscriptionCount()).toBe(2);
    });
  });

  describe('Memory Leak Detection', () => {
    it('should track render counts correctly', () => {
      const { rerender } = renderHook(() => {
        const renderTracker = require('../utils/memoryLeakDetector').useRenderTracking;
        renderTracker('test-component');
        return null;
      });

      // Initial render
      expect(memoryLeakDetector.getRenderCount('test-component')).toBe(1);

      // Additional renders
      rerender();
      rerender();

      expect(memoryLeakDetector.getRenderCount('test-component')).toBe(3);
    });

    it('should generate comprehensive memory reports', () => {
      // Setup test subscriptions
      subscriptionManager.add('component1', jest.fn(), { type: 'store', target: 'Store1' });
      subscriptionManager.add('component1', jest.fn(), { type: 'event', target: 'window' });
      subscriptionManager.add('component2', jest.fn(), { type: 'store', target: 'Store2' });

      // Simulate renders
      memoryLeakDetector.trackRender('component1');
      memoryLeakDetector.trackRender('component1');
      memoryLeakDetector.trackRender('component2');

      const report = memoryLeakDetector.generateReport();

      expect(report.totalSubscriptions).toBe(3);
      expect(report.totalComponents).toBe(2);
      expect(report.componentRenders).toEqual({
        component1: 2,
        component2: 1
      });
      expect(report.subscriptionsByComponent).toEqual({
        component1: 2,
        component2: 1
      });
    });

    it('should detect high-frequency render components', () => {
      // Simulate many renders
      for (let i = 0; i < 25; i++) {
        memoryLeakDetector.trackRender('high-frequency-component');
      }

      const report = memoryLeakDetector.generateReport();
      const warnings = report.warnings || [];
      
      const renderWarning = warnings.find(w => 
        w.type === 'high_render_frequency' && 
        w.component === 'high-frequency-component'
      );
      
      expect(renderWarning).toBeDefined();
      expect(renderWarning?.renderCount).toBe(25);
    });

    it('should identify subscription leaks', () => {
      // Create excessive subscriptions
      for (let i = 0; i < 12; i++) {
        subscriptionManager.add('leak-component', jest.fn());
      }

      const report = memoryLeakDetector.generateReport();
      const warnings = report.warnings || [];
      
      const leakWarning = warnings.find(w => 
        w.type === 'subscription_leak' && 
        w.component === 'leak-component'
      );
      
      expect(leakWarning).toBeDefined();
      expect(leakWarning?.subscriptionCount).toBe(12);
    });

    it('should handle reset correctly', () => {
      memoryLeakDetector.trackRender('component1');
      memoryLeakDetector.trackRender('component2');
      subscriptionManager.add('component1', jest.fn());

      expect(memoryLeakDetector.generateReport().totalComponents).toBe(2);
      expect(subscriptionManager.getStats().totalSubscriptions).toBe(1);

      memoryLeakDetector.reset();

      const report = memoryLeakDetector.generateReport();
      expect(report.totalComponents).toBe(0);
      expect(Object.keys(report.componentRenders)).toHaveLength(0);
    });
  });

  describe('Integration Tests', () => {
    it('should work correctly with React component lifecycle', () => {
      const TestComponent = () => {
        const renderTracker = require('../utils/memoryLeakDetector').useRenderTracking;
        const { addSubscription } = useSubscriptionCleanup('integration-test');
        
        renderTracker('integration-test');
        
        React.useEffect(() => {
          const unsubscribe = jest.fn();
          addSubscription(unsubscribe, 'store', 'TestStore');
        }, [addSubscription]);
        
        return null;
      };

      const { unmount } = require('@testing-library/react').render(
        React.createElement(TestComponent)
      );

      expect(subscriptionManager.getStats().totalSubscriptions).toBe(1);
      expect(memoryLeakDetector.getRenderCount('integration-test')).toBe(1);

      unmount();

      expect(subscriptionManager.getStats().totalSubscriptions).toBe(0);
    });

    it('should handle multiple components with different subscription patterns', () => {
      const createTestComponent = (name: string, subscriptionCount: number) => {
        return () => {
          const { addSubscription } = useSubscriptionCleanup(name);
          
          React.useEffect(() => {
            for (let i = 0; i < subscriptionCount; i++) {
              addSubscription(jest.fn(), 'store', `Store${i}`);
            }
          }, [addSubscription]);
          
          return null;
        };
      };

      const Component1 = createTestComponent('comp1', 2);
      const Component2 = createTestComponent('comp2', 5);
      const Component3 = createTestComponent('comp3', 1);

      const { unmount: unmount1 } = require('@testing-library/react').render(
        React.createElement(Component1)
      );
      const { unmount: unmount2 } = require('@testing-library/react').render(
        React.createElement(Component2)
      );
      const { unmount: unmount3 } = require('@testing-library/react').render(
        React.createElement(Component3)
      );

      expect(subscriptionManager.getStats().totalSubscriptions).toBe(8);
      expect(subscriptionManager.getStats().activeComponents).toBe(3);

      unmount2(); // Unmount component with 5 subscriptions

      expect(subscriptionManager.getStats().totalSubscriptions).toBe(3);
      expect(subscriptionManager.getStats().activeComponents).toBe(2);

      unmount1();
      unmount3();

      expect(subscriptionManager.getStats().totalSubscriptions).toBe(0);
      expect(subscriptionManager.getStats().activeComponents).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle subscription errors gracefully', () => {
      const faultyUnsubscribe = jest.fn(() => {
        throw new Error('Unsubscribe failed');
      });

      subscriptionManager.add('error-component', faultyUnsubscribe);

      // Should not throw error
      expect(() => {
        subscriptionManager.cleanup('error-component');
      }).not.toThrow();

      expect(faultyUnsubscribe).toHaveBeenCalled();
    });

    it('should handle invalid subscription function', () => {
      expect(() => {
        subscriptionManager.add('test-component', null as any);
      }).not.toThrow();

      expect(() => {
        subscriptionManager.add('test-component', undefined as any);
      }).not.toThrow();
    });

    it('should handle duplicate component cleanup', () => {
      const unsubscribe = jest.fn();
      subscriptionManager.add('test-component', unsubscribe);

      subscriptionManager.cleanup('test-component');
      expect(unsubscribe).toHaveBeenCalledTimes(1);

      // Second cleanup should not call unsubscribe again
      subscriptionManager.cleanup('test-component');
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});