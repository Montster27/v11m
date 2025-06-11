// /Users/montysharma/V11M2/src/components/StoryArcVisualizer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useStoryletStore } from '../store/useStoryletStore';
import { Button, Card } from './ui';
import { Storylet, Choice, Effect, StoryletDeploymentStatus } from '../types/storylet';

interface Node {
  id: string;
  storylet: Storylet;
  x: number;
  y: number;
  level: number;
}

interface Edge {
  from: string;
  to: string;
  choiceText: string;
  choiceId: string;
}

interface StoryArcVisualizerProps {
  arcName: string;
  onClose: () => void;
}

const StoryArcVisualizer: React.FC<StoryArcVisualizerProps> = ({ arcName, onClose }) => {
  const { getStoryletsByArc, allStorylets, updateStorylet, storyArcs } = useStoryletStore();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [editingStorylet, setEditingStorylet] = useState<Storylet | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Storylet>>({});
  const [triggerConditionsText, setTriggerConditionsText] = useState<string>('{}');
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount
    
    const buildGraph = () => {
      const arcStorylets = getStoryletsByArc(arcName);
      if (arcStorylets.length === 0) {
        if (isMounted) {
          setNodes([]);
          setEdges([]);
        }
        return;
      }

      // Build the graph structure
      const storyletMap = new Map<string, Storylet>();
      arcStorylets.forEach(storylet => storyletMap.set(storylet.id, storylet));

    // Find connections between storylets
    const connections = new Map<string, string[]>();
    const edgeList: Edge[] = [];

    arcStorylets.forEach(storylet => {
      storylet.choices.forEach(choice => {
        // Find storylets that can be triggered by this choice's effects
        const flagEffects = choice.effects.filter(e => e.type === 'flag' && e.value);
        
        flagEffects.forEach(flagEffect => {
          arcStorylets.forEach(potentialNext => {
            if (potentialNext.id === storylet.id) return;
            
            if (potentialNext.trigger.type === 'flag') {
              const requiredFlags = potentialNext.trigger.conditions.flags || [];
              if (requiredFlags.includes(flagEffect.key)) {
                if (!connections.has(storylet.id)) {
                  connections.set(storylet.id, []);
                }
                connections.get(storylet.id)!.push(potentialNext.id);
                
                edgeList.push({
                  from: storylet.id,
                  to: potentialNext.id,
                  choiceText: choice.text,
                  choiceId: choice.id
                });
              }
            }
          });
        });

        // Direct storylet connections
        if (choice.nextStoryletId && storyletMap.has(choice.nextStoryletId)) {
          if (!connections.has(storylet.id)) {
            connections.set(storylet.id, []);
          }
          connections.get(storylet.id)!.push(choice.nextStoryletId);
          
          edgeList.push({
            from: storylet.id,
            to: choice.nextStoryletId,
            choiceText: choice.text,
            choiceId: choice.id
          });
        }
      });
    });

    // Find root nodes (no incoming connections)
    const hasIncoming = new Set<string>();
    edgeList.forEach(edge => hasIncoming.add(edge.to));
    const rootNodes = arcStorylets.filter(storylet => !hasIncoming.has(storylet.id));

    // Layout nodes using a simple hierarchical layout
    const nodeList: Node[] = [];
    const visited = new Set<string>();
    const levels = new Map<string, number>();

    // BFS to assign levels
    const queue: { id: string; level: number }[] = [];
    rootNodes.forEach(root => {
      queue.push({ id: root.id, level: 0 });
      levels.set(root.id, 0);
    });

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const nextIds = connections.get(id) || [];
      nextIds.forEach(nextId => {
        if (!levels.has(nextId) || levels.get(nextId)! < level + 1) {
          levels.set(nextId, level + 1);
          queue.push({ id: nextId, level: level + 1 });
        }
      });
    }

    // Group nodes by level for positioning
    const levelGroups = new Map<number, string[]>();
    arcStorylets.forEach(storylet => {
      const level = levels.get(storylet.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(storylet.id);
    });

    // Position nodes
    const nodeWidth = 200;
    const nodeHeight = 80;
    const levelHeight = 150;
    const nodeSpacing = 250;

    Array.from(levelGroups.entries()).forEach(([level, storyletIds]) => {
      const levelY = 100 + level * levelHeight;
      const totalWidth = storyletIds.length * nodeSpacing;
      const startX = Math.max(50, (800 - totalWidth) / 2);

      storyletIds.forEach((storyletId, index) => {
        const storylet = storyletMap.get(storyletId)!;
        nodeList.push({
          id: storyletId,
          storylet,
          x: startX + index * nodeSpacing,
          y: levelY,
          level
        });
      });
    });

      // Only update state if component is still mounted
      if (isMounted) {
        setNodes(nodeList);
        setEdges(edgeList);
      }
    };

    // Use requestAnimationFrame for better performance
    const frameId = requestAnimationFrame(buildGraph);

    // Cleanup function
    return () => {
      isMounted = false;
      cancelAnimationFrame(frameId);
    };
  }, [arcName, getStoryletsByArc]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
    
    // Highlight paths from this node
    if (nodeId !== selectedNode) {
      const paths: string[] = [nodeId];
      const visited = new Set<string>();
      const queue = [nodeId];

      // Forward path tracing
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        edges.forEach(edge => {
          if (edge.from === currentId && !visited.has(edge.to)) {
            paths.push(edge.to);
            queue.push(edge.to);
          }
        });
      }

      // Also trace backwards to show incoming paths
      const backQueue = [nodeId];
      const backVisited = new Set<string>();
      
      while (backQueue.length > 0) {
        const currentId = backQueue.shift()!;
        if (backVisited.has(currentId)) continue;
        backVisited.add(currentId);

        edges.forEach(edge => {
          if (edge.to === currentId && !backVisited.has(edge.from)) {
            if (!paths.includes(edge.from)) {
              paths.push(edge.from);
            }
            backQueue.push(edge.from);
          }
        });
      }

      setHighlightedPath(paths);
    } else {
      setHighlightedPath([]);
    }
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    console.log('🖱️ Double-click on node:', nodeId);
    const storylet = allStorylets[nodeId];
    console.log('📖 Found storylet:', storylet);
    if (storylet) {
      setEditingStorylet(storylet);
      
      // Ensure flag triggers have at least one empty flag for editing
      let formData = { ...storylet };
      if (storylet.trigger?.type === 'flag' && (!storylet.trigger.conditions?.flags || storylet.trigger.conditions.flags.length === 0)) {
        formData = {
          ...storylet,
          trigger: {
            ...storylet.trigger,
            conditions: { flags: [''] }
          }
        };
      }
      
      setEditFormData(formData);
      setTriggerConditionsText(JSON.stringify(formData.trigger?.conditions || {}, null, 2));
      console.log('✏️ Started editing storylet:', storylet.name);
    }
  };

  const handleSaveEdit = () => {
    if (editingStorylet && editFormData.id && editFormData.name && editFormData.description) {
      console.log('💾 Saving storylet with form data:', editFormData);
      console.log('💾 Choices being saved:', editFormData.choices);
      
      const updatedStorylet: Storylet = {
        ...editingStorylet,
        ...editFormData,
        id: editFormData.id,
        name: editFormData.name,
        description: editFormData.description,
        deploymentStatus: editFormData.deploymentStatus || 'dev',
        trigger: editFormData.trigger || { type: 'time', conditions: {} },
        choices: editFormData.choices || [],
        storyArc: editFormData.storyArc
      };
      
      console.log('💾 Final storylet being saved:', updatedStorylet);
      updateStorylet(updatedStorylet);
      setEditingStorylet(null);
      setEditFormData({});
      setTriggerConditionsText('{}');
      
      // Force refresh of the visualization
      const arcStorylets = getStoryletsByArc(arcName);
      // Trigger useEffect to rebuild nodes and edges
      setTimeout(() => {
        // This will cause the component to re-render with updated data
      }, 0);
    } else {
      console.log('❌ Save failed - missing required fields:', {
        editingStorylet: !!editingStorylet,
        id: editFormData.id,
        name: editFormData.name,
        description: editFormData.description
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingStorylet(null);
    setEditFormData({});
    setTriggerConditionsText('{}');
  };

  const addChoice = () => {
    setEditFormData({
      ...editFormData,
      choices: [
        ...(editFormData.choices || []),
        {
          id: `choice_${(editFormData.choices?.length || 0) + 1}`,
          text: '',
          effects: []
        }
      ]
    });
  };

  const updateChoice = (index: number, field: keyof Choice, value: any) => {
    const choices = [...(editFormData.choices || [])];
    choices[index] = { ...choices[index], [field]: value };
    setEditFormData({ ...editFormData, choices });
  };

  const removeChoice = (index: number) => {
    const choices = [...(editFormData.choices || [])];
    choices.splice(index, 1);
    setEditFormData({ ...editFormData, choices });
  };

  const addEffect = (choiceIndex: number) => {
    const choices = [...(editFormData.choices || [])];
    choices[choiceIndex].effects.push({
      type: 'resource',
      key: 'energy',
      delta: 0
    } as Effect);
    setEditFormData({ ...editFormData, choices });
  };

  const updateEffect = (choiceIndex: number, effectIndex: number, effect: Effect) => {
    console.log('🔧 Updating effect:', { choiceIndex, effectIndex, effect });
    const choices = [...(editFormData.choices || [])];
    choices[choiceIndex].effects[effectIndex] = effect;
    setEditFormData({ ...editFormData, choices });
    console.log('📝 Updated choices:', choices);
  };

  const removeEffect = (choiceIndex: number, effectIndex: number) => {
    const choices = [...(editFormData.choices || [])];
    choices[choiceIndex].effects.splice(effectIndex, 1);
    setEditFormData({ ...editFormData, choices });
  };

  const isNodeHighlighted = (nodeId: string) => {
    return highlightedPath.includes(nodeId);
  };

  const isEdgeHighlighted = (edge: Edge) => {
    return highlightedPath.includes(edge.from) && highlightedPath.includes(edge.to);
  };

  const getNodeColor = (node: Node) => {
    if (node.id === selectedNode) return '#3b82f6'; // blue-500
    if (isNodeHighlighted(node.id)) return '#10b981'; // emerald-500
    
    // Color by trigger type
    switch (node.storylet.trigger.type) {
      case 'time': return '#6b7280'; // gray-500
      case 'flag': return '#8b5cf6'; // violet-500
      case 'resource': return '#f59e0b'; // amber-500
      default: return '#6b7280';
    }
  };

  const viewBox = `0 0 ${Math.max(1200, Math.max(...nodes.map(n => n.x)) + 250)} ${Math.max(600, Math.max(...nodes.map(n => n.y)) + 150)}`;

  return (
    <Card className="fixed inset-0 z-50 bg-white p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Story Arc Visualization: {arcName}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Click to highlight paths • Click ✏️ button or double-click to edit • {nodes.length} storylets • {edges.length} connections
          </p>
          {editingStorylet && (
            <p className="text-xs text-purple-600 mt-1">
              Currently editing: {editingStorylet.name}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-500 rounded"></div>
              <span>Time Trigger</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-violet-500 rounded"></div>
              <span>Flag Trigger</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span>Resource Trigger</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-emerald-500 rounded"></div>
              <span>Path</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Editing</span>
            </div>
          </div>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className={editingStorylet ? "flex-1" : "flex-1"}>
          <svg 
            ref={svgRef}
            viewBox={viewBox}
            className="w-full border border-gray-200 rounded bg-gray-50"
            style={{ minHeight: '600px' }}
          >
            {/* Render edges */}
            {edges.map((edge, index) => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              
              if (!fromNode || !toNode) return null;

              const isHighlighted = isEdgeHighlighted(edge);
              
              return (
                <g key={index}>
                  <defs>
                    <marker
                      id={`arrowhead-${index}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill={isHighlighted ? '#10b981' : '#6b7280'}
                      />
                    </marker>
                  </defs>
                  <line
                    x1={fromNode.x + 100}
                    y1={fromNode.y + 40}
                    x2={toNode.x + 100}
                    y2={toNode.y + 40}
                    stroke={isHighlighted ? '#10b981' : '#6b7280'}
                    strokeWidth={isHighlighted ? 3 : 2}
                    markerEnd={`url(#arrowhead-${index})`}
                    opacity={isHighlighted ? 1 : 0.6}
                  />
                  <text
                    x={(fromNode.x + toNode.x) / 2 + 100}
                    y={(fromNode.y + toNode.y) / 2 + 35}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 pointer-events-none"
                    dy="-5"
                  >
                    {edge.choiceText.length > 20 ? edge.choiceText.substring(0, 17) + '...' : edge.choiceText}
                  </text>
                </g>
              );
            })}

            {/* Render nodes */}
            {nodes.map(node => (
              <g key={node.id}>
                <g>
                  <rect
                    x={node.x}
                    y={node.y}
                    width="200"
                    height="80"
                    rx="8"
                    fill={getNodeColor(node)}
                    stroke={node.id === selectedNode ? '#1d4ed8' : editingStorylet?.id === node.id ? '#7c3aed' : '#d1d5db'}
                    strokeWidth={node.id === selectedNode || editingStorylet?.id === node.id ? 3 : 1}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleNodeClick(node.id)}
                    onDoubleClick={() => handleNodeDoubleClick(node.id)}
                  />
                  {/* Edit button overlay */}
                  <circle
                    cx={node.x + 180}
                    cy={node.y + 20}
                    r="12"
                    fill="#7c3aed"
                    className="cursor-pointer hover:fill-purple-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNodeDoubleClick(node.id);
                    }}
                  />
                  <text
                    x={node.x + 180}
                    y={node.y + 25}
                    textAnchor="middle"
                    className="text-xs fill-white pointer-events-none"
                    fontSize="10"
                  >
                    ✏️
                  </text>
                </g>
                <foreignObject
                  x={node.x + 8}
                  y={node.y + 8}
                  width="184"
                  height="64"
                  className="pointer-events-none"
                >
                  <div className="text-white text-sm">
                    <div className="font-medium mb-1 truncate">
                      {node.storylet.name}
                    </div>
                    <div className="text-xs opacity-90 truncate">
                      {node.storylet.trigger.type} trigger
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      {node.storylet.choices.length} choice{node.storylet.choices.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </foreignObject>
              </g>
            ))}
          </svg>
        </div>

        {/* Edit Panel */}
        {editingStorylet ? (
          <div className="w-[576px] space-y-4 max-h-full overflow-y-auto">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-purple-900">Edit Storylet</h3>
                  <div className="text-sm text-gray-600 font-mono">ID: {editFormData.id}</div>
                </div>
                <div className="space-x-2">
                  <Button onClick={handleSaveEdit} variant="primary" className="text-sm">
                    Save
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline" className="text-sm">
                    Cancel
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Basic Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editFormData.deploymentStatus || 'dev'}
                      onChange={(e) => setEditFormData({ ...editFormData, deploymentStatus: e.target.value as StoryletDeploymentStatus })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="dev">Dev</option>
                      <option value="stage">Stage</option>
                      <option value="live">Live</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Story Arc</label>
                    <select
                      value={editFormData.storyArc || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, storyArc: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="">No Arc</option>
                      {storyArcs.map(arc => (
                        <option key={arc} value={arc}>{arc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Trigger Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
                  <select
                    value={editFormData.trigger?.type || 'time'}
                    onChange={(e) => {
                      console.log('🎯 Trigger type changed to:', e.target.value);
                      const triggerType = e.target.value as 'time' | 'flag' | 'resource';
                      
                      // Provide appropriate default conditions for each trigger type
                      let defaultConditions = {};
                      if (triggerType === 'time') {
                        defaultConditions = { day: 1 };
                      } else if (triggerType === 'flag') {
                        defaultConditions = { flags: [''] };
                      } else if (triggerType === 'resource') {
                        defaultConditions = { energy: { min: 10 } };
                      }
                      
                      const newTrigger = { 
                        type: triggerType, 
                        conditions: defaultConditions 
                      };
                      
                      console.log('🎯 New trigger created:', newTrigger);
                      setEditFormData({
                        ...editFormData,
                        trigger: newTrigger
                      });
                      setTriggerConditionsText(JSON.stringify(defaultConditions, null, 2));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="time">Time-based</option>
                    <option value="flag">Flag-based</option>
                    <option value="resource">Resource-based</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger Conditions
                    {editFormData.trigger?.type === 'flag' && (
                      <span className="text-xs text-blue-600 ml-2">
                        Storylet triggers when ANY of these flags are true
                      </span>
                    )}
                    {editFormData.trigger?.type === 'time' && (
                      <span className="text-xs text-blue-600 ml-2">
                        Example: {`{"day": 5}`}
                      </span>
                    )}
                    {editFormData.trigger?.type === 'resource' && (
                      <span className="text-xs text-blue-600 ml-2">
                        Example: {`{"energy": {"min": 20}}`}
                      </span>
                    )}
                  </label>
                  
                  {/* Flag-specific editor */}
                  {editFormData.trigger?.type === 'flag' ? (
                    <div className="space-y-3">
                      <div className="bg-blue-50 p-3 rounded border">
                        <div className="text-sm font-medium text-blue-900 mb-2">🎯 Required Flags (OR logic)</div>
                        <div className="space-y-2">
                          {(editFormData.trigger?.conditions?.flags || []).map((flag: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={flag}
                                onChange={(e) => {
                                  const newFlags = [...(editFormData.trigger?.conditions?.flags || [])];
                                  newFlags[index] = e.target.value;
                                  const newConditions = { flags: newFlags };
                                  setEditFormData({
                                    ...editFormData,
                                    trigger: { ...editFormData.trigger!, conditions: newConditions }
                                  });
                                  setTriggerConditionsText(JSON.stringify(newConditions, null, 2));
                                }}
                                placeholder="Flag name (e.g., metMysteriousStudent)"
                                className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newFlags = (editFormData.trigger?.conditions?.flags || []).filter((_, i) => i !== index);
                                  const newConditions = { flags: newFlags };
                                  setEditFormData({
                                    ...editFormData,
                                    trigger: { ...editFormData.trigger!, conditions: newConditions }
                                  });
                                  setTriggerConditionsText(JSON.stringify(newConditions, null, 2));
                                }}
                                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newFlags = [...(editFormData.trigger?.conditions?.flags || []), ''];
                              const newConditions = { flags: newFlags };
                              setEditFormData({
                                ...editFormData,
                                trigger: { ...editFormData.trigger!, conditions: newConditions }
                              });
                              setTriggerConditionsText(JSON.stringify(newConditions, null, 2));
                            }}
                            className="w-full px-3 py-2 border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 rounded text-sm"
                          >
                            + Add Flag
                          </button>
                        </div>
                        <div className="text-xs text-blue-700 mt-2">
                          Storylet triggers when ANY of these flags are true. Common flags include:
                          college_started, analyticalApproach, socialApproach, emma_romance:coffee_success
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* JSON editor for non-flag triggers */
                    <textarea
                      value={triggerConditionsText}
                      onChange={(e) => {
                        const newText = e.target.value;
                        console.log('🎯 Trigger conditions text changed to:', newText);
                        setTriggerConditionsText(newText);
                        
                        // Try to parse JSON and update form data if valid
                        try {
                          const conditions = JSON.parse(newText);
                          console.log('🎯 Parsed conditions:', conditions);
                          setEditFormData({
                            ...editFormData,
                            trigger: { ...editFormData.trigger!, conditions }
                          });
                        } catch (error) {
                          console.log('🎯 Invalid JSON in trigger conditions (will not update form):', error);
                          // Invalid JSON, don't update form data but allow text editing
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded text-sm font-mono ${
                        (() => {
                          try {
                            JSON.parse(triggerConditionsText);
                            return 'border-gray-300';
                          } catch {
                            return 'border-red-300 bg-red-50';
                          }
                        })()
                      }`}
                      rows={4}
                      placeholder={
                        editFormData.trigger?.type === 'time' ? '{\n  "day": 5\n}' :
                        '{\n  "energy": {"min": 20}\n}'
                      }
                    />
                  )}
                  <div className="text-xs mt-1 flex justify-between">
                    <span className="text-gray-500">
                      Current trigger: {editFormData.trigger?.type || 'none'} - 
                      {editFormData.trigger?.type === 'flag' && ' Requires flags: ' + (editFormData.trigger?.conditions?.flags?.join(', ') || 'none')}
                      {editFormData.trigger?.type === 'time' && ' Day: ' + (editFormData.trigger?.conditions?.day || 'none')}
                      {editFormData.trigger?.type === 'resource' && ' Resource conditions set'}
                    </span>
                    <span className={(() => {
                      try {
                        JSON.parse(triggerConditionsText);
                        return 'text-green-600';
                      } catch {
                        return 'text-red-600';
                      }
                    })()}>
                      {(() => {
                        try {
                          JSON.parse(triggerConditionsText);
                          return '✓ Valid JSON';
                        } catch {
                          return '✗ Invalid JSON';
                        }
                      })()}
                    </span>
                  </div>
                </div>

                {/* Choices */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">Choices</label>
                    <Button onClick={addChoice} variant="outline" className="text-xs px-2 py-1">
                      Add Choice
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {(editFormData.choices || []).map((choice, choiceIndex) => (
                      <Card key={choiceIndex} className="p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">Choice {choiceIndex + 1}</span>
                          <Button
                            onClick={() => removeChoice(choiceIndex)}
                            variant="outline"
                            className="text-xs px-2 py-1 text-red-600"
                          >
                            Remove
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={choice.text}
                            onChange={(e) => updateChoice(choiceIndex, 'text', e.target.value)}
                            placeholder="Choice text"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          
                          <input
                            type="text"
                            value={choice.nextStoryletId || ''}
                            onChange={(e) => updateChoice(choiceIndex, 'nextStoryletId', e.target.value || undefined)}
                            placeholder="Next storylet ID (optional)"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-gray-600">Effects</span>
                              <Button
                                onClick={() => addEffect(choiceIndex)}
                                variant="outline"
                                className="text-xs px-1 py-0.5"
                              >
                                Add
                              </Button>
                            </div>
                            
                            {choice.effects.map((effect, effectIndex) => (
                              <div key={effectIndex} className="flex items-center space-x-2 mb-1">
                                <select
                                  value={effect.type}
                                  onChange={(e) => {
                                    console.log('🔄 Effect type changed to:', e.target.value);
                                    let newEffect: Effect = { type: e.target.value as any } as Effect;
                                    if (e.target.value === 'resource') {
                                      newEffect = { type: 'resource', key: 'energy', delta: 0 };
                                    } else if (e.target.value === 'flag') {
                                      newEffect = { type: 'flag', key: '', value: true };
                                    } else if (e.target.value === 'clueDiscovery') {
                                      newEffect = { type: 'clueDiscovery', clueId: '', onSuccess: [], onFailure: [] };
                                    }
                                    console.log('🔄 New effect created:', newEffect);
                                    updateEffect(choiceIndex, effectIndex, newEffect);
                                  }}
                                  className="text-xs border rounded px-1 py-0.5"
                                >
                                  <option value="resource">Resource</option>
                                  <option value="flag">Flag</option>
                                  <option value="clueDiscovery">Clue Discovery</option>
                                </select>
                                
                                {effect.type === 'resource' && (() => {
                                  const resourceEffect = effect as { type: 'resource'; key: string; delta: number };
                                  return (
                                    <>
                                      <input
                                        type="text"
                                        value={resourceEffect.key || ''}
                                        onChange={(e) => {
                                          console.log('💰 Resource key changed to:', e.target.value);
                                          updateEffect(choiceIndex, effectIndex, { 
                                            type: 'resource', 
                                            key: e.target.value, 
                                            delta: resourceEffect.delta 
                                          });
                                        }}
                                        placeholder="Resource"
                                        className="text-xs border rounded px-1 py-0.5 flex-1"
                                      />
                                      <input
                                        type="number"
                                        value={resourceEffect.delta || 0}
                                        onChange={(e) => {
                                          console.log('💰 Resource delta changed to:', e.target.value);
                                          updateEffect(choiceIndex, effectIndex, { 
                                            type: 'resource', 
                                            key: resourceEffect.key, 
                                            delta: parseInt(e.target.value) || 0 
                                          });
                                        }}
                                        className="text-xs border rounded px-1 py-0.5 w-16"
                                      />
                                    </>
                                  );
                                })()}
                                
                                {effect.type === 'flag' && (() => {
                                  const flagEffect = effect as { type: 'flag'; key: string; value: boolean };
                                  return (
                                    <>
                                      <input
                                        type="text"
                                        value={flagEffect.key || ''}
                                        onChange={(e) => {
                                          console.log('🏁 Flag key changed to:', e.target.value);
                                          updateEffect(choiceIndex, effectIndex, { 
                                            type: 'flag', 
                                            key: e.target.value, 
                                            value: flagEffect.value 
                                          });
                                        }}
                                        placeholder="Flag name"
                                        className="text-xs border rounded px-1 py-0.5 flex-1"
                                      />
                                      <select
                                        value={flagEffect.value ? 'true' : 'false'}
                                        onChange={(e) => {
                                          console.log('🏁 Flag value changed to:', e.target.value);
                                          updateEffect(choiceIndex, effectIndex, { 
                                            type: 'flag', 
                                            key: flagEffect.key, 
                                            value: e.target.value === 'true' 
                                          });
                                        }}
                                        className="text-xs border rounded px-1 py-0.5"
                                      >
                                        <option value="true">True</option>
                                        <option value="false">False</option>
                                      </select>
                                    </>
                                  );
                                })()}
                                
                                {effect.type === 'clueDiscovery' && (() => {
                                  const clueEffect = effect as { type: 'clueDiscovery'; clueId: string; minigameType?: string; onSuccess?: Effect[]; onFailure?: Effect[] };
                                  return (
                                    <>
                                      <input
                                        type="text"
                                        value={clueEffect.clueId || ''}
                                        onChange={(e) => {
                                          console.log('🔍 Clue ID changed to:', e.target.value);
                                          updateEffect(choiceIndex, effectIndex, { 
                                            ...clueEffect,
                                            clueId: e.target.value
                                          });
                                        }}
                                        placeholder="Clue ID"
                                        className="text-xs border rounded px-1 py-0.5 flex-1"
                                      />
                                      <select
                                        value={clueEffect.minigameType || ''}
                                        onChange={(e) => {
                                          console.log('🎮 Minigame type changed to:', e.target.value);
                                          updateEffect(choiceIndex, effectIndex, { 
                                            ...clueEffect,
                                            minigameType: e.target.value || undefined
                                          });
                                        }}
                                        className="text-xs border rounded px-1 py-0.5"
                                      >
                                        <option value="">No Minigame</option>
                                        <option value="memory">Memory</option>
                                        <option value="stroop">Stroop Test</option>
                                        <option value="wordscramble">Word Scramble</option>
                                        <option value="colormatch">Color Match</option>
                                      </select>
                                    </>
                                  );
                                })()}
                                
                                <Button
                                  onClick={() => removeEffect(choiceIndex, effectIndex)}
                                  variant="outline"
                                  className="text-xs px-1 py-0.5 text-red-600"
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          /* Side panel for selected node details */
          selectedNode && (() => {
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
                          Requires: {node.storylet.trigger.conditions.flags?.join(', ') || 'none'}
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
        })()
        )}
      </div>
    </Card>
  );
};

export default StoryArcVisualizer;