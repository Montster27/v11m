// /Users/montysharma/V11M2/src/components/contentStudio/visualEditor/FlowNodeComponent.tsx
// Individual node component for the visual editor

import React, { useState } from 'react';
import { FlowNode } from './types';

interface FlowNodeComponentProps {
  node: FlowNode;
  isSelected: boolean;
  isConnecting: boolean;
  mode: 'storylet' | 'arc';
  onMouseDown: (event: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onConnectionStart: (choiceId?: string) => void;
  onConnectionEnd: () => void;
  onDelete: () => void;
}

const FlowNodeComponent: React.FC<FlowNodeComponentProps> = ({
  node,
  isSelected,
  isConnecting,
  mode,
  onMouseDown,
  onDoubleClick,
  onConnectionStart,
  onConnectionEnd,
  onDelete
}) => {
  const [showChoices, setShowChoices] = useState(false);

  const getNodeColor = () => {
    switch (node.type) {
      case 'start':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'end':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'storylet':
        // Color based on storylet properties if available
        if (node.storylet?.trigger.type === 'time') {
          return 'bg-purple-100 border-purple-300 text-purple-800';
        } else if (node.storylet?.trigger.type === 'flag') {
          return 'bg-yellow-100 border-yellow-300 text-yellow-800';
        } else if (node.storylet?.trigger.type === 'resource') {
          return 'bg-orange-100 border-orange-300 text-orange-800';
        }
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getNodeIcon = () => {
    switch (node.type) {
      case 'start': return '🌟';
      case 'end': return '🏁';
      case 'storylet': return '📖';
      default: return '⭕';
    }
  };

  const handleNodeClick = (event: React.MouseEvent) => {
    if (isConnecting) {
      onConnectionEnd();
    } else {
      onMouseDown(event);
    }
  };

  const handleChoiceClick = (choiceId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (mode === 'arc') {
      onConnectionStart(choiceId);
    }
  };

  const nodeWidth = mode === 'arc' ? 200 : 180;
  const nodeHeight = 120;

  return (
    <g transform={`translate(${node.position.x}, ${node.position.y})`}>
      {/* Selection indicator */}
      {isSelected && (
        <rect
          x={-5}
          y={-5}
          width={nodeWidth + 10}
          height={nodeHeight + 10}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="5,5"
          rx="8"
        />
      )}

      {/* Main node body */}
      <foreignObject width={nodeWidth} height={nodeHeight}>
        <div
          className={`w-full h-full border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${getNodeColor()} ${
            isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
          } ${isConnecting ? 'hover:ring-2 hover:ring-green-500' : ''}`}
          onMouseDown={handleNodeClick}
          onDoubleClick={onDoubleClick}
        >
          {/* Node header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getNodeIcon()}</span>
              <span className="font-semibold text-sm truncate">{node.data.title}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-red-500 hover:text-red-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>

          {/* Node content */}
          <div className="text-xs opacity-75 mb-2 line-clamp-2">
            {node.data.content}
          </div>

          {/* Node type specific content */}
          {node.type === 'storylet' && node.storylet && (
            <div className="space-y-1">
              {/* Story arc indicator */}
              {node.storylet.storyArc && (
                <div className="text-xs bg-black bg-opacity-10 rounded px-1 inline-block">
                  Arc: {node.storylet.storyArc}
                </div>
              )}

              {/* Choices (for arc mode) */}
              {mode === 'arc' && node.storylet.choices && node.storylet.choices.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChoices(!showChoices);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showChoices ? '▼' : '▶'} {node.storylet.choices.length} choices
                  </button>
                  
                  {showChoices && (
                    <div className="mt-1 space-y-1 max-h-20 overflow-y-auto">
                      {node.storylet.choices.map((choice, index) => (
                        <div
                          key={choice.id || index}
                          className="text-xs bg-white bg-opacity-50 rounded px-1 py-0.5 cursor-pointer hover:bg-opacity-75 flex items-center justify-between"
                          onClick={(e) => handleChoiceClick(choice.id || `choice_${index}`, e)}
                        >
                          <span className="truncate flex-1">{choice.text}</span>
                          <span className="text-blue-600 ml-1">→</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Connection points for arc mode */}
              {mode === 'arc' && node.connectionPoints && (
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-600">
                    {node.connectionPoints.filter(cp => cp.isConnected).length}/{node.connectionPoints.length} connected
                  </div>
                  <div className="text-xs text-blue-600">
                    Shift+Click to connect
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Effects indicator */}
          {node.data.effects && node.data.effects.length > 0 && (
            <div className="text-xs mt-1 opacity-75">
              ⚡ {node.data.effects.length} effects
            </div>
          )}
        </div>
      </foreignObject>

      {/* Connection points for arc mode */}
      {mode === 'arc' && (
        <>
          {/* Input connection point */}
          <circle
            cx={-8}
            cy={nodeHeight / 2}
            r="6"
            fill="#10b981"
            stroke="#065f46"
            strokeWidth="2"
            className="cursor-pointer hover:r-8 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              if (isConnecting) {
                onConnectionEnd();
              }
            }}
          />
          
          {/* Output connection point */}
          <circle
            cx={nodeWidth + 8}
            cy={nodeHeight / 2}
            r="6"
            fill="#3b82f6"
            stroke="#1e40af"
            strokeWidth="2"
            className="cursor-pointer hover:r-8 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onConnectionStart();
            }}
          />
        </>
      )}

      {/* Node ID for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <text
          x={nodeWidth / 2}
          y={nodeHeight + 15}
          textAnchor="middle"
          className="text-xs fill-gray-400 font-mono"
        >
          {node.id}
        </text>
      )}
    </g>
  );
};

export default FlowNodeComponent;