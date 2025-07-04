// /Users/montysharma/V11M2/src/components/contentStudio/ClueManager.tsx
// Migrated to use shared Content Studio foundation with preserved clue functionality

import React, { useState, useMemo } from 'react';
import { useClueStore } from '../../store/useClueStore';
import { useNarrativeStore } from '../../stores/v2/useNarrativeStore';
import { useSocialStore } from '../../stores/v2/useSocialStore';
import { useStoryletCatalogStore } from '../../store/useStoryletCatalogStore';
import { storyArcManager } from '../../utils/storyArcManager';
import type { Clue } from '../../types/clue';
import HelpTooltip from '../ui/HelpTooltip';
import MinigameManagementPanel from '../MinigameManagementPanel';

// Shared foundation imports
import BaseStudioComponent from './shared/BaseStudioComponent';
import { useCRUDOperations } from './shared/useCRUDOperations';
import { useStudioValidation } from './shared/useStudioValidation';
import { useStudioPersistence } from './shared/useStudioPersistence';

interface UndoRedoSystem {
  executeAction: (action: any) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface ClueManagerProps {
  undoRedoSystem: UndoRedoSystem;
}

type ClueManagerTab = 'clues' | 'minigames' | 'connections' | 'arcs';

const ClueManager: React.FC<ClueManagerProps> = ({ undoRedoSystem }) => {
  // Legacy clue store for backwards compatibility
  const {
    clues,
    createClue,
    updateClue,
    deleteClue,
    getCluesByMinigame,
    getCluesByStorylet
  } = useClueStore();

  // V2 stores for enhanced arc integration
  const { getAllArcs, getArc } = useNarrativeStore();
  const { 
    getCluesByArc, 
    setClueArcRelationship, 
    removeClueArcRelationship,
    getArcCompletionPercentage,
    getNextClueInArc 
  } = useSocialStore();
  
  const { allStorylets, getStoryletsForArc } = useStoryletCatalogStore();
  const allArcs = getAllArcs();

  // Shared foundation hooks
  const { handleCreate, handleUpdate, handleDelete } = useCRUDOperations({
    entityType: 'Clue',
    getAllItems: () => clues,
    createItem: (clueData: any) => {
      console.log('Creating clue:', clueData.title);
      return createClue(clueData);
    },
    updateItem: (clue: any) => {
      console.log('Updating clue:', clue.id);
      updateClue(clue.id, clue);
    },
    deleteItem: (id: string) => {
      console.log('Deleting clue:', id);
      deleteClue(id);
    },
    undoRedoSystem
  });

  // Enhanced clue-arc operations
  const handleAssignClueToArc = (clueId: string, arcId: string, order: number = 1) => {
    try {
      // Use StoryArcManager for the assignment
      storyArcManager.assignClueToArc(clueId, arcId, order);
      
      // Also update legacy clue store for backwards compatibility
      const clue = clues.find(c => c.id === clueId);
      if (clue) {
        const arc = getArc(arcId);
        updateClue(clueId, { 
          storyArc: arc?.name,
          arcOrder: order 
        });
      }
      
      console.log(`✅ Assigned clue ${clueId} to arc ${arcId} at order ${order}`);
    } catch (error) {
      console.error('❌ Failed to assign clue to arc:', error);
      alert('Failed to assign clue to arc. Please try again.');
    }
  };

  const handleUnassignClueFromArc = (clueId: string) => {
    try {
      // Remove from V2 store
      removeClueArcRelationship(clueId);
      
      // Update legacy store
      updateClue(clueId, { 
        storyArc: undefined,
        arcOrder: undefined 
      });
      
      console.log(`✅ Unassigned clue ${clueId} from arc`);
    } catch (error) {
      console.error('❌ Failed to unassign clue from arc:', error);
      alert('Failed to unassign clue from arc. Please try again.');
    }
  };

  // State declarations - must come before hooks that use them
  const [activeTab, setActiveTab] = useState<ClueManagerTab>('clues');
  const [selectedClue, setSelectedClue] = useState<string>('');
  const [showCreateClueForm, setShowCreateClueForm] = useState(false);
  const [editingClue, setEditingClue] = useState<Clue | null>(null);
  const [clueFormData, setClueFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'general' as const,
    difficulty: 'medium' as const,
    storyArc: '',
    arcOrder: 1,
    minigameTypes: [] as string[],
    associatedStorylets: [] as string[],
    positiveOutcomeStorylet: '',
    negativeOutcomeStorylet: '',
    tags: '',
    rarity: 'common' as const
  });

  const validation = useStudioValidation({
    rules: [
      {
        field: 'title',
        type: 'required',
        message: 'Clue title is required'
      }
    ]
  });

  const persistence = useStudioPersistence(
    { activeTab, selectedClue, clueFormData, editingClue },
    {
      storageKey: 'clue_manager_state',
      autoSaveEnabled: true,
      onAutoSave: (data) => {
        console.log('Auto-saved clue manager state');
      }
    }
  );

  const minigameTypes = [
    { value: 'path_planner', label: 'Path Planner', description: 'Navigation challenge' },
    { value: 'memory_cards', label: 'Memory Cards', description: 'Memory and pattern recognition' },
    { value: 'word_scramble', label: 'Word Scramble', description: 'Language and vocabulary' },
    { value: 'color_match', label: 'Color Match', description: 'Visual perception and speed' },
    { value: 'stroop_test', label: 'Stroop Test', description: 'Cognitive interference and focus' },
    { value: 'study_session', label: 'Study Session', description: 'Academic challenge' },
    { value: 'social_interaction', label: 'Social Interaction', description: 'Conversation skills' },
    { value: 'resource_management', label: 'Resource Management', description: 'Planning and strategy' }
  ];

  const clueStats = useMemo(() => {
    const total = clues.length;
    const discovered = clues.filter(clue => clue.isDiscovered).length;
    const byCategory = clues.reduce((acc, clue) => {
      acc[clue.category] = (acc[clue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byDifficulty = clues.reduce((acc, clue) => {
      acc[clue.difficulty] = (acc[clue.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, discovered, byCategory, byDifficulty };
  }, [clues]);

  // Get storylets for the currently selected story arc
  const arcStorylets = useMemo(() => {
    if (!clueFormData.storyArc) return [];
    // Convert arc ID to arc name for storylet lookup
    const arc = getArc(clueFormData.storyArc);
    if (!arc) return [];
    return getStoryletsForArc(arc.name);
  }, [getStoryletsForArc, clueFormData.storyArc, getArc]);

  const resetClueForm = () => {
    setClueFormData({
      title: '',
      description: '',
      content: '',
      category: 'general',
      difficulty: 'medium',
      storyArc: '',
      arcOrder: 1,
      minigameTypes: [],
      associatedStorylets: [],
      positiveOutcomeStorylet: '',
      negativeOutcomeStorylet: '',
      tags: '',
      rarity: 'common'
    });
    setEditingClue(null);
  };

  // Validation helper function
  const validateRequired = (value: string, message: string) => {
    if (!value || value.trim() === '') {
      return { isValid: false, error: message };
    }
    return { isValid: true, error: null };
  };

  const handleCreateClue = async () => {
    // Validate required fields
    if (!clueFormData.title.trim()) {
      alert('Clue title is required');
      return;
    }
    
    const descValidation = validateRequired(clueFormData.description.trim(), 'Clue description is required');
    if (!descValidation.isValid) {
      alert(descValidation.error);
      return;
    }
    
    const contentValidation = validateRequired(clueFormData.content.trim(), 'Clue content is required');
    if (!contentValidation.isValid) {
      alert(contentValidation.error);
      return;
    }

    // Use CRUD operations for creation
    const success = await handleCreate({
      ...clueFormData,
      tags: clueFormData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    });

    if (success) {
      resetClueForm();
      setShowCreateClueForm(false);
      // We can't easily get the new clue ID from the success response
      setSelectedClue('');
      persistence.markDirty();
    }
  };

  const handleEditClue = (clue: Clue) => {
    setEditingClue(clue);
    setClueFormData({
      title: clue.title,
      description: clue.description,
      content: clue.content,
      category: clue.category,
      difficulty: clue.difficulty,
      storyArc: clue.storyArc || '',
      arcOrder: clue.arcOrder || 1,
      minigameTypes: clue.minigameTypes,
      associatedStorylets: clue.associatedStorylets,
      positiveOutcomeStorylet: clue.positiveOutcomeStorylet || '',
      negativeOutcomeStorylet: clue.negativeOutcomeStorylet || '',
      tags: clue.tags.join(', '),
      rarity: clue.rarity
    });
    setShowCreateClueForm(true);
  };

  const handleUpdateClue = async () => {
    if (!editingClue) return;
    
    // Validate required fields
    if (!clueFormData.title.trim()) {
      alert('Clue title is required');
      return;
    }

    // Prepare the updated clue data
    const updatedClue = {
      ...editingClue,
      title: clueFormData.title.trim(),
      description: clueFormData.description.trim(),
      content: clueFormData.content.trim(),
      category: clueFormData.category,
      difficulty: clueFormData.difficulty,
      storyArc: clueFormData.storyArc,
      arcOrder: clueFormData.arcOrder,
      minigameTypes: clueFormData.minigameTypes,
      associatedStorylets: clueFormData.associatedStorylets,
      positiveOutcomeStorylet: clueFormData.positiveOutcomeStorylet,
      negativeOutcomeStorylet: clueFormData.negativeOutcomeStorylet,
      tags: clueFormData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      rarity: clueFormData.rarity,
      updatedAt: new Date()
    };

    try {
      // Use CRUD operations for update
      const success = await handleUpdate(updatedClue);
      
      if (success) {
        setShowCreateClueForm(false);
        setEditingClue(null);
        resetClueForm();
        persistence.markDirty();
        console.log('✅ Clue updated successfully');
      } else {
        console.error('❌ Failed to update clue');
        alert('Failed to update clue. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error updating clue:', error);
      alert('Error updating clue. Please try again.');
    }
  };

  const handleDeleteClue = async (clueId: string) => {
    const clue = clues.find(c => c.id === clueId);
    const clueName = clue?.title || 'Unknown clue';
    
    if (confirm('Are you sure you want to delete this clue?')) {
      // Use CRUD operations for deletion
      const success = await handleDelete(clueId);
      if (success && selectedClue === clueId) {
        setSelectedClue('');
        persistence.markDirty();
      }
    }
  };

  const tabs = [
    { id: 'clues', label: 'Clue Library', icon: '🔍' },
    { id: 'minigames', label: 'Minigame Testing', icon: '🎮' },
    { id: 'connections', label: 'Story Connections', icon: '🔗' },
    { id: 'arcs', label: 'Arc Relationships', icon: '🗂️' }
  ];

  return (
    <BaseStudioComponent
      title="Clue & Minigame Manager"
      helpText="Create and manage clues, configure discovery methods, and test minigames. Integrate clues with storylets and story arcs."
      undoRedoSystem={undoRedoSystem}
      headerActions={
        <div className="flex items-center space-x-3">
          {persistence.isDirty && (
            <span className="text-xs text-orange-600">Unsaved changes</span>
          )}
          <button
            onClick={() => setShowCreateClueForm(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            + New Clue
          </button>
        </div>
      }
    >
      {/* Quick Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{clueStats.total}</div>
          <div className="text-sm text-blue-800">Total Clues</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{clueStats.discovered}</div>
          <div className="text-sm text-green-800">Discovered</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{Object.keys(clueStats.byCategory).length}</div>
          <div className="text-sm text-purple-800">Categories</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{minigameTypes.length}</div>
          <div className="text-sm text-orange-800">Minigame Types</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ClueManagerTab);
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
        {activeTab === 'clues' && (
          <div className="h-full flex">
            {/* Clue List */}
            <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
              <div className="p-4">
                <div className="space-y-2">
                  {clues.map((clue) => (
                    <div
                      key={clue.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedClue === clue.id
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedClue(clue.id)}
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-800">{clue.title}</h5>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            clue.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            clue.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {clue.difficulty}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClue(clue);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClue(clue.id);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">{clue.description}</p>
                      
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {clue.category}
                        </span>
                        {clue.storyArc && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {clue.storyArc}
                          </span>
                        )}
                        {clue.minigameTypes.length > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            {clue.minigameTypes.length} minigame{clue.minigameTypes.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {clue.positiveOutcomeStorylet && clue.negativeOutcomeStorylet && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⚡ Both Outcomes
                          </span>
                        )}
                        {clue.positiveOutcomeStorylet && !clue.negativeOutcomeStorylet && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            ✅ Success Outcome
                          </span>
                        )}
                        {!clue.positiveOutcomeStorylet && clue.negativeOutcomeStorylet && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            ❌ Failure Outcome
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {clues.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🔍</div>
                      <p>No clues created yet</p>
                      <p className="text-sm">Create your first clue to start building mysteries</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Clue Details */}
            <div className="w-1/2 overflow-y-auto">
              {selectedClue ? (
                <div className="p-4">
                  {(() => {
                    const clue = clues.find(c => c.id === selectedClue);
                    if (!clue) return null;
                    
                    return (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-800">{clue.title}</h4>
                          <p className="text-gray-600">{clue.description}</p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-800 mb-2">Content</h5>
                          <p className="text-sm text-gray-700">{clue.content}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">Category</h5>
                            <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
                              {clue.category}
                            </span>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">Difficulty</h5>
                            <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                              clue.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              clue.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {clue.difficulty}
                            </span>
                          </div>
                        </div>
                        
                        {clue.minigameTypes.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">🎮 Discovery Minigames</h5>
                            <div className="space-y-1">
                              {clue.minigameTypes.map(type => {
                                const minigame = minigameTypes.find(m => m.value === type);
                                return (
                                  <div key={type} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                                    <span className="text-sm font-medium text-blue-800">{minigame?.label || type}</span>
                                    <span className="text-xs text-blue-600">{minigame?.description}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {(clue.positiveOutcomeStorylet || clue.negativeOutcomeStorylet) && (
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">🎯 Minigame Outcome Paths</h5>
                            <div className="space-y-2">
                              {clue.positiveOutcomeStorylet && (
                                <div className="p-2 bg-green-50 rounded border border-green-200">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-green-600">✅</span>
                                    <span className="text-sm font-medium text-green-800">Success Path:</span>
                                  </div>
                                  <div className="text-sm text-green-700 ml-6">
                                    {allStorylets[clue.positiveOutcomeStorylet]?.name || clue.positiveOutcomeStorylet}
                                  </div>
                                </div>
                              )}
                              {clue.negativeOutcomeStorylet && (
                                <div className="p-2 bg-red-50 rounded border border-red-200">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-red-600">❌</span>
                                    <span className="text-sm font-medium text-red-800">Failure Path:</span>
                                  </div>
                                  <div className="text-sm text-red-700 ml-6">
                                    {allStorylets[clue.negativeOutcomeStorylet]?.name || clue.negativeOutcomeStorylet}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {clue.associatedStorylets.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">Associated Storylets</h5>
                            <div className="space-y-1">
                              {clue.associatedStorylets.map(storyletId => {
                                const storylet = allStorylets[storyletId];
                                return (
                                  <div key={storyletId} className="p-2 bg-purple-50 rounded">
                                    <span className="text-sm font-medium text-purple-800">
                                      {storylet?.name || storyletId}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {clue.tags.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">Tags</h5>
                            <div className="flex flex-wrap gap-1">
                              {clue.tags.map(tag => (
                                <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h4 className="text-lg font-medium mb-2">Select a Clue</h4>
                    <p>Choose a clue from the list to view its details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'minigames' && (
          <div className="h-full overflow-y-auto">
            <MinigameManagementPanel />
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <h4 className="text-lg font-medium text-gray-800">Story Arc Connections</h4>
              
              {allArcs.map((arc) => {
                const arcClues = clues.filter(clue => clue.storyArc === arc.name);
                if (arcClues.length === 0) return null;
                
                return (
                  <div key={arc.id} className="p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-800 mb-3">{arc.name}</h5>
                    <div className="space-y-2">
                      {arcClues.map((clue) => (
                        <div key={clue.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium text-gray-800">{clue.title}</span>
                            <span className="text-sm text-gray-600 ml-2">
                              (Order: {clue.arcOrder || 'Unordered'})
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {clue.associatedStorylets.length} storylet{clue.associatedStorylets.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {allArcs.filter(arc => clues.filter(clue => clue.storyArc === arc.name).length > 0).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🔗</div>
                  <p>No clue connections found</p>
                  <p className="text-sm">Create clues and assign them to story arcs to see connections</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'arcs' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-800">Arc Relationships (V2)</h4>
                <div className="text-sm text-gray-600">
                  Enhanced clue-arc integration with prerequisites and dependencies
                </div>
              </div>

              {/* Arc Overview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {allArcs.map((arc) => {
                  const arcClues = getCluesByArc(arc.id);
                  const completionPercentage = getArcCompletionPercentage(arc.id);
                  const nextClue = getNextClueInArc(arc.id);

                  return (
                    <div key={arc.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-gray-800">{arc.name}</h5>
                          <p className="text-sm text-gray-600">{arc.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-blue-600">
                            {completionPercentage.toFixed(0)}% Complete
                          </div>
                          <div className="text-xs text-gray-500">
                            {arcClues.length} clues
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completionPercentage}%` }}
                        ></div>
                      </div>

                      {/* Clue List */}
                      <div className="space-y-2">
                        {arcClues.length > 0 ? (
                          arcClues.map((clueId) => {
                            const clue = clues.find(c => c.id === clueId);
                            if (!clue) return null;

                            return (
                              <div key={clueId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${
                                    clue.isDiscovered ? 'bg-green-500' : 'bg-gray-300'
                                  }`}></span>
                                  <span className="font-medium text-gray-800">{clue.title}</span>
                                  {clue.arcOrder && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      #{clue.arcOrder}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleUnassignClueFromArc(clueId)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                  >
                                    Unassign
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">No clues assigned to this arc</p>
                            <p className="text-xs">Assign clues using the dropdown below</p>
                          </div>
                        )}
                      </div>

                      {/* Next Clue Indicator */}
                      {nextClue && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                          <div className="text-sm text-blue-800">
                            <strong>Next to discover:</strong> {clues.find(c => c.id === nextClue)?.title || 'Unknown'}
                          </div>
                        </div>
                      )}

                      {/* Quick Assign */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                const clueId = e.target.value;
                                const maxOrder = Math.max(0, ...arcClues.map(id => {
                                  const clue = clues.find(c => c.id === id);
                                  return clue?.arcOrder || 0;
                                }));
                                handleAssignClueToArc(clueId, arc.id, maxOrder + 1);
                                e.target.value = '';
                              }
                            }}
                            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="">Assign clue to this arc...</option>
                            {clues
                              .filter(clue => !clue.storyArc || !arcClues.includes(clue.id))
                              .map(clue => (
                                <option key={clue.id} value={clue.id}>
                                  {clue.title}
                                </option>
                              ))
                            }
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Unassigned Clues */}
              <div className="mt-8">
                <h5 className="font-medium text-gray-800 mb-3">Unassigned Clues</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {clues
                    .filter(clue => !clue.storyArc)
                    .map(clue => (
                      <div key={clue.id} className="p-3 border border-gray-200 rounded">
                        <div className="flex items-center justify-between">
                          <div>
                            <h6 className="font-medium text-gray-800">{clue.title}</h6>
                            <p className="text-xs text-gray-600">{clue.category} • {clue.difficulty}</p>
                          </div>
                        </div>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignClueToArc(clue.id, e.target.value, 1);
                            }
                          }}
                          className="w-full mt-2 text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="">Assign to arc...</option>
                          {allArcs.map(arc => (
                            <option key={arc.id} value={arc.id}>{arc.name}</option>
                          ))}
                        </select>
                      </div>
                    ))
                  }
                </div>

                {clues.filter(clue => !clue.storyArc).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">✅</div>
                    <p>All clues are assigned to story arcs</p>
                    <p className="text-sm">Create new clues to see them here</p>
                  </div>
                )}
              </div>

              {/* Arc Statistics */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-3">Statistics</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-lg font-bold text-blue-600">{allArcs.length}</div>
                    <div className="text-gray-600">Total Arcs</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {clues.filter(clue => clue.storyArc).length}
                    </div>
                    <div className="text-gray-600">Assigned Clues</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">
                      {clues.filter(clue => !clue.storyArc).length}
                    </div>
                    <div className="text-gray-600">Unassigned Clues</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">
                      {(allArcs.reduce((sum, arc) => sum + getArcCompletionPercentage(arc.id), 0) / allArcs.length || 0).toFixed(0)}%
                    </div>
                    <div className="text-gray-600">Avg Completion</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Clue Modal */}
      {showCreateClueForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingClue ? 'Edit Clue' : 'Create New Clue'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={clueFormData.title}
                  onChange={(e) => setClueFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Enter clue title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={clueFormData.description}
                  onChange={(e) => setClueFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                  placeholder="Brief description of the clue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={clueFormData.content}
                  onChange={(e) => setClueFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={4}
                  placeholder="Full clue content that players will see"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={clueFormData.category}
                    onChange={(e) => setClueFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="general">General</option>
                    <option value="academic">Academic</option>
                    <option value="social">Social</option>
                    <option value="personal">Personal</option>
                    <option value="mystery">Mystery</option>
                    <option value="achievement">Achievement</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={clueFormData.difficulty}
                    onChange={(e) => setClueFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Story Arc</label>
                <select
                  value={clueFormData.storyArc}
                  onChange={(e) => setClueFormData(prev => ({ 
                    ...prev, 
                    storyArc: e.target.value,
                    // Reset outcome storylets when arc changes
                    positiveOutcomeStorylet: '',
                    negativeOutcomeStorylet: ''
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="">-- No Story Arc --</option>
                  {allArcs.map(arc => (
                    <option key={arc.id} value={arc.name}>{arc.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discovery Minigames
                  <HelpTooltip content="Select minigames that can trigger this clue discovery. Multiple selections allowed." />
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
                  {minigameTypes.map(minigame => (
                    <label key={minigame.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={clueFormData.minigameTypes.includes(minigame.value)}
                        onChange={(e) => {
                          setClueFormData(prev => ({
                            ...prev,
                            minigameTypes: e.target.checked
                              ? [...prev.minigameTypes, minigame.value]
                              : prev.minigameTypes.filter(type => type !== minigame.value)
                          }));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">{minigame.label}</span>
                        <div className="text-xs text-gray-500">{minigame.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {clueFormData.minigameTypes.length > 0 && (
                  <div className="text-sm text-blue-600 mt-1">
                    Selected: {clueFormData.minigameTypes.map(type => 
                      minigameTypes.find(m => m.value === type)?.label
                    ).join(', ')}
                  </div>
                )}
              </div>

              {/* Outcome Storylets - only show if story arc is selected */}
              {clueFormData.storyArc && (
                <div className="bg-gradient-to-r from-green-50 to-red-50 p-4 rounded-lg border">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">
                    🎮 Minigame Outcome Paths
                    <HelpTooltip content="These storylets are triggered based on whether the player succeeds or fails the selected minigames above" />
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        ✅ Success Path (Minigame Won)
                        <HelpTooltip content="Storylet to trigger when player successfully completes the minigame and discovers the clue" />
                      </label>
                    <select
                      value={clueFormData.positiveOutcomeStorylet}
                      onChange={(e) => setClueFormData(prev => ({ ...prev, positiveOutcomeStorylet: e.target.value }))}
                      className="w-full px-3 py-2 border border-green-300 rounded focus:border-green-500 focus:ring-green-500"
                    >
                      <option value="">-- No Success Storylet --</option>
                      {arcStorylets.map(storylet => (
                        <option key={storylet.id} value={storylet.id}>
                          {storylet.name}
                        </option>
                      ))}
                    </select>
                  </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-1">
                        ❌ Failure Path (Minigame Lost)
                        <HelpTooltip content="Storylet to trigger when player fails the minigame and doesn't discover the clue" />
                      </label>
                    <select
                      value={clueFormData.negativeOutcomeStorylet}
                      onChange={(e) => setClueFormData(prev => ({ ...prev, negativeOutcomeStorylet: e.target.value }))}
                      className="w-full px-3 py-2 border border-red-300 rounded focus:border-red-500 focus:ring-red-500"
                    >
                      <option value="">-- No Failure Storylet --</option>
                      {arcStorylets.map(storylet => (
                        <option key={storylet.id} value={storylet.id}>
                          {storylet.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                    {arcStorylets.length === 0 && (
                      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
                        No storylets found in the "{clueFormData.storyArc}" arc. Create storylets for this arc to enable outcome triggers.
                      </div>
                    )}
                    
                    {arcStorylets.length > 0 && (
                      <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
                        Found {arcStorylets.length} storylet{arcStorylets.length !== 1 ? 's' : ''} in "{clueFormData.storyArc}" arc
                      </div>
                    )}
                    
                    {clueFormData.minigameTypes.length > 0 && (clueFormData.positiveOutcomeStorylet || clueFormData.negativeOutcomeStorylet) && (
                      <div className="text-sm text-purple-600 bg-purple-50 p-3 rounded border border-purple-200">
                        💡 <strong>How it works:</strong> When players attempt the selected minigame(s), 
                        {clueFormData.positiveOutcomeStorylet && clueFormData.negativeOutcomeStorylet 
                          ? ' they\'ll follow the success path if they win or the failure path if they lose.'
                          : clueFormData.positiveOutcomeStorylet 
                            ? ' they\'ll follow the success path if they win (no specific failure path set).'
                            : ' they\'ll follow the failure path if they lose (no specific success path set).'
                        }
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={clueFormData.tags}
                  onChange={(e) => setClueFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateClueForm(false);
                  setEditingClue(null);
                  resetClueForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={editingClue ? handleUpdateClue : handleCreateClue}
                disabled={!clueFormData.title.trim() || !clueFormData.description.trim() || !clueFormData.content.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {editingClue ? 'Update Clue' : 'Create Clue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </BaseStudioComponent>
  );
};

export default ClueManager;