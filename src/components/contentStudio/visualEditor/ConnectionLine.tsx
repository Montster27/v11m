// /Users/montysharma/V11M2/src/components/contentStudio/visualEditor/ConnectionLine.tsx
// Connection line component for visual relationships between nodes

import React from 'react';
import { FlowConnection, FlowNode } from './types';

interface ConnectionLineProps {
  connection: FlowConnection;
  nodes: FlowNode[];
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  nodes,
  isSelected,
  onSelect,
  onDelete
}) => {
  const fromNode = nodes.find(n => n.id === connection.from);
  const toNode = nodes.find(n => n.id === connection.to);

  if (!fromNode || !toNode) {
    return null;
  }

  // Calculate connection points
  const fromX = fromNode.position.x + 200; // Right side of node
  const fromY = fromNode.position.y + 60;  // Middle of node
  const toX = toNode.position.x;           // Left side of node
  const toY = toNode.position.y + 60;      // Middle of node

  // Calculate control points for curved line
  const controlPoint1X = fromX + Math.abs(toX - fromX) * 0.5;
  const controlPoint1Y = fromY;
  const controlPoint2X = toX - Math.abs(toX - fromX) * 0.5;
  const controlPoint2Y = toY;

  // Create curved path
  const pathData = `M ${fromX} ${fromY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toX} ${toY}`;

  // Calculate midpoint for label placement
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;

  // Arrow marker
  const arrowId = `arrow-${connection.id}`;

  return (
    <g>
      {/* Arrow marker definition */}
      <defs>
        <marker
          id={arrowId}
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill={isSelected ? "#ef4444" : "#6b7280"}
          />
        </marker>
      </defs>

      {/* Main connection path */}
      <path
        d={pathData}
        stroke={isSelected ? "#ef4444" : "#6b7280"}
        strokeWidth={isSelected ? "3" : "2"}
        fill="none"
        markerEnd={`url(#${arrowId})`}
        className="cursor-pointer hover:stroke-blue-500 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      />

      {/* Invisible wider path for easier clicking */}
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      />

      {/* Connection label */}
      {connection.label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x="-30"
            y="-8"
            width="60"
            height="16"
            fill="white"
            stroke="#d1d5db"
            strokeWidth="1"
            rx="3"
            className="opacity-90"
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-700 pointer-events-none"
          >
            {connection.label}
          </text>
        </g>
      )}

      {/* Choice text label */}
      {connection.choiceText && (
        <g transform={`translate(${midX}, ${midY + 20})`}>
          <rect
            x="-40"
            y="-6"
            width="80"
            height="12"
            fill="#dbeafe"
            stroke="#3b82f6"
            strokeWidth="1"
            rx="2"
            className="opacity-90"
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-blue-700 pointer-events-none"
          >
            "{connection.choiceText}"
          </text>
        </g>
      )}

      {/* Delete button when selected */}
      {isSelected && (
        <g transform={`translate(${midX + 35}, ${midY - 10})`}>
          <circle
            r="8"
            fill="#ef4444"
            stroke="white"
            strokeWidth="2"
            className="cursor-pointer hover:fill-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-white pointer-events-none font-bold"
          >
            ×
          </text>
        </g>
      )}

      {/* Connection info for debugging */}
      {process.env.NODE_ENV === 'development' && isSelected && (
        <g transform={`translate(${midX}, ${midY - 30})`}>
          <rect
            x="-35"
            y="-8"
            width="70"
            height="16"
            fill="black"
            fillOpacity="0.8"
            rx="3"
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-white font-mono"
          >
            {connection.id}
          </text>
        </g>
      )}
    </g>
  );
};

export default ConnectionLine;