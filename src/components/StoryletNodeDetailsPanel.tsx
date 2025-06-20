// /Users/montysharma/V11M2/src/components/StoryletNodeDetailsPanel.tsx
import React from 'react';
import { Card } from './ui';
import { Node, Edge } from '../utils/storyArcGraphBuilder';

// Helper function to safely render condition values
const formatConditionValue = (value: any): string => {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    // Handle operator objects like {greater_equal: 5}
    const entries = Object.entries(value);
    if (entries.length === 1) {
      const [operator, operatorValue] = entries[0];
      switch (operator) {
        case 'greater_equal':
          return `≥${operatorValue}`;
        case 'greater_than':
          return `>${operatorValue}`;
        case 'less_equal':
          return `≤${operatorValue}`;
        case 'less_than':
          return `<${operatorValue}`;
        case 'equals':
          return `=${operatorValue}`;
        case 'not_equals':
          return `≠${operatorValue}`;
        default:
          return JSON.stringify(value);
      }
    }
    return JSON.stringify(value);
  }
  return String(value);
};

interface StoryletNodeDetailsPanelProps {
  selectedNode: string | null;
  nodes: Node[];
  edges: Edge[];
}

export const StoryletNodeDetailsPanel: React.FC<StoryletNodeDetailsPanelProps> = ({
  selectedNode,
  nodes,
  edges
}) => {
  if (!selectedNode) return null;

  const node = nodes.find(n => n.id === selectedNode);
  if (!node) return null;

  return (
    <div className="w-[480px] space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold text-lg mb-2">{node.storylet.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{node.storylet.description}</p>
        
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-700">Trigger:</span>
            <div className="text-sm text-gray-600">
              {node.storylet.trigger.type}
              {node.storylet.trigger.type === 'flag' && (
                <div className="ml-2 text-xs">
                  Requires: {formatConditionValue(node.storylet.trigger.conditions.flags) || 'none'}
                </div>
              )}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">Choices:</span>
            <div className="space-y-2 mt-1">
              {node.storylet.choices.map(choice => (
                <div key={choice.id} className="text-sm border-l-2 border-blue-200 pl-2">
                  <div className="font-medium text-blue-700">{choice.text}</div>
                  {choice.effects.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Effects: {choice.effects.map(effect => {
                        if (effect.type === 'flag') {
                          return `${effect.key}=${effect.value}`;
                        } else if (effect.type === 'resource') {
                          return `${effect.key}${effect.delta > 0 ? '+' : ''}${effect.delta}`;
                        }
                        return effect.type;
                      }).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Connected storylets */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-2">Connected Storylets</h4>
        <div className="space-y-2">
          {edges
            .filter(edge => edge.from === selectedNode)
            .map(edge => {
              const targetNode = nodes.find(n => n.id === edge.to);
              return targetNode ? (
                <div key={edge.to} className="text-sm">
                  <div className="font-medium text-green-700">→ {targetNode.storylet.name}</div>
                  <div className="text-xs text-gray-500">via "{edge.choiceText}"</div>
                </div>
              ) : null;
            })}
          {edges.filter(edge => edge.from === selectedNode).length === 0 && (
            <div className="text-sm text-gray-500">No outgoing connections</div>
          )}
        </div>
      </Card>
    </div>
  );
};