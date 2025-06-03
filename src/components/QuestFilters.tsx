// /Users/montysharma/V11M2/src/components/QuestFilters.tsx
import React from 'react';
import { Button } from './ui';

interface QuestFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (difficulty: string) => void;
  onClearFilters: () => void;
}

const QuestFilters: React.FC<QuestFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  onClearFilters
}) => {
  const categories = [
    'All', 'General', 'Health', 'Learning', 'Career', 'Social', 'Hobby', 
    'Finance', 'Fitness', 'Creativity', 'Personal Development'
  ];

  const difficulties = ['All', 'easy', 'medium', 'hard'];

  const hasActiveFilters = searchTerm || selectedCategory !== 'All' || selectedDifficulty !== 'All';

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search quests..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'All' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <select
            value={selectedDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {difficulties.map(difficulty => (
              <option key={difficulty} value={difficulty}>
                {difficulty === 'All' ? 'All Difficulties' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button 
            onClick={onClearFilters}
            variant="outline"
            size="sm"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="text-sm text-gray-600">
          Filters active: 
          {searchTerm && <span className="ml-1 bg-blue-100 px-2 py-1 rounded">Search: "{searchTerm}"</span>}
          {selectedCategory !== 'All' && <span className="ml-1 bg-green-100 px-2 py-1 rounded">Category: {selectedCategory}</span>}
          {selectedDifficulty !== 'All' && <span className="ml-1 bg-yellow-100 px-2 py-1 rounded">Difficulty: {selectedDifficulty}</span>}
        </div>
      )}
    </div>
  );
};

export default QuestFilters;