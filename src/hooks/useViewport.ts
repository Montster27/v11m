// Custom hook for viewport management (zoom, pan, view controls)
// Handles all viewport transformations and interactions

import { useState, useCallback, useRef, useEffect } from 'react';

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface ViewportConfig {
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  panSensitivity: number;
  wheelSensitivity: number;
}

export interface ViewportHook {
  // State
  zoom: number;
  panX: number;
  panY: number;
  viewBox: string;
  isZooming: boolean;
  
  // Actions
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetView: () => void;
  handleWheel: (e: React.WheelEvent) => void;
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  
  // Utilities
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };
  worldToScreen: (worldX: number, worldY: number) => { x: number; y: number };
  fitToNodes: (nodes: Array<{ x: number; y: number }>) => void;
}

const DEFAULT_CONFIG: ViewportConfig = {
  minZoom: 0.1,
  maxZoom: 3.0,
  zoomStep: 0.1,
  panSensitivity: 1.0,
  wheelSensitivity: 0.002
};

const DEFAULT_VIEWPORT: ViewportState = {
  zoom: 1.0,
  panX: 0,
  panY: 0
};

/**
 * Custom hook for viewport management
 */
export function useViewport(
  svgWidth: number = 800,
  svgHeight: number = 600,
  config: Partial<ViewportConfig> = {}
): ViewportHook {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [viewport, setViewport] = useState<ViewportState>(DEFAULT_VIEWPORT);
  const [isZooming, setIsZooming] = useState(false);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate viewBox string for SVG
  const viewBox = `${-viewport.panX} ${-viewport.panY} ${svgWidth / viewport.zoom} ${svgHeight / viewport.zoom}`;

  // Zoom timeout management
  useEffect(() => {
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }
    
    if (isZooming) {
      zoomTimeoutRef.current = setTimeout(() => {
        setIsZooming(false);
      }, 300); // 300ms delay after zoom stops
    }

    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, [isZooming, viewport.zoom]);

  // Clamp zoom to valid range
  const clampZoom = useCallback((zoom: number): number => {
    return Math.max(finalConfig.minZoom, Math.min(finalConfig.maxZoom, zoom));
  }, [finalConfig.minZoom, finalConfig.maxZoom]);

  // Set zoom level
  const setZoom = useCallback((newZoom: number) => {
    const clampedZoom = clampZoom(newZoom);
    setViewport(prev => ({ ...prev, zoom: clampedZoom }));
    setIsZooming(true);
  }, [clampZoom]);

  // Set pan position
  const setPan = useCallback((panX: number, panY: number) => {
    setViewport(prev => ({ ...prev, panX, panY }));
  }, []);

  // Zoom in
  const handleZoomIn = useCallback(() => {
    setZoom(viewport.zoom + finalConfig.zoomStep);
  }, [viewport.zoom, finalConfig.zoomStep, setZoom]);

  // Zoom out
  const handleZoomOut = useCallback(() => {
    setZoom(viewport.zoom - finalConfig.zoomStep);
  }, [viewport.zoom, finalConfig.zoomStep, setZoom]);

  // Reset view to default
  const handleResetView = useCallback(() => {
    setViewport(DEFAULT_VIEWPORT);
    setIsZooming(false);
  }, []);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate zoom delta
    const delta = -e.deltaY * finalConfig.wheelSensitivity;
    const newZoom = clampZoom(viewport.zoom + delta);
    
    if (newZoom !== viewport.zoom) {
      // Calculate new pan to keep zoom centered
      const zoomRatio = newZoom / viewport.zoom;
      const newPanX = viewport.panX + (centerX / viewport.zoom) * (1 - zoomRatio);
      const newPanY = viewport.panY + (centerY / viewport.zoom) * (1 - zoomRatio);
      
      setViewport({
        zoom: newZoom,
        panX: newPanX,
        panY: newPanY
      });
      setIsZooming(true);
    }
  }, [viewport, finalConfig.wheelSensitivity, clampZoom]);

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX / viewport.zoom) - viewport.panX,
      y: (screenY / viewport.zoom) - viewport.panY
    };
  }, [viewport]);

  // Convert world coordinates to screen coordinates
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    return {
      x: (worldX + viewport.panX) * viewport.zoom,
      y: (worldY + viewport.panY) * viewport.zoom
    };
  }, [viewport]);

  // Fit viewport to show all nodes
  const fitToNodes = useCallback((nodes: Array<{ x: number; y: number }>) => {
    if (nodes.length === 0) {
      handleResetView();
      return;
    }

    // Calculate bounding box
    let minX = nodes[0].x;
    let maxX = nodes[0].x;
    let minY = nodes[0].y;
    let maxY = nodes[0].y;

    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    });

    // Add padding
    const padding = 100;
    const contentWidth = maxX - minX + 2 * padding;
    const contentHeight = maxY - minY + 2 * padding;

    // Calculate zoom to fit content
    const zoomX = svgWidth / contentWidth;
    const zoomY = svgHeight / contentHeight;
    const newZoom = clampZoom(Math.min(zoomX, zoomY));

    // Center content
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const newPanX = (svgWidth / 2) / newZoom - centerX;
    const newPanY = (svgHeight / 2) / newZoom - centerY;

    setViewport({
      zoom: newZoom,
      panX: newPanX,
      panY: newPanY
    });
  }, [svgWidth, svgHeight, clampZoom, handleResetView]);

  return {
    // State
    zoom: viewport.zoom,
    panX: viewport.panX,
    panY: viewport.panY,
    viewBox,
    isZooming,
    
    // Actions
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleWheel,
    setZoom,
    setPan,
    
    // Utilities
    screenToWorld,
    worldToScreen,
    fitToNodes
  };
}

/**
 * Hook for mouse drag interactions with viewport
 */
export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startPanX: number;
  startPanY: number;
}

export interface DragHook {
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
}

export function useViewportDrag(
  setPan: (panX: number, panY: number) => void,
  currentPanX: number,
  currentPanY: number,
  zoom: number
): DragHook {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setDragState({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: currentPanX,
        startPanY: currentPanY
      });
    }
  }, [currentPanX, currentPanY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragState.isDragging) {
      const deltaX = (e.clientX - dragState.startX) / zoom;
      const deltaY = (e.clientY - dragState.startY) / zoom;
      
      setPan(
        dragState.startPanX + deltaX,
        dragState.startPanY + deltaY
      );
    }
  }, [dragState, setPan, zoom]);

  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false }));
  }, []);

  return {
    isDragging: dragState.isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
}