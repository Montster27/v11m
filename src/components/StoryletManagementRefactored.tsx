// /Users/montysharma/V11M2/src/components/StoryletManagementRefactored.tsx
// This is a refactored version that demonstrates the component breakdown approach
// The original file can be gradually migrated to use these patterns

import React, { useState, useEffect } from 'react';
import { useStoryletStore } from '../store/useStoryletStore';
import { useClueStore } from '../store/useClueStore';
import { useNPCStore } from '../store/useNPCStore';
import { Button, Card } from './ui';
import { StoryletDeploymentStatus, Storylet } from '../types/storylet';
import { StoryletOverview } from './StoryletOverview';
import { StoryletSearch } from './StoryletSearch';
import { StoryletBulkOperations } from './StoryletBulkOperations';
import StoryArcVisualizer from './StoryArcVisualizer';
import ArcProgressDisplay from './ArcProgressDisplay';

type StoryletTabType = 'overview' | 'manage' | 'search' | 'arcs' | 'create';

interface SearchFilters {
  searchInName: boolean;
  searchInDescription: boolean;
  searchInId: boolean;
  searchInChoices: boolean;
  searchInStoryArc: boolean;
  onlyActive: boolean;
  onlyCompleted: boolean;
}

export const StoryletManagementRefactored: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StoryletTabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchInName: true,
    searchInDescription: true,
    searchInId: true,
    searchInChoices: false,
    searchInStoryArc: true,
    onlyActive: false,
    onlyCompleted: false
  });
  const [selectedStoryArc, setSelectedStoryArc] = useState<string>('');
  const [selectedStoryletIds, setSelectedStoryletIds] = useState<Set<string>>(new Set());
  const [visualizingArc, setVisualizingArc] = useState<string | null>(null);

  const {
    allStorylets,
    activeStoryletIds,
    completedStoryletIds,
    deploymentFilter,
    storyArcs,
    setDeploymentFilter,
    updateStoryletDeploymentStatus,
    deleteStorylet,
    getStoryletsByArc
  } = useStoryletStore();

  const { clues } = useClueStore();

  // Clear selections when filtering changes or tab changes
  useEffect(() => {
    setSelectedStoryletIds(new Set());
  }, [searchQuery, selectedStoryArc, activeTab, deploymentFilter]);

  // Search and filtering logic
  const searchStorylets = (storylets: Storylet[], query: string) => {
    if (!query.trim()) return storylets;
    
    const lowerQuery = query.toLowerCase();
    return storylets.filter(storylet => {
      if (searchFilters.searchInName && storylet.name.toLowerCase().includes(lowerQuery)) return true;
      if (searchFilters.searchInDescription && storylet.description.toLowerCase().includes(lowerQuery)) return true;
      if (searchFilters.searchInId && storylet.id.toLowerCase().includes(lowerQuery)) return true;
      if (searchFilters.searchInStoryArc && storylet.storyArc && storylet.storyArc.toLowerCase().includes(lowerQuery)) return true;
      if (searchFilters.searchInChoices && storylet.choices.some(choice => 
        choice.text.toLowerCase().includes(lowerQuery) || choice.id.toLowerCase().includes(lowerQuery)
      )) return true;
      return false;
    });
  };

  const filteredStorylets = Object.values(allStorylets).filter(storylet => {
    // Deployment status filter
    const status = storylet.deploymentStatus || 'live';
    if (!deploymentFilter.has(status)) return false;
    
    // Story arc filter
    if (selectedStoryArc && storylet.storyArc !== selectedStoryArc) return false;
    
    return true;
  });

  const searchFilteredStorylets = searchStorylets(filteredStorylets, searchQuery);
  
  const activityFilteredStorylets = searchFilteredStorylets.filter(storylet => {
    if (searchFilters.onlyActive && !activeStoryletIds.includes(storylet.id)) return false;
    if (searchFilters.onlyCompleted && !completedStoryletIds.includes(storylet.id)) return false;
    return true;
  });

  // Bulk operations
  const handleSelectAllStorylets = () => {
    setSelectedStoryletIds(new Set(activityFilteredStorylets.map(s => s.id)));
  };

  const handleDeselectAllStorylets = () => {
    setSelectedStoryletIds(new Set());
  };

  const handleBulkStatusUpdate = () => {
    const newStatus = prompt('Enter new status (dev/stage/live):') as StoryletDeploymentStatus;
    if (newStatus && ['dev', 'stage', 'live'].includes(newStatus)) {
      selectedStoryletIds.forEach(id => {
        updateStoryletDeploymentStatus(id, newStatus);
      });
      setSelectedStoryletIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedStoryletIds.size} storylets?`)) {
      selectedStoryletIds.forEach(id => {
        deleteStorylet(id);
      });
      setSelectedStoryletIds(new Set());
    }
  };

  const handleToggleStoryletSelection = (storyletId: string) => {
    const newSelection = new Set(selectedStoryletIds);
    if (newSelection.has(storyletId)) {
      newSelection.delete(storyletId);
    } else {
      newSelection.add(storyletId);
    }
    setSelectedStoryletIds(newSelection);
  };

  if (visualizingArc) {
    return (
      <StoryArcVisualizer 
        arcName={visualizingArc} 
        onClose={() => setVisualizingArc(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Storylet Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage storylets, track progress, and organize story arcs
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'manage', label: 'Manage' },
          { id: 'search', label: 'Search & Browse' },
          { id: 'arcs', label: 'Story Arcs' },
          { id: 'create', label: 'Create' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as StoryletTabType)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <StoryletOverview
          allStorylets={allStorylets}
          activeStoryletIds={activeStoryletIds}
          completedStoryletIds={completedStoryletIds}
          storyArcs={storyArcs}
          getStoryletsByArc={getStoryletsByArc}
        />
      )}

      {activeTab === 'search' && (
        <div className="space-y-6">
          <StoryletSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchFilters={searchFilters}
            setSearchFilters={setSearchFilters}
            selectedStoryArc={selectedStoryArc}
            setSelectedStoryArc={setSelectedStoryArc}
            storyArcs={storyArcs}
            deploymentFilter={deploymentFilter}
            setDeploymentFilter={setDeploymentFilter}
          />

          <StoryletBulkOperations
            selectedStoryletIds={selectedStoryletIds}
            storylets={activityFilteredStorylets}
            onSelectAll={handleSelectAllStorylets}
            onDeselectAll={handleDeselectAllStorylets}
            onBulkStatusUpdate={handleBulkStatusUpdate}
            onBulkDelete={handleBulkDelete}
          />

          {/* Storylet List */}
          <div className="space-y-4">
            {activityFilteredStorylets.map((storylet) => {
              const currentStatus = storylet.deploymentStatus || 'live';
              const isActive = activeStoryletIds.includes(storylet.id);
              const isCompleted = completedStoryletIds.includes(storylet.id);
              
              return (
                <Card key={storylet.id} className={`p-4 transition-colors ${
                  selectedStoryletIds.has(storylet.id) ? 'bg-blue-50 border-blue-300' : ''
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedStoryletIds.has(storylet.id)}
                        onChange={() => handleToggleStoryletSelection(storylet.id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">{storylet.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded ${
                            isActive ? 'bg-green-100 text-green-800' :
                            isCompleted ? 'bg-gray-100 text-gray-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {isActive ? 'Active' : isCompleted ? 'Completed' : 'Available'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{storylet.description}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          ID: {storylet.id} | Trigger: {storylet.trigger.type}
                          {storylet.storyArc && <> | Arc: {storylet.storyArc}</>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        currentStatus === 'live' ? 'bg-green-100 text-green-800' :
                        currentStatus === 'stage' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {currentStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'arcs' && (
        <div className="space-y-6">
          <ArcProgressDisplay />
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Story Arc Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storyArcs.map(arc => (
                <Card key={arc} className="p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-2">{arc}</h4>
                  <div className="space-y-2">
                    <Button
                      onClick={() => setVisualizingArc(arc)}
                      variant="primary"
                      size="sm"
                      className="w-full"
                    >
                      Visualize Arc
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'create' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Storylet</h3>
          <p className="text-gray-600">
            Storylet creation functionality would go here. 
            This demonstrates how the component can be broken down into focused sections.
          </p>
        </Card>
      )}
    </div>
  );
};