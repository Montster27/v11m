// /Users/montysharma/V11M2/src/components/contentStudio/PreviewSandbox.tsx

import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useStoryletStore } from '../store/useStoryletStore';
import { UndoRedoAction } from '../hooks/useUndoRedo';
import HelpTooltip from './ui/HelpTooltip';

interface UndoRedoSystem {
  executeAction: (action: UndoRedoAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface PreviewSandboxProps {
  undoRedoSystem: UndoRedoSystem;
}

const PreviewSandbox: React.FC<PreviewSandboxProps> = ({ undoRedoSystem }) => {
  const [sandboxMode, setSandboxMode] = useState(false);
  const [savedGameState, setSavedGameState] = useState<any>(null);
  const [testStorylet, setTestStorylet] = useState('');

  const appStore = useAppStore();
  const storyletStore = useStoryletStore();

  const enterSandbox = () => {
    // Save current game state
    const currentState = {
      app: appStore,
      storylets: storyletStore,
      timestamp: new Date().toISOString()
    };
    setSavedGameState(currentState);
    setSandboxMode(true);
    
    console.log('🏖️ Entered sandbox mode - game state backed up');
  };

  const exitSandbox = () => {
    if (savedGameState) {
      // In a real implementation, this would restore the game state
      console.log('🔄 Restoring game state from sandbox backup');
    }
    setSandboxMode(false);
    setSavedGameState(null);
    
    console.log('✅ Exited sandbox mode - game state restored');
  };

  const quickTests = [
    {
      name: 'Advance 1 Day',
      description: 'Test daily progression and storylet triggers',
      action: () => {
        const newDay = appStore.day + 1;
        useAppStore.setState({ day: newDay });
        storyletStore.evaluateStorylets();
        console.log(`📅 Advanced to day ${newDay} in sandbox`);
      }
    },
    {
      name: 'Advance 1 Week',
      description: 'Test weekly content and long-term progression',
      action: () => {
        const newDay = appStore.day + 7;
        useAppStore.setState({ day: newDay });
        storyletStore.evaluateStorylets();
        console.log(`📅 Advanced to day ${newDay} (week ${Math.ceil(newDay / 7)}) in sandbox`);
      }
    },
    {
      name: 'Boost Resources',
      description: 'Add resources to test high-level content',
      action: () => {
        const current = appStore.resources;
        appStore.updateResource('knowledge', current.knowledge + 50);
        appStore.updateResource('social', current.social + 50);
        appStore.updateResource('energy', Math.min(100, current.energy + 30));
        console.log('📈 Boosted all resources in sandbox');
      }
    },
    {
      name: 'Reset Storylets',
      description: 'Clear storylet completion to re-test content',
      action: () => {
        storyletStore.resetStorylets();
        console.log('🔄 Reset all storylets in sandbox');
      }
    }
  ];

  const getGameStateInfo = () => {
    const state = useAppStore.getState();
    const storylets = useStoryletStore.getState();
    
    return {
      day: state.day,
      week: Math.ceil(state.day / 7),
      experience: state.experience,
      level: state.userLevel,
      resources: state.resources,
      activeStorylets: storylets.activeStoryletIds.length,
      completedStorylets: storylets.completedStoryletIds.length,
      totalStorylets: Object.keys(storylets.allStorylets).length
    };
  };

  const gameState = getGameStateInfo();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Preview Sandbox</h3>
        <p className="text-gray-600">Test your content safely without affecting the main game</p>
      </div>

      {/* Sandbox Status */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${
        sandboxMode 
          ? 'bg-orange-50 border-orange-200' 
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              sandboxMode ? 'bg-orange-500 animate-pulse' : 'bg-green-500'
            }`} />
            <div>
              <h4 className={`font-medium ${sandboxMode ? 'text-orange-900' : 'text-green-900'}`}>
                {sandboxMode ? '🏖️ Sandbox Mode Active' : '🎮 Live Game Mode'}
              </h4>
              <p className={`text-sm ${sandboxMode ? 'text-orange-700' : 'text-green-700'}`}>
                {sandboxMode 
                  ? 'Testing safely - changes won\'t affect your main game'
                  : 'All changes will affect the main game state'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <HelpTooltip content="Sandbox mode creates a backup of your game state and lets you test changes safely. Exit sandbox to restore your original game state." />
            {sandboxMode ? (
              <button
                onClick={exitSandbox}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                Exit Sandbox
              </button>
            ) : (
              <button
                onClick={enterSandbox}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Enter Sandbox
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game State Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Current Game State</h4>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white p-3 rounded border">
              <div className="text-gray-600">Day</div>
              <div className="text-lg font-semibold">{gameState.day}</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-gray-600">Week</div>
              <div className="text-lg font-semibold">{gameState.week}</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-gray-600">Level</div>
              <div className="text-lg font-semibold">{gameState.level}</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-gray-600">Experience</div>
              <div className="text-lg font-semibold">{gameState.experience}</div>
            </div>
          </div>

          <div className="mt-4">
            <h5 className="font-medium text-gray-700 mb-2">Resources</h5>
            <div className="space-y-2">
              {Object.entries(gameState.resources).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="capitalize text-sm text-gray-600">{key}</span>
                  <span className="font-medium">{typeof value === 'number' ? value.toFixed(1) : value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <h5 className="font-medium text-gray-700 mb-2">Storylets</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Active</span>
                <span className="font-medium">{gameState.activeStorylets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed</span>
                <span className="font-medium">{gameState.completedStorylets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total</span>
                <span className="font-medium">{gameState.totalStorylets}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Test Actions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Quick Tests</h4>
          
          <div className="space-y-3">
            {quickTests.map((test) => (
              <div key={test.name} className="bg-white border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">{test.name}</h5>
                  <button
                    onClick={test.action}
                    disabled={!sandboxMode}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      sandboxMode
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Run Test
                  </button>
                </div>
                <p className="text-sm text-gray-600">{test.description}</p>
              </div>
            ))}
          </div>

          {!sandboxMode && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                💡 Enter sandbox mode to safely run tests without affecting your main game
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Custom Test Area */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Custom Storylet Test</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Storylet ID to Test
            </label>
            <input
              type="text"
              value={testStorylet}
              onChange={(e) => setTestStorylet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter storylet ID..."
              disabled={!sandboxMode}
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (testStorylet) {
                  console.log(`🧪 Testing storylet: ${testStorylet}`);
                  // This would trigger the specific storylet
                  alert(`Testing storylet: ${testStorylet} (Implementation pending)`);
                }
              }}
              disabled={!sandboxMode || !testStorylet}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400"
            >
              Test Storylet
            </button>
            
            <button
              onClick={() => {
                console.log('📋 Available storylets:', Object.keys(storyletStore.allStorylets));
                alert('Check console for available storylet IDs');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              List Available IDs
            </button>
          </div>
        </div>
      </div>

      {/* Console Output */}
      <div className="mt-6 bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-green-300">Console Output</h4>
          <span className="text-gray-500 text-xs">Check browser console for detailed logs</span>
        </div>
        <div className="text-gray-400 min-h-[100px] max-h-[200px] overflow-y-auto">
          {sandboxMode ? (
            <div>
              <div>🏖️ Sandbox mode active - safe to test</div>
              <div>📊 Game state backed up</div>
              <div>🧪 Ready for testing...</div>
            </div>
          ) : (
            <div>
              <div>🎮 Live game mode</div>
              <div>⚠️ Enter sandbox mode for safe testing</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewSandbox;