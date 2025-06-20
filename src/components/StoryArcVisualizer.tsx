// /Users/montysharma/V11M2/src/components/StoryArcVisualizer.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useArcVisualizerStore, useArcStorylets, useSelectedStorylet, useEditingStorylet } from '../store/useArcVisualizerStore';
import { useStoryletCatalogStore } from '../store/useStoryletCatalogStore';
import { useClueStore } from '../store/useClueStore';
import { Button, Card } from './ui';
import { Storylet, Choice, Effect, StoryletDeploymentStatus } from '../types/storylet';
import { safeParseJSON, validateTriggerConditions } from '../utils/validation';
import { calculateGraphLayout, Node, Edge, LayoutConfig } from '../utils/graphLayout';
import { useStoryletFilter, FilterOptions } from '../hooks/useStoryletFilter';
import { useViewport, useViewportDrag } from '../hooks/useViewport';
import { formatConditionValue, formatStoryletName, formatTriggerSummary, formatEffectSummary, getStatusColor, getTriggerTypeColor } from '../utils/displayFormatters';

interface StoryArcVisualizerProps {
  arcName: string;
  onClose: () => void;
}

const StoryArcVisualizer: React.FC<StoryArcVisualizerProps> = ({ arcName, onClose }) => {
  // Use our dedicated Arc Visualizer store
  const {
    loadArc,
    createStorylet,
    updateStorylet,
    deleteStorylet,
    setSelectedStorylet,
    setEditingStorylet,
    importFromMainStore,
    exportToMainStore
  } = useArcVisualizerStore();
  
  // Get reactive data from the store
  const arcStorylets = useArcStorylets();
  const selectedStorylet = useSelectedStorylet();
  const editingStorylet = useEditingStorylet();
  
  // We'll use useStoryletCatalogStore.getState() when needed to avoid reactive dependencies
  const { clues } = useClueStore();
  
  // Local UI state (not managed by store)
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [editFormData, setEditFormData] = useState<Partial<Storylet>>({});
  const [triggerConditionsText, setTriggerConditionsText] = useState<string>('{}');
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, visible: boolean}>({x: 0, y: 0, visible: false});
  const [, setContextMenuCanvasPos] = useState<{x: number, y: number}>({x: 0, y: 0});
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTriggerType, setFilterTriggerType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<boolean>(false);

  // Initialize the arc visualizer when component mounts or arcName changes
  useEffect(() => {
    console.log(`🏛️ Loading Arc Visualizer for "${arcName}"`);
    
    // Load storylets from the main catalog store
    const existingStorylets = useStoryletCatalogStore.getState().getStoryletsForArc(arcName);
    console.log(`📚 Found ${existingStorylets.length} existing storylets for arc "${arcName}"`);
    
    // Import them into our dedicated store
    importFromMainStore(existingStorylets, arcName);
    loadArc(arcName);
  }, [arcName, importFromMainStore, loadArc]);

  // Handle closing the visualizer and sync back to main store
  const handleClose = useCallback(() => {
    console.log('🚪 Closing Arc Visualizer, syncing data back to main store...');
    
    // Export storylets back to main store (this could be implemented later)
    const exportedStorylets = exportToMainStore();
    console.log(`📤 Exported ${exportedStorylets.length} storylets back to main store`);
    
    // Reset the dedicated store
    useArcVisualizerStore.getState().reset();
    
    // Call the original onClose callback
    onClose();
  }, [exportToMainStore, onClose]);

  // Use filtering hook
  const filterOptions: FilterOptions = {
    searchQuery,
    triggerType: filterTriggerType,
    status: filterStatus
  };
  const { filteredStorylets } = useStoryletFilter(arcStorylets, filterOptions);

  // Use viewport hook
  const viewport = useViewport(800, 600);
  const drag = useViewportDrag(viewport.setPan, viewport.panX, viewport.panY, viewport.zoom);

  // Calculate graph layout using extracted utility
  const { nodes, edges } = useMemo(() => {
    return calculateGraphLayout(filteredStorylets);
  }, [filteredStorylets]);
  const [isDragSelecting, setIsDragSelecting] = useState<boolean>(false);
  const [dragSelection, setDragSelection] = useState<{x1: number, y1: number, x2: number, y2: number} | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const doubleClickTimerRef = useRef<NodeJS.Timeout | null>(null);





  const handleNodeClick = (nodeId: string) => {
    // Use our store's selected storylet management
    const currentSelectedId = useArcVisualizerStore.getState().selectedStoryletId;
    const newSelectedId = nodeId === currentSelectedId ? null : nodeId;
    setSelectedStorylet(newSelectedId);
    
    // Highlight paths from this node
    if (nodeId !== currentSelectedId) {
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
    // Don't handle double clicks if we're in zoom mode
    if (viewport.isZooming) {
      return;
    }
    
    // Clear any existing double-click timer
    if (doubleClickTimerRef.current) {
      clearTimeout(doubleClickTimerRef.current);
    }
    
    // Add a delay to ensure zoom operations have settled
    doubleClickTimerRef.current = setTimeout(() => {
      // Double-check we're not in zoom mode after the delay
      if (viewport.isZooming) {
        return;
      }
      
      console.log(`✏️ Opening edit mode for storylet: ${nodeId}`);
      
      // Use our dedicated store to set editing mode
      setEditingStorylet(nodeId);
      
      // The editingStorylet will be available from our hook in the next render
      // Set up the form data when the editing storylet is available
      const storylet = useArcVisualizerStore.getState().getStorylet(nodeId);
      if (storylet) {
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
      }
    }, 200); // 200ms delay to allow zoom to settle
  };

  const handleSaveEdit = useCallback(() => {
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
      
      // Clear editing state using our store
      setEditingStorylet(null);
      setEditFormData({});
      setTriggerConditionsText('{}');
      
      console.log('✅ Storylet saved and edit mode closed');
    } else {
      console.log('❌ Save failed - missing required fields:', {
        editingStorylet: !!editingStorylet,
        id: editFormData.id,
        name: editFormData.name,
        description: editFormData.description
      });
    }
  }, [editingStorylet, editFormData, updateStorylet]);

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

  const updateChoice = (index: number, field: keyof Choice, value: string | undefined) => {
    const choices = [...(editFormData.choices || [])];
    if (index >= 0 && index < choices.length) {
      choices[index] = { ...choices[index], [field]: value };
      setEditFormData({ ...editFormData, choices });
    }
  };

  const removeChoice = (index: number) => {
    const choices = [...(editFormData.choices || [])];
    if (index >= 0 && index < choices.length) {
      choices.splice(index, 1);
      setEditFormData({ ...editFormData, choices });
    }
  };

  const addEffect = (choiceIndex: number) => {
    const choices = [...(editFormData.choices || [])];
    if (choiceIndex >= 0 && choiceIndex < choices.length) {
      choices[choiceIndex].effects.push({
        type: 'resource',
        key: 'energy',
        delta: 0
      } as Effect);
      setEditFormData({ ...editFormData, choices });
    }
  };

  const updateEffect = (choiceIndex: number, effectIndex: number, effect: Effect) => {
    console.log('🔧 Updating effect:', { choiceIndex, effectIndex, effect });
    const choices = [...(editFormData.choices || [])];
    if (choiceIndex >= 0 && choiceIndex < choices.length && effectIndex >= 0 && effectIndex < choices[choiceIndex].effects.length) {
      choices[choiceIndex].effects[effectIndex] = effect;
      setEditFormData({ ...editFormData, choices });
      console.log('📝 Updated choices:', choices);
    }
  };

  const removeEffect = (choiceIndex: number, effectIndex: number) => {
    const choices = [...(editFormData.choices || [])];
    if (choiceIndex >= 0 && choiceIndex < choices.length && effectIndex >= 0 && effectIndex < choices[choiceIndex].effects.length) {
      choices[choiceIndex].effects.splice(effectIndex, 1);
      setEditFormData({ ...editFormData, choices });
    }
  };

  const isNodeHighlighted = (nodeId: string) => {
    return highlightedPath.includes(nodeId);
  };


  // Connection validation
  const validateConnections = () => {
    const issues: Array<{type: string, nodeId: string, message: string}> = [];
    
    nodes.forEach(node => {
      const storylet = node.storylet;
      
      // Check for missing flag dependencies
      if (storylet.trigger?.type === 'flag') {
        const requiredFlags = storylet.trigger.conditions?.flags || [];
        requiredFlags.forEach(flagName => {
          if (!flagName || flagName.trim() === '') {
            issues.push({
              type: 'missing_flag',
              nodeId: node.id,
              message: 'Empty flag requirement'
            });
          }
          
          // Check if any storylet sets this flag
          const flagIsSet = nodes.some(n => 
            n.storylet.choices?.some(choice => 
              choice.effects.some(effect => 
                effect.type === 'flag' && effect.key === flagName && effect.value
              )
            )
          );
          
          if (!flagIsSet) {
            issues.push({
              type: 'unreachable_flag',
              nodeId: node.id,
              message: `Flag "${flagName}" is never set by any storylet`
            });
          }
        });
      }
      
      // Check for broken nextStoryletId connections
      storylet.choices?.forEach((choice, choiceIndex) => {
        if (choice.nextStoryletId) {
          const targetExists = nodes.some(n => n.id === choice.nextStoryletId);
          if (!targetExists) {
            issues.push({
              type: 'broken_connection',
              nodeId: node.id,
              message: `Choice ${choiceIndex + 1} points to missing storylet: ${choice.nextStoryletId}`
            });
          }
        }
      });
      
      // Check for storylets with no choices
      if (storylet.choices?.length === 0) {
        issues.push({
          type: 'no_choices',
          nodeId: node.id,
          message: 'Storylet has no choices (dead end)'
        });
      }
      
      // Check for orphaned storylets (no incoming connections)
      const hasIncoming = edges.some(edge => edge.to === node.id);
      const isRoot = storylet.trigger?.type === 'time'; // Time triggers can be roots
      if (!hasIncoming && !isRoot) {
        issues.push({
          type: 'orphaned',
          nodeId: node.id,
          message: 'Storylet has no incoming connections and is not time-triggered'
        });
      }
    });
    
    return issues;
  };

  const connectionIssues = validateConnections();
  
  // Auto-save functionality
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  
  useEffect(() => {
    if (!autoSaveEnabled || !editingStorylet || !hasUnsavedChanges) return;
    
    const autoSaveTimer = setTimeout(() => {
      if (editFormData.id && editFormData.name && editFormData.description) {
        handleSaveEdit();
        setLastSaveTime(new Date());
        setHasUnsavedChanges(false);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
    
    return () => clearTimeout(autoSaveTimer);
  }, [editFormData, hasUnsavedChanges, autoSaveEnabled, editingStorylet, handleSaveEdit]);
  
  // Track changes to form data
  useEffect(() => {
    if (editingStorylet) {
      setHasUnsavedChanges(true);
    }
  }, [editFormData, editingStorylet]);

  // Clean up is handled by the viewport hook

  // Bulk operations functions
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedNodes(new Set());
    setSelectedNode(null);
    setHighlightedPath([]);
    setIsDragSelecting(false);
    setDragSelection(null);
  };

  const selectAllNodes = () => {
    setSelectedNodes(new Set(nodes.map(n => n.id)));
  };

  const clearSelection = () => {
    setSelectedNodes(new Set());
  };

  const deleteSelectedNodes = () => {
    if (selectedNodes.size === 0) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedNodes.size} storylet(s)?`);
    if (confirmed) {
      selectedNodes.forEach(nodeId => {
        console.log('Deleting storylet:', nodeId);
      });
      setSelectedNodes(new Set());
    }
  };

  const changeStatusOfSelected = (status: StoryletDeploymentStatus) => {
    selectedNodes.forEach(nodeId => {
      const storylet = allStorylets[nodeId];
      if (storylet) {
        updateStorylet({ ...storylet, deploymentStatus: status });
      }
    });
  };

  const moveSelectedToArc = (newArc: string) => {
    selectedNodes.forEach(nodeId => {
      const storylet = allStorylets[nodeId];
      if (storylet) {
        updateStorylet({ ...storylet, storyArc: newArc });
      }
    });
    setSelectedNodes(new Set());
  };

  const isEdgeHighlighted = (edge: Edge) => {
    return highlightedPath.includes(edge.from) && highlightedPath.includes(edge.to);
  };

  const getNodeColor = (node: Node) => {
    if (node.id === selectedStorylet?.id) return '#3b82f6'; // blue-500
    if (isNodeHighlighted(node.id)) return '#10b981'; // emerald-500
    
    // Color by trigger type
    switch (node.storylet.trigger?.type) {
      case 'time': return '#6b7280'; // gray-500
      case 'flag': return '#8b5cf6'; // violet-500
      case 'resource': return '#f59e0b'; // amber-500
      default: return '#6b7280';
    }
  };

  // Use viewport methods
  const { handleWheel, handleZoomIn, handleZoomOut, handleResetView } = viewport;

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as Element | null;
    hideContextMenu();
    
    if (e.button === 0 && target && !target.closest('rect[class*="cursor-pointer"], circle[class*="cursor-pointer"], text')) {
      if (selectionMode && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        // Start drag selection in selection mode
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (svgRect) {
          const canvasX = ((e.clientX - svgRect.left + viewport.panX) / viewport.zoom);
          const canvasY = ((e.clientY - svgRect.top + viewport.panY) / viewport.zoom);
          setIsDragSelecting(true);
          setDragSelection({ x1: canvasX, y1: canvasY, x2: canvasX, y2: canvasY });
        }
      } else {
        // Normal pan mode
        drag.handleMouseDown(e);
      }
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (drag.isDragging) {
      drag.handleMouseMove(e);
    } else if (isDragSelecting && dragSelection) {
      // Update drag selection rectangle
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (svgRect) {
        const canvasX = ((e.clientX - svgRect.left + viewport.panX) / viewport.zoom);
        const canvasY = ((e.clientY - svgRect.top + viewport.panY) / viewport.zoom);
        setDragSelection(prev => prev ? { ...prev, x2: canvasX, y2: canvasY } : null);
        
        // Select nodes within the selection rectangle
        const selection = new Set<string>();
        const minX = Math.min(dragSelection.x1, canvasX);
        const maxX = Math.max(dragSelection.x1, canvasX);
        const minY = Math.min(dragSelection.y1, canvasY);
        const maxY = Math.max(dragSelection.y1, canvasY);
        
        nodes.forEach(node => {
          const nodeX = node.x + 90; // Center of node
          const nodeY = node.y + 35; // Center of node
          if (nodeX >= minX && nodeX <= maxX && nodeY >= minY && nodeY <= maxY) {
            selection.add(node.id);
          }
        });
        
        setSelectedNodes(selection);
        setHighlightedPath(Array.from(selection));
      }
    }
  };

  const handleMouseUp = () => {
    drag.handleMouseUp();
    if (isDragSelecting) {
      setIsDragSelecting(false);
      setDragSelection(null);
    }
  };

  const handleMouseLeave = () => {
    drag.handleMouseUp();
    if (isDragSelecting) {
      setIsDragSelecting(false);
      setDragSelection(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as Element | null;
    
    if (target && !target.closest('rect[class*="cursor-pointer"], circle[class*="cursor-pointer"], text')) {
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (svgRect) {
        const canvasX = ((e.clientX - svgRect.left + viewport.panX) / viewport.zoom);
        const canvasY = ((e.clientY - svgRect.top + viewport.panY) / viewport.zoom);
        
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          visible: true
        });
        setContextMenuCanvasPos({ x: canvasX, y: canvasY });
      }
    }
  };

  const hideContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const createNewStorylet = (template?: 'basic' | 'choice_hub' | 'branch_point') => {
    console.log(`🆕 Creating new ${template || 'basic'} storylet in arc "${arcName}"`);
    
    // Use our dedicated store's createStorylet function
    const newStoryletId = createStorylet(template || 'basic', arcName);
    hideContextMenu();
    
    // Automatically start editing the new storylet
    setTimeout(() => {
      handleNodeDoubleClick(newStoryletId);
    }, 100);
  };


  useEffect(() => {
    const handleClickOutside = () => hideContextMenu();
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible]);

  const viewBox = nodes.length > 0 && viewport.zoom > 0
    ? `${-viewport.panX / viewport.zoom} ${-viewport.panY / viewport.zoom} ${Math.max(1200, Math.max(...nodes.map(n => n.x)) + 250) / viewport.zoom} ${Math.max(600, Math.max(...nodes.map(n => n.y)) + 150) / viewport.zoom}`
    : '0 0 1200 600';

  return (
    <Card className="fixed inset-0 z-50 bg-white p-6 overflow-auto">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            Story Arc Visualization: {arcName}
          </h2>
          <div className="flex items-center space-x-4 mt-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{nodes.length}</span> storylets • <span className="font-medium">{edges.length}</span> connections • Click to highlight paths • Double-click ✏️ to edit
            </p>
            {(searchQuery || filterTriggerType !== 'all' || filterStatus !== 'all') && (
              <p className="text-xs text-blue-600">
                {arcStorylets.length - nodes.length} storylet(s) filtered out
              </p>
            )}
            {connectionIssues.length > 0 && (
              <p className="text-xs text-orange-600">
                ⚠️ {connectionIssues.length} connection issue(s) detected
              </p>
            )}
            {viewport.isZooming && (
              <p className="text-xs text-blue-600">
                🔍 Zoom mode active - interactions temporarily disabled
              </p>
            )}
          </div>
          {editingStorylet && (
            <p className="text-xs text-purple-600 mt-1">
              Currently editing: {editingStorylet.name}
            </p>
          )}
          
          {/* Search and Filter Controls */}
          <div className="flex items-center space-x-3 mt-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search storylets, flags, choices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 h-5 w-5 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
                showFilters || filterTriggerType !== 'all' || filterStatus !== 'all' 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              🔍 Filters {(filterTriggerType !== 'all' || filterStatus !== 'all') && '•'}
            </button>
            
            {/* Quick filter shortcuts */}
            <div className="flex space-x-1">
              <button
                onClick={() => setFilterTriggerType(filterTriggerType === 'flag' ? 'all' : 'flag')}
                className={`px-2 py-1 text-xs rounded ${
                  filterTriggerType === 'flag' 
                    ? 'bg-violet-100 text-violet-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🏁 Flags
              </button>
              <button
                onClick={() => setFilterStatus(filterStatus === 'dev' ? 'all' : 'dev')}
                className={`px-2 py-1 text-xs rounded ${
                  filterStatus === 'dev' 
                    ? 'bg-gray-100 text-gray-700' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                🔧 Dev
              </button>
            </div>
          </div>
          
          {/* Extended Filters */}
          {showFilters && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Trigger Type</label>
                  <select
                    value={filterTriggerType}
                    onChange={(e) => setFilterTriggerType(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">All Types</option>
                    <option value="time">⏰ Time</option>
                    <option value="flag">🏁 Flag</option>
                    <option value="resource">💎 Resource</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">All Status</option>
                    <option value="dev">🔧 Dev</option>
                    <option value="stage">⚠️ Stage</option>
                    <option value="live">✅ Live</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterTriggerType('all');
                      setFilterStatus('all');
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-500 rounded shadow-sm"></div>
              <span className="text-sm font-medium">Time</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-violet-500 rounded shadow-sm"></div>
              <span className="text-sm font-medium">Flag</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-amber-500 rounded shadow-sm"></div>
              <span className="text-sm font-medium">Resource</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded shadow-sm"></div>
              <span className="text-sm font-medium">Selected</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-emerald-500 rounded shadow-sm"></div>
              <span className="text-sm font-medium">Path</span>
            </div>
          </div>
          <Button onClick={handleClose} variant="outline">
            Close
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className={editingStorylet ? "flex-1" : "flex-1"}>
          <div className="relative">
            {/* Mini-map */}
            {nodes.length > 3 && (
              <div className="absolute top-4 left-4 z-10 bg-white border border-gray-300 rounded p-2 shadow-sm">
                <div className="text-xs text-gray-600 mb-1 font-medium">Overview</div>
                <svg 
                  width="120" 
                  height="80" 
                  viewBox={nodes.length > 0 ? `0 0 ${Math.max(...nodes.map(n => n.x)) + 200} ${Math.max(...nodes.map(n => n.y)) + 100}` : '0 0 400 300'}
                  className="border border-gray-200 bg-gray-50 rounded"
                >
                  {/* Mini nodes */}
                  {nodes.map(node => (
                    <rect
                      key={node.id}
                      x={node.x * 0.1}
                      y={node.y * 0.1}
                      width="18"
                      height="7"
                      rx="1"
                      fill={node.id === selectedStorylet?.id ? '#3b82f6' : getNodeColor(node)}
                      className="cursor-pointer"
                      onClick={() => {
                        // Center view on this node
                        const targetX = -(node.x - 400) * viewport.zoom;
                        const targetY = -(node.y - 300) * viewport.zoom;
                        viewport.setPan(targetX, targetY);
                        setSelectedNode(node.id);
                      }}
                    />
                  ))}
                  {/* Mini edges */}
                  {edges.map((edge, index) => {
                    const fromNode = nodes.find(n => n.id === edge.from);
                    const toNode = nodes.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return null;
                    return (
                      <line
                        key={index}
                        x1={(fromNode.x + 90) * 0.1}
                        y1={(fromNode.y + 35) * 0.1}
                        x2={(toNode.x + 90) * 0.1}
                        y2={(toNode.y + 35) * 0.1}
                        stroke="#6b7280"
                        strokeWidth="1"
                        opacity="0.6"
                      />
                    );
                  })}
                  {/* Viewport indicator */}
                  {viewport.zoom > 0 && (
                    <rect
                      x={(-viewport.panX / viewport.zoom) * 0.1}
                      y={(-viewport.panY / viewport.zoom) * 0.1}
                      width={(800 / viewport.zoom) * 0.1}
                      height={(600 / viewport.zoom) * 0.1}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="1"
                      opacity="0.8"
                    />
                  )}
                </svg>
              </div>
            )}
            
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
              {viewport.isZooming && (
                <div className="bg-blue-100 border border-blue-300 rounded p-2 text-xs text-blue-800 font-medium max-w-xs">
                  🔍 Zooming... Please wait before clicking nodes
                </div>
              )}
              <button
                onClick={handleZoomIn}
                className="bg-white border border-gray-300 rounded p-2 hover:bg-gray-50 shadow-sm"
                title="Zoom In"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                  <line x1="11" y1="8" x2="11" y2="14"/>
                  <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              </button>
              <button
                onClick={handleZoomOut}
                className="bg-white border border-gray-300 rounded p-2 hover:bg-gray-50 shadow-sm"
                title="Zoom Out"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                  <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              </button>
              <button
                onClick={handleResetView}
                className="bg-white border border-gray-300 rounded p-2 hover:bg-gray-50 shadow-sm"
                title="Reset View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
              </button>
              <div className={`bg-white border border-gray-300 rounded p-2 text-xs font-medium ${
                viewport.isZooming ? 'text-blue-700 bg-blue-50 border-blue-300' : 'text-gray-700'
              }`}>
                {Math.round(viewport.zoom * 100)}% {viewport.isZooming && '🔍'}
              </div>
            </div>
          <svg 
            ref={svgRef}
            viewBox={viewBox}
            className={`w-full border border-gray-200 rounded bg-gray-50 ${
              drag.isDragging ? 'cursor-grabbing' : 
              viewport.isZooming ? 'cursor-zoom-in' : 
              'cursor-grab'
            }`}
            style={{ minHeight: '600px' }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleContextMenu}
          >
            {/* Empty state message */}
            {nodes.length === 0 && (
              <foreignObject x="0" y="0" width="100%" height="100%">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    {(searchQuery || filterTriggerType !== 'all' || filterStatus !== 'all') ? (
                      <>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No matching storylets</h3>
                        <p className="text-sm text-gray-500 max-w-sm mb-4">
                          No storylets match your current search and filter criteria.
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setFilterTriggerType('all');
                            setFilterStatus('all');
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          Clear all filters
                        </button>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No storylets in this arc</h3>
                        <p className="text-sm text-gray-500 max-w-sm mb-4">
                          This story arc doesn't contain any storylets yet. Right-click on the canvas to create your first storylet!
                        </p>
                        <p className="text-xs text-gray-400">
                          💡 Tip: Right-click anywhere on the canvas to create a new storylet
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </foreignObject>
            )}
            
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
                    x1={fromNode.x + 90}
                    y1={fromNode.y + 35}
                    x2={toNode.x + 90}
                    y2={toNode.y + 35}
                    stroke={isHighlighted ? '#10b981' : '#6b7280'}
                    strokeWidth={isHighlighted ? 3 : 2}
                    markerEnd={`url(#arrowhead-${index})`}
                    opacity={isHighlighted ? 1 : 0.6}
                  />
                  <text
                    x={(fromNode.x + toNode.x) / 2 + 90}
                    y={(fromNode.y + toNode.y) / 2 + 30}
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
            {nodes.map(node => {
              const hasConnections = edges.some(e => e.from === node.id || e.to === node.id);
              const hasErrors = !node.storylet.name || node.storylet.choices.length === 0;
              const flagCount = node.storylet.trigger?.type === 'flag' ? (node.storylet.trigger.conditions?.flags?.filter(f => f).length || 0) : 0;
              const nodeIssues = connectionIssues.filter(issue => issue.nodeId === node.id);
              const hasConnectionIssues = nodeIssues.length > 0;
              
              return (
                <g key={node.id}>
                  <g>
                    {/* Main storylet box */}
                    <rect
                      x={node.x}
                      y={node.y}
                      width="180"
                      height="70"
                      rx="8"
                      fill={selectedNodes.has(node.id) ? '#dbeafe' : getNodeColor(node)}
                      stroke={
                        selectedNodes.has(node.id) ? '#3b82f6' :
                        node.id === selectedStorylet?.id ? '#1d4ed8' : 
                        editingStorylet?.id === node.id ? '#7c3aed' : 
                        hasErrors ? '#dc2626' : '#d1d5db'
                      }
                      strokeWidth={
                        selectedNodes.has(node.id) ? 4 :
                        node.id === selectedStorylet?.id || editingStorylet?.id === node.id ? 3 : 
                        hasErrors ? 2 : 1
                      }
                      className="cursor-pointer hover:opacity-90 transition-all duration-200 hover:stroke-2"
                      onClick={() => handleNodeClick(node.id)}
                      onDoubleClick={() => handleNodeDoubleClick(node.id)}
                      filter={node.id === selectedStorylet?.id ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' : undefined}
                    />
                    
                    {/* Status indicator badges */}
                    {node.storylet.deploymentStatus === 'live' && (
                      <circle cx={node.x + 20} cy={node.y + 12} r="4" fill="#10b981" />
                    )}
                    {node.storylet.deploymentStatus === 'stage' && (
                      <circle cx={node.x + 20} cy={node.y + 12} r="4" fill="#f59e0b" />
                    )}
                    {hasErrors && (
                      <circle cx={node.x + 20} cy={node.y + 58} r="6" fill="#dc2626">
                        <title>Missing name or choices</title>
                      </circle>
                    )}
                    {hasConnectionIssues && (
                      <g>
                        <circle cx={node.x + 35} cy={node.y + 58} r="6" fill="#f97316" stroke="#fff" strokeWidth="1">
                          <title>{nodeIssues.map(issue => issue.message).join('; ')}</title>
                        </circle>
                        <text x={node.x + 35} y={node.y + 62} textAnchor="middle" className="fill-white pointer-events-none" fontSize="8" fontWeight="bold">
                          !
                        </text>
                      </g>
                    )}
                    {!hasConnections && !hasConnectionIssues && (
                      <circle cx={node.x + 35} cy={node.y + 58} r="4" fill="#6b7280" opacity="0.8">
                        <title>No connections to other storylets</title>
                      </circle>
                    )}
                    
                    {/* Flag count badge for flag-triggered storylets */}
                    {flagCount > 0 && (
                      <g>
                        <rect x={node.x + 145} y={node.y + 50} width="30" height="16" rx="8" fill="rgba(139, 92, 246, 0.9)" />
                        <text x={node.x + 160} y={node.y + 60} textAnchor="middle" className="fill-white" fontSize="10" fontWeight="bold">
                          {flagCount}🏁
                        </text>
                      </g>
                    )}
                    
                    {/* Edit button overlay */}
                    <circle
                      cx={node.x + 164}
                      cy={node.y + 16}
                      r="10"
                      fill="rgba(124, 58, 237, 0.9)"
                      className="cursor-pointer hover:fill-purple-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNodeDoubleClick(node.id);
                      }}
                    />
                    <text
                      x={node.x + 164}
                      y={node.y + 20}
                      textAnchor="middle"
                      className="fill-white pointer-events-none"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      ✏️
                    </text>
                  </g>
                  
                  {/* Text content with improved typography */}
                  <foreignObject
                    x={node.x + 8}
                    y={node.y + 8}
                    width="150"
                    height="54"
                    className="pointer-events-none"
                  >
                    <div className="text-white h-full flex flex-col justify-between" style={{lineHeight: '1.1'}}>
                      {/* Title with better line breaking */}
                      <div className="font-bold leading-tight" style={{fontSize: '13px', lineHeight: '1.15', height: '26px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                        {(node.storylet.name || 'Untitled Storylet').length > 25 ? 
                          (node.storylet.name || 'Untitled Storylet').substring(0, 22) + '...'
                          : (node.storylet.name || 'Untitled Storylet')
                        }
                      </div>
                      
                      {/* Trigger type with icon */}
                      <div className="text-xs opacity-90" style={{fontSize: '10px'}}>
                        {node.storylet.trigger?.type === 'time' && '⏰ '}
                        {node.storylet.trigger?.type === 'flag' && '🏁 '}
                        {node.storylet.trigger?.type === 'resource' && '💎 '}
                        {(node.storylet.trigger?.type || 'unknown').charAt(0).toUpperCase() + (node.storylet.trigger?.type || 'unknown').slice(1)} trigger
                      </div>
                      
                      {/* Choice count */}
                      <div className="text-xs opacity-80" style={{fontSize: '9px', fontWeight: '500'}}>
                        {node.storylet.choices?.length || 0} choice{(node.storylet.choices?.length || 0) !== 1 ? 's' : ''}
                        {node.storylet.choices?.some(c => c.nextStoryletId) && ' →'}
                      </div>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
            
            {/* Drag selection rectangle */}
            {isDragSelecting && dragSelection && (
              <rect
                x={Math.min(dragSelection.x1, dragSelection.x2)}
                y={Math.min(dragSelection.y1, dragSelection.y2)}
                width={Math.abs(dragSelection.x2 - dragSelection.x1)}
                height={Math.abs(dragSelection.y2 - dragSelection.y1)}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="#3b82f6"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            )}
          </svg>
          </div>
        </div>

        {/* Edit Panel */}
        {editingStorylet ? (
          <div className="w-[576px] space-y-4 max-h-full overflow-y-auto">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-purple-900">Edit Storylet</h3>
                  <div className="text-sm text-gray-600 font-mono">ID: {editFormData.id}</div>
                  <div className="flex items-center space-x-3 mt-1">
                    {hasUnsavedChanges && (
                      <span className="text-xs text-orange-600">● Unsaved changes</span>
                    )}
                    {lastSaveTime && (
                      <span className="text-xs text-green-600">
                        ✓ Saved {lastSaveTime.toLocaleTimeString()}
                      </span>
                    )}
                    <label className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={autoSaveEnabled}
                        onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                        className="text-xs"
                      />
                      <span className="text-xs text-gray-600">Auto-save</span>
                    </label>
                  </div>
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
                      <option value={arcName}>{arcName}</option>
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
                        const conditions = safeParseJSON(newText, null);
                        if (conditions !== null) {
                          console.log('🎯 Parsed conditions:', conditions);
                          const validatedConditions = validateTriggerConditions(conditions);
                          setEditFormData({
                            ...editFormData,
                            trigger: { ...editFormData.trigger!, conditions: validatedConditions }
                          });
                        } else {
                          console.log('🎯 Invalid JSON in trigger conditions (will not update form)');
                          // Invalid JSON, don't update form data but allow text editing
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded text-sm font-mono ${
                        (() => {
                          const parsed = safeParseJSON(triggerConditionsText, null);
                          return parsed !== null ? 'border-gray-300' : 'border-red-300 bg-red-50';
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
                      {editFormData.trigger?.type === 'time' && ' Day: ' + (editFormData.trigger?.conditions?.day ? formatConditionValue(editFormData.trigger.conditions.day) : 'none')}
                      {editFormData.trigger?.type === 'resource' && ' Resource conditions set'}
                    </span>
                    <span className={(() => {
                      const parsed = safeParseJSON(triggerConditionsText, null);
                      return parsed !== null ? 'text-green-600' : 'text-red-600';
                    })()}>
                      {(() => {
                        const parsed = safeParseJSON(triggerConditionsText, null);
                        return parsed !== null ? '✓ Valid JSON' : '✗ Invalid JSON';
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
                                    let newEffect: Effect = { type: e.target.value as Effect['type'] } as Effect;
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
                                  const clueEffect = effect as { type: 'clueDiscovery'; clueId: string; onSuccess?: Effect[]; onFailure?: Effect[] };
                                  return (
                                    <select
                                      value={clueEffect.clueId || ''}
                                      onChange={(e) => {
                                        console.log('🔍 Clue changed to:', e.target.value);
                                        updateEffect(choiceIndex, effectIndex, { 
                                          ...clueEffect,
                                          clueId: e.target.value
                                        });
                                      }}
                                      className="text-xs border rounded px-1 py-0.5 flex-1"
                                    >
                                      <option value="">Select a clue</option>
                                      {clues.map((clue) => (
                                        <option key={clue.id} value={clue.id}>
                                          {clue.title} ({clue.id})
                                        </option>
                                      ))}
                                    </select>
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
          selectedStorylet && (() => {
          const node = nodes.find(n => n.id === selectedStorylet.id);
          if (!node) return null;

          return (
            <div className="w-[480px] space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold text-lg mb-2">{node.storylet.name || 'Untitled Storylet'}</h3>
                <p className="text-sm text-gray-600 mb-4">{node.storylet.description || 'No description available'}</p>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Trigger:</span>
                    <div className="text-sm text-gray-600">
                      {node.storylet.trigger?.type || 'unknown'}
                      {node.storylet.trigger?.type === 'flag' && (
                        <div className="ml-2 text-xs">
                          Requires: {node.storylet.trigger?.conditions?.flags?.join(', ') || 'none'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-700">Choices:</span>
                    <div className="space-y-2 mt-1">
                      {(node.storylet.choices || []).map(choice => (
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
                    .filter(edge => edge.from === selectedStorylet.id)
                    .map(edge => {
                      const targetNode = nodes.find(n => n.id === edge.to);
                      return targetNode ? (
                        <div key={edge.to} className="text-sm">
                          <div className="font-medium text-green-700">→ {targetNode.storylet.name}</div>
                          <div className="text-xs text-gray-500">via "{edge.choiceText}"</div>
                        </div>
                      ) : null;
                    })}
                  {edges.filter(edge => edge.from === selectedStorylet.id).length === 0 && (
                    <div className="text-sm text-gray-500">No outgoing connections</div>
                  )}
                </div>
              </Card>
            </div>
          );
        })()
        )}
      </div>
      
      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-xs font-semibold text-gray-500 border-b border-gray-200 mb-1">
            Create New Storylet
          </div>
          <button
            onClick={() => createNewStorylet('basic')}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <span>📄</span>
            <span>Basic Storylet</span>
          </button>
          <button
            onClick={() => createNewStorylet('choice_hub')}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <span>🔀</span>
            <span>Choice Hub (3 options)</span>
          </button>
          <button
            onClick={() => createNewStorylet('branch_point')}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <span>🌿</span>
            <span>Branch Point (2 paths)</span>
          </button>
        </div>
      )}
    </Card>
  );
};

export default StoryArcVisualizer;