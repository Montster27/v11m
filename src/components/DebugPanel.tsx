// /Users/montysharma/V11M2/src/components/DebugPanel.tsx

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
import ClueManagementPanel from './ClueManagementPanel';
import BalanceTestingPanel from './BalanceTestingPanel';
import StoryletManagementPanel from './StoryletManagementPanel';
import { NPCManagementPanel } from './NPCManagementPanel';
import type { Character } from '../types/character';
import '../test-integration'; // Import test functions
import '../utils/storyletTesting'; // Import storylet testing utilities

interface DebugData {
  character: Character | null;
  allocations: Record<string, number>;
  resources: Record<string, number>;
  skills: Record<string, any>;
  storyletFlags: Record<string, any>;
  activeStorylets: string[];
  completedStorylets: string[];
  storyletCooldowns: Record<string, number>;
  day: number;
  userLevel: number;
  experience: number;
}

const DebugPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'debug' | 'clues' | 'balance' | 'storylets' | 'npcs'>('debug');
  const [debugData, setDebugData] = useState<DebugData>({
    character: null,
    allocations: {},
    resources: {},
    skills: {},
    storyletFlags: {},
    activeStorylets: [],
    completedStorylets: [],
    storyletCooldowns: {},
    day: 1,
    userLevel: 1,
    experience: 0
  });

  // Subscribe to store changes
  useEffect(() => {
    const updateDebugData = () => {
      try {
        const appState = useAppStore.getState();
        const narrativeState = useNarrativeStore.getState();
        
        setDebugData({
          character: appState.activeCharacter,
          allocations: appState.allocations,
          resources: appState.resources,
          skills: appState.skills,
          storyletFlags: narrativeState.flags,
          activeStorylets: narrativeState.storylets.active,
          completedStorylets: narrativeState.storylets.completed,
          storyletCooldowns: narrativeState.storylets.cooldowns,
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
      isExpanded ? 'w-[900px]' : 'w-auto'
    }`}>
      {/* Debug Tab */}
      <button
        className={`bg-gray-900 text-white cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isExpanded ? 'rounded-l-lg' : 'rounded-l-lg'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? 'Collapse debug panel' : 'Expand debug panel'}
        type="button"
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
      </button>

      {/* Debug Content */}
      {isExpanded && (
        <div className="bg-gray-900 text-white max-h-[600px] overflow-y-auto border-l border-t border-b border-gray-700 rounded-bl-lg">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab('debug')}
              className={`px-3 py-2 text-xs font-mono transition-colors whitespace-nowrap ${
                activeTab === 'debug' 
                  ? 'bg-gray-800 text-green-400 border-b-2 border-green-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🐞 Debug
            </button>
            <button
              onClick={() => setActiveTab('clues')}
              className={`px-3 py-2 text-xs font-mono transition-colors whitespace-nowrap ${
                activeTab === 'clues' 
                  ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔍 Clues
            </button>
            <button
              onClick={() => setActiveTab('balance')}
              className={`px-3 py-2 text-xs font-mono transition-colors whitespace-nowrap ${
                activeTab === 'balance' 
                  ? 'bg-gray-800 text-purple-400 border-b-2 border-purple-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ⚖️ Balance
            </button>
            <button
              onClick={() => setActiveTab('storylets')}
              className={`px-3 py-2 text-xs font-mono transition-colors whitespace-nowrap ${
                activeTab === 'storylets' 
                  ? 'bg-gray-800 text-orange-400 border-b-2 border-orange-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📖 Storylets
            </button>
            <button
              onClick={() => setActiveTab('npcs')}
              className={`px-3 py-2 text-xs font-mono transition-colors whitespace-nowrap ${
                activeTab === 'npcs' 
                  ? 'bg-gray-800 text-pink-400 border-b-2 border-pink-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              👥 NPCs
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'debug' && (
            <div className="p-4">
              <h4 className="font-semibold mb-2 text-green-400">🔍 Debug Panel</h4>
            
            {/* Test Buttons */}
            <div className="mb-4 space-y-2">
              <div className="text-yellow-400 font-semibold text-xs">Storylet Tests:</div>
              <div className="flex flex-col space-y-1">
                <button
                  onClick={() => {
                    const storyletStore = useStoryletStore.getState();
                    storyletStore.evaluateStorylets();
                    console.log('🎭 Manually evaluated storylets');
                  }}
                  className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  🎭 Evaluate Storylets
                </button>
                <button
                  onClick={() => {
                    const appStore = useAppStore.getState();
                    const newDay = appStore.day + 1;
                    useAppStore.setState({ day: newDay });
                    console.log('📅 Advanced day to:', newDay);
                    setTimeout(() => {
                      useStoryletStore.getState().evaluateStorylets();
                    }, 100);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  📅 Advance Day
                </button>
                <button
                  onClick={() => {
                    const appStore = useAppStore.getState();
                    const newDay = appStore.day + 7;
                    useAppStore.setState({ day: newDay });
                    console.log('📅 Advanced week to day:', newDay);
                    setTimeout(() => {
                      useStoryletStore.getState().evaluateStorylets();
                    }, 100);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  📅 Advance Week
                </button>
                <button
                  onClick={() => {
                    const storyletStore = useStoryletStore.getState();
                    storyletStore.resetStorylets();
                    console.log('🔄 Reset storylets');
                  }}
                  className="bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  🔄 Reset Storylets
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).testStoryletSystem) {
                      (window as any).testStoryletSystem();
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  🧪 Run Full Test
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).advanceToDay) {
                      (window as any).advanceToDay(15);
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  🚀 Jump to Day 15
                </button>
              </div>
              
              <div className="text-yellow-400 font-semibold text-xs mt-3">Integration Tests:</div>
              <div className="flex flex-col space-y-1">
                <button
                  onClick={() => (window as any).testIntegration?.()}
                  className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  Run Integration Test
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).useClueStore) {
                      (window as any).useClueStore.getState().initializeSampleData();
                    }
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  🔍 Initialize Sample Clues
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).testClueSystem) {
                      (window as any).testClueSystem();
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  🧪 Test Clue System
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).useAppStore) {
                      const appStore = (window as any).useAppStore.getState();
                      console.log('🔍 Current Game State:');
                      console.log('Day:', appStore.day);
                      console.log('Experience:', appStore.experience);
                      console.log('User Level:', appStore.userLevel);
                      console.log('Resources:', appStore.resources);
                      console.log('Active Character:', appStore.activeCharacter?.name || 'None');
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  🔍 Check Game State
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).useAppStore) {
                      const appStore = (window as any).useAppStore.getState();
                      if (appStore.resetGame) {
                        appStore.resetGame();
                        console.log('✅ Game manually reset from debug panel');
                      }
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  🔄 Manual Reset Game
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).useAppStore) {
                      const appStore = (window as any).useAppStore.getState();
                      const current = appStore.resources;
                      appStore.updateResource('knowledge', current.knowledge + 50);
                      appStore.updateResource('social', current.social + 50);
                      console.log(`📚 Added +50 knowledge (now ${current.knowledge + 50})`);
                      console.log(`👥 Added +50 social (now ${current.social + 50})`);
                    }
                  }}
                  className="bg-violet-600 hover:bg-violet-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  📚 Test Unlimited Growth
                </button>
                <button
                  onClick={() => (window as any).resetGameState?.()}
                  className="bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  Reset Game State
                </button>
                <button
                  onClick={() => {
                    console.log('🔍 === DEBUG STATE LOG ===');
                    console.log('Debug Data:', debugData);
                    console.log('App Store:', useAppStore.getState());
                    console.log('Storylet Store:', useStoryletStore.getState());
                    
                    // Test storylet evaluation specifically
                    const appState = useAppStore.getState();
                    const storyletState = useStoryletStore.getState();
                    console.log('🎭 === STORYLET ANALYSIS ===');
                    console.log('Current Day:', appState.day);
                    console.log('Total Storylets:', Object.keys(storyletState.allStorylets).length);
                    console.log('Active Storylets:', storyletState.activeStoryletIds.length);
                    console.log('Completed Storylets:', storyletState.completedStoryletIds.length);
                    
                    // Check time-based storylets specifically
                    const timeBasedStorylets = Object.values(storyletState.allStorylets).filter(
                      (s: any) => s.trigger.type === 'time'
                    );
                    console.log('Time-based storylets:', timeBasedStorylets.length);
                    timeBasedStorylets.forEach((s: any) => {
                      const dayReq = s.trigger.conditions.day;
                      const weekReq = s.trigger.conditions.week;
                      const eligible = dayReq ? appState.day >= dayReq : 
                                      weekReq ? appState.day >= (weekReq * 7) : false;
                      console.log(`📅 ${s.id}: day=${dayReq}, week=${weekReq}, eligible=${eligible}`);
                    });
                  }}
                  className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  🔍 Log State & Analysis
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
          )}

          {/* Clues Tab Content */}
          {activeTab === 'clues' && (
            <div className="p-4 bg-white text-black">
              <ClueManagementPanel />
            </div>
          )}

          {/* Balance Tab Content */}
          {activeTab === 'balance' && (
            <div className="p-4 bg-white text-black">
              <BalanceTestingPanel />
            </div>
          )}

          {/* Storylets Tab Content */}
          {activeTab === 'storylets' && (
            <div className="p-4 bg-white text-black">
              <StoryletManagementPanel />
            </div>
          )}

          {/* NPCs Tab Content */}
          {activeTab === 'npcs' && (
            <div className="p-4 bg-white text-black">
              <NPCManagementPanel />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
