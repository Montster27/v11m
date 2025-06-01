// /Users/montysharma/V11M2/src/pages/Quests.tsx
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button, Card } from '../components/ui';

const Quests: React.FC = () => {
  const { 
    activeQuests, 
    completedQuests, 
    userLevel, 
    experience, 
    addQuest, 
    completeQuest 
  } = useAppStore();

  const experienceToNextLevel = (userLevel * 100) - experience;
  const experienceProgress = ((experience % 100) / 100) * 100;

  const generateSampleQuest = () => {
    const difficulties = ['easy', 'medium', 'hard'] as const;
    const categories = ['Health', 'Learning', 'Career', 'Social', 'Hobby'];
    const questTitles = [
      'Morning Workout Challenge',
      'Read for 30 Minutes',
      'Complete a Project Task',
      'Call a Friend',
      'Practice a New Skill',
      'Organize Your Workspace',
      'Take a Walk Outside',
      'Learn Something New'
    ];

    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const experienceRewards = { easy: 25, medium: 50, hard: 100 };

    return {
      id: Date.now().toString(),
      title: questTitles[Math.floor(Math.random() * questTitles.length)],
      description: `A ${difficulty} quest to help improve your daily routine and personal growth.`,
      experienceReward: experienceRewards[difficulty],
      difficulty,
      category: categories[Math.floor(Math.random() * categories.length)],
      completed: false
    };
  };

  return (
    <div className="page-container min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Quest System</h1>
          <p className="text-lg text-gray-600">
            Complete quests to gain experience and level up your life
          </p>
        </header>

        {/* Player Stats */}
        <Card title="Player Stats" className="mb-6" variant="elevated">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                Level {userLevel}
              </div>
              <div className="text-sm text-gray-600">Current Level</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {experience}
              </div>
              <div className="text-sm text-gray-600">Total Experience</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {experienceToNextLevel}
              </div>
              <div className="text-sm text-gray-600">XP to Next Level</div>
            </div>
          </div>
          
          {/* Experience Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Level {userLevel}</span>
              <span>Level {userLevel + 1}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${experienceProgress}%` }}
              ></div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Quests */}
          <Card title="Active Quests" subtitle="Complete these to gain experience" variant="elevated">
            <div className="space-y-4">
              {activeQuests.length === 0 ? (
                <p className="text-gray-500 italic">No active quests. Generate some quests to get started!</p>
              ) : (
                activeQuests.map((quest) => (
                  <div key={quest.id} className="border rounded-lg p-4 bg-white border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{quest.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        quest.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        quest.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {quest.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{quest.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500">
                          Category: {quest.category}
                        </span>
                        <span className="text-sm font-medium text-blue-600">
                          +{quest.experienceReward} XP
                        </span>
                      </div>
                      <Button
                        onClick={() => completeQuest(quest.id)}
                        size="sm"
                        variant="primary"
                      >
                        Complete
                      </Button>
                    </div>
                  </div>
                ))
              )}
              
              <div className="pt-4 border-t">
                <Button
                  onClick={() => addQuest(generateSampleQuest())}
                  variant="outline"
                  size="sm"
                >
                  Generate New Quest
                </Button>
              </div>
            </div>
          </Card>

          {/* Completed Quests */}
          <Card title="Completed Quests" subtitle="Your achievements" variant="elevated">
            <div className="space-y-3">
              {completedQuests.length === 0 ? (
                <p className="text-gray-500 italic">No completed quests yet. Complete some active quests!</p>
              ) : (
                completedQuests.slice(-5).map((quest) => (
                  <div key={quest.id} className="border rounded-lg p-3 bg-green-50 border-green-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-medium text-gray-900">{quest.title}</h5>
                        <span className="text-sm text-gray-600">{quest.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 font-medium">✓</div>
                        <div className="text-xs text-gray-500">+{quest.experienceReward} XP</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {completedQuests.length > 5 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  Showing latest 5 of {completedQuests.length} completed quests
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Quest Statistics */}
        <Card title="Quest Statistics" className="mt-6" variant="elevated">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{activeQuests.length}</div>
              <div className="text-sm text-gray-600">Active Quests</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{completedQuests.length}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {completedQuests.reduce((total, quest) => total + quest.experienceReward, 0)}
              </div>
              <div className="text-sm text-gray-600">XP Earned</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {completedQuests.length > 0 ? Math.round(completedQuests.reduce((total, quest) => total + quest.experienceReward, 0) / completedQuests.length) : 0}
              </div>
              <div className="text-sm text-gray-600">Avg XP per Quest</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Quests;
