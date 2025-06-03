// /Users/montysharma/V11M2/src/components/QuestEditor.tsx
import React, { useState, useEffect } from 'react';
import { useAppStore, Quest } from '../store/useAppStore';
import { Button, Card } from './ui';

interface QuestEditorProps {
  quest: Quest | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedQuest: Quest) => void;
}

const QuestEditor: React.FC<QuestEditorProps> = ({ quest, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    experienceReward: 25,
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    category: 'General'
  });

  const categories = [
    'General', 'Health', 'Learning', 'Career', 'Social', 'Hobby', 
    'Finance', 'Fitness', 'Creativity', 'Personal Development'
  ];

  useEffect(() => {
    if (quest) {
      setFormData({
        title: quest.title,
        description: quest.description,
        experienceReward: quest.experienceReward,
        difficulty: quest.difficulty,
        category: quest.category
      });
    }
  }, [quest]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quest || !formData.title.trim() || !formData.description.trim()) return;

    const updatedQuest: Quest = {
      ...quest,
      title: formData.title,
      description: formData.description,
      experienceReward: formData.experienceReward,
      difficulty: formData.difficulty,
      category: formData.category
    };

    onSave(updatedQuest);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Edit Quest</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              rows={4}
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

          <div className="flex space-x-3 pt-6">
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestEditor;