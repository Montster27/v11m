// /Users/montysharma/v11m2/src/components/SubscriptionAwareDebugPanel.tsx
// Example component showing proper subscription management

import React, { useState, useEffect } from 'react';
import { useSubscriptionCleanup, useRenderTracking } from '../utils/memoryLeakDetector';
import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';
import { getFlagGeneratorStats } from '../utils/flagGenerator';
import subscriptionManager from '../utils/subscriptionManager';

interface DebugInfo {
  subscriptions: {
    total: number;
    components: number;
    byStore: Record<string, number>;
  };
  stores: {
    core: any;
    narrative: any;
    social: any;
  };
  performance: {
    flagCache: any;
    renderCount: number;
  };
  timestamp: number;
}

export const SubscriptionAwareDebugPanel: React.FC = () => {
  // Track renders for memory leak detection
  useRenderTracking('SubscriptionAwareDebugPanel');
  
  // Use subscription cleanup hook
  const { addSubscription, getSubscriptionCount } = useSubscriptionCleanup('SubscriptionAwareDebugPanel');
  
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(2000);

  // Store getters (these are reactive hooks, not subscriptions)
  const coreState = useCoreGameStore();
  const narrativeState = useNarrativeStore();
  const socialState = useSocialStore();

  // Function to collect debug information
  const collectDebugInfo = (): DebugInfo => {
    const subscriptionStats = subscriptionManager.getStats();
    const flagStats = getFlagGeneratorStats();
    
    return {
      subscriptions: {
        total: subscriptionStats.totalSubscriptions,
        components: subscriptionStats.activeComponents,
        byStore: subscriptionStats.subscriptionsByStore
      },
      stores: {
        core: {
          day: coreState.world?.day || 0,
          level: coreState.player?.level || 0,
          energy: coreState.player?.resources?.energy || 0
        },
        narrative: {
          activeStorylets: narrativeState.storylets?.active?.length || 0,
          completedStorylets: narrativeState.storylets?.completed?.length || 0,
          flags: narrativeState.flags ? Object.keys(narrativeState.flags).length : 0
        },
        social: {
          saveSlots: Object.keys(socialState.saves?.saveSlots || {}).length,
          currentSave: socialState.saves?.currentSaveId || 'none',
          discoveredClues: socialState.clues?.discovered?.length || 0
        }
      },
      performance: {
        flagCache: flagStats,
        renderCount: getSubscriptionCount()
      },
      timestamp: Date.now()
    };
  };

  // Setup subscription-based updates instead of polling
  useEffect(() => {
    if (!isVisible) return;

    // Subscribe to relevant store changes for automatic updates
    const unsubCore = useCoreGameStore.subscribe(
      (state) => ({
        day: state.world?.day,
        level: state.player?.level,
        energy: state.player?.resources?.energy
      }),
      () => {
        setDebugInfo(collectDebugInfo());
      }
    );

    const unsubNarrative = useNarrativeStore.subscribe(
      (state) => ({
        activeCount: state.storylets?.active?.length,
        completedCount: state.storylets?.completed?.length
      }),
      () => {
        setDebugInfo(collectDebugInfo());
      }
    );

    const unsubSocial = useSocialStore.subscribe(
      (state) => ({
        saveCount: Object.keys(state.saves?.saveSlots || {}).length,
        currentSave: state.saves?.currentSaveId
      }),
      () => {
        setDebugInfo(collectDebugInfo());
      }
    );

    // Track these subscriptions for cleanup
    addSubscription(unsubCore, 'store', 'CoreGameStore');
    addSubscription(unsubNarrative, 'store', 'NarrativeStore');
    addSubscription(unsubSocial, 'store', 'SocialStore');

    // Initial data collection
    setDebugInfo(collectDebugInfo());

    // Periodic updates for performance data (not store data)
    const intervalId = setInterval(() => {
      setDebugInfo(prev => prev ? {
        ...prev,
        performance: {
          ...prev.performance,
          flagCache: getFlagGeneratorStats()
        },
        timestamp: Date.now()
      } : collectDebugInfo());
    }, updateInterval);

    // Track interval for cleanup
    addSubscription(() => clearInterval(intervalId), 'interval', 'debug-update');

    // Cleanup handled by useSubscriptionCleanup hook

  }, [isVisible, updateInterval, addSubscription]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
        >
          Debug Panel
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg max-w-md text-sm font-mono">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold">Debug Panel</h3>
        <div className="flex gap-2">
          <select
            value={updateInterval}
            onChange={(e) => setUpdateInterval(Number(e.target.value))}
            className="bg-gray-700 text-white text-xs px-2 py-1 rounded"
          >
            <option value={1000}>1s</option>
            <option value={2000}>2s</option>
            <option value={5000}>5s</option>
          </select>
          <button
            onClick={() => setIsVisible(false)}
            className="text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      </div>

      {debugInfo && (
        <div className="space-y-3">
          {/* Subscription Information */}
          <div>
            <div className="text-blue-400 font-semibold">Subscriptions</div>
            <div>Total: {debugInfo.subscriptions.total}</div>
            <div>Components: {debugInfo.subscriptions.components}</div>
            <div>This Component: {getSubscriptionCount()}</div>
          </div>

          {/* Store Information */}
          <div>
            <div className="text-green-400 font-semibold">Stores</div>
            <div>Core: Day {debugInfo.stores.core.day}, Lvl {debugInfo.stores.core.level}</div>
            <div>Narrative: {debugInfo.stores.narrative.activeStorylets} active storylets</div>
            <div>Social: {debugInfo.stores.social.saveSlots} saves</div>
          </div>

          {/* Performance Information */}
          <div>
            <div className="text-yellow-400 font-semibold">Performance</div>
            <div>Flag Cache: {debugInfo.performance.flagCache.cacheHits}h/{debugInfo.performance.flagCache.cacheMisses}m</div>
            <div>Cache Size: {debugInfo.performance.flagCache.cacheSize}</div>
          </div>

          {/* Store Subscriptions by Store */}
          {Object.keys(debugInfo.subscriptions.byStore).length > 0 && (
            <div>
              <div className="text-purple-400 font-semibold">By Store</div>
              {Object.entries(debugInfo.subscriptions.byStore).map(([store, count]) => (
                <div key={store}>{store}: {count}</div>
              ))}
            </div>
          )}

          <div className="text-gray-400 text-xs">
            Updated: {new Date(debugInfo.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionAwareDebugPanel;