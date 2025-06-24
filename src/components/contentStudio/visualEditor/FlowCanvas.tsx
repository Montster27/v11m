// /Users/montysharma/V11M2/src/components/contentStudio/visualEditor/FlowCanvas.tsx
// Main canvas component for visual editing with nodes and connections

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { FlowNode, FlowConnection, CanvasState, NodeType } from './types';
import type { Storylet } from '../../../types/storylet';
import FlowNodeComponent from './FlowNodeComponent';
import ConnectionLine from './ConnectionLine';

interface FlowCanvasProps {
  nodes: FlowNode[];
  connections: FlowConnection[];
  canvasState: CanvasState;
  onCanvasStateChange: (state: Partial<CanvasState>) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeSelect: (nodeId: string, multi?: boolean) => void;
  onNodeEdit: (node: FlowNode) => void;
  onNodeDelete: (nodeId: string) => void;
  onConnectionCreate: (from: string, to: string, fromChoiceId?: string) => void;
  onConnectionDelete: (connectionId: string) => void;
  onDrop: (item: NodeType | Storylet, position: { x: number; y: number }) => void;
  showGrid?: boolean;
  mode: 'storylet' | 'arc';
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  connections,
  canvasState,
  onCanvasStateChange,
  onNodeMove,
  onNodeSelect,
  onNodeEdit,
  onNodeDelete,
  onConnectionCreate,
  onConnectionDelete,
  onDrop,
  showGrid = true,
  mode
}) => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempConnection, setTempConnection] = useState<{ from: string; to: { x: number; y: number } } | null>(null);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: screenX, y: screenY };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (screenX - rect.left - canvasState.pan.x) / canvasState.zoom;
    const y = (screenY - rect.top - canvasState.pan.y) / canvasState.zoom;
    return { x, y };
  }, [canvasState.zoom, canvasState.pan]);

  // Handle canvas drag/pan
  const handleCanvasMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button === 1 || (event.button === 0 && event.ctrlKey)) {
      // Middle mouse or Ctrl+click for panning
      event.preventDefault();
      onCanvasStateChange({
        isDragging: true,
        dragStart: { x: event.clientX - canvasState.pan.x, y: event.clientY - canvasState.pan.y }
      });
    } else if (event.button === 0 && event.target === canvasRef.current) {
      // Left click on empty canvas - clear selection
      onCanvasStateChange({ selectedNodes: new Set(), selectedConnections: new Set() });
    }
  }, [canvasState.pan, onCanvasStateChange]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent) => {
    if (canvasState.isDragging && canvasState.dragStart) {
      // Canvas panning
      const newPan = {
        x: event.clientX - canvasState.dragStart.x,
        y: event.clientY - canvasState.dragStart.y
      };
      onCanvasStateChange({ pan: newPan });
    }
    
    if (draggedNode) {
      // Node dragging
      const canvasPos = screenToCanvas(event.clientX - dragOffset.x, event.clientY - dragOffset.y);
      onNodeMove(draggedNode, canvasPos);
    }

    if (canvasState.isConnecting && canvasState.connectionStart) {
      // Update temporary connection line
      const canvasPos = screenToCanvas(event.clientX, event.clientY);
      setTempConnection({
        from: canvasState.connectionStart,
        to: canvasPos
      });
    }
  }, [canvasState.isDragging, canvasState.dragStart, canvasState.isConnecting, canvasState.connectionStart, draggedNode, dragOffset, screenToCanvas, onCanvasStateChange, onNodeMove]);

  const handleCanvasMouseUp = useCallback(() => {
    onCanvasStateChange({ isDragging: false, dragStart: null });
    setDraggedNode(null);
    setDragOffset({ x: 0, y: 0 });
    
    if (canvasState.isConnecting) {
      onCanvasStateChange({ isConnecting: false, connectionStart: null });
      setTempConnection(null);
    }
  }, [canvasState.isConnecting, onCanvasStateChange]);

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (event.ctrlKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(3, canvasState.zoom * delta));
      onCanvasStateChange({ zoom: newZoom });
    }
  }, [canvasState.zoom, onCanvasStateChange]);

  // Handle drag and drop from palette
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('application/json');
    if (data) {
      try {
        const item = JSON.parse(data);
        const canvasPos = screenToCanvas(event.clientX, event.clientY);
        onDrop(item, canvasPos);
      } catch (error) {
        console.warn('Invalid drop data:', error);
      }
    }
  }, [screenToCanvas, onDrop]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  // Node event handlers
  const handleNodeMouseDown = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (event.shiftKey && mode === 'arc') {
      // Start connection mode in arc mode
      onCanvasStateChange({ 
        isConnecting: true, 
        connectionStart: nodeId,
        connectionStartChoice: undefined // Will be set by choice selection
      });
    } else {
      // Start node dragging
      setDraggedNode(nodeId);
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        const canvasPos = screenToCanvas(event.clientX, event.clientY);
        setDragOffset({
          x: canvasPos.x - node.position.x,
          y: canvasPos.y - node.position.y
        });
      }
      
      // Handle selection
      const isMultiSelect = event.ctrlKey || event.metaKey;
      onNodeSelect(nodeId, isMultiSelect);
    }
  }, [mode, nodes, screenToCanvas, onCanvasStateChange, onNodeSelect]);

  const handleNodeDoubleClick = useCallback((node: FlowNode) => {
    onNodeEdit(node);
  }, [onNodeEdit]);

  const handleConnectionStart = useCallback((fromNodeId: string, choiceId?: string) => {
    onCanvasStateChange({ 
      isConnecting: true, 
      connectionStart: fromNodeId,
      connectionStartChoice: choiceId
    });
  }, [onCanvasStateChange]);

  const handleConnectionEnd = useCallback((toNodeId: string) => {
    if (canvasState.connectionStart && canvasState.connectionStart !== toNodeId) {
      onConnectionCreate(
        canvasState.connectionStart, 
        toNodeId, 
        canvasState.connectionStartChoice
      );
    }
    onCanvasStateChange({ isConnecting: false, connectionStart: null, connectionStartChoice: undefined });
    setTempConnection(null);
  }, [canvasState.connectionStart, canvasState.connectionStartChoice, onConnectionCreate, onCanvasStateChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Delete selected nodes and connections
        canvasState.selectedNodes.forEach(nodeId => onNodeDelete(nodeId));
        canvasState.selectedConnections.forEach(connectionId => onConnectionDelete(connectionId));
      }
      
      if (event.key === 'Escape') {
        // Cancel current operation
        onCanvasStateChange({ 
          isConnecting: false, 
          connectionStart: null,
          selectedNodes: new Set(),
          selectedConnections: new Set()
        });
        setTempConnection(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasState.selectedNodes, canvasState.selectedConnections, onNodeDelete, onConnectionDelete, onCanvasStateChange]);

  // Grid pattern
  const gridPattern = showGrid ? (
    <defs>
      <pattern
        id="grid"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
        patternTransform={`scale(${canvasState.zoom})`}
      >
        <path
          d="M 20 0 L 0 0 0 20"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
          opacity="0.5"
        />
      </pattern>
    </defs>
  ) : null;

  return (
    <div className="relative w-full h-full bg-gray-50 overflow-hidden">
      <svg
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onWheel={handleWheel}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {gridPattern}
        
        {/* Grid background */}
        {showGrid && (
          <rect
            x={-canvasState.pan.x / canvasState.zoom}
            y={-canvasState.pan.y / canvasState.zoom}
            width="100%"
            height="100%"
            fill="url(#grid)"
          />
        )}
        
        {/* Transform group for zoom and pan */}
        <g transform={`translate(${canvasState.pan.x}, ${canvasState.pan.y}) scale(${canvasState.zoom})`}>
          {/* Connections */}
          {connections.map(connection => (
            <ConnectionLine
              key={connection.id}
              connection={connection}
              nodes={nodes}
              isSelected={canvasState.selectedConnections.has(connection.id)}
              onSelect={() => {
                const newSelected = new Set(canvasState.selectedConnections);
                if (newSelected.has(connection.id)) {
                  newSelected.delete(connection.id);
                } else {
                  newSelected.add(connection.id);
                }
                onCanvasStateChange({ selectedConnections: newSelected });
              }}
              onDelete={() => onConnectionDelete(connection.id)}
            />
          ))}
          
          {/* Temporary connection line */}
          {tempConnection && (
            <line
              x1={nodes.find(n => n.id === tempConnection.from)?.position.x || 0}
              y1={nodes.find(n => n.id === tempConnection.from)?.position.y || 0}
              x2={tempConnection.to.x}
              y2={tempConnection.to.y}
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.7"
            />
          )}
          
          {/* Nodes */}
          {nodes.map(node => (
            <FlowNodeComponent
              key={node.id}
              node={node}
              isSelected={canvasState.selectedNodes.has(node.id)}
              isConnecting={canvasState.isConnecting}
              mode={mode}
              onMouseDown={(event) => handleNodeMouseDown(node.id, event)}
              onDoubleClick={() => handleNodeDoubleClick(node)}
              onConnectionStart={(choiceId) => handleConnectionStart(node.id, choiceId)}
              onConnectionEnd={() => handleConnectionEnd(node.id)}
              onDelete={() => onNodeDelete(node.id)}
            />
          ))}
        </g>
      </svg>
      
      {/* Canvas overlay for connection mode */}
      {canvasState.isConnecting && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-lg border border-blue-200">
          <div className="text-sm font-medium">Connection Mode</div>
          <div className="text-xs">Click on a target node to create connection</div>
          <div className="text-xs text-blue-600">Press Escape to cancel</div>
        </div>
      )}
    </div>
  );
};

export default FlowCanvas;