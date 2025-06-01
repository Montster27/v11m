// /Users/montysharma/V11M2/src/components/QuestManager.tsx
import React, { useState } from 'react';
import { useAppStore, Quest } from '../store/useAppStore';
import { Button, Card } from './ui';

type TabType = 'active' | 'completed' | 'create' | 'templates';

interface QuestFormData {
  title: string;
  description: string;
  experienceReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

const QuestManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [formData, setFormData] = useState<QuestFormData>({
    title: '',
    description: '',
    experienceReward: 25,
    difficulty: 'easy',
    category: 'General'
  });

  const { 
    activeQuests, 
    completedQuests, 
    addQuest, 
    completeQuest 
  } = useAppStore();

  const tabs = [
    { id: 'active' as TabType, label: 'Active Quests', count: activeQuests.length },
    { id: 'completed' as TabType, label: 'Completed', count: completedQuests.length },
    { id: 'create' as TabType, label: 'Create Quest', count: null },
    { id: 'templates' as TabType, label: 'Templates', count: null }
  ];

  const categories = [
    'General', 'Health', 'Learning', 'Career', 'Social', 'Hobby', 
    'Finance', 'Fitness', 'Creativity', 'Personal Development'
  ];

  const questTemplates = [
    {
      title: 'Morning Routine Mastery',
      description: 'Establish and maintain a consistent morning routine for 7 days',
      experienceReward: 100,
      difficulty: 'medium' as const,
      category: 'Health'
    },
    {
      title: 'Learn Something New',
      description: 'Spend 1 hour learning a new skill or subject',
      experienceReward: 50,
      difficulty: 'easy' as const,
      category: 'Learning'
    },
    {
      title: 'Network Builder',
      description: 'Connect with 3 new people in your professional field',
      experienceReward: 75,
      difficulty: 'medium' as const,
      category: 'Career'
    },
    {
      title: 'Fitness Challenge',
      description: 'Complete a 30-minute workout session',
      experienceReward: 40,
      difficulty: 'easy' as const,
      category: 'Fitness'
    },
    {
      title: 'Budget Tracker',
      description: 'Track all expenses for one week and create a budget plan',
      experienceReward: 150,
      difficulty: 'hard' as const,
      category: 'Finance'
    }
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    const newQuest: Quest = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      experienceReward: formData.experienceReward,
      difficulty: formData.difficulty,
      category: formData.category,
      completed: false
    };

    addQuest(newQuest);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      experienceReward: 25,
      difficulty: 'easy',
      category: 'General'
    });
    
    // Switch to active tab to see the new quest
    setActiveTab('active');
  };

  const handleTemplateUse = (template: typeof questTemplates[0]) => {
    setFormData({
      title: template.title,
      description: template.description,
      experienceReward: template.experienceReward,
      difficulty: template.difficulty,
      category: template.category
    });
    setActiveTab('create');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderActiveQuests = () => (
    <div className="space-y-4">
      {activeQuests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No active quests yet</p>
          <Button 
            onClick={() => setActiveTab('create')} 
            variant="primary"
          >
            Create Your First Quest
          </Button>
        </div>
      ) : (
        activeQuests.map((quest) => (
          <Card key={quest.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{quest.title}</h3>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(quest.difficulty)}`}>
                  {quest.difficulty}
                </span>
                <Button
                  onClick={() => setEditingQuest(quest)}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  Edit
                </Button>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">{quest.description}</p>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Category: <span className="font-medium">{quest.category}</span>
                </span>
                <span className="text-sm font-medium text-blue-600">
                  +{quest.experienceReward} XP
                </span>
              </div>
              <Button
                onClick={() => completeQuest(quest.id)}
                variant="primary"
                size="sm"
              >
                Complete Quest
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  const renderCompletedQuests = () => (
    <div className="space-y-3">
      {completedQuests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No completed quests yet</p>
          <p className="text-sm text-gray-400 mt-2">Complete some active quests to see them here</p>
        </div>
      ) : (
        completedQuests.slice().reverse().map((quest) => (
          <Card key={quest.id} className="bg-green-50 border-green-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  {quest.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{quest.description}</p>
                <div className="flex items-center space-x-3 mt-2">
                  <span className="text-xs text-gray-500">{quest.category}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(quest.difficulty)}`}>
                    {quest.difficulty}
                  </span>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-green-600 font-semibold">+{quest.experienceReward} XP</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  const renderCreateQuest = () => (
    <Card title="Create New Quest">
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quest Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter quest title..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe what needs to be accomplished..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              XP Reward
            </label>
            <input
              type="number"
              value={formData.experienceReward}
              onChange={(e) => setFormData({ ...formData, experienceReward: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="500"
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button type="submit" variant="primary">
            Create Quest
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setFormData({
              title: '',
              description: '',
              experienceReward: 25,
              difficulty: 'easy',
              category: 'General'
            })}
          >
            Clear Form
          </Button>
        </div>
      </form>
    </Card>
  );

  const renderTemplates = () => (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Quest Templates</h3>
        <p className="text-gray-600">Use these pre-made templates to quickly create common quests</p>
      </div>
      
      {questTemplates.map((template, index) => (
        <Card key={index} className="border border-gray-200 hover:border-blue-300 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-900">{template.title}</h4>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(template.difficulty)}`}>
                {template.difficulty}
              </span>
              <Button
                onClick={() => handleTemplateUse(template)}
                size="sm"
                variant="primary"
              >
                Use Template
              </Button>
            </div>
          </div>
          
          <p className="text-gray-600 mb-3">{template.description}</p>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Category: <span className="font-medium">{template.category}</span>
            </span>
            <span className="text-sm font-medium text-blue-600">
              +{template.experienceReward} XP
            </span>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'active' && renderActiveQuests()}
        {activeTab === 'completed' && renderCompletedQuests()}
        {activeTab === 'create' && renderCreateQuest()}
        {activeTab === 'templates' && renderTemplates()}
      </div>

      {/* Edit Quest Modal (if needed) */}
      {editingQuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Quest</h3>
            <p className="text-gray-600 mb-4">
              Quest editing functionality coming soon. For now, you can complete the quest or create a new one.
            </p>
            <div className="flex space-x-3">
              <Button 
                onClick={() => setEditingQuest(null)}
                variant="outline"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  completeQuest(editingQuest.id);
                  setEditingQuest(null);
                }}
                variant="primary"
              >
                Complete Quest
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestManager;