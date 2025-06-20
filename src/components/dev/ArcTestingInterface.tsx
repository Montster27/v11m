// Arc Testing Interface
// Interactive UI for testing story arcs with playthrough simulation and path exploration

import React, { useState, useEffect } from 'react';
import { ArcTester, type ArcTestSession, type PlaythroughStep, type ArcTestResults, type ArcIssue } from '../../utils/arcTesting';
import { useStoryletStore } from '../../store/useStoryletStore';
import { useStoryletCatalogStore } from '../../store/useStoryletCatalogStore';
import type { Storylet, Choice } from '../../types/storylet';

interface ArcTestingInterfaceProps {
  onClose: () => void;
}

const ArcTestingInterface: React.FC<ArcTestingInterfaceProps> = ({ onClose }) => {
  // Use catalog store for storylet data and management store for arcs
  const allStorylets = useStoryletCatalogStore(state => state.allStorylets);
  const { storyArcs } = useStoryletStore();
  const [selectedArc, setSelectedArc] = useState<string>('');
  const [arcTester, setArcTester] = useState<ArcTester | null>(null);
  const [session, setSession] = useState<ArcTestSession | null>(null);
  const [activeTab, setActiveTab] = useState<'playthrough' | 'analysis' | 'history'>('playthrough');
  const [analysisResults, setAnalysisResults] = useState<ArcTestResults | null>(null);
  const [showGameState, setShowGameState] = useState(false);

  // Initialize arc tester when arc is selected
  useEffect(() => {
    if (selectedArc && allStorylets) {
      const tester = new ArcTester(allStorylets, selectedArc);
      setArcTester(tester);
      setSession(null);
      setAnalysisResults(null);
    }
  }, [selectedArc, allStorylets]);

  const startTestSession = () => {
    if (!arcTester) return;
    
    try {
      const newSession = arcTester.startTestSession();
      setSession(newSession);
      setActiveTab('playthrough');
    } catch (error) {
      alert(`Failed to start test session: ${error}`);
    }
  };

  const executeChoice = (storyletId: string, choiceId: string) => {
    if (!arcTester || !session) return;
    
    try {
      const step = arcTester.executeChoice(storyletId, choiceId);
      setSession({ ...arcTester.getSession()! });
    } catch (error) {
      alert(`Failed to execute choice: ${error}`);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (!arcTester || !session) return;
    
    try {
      arcTester.goToStep(stepIndex);
      setSession({ ...arcTester.getSession()! });
    } catch (error) {
      alert(`Failed to go to step: ${error}`);
    }
  };

  const runAnalysis = () => {
    if (!arcTester) return;
    
    const results = arcTester.analyzeArc();
    setAnalysisResults(results);
    setActiveTab('analysis');
  };

  const resetSession = () => {
    setSession(null);
    setAnalysisResults(null);
  };

  const getAvailableStorylets = (): Storylet[] => {
    if (!session) return [];
    return session.availableStorylets
      .map(id => allStorylets[id])
      .filter(Boolean);
  };

  const getCurrentStep = (): PlaythroughStep | null => {
    if (!session || session.currentStepIndex < 0) return null;
    return session.steps[session.currentStepIndex] || null;
  };

  const formatResourceValue = (value: number): string => {
    return value.toString();
  };

  const getIssueIcon = (issue: ArcIssue): string => {
    switch (issue.type) {
      case 'dead_end': return '🚫';
      case 'unreachable': return '❌';
      case 'broken_trigger': return '⚠️';
      case 'missing_storylet': return '❓';
      case 'infinite_loop': return '🔄';
      case 'resource_imbalance': return '⚖️';
      default: return '❗';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Arc Testing Interface</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Arc Selection */}
        {!selectedArc && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Select Arc to Test</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storyArcs.map(arcName => {
                const arcStorylets = Object.values(allStorylets).filter(s => s.storyArc === arcName);
                return (
                  <div
                    key={arcName}
                    onClick={() => setSelectedArc(arcName)}
                    className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <h4 className="font-medium">{arcName}</h4>
                    <p className="text-sm text-gray-600">{arcStorylets.length} storylets</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Arc Testing Interface */}
        {selectedArc && (
          <>
            {/* Arc Header */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Testing: {selectedArc}</h3>
                  <p className="text-sm text-gray-600">
                    {Object.values(allStorylets).filter(s => s.storyArc === selectedArc).length} storylets
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedArc('')}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800"
                  >
                    ← Back
                  </button>
                  {!session && (
                    <button
                      onClick={startTestSession}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      🎮 Start Test
                    </button>
                  )}
                  {session && (
                    <button
                      onClick={resetSession}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      🔄 Reset
                    </button>
                  )}
                  <button
                    onClick={runAnalysis}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    📊 Analyze
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { id: 'playthrough', label: 'Playthrough', icon: '🎮' },
                  { id: 'analysis', label: 'Analysis', icon: '📊' },
                  { id: 'history', label: 'History', icon: '📜' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-blue-600 bg-blue-50'
                        : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6 max-h-[calc(95vh-200px)] overflow-y-auto">
              {activeTab === 'playthrough' && (
                <div className="space-y-6">
                  {!session ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🎮</div>
                      <h4 className="text-lg font-medium mb-2">Ready to Test Arc</h4>
                      <p className="text-gray-600 mb-4">
                        Start a test session to interactively play through the arc and explore different paths.
                      </p>
                      <button
                        onClick={startTestSession}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        🚀 Start Testing Session
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Game State Panel */}
                      <div className="lg:col-span-1">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Game State</h4>
                            <button
                              onClick={() => setShowGameState(!showGameState)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              {showGameState ? 'Hide' : 'Show'} Details
                            </button>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div>Day: {session.gameState.day}</div>
                            <div>Steps: {session.steps.length}</div>
                            <div>Completed: {session.metadata.completedStorylets}/{session.metadata.totalStorylets}</div>
                          </div>

                          {showGameState && (
                            <div className="mt-4 space-y-3">
                              <div>
                                <h5 className="text-sm font-medium mb-1">Resources</h5>
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                  {Object.entries(session.gameState.resources).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                      <span>{key}:</span>
                                      <span>{formatResourceValue(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h5 className="text-sm font-medium mb-1">Active Flags</h5>
                                <div className="text-xs space-y-1">
                                  {Object.entries(session.gameState.flags)
                                    .filter(([_, value]) => value)
                                    .map(([flag]) => (
                                      <div key={flag} className="bg-blue-100 px-2 py-1 rounded">
                                        {flag}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Step History */}
                        <div className="mt-4 bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-3">Step History</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {session.steps.map((step, index) => (
                              <div
                                key={step.id}
                                onClick={() => goToStep(index)}
                                className={`p-2 rounded text-sm cursor-pointer transition-colors ${
                                  index === session.currentStepIndex
                                    ? 'bg-blue-100 border border-blue-200'
                                    : 'bg-white hover:bg-gray-100'
                                }`}
                              >
                                <div className="font-medium">{index + 1}. {step.storylet.name}</div>
                                <div className="text-xs text-gray-600">{step.choice?.text}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Storylet Selection and Details */}
                      <div className="lg:col-span-2">
                        <div className="space-y-4">
                          {/* Available Storylets */}
                          <div>
                            <h4 className="font-medium mb-3">Available Storylets ({getAvailableStorylets().length})</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {getAvailableStorylets().map(storylet => (
                                <div key={storylet.id} className="border border-gray-200 rounded-lg p-3">
                                  <h5 className="font-medium mb-2">{storylet.name}</h5>
                                  <p className="text-sm text-gray-600 mb-3">{storylet.description}</p>
                                  
                                  <div className="space-y-2">
                                    {storylet.choices.map(choice => (
                                      <button
                                        key={choice.id}
                                        onClick={() => executeChoice(storylet.id, choice.id)}
                                        className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded text-sm transition-colors"
                                      >
                                        {choice.text}
                                        {choice.effects.length > 0 && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            {choice.effects.length} effects
                                          </div>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {getAvailableStorylets().length === 0 && (
                              <div className="text-center py-8 text-gray-500">
                                <div className="text-4xl mb-2">🏁</div>
                                <p>No more storylets available</p>
                                <p className="text-sm">This might be the end of the arc or a dead end</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  {!analysisResults ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📊</div>
                      <h4 className="text-lg font-medium mb-2">Arc Analysis</h4>
                      <p className="text-gray-600 mb-4">
                        Run comprehensive analysis to check arc structure, reachability, and potential issues.
                      </p>
                      <button
                        onClick={runAnalysis}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        🔍 Analyze Arc
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Overview Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{analysisResults.totalStorylets}</div>
                          <div className="text-sm text-gray-600">Total Storylets</div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{analysisResults.reachableStorylets}</div>
                          <div className="text-sm text-gray-600">Reachable</div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{analysisResults.branchingPoints}</div>
                          <div className="text-sm text-gray-600">Branching Points</div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{analysisResults.completeness.toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">Completeness</div>
                        </div>
                      </div>

                      {/* Issues */}
                      {analysisResults.issues.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Issues Found ({analysisResults.issues.length})</h4>
                          <div className="space-y-2">
                            {analysisResults.issues.map((issue, index) => (
                              <div
                                key={index}
                                className={`p-3 border rounded-lg ${getSeverityColor(issue.severity)}`}
                              >
                                <div className="flex items-start gap-2">
                                  <span className="text-lg">{getIssueIcon(issue)}</span>
                                  <div className="flex-1">
                                    <div className="font-medium">{issue.message}</div>
                                    {issue.storyletId && (
                                      <div className="text-sm opacity-75">Storylet: {issue.storyletId}</div>
                                    )}
                                    {issue.suggestion && (
                                      <div className="text-sm mt-1 italic">{issue.suggestion}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Unreachable Storylets */}
                      {analysisResults.unreachableStorylets.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Unreachable Storylets ({analysisResults.unreachableStorylets.length})</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {analysisResults.unreachableStorylets.map(storyletId => (
                              <div key={storyletId} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                                {storyletId}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dead End Storylets */}
                      {analysisResults.deadEndStorylets.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Dead End Storylets ({analysisResults.deadEndStorylets.length})</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {analysisResults.deadEndStorylets.map(storyletId => (
                              <div key={storyletId} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                {storyletId}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  {session && session.steps.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-4">Playthrough History</h4>
                      <div className="space-y-4">
                        {session.steps.map((step, index) => (
                          <div
                            key={step.id}
                            className={`p-4 border rounded-lg ${
                              index === session.currentStepIndex
                                ? 'border-blue-300 bg-blue-50'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium">
                                  Step {index + 1}: {step.storylet.name}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  Choice: "{step.choice?.text}"
                                </div>
                                
                                {/* Effects */}
                                {step.effects.length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-sm font-medium">Effects:</div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                      {step.effects.map((effect, i) => (
                                        <div key={i}>
                                          {effect.type === 'resource' && `${effect.key} ${effect.delta > 0 ? '+' : ''}${effect.delta}`}
                                          {effect.type === 'flag' && `Set ${effect.key} = ${effect.value}`}
                                          {effect.type === 'unlock' && `Unlock ${effect.storyletId}`}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Flags set */}
                                {step.flags.length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-sm font-medium">Flags:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {step.flags.map((flag, i) => (
                                        <span key={i} className="text-xs bg-blue-100 px-2 py-1 rounded">
                                          {flag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <button
                                onClick={() => goToStep(index)}
                                className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Go Here
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📜</div>
                      <p>No playthrough history</p>
                      <p className="text-sm">Start a test session to see your playthrough history</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ArcTestingInterface;