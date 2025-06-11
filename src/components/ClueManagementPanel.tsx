// /Users/montysharma/V11M2/src/components/ClueManagementPanel.tsx
import React, { useState } from 'react';
import { useClueStore } from '../store/useClueStore';
import { useStoryletStore } from '../store/useStoryletStore';
import { Button, Card } from './ui';
import { Clue, ClueFormData, StoryArc } from '../types/clue';

type ClueTabType = 'all' | 'create' | 'storyArcs' | 'discovered' | 'stats';

const AVAILABLE_MINIGAMES = [
  { id: 'memory', name: 'Memory Card Game' },
  { id: 'stroop', name: 'Stroop Test' },
  { id: 'wordscramble', name: 'Word Scramble' },
  { id: 'colormatch', name: 'Color Match' }
];

const getMinigameName = (id: string): string => {
  const minigame = AVAILABLE_MINIGAMES.find(m => m.id === id);
  return minigame ? minigame.name : id;
};

const ClueManagementPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ClueTabType>('all');
  const [editingClue, setEditingClue] = useState<Clue | null>(null);
  const [newClueForm, setNewClueForm] = useState<ClueFormData>({
    id: '',
    title: '',
    description: '',
    content: '',
    category: 'general',
    difficulty: 'medium',
    storyArc: '',
    arcOrder: 1,
    minigameTypes: [],
    associatedStorylets: [],
    tags: [],
    rarity: 'common'
  });
  const [newStoryArcForm, setNewStoryArcForm] = useState({
    name: ''
  });
  const [selectedMinigame, setSelectedMinigame] = useState<string>('');

  const {
    clues,
    createClue,
    updateClue,
    deleteClue,
    getDiscoveredClues,
    getDiscoveryStats
  } = useClueStore();

  const { allStorylets, storyArcs, addStoryArc, removeStoryArc } = useStoryletStore();

  const stats = getDiscoveryStats();
  const discoveredClues = getDiscoveredClues();

  const handleCreateClue = () => {
    if (!newClueForm.id.trim() || !newClueForm.title.trim()) return;
    
    createClue(newClueForm);
    setNewClueForm({
      id: '',
      title: '',
      description: '',
      content: '',
      category: 'general',
      difficulty: 'medium',
      storyArc: '',
      arcOrder: 1,
      minigameTypes: [],
      associatedStorylets: [],
      tags: [],
      rarity: 'common'
    });
  };

  const handleEditClue = (clue: Clue) => {
    setEditingClue(clue);
    setNewClueForm({
      id: clue.id,
      title: clue.title,
      description: clue.description,
      content: clue.content,
      category: clue.category,
      difficulty: clue.difficulty,
      storyArc: clue.storyArc || '',
      arcOrder: clue.arcOrder || 1,
      minigameTypes: clue.minigameTypes,
      associatedStorylets: clue.associatedStorylets,
      tags: clue.tags,
      rarity: clue.rarity
    });
    setActiveTab('create'); // Switch to create tab for editing
  };

  const handleUpdateClue = () => {
    if (!editingClue || !newClueForm.id.trim() || !newClueForm.title.trim()) return;
    
    updateClue(editingClue.id, newClueForm);
    setEditingClue(null);
    setNewClueForm({
      id: '',
      title: '',
      description: '',
      content: '',
      category: 'general',
      difficulty: 'medium',
      storyArc: '',
      arcOrder: 1,
      minigameTypes: [],
      associatedStorylets: [],
      tags: [],
      rarity: 'common'
    });
    setActiveTab('all'); // Switch back to all clues
  };

  const handleCancelEdit = () => {
    setEditingClue(null);
    setNewClueForm({
      id: '',
      title: '',
      description: '',
      content: '',
      category: 'general',
      difficulty: 'medium',
      storyArc: '',
      arcOrder: 1,
      minigameTypes: [],
      associatedStorylets: [],
      tags: [],
      rarity: 'common'
    });
    setActiveTab('all');
  };

  const handleCreateStoryArc = () => {
    if (!newStoryArcForm.name.trim()) return;
    
    addStoryArc(newStoryArcForm.name);
    setNewStoryArcForm({ name: '' });
  };

  const handleDeleteClue = (clueId: string) => {
    if (confirm('Are you sure you want to delete this clue?')) {
      deleteClue(clueId);
    }
  };

  const handleDeleteStoryArc = (arcName: string) => {
    if (confirm('Are you sure you want to delete this story arc? All associated clues will lose their arc association.')) {
      removeStoryArc(arcName);
    }
  };

  const addMinigameType = (type: string) => {
    if (type && !newClueForm.minigameTypes.includes(type)) {
      setNewClueForm(prev => ({
        ...prev,
        minigameTypes: [...prev.minigameTypes, type]
      }));
    }
  };

  const removeMinigameType = (type: string) => {
    setNewClueForm(prev => ({
      ...prev,
      minigameTypes: prev.minigameTypes.filter(t => t !== type)
    }));
  };

  const addStoryletAssociation = (storyletId: string) => {
    if (storyletId && !newClueForm.associatedStorylets.includes(storyletId)) {
      setNewClueForm(prev => ({
        ...prev,
        associatedStorylets: [...prev.associatedStorylets, storyletId]
      }));
    }
  };

  const removeStoryletAssociation = (storyletId: string) => {
    setNewClueForm(prev => ({
      ...prev,
      associatedStorylets: prev.associatedStorylets.filter(id => id !== storyletId)
    }));
  };

  const renderAllClues = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">All Clues ({clues.length})</h3>
        <Button onClick={() => setActiveTab('create')} variant="primary" size="sm">
          Create New Clue
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clues.map((clue) => (
          <Card key={clue.id} className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-900">{clue.title}</h4>
                  <div className="text-xs text-gray-500 font-mono">ID: {clue.id}</div>
                </div>
                <div className="flex space-x-1">
                  <span className={`px-2 py-1 text-xs rounded ${
                    clue.isDiscovered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {clue.isDiscovered ? 'Discovered' : 'Hidden'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    clue.rarity === 'common' ? 'bg-gray-100 text-gray-600' :
                    clue.rarity === 'uncommon' ? 'bg-blue-100 text-blue-600' :
                    clue.rarity === 'rare' ? 'bg-purple-100 text-purple-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {clue.rarity}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">{clue.description}</p>
              
              {clue.storyArc && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Arc: {clue.storyArc} (#{clue.arcOrder})
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                <div>Category: {clue.category}</div>
                <div>Difficulty: {clue.difficulty}</div>
                <div>Minigames: {clue.minigameTypes.map(getMinigameName).join(', ') || 'None'}</div>
              </div>
              
              <div className="flex space-x-2 pt-2">
                <Button
                  onClick={() => handleEditClue(clue)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDeleteClue(clue.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCreateClue = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {editingClue ? 'Edit Clue' : 'Create New Clue'}
        </h3>
        <div className="space-x-2">
          {editingClue && (
            <Button onClick={handleCancelEdit} variant="outline" size="sm">
              Cancel Edit
            </Button>
          )}
          <Button onClick={() => setActiveTab('all')} variant="outline" size="sm">
            ← Back to All Clues
          </Button>
        </div>
      </div>
      
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Basic Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clue ID *</label>
              <input
                type="text"
                value={newClueForm.id}
                onChange={(e) => setNewClueForm(prev => ({ ...prev, id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="unique_clue_id (used in storylet clueDiscovery effects)"
                disabled={editingClue !== null} // Don't allow editing ID of existing clues
              />
              <div className="text-xs text-gray-500 mt-1">
                This ID is used in storylet clueDiscovery effects. Use lowercase with underscores.
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={newClueForm.title}
                onChange={(e) => setNewClueForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter clue title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newClueForm.description}
                onChange={(e) => setNewClueForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Brief description of the clue"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={newClueForm.content}
                onChange={(e) => setNewClueForm(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="The actual clue content the player will see"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newClueForm.category}
                  onChange={(e) => setNewClueForm(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  value={newClueForm.difficulty}
                  onChange={(e) => setNewClueForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rarity</label>
              <select
                value={newClueForm.rarity}
                onChange={(e) => setNewClueForm(prev => ({ ...prev, rarity: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>
          </div>
          
          {/* Associations */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Associations</h4>
            
            {/* Story Arc */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Story Arc (Optional)</label>
              <div className="flex space-x-2">
                <select
                  value={newClueForm.storyArc}
                  onChange={(e) => setNewClueForm(prev => ({ ...prev, storyArc: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Story Arc</option>
                  {storyArcs.map((arcName) => (
                    <option key={arcName} value={arcName}>{arcName}</option>
                  ))}
                </select>
                {newClueForm.storyArc && (
                  <input
                    type="number"
                    value={newClueForm.arcOrder}
                    onChange={(e) => setNewClueForm(prev => ({ ...prev, arcOrder: parseInt(e.target.value) || 1 }))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Order"
                    min="1"
                  />
                )}
              </div>
            </div>
            
            {/* Minigame Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minigame Types</label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <select
                    value={selectedMinigame}
                    onChange={(e) => setSelectedMinigame(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a minigame to add</option>
                    {AVAILABLE_MINIGAMES.map((minigame) => (
                      <option key={minigame.id} value={minigame.id}>
                        {minigame.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => {
                      if (selectedMinigame) {
                        addMinigameType(selectedMinigame);
                        setSelectedMinigame('');
                      }
                    }}
                    variant="outline"
                    disabled={!selectedMinigame || newClueForm.minigameTypes.includes(selectedMinigame)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newClueForm.minigameTypes.map((type) => (
                    <span
                      key={type}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded flex items-center space-x-1"
                    >
                      <span>{getMinigameName(type)}</span>
                      <button
                        onClick={() => removeMinigameType(type)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Associated Storylets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Associated Storylets</label>
              <div className="space-y-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addStoryletAssociation(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a storylet to associate</option>
                  {Object.values(allStorylets)
                    .filter(s => !newClueForm.associatedStorylets.includes(s.id))
                    .map((storylet) => (
                      <option key={storylet.id} value={storylet.id}>{storylet.name}</option>
                    ))}
                </select>
                <div className="space-y-1">
                  {newClueForm.associatedStorylets.map((storyletId) => {
                    const storylet = allStorylets[storyletId];
                    return (
                      <div
                        key={storyletId}
                        className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded flex items-center justify-between"
                      >
                        <span>{storylet?.name || storyletId}</span>
                        <button
                          onClick={() => removeStoryletAssociation(storyletId)}
                          className="text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          {editingClue && (
            <Button onClick={handleCancelEdit} variant="outline">
              Cancel
            </Button>
          )}
          <Button 
            onClick={editingClue ? handleUpdateClue : handleCreateClue} 
            variant="primary"
          >
            {editingClue ? 'Update Clue' : 'Create Clue'}
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderStoryArcs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Story Arcs ({storyArcs.length})</h3>
      </div>
      
      {/* Create New Story Arc */}
      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-4">Create New Story Arc</h4>
        <div className="flex gap-4">
          <input
            type="text"
            value={newStoryArcForm.name}
            onChange={(e) => setNewStoryArcForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Story arc name (e.g., 'Mystery Investigation', 'Character Development')"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={handleCreateStoryArc} variant="primary">
            Create Arc
          </Button>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Story arcs help organize both storylets and clues around common themes or narrative progressions.
        </div>
      </Card>
      
      {/* Existing Story Arcs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {storyArcs.map((arcName) => {
          const cluesInArc = clues.filter(clue => clue.storyArc === arcName);
          const discoveredInArc = cluesInArc.filter(clue => clue.isDiscovered);
          
          return (
            <Card key={arcName} className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-gray-900">{arcName}</h4>
                  <span className={`px-2 py-1 text-xs rounded ${
                    discoveredInArc.length === cluesInArc.length && cluesInArc.length > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {discoveredInArc.length}/{cluesInArc.length} clues
                  </span>
                </div>
                
                <p className="text-sm text-gray-600">
                  Used by both storylets and clues for narrative organization
                </p>
                
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => handleDeleteStoryArc(arcName)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
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

  const renderStats = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Discovery Statistics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.discoveredClues}</div>
          <div className="text-sm text-gray-600">Discovered Clues</div>
          <div className="text-xs text-gray-500">of {stats.totalClues} total</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.discoveryRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Discovery Rate</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.storyArcsCompleted}</div>
          <div className="text-sm text-gray-600">Completed Arcs</div>
          <div className="text-xs text-gray-500">of {stats.totalStoryArcs} total</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{discoveredClues.length}</div>
          <div className="text-sm text-gray-600">Recently Discovered</div>
        </Card>
      </div>
      
      {discoveredClues.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Recently Discovered Clues</h4>
          <div className="space-y-2">
            {discoveredClues.slice(-10).reverse().map((clue) => (
              <div key={clue.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-green-900">{clue.title}</div>
                  <div className="text-sm text-green-700">{clue.description}</div>
                </div>
                <div className="text-xs text-green-600">
                  {clue.discoveredAt ? new Date(clue.discoveredAt).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Clue Management</h2>
        <div className="text-sm text-gray-600">
          {stats.discoveredClues}/{stats.totalClues} clues discovered
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b">
        {[
          { id: 'all', label: 'All Clues' },
          { id: 'create', label: 'Create Clue' },
          { id: 'storyArcs', label: 'Story Arcs' },
          { id: 'discovered', label: 'Discovered' },
          { id: 'stats', label: 'Statistics' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ClueTabType)}
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
      {activeTab === 'all' && renderAllClues()}
      {activeTab === 'create' && renderCreateClue()}
      {activeTab === 'storyArcs' && renderStoryArcs()}
      {activeTab === 'discovered' && renderStats()}
      {activeTab === 'stats' && renderStats()}
    </div>
  );
};

export default ClueManagementPanel;