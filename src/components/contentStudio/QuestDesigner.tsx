// /Users/montysharma/V11M2/src/components/contentStudio/QuestDesigner.tsx

import React, { useState } from 'react';
import { UndoRedoAction } from '../../hooks/useUndoRedo';
import HelpTooltip from '../ui/HelpTooltip';

interface UndoRedoSystem {
  executeAction: (action: UndoRedoAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface QuestDesignerProps {
  onExecuteAction: (action: () => void, title: string, message: string, type?: 'warning' | 'danger') => void;
  undoRedoSystem: UndoRedoSystem;
}

interface QuestNode {
  id: string;
  title: string;
  description: string;
  type: 'start' | 'story' | 'choice' | 'end';
  connections: string[];
  position: { x: number; y: number };
}

interface Quest {
  id: string;
  title: string;
  description: string;
  nodes: QuestNode[];
  tags: string[];
}

const QuestDesigner: React.FC<QuestDesignerProps> = ({ onExecuteAction, undoRedoSystem }) => {
  const [quest, setQuest] = useState<Quest>({
    id: '',
    title: '',
    description: '',
    nodes: [],
    tags: []
  });
  
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'designer' | 'list'>('designer');

  const questTemplates = [
    {
      name: 'Linear Story Arc',
      description: 'Simple story with sequential events',
      nodes: [
        { id: 'start', title: 'Beginning', type: 'start' as const, connections: ['middle'] },
        { id: 'middle', title: 'Development', type: 'story' as const, connections: ['end'] },
        { id: 'end', title: 'Resolution', type: 'end' as const, connections: [] }
      ]
    },
    {
      name: 'Choice-Driven Quest',
      description: 'Story with player choices affecting outcome',
      nodes: [
        { id: 'start', title: 'Setup', type: 'start' as const, connections: ['choice1'] },
        { id: 'choice1', title: 'First Decision', type: 'choice' as const, connections: ['path1', 'path2'] },
        { id: 'path1', title: 'Option A Result', type: 'story' as const, connections: ['end'] },
        { id: 'path2', title: 'Option B Result', type: 'story' as const, connections: ['end'] },
        { id: 'end', title: 'Conclusion', type: 'end' as const, connections: [] }
      ]
    }
  ];

  const createFromTemplate = (template: typeof questTemplates[0]) => {
    const newQuest: Quest = {
      id: `quest_${Date.now()}`,
      title: `New ${template.name}`,
      description: template.description,
      tags: [],
      nodes: template.nodes.map((node, index) => ({
        ...node,
        description: '',
        position: { x: 100 + (index * 200), y: 100 }
      }))
    };
    setQuest(newQuest);
  };

  const addNode = (type: QuestNode['type']) => {
    const newNode: QuestNode = {
      id: `node_${Date.now()}`,
      title: `New ${type}`,
      description: '',
      type,
      connections: [],
      position: { x: 100, y: 100 + (quest.nodes.length * 120) }
    };
    
    setQuest(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
  };

  const updateNode = (nodeId: string, updates: Partial<QuestNode>) => {
    setQuest(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
  };

  const deleteNode = (nodeId: string) => {
    setQuest(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId)
        .map(node => ({
          ...node,
          connections: node.connections.filter(id => id !== nodeId)
        }))
    }));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleSaveQuest = () => {
    if (!quest.title.trim() || quest.nodes.length === 0) {
      alert('Please add a quest title and at least one node');
      return;
    }

    onExecuteAction(
      () => {
        console.log('Saving quest:', quest);
        alert('Quest saved successfully! (Implementation pending)');
      },
      'Save Quest',
      `Save quest "${quest.title}"? This will add it to the game content.`,
      'warning'
    );
  };

  const renderNodeIcon = (type: QuestNode['type']) => {
    const icons = {
      start: '🚀',
      story: '📖',
      choice: '🤔',
      end: '🏁'
    };
    return icons[type];
  };

  const renderDesignerView = () => (
    <div className="flex flex-1 min-h-0">
      {/* Canvas Area */}
      <div className="flex-1 bg-gray-50 border rounded-lg relative overflow-auto">
        <div className="p-4 text-center text-gray-500">
          <div className="mb-4">
            <h4 className="font-medium mb-2">Visual Quest Designer</h4>
            <p className="text-sm">Drag nodes to arrange your quest flow</p>
          </div>
          
          {quest.nodes.length === 0 ? (
            <div className="space-y-4">
              <p>No nodes yet. Start with a template or add nodes manually.</p>
              <div className="flex justify-center gap-2">
                {questTemplates.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => createFromTemplate(template)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-left">
              {/* Simple node list for now - would be visual in full implementation */}
              <div className="space-y-3">
                {quest.nodes.map((node, index) => (
                  <div
                    key={node.id}
                    className={`p-3 bg-white border rounded-lg cursor-pointer transition-colors ${
                      selectedNode === node.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedNode(node.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{renderNodeIcon(node.type)}</span>
                        <div>
                          <div className="font-medium">{node.title}</div>
                          <div className="text-sm text-gray-500 capitalize">{node.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {node.connections.length > 0 && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            → {node.connections.length}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(node.id);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete node"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    {node.description && (
                      <p className="text-sm text-gray-600 mt-2">{node.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Node Properties Panel */}
      <div className="w-80 bg-white border-l p-4 overflow-y-auto">
        <h4 className="font-medium mb-4">Node Properties</h4>
        
        {selectedNode ? (
          <div className="space-y-4">
            {(() => {
              const node = quest.nodes.find(n => n.id === selectedNode);
              if (!node) return null;
              
              return (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Node Title
                    </label>
                    <input
                      type="text"
                      value={node.title}
                      onChange={(e) => updateNode(node.id, { title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={node.description}
                      onChange={(e) => updateNode(node.id, { description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe what happens in this node..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Node Type
                    </label>
                    <select
                      value={node.type}
                      onChange={(e) => updateNode(node.id, { type: e.target.value as QuestNode['type'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="start">Start</option>
                      <option value="story">Story Event</option>
                      <option value="choice">Player Choice</option>
                      <option value="end">End</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Connections
                    </label>
                    <div className="text-sm text-gray-600">
                      Connected to: {node.connections.length} node(s)
                    </div>
                    {/* Connection editing would be implemented here */}
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p>Select a node to edit its properties</p>
            
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium">Add New Node:</p>
              <div className="space-y-1">
                <button
                  onClick={() => addNode('start')}
                  className="w-full px-3 py-2 text-left border rounded hover:bg-gray-50 text-sm"
                >
                  🚀 Start Node
                </button>
                <button
                  onClick={() => addNode('story')}
                  className="w-full px-3 py-2 text-left border rounded hover:bg-gray-50 text-sm"
                >
                  📖 Story Event
                </button>
                <button
                  onClick={() => addNode('choice')}
                  className="w-full px-3 py-2 text-left border rounded hover:bg-gray-50 text-sm"
                >
                  🤔 Player Choice
                </button>
                <button
                  onClick={() => addNode('end')}
                  className="w-full px-3 py-2 text-left border rounded hover:bg-gray-50 text-sm"
                >
                  🏁 End Node
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Quest Designer</h3>
        <p className="text-gray-600">Create branching storylines and quest chains</p>
      </div>

      {/* Quest Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quest Title</label>
            <input
              type="text"
              value={quest.title}
              onChange={(e) => setQuest(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quest title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={quest.description}
              onChange={(e) => setQuest(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief quest description..."
            />
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Nodes: {quest.nodes.length}</span>
          <HelpTooltip content="Create quest flows by connecting story nodes. Start with a template for common patterns." />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('designer')}
            className={`px-3 py-2 text-sm rounded ${viewMode === 'designer' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Visual Designer
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 text-sm rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            List View
          </button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'designer' ? renderDesignerView() : (
        <div className="flex-1 bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-4">Quest Nodes</h4>
          {quest.nodes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No nodes created yet</p>
          ) : (
            <div className="space-y-3">
              {quest.nodes.map((node, index) => (
                <div key={node.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{renderNodeIcon(node.type)}</span>
                      <div>
                        <div className="font-medium">{node.title}</div>
                        <div className="text-sm text-gray-500">{node.type}</div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">#{index + 1}</span>
                  </div>
                  {node.description && (
                    <p className="text-sm text-gray-600 mt-2">{node.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={() => setQuest({ id: '', title: '', description: '', nodes: [], tags: [] })}
          className="px-4 py-2 text-gray-600 hover:text-gray-700"
        >
          Clear Quest
        </button>
        <button
          onClick={handleSaveQuest}
          disabled={!quest.title.trim() || quest.nodes.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          Save Quest
        </button>
      </div>
    </div>
  );
};

export default QuestDesigner;