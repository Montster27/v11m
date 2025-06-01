// /Users/montysharma/V11M2/src/pages/Quests.tsx
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/ui';
import QuestManager from '../components/QuestManager';

const Quests: React.FC = () => {
  const { 
    completedQuests, 
    userLevel, 
    experience
  } = useAppStore();

  const experienceToNextLevel = (userLevel * 100) - experience;
  const experienceProgress = ((experience % 100) / 100) * 100;

  return (
    <div className="page-container min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Quest System</h1>
          <p className="text-lg text-gray-600">
            Create, manage, and complete quests to gain experience and level up your life
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

        {/* Quest Management Interface */}
        <Card title="Quest Management" variant="elevated" className="mb-6">
          <QuestManager />
        </Card>

        {/* Quest Statistics */}
        <Card title="Quest Statistics" className="mt-6" variant="elevated">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{useAppStore.getState().activeQuests.length}</div>
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