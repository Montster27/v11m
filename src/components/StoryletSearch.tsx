// /Users/montysharma/V11M2/src/components/StoryletSearch.tsx
import React from 'react';
import { Button, Card } from './ui';
import { StoryletDeploymentStatus } from '../types/storylet';

interface SearchFilters {
  searchInName: boolean;
  searchInDescription: boolean;
  searchInId: boolean;
  searchInChoices: boolean;
  searchInStoryArc: boolean;
  onlyActive: boolean;
  onlyCompleted: boolean;
}

interface StoryletSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchFilters: SearchFilters;
  setSearchFilters: (filters: SearchFilters) => void;
  selectedStoryArc: string;
  setSelectedStoryArc: (arc: string) => void;
  storyArcs: string[];
  deploymentFilter: Set<StoryletDeploymentStatus>;
  setDeploymentFilter: (filter: Set<StoryletDeploymentStatus>) => void;
}

export const StoryletSearch: React.FC<StoryletSearchProps> = ({
  searchQuery,
  setSearchQuery,
  searchFilters,
  setSearchFilters,
  selectedStoryArc,
  setSelectedStoryArc,
  storyArcs,
  deploymentFilter,
  setDeploymentFilter
}) => {
  const handleDeploymentFilterToggle = (status: StoryletDeploymentStatus) => {
    const newFilter = new Set(deploymentFilter);
    if (newFilter.has(status)) {
      newFilter.delete(status);
    } else {
      newFilter.add(status);
    }
    setDeploymentFilter(newFilter);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Storylets</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, description, ID, or story arc..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">Story Arc</label>
          <select
            value={selectedStoryArc}
            onChange={(e) => setSelectedStoryArc(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Arcs</option>
            {storyArcs.map(arc => (
              <option key={arc} value={arc}>{arc}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search In</label>
          <div className="space-y-2">
            {[
              { key: 'searchInName', label: 'Name' },
              { key: 'searchInDescription', label: 'Description' },
              { key: 'searchInId', label: 'ID' },
              { key: 'searchInChoices', label: 'Choices' },
              { key: 'searchInStoryArc', label: 'Story Arc' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={searchFilters[key as keyof SearchFilters] as boolean}
                  onChange={(e) => setSearchFilters({
                    ...searchFilters,
                    [key]: e.target.checked
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Filters</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={searchFilters.onlyActive}
                onChange={(e) => setSearchFilters({
                  ...searchFilters,
                  onlyActive: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Only Active</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={searchFilters.onlyCompleted}
                onChange={(e) => setSearchFilters({
                  ...searchFilters,
                  onlyCompleted: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Only Completed</span>
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Deployment Status</label>
            <div className="flex flex-wrap gap-2">
              {(['dev', 'stage', 'live'] as StoryletDeploymentStatus[]).map(status => (
                <Button
                  key={status}
                  onClick={() => handleDeploymentFilterToggle(status)}
                  variant={deploymentFilter.has(status) ? 'primary' : 'outline'}
                  size="sm"
                  className="text-xs"
                >
                  {status.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};