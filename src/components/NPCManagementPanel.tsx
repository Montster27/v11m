import React, { useState, useMemo } from 'react';
import { useNPCStore } from '../store/useNPCStore';
import type { NPC, NPCPersonality, NPCBackground, NPCStatus, RelationshipType } from '../types/npc';
import { Button, Card } from './ui';
import { sampleNPCs } from '../data/sampleNPCs';

type NPCTabType = 'overview' | 'manage' | 'create' | 'relationships' | 'memories' | 'locations';

interface NPCFormData {
  id: string;
  name: string;
  description: string;
  personality: NPCPersonality;
  background: NPCBackground;
  currentStatus: NPCStatus;
  relationshipLevel: number;
  relationshipType: RelationshipType;
  locations: Array<{
    id: string;
    name: string;
    probability: number;
    timeRanges?: string[];
  }>;
  associatedStorylets: string[];
  storyArc?: string;
}

const defaultFormData: NPCFormData = {
  id: '',
  name: '',
  description: '',
  personality: {
    traits: [],
    interests: [],
    values: [],
    speechStyle: 'casual'
  },
  background: {
    activities: []
  },
  currentStatus: {
    mood: 'neutral',
    availability: 'available'
  },
  relationshipLevel: 50,
  relationshipType: 'stranger',
  locations: [],
  associatedStorylets: []
};

export const NPCManagementPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NPCTabType>('overview');
  const [selectedNPCId, setSelectedNPCId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<NPCFormData>(defaultFormData);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Raw input states for comma-separated fields
  const [traitsInput, setTraitsInput] = useState('');
  const [interestsInput, setInterestsInput] = useState('');
  const [valuesInput, setValuesInput] = useState('');
  const [activitiesInput, setActivitiesInput] = useState('');

  const {
    npcs,
    getAllNPCs,
    addNPC,
    updateNPC,
    removeNPC,
    adjustRelationship,
    addMemory,
    setNPCFlag,
    getStats,
    searchNPCs,
    resetAllNPCData,
    exportNPCData,
    importNPCData
  } = useNPCStore();

  const allNPCs = getAllNPCs();
  const stats = getStats();
  const selectedNPC = selectedNPCId ? npcs[selectedNPCId] : null;

  const filteredNPCs = useMemo(() => {
    if (!searchQuery) return allNPCs;
    return searchNPCs(searchQuery);
  }, [allNPCs, searchQuery, searchNPCs]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'manage', label: 'Manage NPCs' },
    { id: 'create', label: 'Create/Edit' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'memories', label: 'Memories' },
    { id: 'locations', label: 'Locations' }
  ];

  const handleCreateNPC = () => {
    if (!formData.id || !formData.name) return;

    const newNPC: NPC = {
      ...formData,
      memories: [],
      flags: {},
      lastInteraction: new Date()
    };

    addNPC(newNPC);
    setFormData(defaultFormData);
    setTraitsInput('');
    setInterestsInput('');
    setValuesInput('');
    setActivitiesInput('');
    setIsCreating(false);
    setActiveTab('manage');
  };

  const handleUpdateNPC = () => {
    if (!selectedNPCId || !formData.id || !formData.name) return;

    updateNPC(selectedNPCId, formData);
    setFormData(defaultFormData);
    setTraitsInput('');
    setInterestsInput('');
    setValuesInput('');
    setActivitiesInput('');
    setSelectedNPCId(null);
    setIsCreating(false);
  };

  const handleEditNPC = (npc: NPC) => {
    setFormData(npc);
    setSelectedNPCId(npc.id);
    setIsCreating(true);
    
    // Populate raw input states
    setTraitsInput(npc.personality.traits.join(', '));
    setInterestsInput(npc.personality.interests.join(', '));
    setValuesInput(npc.personality.values.join(', '));
    setActivitiesInput(npc.background.activities.join(', '));
    
    setActiveTab('create');
  };

  const handleDeleteNPC = (npcId: string) => {
    if (confirm('Are you sure you want to delete this NPC?')) {
      removeNPC(npcId);
      if (selectedNPCId === npcId) {
        setSelectedNPCId(null);
      }
    }
  };

  const handleExport = () => {
    const data = exportNPCData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'npc-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      if (importNPCData(data)) {
        alert('NPC data imported successfully!');
      } else {
        alert('Failed to import NPC data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const initializeSampleNPCs = () => {
    sampleNPCs.forEach(npc => {
      if (!npcs[npc.id]) {
        addNPC(npc);
      }
    });
    alert(`Added ${sampleNPCs.length} sample NPCs!`);
  };

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="p-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">📊 Statistics</h3>
          <div className="space-y-1 text-xs">
            <p>Total NPCs: <span className="font-medium">{stats.totalNPCs}</span></p>
            <p>Avg Relationship: <span className="font-medium">{stats.averageRelationshipLevel}</span></p>
            <p>Total Memories: <span className="font-medium">{stats.memoriesCount}</span></p>
            <p>Active Flags: <span className="font-medium">{stats.activeFlags}</span></p>
          </div>
        </Card>

        <Card className="p-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">🔧 Quick Actions</h3>
          <div className="space-y-1">
            <Button 
              onClick={() => setActiveTab('create')} 
              variant="primary" 
              size="sm"
              className="w-full text-xs"
            >
              Create New NPC
            </Button>
            <Button 
              onClick={initializeSampleNPCs} 
              variant="outline" 
              size="sm"
              className="w-full text-xs text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              Add Sample NPCs
            </Button>
            <div className="flex space-x-1">
              <Button 
                onClick={handleExport} 
                variant="outline" 
                size="sm"
                className="flex-1 text-xs"
              >
                Export
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button 
                onClick={() => document.getElementById('import-file')?.click()} 
                variant="outline" 
                size="sm"
                className="flex-1 text-xs"
              >
                Import
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {Object.keys(stats.relationshipDistribution).length > 0 && (
        <Card className="p-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">💝 Relationships</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {Object.entries(stats.relationshipDistribution).map(([type, count]) => (
              <div key={type} className="flex justify-between">
                <span className="capitalize">{type.replace('_', ' ')}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {allNPCs.length > 0 && (
        <Card className="p-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">NPCs ({allNPCs.length})</h3>
          <div className="space-y-2">
            {allNPCs.slice(0, 3).map(npc => (
              <div key={npc.id} className="border rounded p-2 hover:bg-gray-50">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-medium text-xs text-gray-800">{npc.name}</h4>
                  <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-800 rounded">
                    {npc.relationshipLevel}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate">{npc.description}</p>
              </div>
            ))}
            {allNPCs.length > 3 && (
              <button 
                onClick={() => setActiveTab('manage')}
                className="text-xs text-blue-600 hover:text-blue-800 w-full text-center"
              >
                View all {allNPCs.length} NPCs →
              </button>
            )}
          </div>
        </Card>
      )}

      {allNPCs.length === 0 && (
        <Card className="p-4 text-center">
          <p className="text-gray-500 text-sm mb-3">No NPCs created yet</p>
          <Button 
            onClick={initializeSampleNPCs} 
            variant="primary" 
            size="sm"
          >
            Add Sample NPCs to Get Started
          </Button>
        </Card>
      )}
    </div>
  );

  const renderManage = () => (
    <div className="space-y-3">
      <div className="flex flex-col space-y-2">
        <input
          type="text"
          placeholder="Search NPCs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="flex space-x-1">
          <Button onClick={() => setActiveTab('create')} variant="primary" size="sm" className="text-xs">
            Create New
          </Button>
          <Button 
            onClick={() => resetAllNPCData()} 
            variant="outline"
            size="sm"
            className="text-xs text-red-600 border-red-300 hover:bg-red-50"
          >
            Reset All
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {filteredNPCs.map(npc => (
          <Card key={npc.id} className="p-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-800 truncate">{npc.name}</h3>
                <p className="text-xs text-gray-600 truncate">{npc.description}</p>
              </div>
              <div className="flex space-x-1 ml-2 flex-shrink-0">
                <Button 
                  onClick={() => handleEditNPC(npc)} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  Edit
                </Button>
                <Button 
                  onClick={() => handleDeleteNPC(npc.id)} 
                  variant="outline" 
                  size="sm"
                  className="text-xs text-red-600 border-red-300 hover:bg-red-50"
                >
                  Del
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Rel:</span>
                <span className="font-medium">
                  {npc.relationshipLevel} ({npc.relationshipType.replace('_', ' ')})
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mood:</span>
                <span className="font-medium capitalize">{npc.currentStatus.mood}</span>
              </div>
              <div className="flex justify-between">
                <span>Memories:</span>
                <span className="font-medium">{npc.memories.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Storylets:</span>
                <span className="font-medium">{npc.associatedStorylets.length}</span>
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex space-x-1">
                <Button 
                  onClick={() => adjustRelationship(npc.id, 10, 'Dev adjustment')} 
                  variant="outline" 
                  size="sm"
                  className="text-xs text-green-600 border-green-300 flex-1"
                >
                  +10
                </Button>
                <Button 
                  onClick={() => adjustRelationship(npc.id, -10, 'Dev adjustment')} 
                  variant="outline" 
                  size="sm"
                  className="text-xs text-red-600 border-red-300 flex-1"
                >
                  -10
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filteredNPCs.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            {searchQuery ? 'No NPCs match your search' : 'No NPCs found. Create some first!'}
          </div>
        )}
      </div>
    </div>
  );

  const renderCreate = () => (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          {selectedNPCId ? 'Edit NPC' : 'Create New NPC'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sarah_chen"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sarah Chen"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="A thoughtful English Literature major..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
              <input
                type="text"
                value={formData.background.major || ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  background: {...formData.background, major: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="English Literature"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={formData.background.year || ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  background: {...formData.background, year: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select year</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activities (comma separated)
                <span className="text-xs text-gray-500 ml-1">e.g. Drama Club, Basketball</span>
              </label>
              <textarea
                rows={1}
                value={activitiesInput}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  setActivitiesInput(rawValue);
                  
                  // Update formData with parsed activities
                  const activities = rawValue
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                  setFormData({
                    ...formData, 
                    background: {
                      ...formData.background, 
                      activities
                    }
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Campus Radio, Literary Magazine, Study Groups"
              />
              <div className="text-xs text-gray-500 mt-1">
                Current activities: {formData.background.activities.length > 0 ? formData.background.activities.join(', ') : 'None'}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Speech Style</label>
              <select
                value={formData.personality.speechStyle}
                onChange={(e) => setFormData({
                  ...formData, 
                  personality: {...formData.personality, speechStyle: e.target.value as any}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="academic">Academic</option>
                <option value="artistic">Artistic</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship Level ({formData.relationshipLevel})
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.relationshipLevel}
                onChange={(e) => setFormData({...formData, relationshipLevel: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Type</label>
              <select
                value={formData.relationshipType}
                onChange={(e) => setFormData({...formData, relationshipType: e.target.value as RelationshipType})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="stranger">Stranger</option>
                <option value="acquaintance">Acquaintance</option>
                <option value="friend">Friend</option>
                <option value="close_friend">Close Friend</option>
                <option value="romantic_interest">Romantic Interest</option>
                <option value="dating">Dating</option>
                <option value="rival">Rival</option>
                <option value="enemy">Enemy</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Traits (comma separated)
                <span className="text-xs text-gray-500 ml-1">e.g. thoughtful, artistic, warm</span>
              </label>
              <textarea
                rows={1}
                value={traitsInput}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  setTraitsInput(rawValue);
                  
                  // Update formData with parsed traits
                  const traits = rawValue
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                  setFormData({
                    ...formData, 
                    personality: {
                      ...formData.personality, 
                      traits
                    }
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="thoughtful, artistic, warm, intelligent"
              />
              <div className="text-xs text-gray-500 mt-1">
                Current traits: {formData.personality.traits.length > 0 ? formData.personality.traits.join(', ') : 'None'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interests (comma separated)
                <span className="text-xs text-gray-500 ml-1">e.g. literature, music, art</span>
              </label>
              <textarea
                rows={1}
                value={interestsInput}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  setInterestsInput(rawValue);
                  
                  // Update formData with parsed interests
                  const interests = rawValue
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                  setFormData({
                    ...formData, 
                    personality: {
                      ...formData.personality, 
                      interests
                    }
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="literature, radio broadcasting, indie music, creative writing"
              />
              <div className="text-xs text-gray-500 mt-1">
                Current interests: {formData.personality.interests.length > 0 ? formData.personality.interests.join(', ') : 'None'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Values (comma separated)
                <span className="text-xs text-gray-500 ml-1">e.g. honesty, creativity, friendship</span>
              </label>
              <textarea
                rows={1}
                value={valuesInput}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  setValuesInput(rawValue);
                  
                  // Update formData with parsed values
                  const values = rawValue
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                  setFormData({
                    ...formData, 
                    personality: {
                      ...formData.personality, 
                      values
                    }
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="authenticity, creativity, intellectual growth, meaningful connections"
              />
              <div className="text-xs text-gray-500 mt-1">
                Current values: {formData.personality.values.length > 0 ? formData.personality.values.join(', ') : 'None'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button 
            onClick={() => {
              setFormData(defaultFormData);
              setTraitsInput('');
              setInterestsInput('');
              setValuesInput('');
              setActivitiesInput('');
              setSelectedNPCId(null);
              setIsCreating(false);
            }}
            variant="outline"
          >
            Cancel
          </Button>
          <Button 
            onClick={selectedNPCId ? handleUpdateNPC : handleCreateNPC}
            variant="primary"
            disabled={!formData.id || !formData.name}
          >
            {selectedNPCId ? 'Update NPC' : 'Create NPC'}
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderRelationships = () => (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Relationship Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allNPCs.map(npc => (
            <div key={npc.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">{npc.name}</h4>
                <span className="text-sm text-gray-600">{npc.relationshipLevel}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{width: `${npc.relationshipLevel}%`}}
                ></div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="capitalize text-gray-600">
                  {npc.relationshipType.replace('_', ' ')}
                </span>
                <div className="space-x-1">
                  <Button 
                    onClick={() => adjustRelationship(npc.id, 5, 'Dev boost')}
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-300"
                  >
                    +5
                  </Button>
                  <Button 
                    onClick={() => adjustRelationship(npc.id, -5, 'Dev reduction')}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300"
                  >
                    -5
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderMemories = () => (
    <div className="space-y-4">
      {allNPCs.map(npc => (
        <Card key={npc.id} className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            {npc.name} ({npc.memories.length} memories)
          </h3>
          <div className="space-y-2">
            {npc.memories.slice(0, 5).map(memory => (
              <div key={memory.id} className="border-l-4 border-blue-400 pl-3 py-2">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm">{memory.description}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    memory.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                    memory.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {memory.sentiment}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Importance: {memory.importance}/10</span>
                  <span>{memory.timestamp.toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {npc.memories.length === 0 && (
              <p className="text-gray-500 text-sm">No memories yet</p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );

  const renderLocations = () => (
    <div className="space-y-4">
      {allNPCs.map(npc => (
        <Card key={npc.id} className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            {npc.name} Locations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {npc.locations.map((location, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{location.name}</h4>
                  <span className="text-sm text-gray-600">
                    {Math.round(location.probability * 100)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">ID: {location.id}</p>
                {location.timeRanges && location.timeRanges.length > 0 && (
                  <div className="text-xs text-gray-600">
                    Times: {location.timeRanges.join(', ')}
                  </div>
                )}
              </div>
            ))}
            {npc.locations.length === 0 && (
              <p className="text-gray-500 text-sm">No locations defined</p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-96">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">NPC Management</h1>
        <p className="text-gray-600 text-sm mt-1">Manage non-player characters, relationships, and interactions</p>
        
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as NPCTabType)}
                className={`py-3 px-2 border-b-2 font-medium text-xs whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 max-h-[500px] overflow-y-auto">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'manage' && renderManage()}
          {activeTab === 'create' && renderCreate()}
          {activeTab === 'relationships' && renderRelationships()}
          {activeTab === 'memories' && renderMemories()}
          {activeTab === 'locations' && renderLocations()}
        </div>
      </div>
    </div>
  );
};