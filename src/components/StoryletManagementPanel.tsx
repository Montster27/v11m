// /Users/montysharma/V11M2/src/components/StoryletManagementPanel.tsx
import React, { useState, useEffect } from 'react';
import { useStoryletStore } from '../store/useStoryletStore';
import { useNPCStore } from '../store/useNPCStore';
import { Button, Card } from './ui';
import { StoryletDeploymentStatus, Storylet, Choice, Effect } from '../types/storylet';
import StoryArcVisualizer from './StoryArcVisualizer';
import ArcProgressDisplay from './ArcProgressDisplay';

type StoryletTabType = 'overview' | 'manage' | 'search' | 'arcs' | 'filter' | 'create';

const StoryletManagementPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StoryletTabType>('overview');
  const [selectedStatus, setSelectedStatus] = useState<StoryletDeploymentStatus>('dev');
  const [editingStorylet, setEditingStorylet] = useState<Storylet | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    searchInName: true,
    searchInDescription: true,
    searchInId: true,
    searchInChoices: false,
    searchInStoryArc: true,
    onlyActive: false,
    onlyCompleted: false
  });
  const [selectedStoryArc, setSelectedStoryArc] = useState<string>('');
  const [showCreateArcModal, setShowCreateArcModal] = useState(false);
  const [newArcName, setNewArcName] = useState('');
  
  // Bulk selection state
  const [selectedStoryletIds, setSelectedStoryletIds] = useState<Set<string>>(new Set());
  
  // Arc testing state
  const [testingArc, setTestingArc] = useState<string | null>(null);
  const [testingHistory, setTestingHistory] = useState<Array<{
    storyletId: string;
    choiceId?: string;
    flags: Record<string, boolean>;
  }>>([]);
  const [testingFlags, setTestingFlags] = useState<Record<string, boolean>>({});
  
  // Visualization state
  const [visualizingArc, setVisualizingArc] = useState<string | null>(null);
  
  // Form data state for create/edit
  const [formData, setFormData] = useState<Partial<Storylet>>({
    id: '',
    name: '',
    description: '',
    deploymentStatus: 'dev',
    trigger: { type: 'time', conditions: {} },
    choices: [],
    storyArc: undefined
  });

  const {
    allStorylets,
    activeStoryletIds,
    completedStoryletIds,
    deploymentFilter,
    storyArcs,
    setDeploymentFilter,
    toggleDeploymentStatus,
    updateStoryletDeploymentStatus,
    evaluateStorylets,
    resetStorylets,
    addStorylet,
    deleteStorylet,
    updateStorylet,
    addStoryArc,
    removeStoryArc,
    getStoryletsByArc
  } = useStoryletStore();

  const { getAllNPCs } = useNPCStore();
  const allNPCs = getAllNPCs();

  // Debug testingArc changes
  useEffect(() => {
    console.log('🧪 useEffect - testingArc changed to:', testingArc);
  }, [testingArc]);

  // Clear selections when filtering changes or tab changes
  useEffect(() => {
    setSelectedStoryletIds(new Set());
  }, [searchQuery, selectedStoryArc, activeTab, deploymentFilter]);

  // Search and filter logic
  const searchStorylets = (storylets: Storylet[], query: string) => {
    if (!query.trim()) return storylets;
    
    const lowercaseQuery = query.toLowerCase();
    
    return storylets.filter(storylet => {
      // Search in name
      if (searchFilters.searchInName && storylet.name.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in description
      if (searchFilters.searchInDescription && storylet.description.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in ID
      if (searchFilters.searchInId && storylet.id.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      // Search in choices
      if (searchFilters.searchInChoices) {
        const choiceMatch = storylet.choices.some(choice => 
          choice.text.toLowerCase().includes(lowercaseQuery) ||
          choice.id.toLowerCase().includes(lowercaseQuery)
        );
        if (choiceMatch) return true;
      }
      
      // Search in story arc
      if (searchFilters.searchInStoryArc && storylet.storyArc && storylet.storyArc.toLowerCase().includes(lowercaseQuery)) {
        return true;
      }
      
      return false;
    });
  };

  // Get all storylets as array
  const allStoryletsArray = Object.values(allStorylets);
  
  // Apply search filter
  const searchFilteredStorylets = searchStorylets(allStoryletsArray, searchQuery);
  
  // Apply activity and story arc filters
  const activityFilteredStorylets = searchFilteredStorylets.filter(storylet => {
    if (searchFilters.onlyActive && !activeStoryletIds.includes(storylet.id)) {
      return false;
    }
    if (searchFilters.onlyCompleted && !completedStoryletIds.includes(storylet.id)) {
      return false;
    }
    if (selectedStoryArc === 'unassigned' && storylet.storyArc) {
      // Show only unassigned storylets when selectedStoryArc is 'unassigned'
      return false;
    } else if (selectedStoryArc && selectedStoryArc !== 'unassigned' && selectedStoryArc !== '' && storylet.storyArc !== selectedStoryArc) {
      return false;
    }
    return true;
  });

  // Get storylets grouped by deployment status (using filtered results)
  const storyletsByStatus = activityFilteredStorylets.reduce((acc, storylet) => {
    const status = storylet.deploymentStatus || 'live';
    if (!acc[status]) acc[status] = [];
    acc[status].push(storylet);
    return acc;
  }, {} as Record<StoryletDeploymentStatus, typeof allStorylets[string][]>);

  const handleStatusUpdate = (storyletId: string, newStatus: StoryletDeploymentStatus) => {
    updateStoryletDeploymentStatus(storyletId, newStatus);
  };

  const handleFilterToggle = (status: 'live' | 'stage' | 'dev') => {
    toggleDeploymentStatus(status);
  };

  const handleFilterPreset = (preset: string) => {
    switch (preset) {
      case 'live-only':
        setDeploymentFilter(new Set(['live']));
        break;
      case 'stage-live':
        setDeploymentFilter(new Set(['stage', 'live']));
        break;
      case 'all':
        setDeploymentFilter(new Set(['dev', 'stage', 'live']));
        break;
      case 'dev-only':
        setDeploymentFilter(new Set(['dev']));
        break;
      case 'stage-only':
        setDeploymentFilter(new Set(['stage']));
        break;
    }
  };

  const handleDeleteStorylet = (storyletId: string) => {
    if (confirm(`Are you sure you want to delete storylet "${allStorylets[storyletId]?.name}"?`)) {
      // Remove from store by calling a delete function we'll add to the store
      deleteStorylet(storyletId);
    }
  };

  const handleEditStorylet = (storylet: Storylet) => {
    setEditingStorylet(storylet);
    setFormData(storylet);
    setActiveTab('create');
  };

  const handleCreateStorylet = () => {
    setEditingStorylet(null);
    setFormData({
      id: '',
      name: '',
      description: '',
      deploymentStatus: 'dev',
      trigger: { type: 'time', conditions: {} },
      choices: [],
      storyArc: undefined
    });
    setShowCreateForm(true);
    setActiveTab('create');
  };

  const handleCreateStoryArc = () => {
    if (newArcName.trim() && !storyArcs.includes(newArcName.trim())) {
      addStoryArc(newArcName.trim());
      setNewArcName('');
      setShowCreateArcModal(false);
    }
  };

  const handleDeleteStoryArc = (arcName: string) => {
    if (confirm(`Are you sure you want to delete the story arc "${arcName}"? This will remove it from all storylets.`)) {
      removeStoryArc(arcName);
      if (selectedStoryArc === arcName) {
        setSelectedStoryArc('');
      }
    }
  };

  // Bulk selection handlers
  const handleSelectAllStorylets = () => {
    const allIds = new Set(activityFilteredStorylets.map(s => s.id));
    setSelectedStoryletIds(allIds);
  };

  const handleDeselectAllStorylets = () => {
    setSelectedStoryletIds(new Set());
  };

  const handleToggleStoryletSelection = (storyletId: string) => {
    const newSelected = new Set(selectedStoryletIds);
    if (newSelected.has(storyletId)) {
      newSelected.delete(storyletId);
    } else {
      newSelected.add(storyletId);
    }
    setSelectedStoryletIds(newSelected);
  };

  const handleBulkStatusUpdate = () => {
    if (selectedStoryletIds.size === 0) {
      alert('Please select storylets to update');
      return;
    }

    const count = selectedStoryletIds.size;
    if (confirm(`Are you sure you want to set ${count} storylet${count > 1 ? 's' : ''} to ${selectedStatus.toUpperCase()}?`)) {
      selectedStoryletIds.forEach(storyletId => {
        handleStatusUpdate(storyletId, selectedStatus);
      });
      setSelectedStoryletIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedStoryletIds.size === 0) {
      alert('Please select storylets to delete');
      return;
    }

    const count = selectedStoryletIds.size;
    if (confirm(`Are you sure you want to delete ${count} storylet${count > 1 ? 's' : ''}? This action cannot be undone.`)) {
      selectedStoryletIds.forEach(storyletId => {
        deleteStorylet(storyletId);
      });
      setSelectedStoryletIds(new Set());
    }
  };

  // Story arc status management
  const handleArcStatusUpdate = (arcName: string, newStatus: StoryletDeploymentStatus) => {
    const arcStorylets = getStoryletsByArc(arcName);
    
    if (arcStorylets.length === 0) {
      alert('No storylets found in this arc');
      return;
    }

    const count = arcStorylets.length;
    if (confirm(`Are you sure you want to set all ${count} storylet${count > 1 ? 's' : ''} in "${arcName}" to ${newStatus.toUpperCase()}?`)) {
      arcStorylets.forEach(storylet => {
        handleStatusUpdate(storylet.id, newStatus);
      });
      
      // Show success message
      alert(`Updated ${count} storylet${count > 1 ? 's' : ''} in "${arcName}" to ${newStatus.toUpperCase()}`);
    }
  };

  // Arc testing functions
  const startTestingArc = (arcName: string) => {
    console.log('🧪 Starting test for arc:', arcName);
    console.log('🧪 Current testingArc before:', testingArc);
    setTestingArc(arcName);
    setTestingHistory([]);
    setTestingFlags({});
    setActiveTab('arcs'); // Stay on arcs tab for testing
    console.log('🧪 Testing arc state should be set to:', arcName);
  };

  const stopTestingArc = () => {
    setTestingArc(null);
    setTestingHistory([]);
    setTestingFlags({});
  };

  const getAvailableStoryletsForTesting = (arcName: string) => {
    const arcStorylets = getStoryletsByArc(arcName);
    return arcStorylets.filter(storylet => {
      // Check if storylet can trigger with current testing flags
      switch (storylet.trigger.type) {
        case 'time':
          // For testing, assume all time conditions are met
          return true;
        case 'flag':
          const requiredFlags = storylet.trigger.conditions.flags || [];
          return requiredFlags.some(flag => testingFlags[flag]);
        case 'resource':
          // For testing, assume all resource conditions are met
          return true;
        default:
          return true;
      }
    });
  };

  const getCurrentTestingStorylet = () => {
    if (!testingArc || testingHistory.length === 0) {
      return null;
    }
    const lastEntry = testingHistory[testingHistory.length - 1];
    return allStorylets[lastEntry.storyletId];
  };

  const makeTestingChoice = (storyletId: string, choiceId: string) => {
    const storylet = allStorylets[storyletId];
    const choice = storylet?.choices.find(c => c.id === choiceId);
    
    if (!storylet || !choice) return;

    // Apply flag effects to testing flags
    const newFlags = { ...testingFlags };
    choice.effects.forEach(effect => {
      if (effect.type === 'flag') {
        newFlags[effect.key] = effect.value;
      }
    });

    console.log('🧪 Made choice:', choice.text, 'New flags:', newFlags);

    // Find the next storylet that can trigger with these new flags
    const arcStorylets = getStoryletsByArc(testingArc!);
    const visitedStoryletIds = testingHistory.map(entry => entry.storyletId);
    
    const nextStorylet = arcStorylets.find(nextStorylet => {
      // Don't go to the same storylet or already visited storylets (unless it's a repeatable one)
      if (nextStorylet.id === storyletId) return false;
      if (visitedStoryletIds.includes(nextStorylet.id)) return false;
      
      // Check if this storylet can trigger with the new flags
      switch (nextStorylet.trigger.type) {
        case 'flag':
          const requiredFlags = nextStorylet.trigger.conditions.flags || [];
          return requiredFlags.some(flag => newFlags[flag]);
        case 'time':
          // For testing, assume time conditions are always met if no visited storylets
          return true;
        case 'resource':
          // For testing, assume resource conditions are always met  
          return true;
        default:
          return false;
      }
    });

    console.log('🧪 Next storylet found:', nextStorylet?.name || 'None');

    if (nextStorylet) {
      // Add the choice to history and move to next storylet
      setTestingHistory(prev => [...prev, {
        storyletId,
        choiceId,
        flags: { ...newFlags }
      }, {
        storyletId: nextStorylet.id,
        flags: { ...newFlags }
      }]);
    } else {
      // No next storylet found, just add the choice
      setTestingHistory(prev => [...prev, {
        storyletId,
        choiceId,
        flags: { ...newFlags }
      }]);
    }
    
    setTestingFlags(newFlags);
  };

  const goBackInTesting = () => {
    if (testingHistory.length <= 1) {
      // Reset to beginning
      setTestingHistory([]);
      setTestingFlags({});
      return;
    }

    // Go back one step
    const newHistory = testingHistory.slice(0, -1);
    const lastEntry = newHistory[newHistory.length - 1];
    
    setTestingHistory(newHistory);
    setTestingFlags(lastEntry?.flags || {});
  };

  const startFromStorylet = (storyletId: string) => {
    console.log('🧪 Starting from storylet:', allStorylets[storyletId]?.name);
    setTestingHistory([{
      storyletId,
      flags: {}
    }]);
    setTestingFlags({});
  };

  // Helper function to highlight search terms
  const highlightSearchTerm = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">{part}</span>
      ) : part
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {storyletsByStatus.live?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Live Storylets</div>
          <div className="text-xs text-gray-500">
            {searchQuery ? 'Matching search' : 'Production Ready'}
          </div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {storyletsByStatus.stage?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Stage Storylets</div>
          <div className="text-xs text-gray-500">
            {searchQuery ? 'Matching search' : 'Testing Phase'}
          </div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {storyletsByStatus.dev?.length || 0}
          </div>
          <div className="text-sm text-gray-600">Dev Storylets</div>
          <div className="text-xs text-gray-500">
            {searchQuery ? 'Matching search' : 'In Development'}
          </div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {activityFilteredStorylets.filter(s => activeStoryletIds.includes(s.id)).length}
          </div>
          <div className="text-sm text-gray-600">Currently Active</div>
          <div className="text-xs text-gray-500">
            {searchQuery ? 'In search results' : 'Based on current filter'}
          </div>
        </Card>
      </div>

      <ArcProgressDisplay />

      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Filter</h3>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Quick Presets:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterPreset('live-only')}
                className={`px-3 py-1 text-sm rounded ${
                  deploymentFilter.has('live') && deploymentFilter.size === 1
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                Live Only
              </button>
              <button
                onClick={() => handleFilterPreset('stage-live')}
                className={`px-3 py-1 text-sm rounded ${
                  deploymentFilter.has('stage') && deploymentFilter.has('live') && deploymentFilter.size === 2
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                Stage + Live
              </button>
              <button
                onClick={() => handleFilterPreset('all')}
                className={`px-3 py-1 text-sm rounded ${
                  deploymentFilter.size === 3
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                Show All
              </button>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Individual Toggles:</div>
            <div className="flex space-x-2">
              {(['live', 'stage', 'dev'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => handleFilterToggle(status)}
                  className={`px-3 py-1 text-sm rounded ${
                    deploymentFilter.has(status)
                      ? status === 'live' ? 'bg-green-100 text-green-800 border border-green-300'
                        : status === 'stage' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {status.toUpperCase()} {deploymentFilter.has(status) ? '✓' : ''}
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <strong>Currently showing:</strong> {Array.from(deploymentFilter).join(', ').toUpperCase()} storylets
            ({activeStoryletIds.length} active)
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex space-x-4">
          <Button
            onClick={() => evaluateStorylets()}
            variant="primary"
          >
            Re-evaluate Storylets
          </Button>
          <Button
            onClick={() => resetStorylets()}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Reset All Storylets
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderManage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manage Storylet Status</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Bulk set to:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as StoryletDeploymentStatus)}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="dev">Dev</option>
            <option value="stage">Stage</option>
            <option value="live">Live</option>
          </select>
        </div>
      </div>

      {/* Bulk selection controls */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedStoryletIds.size} storylet{selectedStoryletIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <Button
                onClick={handleSelectAllStorylets}
                variant="outline"
                size="sm"
                className="text-xs text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                Select All ({activityFilteredStorylets.length})
              </Button>
              <Button
                onClick={handleDeselectAllStorylets}
                variant="outline"
                size="sm"
                className="text-xs text-gray-600 border-gray-300 hover:bg-gray-100"
                disabled={selectedStoryletIds.size === 0}
              >
                Deselect All
              </Button>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={handleBulkStatusUpdate}
              variant="primary"
              size="sm"
              className="text-xs"
              disabled={selectedStoryletIds.size === 0}
            >
              Update Status ({selectedStoryletIds.size})
            </Button>
            <Button
              onClick={handleBulkDelete}
              variant="outline"
              size="sm"
              className="text-xs text-red-600 border-red-300 hover:bg-red-50"
              disabled={selectedStoryletIds.size === 0}
            >
              Delete Selected ({selectedStoryletIds.size})
            </Button>
          </div>
        </div>
      </Card>

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
                      <h4 className="font-semibold text-gray-900">
                        {highlightSearchTerm(storylet.name, searchQuery)}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded ${
                        isActive ? 'bg-green-100 text-green-800' :
                        isCompleted ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {isActive ? 'Active' : isCompleted ? 'Completed' : 'Available'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {highlightSearchTerm(storylet.description, searchQuery)}
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                      ID: {highlightSearchTerm(storylet.id, searchQuery)} | Trigger: {storylet.trigger.type}
                      {storylet.storyArc && (
                        <> | Arc: {highlightSearchTerm(storylet.storyArc, searchQuery)}</>
                      )}
                    </div>
                    {searchFilters.searchInChoices && storylet.choices.some(choice => 
                      choice.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      choice.id.toLowerCase().includes(searchQuery.toLowerCase())
                    ) && (
                      <div className="text-xs text-blue-600 mt-1">
                        ✓ Found in choices
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <span className={`px-2 py-1 text-xs rounded ${
                    currentStatus === 'live' ? 'bg-green-100 text-green-800' :
                    currentStatus === 'stage' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentStatus.toUpperCase()}
                  </span>
                  
                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusUpdate(storylet.id, e.target.value as StoryletDeploymentStatus)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="dev">Dev</option>
                    <option value="stage">Stage</option>
                    <option value="live">Live</option>
                  </select>
                  
                  <Button
                    onClick={() => handleEditStorylet(storylet)}
                    variant="outline"
                    className="text-xs px-2 py-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Edit
                  </Button>
                  
                  <Button
                    onClick={() => handleDeleteStorylet(storylet.id)}
                    variant="outline"
                    className="text-xs px-2 py-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderFilter = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Multi-Status Filter Testing</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Filter: <span className="font-bold text-blue-600">{Array.from(deploymentFilter).join(' + ').toUpperCase()}</span>
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {(['live', 'stage', 'dev'] as const).map((status) => (
                <Card 
                  key={status}
                  className={`p-4 cursor-pointer border-2 transition-colors ${
                    deploymentFilter.has(status)
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleFilterToggle(status)}
                >
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      status === 'live' ? 'text-green-600' :
                      status === 'stage' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {status.toUpperCase()} {deploymentFilter.has(status) ? '✓' : ''}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {status === 'live' && 'Production storylets'}
                      {status === 'stage' && 'Testing storylets'}
                      {status === 'dev' && 'Development storylets'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Available: {storyletsByStatus[status]?.length || 0} storylets
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <strong>Tip:</strong> Click multiple statuses to show combinations (e.g., Stage + Live for testing with production content)
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">New Filter Behavior</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Individual Selection:</strong> Choose any combination of Dev, Stage, and Live</li>
              <li><strong>Live Only:</strong> Production mode - only storylets marked as "live"</li>
              <li><strong>Stage + Live:</strong> Testing mode - stage content plus production content</li>
              <li><strong>All Selected:</strong> Development mode - see everything regardless of status</li>
              <li><strong>Custom Combinations:</strong> Dev + Live, Stage Only, etc. - any combination you need</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Currently Visible Storylets</h3>
        <div className="text-sm text-gray-600 mb-4">
          With filter "{Array.from(deploymentFilter).join(' + ')}", showing {activeStoryletIds.length} active storylets:
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activeStoryletIds.map((id) => {
            const storylet = allStorylets[id];
            const status = storylet?.deploymentStatus || 'live';
            return (
              <div key={id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">{storylet?.name || id}</span>
                <span className={`px-2 py-1 text-xs rounded ${
                  status === 'live' ? 'bg-green-100 text-green-800' :
                  status === 'stage' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  const renderSearch = () => (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h3>
        
        {activityFilteredStorylets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? (
              <>
                <div className="text-lg mb-2">No storylets found</div>
                <div className="text-sm">Try adjusting your search terms or filters</div>
              </>
            ) : (
              <>
                <div className="text-lg mb-2">No filters applied</div>
                <div className="text-sm">Use the search bar above to find specific storylets</div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {activityFilteredStorylets.map((storylet) => {
              const currentStatus = storylet.deploymentStatus || 'live';
              const isActive = activeStoryletIds.includes(storylet.id);
              const isCompleted = completedStoryletIds.includes(storylet.id);
              
              return (
                <Card key={storylet.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {highlightSearchTerm(storylet.name, searchQuery)}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded ${
                          currentStatus === 'live' ? 'bg-green-100 text-green-800' :
                          currentStatus === 'stage' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {currentStatus.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          isActive ? 'bg-green-100 text-green-800' :
                          isCompleted ? 'bg-gray-100 text-gray-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {isActive ? 'Active' : isCompleted ? 'Completed' : 'Available'}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">
                        {highlightSearchTerm(storylet.description, searchQuery)}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">ID:</span> {highlightSearchTerm(storylet.id, searchQuery)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Trigger:</span> {storylet.trigger.type}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Story Arc:</span> {storylet.storyArc ? highlightSearchTerm(storylet.storyArc, searchQuery) : <span className="text-gray-400">None</span>}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Choices:</span> {storylet.choices.length}
                        </div>
                      </div>
                      
                      {searchFilters.searchInChoices && storylet.choices.some(choice => 
                        choice.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        choice.id.toLowerCase().includes(searchQuery.toLowerCase())
                      ) && searchQuery && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                          <div className="font-medium text-blue-800 mb-1">Found in choices:</div>
                          {storylet.choices
                            .filter(choice => 
                              choice.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              choice.id.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map(choice => (
                              <div key={choice.id} className="text-blue-700">
                                • {highlightSearchTerm(choice.text, searchQuery)}
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        onClick={() => handleEditStorylet(storylet)}
                        variant="outline"
                        className="text-xs px-3 py-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        Edit
                      </Button>
                      
                      <Button
                        onClick={() => handleDeleteStorylet(storylet.id)}
                        variant="outline"
                        className="text-xs px-3 py-1 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );

  const renderArcs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Story Arc Management</h3>
        <Button
          onClick={() => setShowCreateArcModal(true)}
          variant="primary"
          className="text-sm"
        >
          Create New Arc
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {storyArcs.map(arc => {
          const arcStorylets = getStoryletsByArc(arc);
          const activeInArc = arcStorylets.filter(s => activeStoryletIds.includes(s.id)).length;
          const completedInArc = arcStorylets.filter(s => completedStoryletIds.includes(s.id)).length;
          
          // Calculate status distribution
          const statusDistribution = arcStorylets.reduce((acc, storylet) => {
            const status = storylet.deploymentStatus || 'live';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {} as Record<StoryletDeploymentStatus, number>);
          
          return (
            <Card key={arc} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-gray-900">{arc}</h4>
                <Button
                  onClick={() => handleDeleteStoryArc(arc)}
                  variant="outline"
                  className="text-xs px-2 py-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  Delete
                </Button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Storylets:</span>
                  <span className="font-medium">{arcStorylets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active:</span>
                  <span className="font-medium text-green-600">{activeInArc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium text-blue-600">{completedInArc}</span>
                </div>
                
                {/* Status Distribution */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-700 mb-1">Deployment Status:</div>
                  <div className="space-y-1">
                    {statusDistribution.live && (
                      <div className="flex justify-between">
                        <span className="text-green-600">Live:</span>
                        <span className="font-medium">{statusDistribution.live}</span>
                      </div>
                    )}
                    {statusDistribution.stage && (
                      <div className="flex justify-between">
                        <span className="text-yellow-600">Stage:</span>
                        <span className="font-medium">{statusDistribution.stage}</span>
                      </div>
                    )}
                    {statusDistribution.dev && (
                      <div className="flex justify-between">
                        <span className="text-red-600">Dev:</span>
                        <span className="font-medium">{statusDistribution.dev}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t space-y-2">
                {/* Bulk Status Controls */}
                {arcStorylets.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-700">Set All to:</div>
                    <div className="grid grid-cols-3 gap-1">
                      <Button
                        onClick={() => handleArcStatusUpdate(arc, 'dev')}
                        variant="outline"
                        className="text-xs py-1 text-red-600 border-red-200 hover:bg-red-50"
                        disabled={arcStorylets.length === 0}
                      >
                        Dev ({statusDistribution.dev || 0})
                      </Button>
                      <Button
                        onClick={() => handleArcStatusUpdate(arc, 'stage')}
                        variant="outline"
                        className="text-xs py-1 text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                        disabled={arcStorylets.length === 0}
                      >
                        Stage ({statusDistribution.stage || 0})
                      </Button>
                      <Button
                        onClick={() => handleArcStatusUpdate(arc, 'live')}
                        variant="outline"
                        className="text-xs py-1 text-green-600 border-green-200 hover:bg-green-50"
                        disabled={arcStorylets.length === 0}
                      >
                        Live ({statusDistribution.live || 0})
                      </Button>
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={() => {
                    setSelectedStoryArc(arc);
                    setActiveTab('search');
                  }}
                  variant="outline"
                  className="w-full text-sm"
                >
                  View Storylets in Arc
                </Button>
                
                <Button
                  onClick={() => {
                    console.log('🧪 Button clicked for arc:', arc);
                    startTestingArc(arc);
                  }}
                  variant="primary"
                  className="w-full text-sm"
                >
                  🧪 Test Arc
                </Button>
                
                <Button
                  onClick={() => setVisualizingArc(arc)}
                  variant="outline"
                  className="w-full text-sm text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  📊 Visualize Arc
                </Button>
              </div>
              
              {arcStorylets.length > 0 && (
                <div className="mt-3 text-xs text-gray-500">
                  <div className="font-medium mb-1">Recent storylets:</div>
                  {arcStorylets.slice(0, 3).map(storylet => (
                    <div key={storylet.id} className="truncate">
                      • {storylet.name}
                    </div>
                  ))}
                  {arcStorylets.length > 3 && (
                    <div className="text-gray-400">
                      ... and {arcStorylets.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
        
        {/* Unassigned storylets card */}
        <Card className="p-4 border-dashed border-gray-300">
          <div className="text-center">
            <h4 className="font-semibold text-gray-700 mb-2">Unassigned Storylets</h4>
            <div className="text-2xl font-bold text-gray-400 mb-2">
              {Object.values(allStorylets).filter(s => !s.storyArc).length}
            </div>
            <div className="text-sm text-gray-500 mb-3">
              Storylets without a story arc
            </div>
            <Button
              onClick={() => {
                setSelectedStoryArc('unassigned');
                setActiveTab('search');
              }}
              variant="outline"
              className="text-sm"
            >
              View Unassigned
            </Button>
          </div>
        </Card>
      </div>

      {/* Arc Testing Interface */}
      {testingArc && (
        <Card className="p-6 bg-purple-50 border-purple-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-purple-900">
              🧪 Testing Arc: {testingArc}
            </h3>
            <div className="space-x-2">
              <Button
                onClick={goBackInTesting}
                variant="outline"
                className="text-sm text-purple-600 border-purple-300"
                disabled={testingHistory.length === 0}
              >
                ← Go Back
              </Button>
              <Button
                onClick={() => {
                  setTestingHistory([]);
                  setTestingFlags({});
                }}
                variant="outline"
                className="text-sm text-blue-600 border-blue-300"
              >
                🔄 Restart
              </Button>
              <Button
                onClick={stopTestingArc}
                variant="outline"
                className="text-sm text-red-600 border-red-300"
              >
                ✕ Stop Testing
              </Button>
            </div>
          </div>

          {/* Testing History */}
          {testingHistory.length > 0 && (
            <div className="mb-4 p-3 bg-white rounded border">
              <h4 className="font-medium text-gray-900 mb-2">Path Taken:</h4>
              <div className="space-y-1 text-sm">
                {testingHistory.map((entry, index) => {
                  const storylet = allStorylets[entry.storyletId];
                  const choice = entry.choiceId ? storylet?.choices.find(c => c.id === entry.choiceId) : null;
                  return (
                    <div key={index} className="flex items-center text-gray-700">
                      <span className="w-6 text-center">{index + 1}.</span>
                      <span className="font-medium">{storylet?.name}</span>
                      {choice && (
                        <>
                          <span className="mx-2">→</span>
                          <span className="text-blue-600">"{choice.text}"</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Testing Flags */}
          {Object.keys(testingFlags).length > 0 && (
            <div className="mb-4 p-3 bg-white rounded border">
              <h4 className="font-medium text-gray-900 mb-2">Active Flags:</h4>
              <div className="flex flex-wrap gap-1">
                {Object.entries(testingFlags)
                  .filter(([_, value]) => value)
                  .map(([flag, _]) => (
                    <span 
                      key={flag} 
                      className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                    >
                      {flag}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Available Storylets for Testing */}
          <div className="space-y-4">
            {testingHistory.length === 0 ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Choose Starting Storylet:</h4>
                <div className="grid gap-2">
                  {getStoryletsByArc(testingArc).map(storylet => (
                    <Button
                      key={storylet.id}
                      onClick={() => startFromStorylet(storylet.id)}
                      variant="outline"
                      className="text-left p-3 h-auto"
                    >
                      <div>
                        <div className="font-medium">{storylet.name}</div>
                        <div className="text-sm text-gray-600">
                          Trigger: {storylet.trigger.type}
                          {storylet.trigger.type === 'flag' && (
                            <span className="ml-2 text-purple-600">
                              Requires: {storylet.trigger.conditions.flags?.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {(() => {
                  const currentStorylet = getCurrentTestingStorylet();
                  if (!currentStorylet) return null;

                  return (
                    <div>
                      <div className="p-4 bg-white rounded border mb-4">
                        <h4 className="font-semibold text-lg text-gray-900 mb-2">
                          {currentStorylet.name}
                        </h4>
                        <p className="text-gray-700 mb-4">
                          {currentStorylet.description}
                        </p>
                        
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-900">Choose your action:</h5>
                          {currentStorylet.choices.map(choice => (
                            <Button
                              key={choice.id}
                              onClick={() => makeTestingChoice(currentStorylet.id, choice.id)}
                              variant="outline"
                              className="w-full text-left p-3 h-auto hover:bg-blue-50"
                            >
                              <div>
                                <div className="font-medium text-blue-700">{choice.text}</div>
                                {choice.effects.length > 0 && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    Effects: {choice.effects.map(effect => {
                                      if (effect.type === 'flag') {
                                        return `Set ${effect.key} = ${effect.value}`;
                                      } else if (effect.type === 'resource') {
                                        return `${effect.key} ${effect.delta > 0 ? '+' : ''}${effect.delta}`;
                                      }
                                      return effect.type;
                                    }).join(', ')}
                                  </div>
                                )}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Show next available storylets */}
                      {(() => {
                        const availableNext = getAvailableStoryletsForTesting(testingArc)
                          .filter(s => s.id !== currentStorylet.id);
                        
                        if (availableNext.length > 0) {
                          return (
                            <div className="p-3 bg-blue-50 rounded border">
                              <h5 className="font-medium text-blue-900 mb-2">
                                Available Next Storylets:
                              </h5>
                              <div className="space-y-1 text-sm">
                                {availableNext.map(storylet => (
                                  <div key={storylet.id} className="text-blue-700">
                                    • {storylet.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );

  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.id || !formData.name || !formData.description) {
        alert('Please fill in all required fields');
        return;
      }

      const storylet: Storylet = {
        id: formData.id,
        name: formData.name,
        description: formData.description,
        deploymentStatus: formData.deploymentStatus || 'dev',
        trigger: formData.trigger || { type: 'time', conditions: {} },
        choices: formData.choices || [],
        storyArc: formData.storyArc || undefined,
        involvedNPCs: formData.involvedNPCs,
        primaryNPC: formData.primaryNPC,
        locationId: formData.locationId
      };

      console.log('📝 Submitting storylet:', storylet);
      console.log('📝 Form data:', formData);
      console.log('📝 Is editing:', !!editingStorylet);

      if (editingStorylet) {
        // Update existing storylet
        updateStorylet(storylet);
        console.log(`✏️ Updated storylet: ${storylet.id}`);
      } else {
        // Create new storylet
        addStorylet(storylet);
        console.log(`➕ Created storylet: ${storylet.id}`);
        console.log(`📚 All storylets after add:`, Object.keys(allStorylets));
      }

      // Reset form
      setEditingStorylet(null);
      setShowCreateForm(false);
      setFormData({
        id: '',
        name: '',
        description: '',
        deploymentStatus: 'dev',
        trigger: { type: 'time', conditions: {} },
        choices: [],
        storyArc: undefined
      });
      setActiveTab('manage');
    };

  const addChoice = () => {
    setFormData({
      ...formData,
      choices: [
        ...(formData.choices || []),
        {
          id: `choice_${(formData.choices?.length || 0) + 1}`,
          text: '',
          effects: []
        }
      ]
    });
  };

  const updateChoice = (index: number, field: keyof Choice, value: any) => {
    const choices = [...(formData.choices || [])];
    choices[index] = { ...choices[index], [field]: value };
    setFormData({ ...formData, choices });
  };

  const removeChoice = (index: number) => {
    const choices = [...(formData.choices || [])];
    choices.splice(index, 1);
    setFormData({ ...formData, choices });
  };

  const addEffect = (choiceIndex: number) => {
    const choices = [...(formData.choices || [])];
    choices[choiceIndex].effects.push({
      type: 'resource',
      key: 'energy',
      delta: 0
    } as Effect);
    setFormData({ ...formData, choices });
  };

  const updateEffect = (choiceIndex: number, effectIndex: number, effect: Effect) => {
    const choices = [...(formData.choices || [])];
    choices[choiceIndex].effects[effectIndex] = effect;
    setFormData({ ...formData, choices });
  };

  const removeEffect = (choiceIndex: number, effectIndex: number) => {
    const choices = [...(formData.choices || [])];
    choices[choiceIndex].effects.splice(effectIndex, 1);
    setFormData({ ...formData, choices });
  };

  const renderCreateEdit = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {editingStorylet ? 'Edit Storylet' : 'Create New Storylet'}
          </h3>
          <Button
            onClick={() => {
              setEditingStorylet(null);
              setShowCreateForm(false);
              setActiveTab('manage');
            }}
            variant="outline"
          >
            Cancel
          </Button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <Card className="p-4">
            <h4 className="font-semibold mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.id || ''}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="unique_storylet_id"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deployment Status
                </label>
                <select
                  value={formData.deploymentStatus || 'dev'}
                  onChange={(e) => setFormData({ ...formData, deploymentStatus: e.target.value as StoryletDeploymentStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="dev">Dev</option>
                  <option value="stage">Stage</option>
                  <option value="live">Live</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Story Arc
                </label>
                <select
                  value={formData.storyArc || ''}
                  onChange={(e) => setFormData({ ...formData, storyArc: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">No Arc</option>
                  {storyArcs.map(arc => (
                    <option key={arc} value={arc}>{arc}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Display name for the storylet"
                required
              />
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
                placeholder="Narrative text shown to the player"
                required
              />
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold mb-4">NPC Integration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary NPC
                </label>
                <select
                  value={formData.primaryNPC || ''}
                  onChange={(e) => setFormData({ ...formData, primaryNPC: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">No Primary NPC</option>
                  {allNPCs.map(npc => (
                    <option key={npc.id} value={npc.id}>{npc.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location ID
                </label>
                <input
                  type="text"
                  value={formData.locationId || ''}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="dining_hall, library, etc."
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Involved NPCs
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                {allNPCs.map(npc => (
                  <label key={npc.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={(formData.involvedNPCs || []).includes(npc.id)}
                      onChange={(e) => {
                        const involvedNPCs = formData.involvedNPCs || [];
                        if (e.target.checked) {
                          setFormData({ 
                            ...formData, 
                            involvedNPCs: [...involvedNPCs, npc.id] 
                          });
                        } else {
                          setFormData({ 
                            ...formData, 
                            involvedNPCs: involvedNPCs.filter(id => id !== npc.id) 
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{npc.name}</span>
                  </label>
                ))}
                {allNPCs.length === 0 && (
                  <p className="text-sm text-gray-500">No NPCs available. Create NPCs first.</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold mb-4">Trigger Conditions</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trigger Type
                </label>
                <select
                  value={formData.trigger?.type || 'time'}
                  onChange={(e) => setFormData({
                    ...formData,
                    trigger: { type: e.target.value as any, conditions: {} }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="time">Time-based</option>
                  <option value="flag">Flag-based</option>
                  <option value="resource">Resource-based</option>
                  <option value="npc_relationship">NPC Relationship</option>
                  <option value="npc_availability">NPC Availability</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conditions (JSON)
                </label>
                <textarea
                  value={JSON.stringify(formData.trigger?.conditions || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const conditions = JSON.parse(e.target.value);
                      setFormData({
                        ...formData,
                        trigger: { ...formData.trigger!, conditions }
                      });
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                  rows={3}
                  placeholder='{"day": 5} or {"flags": ["metTutor"]} or {"energy": {"min": 20}}'
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">Choices</h4>
              <Button
                type="button"
                onClick={addChoice}
                variant="outline"
                className="text-sm"
              >
                Add Choice
              </Button>
            </div>
            
            <div className="space-y-4">
              {(formData.choices || []).map((choice, choiceIndex) => (
                <Card key={choiceIndex} className="p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium">Choice {choiceIndex + 1}</h5>
                    <Button
                      type="button"
                      onClick={() => removeChoice(choiceIndex)}
                      variant="outline"
                      className="text-xs px-2 py-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Choice ID
                      </label>
                      <input
                        type="text"
                        value={choice.id}
                        onChange={(e) => updateChoice(choiceIndex, 'id', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="choice_id"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Next Storylet ID (optional)
                      </label>
                      <input
                        type="text"
                        value={choice.nextStoryletId || ''}
                        onChange={(e) => updateChoice(choiceIndex, 'nextStoryletId', e.target.value || undefined)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="next_storylet_id"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Choice Text
                    </label>
                    <input
                      type="text"
                      value={choice.text}
                      onChange={(e) => updateChoice(choiceIndex, 'text', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="Button text shown to player"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Effects
                      </label>
                      <Button
                        type="button"
                        onClick={() => addEffect(choiceIndex)}
                        variant="outline"
                        className="text-xs px-2 py-1"
                      >
                        Add Effect
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {choice.effects.map((effect, effectIndex) => (
                        <div key={effectIndex} className="p-3 bg-white rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <select
                              value={effect.type}
                              onChange={(e) => {
                                let newEffect: Effect = { type: e.target.value as any } as Effect;
                                if (e.target.value === 'resource') {
                                  newEffect = { type: 'resource', key: 'energy', delta: 0 };
                                } else if (e.target.value === 'flag') {
                                  newEffect = { type: 'flag', key: '', value: true };
                                } else if (e.target.value === 'skillXp') {
                                  newEffect = { type: 'skillXp', key: '', amount: 0 };
                                } else if (e.target.value === 'unlock') {
                                  newEffect = { type: 'unlock', storyletId: '' };
                                } else if (e.target.value === 'foundationXp') {
                                  newEffect = { type: 'foundationXp', key: '', amount: 0 };
                                } else if (e.target.value === 'npcRelationship') {
                                  newEffect = { type: 'npcRelationship', npcId: '', delta: 0, reason: '' };
                                } else if (e.target.value === 'npcMemory') {
                                  newEffect = { type: 'npcMemory', npcId: '', memory: { description: '', sentiment: 'neutral', importance: 5 } };
                                } else if (e.target.value === 'npcFlag') {
                                  newEffect = { type: 'npcFlag', npcId: '', flag: '', value: true };
                                } else if (e.target.value === 'npcMood') {
                                  newEffect = { type: 'npcMood', npcId: '', mood: 'neutral', duration: 0 };
                                }
                                updateEffect(choiceIndex, effectIndex, newEffect);
                              }}
                              className="px-2 py-1 text-xs border rounded"
                            >
                              <option value="resource">Resource</option>
                              <option value="flag">Flag</option>
                              <option value="skillXp">Skill XP</option>
                              <option value="foundationXp">Foundation XP</option>
                              <option value="unlock">Unlock</option>
                              <option value="npcRelationship">NPC Relationship</option>
                              <option value="npcMemory">NPC Memory</option>
                              <option value="npcFlag">NPC Flag</option>
                              <option value="npcMood">NPC Mood</option>
                            </select>
                            
                            <Button
                              type="button"
                              onClick={() => removeEffect(choiceIndex, effectIndex)}
                              variant="outline"
                              className="text-xs px-2 py-1 text-red-600"
                            >
                              Remove
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {effect.type === 'resource' && (
                              <>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Resource</label>
                                  <select
                                    value={(effect as any).key || 'energy'}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, key: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                  >
                                    <option value="energy">Energy</option>
                                    <option value="stress">Stress</option>
                                    <option value="knowledge">Knowledge</option>
                                    <option value="social">Social</option>
                                    <option value="money">Money</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Change</label>
                                  <input
                                    type="number"
                                    value={(effect as any).delta || 0}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, delta: parseInt(e.target.value) || 0 })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                    placeholder="±10"
                                  />
                                </div>
                              </>
                            )}
                            
                            {effect.type === 'flag' && (
                              <>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Flag Key</label>
                                  <input
                                    type="text"
                                    value={(effect as any).key || ''}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, key: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                    placeholder="flagName"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Value</label>
                                  <select
                                    value={(effect as any).value ? 'true' : 'false'}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, value: e.target.value === 'true' })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                  >
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                  </select>
                                </div>
                              </>
                            )}
                            
                            {(effect.type === 'skillXp' || effect.type === 'foundationXp') && (
                              <>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Skill/Foundation</label>
                                  <input
                                    type="text"
                                    value={(effect as any).key || ''}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, key: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                    placeholder="skillName"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">XP Amount</label>
                                  <input
                                    type="number"
                                    value={(effect as any).amount || 0}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, amount: parseInt(e.target.value) || 0 })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                    placeholder="10"
                                  />
                                </div>
                              </>
                            )}
                            
                            {effect.type === 'unlock' && (
                              <div className="md:col-span-2">
                                <label className="block text-xs text-gray-600 mb-1">Storylet ID to Unlock</label>
                                <input
                                  type="text"
                                  value={(effect as any).storyletId || ''}
                                  onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, storyletId: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border rounded"
                                  placeholder="storylet_id"
                                />
                              </div>
                            )}

                            {effect.type === 'npcRelationship' && (
                              <>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">NPC</label>
                                  <select
                                    value={(effect as any).npcId || ''}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, npcId: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                  >
                                    <option value="">Select NPC</option>
                                    {allNPCs.map(npc => (
                                      <option key={npc.id} value={npc.id}>{npc.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Relationship Change</label>
                                  <input
                                    type="number"
                                    value={(effect as any).delta || 0}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, delta: parseInt(e.target.value) || 0 })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                    placeholder="±10"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs text-gray-600 mb-1">Reason (optional)</label>
                                  <input
                                    type="text"
                                    value={(effect as any).reason || ''}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, reason: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                    placeholder="Why the relationship changed"
                                  />
                                </div>
                              </>
                            )}

                            {effect.type === 'npcMemory' && (
                              <>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">NPC</label>
                                  <select
                                    value={(effect as any).npcId || ''}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, npcId: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                  >
                                    <option value="">Select NPC</option>
                                    {allNPCs.map(npc => (
                                      <option key={npc.id} value={npc.id}>{npc.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Sentiment</label>
                                  <select
                                    value={(effect as any).memory?.sentiment || 'neutral'}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { 
                                      ...effect, 
                                      memory: { ...((effect as any).memory || {}), sentiment: e.target.value }
                                    })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                  >
                                    <option value="positive">Positive</option>
                                    <option value="neutral">Neutral</option>
                                    <option value="negative">Negative</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Importance (1-10)</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={(effect as any).memory?.importance || 5}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { 
                                      ...effect, 
                                      memory: { ...((effect as any).memory || {}), importance: parseInt(e.target.value) || 5 }
                                    })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                  />
                                </div>
                                <div className="md:col-span-3">
                                  <label className="block text-xs text-gray-600 mb-1">Memory Description</label>
                                  <textarea
                                    value={(effect as any).memory?.description || ''}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { 
                                      ...effect, 
                                      memory: { ...((effect as any).memory || {}), description: e.target.value }
                                    })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                    rows={2}
                                    placeholder="What the NPC will remember about this interaction"
                                  />
                                </div>
                              </>
                            )}

                            {effect.type === 'npcFlag' && (
                              <>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">NPC</label>
                                  <select
                                    value={(effect as any).npcId || ''}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, npcId: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                  >
                                    <option value="">Select NPC</option>
                                    {allNPCs.map(npc => (
                                      <option key={npc.id} value={npc.id}>{npc.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Flag Name</label>
                                  <input
                                    type="text"
                                    value={(effect as any).flag || ''}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, flag: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                    placeholder="flag_name"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Value</label>
                                  <select
                                    value={(effect as any).value ? 'true' : 'false'}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, value: e.target.value === 'true' })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                  >
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                  </select>
                                </div>
                              </>
                            )}

                            {effect.type === 'npcMood' && (
                              <>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">NPC</label>
                                  <select
                                    value={(effect as any).npcId || ''}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, npcId: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                  >
                                    <option value="">Select NPC</option>
                                    {allNPCs.map(npc => (
                                      <option key={npc.id} value={npc.id}>{npc.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Mood</label>
                                  <select
                                    value={(effect as any).mood || 'neutral'}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, mood: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                  >
                                    <option value="happy">Happy</option>
                                    <option value="neutral">Neutral</option>
                                    <option value="stressed">Stressed</option>
                                    <option value="excited">Excited</option>
                                    <option value="sad">Sad</option>
                                    <option value="angry">Angry</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Duration (seconds, 0 = permanent)</label>
                                  <input
                                    type="number"
                                    value={(effect as any).duration || 0}
                                    onChange={(e) => updateEffect(choiceIndex, effectIndex, { ...effect, duration: parseInt(e.target.value) || 0 })}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                    placeholder="0"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              onClick={() => {
                setEditingStorylet(null);
                setShowCreateForm(false);
                setActiveTab('manage');
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              {editingStorylet ? 'Update Storylet' : 'Create Storylet'}
            </Button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Storylet Management</h2>
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleCreateStorylet}
            variant="primary"
            className="text-sm"
          >
            Create New Storylet
          </Button>
          <div className="text-sm text-gray-600">
            Showing: <span className="font-semibold text-blue-600">{Array.from(deploymentFilter).join(', ').toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search storylets by name, description, ID, or choices..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery('')}
                variant="outline"
                className="text-sm px-3 py-2"
              >
                Clear
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 font-medium">Search in:</span>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={searchFilters.searchInName}
                  onChange={(e) => setSearchFilters({...searchFilters, searchInName: e.target.checked})}
                  className="rounded"
                />
                <span>Name</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={searchFilters.searchInDescription}
                  onChange={(e) => setSearchFilters({...searchFilters, searchInDescription: e.target.checked})}
                  className="rounded"
                />
                <span>Description</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={searchFilters.searchInId}
                  onChange={(e) => setSearchFilters({...searchFilters, searchInId: e.target.checked})}
                  className="rounded"
                />
                <span>ID</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={searchFilters.searchInChoices}
                  onChange={(e) => setSearchFilters({...searchFilters, searchInChoices: e.target.checked})}
                  className="rounded"
                />
                <span>Choices</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={searchFilters.searchInStoryArc}
                  onChange={(e) => setSearchFilters({...searchFilters, searchInStoryArc: e.target.checked})}
                  className="rounded"
                />
                <span>Story Arc</span>
              </label>
            </div>
            
            <div className="border-l border-gray-300 pl-4 flex items-center space-x-2">
              <span className="text-gray-600 font-medium">Filter by Arc:</span>
              <select
                value={selectedStoryArc}
                onChange={(e) => setSelectedStoryArc(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded"
              >
                <option value="">All Arcs</option>
                {storyArcs.map(arc => (
                  <option key={arc} value={arc}>{arc}</option>
                ))}
              </select>
              <Button
                onClick={() => setShowCreateArcModal(true)}
                variant="outline"
                className="text-xs px-2 py-1"
              >
                + Arc
              </Button>
            </div>
            
            <div className="border-l border-gray-300 pl-4 flex items-center space-x-2">
              <span className="text-gray-600 font-medium">Show only:</span>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={searchFilters.onlyActive}
                  onChange={(e) => setSearchFilters({...searchFilters, onlyActive: e.target.checked})}
                  className="rounded"
                />
                <span>Active</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={searchFilters.onlyCompleted}
                  onChange={(e) => setSearchFilters({...searchFilters, onlyCompleted: e.target.checked})}
                  className="rounded"
                />
                <span>Completed</span>
              </label>
            </div>
          </div>
          
          {(searchQuery || searchFilters.onlyActive || searchFilters.onlyCompleted || selectedStoryArc) && (
            <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
              <span className="font-medium">Search Results:</span> {activityFilteredStorylets.length} of {Object.values(allStorylets).length} storylets
              {searchQuery && (
                <span className="ml-2">
                  matching "{searchQuery}"
                </span>
              )}
              {selectedStoryArc && (
                <span className="ml-2">
                  in "{selectedStoryArc}" arc
                </span>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'manage', label: 'Manage Status' },
          { id: 'search', label: 'Search & Browse' },
          { id: 'arcs', label: 'Story Arcs' },
          { id: 'filter', label: 'Filter Testing' },
          { id: 'create', label: editingStorylet ? 'Edit Storylet' : (showCreateForm ? 'Create Storylet' : 'Create') }
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
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'manage' && renderManage()}
      {activeTab === 'search' && renderSearch()}
      {activeTab === 'arcs' && renderArcs()}
      {activeTab === 'filter' && renderFilter()}
      {activeTab === 'create' && renderCreateEdit()}

      {/* Create Story Arc Modal */}
      {showCreateArcModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Story Arc</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arc Name
                </label>
                <input
                  type="text"
                  value={newArcName}
                  onChange={(e) => setNewArcName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateStoryArc()}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter story arc name..."
                  autoFocus
                />
              </div>
              
              <div className="text-sm text-gray-600">
                Existing arcs: {storyArcs.join(', ')}
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => {
                    setShowCreateArcModal(false);
                    setNewArcName('');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateStoryArc}
                  variant="primary"
                  disabled={!newArcName.trim() || storyArcs.includes(newArcName.trim())}
                >
                  Create Arc
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Story Arc Visualization */}
      {visualizingArc && (
        <StoryArcVisualizer
          arcName={visualizingArc}
          onClose={() => setVisualizingArc(null)}
        />
      )}
    </div>
  );
};

export default StoryletManagementPanel;