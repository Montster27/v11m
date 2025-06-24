// /Users/montysharma/V11M2/src/components/contentStudio/VisualStoryletEditorRefactored.tsx
// Refactored Visual Storylet Editor with complete arc functionality preservation

import React, { useState, useCallback, useEffect } from 'react';
import { useStoryletStore } from '../../store/useStoryletStore';
import type { Storylet } from '../../types/storylet';

// Shared foundation imports
import BaseStudioComponent from './shared/BaseStudioComponent';
import { useStudioPersistence } from './shared/useStudioPersistence';

// Visual editor components
import EditorModeSelector from './visualEditor/EditorModeSelector';
import NodePalette from './visualEditor/NodePalette';
import CanvasControls from './visualEditor/CanvasControls';
import FlowCanvas from './visualEditor/FlowCanvas';
import ArcExportImport from './visualEditor/ArcExportImport';

// Types
import {
  UndoRedoSystem,
  FlowNode,
  FlowConnection,
  StoryArc,
  CanvasState,
  EditorMode,
  NodeType
} from './visualEditor/types';

interface VisualStoryletEditorProps {
  undoRedoSystem: UndoRedoSystem;
  onSave?: (flowData: { nodes: FlowNode[]; connections: FlowConnection[] }) => void;
  editingStorylet?: Storylet | null;
  onStoryletSaved?: () => void;
  mode?: 'storylet' | 'arc'; // Initial mode
  editingArc?: StoryArc | null; // Arc being edited
  onArcSaved?: (arc: StoryArc) => void; // Arc save callback
}

const VisualStoryletEditorRefactored: React.FC<VisualStoryletEditorProps> = ({
  undoRedoSystem,
  onSave,
  editingStorylet,
  onStoryletSaved,
  mode: initialMode = 'storylet',
  editingArc,
  onArcSaved
}) => {
  // Store access
  const { addStorylet, updateStorylet, allStorylets, storyArcs } = useStoryletStore();

  // Editor state
  const [currentMode, setCurrentMode] = useState<'storylet' | 'arc'>(initialMode);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<FlowConnection[]>([]);
  const [savedArcs, setSavedArcs] = useState<StoryArc[]>([]);
  const [currentArc, setCurrentArc] = useState<StoryArc | null>(editingArc || null);
  const [showGrid, setShowGrid] = useState(true);

  // Canvas state
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    isDragging: false,
    dragStart: null,
    selectedNodes: new Set(),
    selectedConnections: new Set(),
    isConnecting: false,
    connectionStart: null
  });

  // Editor mode configuration
  const editorMode: EditorMode = {
    current: currentMode,
    availableModes: [
      {
        id: 'storylet',
        label: 'Storylet Creator',
        description: 'Create individual storylets with choices and effects',
        icon: '📖'
      },
      {
        id: 'arc',
        label: 'Arc Builder',
        description: 'Build story arcs by connecting multiple storylets',
        icon: '🌉'
      }
    ]
  };

  // Persistence for auto-save
  const persistence = useStudioPersistence({ nodes, connections, currentArc }, {
    storageKey: `visual_editor_${currentMode}`,
    autoSaveEnabled: true,
    onAutoSave: (data) => {
      console.log(`Auto-saved ${currentMode} editor state`);
    }
  });

  // Initialize from editing storylet or arc
  useEffect(() => {
    if (editingStorylet && currentMode === 'storylet') {
      // Convert storylet to visual flow
      const storyletNode: FlowNode = {
        id: editingStorylet.id,
        type: 'storylet',
        position: { x: 100, y: 100 },
        data: {
          title: editingStorylet.name,
          content: editingStorylet.description
        },
        connections: [],
        storyletId: editingStorylet.id,
        storylet: editingStorylet
      };
      setNodes([storyletNode]);
      setConnections([]);
    } else if (editingArc && currentMode === 'arc') {
      setCurrentArc(editingArc);
      setNodes(editingArc.nodes);
      setConnections(editingArc.connections);
    }
  }, [editingStorylet, editingArc, currentMode]);

  // Mode change handler
  const handleModeChange = useCallback((newMode: 'storylet' | 'arc') => {
    if (newMode !== currentMode) {
      // Save current state before switching
      if (onSave) {
        onSave({ nodes, connections });
      }
      
      setCurrentMode(newMode);
      
      // Clear canvas when switching modes
      setNodes([]);
      setConnections([]);
      setCanvasState(prev => ({
        ...prev,
        selectedNodes: new Set(),
        selectedConnections: new Set(),
        isConnecting: false,
        connectionStart: null
      }));
    }
  }, [currentMode, nodes, connections, onSave]);

  // Node management
  const generateNodeId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleNodeDrop = useCallback((item: NodeType | Storylet, position: { x: number; y: number }) => {
    let newNode: FlowNode;

    if ('trigger' in item) {
      // Dropped a storylet
      const storylet = item as Storylet;
      newNode = {
        id: generateNodeId(),
        type: 'storylet',
        position,
        data: {
          title: storylet.name,
          content: storylet.description
        },
        connections: [],
        storyletId: storylet.id,
        storylet,
        connectionPoints: storylet.choices?.map((choice, index) => ({
          choiceId: choice.id || `choice_${index}`,
          choiceText: choice.text,
          isConnected: false
        }))
      };
    } else {
      // Dropped a node type
      const nodeType = item as NodeType;
      newNode = {
        id: generateNodeId(),
        type: nodeType.type as 'storylet' | 'start' | 'end',
        position,
        data: {
          title: nodeType.label,
          content: nodeType.description
        },
        connections: []
      };
    }

    setNodes(prev => [...prev, newNode]);
    persistence.markDirty();
  }, [persistence]);

  const handleNodeMove = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, position } : node
    ));
    persistence.markDirty();
  }, [persistence]);

  const handleNodeSelect = useCallback((nodeId: string, multi = false) => {
    setCanvasState(prev => {
      const newSelected = new Set(prev.selectedNodes);
      
      if (multi) {
        if (newSelected.has(nodeId)) {
          newSelected.delete(nodeId);
        } else {
          newSelected.add(nodeId);
        }
      } else {
        newSelected.clear();
        newSelected.add(nodeId);
      }
      
      return { ...prev, selectedNodes: newSelected, selectedConnections: new Set() };
    });
  }, []);

  const handleNodeEdit = useCallback((node: FlowNode) => {
    // Open node editing modal
    console.log('Editing node:', node);
    // This would open a modal for editing node properties
  }, []);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => conn.from !== nodeId && conn.to !== nodeId));
    setCanvasState(prev => {
      const newSelected = new Set(prev.selectedNodes);
      newSelected.delete(nodeId);
      return { ...prev, selectedNodes: newSelected };
    });
    persistence.markDirty();
  }, [persistence]);

  // Connection management
  const generateConnectionId = () => `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleConnectionCreate = useCallback((from: string, to: string, fromChoiceId?: string) => {
    // Check if connection already exists
    const existingConnection = connections.find(conn => 
      conn.from === from && conn.to === to && conn.fromChoiceId === fromChoiceId
    );
    
    if (existingConnection) return;

    const fromNode = nodes.find(n => n.id === from);
    let choiceText = '';
    
    if (fromChoiceId && fromNode?.storylet?.choices) {
      const choice = fromNode.storylet.choices.find(c => c.id === fromChoiceId);
      choiceText = choice?.text || '';
    }

    const newConnection: FlowConnection = {
      id: generateConnectionId(),
      from,
      to,
      fromChoiceId,
      choiceText,
      label: currentMode === 'arc' ? 'Arc Connection' : 'Choice Flow'
    };

    setConnections(prev => [...prev, newConnection]);

    // Update connection points
    if (fromChoiceId && fromNode?.connectionPoints) {
      setNodes(prev => prev.map(node => {
        if (node.id === from && node.connectionPoints) {
          return {
            ...node,
            connectionPoints: node.connectionPoints.map(cp =>
              cp.choiceId === fromChoiceId ? { ...cp, isConnected: true } : cp
            )
          };
        }
        return node;
      }));
    }

    persistence.markDirty();
  }, [connections, nodes, currentMode, persistence]);

  const handleConnectionDelete = useCallback((connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    
    // Update connection points if it was a choice connection
    if (connection?.fromChoiceId) {
      setNodes(prev => prev.map(node => {
        if (node.id === connection.from && node.connectionPoints) {
          return {
            ...node,
            connectionPoints: node.connectionPoints.map(cp =>
              cp.choiceId === connection.fromChoiceId ? { ...cp, isConnected: false } : cp
            )
          };
        }
        return node;
      }));
    }
    
    persistence.markDirty();
  }, [connections, persistence]);

  // Canvas controls
  const handleCanvasStateChange = useCallback((updates: Partial<CanvasState>) => {
    setCanvasState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setCanvasState(prev => ({ ...prev, zoom }));
  }, []);

  const handleZoomFit = useCallback(() => {
    if (nodes.length === 0) return;
    
    // Calculate bounding box
    const minX = Math.min(...nodes.map(n => n.position.x));
    const maxX = Math.max(...nodes.map(n => n.position.x));
    const minY = Math.min(...nodes.map(n => n.position.y));
    const maxY = Math.max(...nodes.map(n => n.position.y));
    
    const width = maxX - minX + 400; // Add padding
    const height = maxY - minY + 200;
    
    // Calculate zoom to fit
    const canvasWidth = 800; // Approximate canvas width
    const canvasHeight = 600; // Approximate canvas height
    const zoomX = canvasWidth / width;
    const zoomY = canvasHeight / height;
    const newZoom = Math.min(zoomX, zoomY, 1);
    
    // Center the content
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const newPanX = canvasWidth / 2 - centerX * newZoom;
    const newPanY = canvasHeight / 2 - centerY * newZoom;
    
    setCanvasState(prev => ({
      ...prev,
      zoom: newZoom,
      pan: { x: newPanX, y: newPanY }
    }));
  }, [nodes]);

  const handleZoomReset = useCallback(() => {
    setCanvasState(prev => ({ ...prev, zoom: 1 }));
  }, []);

  const handleCenterCanvas = useCallback(() => {
    setCanvasState(prev => ({ ...prev, pan: { x: 0, y: 0 } }));
  }, []);

  const handleClearCanvas = useCallback(() => {
    if (window.confirm('Clear all nodes and connections? This cannot be undone.')) {
      setNodes([]);
      setConnections([]);
      setCanvasState(prev => ({
        ...prev,
        selectedNodes: new Set(),
        selectedConnections: new Set(),
        isConnecting: false,
        connectionStart: null
      }));
      persistence.markDirty();
    }
  }, [persistence]);

  // Arc management
  const handleArcSave = useCallback((arc: StoryArc) => {
    setSavedArcs(prev => {
      const existing = prev.findIndex(a => a.id === arc.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = arc;
        return updated;
      }
      return [...prev, arc];
    });
    
    if (onArcSaved) {
      onArcSaved(arc);
    }
  }, [onArcSaved]);

  const handleArcLoad = useCallback((arcId: string) => {
    const arc = savedArcs.find(a => a.id === arcId);
    if (arc) {
      setCurrentArc(arc);
      setNodes(arc.nodes);
      setConnections(arc.connections);
    }
  }, [savedArcs]);

  const handleCreateNewStorylet = useCallback(() => {
    // This would open the AdvancedStoryletCreator
    console.log('Creating new storylet...');
  }, []);

  return (
    <BaseStudioComponent
      title={`Visual ${currentMode === 'arc' ? 'Arc Builder' : 'Storylet Editor'}`}
      helpText={`${currentMode === 'arc' ? 'Build story arcs by connecting storylets' : 'Create storylets visually with drag-and-drop'}`}
      undoRedoSystem={undoRedoSystem}
      headerActions={
        <div className="flex items-center space-x-3">
          {persistence.isDirty && (
            <span className="text-xs text-orange-600">Unsaved changes</span>
          )}
          <button
            onClick={() => {
              if (onSave) {
                onSave({ nodes, connections });
              }
              if (onStoryletSaved) {
                onStoryletSaved();
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {currentMode === 'arc' ? 'Save Arc' : 'Save Flow'}
          </button>
        </div>
      }
    >
      <div className="h-[800px] flex gap-4">
        {/* Left Sidebar */}
        <div className="w-64 space-y-4 overflow-y-auto">
          <EditorModeSelector
            mode={editorMode}
            onModeChange={handleModeChange}
          />
          
          <NodePalette
            mode={currentMode}
            onDragStart={(item, event) => {
              event.dataTransfer.setData('application/json', JSON.stringify(item));
            }}
            onCreateNewStorylet={handleCreateNewStorylet}
          />
          
          {currentMode === 'arc' && (
            <ArcExportImport
              currentArc={currentArc}
              onImport={(arc) => {
                setCurrentArc(arc);
                setNodes(arc.nodes);
                setConnections(arc.connections);
              }}
              onExport={() => {}}
              onSaveArc={handleArcSave}
              onLoadArc={handleArcLoad}
              savedArcs={savedArcs}
            />
          )}
        </div>

        {/* Main Canvas */}
        <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
          <FlowCanvas
            nodes={nodes}
            connections={connections}
            canvasState={canvasState}
            onCanvasStateChange={handleCanvasStateChange}
            onNodeMove={handleNodeMove}
            onNodeSelect={handleNodeSelect}
            onNodeEdit={handleNodeEdit}
            onNodeDelete={handleNodeDelete}
            onConnectionCreate={handleConnectionCreate}
            onConnectionDelete={handleConnectionDelete}
            onDrop={handleNodeDrop}
            showGrid={showGrid}
            mode={currentMode}
          />
        </div>

        {/* Right Sidebar */}
        <div className="w-64 space-y-4">
          <CanvasControls
            canvasState={canvasState}
            onZoomChange={handleZoomChange}
            onZoomFit={handleZoomFit}
            onZoomReset={handleZoomReset}
            onCenterCanvas={handleCenterCanvas}
            onClearCanvas={handleClearCanvas}
            onToggleGrid={() => setShowGrid(!showGrid)}
            showGrid={showGrid}
            nodeCount={nodes.length}
            connectionCount={connections.length}
          />
        </div>
      </div>
    </BaseStudioComponent>
  );
};

export default VisualStoryletEditorRefactored;