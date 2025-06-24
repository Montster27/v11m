// /Users/montysharma/V11M2/src/components/contentStudio/visualEditor/NodePalette.tsx
// Node palette component for dragging nodes onto the canvas

import React from 'react';
import { useStoryletStore } from '../../../store/useStoryletStore';
import { NodeType, FlowNode } from './types';
import type { Storylet } from '../../../types/storylet';

interface NodePaletteProps {
  mode: 'storylet' | 'arc';
  onDragStart: (nodeType: NodeType | Storylet, event: React.DragEvent) => void;
  onCreateNewStorylet: () => void;
}

const getStoryletNodeConfig = (storylet: Storylet): NodeType => {
  // Determine node color based on storylet properties
  let color = 'bg-blue-100 border-blue-300 text-blue-800'; // default
  
  if (storylet.trigger.type === 'time') {
    color = 'bg-purple-100 border-purple-300 text-purple-800';
  } else if (storylet.trigger.type === 'flag') {
    color = 'bg-yellow-100 border-yellow-300 text-yellow-800';
  } else if (storylet.trigger.type === 'resource') {
    color = 'bg-orange-100 border-orange-300 text-orange-800';
  }
  
  return {
    type: 'storylet',
    label: storylet.name,
    icon: '📖',
    color,
    description: storylet.description || 'Storylet node'
  };
};

const NodePalette: React.FC<NodePaletteProps> = ({
  mode,
  onDragStart,
  onCreateNewStorylet
}) => {
  const { allStorylets } = useStoryletStore();

  // Base node types for arc mode
  const baseNodeTypes: NodeType[] = [
    { 
      type: 'start', 
      label: 'Start Point', 
      icon: '🌟', 
      color: 'bg-green-100 border-green-300 text-green-800',
      description: 'Starting point for the story arc'
    },
    { 
      type: 'end', 
      label: 'End Point', 
      icon: '🏁', 
      color: 'bg-red-100 border-red-300 text-red-800',
      description: 'Ending point for the story arc'
    }
  ];

  // Storylet templates for storylet mode
  const storyletTemplates: NodeType[] = [
    {
      type: 'basic',
      label: 'Basic Storylet',
      icon: '📝',
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      description: 'Simple storylet with text and single choice'
    },
    {
      type: 'choice_hub',
      label: 'Choice Hub',
      icon: '🔀',
      color: 'bg-green-100 border-green-300 text-green-800',
      description: 'Storylet with multiple branching choices'
    },
    {
      type: 'skill_check',
      label: 'Skill Check',
      icon: '🎲',
      color: 'bg-orange-100 border-orange-300 text-orange-800',
      description: 'Storylet with success/failure outcomes'
    },
    {
      type: 'branch_point',
      label: 'Branch Point',
      icon: '🌿',
      color: 'bg-purple-100 border-purple-300 text-purple-800',
      description: 'Decision point that splits the story'
    }
  ];

  const handleDragStart = (item: NodeType | Storylet, event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = 'copy';
    onDragStart(item, event);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 h-full overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        {mode === 'arc' ? 'Arc Components' : 'Storylet Templates'}
      </h3>

      {mode === 'arc' ? (
        <div className="space-y-4">
          {/* Base node types for arc building */}
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
              Arc Nodes
            </h4>
            <div className="space-y-2">
              {baseNodeTypes.map((nodeType) => (
                <div
                  key={nodeType.type}
                  draggable
                  onDragStart={(e) => handleDragStart(nodeType, e)}
                  className={`p-3 border-2 border-dashed rounded-lg cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${nodeType.color}`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{nodeType.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{nodeType.label}</div>
                      <div className="text-xs opacity-75">{nodeType.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Existing storylets for arc building */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Storylets ({Object.keys(allStorylets).length})
              </h4>
              <button
                onClick={onCreateNewStorylet}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                + Create New
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.values(allStorylets).map((storylet) => {
                const config = getStoryletNodeConfig(storylet);
                return (
                  <div
                    key={storylet.id}
                    draggable
                    onDragStart={(e) => handleDragStart(storylet, e)}
                    className={`p-2 border rounded cursor-grab active:cursor-grabbing transition-all hover:shadow-sm ${config.color}`}
                  >
                    <div className="flex items-start space-x-2">
                      <span className="text-sm">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs truncate">{storylet.name}</div>
                        <div className="text-xs opacity-75 line-clamp-2">{storylet.description}</div>
                        {storylet.storyArc && (
                          <div className="text-xs bg-black bg-opacity-10 rounded px-1 mt-1 inline-block">
                            {storylet.storyArc}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Storylet creation templates */}
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
              Templates
            </h4>
            <div className="space-y-2">
              {storyletTemplates.map((template) => (
                <div
                  key={template.type}
                  draggable
                  onDragStart={(e) => handleDragStart(template, e)}
                  className={`p-3 border-2 border-dashed rounded-lg cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${template.color}`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{template.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{template.label}</div>
                      <div className="text-xs opacity-75">{template.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
              Quick Actions
            </h4>
            <button
              onClick={onCreateNewStorylet}
              className="w-full p-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 transition-all"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">➕</span>
                <span className="font-medium text-sm">Create Blank Storylet</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Mode-specific tips */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {mode === 'arc' ? (
            <>
              <div className="font-medium mb-1">💡 Arc Building Tips:</div>
              <ul className="space-y-1 text-xs">
                <li>• Drag storylets from the list to build your arc</li>
                <li>• Use start/end points to define arc boundaries</li>
                <li>• Connect storylets via choice options</li>
              </ul>
            </>
          ) : (
            <>
              <div className="font-medium mb-1">💡 Storylet Creation Tips:</div>
              <ul className="space-y-1 text-xs">
                <li>• Drag templates to start with pre-configured storylets</li>
                <li>• Connect choices to create branching narratives</li>
                <li>• Use different templates for different story patterns</li>
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodePalette;