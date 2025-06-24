// /Users/montysharma/V11M2/src/components/contentStudio/StoryletBrowserRefactored.tsx
// Refactored StoryletBrowser using shared foundation - preserves all functionality

import React, { useState, useMemo } from 'react';
import { useStoryletStore } from '../../store/useStoryletStore';
import { useStoryletCatalogStore } from '../../store/useStoryletCatalogStore';
import type { Storylet } from '../../types/storylet';

// Shared foundation imports
import BaseStudioComponent from './shared/BaseStudioComponent';
import { useCRUDOperations } from './shared/useCRUDOperations';
import { useStudioValidation } from './shared/useStudioValidation';
import { useStudioPersistence } from './shared/useStudioPersistence';

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

const StoryletBrowserRefactored: React.FC<StoryletBrowserProps> = ({ 
  onEditStorylet, 
  onEditVisually, 
  undoRedoSystem 
}) => {
  // Store access - preserved original functionality
  const allStorylets = useStoryletCatalogStore(state => state.allStorylets);
  const {
    activeStoryletIds,
    completedStoryletIds,
    storyArcs,
    deploymentFilter,
    deleteStorylet,
    updateStoryletDeploymentStatus
  } = useStoryletStore();

  console.log(`📚 StoryletBrowser: ${Object.keys(allStorylets).length} storylets in catalog`);

  // Shared CRUD operations for storylet management
  const crud = useCRUDOperations<Storylet>({
    entityType: 'storylet',
    entityTypePlural: 'storylets',
    getAllItems: () => Object.values(allStorylets),
    createItem: () => { throw new Error('Creation handled by AdvancedStoryletCreator'); },
    updateItem: (storylet) => { /* Handle through store */ },
    deleteItem: (id) => deleteStorylet(id),
    undoRedoSystem,
    generateId: () => `storylet_${Date.now()}`,
    validateItem: (storylet) => ({
      isValid: !!(storylet.name && storylet.description),
      errors: {
        ...(storylet.name ? {} : { name: 'Name is required' }),
        ...(storylet.description ? {} : { description: 'Description is required' })
      }
    })
  });

  // Filter state - preserved original functionality
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

  // Preserved helper function
  const formatConditionValue = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      if (typeof value === 'object') {
        const entries = Object.entries(value);
        if (entries.length === 1) {
          const [operator, operatorValue] = entries[0];
          switch (operator) {
            case 'greater_equal': return `${operatorValue}+`;
            case 'greater_than': return `>${operatorValue}`;
            case 'less_equal': return `≤${operatorValue}`;
            case 'less_than': return `<${operatorValue}`;
            case 'equals': return `=${operatorValue}`;
            case 'not_equals': return `≠${operatorValue}`;
            default: return JSON.stringify(value);
          }
        }
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Preserved filtering logic
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
          (filters.searchInContent && storylet.content && storylet.content.toLowerCase().includes(query))
        );
      });
    }

    // Story arc filter
    if (filters.storyArc !== 'all') {
      storylets = storylets.filter(storylet => storylet.storyArc === filters.storyArc);
    }

    // Activity filter
    if (filters.activity !== 'all') {
      storylets = storylets.filter(storylet => {
        switch (filters.activity) {
          case 'active':
            return activeStoryletIds.includes(storylet.id);
          case 'completed':
            return completedStoryletIds.includes(storylet.id);
          case 'available':
            return !activeStoryletIds.includes(storylet.id) && !completedStoryletIds.includes(storylet.id);
          default:
            return true;
        }
      });
    }

    // Deployment status filter
    if (filters.deploymentStatus !== 'all') {
      storylets = storylets.filter(storylet => {
        const status = (storylet as any).deploymentStatus || 'dev';
        return status === filters.deploymentStatus;
      });
    }

    // Sorting
    storylets.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'id':
          return a.id.localeCompare(b.id);
        case 'arc':
          return (a.storyArc || '').localeCompare(b.storyArc || '');
        case 'status':
          const aStatus = activeStoryletIds.includes(a.id) ? 'active' : 
                         completedStoryletIds.includes(a.id) ? 'completed' : 'available';
          const bStatus = activeStoryletIds.includes(b.id) ? 'active' : 
                         completedStoryletIds.includes(b.id) ? 'completed' : 'available';
          return aStatus.localeCompare(bStatus);
        default:
          return 0;
      }
    });

    return storylets;
  }, [allStorylets, filters, sortBy, activeStoryletIds, completedStoryletIds]);

  // Selection management
  const handleSelectStorylet = (storyletId: string) => {
    setSelectedStorylets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyletId)) {
        newSet.delete(storyletId);
      } else {
        newSet.add(storyletId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedStorylets.size === filteredStorylets.length) {
      setSelectedStorylets(new Set());
    } else {
      setSelectedStorylets(new Set(filteredStorylets.map(s => s.id)));
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedStorylets.size === 0) return;
    
    const confirmed = window.confirm(`Delete ${selectedStorylets.size} selected storylets?`);
    if (!confirmed) return;

    for (const storyletId of selectedStorylets) {
      await crud.handleDelete(storyletId);
    }
    setSelectedStorylets(new Set());
  };

  const handleBulkDeploymentChange = (status: 'live' | 'stage' | 'dev') => {
    selectedStorylets.forEach(storyletId => {
      updateStoryletDeploymentStatus(storyletId, status);
    });
  };

  // Filter controls component
  const FilterControls = () => (
    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search storylets..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-2 top-2 text-gray-400">🔍</div>
          </div>
          <label className="flex items-center mt-1">
            <input
              type="checkbox"
              checked={filters.searchInContent}
              onChange={(e) => setFilters(prev => ({ ...prev, searchInContent: e.target.checked }))}
              className="mr-1"
            />
            <span className="text-xs text-gray-600">Search in content</span>
          </label>
        </div>

        {/* Story Arc Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Story Arc</label>
          <select
            value={filters.storyArc}
            onChange={(e) => setFilters(prev => ({ ...prev, storyArc: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Arcs</option>
            <option value="">No Arc</option>
            {storyArcs.map(arc => (
              <option key={arc} value={arc}>{arc}</option>
            ))}
          </select>
        </div>

        {/* Activity Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
          <select
            value={filters.activity}
            onChange={(e) => setFilters(prev => ({ ...prev, activity: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="available">Available</option>
          </select>
        </div>

        {/* Deployment Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deployment</label>
          <select
            value={filters.deploymentStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, deploymentStatus: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="live">Live</option>
            <option value="stage">Staging</option>
            <option value="dev">Development</option>
          </select>
        </div>
      </div>

      {/* Sort and View Options */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
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

          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">View:</label>
            <div className="inline-flex rounded border border-gray-300">
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1 text-sm ${viewMode === 'card' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600'}`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm border-l ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {filteredStorylets.length} of {Object.keys(allStorylets).length} storylets
        </div>
      </div>
    </div>
  );

  // Storylet card component
  const StoryletCard = ({ storylet }: { storylet: Storylet }) => {
    const isSelected = selectedStorylets.has(storylet.id);
    const isActive = activeStoryletIds.includes(storylet.id);
    const isCompleted = completedStoryletIds.includes(storylet.id);
    const deploymentStatus = (storylet as any).deploymentStatus || 'dev';

    const getStatusColor = () => {
      if (isCompleted) return 'bg-gray-100 text-gray-600';
      if (isActive) return 'bg-green-100 text-green-700';
      return 'bg-blue-100 text-blue-700';
    };

    const getDeploymentColor = () => {
      switch (deploymentStatus) {
        case 'live': return 'bg-green-500';
        case 'stage': return 'bg-yellow-500';
        default: return 'bg-gray-500';
      }
    };

    return (
      <div className={`border rounded-lg p-4 transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleSelectStorylet(storylet.id)}
              className="rounded"
            />
            <div className={`w-3 h-3 rounded-full ${getDeploymentColor()}`} title={`Deployment: ${deploymentStatus}`} />
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={() => onEditStorylet(storylet)}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Edit
            </button>
            {onEditVisually && (
              <button
                onClick={() => onEditVisually(storylet)}
                className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
              >
                Visual
              </button>
            )}
            <button
              onClick={() => crud.confirmDelete(storylet)}
              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Delete
            </button>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2">{storylet.name}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{storylet.description}</p>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex space-x-2">
            <span className={`px-2 py-1 rounded ${getStatusColor()}`}>
              {isCompleted ? 'Completed' : isActive ? 'Active' : 'Available'}
            </span>
            {storylet.storyArc && (
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                {storylet.storyArc}
              </span>
            )}
          </div>
          <span className="text-gray-500">{storylet.id}</span>
        </div>
      </div>
    );
  };

  return (
    <BaseStudioComponent
      title="Storylet Browser"
      helpText="Browse, search, and manage all storylets in your catalog"
      undoRedoSystem={undoRedoSystem}
      headerActions={
        <div className="flex items-center space-x-2">
          {selectedStorylets.size > 0 && (
            <>
              <select
                onChange={(e) => handleBulkDeploymentChange(e.target.value as any)}
                className="px-2 py-1 text-sm border rounded"
                defaultValue=""
              >
                <option value="" disabled>Set Deployment</option>
                <option value="live">Live</option>
                <option value="stage">Staging</option>
                <option value="dev">Development</option>
              </select>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Delete Selected ({selectedStorylets.size})
              </button>
            </>
          )}
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            {selectedStorylets.size === filteredStorylets.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <FilterControls />

        {filteredStorylets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No storylets found</h3>
            <p className="text-gray-600">
              {Object.keys(allStorylets).length === 0 
                ? 'No storylets have been created yet.'
                : 'Try adjusting your search filters.'}
            </p>
          </div>
        ) : (
          <div className={
            viewMode === 'card' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-2'
          }>
            {filteredStorylets.map(storylet => (
              <StoryletCard key={storylet.id} storylet={storylet} />
            ))}
          </div>
        )}

        {/* Deletion Confirmation Modal */}
        {crud.showDeleteConfirm && crud.selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Storylet</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{crud.selectedItem.name}"? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => crud.setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    crud.handleDelete(crud.selectedItem!.id);
                    crud.setShowDeleteConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseStudioComponent>
  );
};

export default StoryletBrowserRefactored;