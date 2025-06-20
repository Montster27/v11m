// /Users/montysharma/V11M2/src/components/contentStudio/VisualStoryletEditor.tsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UndoRedoAction } from '../../hooks/useUndoRedo';
import { useStoryletStore } from '../../store/useStoryletStore';
import type { Storylet } from '../../types/storylet';
import HelpTooltip from '../ui/HelpTooltip';

interface UndoRedoSystem {
  executeAction: (action: UndoRedoAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface FlowNode {
  id: string;
  type: 'storylet' | 'start' | 'end';
  position: { x: number; y: number };
  data: {
    title: string;
    content: string;
    effects?: Array<{ type: string; key: string; delta: number }>;
  };
  connections: string[]; // IDs of connected nodes
  storyletId?: string; // Reference to actual storylet
  storylet?: Storylet; // Full storylet data for storylet nodes
  connectionPoints?: Array<{
    choiceId: string;
    choiceText: string;
    isConnected: boolean;
  }>; // Available connection points for storylet nodes
}

interface FlowConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
  fromChoiceId?: string; // Which choice creates this connection
  choiceText?: string; // Text of the choice
}

interface StoryArc {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  entryPoints: string[]; // Node IDs that can start the arc
  exitPoints: string[]; // Node IDs that end the arc
  isValid: boolean; // Has at least one complete path
}

interface VisualStoryletEditorProps {
  undoRedoSystem: UndoRedoSystem;
  onSave?: (flowData: { nodes: FlowNode[]; connections: FlowConnection[] }) => void;
  editingStorylet?: Storylet | null;
  onStoryletSaved?: () => void;
  mode?: 'storylet' | 'arc'; // Editor mode
  editingArc?: StoryArc | null; // Arc being edited
  onArcSaved?: (arc: StoryArc) => void; // Arc save callback
}

const nodeTypes = [
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

const getStoryletNodeConfig = (storylet: Storylet) => {
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

const VisualStoryletEditor: React.FC<VisualStoryletEditorProps> = ({ 
  undoRedoSystem, 
  onSave,
  editingStorylet,
  onStoryletSaved,
  mode = 'storylet',
  editingArc,
  onArcSaved
}) => {
  const { addStorylet, updateStorylet, allStorylets } = useStoryletStore();
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<FlowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [pendingNodeUpdates, setPendingNodeUpdates] = useState<{[nodeId: string]: {data: Partial<FlowNode['data']>, timeout: NodeJS.Timeout}}>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [storyletId, setStoryletId] = useState<string>('');
  const [storyletTitle, setStoryletTitle] = useState<string>('');
  const [storyletDescription, setStoryletDescription] = useState<string>('');
  const [storyArc, setStoryArc] = useState<string>('');
  const [arcName, setArcName] = useState<string>('');
  const [arcDescription, setArcDescription] = useState<string>('');
  const [draggedStoryletId, setDraggedStoryletId] = useState<string | null>(null);
  const [showChoiceDialog, setShowChoiceDialog] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<{from: string; to: string} | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContentRef = useRef<HTMLDivElement>(null);

  // Generate unique ID
  const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Convert storylet to visual flow
  const convertStoryletToFlow = (storylet: Storylet): { nodes: FlowNode[]; connections: FlowConnection[] } => {
    const nodes: FlowNode[] = [];
    const connections: FlowConnection[] = [];

    // Create start node
    const startNode: FlowNode = {
      id: 'start_node',
      type: 'start',
      position: { x: 100, y: 200 },
      data: {
        title: storylet.name || 'Story Start',
        content: storylet.description || ''
      },
      connections: []
    };
    nodes.push(startNode);

    // Create main event node
    const eventNode: FlowNode = {
      id: 'main_event',
      type: 'event',
      position: { x: 450, y: 200 },
      data: {
        title: storylet.name || 'Main Event',
        content: storylet.content || storylet.description || ''
      },
      connections: []
    };
    nodes.push(eventNode);

    // Connect start to main event
    connections.push({
      id: 'start_to_main',
      from: startNode.id,
      to: eventNode.id,
      label: 'Begin'
    });
    startNode.connections.push(eventNode.id);

    // Create choice nodes with better spacing
    let currentY = 50;
    const choiceSpacing = 150; // Increased spacing
    const startY = storylet.choices.length > 1 ? 50 : 200; // Center single choice
    storylet.choices.forEach((choice, index) => {
      const choiceNode: FlowNode = {
        id: `choice_${choice.id}`,
        type: 'choice',
        position: { x: 800, y: startY + (currentY * index) },
        data: {
          title: `Choice ${index + 1}`,
          content: choice.text
        },
        connections: []
      };
      nodes.push(choiceNode);

      // Connect main event to choice
      connections.push({
        id: `main_to_choice_${choice.id}`,
        from: eventNode.id,
        to: choiceNode.id,
        label: 'Option'
      });
      eventNode.connections.push(choiceNode.id);

      // Create outcome node for choice effects
      if (choice.effects && choice.effects.length > 0) {
        const outcomeNode: FlowNode = {
          id: `outcome_${choice.id}`,
          type: 'outcome',
          position: { x: 1150, y: startY + (currentY * index) },
          data: {
            title: 'Outcome',
            content: choice.effects.map(effect => {
              if (effect.type === 'resource' || effect.type === 'skillXp') {
                const sign = effect.delta > 0 ? '+' : '';
                return `${effect.key}: ${sign}${effect.delta}`;
              } else if (effect.type === 'flag') {
                return `Set ${effect.key}: ${effect.value}`;
              }
              return `${effect.type}: ${JSON.stringify(effect)}`;
            }).join('\n'),
            effects: choice.effects.map(effect => ({
              type: effect.type === 'skillXp' ? 'skill' : effect.type,
              key: effect.key,
              delta: effect.delta || 0
            }))
          },
          connections: []
        };
        nodes.push(outcomeNode);

        // Connect choice to outcome
        connections.push({
          id: `choice_to_outcome_${choice.id}`,
          from: choiceNode.id,
          to: outcomeNode.id,
          label: 'Result'
        });
        choiceNode.connections.push(outcomeNode.id);
      }

      currentY += choiceSpacing;
    });

    // Create end node if there are choices
    if (storylet.choices.length > 0) {
      const endNode: FlowNode = {
        id: 'end_node',
        type: 'end',
        position: { x: 1450, y: 200 }, // Center the end node
        data: {
          title: 'Story End',
          content: 'The story concludes here.'
        },
        connections: []
      };
      nodes.push(endNode);

      // Connect all outcome nodes to end
      nodes.filter(n => n.type === 'outcome').forEach(outcomeNode => {
        connections.push({
          id: `outcome_to_end_${outcomeNode.id}`,
          from: outcomeNode.id,
          to: endNode.id,
          label: 'Continue'
        });
        outcomeNode.connections.push(endNode.id);
      });

      // If no outcome nodes, connect choices directly to end
      if (!nodes.some(n => n.type === 'outcome')) {
        nodes.filter(n => n.type === 'choice').forEach(choiceNode => {
          connections.push({
            id: `choice_to_end_${choiceNode.id}`,
            from: choiceNode.id,
            to: endNode.id,
            label: 'Continue'
          });
          choiceNode.connections.push(endNode.id);
        });
      }
    }

    return { nodes, connections };
  };

  // Convert visual flow to storylet
  const convertFlowToStorylet = (): Storylet => {
    const startNode = nodes.find(n => n.type === 'start');
    const eventNodes = nodes.filter(n => n.type === 'event');
    const choiceNodes = nodes.filter(n => n.type === 'choice');
    const outcomeNodes = nodes.filter(n => n.type === 'outcome');

    // Get main content from event nodes
    const mainContent = eventNodes.length > 0 
      ? eventNodes[0].data.content 
      : startNode?.data.content || '';

    // Build choices array
    const choices = choiceNodes.map(choiceNode => {
      // Find connected outcome node
      const connectedOutcome = outcomeNodes.find(outcome => 
        connections.some(conn => conn.from === choiceNode.id && conn.to === outcome.id)
      );

      const effects = connectedOutcome?.data.effects || [];

      return {
        id: choiceNode.id.replace('choice_', ''),
        text: choiceNode.data.content,
        effects: effects.map(effect => ({
          type: effect.type === 'skill' ? 'skillXp' : effect.type,
          key: effect.key,
          delta: effect.delta
        }))
      };
    });

    return {
      id: storyletId || `visual_${Date.now()}`,
      name: storyletTitle || startNode?.data.title || 'Visual Storylet',
      description: storyletDescription || 'Created with visual editor',
      content: mainContent,
      trigger: {
        type: 'time',
        conditions: { day: 1 }
      },
      choices,
      tags: [],
      isActive: true,
      storyArc,
      deploymentStatus: 'dev'
    };
  };

  // Initialize with editing storylet if provided
  useEffect(() => {
    if (editingStorylet) {
      const flowData = convertStoryletToFlow(editingStorylet);
      setNodes(flowData.nodes);
      setConnections(flowData.connections);
      setIsEditMode(true);
      setStoryletId(editingStorylet.id);
      setStoryletTitle(editingStorylet.name || '');
      setStoryletDescription(editingStorylet.description || '');
      setStoryArc(editingStorylet.storyArc || '');
    } else {
      setNodes([]);
      setConnections([]);
      setIsEditMode(false);
      setStoryletId('');
      setStoryletTitle('');
      setStoryletDescription('');
      setStoryArc('');
    }
  }, [editingStorylet]);

  // Add new node to canvas
  const addNode = useCallback((type: string, position: { x: number; y: number }, storyletId?: string) => {
    let newNode: FlowNode;
    
    if (type === 'storylet' && storyletId) {
      const storylet = allStorylets[storyletId];
      if (!storylet) {
        console.error('Storylet not found:', storyletId);
        return;
      }
      
      newNode = {
        id: generateId(),
        type: 'storylet',
        position,
        data: {
          title: storylet.name,
          content: storylet.description || ''
        },
        connections: [],
        storyletId,
        storylet,
        connectionPoints: storylet.choices.map(choice => ({
          choiceId: choice.id,
          choiceText: choice.text,
          isConnected: false
        }))
      };
    } else {
      newNode = {
        id: generateId(),
        type: type as FlowNode['type'],
        position,
        data: {
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Point`,
          content: `This is a ${type} point for the story arc`
        },
        connections: []
      };
    }

    const undoRedoAction: UndoRedoAction = {
      id: `add_node_${Date.now()}`,
      description: `Add ${type} node`,
      timestamp: new Date(),
      redoAction: () => {
        setNodes(prev => [...prev, newNode]);
        console.log('✅ Node added:', newNode.data.title);
      },
      undoAction: () => {
        setNodes(prev => prev.filter(n => n.id !== newNode.id));
        setConnections(prev => prev.filter(c => c.from !== newNode.id && c.to !== newNode.id));
        console.log('↶ Node addition undone:', newNode.data.title);
      },
      data: { node: newNode }
    };

    undoRedoSystem.executeAction(undoRedoAction);
  }, [undoRedoSystem]);

  // Handle canvas drop
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if ((!draggedNodeType && !draggedStoryletId) || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scrollLeft = canvasRef.current.scrollLeft;
    const scrollTop = canvasRef.current.scrollTop;
    const position = {
      x: (e.clientX - rect.left + scrollLeft) / zoom,
      y: (e.clientY - rect.top + scrollTop) / zoom
    };

    if (draggedStoryletId) {
      addNode('storylet', position, draggedStoryletId);
      setDraggedStoryletId(null);
    } else if (draggedNodeType) {
      addNode(draggedNodeType, position);
      setDraggedNodeType(null);
    }
  };

  // Handle canvas drag over
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+click
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && canvasRef.current) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      
      canvasRef.current.scrollLeft -= deltaX;
      canvasRef.current.scrollTop -= deltaY;
      
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.1, Math.min(2, zoom + delta));
      setZoom(newZoom);
    }
  };

  // Calculate canvas bounds to ensure scrollable area
  const getCanvasBounds = () => {
    if (nodes.length === 0) {
      return { width: 2000, height: 1500 }; // Default canvas size
    }

    const padding = 300; // Extra space around nodes
    const minX = Math.min(...nodes.map(n => n.position.x)) - padding;
    const maxX = Math.max(...nodes.map(n => n.position.x + 200)) + padding; // Node width ~200
    const minY = Math.min(...nodes.map(n => n.position.y)) - padding;
    const maxY = Math.max(...nodes.map(n => n.position.y + 80)) + padding; // Node height ~80

    return {
      width: Math.max(2000, maxX - minX),
      height: Math.max(1500, maxY - minY),
      offsetX: Math.max(0, -minX),
      offsetY: Math.max(0, -minY)
    };
  };

  const canvasBounds = getCanvasBounds();

  // Handle choice selection for storylet connections
  const handleChoiceSelection = (choiceId: string) => {
    if (!pendingConnection) return;
    
    const fromNode = nodes.find(n => n.id === pendingConnection.from);
    const choice = fromNode?.storylet?.choices.find(c => c.id === choiceId);
    
    if (!choice) return;
    
    const newConnection: FlowConnection = {
      id: `conn_${Date.now()}`,
      from: pendingConnection.from,
      to: pendingConnection.to,
      label: choice.text,
      fromChoiceId: choiceId,
      choiceText: choice.text
    };

    const undoRedoAction: UndoRedoAction = {
      id: `add_storylet_connection_${Date.now()}`,
      description: `Connect storylets via choice`,
      timestamp: new Date(),
      redoAction: () => {
        setConnections(prev => [...prev, newConnection]);
        setNodes(prev => prev.map(n => {
          if (n.id === pendingConnection.from) {
            return {
              ...n,
              connections: [...n.connections, pendingConnection.to],
              connectionPoints: n.connectionPoints?.map(cp => 
                cp.choiceId === choiceId ? { ...cp, isConnected: true } : cp
              )
            };
          }
          return n;
        }));
        console.log('✅ Storylet connection created');
      },
      undoAction: () => {
        setConnections(prev => prev.filter(c => c.id !== newConnection.id));
        setNodes(prev => prev.map(n => {
          if (n.id === pendingConnection.from) {
            return {
              ...n,
              connections: n.connections.filter(id => id !== pendingConnection.to),
              connectionPoints: n.connectionPoints?.map(cp => 
                cp.choiceId === choiceId ? { ...cp, isConnected: false } : cp
              )
            };
          }
          return n;
        }));
        console.log('↶ Storylet connection undone');
      },
      data: { connection: newConnection }
    };

    undoRedoSystem.executeAction(undoRedoAction);
    setShowChoiceDialog(false);
    setPendingConnection(null);
  };

  // Save story arc
  const saveStoryArc = () => {
    if (!arcName.trim()) {
      alert('Please enter an arc name');
      return;
    }

    if (nodes.length === 0) {
      alert('Please add some storylets to the arc');
      return;
    }

    // Validate arc has at least one path from start to end
    const startNodes = nodes.filter(n => n.type === 'start');
    const endNodes = nodes.filter(n => n.type === 'end');
    const storyletNodes = nodes.filter(n => n.type === 'storylet');

    if (storyletNodes.length === 0) {
      alert('Arc must contain at least one storylet');
      return;
    }

    const arc: StoryArc = {
      id: editingArc?.id || `arc_${Date.now()}`,
      name: arcName,
      description: arcDescription,
      nodes,
      connections,
      entryPoints: startNodes.map(n => n.id),
      exitPoints: endNodes.map(n => n.id),
      isValid: true // TODO: Add proper validation
    };

    // Update storylets with connection information
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      
      if (fromNode?.type === 'storylet' && toNode?.type === 'storylet' && conn.fromChoiceId) {
        const storylet = fromNode.storylet;
        if (storylet) {
          const updatedStorylet = {
            ...storylet,
            choices: storylet.choices.map(choice => 
              choice.id === conn.fromChoiceId 
                ? { ...choice, nextStoryletId: toNode.storyletId }
                : choice
            )
          };
          updateStorylet(updatedStorylet);
        }
      }
    });

    onArcSaved?.(arc);
    console.log('💾 Story arc saved:', arcName);
  };

  // Handle node selection
  const handleNodeClick = (node: FlowNode) => {
    if (isConnecting && connectionStart) {
      // Complete connection
      if (connectionStart !== node.id) {
        const fromNode = nodes.find(n => n.id === connectionStart);
        
        // If connecting from a storylet node, show choice selection dialog
        if (fromNode?.type === 'storylet' && fromNode.storylet && mode === 'arc') {
          setPendingConnection({ from: connectionStart, to: node.id });
          setShowChoiceDialog(true);
          setIsConnecting(false);
          setConnectionStart(null);
          return;
        }
        
        const newConnection: FlowConnection = {
          id: `conn_${Date.now()}`,
          from: connectionStart,
          to: node.id,
          label: 'Next'
        };

        const undoRedoAction: UndoRedoAction = {
          id: `add_connection_${Date.now()}`,
          description: `Connect nodes`,
          timestamp: new Date(),
          redoAction: () => {
            setConnections(prev => [...prev, newConnection]);
            setNodes(prev => prev.map(n => 
              n.id === connectionStart 
                ? { ...n, connections: [...n.connections, node.id] }
                : n
            ));
            console.log('✅ Connection created');
          },
          undoAction: () => {
            setConnections(prev => prev.filter(c => c.id !== newConnection.id));
            setNodes(prev => prev.map(n => 
              n.id === connectionStart 
                ? { ...n, connections: n.connections.filter(id => id !== node.id) }
                : n
            ));
            console.log('↶ Connection undone');
          },
          data: { connection: newConnection }
        };

        undoRedoSystem.executeAction(undoRedoAction);
      }
      setIsConnecting(false);
      setConnectionStart(null);
    } else {
      setSelectedNode(node);
    }
  };

  // Start connection mode
  const startConnection = (nodeId: string) => {
    setIsConnecting(true);
    setConnectionStart(nodeId);
    setSelectedNode(null);
  };

  // Update node data with debouncing
  const updateNodeData = (nodeId: string, updates: Partial<FlowNode['data']>) => {
    // Update UI immediately for responsiveness
    setNodes(prev => prev.map(n => 
      n.id === nodeId 
        ? { ...n, data: { ...n.data, ...updates } }
        : n
    ));

    // Clear any pending timeout for this node
    if (pendingNodeUpdates[nodeId]) {
      clearTimeout(pendingNodeUpdates[nodeId].timeout);
    }

    const oldNode = nodes.find(n => n.id === nodeId);
    if (!oldNode) return;

    // Set up debounced undo/redo action
    const timeout = setTimeout(() => {
      const undoRedoAction: UndoRedoAction = {
        id: `update_node_${Date.now()}`,
        description: `Update node "${oldNode.data.title}"`,
        timestamp: new Date(),
        redoAction: () => {
          setNodes(prev => prev.map(n => 
            n.id === nodeId 
              ? { ...n, data: { ...n.data, ...updates } }
              : n
          ));
          console.log('✅ Node updated');
        },
        undoAction: () => {
          setNodes(prev => prev.map(n => 
            n.id === nodeId 
              ? { ...n, data: oldNode.data }
              : n
          ));
          console.log('↶ Node update undone');
        },
        data: { nodeId, oldData: oldNode.data, newData: updates }
      };

      undoRedoSystem.executeAction(undoRedoAction);
      
      // Remove from pending updates
      setPendingNodeUpdates(prev => {
        const newState = { ...prev };
        delete newState[nodeId];
        return newState;
      });
    }, 1000); // 1 second debounce

    setPendingNodeUpdates(prev => ({
      ...prev,
      [nodeId]: { data: updates, timeout }
    }));
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(pendingNodeUpdates).forEach(({ timeout }) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Delete node
  const deleteNode = (nodeId: string) => {
    const nodeToDelete = nodes.find(n => n.id === nodeId);
    const connectionsToDelete = connections.filter(c => c.from === nodeId || c.to === nodeId);
    
    if (!nodeToDelete) return;

    const undoRedoAction: UndoRedoAction = {
      id: `delete_node_${Date.now()}`,
      description: `Delete node "${nodeToDelete.data.title}"`,
      timestamp: new Date(),
      redoAction: () => {
        setNodes(prev => prev.filter(n => n.id !== nodeId));
        setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
        setSelectedNode(null);
        console.log('✅ Node deleted');
      },
      undoAction: () => {
        setNodes(prev => [...prev, nodeToDelete]);
        setConnections(prev => [...prev, ...connectionsToDelete]);
        console.log('↶ Node deletion undone');
      },
      data: { node: nodeToDelete, connections: connectionsToDelete }
    };

    undoRedoSystem.executeAction(undoRedoAction);
  };

  // Get node type config
  const getNodeConfig = (node: FlowNode) => {
    if (node.type === 'storylet' && node.storylet) {
      return getStoryletNodeConfig(node.storylet);
    }
    return nodeTypes.find(nt => nt.type === node.type) || nodeTypes[0];
  };

  // Save flow
  const saveFlow = () => {
    if (onSave) {
      onSave({ nodes, connections });
      console.log('💾 Flow saved');
    }
  };

  // Save as storylet
  const saveAsStorylet = () => {
    if (!storyletTitle.trim()) {
      alert('Please enter a storylet title');
      return;
    }

    if (nodes.length === 0) {
      alert('Please create some nodes first');
      return;
    }

    const storylet = convertFlowToStorylet();

    const undoRedoAction: UndoRedoAction = {
      id: `${isEditMode ? 'update' : 'create'}_visual_storylet_${Date.now()}`,
      description: `${isEditMode ? 'Update' : 'Create'} visual storylet "${storyletTitle}"`,
      timestamp: new Date(),
      redoAction: () => {
        if (isEditMode) {
          updateStorylet(storylet);
          console.log('✅ Visual storylet updated:', storyletTitle);
        } else {
          addStorylet(storylet);
          console.log('✅ Visual storylet created:', storyletTitle);
        }
      },
      undoAction: () => {
        if (isEditMode && editingStorylet) {
          updateStorylet(editingStorylet);
          console.log('↶ Visual storylet update undone:', storyletTitle);
        } else {
          useStoryletStore.getState().deleteStorylet(storylet.id);
          console.log('↶ Visual storylet creation undone:', storyletTitle);
        }
      },
      data: { storylet }
    };

    undoRedoSystem.executeAction(undoRedoAction);
    
    // Notify parent that storylet was saved
    onStoryletSaved?.();
    
    // Reset form only if not in edit mode
    if (!isEditMode) {
      setNodes([]);
      setConnections([]);
      setStoryletTitle('');
      setStoryletDescription('');
      setStoryArc('');
      setStoryletId('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {isEditMode ? 'Visual Storylet Editor' : 'Visual Storylet Editor'}
            </h3>
            <p className="text-sm text-gray-600">
              {isEditMode 
                ? `Editing: ${storyletTitle || 'Untitled Storylet'}` 
                : 'Drag and drop to create story flows'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HelpTooltip content="Create story flows by dragging node types onto the canvas and connecting them. Click nodes to edit their content." />
            <div className="flex items-center gap-2">
              {mode === 'arc' ? (
                <>
                  <button
                    onClick={saveFlow}
                    disabled={nodes.length === 0}
                    className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    💾 Save Flow
                  </button>
                  <button
                    onClick={saveStoryArc}
                    disabled={nodes.length === 0 || !arcName.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {editingArc ? '💾 Update Arc' : '💾 Save Story Arc'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={saveFlow}
                    disabled={nodes.length === 0}
                    className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    💾 Save Flow
                  </button>
                  <button
                    onClick={saveAsStorylet}
                    disabled={nodes.length === 0 || !storyletTitle.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isEditMode ? '💾 Update Storylet' : '💾 Save as Storylet'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Node Palette */}
        <div className="w-64 min-w-64 max-w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto flex-shrink-0">
          {/* Mode-dependent Metadata */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h4 className="font-medium text-gray-800 mb-3">
              {mode === 'arc' ? 'Arc Info' : 'Storylet Info'}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {mode === 'arc' ? 'Arc Name *' : 'Title *'}
                </label>
                <input
                  type="text"
                  value={mode === 'arc' ? arcName : storyletTitle}
                  onChange={(e) => mode === 'arc' ? setArcName(e.target.value) : setStoryletTitle(e.target.value)}
                  placeholder={mode === 'arc' ? 'Enter arc name' : 'Enter storylet title'}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={mode === 'arc' ? arcDescription : storyletDescription}
                  onChange={(e) => mode === 'arc' ? setArcDescription(e.target.value) : setStoryletDescription(e.target.value)}
                  placeholder={mode === 'arc' ? 'Brief arc description' : 'Brief description'}
                  rows={2}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {mode === 'storylet' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Story Arc</label>
                  <input
                    type="text"
                    value={storyArc}
                    onChange={(e) => setStoryArc(e.target.value)}
                    placeholder="e.g., Main Story"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {mode === 'arc' ? (
            <>
              {/* Storylet Library for Arc Mode */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3">Storylet Library</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.values(allStorylets).map((storylet) => (
                    <div
                      key={storylet.id}
                      draggable
                      onDragStart={() => setDraggedStoryletId(storylet.id)}
                      className="p-2 border border-blue-300 rounded-lg cursor-move transition-colors hover:bg-blue-50 bg-blue-100"
                      title={storylet.description || 'Drag to add storylet to arc'}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📖</span>
                        <span className="font-medium text-sm truncate">{storylet.name}</span>
                      </div>
                      {storylet.storyArc && (
                        <p className="text-xs text-gray-600 mt-1">Arc: {storylet.storyArc}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Node Types for Arc Mode */}
              <h4 className="font-medium text-gray-800 mb-3">Arc Points</h4>
              <div className="space-y-2">
                {nodeTypes.map((nodeType) => (
                  <div
                    key={nodeType.type}
                    draggable
                    onDragStart={() => setDraggedNodeType(nodeType.type)}
                    className={`p-3 border-2 border-dashed rounded-lg cursor-move transition-colors hover:bg-gray-50 ${nodeType.color}`}
                    title={nodeType.description}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{nodeType.icon}</span>
                      <span className="font-medium">{nodeType.label}</span>
                    </div>
                    <p className="text-xs mt-1 opacity-75">{nodeType.description}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Node Types for Storylet Mode */}
              <h4 className="font-medium text-gray-800 mb-3">Node Types</h4>
              <div className="space-y-2">
                {nodeTypes.map((nodeType) => (
                  <div
                    key={nodeType.type}
                    draggable
                    onDragStart={() => setDraggedNodeType(nodeType.type)}
                    className={`p-3 border-2 border-dashed rounded-lg cursor-move transition-colors hover:bg-gray-50 ${nodeType.color}`}
                    title={nodeType.description}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{nodeType.icon}</span>
                      <span className="font-medium">{nodeType.label}</span>
                    </div>
                    <p className="text-xs mt-1 opacity-75">{nodeType.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Connection Mode Toggle */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsConnecting(!isConnecting);
                setConnectionStart(null);
              }}
              className={`w-full p-2 rounded text-sm font-medium transition-colors ${
                isConnecting 
                  ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isConnecting ? '🔗 Click nodes to connect' : '🔗 Connection Mode'}
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white rounded-lg shadow-md p-2 border border-gray-200">
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              title="Zoom In"
            >
              +
            </button>
            <span className="text-xs text-center text-gray-600 px-1">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
              className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              title="Zoom Out"
            >
              −
            </button>
            <button
              onClick={() => setZoom(1)}
              className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded transition-colors"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>

          {/* Pan instructions */}
          <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-md p-2 border border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <div>🖱️ Scroll to pan</div>
              <div>⌃ + 🖱️ Zoom</div>
              <div>⌃ + Click & drag to pan</div>
            </div>
          </div>
          <div
            ref={canvasRef}
            className="w-full h-full bg-gray-100 relative overflow-auto"
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ 
              backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`, 
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              minWidth: '200vw',
              minHeight: '200vh'
            }}
          >
            <div
              ref={canvasContentRef}
              className="relative"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: '0 0',
                width: '200%',
                height: '200%'
              }}
            >
              {/* Render connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {connections.map((connection) => {
                const fromNode = nodes.find(n => n.id === connection.from);
                const toNode = nodes.find(n => n.id === connection.to);
                if (!fromNode || !toNode) return null;

                const fromX = fromNode.position.x + 100; // Center of node (assumed width 200)
                const fromY = fromNode.position.y + 40; // Center of node (assumed height 80)
                const toX = toNode.position.x + 100;
                const toY = toNode.position.y + 40;

                return (
                  <line
                    key={connection.id}
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke="#4f46e5"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
              {/* Arrow marker definition */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#4f46e5"
                  />
                </marker>
              </defs>
              </svg>

            {/* Render nodes */}
            {nodes.map((node) => {
              const config = getNodeConfig(node);
              return (
                <div
                  key={node.id}
                  className={`absolute w-48 min-h-20 p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${config.color} ${
                    selectedNode?.id === node.id ? 'ring-2 ring-blue-500' : ''
                  } ${
                    isConnecting && connectionStart === node.id ? 'ring-2 ring-orange-500' : ''
                  }`}
                  style={{
                    left: node.position.x,
                    top: node.position.y
                  }}
                  onClick={() => handleNodeClick(node)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{config.icon}</span>
                    <div className="flex gap-1">
                      {!isConnecting && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startConnection(node.id);
                          }}
                          className="text-xs px-1 py-0.5 bg-white rounded hover:bg-gray-50"
                          title="Start connection"
                        >
                          🔗
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNode(node.id);
                        }}
                        className="text-xs px-1 py-0.5 bg-white rounded hover:bg-red-50 text-red-600"
                        title="Delete node"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="text-sm font-medium truncate">{node.data.title}</div>
                  <div className="text-xs opacity-75 truncate">{node.data.content}</div>
                </div>
              );
            })}

              {/* Drop instruction */}
              {nodes.length === 0 && (
                <div className="absolute flex items-center justify-center" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-4">📋</div>
                    <h4 className="text-lg font-medium mb-2">Start Building Your Story</h4>
                    <p className="text-sm">Drag node types from the left panel to create your story flow</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 bg-white border-l border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-800">Node Properties</h4>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={selectedNode.data.title}
                  onChange={(e) => updateNodeData(selectedNode.id, { title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={selectedNode.data.content}
                  onChange={(e) => updateNodeData(selectedNode.id, { content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {(selectedNode.type === 'outcome' || selectedNode.type === 'choice') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effects</label>
                  <div className="text-xs text-gray-500 mb-2">Resource changes when this node is reached</div>
                  <div className="space-y-2">
                    {['energy', 'stress', 'knowledge', 'social', 'money'].map((resource) => (
                      <div key={resource} className="flex items-center gap-2">
                        <span className="w-20 text-sm capitalize">{resource}:</span>
                        <input
                          type="number"
                          placeholder="0"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            const currentEffects = selectedNode.data.effects || [];
                            const otherEffects = currentEffects.filter(effect => effect.key !== resource);
                            const newEffects = value !== 0 
                              ? [...otherEffects, { type: 'resource', key: resource, delta: value }]
                              : otherEffects;
                            updateNodeData(selectedNode.id, { effects: newEffects });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Choice Selection Dialog */}
      {showChoiceDialog && pendingConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Select Choice</h3>
            <p className="text-sm text-gray-600 mb-4">
              Which choice should connect to the target storylet?
            </p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(() => {
                const fromNode = nodes.find(n => n.id === pendingConnection.from);
                return fromNode?.storylet?.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoiceSelection(choice.id)}
                    className="w-full text-left p-3 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm">{choice.text}</div>
                    {choice.effects.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {choice.effects.length} effect(s)
                      </div>
                    )}
                  </button>
                )) || [];
              })()}
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowChoiceDialog(false);
                  setPendingConnection(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualStoryletEditor;