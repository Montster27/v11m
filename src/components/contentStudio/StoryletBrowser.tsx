// /Users/montysharma/V11M2/src/components/contentStudio/StoryletBrowser.tsx

import React, { useState, useMemo } from 'react';
import { useStoryletStore } from '../../store/useStoryletStore';
import { useStoryletCatalogStore } from '../../store/useStoryletCatalogStore';
import type { Storylet } from '../../types/storylet';
import HelpTooltip from '../ui/HelpTooltip';

interface StoryletBrowserProps {
  onEditStorylet: (storylet: Storylet) => void;
  onEditVisually?: (storylet: Storylet) => void;
  undoRedoSystem: {
    executeAction: (action: any) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
  };
}

interface SearchFilters {
  searchQuery: string;
  storyArc: string;
  deploymentStatus: 'all' | 'live' | 'stage' | 'dev';
  activity: 'all' | 'active' | 'completed' | 'available';
  searchInContent: boolean;
}

const StoryletBrowser: React.FC<StoryletBrowserProps> = ({ onEditStorylet, onEditVisually, undoRedoSystem }) => {
  // Use reactive subscriptions to both stores
  const allStorylets = useStoryletCatalogStore(state => state.allStorylets);
  const {
    activeStoryletIds,
    completedStoryletIds,
    storyArcs,
    deploymentFilter,
    deleteStorylet,
    updateStoryletDeploymentStatus
  } = useStoryletStore();
  
  // Debug logging
  console.log(`📚 StoryletBrowser: ${Object.keys(allStorylets).length} storylets in catalog`);

  // Helper function to safely format condition values
  const formatConditionValue = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      // Handle operator objects like {greater_equal: 5}
      if (typeof value === 'object') {
        const entries = Object.entries(value);
        if (entries.length === 1) {
          const [operator, operatorValue] = entries[0];
          switch (operator) {
            case 'greater_equal':
              return `${operatorValue}+`;
            case 'greater_than':
              return `>${operatorValue}`;
            case 'less_equal':
              return `≤${operatorValue}`;
            case 'less_than':
              return `<${operatorValue}`;
            case 'equals':
              return `=${operatorValue}`;
            case 'not_equals':
              return `≠${operatorValue}`;
            default:
              return JSON.stringify(value);
          }
        }
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    storyArc: 'all',
    deploymentStatus: 'all',
    activity: 'all',
    searchInContent: false
  });

  const [sortBy, setSortBy] = useState<'name' | 'id' | 'arc' | 'status'>('name');
  const [selectedStorylets, setSelectedStorylets] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Filtered and sorted storylets
  const filteredStorylets = useMemo(() => {
    let storylets = Object.values(allStorylets);

    // Text search
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      storylets = storylets.filter(storylet => {
        return (
          storylet.name.toLowerCase().includes(query) ||
          storylet.id.toLowerCase().includes(query) ||
          (storylet.storyArc && storylet.storyArc.toLowerCase().includes(query)) ||
          storylet.description.toLowerCase().includes(query) ||
          (filters.searchInContent && storylet.content && storylet.content.toLowerCase().includes(query)) ||
          storylet.choices.some(choice => choice.text.toLowerCase().includes(query))
        );
      });
    }

    // Story arc filter
    if (filters.storyArc !== 'all') {
      if (filters.storyArc === '') {
        // Show storylets with no arc (undefined, null, or empty string)
        storylets = storylets.filter(storylet => !storylet.storyArc || storylet.storyArc.trim() === '');
      } else {
        storylets = storylets.filter(storylet => storylet.storyArc === filters.storyArc);
      }
    }

    // Deployment status filter
    if (filters.deploymentStatus !== 'all') {
      storylets = storylets.filter(storylet => {
        const status = storylet.deploymentStatus || 'live';
        return status === filters.deploymentStatus;
      });
    }

    // Activity filter
    if (filters.activity !== 'all') {
      storylets = storylets.filter(storylet => {
        const isActive = activeStoryletIds.includes(storylet.id);
        const isCompleted = completedStoryletIds.includes(storylet.id);
        
        switch (filters.activity) {
          case 'active':
            return isActive;
          case 'completed':
            return isCompleted;
          case 'available':
            return !isActive && !isCompleted;
          default:
            return true;
        }
      });
    }

    // Sort storylets
    storylets.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'id':
          return (a.id || '').localeCompare(b.id || '');
        case 'arc':
          return (a.storyArc || '').localeCompare(b.storyArc || '');
        case 'status':
          const statusA = a.deploymentStatus || 'live';
          const statusB = b.deploymentStatus || 'live';
          return statusA.localeCompare(statusB);
        default:
          return 0;
      }
    });

    return storylets;
  }, [allStorylets, filters, sortBy, activeStoryletIds, completedStoryletIds]);

  // Get activity status
  const getActivityStatus = (storylet: Storylet) => {
    const isActive = activeStoryletIds.includes(storylet.id);
    const isCompleted = completedStoryletIds.includes(storylet.id);
    
    if (isActive) return { label: 'Active', color: 'green' };
    if (isCompleted) return { label: 'Completed', color: 'gray' };
    return { label: 'Available', color: 'blue' };
  };

  // Get deployment status color
  const getDeploymentStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'green';
      case 'stage': return 'yellow';
      case 'dev': return 'red';
      default: return 'gray';
    }
  };

  // Handle storylet selection
  const toggleStoryletSelection = (storyletId: string) => {
    const newSelection = new Set(selectedStorylets);
    if (newSelection.has(storyletId)) {
      newSelection.delete(storyletId);
    } else {
      newSelection.add(storyletId);
    }
    setSelectedStorylets(newSelection);
  };

  // Handle bulk operations
  const handleBulkDelete = () => {
    if (selectedStorylets.size === 0) return;
    
    const confirmed = confirm(`Are you sure you want to delete ${selectedStorylets.size} storylet(s)? This action cannot be undone.`);
    if (!confirmed) return;

    const storyletsToDelete = Array.from(selectedStorylets);
    const deletedStorylets = storyletsToDelete.map(id => allStorylets[id]).filter(Boolean);

    const undoAction = {
      id: `bulk_delete_${Date.now()}`,
      description: `Delete ${storyletsToDelete.length} storylets`,
      timestamp: new Date(),
      redoAction: () => {
        storyletsToDelete.forEach(id => deleteStorylet(id));
      },
      undoAction: () => {
        deletedStorylets.forEach(storylet => {
          useStoryletStore.getState().addStorylet(storylet);
        });
      }
    };

    undoRedoSystem.executeAction(undoAction);
    setSelectedStorylets(new Set());
  };

  const handleBulkStatusChange = (newStatus: 'dev' | 'stage' | 'live') => {
    if (selectedStorylets.size === 0) return;

    const storyletsToUpdate = Array.from(selectedStorylets);
    const originalStatuses = storyletsToUpdate.map(id => ({
      id,
      status: allStorylets[id]?.deploymentStatus || 'live'
    }));

    const undoAction = {
      id: `bulk_status_${Date.now()}`,
      description: `Change status of ${storyletsToUpdate.length} storylets to ${newStatus}`,
      timestamp: new Date(),
      redoAction: () => {
        storyletsToUpdate.forEach(id => updateStoryletDeploymentStatus(id, newStatus));
      },
      undoAction: () => {
        originalStatuses.forEach(({ id, status }) => {
          updateStoryletDeploymentStatus(id, status as 'dev' | 'stage' | 'live');
        });
      }
    };

    undoRedoSystem.executeAction(undoAction);
    setSelectedStorylets(new Set());
  };

  // Render storylet card
  const renderStoryletCard = (storylet: Storylet) => {
    const activityStatus = getActivityStatus(storylet);
    const deploymentStatus = storylet.deploymentStatus || 'live';
    const deploymentColor = getDeploymentStatusColor(deploymentStatus);
    const isSelected = selectedStorylets.has(storylet.id);

    return (
      <div
        key={storylet.id}
        className={`bg-white rounded-lg border-2 transition-all hover:shadow-md ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        }`}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 flex-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleStoryletSelection(storylet.id)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{storylet.name}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{storylet.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>ID: {storylet.id}</span>
                  {storylet.storyArc && (
                    <>
                      <span>•</span>
                      <span>Arc: {storylet.storyArc}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>Trigger: {storylet.trigger.type}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded bg-${activityStatus.color}-100 text-${activityStatus.color}-800`}>
                {activityStatus.label}
              </span>
              <span className={`px-2 py-1 text-xs rounded bg-${deploymentColor}-100 text-${deploymentColor}-800`}>
                {deploymentStatus.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{storylet.choices.length} choice(s)</span>
              {storylet.trigger.type === 'time' && storylet.trigger.conditions?.day && (
                <>
                  <span>•</span>
                  <span>Day {formatConditionValue(storylet.trigger.conditions.day)}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEditStorylet(storylet)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
              {onEditVisually && (
                <button
                  onClick={() => onEditVisually(storylet)}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                  title="Edit in visual flowchart editor"
                >
                  Visual
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${storylet.name}"?`)) {
                    console.log(`🗑️ Deleting storylet: ${storylet.id} - ${storylet.name}`);
                    const undoAction = {
                      id: `delete_${storylet.id}`,
                      description: `Delete storylet "${storylet.name}"`,
                      timestamp: new Date(),
                      redoAction: () => {
                        console.log(`🔄 Redo: Deleting storylet ${storylet.id}`);
                        deleteStorylet(storylet.id);
                      },
                      undoAction: () => {
                        console.log(`↩️ Undo: Restoring storylet ${storylet.id}`);
                        useStoryletStore.getState().addStorylet(storylet);
                      }
                    };
                    undoRedoSystem.executeAction(undoAction);
                  }
                }}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render storylet list item
  const renderStoryletListItem = (storylet: Storylet) => {
    const activityStatus = getActivityStatus(storylet);
    const deploymentStatus = storylet.deploymentStatus || 'live';
    const deploymentColor = getDeploymentStatusColor(deploymentStatus);
    const isSelected = selectedStorylets.has(storylet.id);

    return (
      <div
        key={storylet.id}
        className={`bg-white border-l-4 transition-all ${
          isSelected ? 'border-l-blue-500 bg-blue-50' : 'border-l-gray-200'
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleStoryletSelection(storylet.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-medium text-gray-900">{storylet.name}</h3>
                <span className={`px-2 py-1 text-xs rounded bg-${activityStatus.color}-100 text-${activityStatus.color}-800`}>
                  {activityStatus.label}
                </span>
                <span className={`px-2 py-1 text-xs rounded bg-${deploymentColor}-100 text-${deploymentColor}-800`}>
                  {deploymentStatus.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {storylet.storyArc && <span className="font-medium">{storylet.storyArc}</span>}
                {storylet.storyArc && <span className="mx-2">•</span>}
                <span>ID: {storylet.id}</span>
                <span className="mx-2">•</span>
                <span>{storylet.choices.length} choice(s)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditStorylet(storylet)}
              className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm font-medium border border-blue-300 rounded hover:bg-blue-50"
            >
              Edit
            </button>
            {onEditVisually && (
              <button
                onClick={() => onEditVisually(storylet)}
                className="px-3 py-1 text-purple-600 hover:text-purple-800 text-sm font-medium border border-purple-300 rounded hover:bg-purple-50"
                title="Edit in visual flowchart editor"
              >
                Visual
              </button>
            )}
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete "${storylet.name}"?`)) {
                  console.log(`🗑️ Deleting storylet: ${storylet.id} - ${storylet.name}`);
                  const undoAction = {
                    id: `delete_${storylet.id}`,
                    description: `Delete storylet "${storylet.name}"`,
                    timestamp: new Date(),
                    redoAction: () => {
                      console.log(`🔄 Redo: Deleting storylet ${storylet.id}`);
                      deleteStorylet(storylet.id);
                    },
                    undoAction: () => {
                      console.log(`↩️ Undo: Restoring storylet ${storylet.id}`);
                      useStoryletStore.getState().addStorylet(storylet);
                    }
                  };
                  undoRedoSystem.executeAction(undoAction);
                }
              }}
              className="px-3 py-1 text-red-600 hover:text-red-800 text-sm font-medium border border-red-300 rounded hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Storylet Browser</h3>
            <p className="text-sm text-gray-600">Browse, search, and edit existing storylets</p>
          </div>
          <div className="flex items-center gap-2">
            <HelpTooltip content="Browse all storylets in your game. Use filters to find specific storylets, then click Edit to modify them." />
            <div className="flex items-center border border-gray-300 rounded">
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1 text-sm ${viewMode === 'card' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Card
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search storylets..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Story Arc</label>
            <select
              value={filters.storyArc}
              onChange={(e) => setFilters(prev => ({ ...prev, storyArc: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Arcs</option>
              {storyArcs.map(arc => (
                <option key={arc} value={arc}>{arc}</option>
              ))}
              <option value="">No Arc</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.deploymentStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, deploymentStatus: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="live">Live</option>
              <option value="stage">Stage</option>
              <option value="dev">Development</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
            <select
              value={filters.activity}
              onChange={(e) => setFilters(prev => ({ ...prev, activity: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="available">Available</option>
            </select>
          </div>
        </div>

        {/* Additional options and sort */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.searchInContent}
                onChange={(e) => setFilters(prev => ({ ...prev, searchInContent: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Search in content
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="name">Name</option>
                <option value="id">ID</option>
                <option value="arc">Story Arc</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {filteredStorylets.length} storylet(s) found
          </div>
        </div>

        {/* Bulk operations */}
        {selectedStorylets.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">
                {selectedStorylets.size} storylet(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedStorylets(new Set())}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
                <button
                  onClick={() => handleBulkStatusChange('dev')}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                >
                  Mark Dev
                </button>
                <button
                  onClick={() => handleBulkStatusChange('stage')}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200"
                >
                  Mark Stage
                </button>
                <button
                  onClick={() => handleBulkStatusChange('live')}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                >
                  Mark Live
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Storylet List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredStorylets.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium mb-2">No storylets found</h3>
            <p className="text-sm">Try adjusting your search filters or create a new storylet.</p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredStorylets.map(renderStoryletCard)}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredStorylets.map(renderStoryletListItem)}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryletBrowser;