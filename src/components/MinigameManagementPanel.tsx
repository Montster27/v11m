// /Users/montysharma/V11M2/src/components/MinigameManagementPanel.tsx
import React, { useState, useEffect } from 'react';
import { Button, Card } from './ui';
import { MinigameRegistry } from './minigames/plugins';
import ModernMinigameManager from './minigames/ModernMinigameManager';
import { MinigamePlugin } from './minigames/core/types';
import MinigameSettings from './minigames/ui/MinigameSettings';
import { useMinigameStore } from '../stores/useMinigameStore';

type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

interface TestGameState {
  gameId: string | null;
  difficulty: DifficultyLevel;
  isActive: boolean;
}

type TabType = 'overview' | 'test' | 'integration';

const MinigameManagementPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [availableGames, setAvailableGames] = useState<MinigamePlugin[]>([]);
  const [testGameState, setTestGameState] = useState<TestGameState>({
    gameId: null,
    difficulty: 'medium',
    isActive: false
  });
  const [showSettings, setShowSettings] = useState(false);
  
  const minigameStore = useMinigameStore();

  // Load available games from the registry
  useEffect(() => {
    const games = MinigameRegistry.list();
    setAvailableGames(games);
    console.log('🎮 Loaded games from registry:', games.map(g => ({ id: g.id, name: g.name })));
  }, []);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '🎮' },
    { id: 'test' as TabType, label: 'Test Games', icon: '🎯' },
    { id: 'integration' as TabType, label: 'Integration', icon: '🔗' }
  ];

  // Get overall statistics for the overview
  const overallStats = minigameStore.getOverallStats();
  const achievements = Object.values(minigameStore.achievements);
  const recentAchievements = achievements
    .filter(achievement => Date.now() - achievement.unlockedAt < 7 * 24 * 60 * 60 * 1000) // Last 7 days
    .sort((a, b) => b.unlockedAt - a.unlockedAt)
    .slice(0, 5);

  const renderOverview = () => {
    const stats = MinigameRegistry.getRegistryStats();
    
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Modern Minigame System Overview</h3>
            <Button
              onClick={() => setShowSettings(true)}
              variant="outline"
              className="text-sm"
            >
              ⚙️ Settings
            </Button>
          </div>
          
          {/* Player Statistics Summary */}
          {overallStats.totalGames > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-3">Your Progress</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{overallStats.totalGames}</div>
                  <div className="text-sm text-gray-600">Games Played</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(overallStats.overallWinRate * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(overallStats.totalPlayTime / 60000)}m
                  </div>
                  <div className="text-sm text-gray-600">Play Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{achievements.length}</div>
                  <div className="text-sm text-gray-600">Achievements</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Achievements */}
          {recentAchievements.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-3">🏆 Recent Achievements</h4>
              <div className="space-y-2">
                {recentAchievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-3">
                    <div className="text-yellow-600">🏆</div>
                    <div>
                      <div className="font-medium text-yellow-900 text-sm">{achievement.name}</div>
                      <div className="text-xs text-yellow-700">{achievement.description}</div>
                    </div>
                    <div className="text-xs text-yellow-600">
                      {Math.floor((Date.now() - achievement.unlockedAt) / (24 * 60 * 60 * 1000))}d ago
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Available Minigames ({availableGames.length})</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableGames.map((game) => (
                  <div key={game.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900">{game.name}</div>
                          {(() => {
                            const gameStats = minigameStore.getGameStats(game.id);
                            if (gameStats && gameStats.totalPlays > 0) {
                              return (
                                <div className="text-xs text-gray-500">
                                  {gameStats.totalPlays} plays
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{game.description}</div>
                        <div className="flex space-x-2 mt-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {game.category}
                          </span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {game.cognitiveLoad} load
                          </span>
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            {Math.floor(game.estimatedDuration / 60)}m {game.estimatedDuration % 60}s
                          </span>
                        </div>
                        
                        {/* Player statistics for this game */}
                        {(() => {
                          const gameStats = minigameStore.getGameStats(game.id);
                          if (gameStats && gameStats.totalPlays > 0) {
                            const winRate = Math.round((gameStats.totalWins / gameStats.totalPlays) * 100);
                            const avgScore = Math.round(gameStats.averageScore);
                            return (
                              <div className="flex space-x-2 mt-2">
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {winRate}% win rate
                                </span>
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  Avg: {avgScore}
                                </span>
                                {gameStats.currentStreak > 0 && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                    🔥 {gameStats.currentStreak}
                                  </span>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        <div className="text-xs text-blue-600 mt-2">ID: {game.id}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">System Features</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Plugin-based architecture with hot-reloading</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Adaptive difficulty based on player skills</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Comprehensive performance analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Achievement system integration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Storylet and clue integration support</span>
                </div>
              </div>
              
              <h4 className="font-semibold text-gray-800 mt-6 mb-3">Registry Statistics</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Total Games: {stats.totalGames}</div>
                <div>Categories: {stats.categories.join(', ')}</div>
                <div>Average Duration: {stats.averageDuration}s</div>
                <div>Cognitive Loads: Low({stats.cognitiveLoads.low}), Med({stats.cognitiveLoads.medium}), High({stats.cognitiveLoads.high})</div>
              </div>
              
              <h4 className="font-semibold text-gray-800 mt-6 mb-3">Game Categories</h4>
              <div className="flex flex-wrap gap-2">
                {stats.categories.map(category => (
                  <span key={category} className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded capitalize">
                    {category} ({MinigameRegistry.listByCategory(category).length})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderTestGames = () => {
    const selectedGameId = testGameState.gameId;
    const selectedGame = selectedGameId ? MinigameRegistry.get(selectedGameId) : null;
    
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Test Modern Minigames</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Minigame to Test
              </label>
              <select
                value={selectedGameId || ''}
                onChange={(e) => {
                  setTestGameState(prev => ({
                    ...prev,
                    gameId: e.target.value || null
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a game...</option>
                {availableGames.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={testGameState.difficulty}
                onChange={(e) => setTestGameState(prev => ({
                  ...prev,
                  difficulty: e.target.value as DifficultyLevel
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <Button
              onClick={() => setTestGameState(prev => ({ ...prev, isActive: true }))}
              disabled={!selectedGameId}
              className="w-full md:w-auto"
            >
              Launch Test Game
            </Button>
          </div>

          {selectedGame && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="font-medium text-blue-900">
                {selectedGame.name}
                <span className="ml-2 text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded capitalize">
                  {testGameState.difficulty}
                </span>
                <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                  {selectedGame.category}
                </span>
              </div>
              <div className="text-sm text-blue-800 mt-1">
                {selectedGame.description}
              </div>
              <div className="mt-2 text-xs text-blue-700">
                <div>Estimated Duration: {Math.floor(selectedGame.estimatedDuration / 60)}m {selectedGame.estimatedDuration % 60}s</div>
                <div>Cognitive Load: {selectedGame.cognitiveLoad}</div>
                <div>Required Skills: {selectedGame.requiredSkills?.join(', ') || 'None specified'}</div>
                <div>Tags: {selectedGame.tags.join(', ')}</div>
              </div>
              <div className="mt-2 p-2 bg-blue-100 rounded text-xs">
                <div className="font-medium text-blue-900">Controls:</div>
                <div className="text-blue-700">{selectedGame.controls?.join(' • ') || 'See in-game instructions'}</div>
              </div>
            </div>
          )}

          {testGameState.isActive && selectedGameId && (
            <Card className="p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Testing: {selectedGame?.name}</h4>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="mr-3">Difficulty: <strong>{testGameState.difficulty}</strong></span>
                    <span>Game ID: <strong>{selectedGameId}</strong></span>
                  </div>
                </div>
                <Button 
                  onClick={() => setTestGameState(prev => ({ ...prev, isActive: false }))}
                  variant="outline"
                  className="text-sm"
                >
                  Close Test
                </Button>
              </div>
              
              <div className="border border-gray-200 rounded-lg bg-white min-h-[400px] relative">
                <ModernMinigameManager
                  gameId={selectedGameId}
                  context={{
                    difficulty: testGameState.difficulty,
                    practiceMode: true
                  }}
                  onGameComplete={(success: boolean, stats?: any) => {
                    console.log('🎮 Modern minigame completed:', { success, stats, gameId: selectedGameId });
                    const statsDisplay = stats ? JSON.stringify(stats, null, 2) : 'No stats';
                    alert(`🎮 Game: ${selectedGame?.name}\n✅ Success: ${success}\n📊 Stats: ${statsDisplay}`);
                    setTestGameState(prev => ({ ...prev, isActive: false }));
                  }}
                  onClose={() => {
                    console.log('🎮 Modern minigame closed by user');
                    setTestGameState(prev => ({ ...prev, isActive: false }));
                  }}
                />
              </div>
            </Card>
          )}
        </Card>
      </div>
    );
  };

  const renderIntegration = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Modern Minigame Integration Guide</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Plugin-Based Architecture</h4>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 mb-3">
                The new system uses a plugin-based architecture with these key features:
              </p>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Centralized MinigameRegistry for plugin discovery</li>
                <li>• ModernMinigameManager for unified game launching</li>
                <li>• Adaptive difficulty based on player performance</li>
                <li>• Comprehensive analytics and achievement tracking</li>
                <li>• Hot-reloadable plugins for development</li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Storylet Integration</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 mb-3">
                Add minigame effects to storylet choices using the new game IDs:
              </p>
              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`{
  type: "minigame",
  gameId: "memory-cards",  // New plugin ID
  difficulty: "medium",    // Optional: easy, medium, hard, expert
  onSuccess: [
    { type: "resource", key: "knowledge", delta: 10 },
    { type: "domainXp", domain: "intellectualCompetence", amount: 15 },
    { type: "flag", key: "memoryTestPassed", value: true }
  ],
  onFailure: [
    { type: "resource", key: "stress", delta: 5 }
  ]
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Clue Discovery Integration</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 mb-3">
                Set minigame requirements for clue discovery:
              </p>
              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`{
  type: "clueDiscovery",
  clueId: "pattern_analysis",
  minigameType: "pattern-sequence",
  difficulty: "hard",
  onSuccess: [
    { type: "resource", key: "knowledge", delta: 8 },
    { type: "flag", key: "patternClueFound", value: true }
  ]
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Available Plugin Game IDs</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableGames.map((game) => (
                <div key={game.id} className="bg-blue-50 p-3 rounded">
                  <div className="font-mono text-sm text-blue-800">{game.id}</div>
                  <div className="text-xs text-blue-600 mt-1">{game.name}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Category: {game.category}
                  </div>
                  <div className="text-xs text-gray-600">
                    Load: {game.cognitiveLoad}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Game Categories & Use Cases</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MinigameRegistry.getRegistryStats().categories.map((category) => {
                const categoryGames = MinigameRegistry.listByCategory(category);
                return (
                  <div key={category} className="bg-purple-50 p-3 rounded">
                    <div className="font-medium text-purple-900 text-sm capitalize">{category}</div>
                    <div className="text-xs text-purple-700 mt-1">
                      Games: {categoryGames.map(g => g.name).join(', ')}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Count: {categoryGames.length}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Difficulty Levels</h4>
            <div className="grid grid-cols-4 gap-3">
              {['easy', 'medium', 'hard', 'expert'].map((difficulty) => (
                <div key={difficulty} className="bg-green-50 p-3 rounded text-center">
                  <div className="font-medium text-green-800 capitalize">{difficulty}</div>
                  <div className="text-xs text-green-600 mt-1">
                    {difficulty === 'easy' && 'Forgiving, simple'}
                    {difficulty === 'medium' && 'Balanced challenge'}
                    {difficulty === 'hard' && 'Fast, complex'}
                    {difficulty === 'expert' && 'Maximum challenge'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Advanced Features</h4>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-800 space-y-2">
                <div><strong>Adaptive Difficulty:</strong> Games automatically adjust based on player performance</div>
                <div><strong>Analytics Integration:</strong> Comprehensive tracking of player progress and skill development</div>
                <div><strong>Achievement System:</strong> Automatic achievement unlocking based on game performance</div>
                <div><strong>Skill-Based Matching:</strong> Games recommended based on player skill levels</div>
                <div><strong>Practice Mode:</strong> Special mode for testing without affecting player stats</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'test' && renderTestGames()}
      {activeTab === 'integration' && renderIntegration()}
      
      {/* Settings Modal */}
      <MinigameSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

export default MinigameManagementPanel;