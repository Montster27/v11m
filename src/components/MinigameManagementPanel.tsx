// /Users/montysharma/V11M2/src/components/MinigameManagementPanel.tsx
import React, { useState } from 'react';
import { Button, Card } from './ui';
import { MemoryCardGame, MinigameManager } from './minigames';
import StroopTestGame from './minigames/StroopTestGame';
import WordScrambleGame from './minigames/WordScrambleGame';
import ColorMatchGame from './minigames/ColorMatchGame';
import PathPlannerGame from './minigames/PathPlannerGame';

type MinigameType = 'memory' | 'stroop' | 'wordscramble' | 'colormatch' | 'pathplanner';

interface MinigameInfo {
  id: MinigameType;
  name: string;
  description: string;
  component: React.ComponentType<any>;
  defaultProps?: any;
}

const AVAILABLE_MINIGAMES: MinigameInfo[] = [
  {
    id: 'memory',
    name: 'Memory Card Game',
    description: 'Match pairs of cards by remembering their positions. Tests working memory and concentration.',
    component: MemoryCardGame,
    defaultProps: { difficulty: 'medium' }
  },
  {
    id: 'stroop',
    name: 'Stroop Test',
    description: 'Name the color of words while ignoring the text. Tests cognitive flexibility and attention.',
    component: StroopTestGame,
    defaultProps: { difficulty: 'medium' }
  },
  {
    id: 'wordscramble',
    name: 'Word Scramble',
    description: 'Unscramble letters to form words. Tests vocabulary and pattern recognition.',
    component: WordScrambleGame,
    defaultProps: { difficulty: 'medium' }
  },
  {
    id: 'colormatch',
    name: 'Color Match',
    description: 'Match colors quickly and accurately. Tests reaction time and visual processing.',
    component: ColorMatchGame,
    defaultProps: { difficulty: 'medium' }
  },
  {
    id: 'pathplanner',
    name: 'Path Planner',
    description: 'Navigate through obstacles and solve routing puzzles. Tests spatial reasoning and planning skills.',
    component: PathPlannerGame,
    defaultProps: { difficulty: 'medium', variant: 'classic' }
  }
];

type TabType = 'overview' | 'test' | 'integration';

const MinigameManagementPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedMinigame, setSelectedMinigame] = useState<MinigameType>('memory');
  const [testingMinigame, setTestingMinigame] = useState<MinigameType | null>(null);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '🎮' },
    { id: 'test' as TabType, label: 'Test Games', icon: '🎯' },
    { id: 'integration' as TabType, label: 'Integration', icon: '🔗' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Minigame System Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Available Minigames</h4>
            <div className="space-y-3">
              {AVAILABLE_MINIGAMES.map((game) => (
                <div key={game.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-900">{game.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{game.description}</div>
                  <div className="text-xs text-blue-600 mt-2">ID: {game.id}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Integration Points</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Storylet effects can trigger minigames</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Clue discovery can require minigame completion</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Skill progression affects minigame difficulty</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Minigame performance affects character development</span>
              </div>
            </div>
            
            <h4 className="font-semibold text-gray-800 mt-6 mb-3">Usage Statistics</h4>
            <div className="text-sm text-gray-600">
              <div>Total Minigames: {AVAILABLE_MINIGAMES.length}</div>
              <div>Integration Types: Storylets, Clues, Skills</div>
              <div>Difficulty Levels: Easy, Medium, Hard</div>
            </div>
            
            <h4 className="font-semibold text-gray-800 mt-6 mb-3">Sample Data Available</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>✅ Memory Game Test Storylet</div>
              <div>✅ Stroop Test Integration Examples</div>
              <div>✅ Word Scramble Clue Discovery</div>
              <div>✅ Color Match Skill Training</div>
              <div>✅ Path Planner Cognitive Training</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTestGames = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Test Minigames</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Minigame to Test
            </label>
            <select
              value={selectedMinigame}
              onChange={(e) => setSelectedMinigame(e.target.value as MinigameType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {AVAILABLE_MINIGAMES.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={() => setTestingMinigame(selectedMinigame)}
              className="w-full"
            >
              Launch Test Game
            </Button>
          </div>
        </div>

        {selectedMinigame && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <div className="font-medium text-blue-900">
              {AVAILABLE_MINIGAMES.find(g => g.id === selectedMinigame)?.name}
            </div>
            <div className="text-sm text-blue-800 mt-1">
              {AVAILABLE_MINIGAMES.find(g => g.id === selectedMinigame)?.description}
            </div>
          </div>
        )}

        {testingMinigame && (
          <Card className="p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-900">Testing: {AVAILABLE_MINIGAMES.find(g => g.id === testingMinigame)?.name}</h4>
              <Button 
                onClick={() => setTestingMinigame(null)}
                variant="outline"
                className="text-sm"
              >
                Close Test
              </Button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-[400px] relative">
              {(() => {
                const game = AVAILABLE_MINIGAMES.find(g => g.id === testingMinigame);
                if (!game) {
                  return (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <div className="text-lg mb-2">⚠️ Game not found</div>
                        <div className="text-sm">Minigame "{testingMinigame}" is not available</div>
                      </div>
                    </div>
                  );
                }
                
                const GameComponent = game.component;
                try {
                  return (
                    <GameComponent
                      onGameComplete={(success: boolean, stats?: any) => {
                        console.log('🎮 Minigame completed:', { success, stats, gameId: testingMinigame });
                        const statsDisplay = stats ? JSON.stringify(stats, null, 2) : 'No stats';
                        alert(`🎮 Game: ${game.name}\n✅ Success: ${success}\n📊 Stats: ${statsDisplay}`);
                        setTestingMinigame(null);
                      }}
                      onClose={() => {
                        console.log('🎮 Minigame closed by user');
                        setTestingMinigame(null);
                      }}
                      difficulty="medium"
                      {...(game.defaultProps || {})}
                    />
                  );
                } catch (error) {
                  console.error('Error loading minigame:', error);
                  return (
                    <div className="flex items-center justify-center h-64 text-red-500">
                      <div className="text-center">
                        <div className="text-lg mb-2">❌ Error loading game</div>
                        <div className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</div>
                        <Button 
                          onClick={() => setTestingMinigame(null)}
                          className="mt-4"
                          variant="outline"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </Card>
        )}
      </Card>
    </div>
  );

  const renderIntegration = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Minigame Integration Guide</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Storylet Integration</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 mb-3">
                Add minigame effects to storylet choices:
              </p>
              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`{
  type: "minigame",
  gameId: "path-planner",
  onSuccess: [
    { type: "resource", key: "knowledge", delta: 10 },
    { type: "domainXp", domain: "intellectualCompetence", amount: 15 },
    { type: "flag", key: "puzzleSolved", value: true }
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
  clueId: "navigation_puzzle",
  minigameType: "path-planner",
  onSuccess: [
    { type: "resource", key: "knowledge", delta: 8 },
    { type: "flag", key: "navigationClueFound", value: true }
  ]
}`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Available Minigame IDs</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AVAILABLE_MINIGAMES.map((game) => (
                <div key={game.id} className="bg-blue-50 p-3 rounded text-center">
                  <div className="font-mono text-sm text-blue-800">{game.id}</div>
                  <div className="text-xs text-blue-600 mt-1">{game.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Difficulty Levels</h4>
            <div className="grid grid-cols-3 gap-3">
              {['easy', 'medium', 'hard'].map((difficulty) => (
                <div key={difficulty} className="bg-green-50 p-3 rounded text-center">
                  <div className="font-medium text-green-800 capitalize">{difficulty}</div>
                  <div className="text-xs text-green-600 mt-1">
                    {difficulty === 'easy' && 'Forgiving timing, simple patterns'}
                    {difficulty === 'medium' && 'Balanced challenge level'}
                    {difficulty === 'hard' && 'Fast timing, complex patterns'}
                  </div>
                </div>
              ))}
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
    </div>
  );
};

export default MinigameManagementPanel;