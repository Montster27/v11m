// /Users/montysharma/V11M2/src/components/contentStudio/ArcManager.tsx
// Migrated to use shared Content Studio foundation with preserved arc functionality

import React, { useState, useMemo } from 'react';
import { useNarrativeStore } from '../../stores/v2/useNarrativeStore';
import { useSocialStore } from '../../stores/v2/useSocialStore';
// Legacy V1 imports removed - using V2 stores only
import type { Storylet } from '../../types/storylet';
import HelpTooltip from '../ui/HelpTooltip';
import StoryArcVisualizer from '../StoryArcVisualizer';
import ArcTestingInterface from '../dev/ArcTestingInterface';

// Shared foundation imports
import BaseStudioComponent from './shared/BaseStudioComponent';
import { useCRUDOperations } from './shared/useCRUDOperations';
import { useStudioPersistence } from './shared/useStudioPersistence';

interface UndoRedoSystem {
  executeAction: (action: any) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface ArcManagerProps {
  undoRedoSystem: UndoRedoSystem;
}

type ArcManagerTab = 'overview' | 'visualizer' | 'builder' | 'testing';

const ArcManager: React.FC<ArcManagerProps> = ({ undoRedoSystem }) => {
  // Use V2 stores for unified state management
  const { 
    storyArcs, 
    getAllArcs, 
    getArc, 
    createArc, 
    updateArc, 
    deleteArc 
  } = useNarrativeStore();
  const { getCluesByArc } = useSocialStore();
  
  // Use V2 stores for storylet and clue data  
  const { getAllStorylets, getStoryletsForArc, updateUserStorylet } = useNarrativeStore();
  const allStorylets = getAllStorylets();
  
  // Use V2 stores for clue data
  const cluesObject = useSocialStore(state => state.clues || {});
  const clues = Object.values(cluesObject); // Convert object to array
  
  // Get all arcs from V2 store
  const allArcs = getAllArcs();
  
  // Create a local getStoryletsByArc function that uses the same logic as visualizer
  const getStoryletsByArc = (arcId: string): Storylet[] => {
    const arc = getArc(arcId);
    if (!arc) return [];
    
    // Use the same filtering logic as the visualizer - filter by arc name
    return Object.values(allStorylets).filter(storylet => 
      storylet.storyArc === arc.name
    );
  };

  // Shared foundation hooks - using V2 store arc methods
  const { handleCreate, handleUpdate, handleDelete } = useCRUDOperations({
    entityType: 'Arc',
    getAllItems: () => allArcs.map(arc => ({ id: arc.id, name: arc.name })),
    createItem: (arcData: { name: string; description?: string }) => {
      console.log('Creating arc with V2 store:', arcData.name);
      const arcId = createArc({
        name: arcData.name,
        description: arcData.description || `Story arc: ${arcData.name}`,
        progress: 0,
        isCompleted: false,
        failures: 0
      });
      return { id: arcId, name: arcData.name };
    },
    updateItem: (arc: { id: string; name: string; description?: string }) => {
      console.log('Updating arc with V2 store:', arc.id);
      updateArc(arc.id, {
        name: arc.name,
        description: arc.description
      });
    },
    deleteItem: (id: string) => {
      console.log('Deleting arc with V2 store:', id);
      deleteArc(id);
    },
    undoRedoSystem
  });

  // State declarations - must come before hooks that use them
  const [activeTab, setActiveTab] = useState<ArcManagerTab>('overview');
  const [selectedArc, setSelectedArc] = useState<string>('');
  const [visualizingArc, setVisualizingArc] = useState<string | null>(null);
  const [showCreateArcModal, setShowCreateArcModal] = useState(false);
  const [newArcName, setNewArcName] = useState('');
  const [testingArc, setTestingArc] = useState<string | null>(null);
  const [testingFlags, setTestingFlags] = useState<Record<string, boolean>>({});
  const [showArcTesting, setShowArcTesting] = useState(false);
  const [arcSortBy, setArcSortBy] = useState<'alphabetical' | 'lastWorked'>('alphabetical');

  // Simple validation functions for arc creation
  const validateRequired = (value: string, message: string) => {
    if (!value || value.trim() === '') {
      return { isValid: false, error: message };
    }
    return { isValid: true, error: null };
  };

  const validateUnique = (value: string, message: string) => {
    if (allArcs.some(arc => arc.name.toLowerCase() === value.toLowerCase())) {
      return { isValid: false, error: message };
    }
    return { isValid: true, error: null };
  };

  const persistence = useStudioPersistence(
    { selectedArc, visualizingArc, testingArc, arcSortBy },
    {
      storageKey: 'arc_manager_state',
      autoSaveEnabled: true,
      onAutoSave: (data) => {
        console.log('Auto-saved arc manager state');
      }
    }
  );

  // Get arc statistics with sorting - updated to use same logic as visualizer
  const arcStats = useMemo(() => {
    console.log('🔍 ArcManager: Calculating arcStats with sortBy:', arcSortBy);
    console.log('🔍 ArcManager: allArcs:', allArcs);
    
    const stats = allArcs.map(arc => {
      const storylets = getStoryletsByArc(arc.id);
      
      // Use same clue filtering logic as visualizer with null safety
      const arcClues = clues.filter(clue => 
        clue && (
          clue.storyArc === arc.name || 
          (clue.associatedStorylets && Array.isArray(clue.associatedStorylets) && 
           clue.associatedStorylets.some(storyletId => 
             storylets.some(storylet => storylet.id === storyletId)
           ))
        )
      );
      const connections = storylets.reduce((total, storylet) => {
        if (!storylet || !storylet.choices || !Array.isArray(storylet.choices)) return total;
        return total + storylet.choices.filter(choice => choice && choice.nextStoryletId).length;
      }, 0);
      
      // Calculate entry points with null safety
      const entryPoints = storylets.filter(s => 
        s && s.trigger && (
          s.trigger.type === 'time' || 
          (s.trigger.type === 'flag' && !storylets.some(other => 
            other && other.choices && Array.isArray(other.choices) &&
            other.choices.some(choice => 
              choice && choice.effects && Array.isArray(choice.effects) &&
              choice.effects.some(effect => 
                effect && effect.type === 'flag' && 
                effect.key === (s.trigger.conditions as any)?.flags?.[0]
              )
            )
          ))
        )
      ).length;
      
      return {
        id: arc.id,
        name: arc.name,
        description: arc.description,
        storyletCount: storylets.length,
        clueCount: arcClues.length,
        connections,
        entryPoints,
        isValid: storylets.length > 0,
        progress: arc.progress,
        isCompleted: arc.isCompleted,
        failures: arc.failures,
        lastAccessedAt: arc.metadata.lastAccessed,
        createdAt: arc.metadata.createdAt
      };
    });

    console.log('🔍 ArcManager: Stats before sorting:', stats);

    // Sort based on selected criteria
    if (arcSortBy === 'alphabetical') {
      const sorted = stats.sort((a, b) => a.name.localeCompare(b.name));
      console.log('🔍 ArcManager: Alphabetically sorted:', sorted.map(s => s.name));
      return sorted;
    } else {
      // Sort by lastAccessedAt descending (most recent first)
      const sorted = stats.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);
      console.log('🔍 ArcManager: Last worked sorted:', sorted.map(s => ({ name: s.name, lastAccessed: s.lastAccessedAt })));
      return sorted;
    }
  }, [allArcs, allStorylets, clues, arcSortBy]);

  // Get unassigned storylets
  const unassignedStorylets = useMemo(() => {
    return Object.values(allStorylets).filter(storylet => !storylet.storyArc);
  }, [allStorylets]);

  const handleCreateArc = async () => {
    const trimmedName = newArcName.trim();
    
    // Validate using shared validation
    const nameValidation = validateRequired(trimmedName, 'Arc name is required');
    if (!nameValidation.isValid) {
      alert(nameValidation.error);
      return;
    }
    
    const uniqueValidation = validateUnique(trimmedName, 'Arc name must be unique');
    if (!uniqueValidation.isValid) {
      alert(uniqueValidation.error);
      return;
    }
    
    // Use CRUD operations for creation
    const result = await handleCreate({ name: trimmedName });
    if (result) {
      setNewArcName('');
      setShowCreateArcModal(false);
      setSelectedArc(result.id); // Use the returned arc ID
      persistence.markDirty();
    }
  };

  const handleDeleteArc = async (arcId: string) => {
    const arc = getArc(arcId);
    const arcName = arc?.name || arcId;
    
    if (confirm(`Are you sure you want to delete the "${arcName}" story arc? This will unassign all storylets and clues from this arc.`)) {
      // Use CRUD operations for deletion
      const success = await handleDelete(arcId);
      if (success && selectedArc === arcId) {
        setSelectedArc('');
        persistence.markDirty();
      }
    }
  };

  const handleArcAccess = (arcId: string) => {
    // Update last accessed time when arc is opened/visualized
    console.log('🔍 ArcManager: Updating access time for arc:', arcId);
    storyArcManager.updateArc(arcId, {
      metadata: {
        ...getArc(arcId)?.metadata,
        lastAccessed: Date.now()
      }
    });
  };

  const handleAssignStoryletToArc = (storyletId: string, arcId: string) => {
    // Assign storylet to arc using StoryArcManager
    storyArcManager.assignStoryletToArc(storyletId, arcId);
    
    // Also update the storylet in the catalog store for backwards compatibility
    const storylet = allStorylets.find(s => s.id === storyletId);
    if (storylet) {
      const arc = getArc(arcId);
      const updatedStorylet = { ...storylet, storyArc: arc?.name || arcId };
      updateUserStorylet(updatedStorylet);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'visualizer', label: 'Visualizer', icon: '🎨' },
    { id: 'builder', label: 'Builder', icon: '🔧' },
    { id: 'testing', label: 'Testing', icon: '🧪' }
  ];

  return (
    <BaseStudioComponent
      title="Story Arc Manager"
      helpText="Manage, visualize, and test story arc connections and flow. Use tabs to access different arc management tools."
      undoRedoSystem={undoRedoSystem}
      headerActions={
        <div className="flex items-center space-x-3">
          {persistence.isDirty && (
            <span className="text-xs text-orange-600">Unsaved changes</span>
          )}
          <button
            onClick={() => setShowCreateArcModal(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            + New Arc
          </button>
        </div>
      }
    >

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ArcManagerTab);
                persistence.markDirty();
              }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600 bg-white'
                  : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Story Arcs List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-800">Story Arcs ({allArcs.length})</h4>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Sort by:</label>
                    <select
                      value={arcSortBy}
                      onChange={(e) => setArcSortBy(e.target.value as 'alphabetical' | 'lastWorked')}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="alphabetical">Alphabetical</option>
                      <option value="lastWorked">Last Worked On</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {arcStats.map((arc) => (
                    <div
                      key={arc.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedArc === arc.id
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        handleArcAccess(arc.id);
                        setSelectedArc(arc.id);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-800">{arc.name}</h5>
                          {arc.description && (
                            <p className="text-xs text-gray-600 mt-1">{arc.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArcAccess(arc.id);
                              setVisualizingArc(arc.id);
                              setActiveTab('visualizer');
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Visualize
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArcAccess(arc.id);
                              setTestingArc(arc.id);
                              setShowArcTesting(true);
                            }}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Test
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteArc(arc.id);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">{arc.storyletCount}</span>
                          <span className="ml-1">storylets</span>
                        </div>
                        <div>
                          <span className="font-medium">{arc.clueCount}</span>
                          <span className="ml-1">clues</span>
                        </div>
                        <div>
                          <span className="font-medium">{arc.connections}</span>
                          <span className="ml-1">connections</span>
                        </div>
                        <div>
                          <span className="font-medium">{arc.entryPoints}</span>
                          <span className="ml-1">entry points</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          arc.isValid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {arc.isValid ? 'Valid' : 'Invalid'}
                        </span>
                        
                        {arcSortBy === 'lastWorked' && arc.lastAccessedAt > 0 && (
                          <span className="text-xs text-gray-500">
                            Last worked: {new Date(arc.lastAccessedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {allArcs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🔗</div>
                      <p>No story arcs created yet</p>
                      <p className="text-sm">Create your first story arc to organize storylets</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Arc Details or Unassigned Storylets */}
              <div className="space-y-4">
                {selectedArc ? (
                  <>
                    <h4 className="text-lg font-medium text-gray-800">
                      Storylets in "{getArc(selectedArc)?.name || 'Unknown Arc'}"
                    </h4>
                    <div className="space-y-2">
                      {getStoryletsByArc(selectedArc).map((storylet) => (
                        <div key={storylet.id} className="p-3 border border-gray-200 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <h6 className="font-medium text-gray-800">{storylet.name}</h6>
                              <p className="text-sm text-gray-600">ID: {storylet.id}</p>
                            </div>
                            <button
                              onClick={() => handleAssignStoryletToArc(storylet.id, '')}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Unassign
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="text-lg font-medium text-gray-800">
                      Unassigned Storylets ({unassignedStorylets.length})
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {unassignedStorylets.map((storylet) => (
                        <div key={storylet.id} className="p-3 border border-gray-200 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <h6 className="font-medium text-gray-800">{storylet.name}</h6>
                              <p className="text-sm text-gray-600">ID: {storylet.id}</p>
                            </div>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignStoryletToArc(storylet.id, e.target.value);
                                }
                              }}
                              value=""
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="">Assign to arc...</option>
                              {allArcs.map(arc => (
                                <option key={arc.id} value={arc.id}>{arc.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'visualizer' && (
          <div className="h-full">
            {visualizingArc ? (
              <StoryArcVisualizer
                arcName={getArc(visualizingArc)?.name || visualizingArc}
                onClose={() => setVisualizingArc(null)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎨</div>
                  <h4 className="text-lg font-medium mb-2">Select an Arc to Visualize</h4>
                  <p>Choose a story arc from the overview to see its visual representation</p>
                  {allArcs.length > 0 && (
                    <select
                      onChange={(e) => e.target.value && setVisualizingArc(e.target.value)}
                      value={visualizingArc || ""}
                      className="mt-4 px-3 py-2 border border-gray-300 rounded"
                    >
                      <option value="">Select an arc...</option>
                      {allArcs.map(arc => (
                        <option key={arc.id} value={arc.id}>{arc.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'builder' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-800 mb-2">Arc Builder</h4>
                <p className="text-gray-600">
                  Use the Visual Editor or Advanced Creator to build and connect storylets within arcs
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-gray-200 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-2">Visual Arc Builder</h5>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag and drop storylets to create visual story arcs with connections
                  </p>
                  <button
                    onClick={() => {
                      // Navigate to visual editor in arc mode
                      const event = new CustomEvent('navigate-to-visual-arc-builder');
                      window.dispatchEvent(event);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Open Visual Builder
                  </button>
                </div>
                
                <div className="p-6 border border-gray-200 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-2">Advanced Creator</h5>
                  <p className="text-sm text-gray-600 mb-4">
                    Create complex storylets with triggers and assign them to arcs
                  </p>
                  <button
                    onClick={() => {
                      // Navigate to advanced creator
                      const event = new CustomEvent('navigate-to-advanced-creator');
                      window.dispatchEvent(event);
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Open Advanced Creator
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-800 mb-2">Arc Testing</h4>
                <p className="text-gray-600">
                  Test story arc flows and validate connections between storylets
                </p>
              </div>
              
              <div className="p-6 border border-gray-200 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-4">Select Arc to Test</h5>
                <select
                  value={testingArc || ''}
                  onChange={(e) => setTestingArc(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
                >
                  <option value="">Choose an arc...</option>
                  {allArcs.map(arc => (
                    <option key={arc.id} value={arc.id}>{arc.name}</option>
                  ))}
                </select>
                
                {testingArc && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                      <h6 className="font-medium text-blue-800 mb-2">Testing: {getArc(testingArc)?.name || 'Unknown Arc'}</h6>
                      <p className="text-sm text-blue-700">
                        Arc testing functionality would allow you to simulate playthrough 
                        and validate all possible paths through the story arc.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setShowArcTesting(true)}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      🎮 Start Interactive Arc Test
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Arc Modal */}
      {showCreateArcModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Story Arc</h3>
            <input
              type="text"
              value={newArcName}
              onChange={(e) => setNewArcName(e.target.value)}
              placeholder="Enter arc name..."
              className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateArc()}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateArcModal(false);
                  setNewArcName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateArc}
                disabled={!newArcName.trim() || allArcs.some(arc => arc.name === newArcName.trim())}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create Arc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Arc Testing Modal */}
      {showArcTesting && (
        <ArcTestingInterface onClose={() => setShowArcTesting(false)} />
      )}
    </BaseStudioComponent>
  );
};

export default ArcManager;