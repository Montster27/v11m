import React, { useState, useEffect } from 'react';
import { Button, Card } from './ui';
import { BalanceSimulator, DEFAULT_ARCHETYPES, SimulationAnalysis, PlayerArchetype } from '../utils/balanceSimulator';
import { QuickBalanceAnalyzer, OPTIMAL_STRATEGIES } from '../utils/quickBalanceTools';

interface BalanceTestingPanelProps {
  className?: string;
}

const BalanceTestingPanel: React.FC<BalanceTestingPanelProps> = ({ className = '' }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [results, setResults] = useState<SimulationAnalysis | null>(null);
  const [stressResults, setStressResults] = useState<any>(null);
  const [quickToolsOutput, setQuickToolsOutput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'simulation' | 'stress' | 'quick-tools'>('simulation');
  
  // Simulation parameters
  const [iterations, setIterations] = useState(50);
  const [dayLength, setDayLength] = useState(30);
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>(
    DEFAULT_ARCHETYPES.map(a => a.id)
  );

  const simulator = new BalanceSimulator((progress, message) => {
    setProgress(progress);
    setProgressMessage(message);
  });

  const handleRunSimulation = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults(null);

    try {
      const archetypes = DEFAULT_ARCHETYPES.filter(a => selectedArchetypes.includes(a.id));
      const analysis = await simulator.runSimulation(iterations, dayLength, archetypes);
      setResults(analysis);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsRunning(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  const handleRunStressTests = async () => {
    setIsRunning(true);
    setStressResults(null);

    try {
      const stressTestResults = await simulator.runStressTests();
      setStressResults(stressTestResults);
    } catch (error) {
      console.error('Stress tests failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getPerformanceColor = (performance: number, average: number) => {
    if (performance > average * 1.2) return 'text-green-600 bg-green-50';
    if (performance < average * 0.8) return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  };

  const renderSimulationTab = () => (
    <div className="space-y-6">
      {/* Simulation Controls */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Monte Carlo Simulation Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Iterations per Archetype</label>
            <input
              type="number"
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value) || 50)}
              min="10"
              max="500"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Simulation Days</label>
            <input
              type="number"
              value={dayLength}
              onChange={(e) => setDayLength(parseInt(e.target.value) || 30)}
              min="7"
              max="365"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Total Runs</label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-gray-700">
              {iterations * selectedArchetypes.length}
            </div>
          </div>
        </div>

        {/* Archetype Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Player Archetypes to Test</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {DEFAULT_ARCHETYPES.map(archetype => (
              <label key={archetype.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedArchetypes.includes(archetype.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedArchetypes([...selectedArchetypes, archetype.id]);
                    } else {
                      setSelectedArchetypes(selectedArchetypes.filter(id => id !== archetype.id));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm">
                  <strong>{archetype.name}</strong>
                  <div className="text-xs text-gray-600">{archetype.description}</div>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Run Button and Progress */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleRunSimulation}
            disabled={isRunning || selectedArchetypes.length === 0}
            variant="primary"
            className="flex items-center space-x-2"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Running...</span>
              </>
            ) : (
              <span>🎲 Run Monte Carlo Simulation</span>
            )}
          </Button>
          
          {isRunning && (
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">{progressMessage}</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results Display */}
      {results && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Simulation Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{results.totalRuns}</div>
                <div className="text-sm text-gray-600">Total Runs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {results.averageResults.questsCompleted.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Avg Quests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {results.averageResults.storyletsCompleted.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Avg Storylets</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {results.averageResults.finalResources.knowledge?.average?.toFixed(0) || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Avg Knowledge</div>
              </div>
            </div>
          </Card>

          {/* Archetype Comparison */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Archetype Performance Comparison</h3>
            <div className="space-y-3">
              {Object.entries(results.archetypeComparison).map(([archetype, data]) => {
                const avgPerf = Object.values(results.archetypeComparison)
                  .reduce((sum, d: any) => sum + d.performance, 0) / 
                  Object.keys(results.archetypeComparison).length;
                
                return (
                  <div key={archetype} className={`p-3 rounded-lg ${getPerformanceColor(data.performance, avgPerf)}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium capitalize">{archetype.replace('-', ' ')}</div>
                        <div className="text-sm opacity-75">Performance Score: {data.performance.toFixed(1)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs">
                          {data.performance > avgPerf * 1.2 ? '🏆 Strong' :
                           data.performance < avgPerf * 0.8 ? '⚠️ Weak' : '⚖️ Balanced'}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div>
                        <strong>Strengths:</strong> {data.strengths.join(', ') || 'None identified'}
                      </div>
                      <div>
                        <strong>Weaknesses:</strong> {data.weaknesses.join(', ') || 'None identified'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Balance Issues */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Balance Issues Detected</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-600 mb-2">Overpowered Strategies</h4>
                {results.balanceIssues.overpoweredStrategies.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {results.balanceIssues.overpoweredStrategies.map((strategy, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <span className="text-green-500">▲</span>
                        <span className="capitalize">{strategy.replace('-', ' ')}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">No overpowered strategies detected</div>
                )}
              </div>
              
              <div>
                <h4 className="font-medium text-red-600 mb-2">Underpowered Strategies</h4>
                {results.balanceIssues.underpoweredStrategies.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {results.balanceIssues.underpoweredStrategies.map((strategy, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <span className="text-red-500">▼</span>
                        <span className="capitalize">{strategy.replace('-', ' ')}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">No underpowered strategies detected</div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium text-orange-600 mb-2">Resource Bottlenecks</h4>
              {results.balanceIssues.resourceBottlenecks.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {results.balanceIssues.resourceBottlenecks.map((bottleneck, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <span className="text-orange-500">⚠️</span>
                      <span>{bottleneck}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">No significant resource bottlenecks detected</div>
              )}
            </div>
          </Card>

          {/* Resource Analysis */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Final Resource Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(results.averageResults.finalResources).map(([resource, stats]: [string, any]) => (
                <div key={resource} className="text-center">
                  <div className="capitalize font-medium text-gray-700 mb-2">{resource}</div>
                  <div className="space-y-1 text-sm">
                    <div>Avg: <span className="font-mono">{stats.average?.toFixed(1)}</span></div>
                    <div className="text-xs text-gray-600">
                      Range: {stats.min?.toFixed(0)} - {stats.max?.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-600">
                      Std Dev: {stats.std?.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  const renderStressTab = () => (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Stress Testing & Edge Cases</h3>
        <p className="text-sm text-gray-600 mb-4">
          Test extreme scenarios to identify breaking points and edge cases in the game balance.
        </p>
        
        <Button
          onClick={handleRunStressTests}
          disabled={isRunning}
          variant="primary"
          className="flex items-center space-x-2"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Running Stress Tests...</span>
            </>
          ) : (
            <span>🔥 Run Stress Tests</span>
          )}
        </Button>
      </Card>

      {stressResults && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Stress Test Results</h3>
          <div className="space-y-3">
            {stressResults.map((test: any, idx: number) => (
              <div key={idx} className={`p-3 rounded-lg ${test.broken ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{test.testName}</div>
                  <div className={`text-sm px-2 py-1 rounded ${test.broken ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {test.broken ? '🔥 BROKEN' : '✅ STABLE'}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Final Energy</div>
                    <div className="font-mono">{test.result.finalResources.energy.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Final Stress</div>
                    <div className="font-mono">{test.result.finalResources.stress.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Bottlenecks</div>
                    <div className="font-mono">{test.result.bottlenecks.length}</div>
                  </div>
                </div>
                {test.result.bottlenecks.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    <strong>Issues:</strong> {test.result.bottlenecks.slice(0, 3).join(', ')}
                    {test.result.bottlenecks.length > 3 && ` (+${test.result.bottlenecks.length - 3} more)`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  const renderQuickToolsTab = () => (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Quick Balance Check Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => {
              const analysis = QuickBalanceAnalyzer.analyzeCurrentBalance();
              if (analysis) {
                const output = `📊 CURRENT BALANCE SNAPSHOT
Day: ${analysis.day}
Overall Score: ${analysis.efficiency.overallScore.toFixed(1)}

📈 EFFICIENCY METRICS:
Knowledge/Day: ${analysis.efficiency.knowledgePerDay.toFixed(1)}
Social/Day: ${analysis.efficiency.socialPerDay.toFixed(1)}
Money/Day: ${analysis.efficiency.moneyPerDay.toFixed(1)}

📋 CURRENT RESOURCES:
Energy: ${analysis.resources.energy}
Stress: ${analysis.resources.stress}
Knowledge: ${analysis.resources.knowledge}
Social: ${analysis.resources.social}
Money: ${analysis.resources.money}

⏰ TIME ALLOCATION:
Study: ${analysis.allocations.study}%
Work: ${analysis.allocations.work}%
Social: ${analysis.allocations.social}%
Rest: ${analysis.allocations.rest}%
Exercise: ${analysis.allocations.exercise}%

Total Allocation: ${Object.values(analysis.allocations).reduce((sum: number, val: number) => sum + val, 0)}%`;
                
                setQuickToolsOutput(output);
                console.log(output);
              } else {
                setQuickToolsOutput('❌ Unable to analyze balance - game state not available');
              }
            }}
            variant="outline"
            className="text-left"
          >
            <div>
              <div className="font-medium">📊 Resource Snapshot</div>
              <div className="text-xs text-gray-600">Analyze current game state</div>
            </div>
          </Button>

          <Button
            onClick={() => {
              const analysis = QuickBalanceAnalyzer.analyzeCurrentBalance();
              if (analysis) {
                const projection = analysis.projections.oneWeek;
                const current = analysis.resources;
                
                const output = `📈 1-WEEK PROJECTION
Current Strategy: ${Object.entries(analysis.allocations).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}%`).join(', ')}

📊 PROJECTED CHANGES:
Knowledge: ${current.knowledge} → ${projection.knowledge.toFixed(0)} (${(projection.knowledge - current.knowledge >= 0 ? '+' : '')}${(projection.knowledge - current.knowledge).toFixed(0)})
Social: ${current.social} → ${projection.social.toFixed(0)} (${(projection.social - current.social >= 0 ? '+' : '')}${(projection.social - current.social).toFixed(0)})
Money: ${current.money} → ${projection.money.toFixed(0)} (${(projection.money - current.money >= 0 ? '+' : '')}${(projection.money - current.money).toFixed(0)})
Energy: ${current.energy} → ${projection.energy.toFixed(0)} (${(projection.energy - current.energy >= 0 ? '+' : '')}${(projection.energy - current.energy).toFixed(0)})
Stress: ${current.stress} → ${projection.stress.toFixed(0)} (${(projection.stress - current.stress >= 0 ? '+' : '')}${(projection.stress - current.stress).toFixed(0)})

🎯 ANALYSIS:
${analysis.warnings.length > 0 ? '⚠️ Warnings: ' + analysis.warnings.join(', ') : '✅ No major issues projected'}
${analysis.recommendations.length > 0 ? '\n💡 Suggestions: ' + analysis.recommendations.slice(0, 2).join(', ') : ''}`;
                
                setQuickToolsOutput(output);
                console.log(output);
              } else {
                setQuickToolsOutput('❌ Unable to generate projection - game state not available');
              }
            }}
            variant="outline"
            className="text-left"
          >
            <div>
              <div className="font-medium">📈 Weekly Projection</div>
              <div className="text-xs text-gray-600">Project 1 week of current strategy</div>
            </div>
          </Button>

          <Button
            onClick={() => {
              const output = `🎯 OPTIMAL STRATEGY GUIDE

${OPTIMAL_STRATEGIES.map(strategy => 
  `📋 ${strategy.name.toUpperCase()}
  ${strategy.description}
  Allocation: Study ${strategy.allocation.study}%, Work ${strategy.allocation.work}%, Social ${strategy.allocation.social}%, Rest ${strategy.allocation.rest}%, Exercise ${strategy.allocation.exercise}%
  Expected: Knowledge +${strategy.expectedOutcome.knowledgeGain}, Social +${strategy.expectedOutcome.socialGain}, Money +${strategy.expectedOutcome.moneyGain}, Stress ${strategy.expectedOutcome.stressLevel}%`
).join('\n\n')}

💡 TIP: Use 'Compare Strategies' to see how your current approach matches these optimal builds!`;
              
              setQuickToolsOutput(output);
              console.log(output);
            }}
            variant="outline"
            className="text-left"
          >
            <div>
              <div className="font-medium">🎯 Strategy Guide</div>
              <div className="text-xs text-gray-600">Show optimal allocation strategies</div>
            </div>
          </Button>

          <Button
            onClick={() => {
              const bottlenecks = QuickBalanceAnalyzer.detectBottlenecks();
              if (bottlenecks) {
                let output = `🚨 BALANCE WARNINGS & BOTTLENECKS

🏥 OVERALL HEALTH: ${bottlenecks.overallHealth.toUpperCase().replace('_', ' ')}
${bottlenecks.priority ? `🎯 Priority Issue: ${bottlenecks.priority}` : ''}

`;

                if (bottlenecks.bottlenecks.length === 0) {
                  output += '✅ No critical balance issues detected!\n\n🎉 Your current strategy appears to be working well.';
                } else {
                  output += '⚠️ ISSUES DETECTED:\n';
                  bottlenecks.bottlenecks.forEach((bottleneck: any) => {
                    output += `• ${bottleneck.description} (Current: ${bottleneck.currentValue.toFixed(1)}, Target: >${bottleneck.threshold})\n`;
                  });
                  
                  output += '\n💡 RECOMMENDED SOLUTIONS:\n';
                  bottlenecks.solutions.forEach((solution: any) => {
                    output += `• ${solution.action}: ${solution.from}% → ${solution.to}% (${solution.expectedImprovement})\n`;
                  });
                }
                
                setQuickToolsOutput(output);
                console.log(output);
              } else {
                setQuickToolsOutput('❌ Unable to check balance - game state not available');
              }
            }}
            variant="outline"
            className="text-left"
          >
            <div>
              <div className="font-medium">🚨 Balance Warnings</div>
              <div className="text-xs text-gray-600">Check for immediate balance issues</div>
            </div>
          </Button>

          <Button
            onClick={() => {
              const comparison = QuickBalanceAnalyzer.compareToOptimalStrategies();
              if (comparison) {
                const topMatch = comparison.comparisons[0];
                const output = `🎯 STRATEGY COMPARISON

📊 CURRENT STRATEGY ANALYSIS:
Your Allocation: ${Object.entries(comparison.currentStrategy.allocations).map(([k, v]) => `${k}: ${v}%`).join(', ')}
Overall Score: ${comparison.currentStrategy.efficiency.overallScore.toFixed(1)}

🏆 BEST MATCH: ${topMatch.strategy.name} (${(topMatch.similarity * 100).toFixed(0)}% similar)
${topMatch.recommendation}

📈 PERFORMANCE COMPARISON:
If you switched to ${topMatch.strategy.name}:
Knowledge: ${topMatch.performanceDiff.knowledge >= 0 ? '+' : ''}${topMatch.performanceDiff.knowledge.toFixed(1)} per week
Social: ${topMatch.performanceDiff.social >= 0 ? '+' : ''}${topMatch.performanceDiff.social.toFixed(1)} per week
Money: ${topMatch.performanceDiff.money >= 0 ? '+' : ''}${topMatch.performanceDiff.money.toFixed(1)} per week
Stress: ${topMatch.performanceDiff.stress >= 0 ? '+' : ''}${topMatch.performanceDiff.stress.toFixed(1)} change

🎯 OTHER STRATEGY OPTIONS:
${comparison.comparisons.slice(1, 3).map((comp: any) => 
  `• ${comp.strategy.name}: ${(comp.similarity * 100).toFixed(0)}% similar`
).join('\n')}`;
                
                setQuickToolsOutput(output);
                console.log(output);
              } else {
                setQuickToolsOutput('❌ Unable to compare strategies - game state not available');
              }
            }}
            variant="outline"
            className="text-left"
          >
            <div>
              <div className="font-medium">📊 Compare Strategies</div>
              <div className="text-xs text-gray-600">Compare current build to optimal strategies</div>
            </div>
          </Button>
        </div>
      </Card>

      {/* Output Display Area */}
      {quickToolsOutput && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-900">Analysis Output</h4>
            <Button
              onClick={() => setQuickToolsOutput('')}
              variant="outline"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          </div>
          <pre className="bg-gray-50 p-4 rounded-md text-sm font-mono whitespace-pre-wrap overflow-x-auto border">
            {quickToolsOutput}
          </pre>
        </Card>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Balance Testing Dashboard</h2>
        <div className="text-sm text-gray-600">
          Test game balance and identify optimization opportunities
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b">
        {[
          { id: 'simulation', label: '🎲 Monte Carlo', desc: 'Statistical simulation' },
          { id: 'stress', label: '🔥 Stress Tests', desc: 'Edge cases & breaking points' },
          { id: 'quick-tools', label: '⚡ Quick Tools', desc: 'Instant balance checks' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div>{tab.label}</div>
            <div className="text-xs opacity-75">{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'simulation' && renderSimulationTab()}
      {activeTab === 'stress' && renderStressTab()}
      {activeTab === 'quick-tools' && renderQuickToolsTab()}
    </div>
  );
};

export default BalanceTestingPanel;