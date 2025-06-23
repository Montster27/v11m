// /Users/montysharma/V11M2/src/components/contentStudio/ClueManager.tsx

import React, { useState, useMemo } from 'react';
import { useClueStore } from '../../store/useClueStore';
import { useStoryletStore } from '../../store/useStoryletStore';
import { useStoryletCatalogStore } from '../../store/useStoryletCatalogStore';
import type { Clue } from '../../types/clue';
import HelpTooltip from '../ui/HelpTooltip';
import MinigameManagementPanel from '../MinigameManagementPanel';

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

type ClueManagerTab = 'clues' | 'minigames' | 'connections';

const ClueManager: React.FC<ClueManagerProps> = ({ undoRedoSystem }) => {
  const {
    clues,
    createClue,
    updateClue,
    deleteClue,
    getCluesByStoryArc,
    getCluesByMinigame,
    getCluesByStorylet
  } = useClueStore();

  const { storyArcs } = useStoryletStore();
  const { getStoryletsForArc } = useStoryletCatalogStore();

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
    return getStoryletsForArc(clueFormData.storyArc);
  }, [getStoryletsForArc, clueFormData.storyArc]);

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

  const handleCreateClue = () => {
    if (!clueFormData.title.trim()) return;

    const clue = createClue({
      ...clueFormData,
      tags: clueFormData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    });

    resetClueForm();
    setShowCreateClueForm(false);
    setSelectedClue(clue.id);
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

  const handleUpdateClue = () => {
    if (!editingClue || !clueFormData.title.trim()) return;

    updateClue(editingClue.id, {
      ...clueFormData,
      tags: clueFormData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    });

    resetClueForm();
    setShowCreateClueForm(false);
  };

  const handleDeleteClue = (clueId: string) => {
    if (confirm('Are you sure you want to delete this clue?')) {
      deleteClue(clueId);
      if (selectedClue === clueId) {
        setSelectedClue('');
      }
    }
  };

  const tabs = [
    { id: 'clues', label: 'Clue Library', icon: '🔍' },
    { id: 'minigames', label: 'Minigame Testing', icon: '🎮' },
    { id: 'connections', label: 'Story Connections', icon: '🔗' }
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Clue & Minigame Manager</h3>
            <p className="text-sm text-gray-600">
              Create and manage clues, configure discovery methods, and test minigames
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HelpTooltip content="Manage clues that players can discover through gameplay, configure minigame challenges, and view connections between clues and storylets." />
            <button
              onClick={() => setShowCreateClueForm(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              + New Clue
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-4 gap-4">
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
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ClueManagerTab)}
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
                            <h5 className="font-medium text-gray-800 mb-2">Discovery Methods</h5>
                            <div className="space-y-1">
                              {clue.minigameTypes.map(type => {
                                const minigame = minigameTypes.find(m => m.value === type);
                                return (
                                  <div key={type} className="flex items-center justify-between p-2 bg-green-50 rounded">
                                    <span className="text-sm font-medium text-green-800">{minigame?.label || type}</span>
                                    <span className="text-xs text-green-600">{minigame?.description}</span>
                                  </div>
                                );
                              })}
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
              
              {storyArcs.map((arcName) => {
                const arcClues = getCluesByStoryArc(arcName);
                if (arcClues.length === 0) return null;
                
                return (
                  <div key={arcName} className="p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-800 mb-3">{arcName}</h5>
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
              
              {storyArcs.filter(arc => getCluesByStoryArc(arc).length > 0).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🔗</div>
                  <p>No clue connections found</p>
                  <p className="text-sm">Create clues and assign them to story arcs to see connections</p>
                </div>
              )}
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
                  {storyArcs.map(arc => (
                    <option key={arc} value={arc}>{arc}</option>
                  ))}
                </select>
              </div>

              {/* Outcome Storylets - only show if story arc is selected */}
              {clueFormData.storyArc && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      ✅ Positive Outcome Storylet
                      <HelpTooltip content="Storylet to trigger when clue discovery succeeds" />
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
                      ❌ Negative Outcome Storylet
                      <HelpTooltip content="Storylet to trigger when clue discovery fails" />
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
    </div>
  );
};

export default ClueManager;