// /Users/montysharma/V11M2/src/components/DebugPanel.tsx

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useStoryletStore } from '../store/useStoryletStore';
import '../test-integration'; // Import test functions

const DebugPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [debugData, setDebugData] = useState<any>({});

  // Subscribe to store changes
  useEffect(() => {
    const updateDebugData = () => {
      try {
        const appState = useAppStore.getState();
        const storyletState = useStoryletStore.getState();
        
        setDebugData({
          character: appState.activeCharacter,
          allocations: appState.allocations,
          resources: appState.resources,
          skills: appState.skills,
          storyletFlags: storyletState.activeFlags,
          activeStorylets: storyletState.activeStoryletIds,
          completedStorylets: storyletState.completedStoryletIds,
          storyletCooldowns: storyletState.storyletCooldowns,
          day: appState.day,
          userLevel: appState.userLevel,
          experience: appState.experience
        });
      } catch (error) {
        console.warn('Error updating debug data:', error);
      }
    };

    // Initial update
    updateDebugData();

    // Update every second for real-time view
    const interval = setInterval(updateDebugData, 1000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={`fixed right-0 top-1/2 transform -translate-y-1/2 z-50 transition-all duration-300 ${
      isExpanded ? 'w-96' : 'w-auto'
    }`}>
      {/* Debug Tab */}
      <div 
        className={`bg-gray-900 text-white cursor-pointer transition-all duration-300 ${
          isExpanded ? 'rounded-l-lg' : 'rounded-l-lg'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`p-2 text-xs font-mono flex items-center ${
          isExpanded ? 'justify-between' : 'justify-center'
        }`}>
          <span>🐞 Debug</span>
          {isExpanded && (
            <span className="ml-2 text-gray-400">
              {isExpanded ? '→' : '←'}
            </span>
          )}
        </div>
      </div>

      {/* Debug Content */}
      {isExpanded && (
        <div className="bg-gray-900 text-white max-h-96 overflow-y-auto text-xs font-mono border-l border-t border-b border-gray-700 rounded-bl-lg">
          <div className="p-4">
            <h4 className="font-semibold mb-2 text-green-400">🔍 Debug Panel</h4>
            
            {/* Test Buttons */}
            <div className="mb-4 space-y-2">
              <div className="text-yellow-400 font-semibold text-xs">Integration Tests:</div>
              <div className="flex flex-col space-y-1">
                <button
                  onClick={() => (window as any).testIntegration?.()}
                  className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  Run Integration Test
                </button>
                <button
                  onClick={() => (window as any).resetGameState?.()}
                  className="bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  Reset Game State
                </button>
                <button
                  onClick={() => {
                    console.log('Current Debug Data:', debugData);
                    console.log('App Store:', useAppStore.getState());
                    console.log('Storylet Store:', useStoryletStore.getState());
                  }}
                  className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  Log State to Console
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="text-yellow-400 font-semibold">Store State:</div>
                <pre className="text-gray-300 whitespace-pre-wrap text-xs leading-tight">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
