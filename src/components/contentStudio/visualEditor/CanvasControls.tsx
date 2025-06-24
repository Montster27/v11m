// /Users/montysharma/V11M2/src/components/contentStudio/visualEditor/CanvasControls.tsx
// Canvas control panel for zoom, pan, and view options

import React from 'react';
import { CanvasState } from './types';

interface CanvasControlsProps {
  canvasState: CanvasState;
  onZoomChange: (zoom: number) => void;
  onZoomFit: () => void;
  onZoomReset: () => void;
  onCenterCanvas: () => void;
  onClearCanvas: () => void;
  onToggleGrid?: () => void;
  showGrid?: boolean;
  nodeCount: number;
  connectionCount: number;
}

const CanvasControls: React.FC<CanvasControlsProps> = ({
  canvasState,
  onZoomChange,
  onZoomFit,
  onZoomReset,
  onCenterCanvas,
  onClearCanvas,
  onToggleGrid,
  showGrid = true,
  nodeCount,
  connectionCount
}) => {
  const handleZoomIn = () => {
    const newZoom = Math.min(canvasState.zoom * 1.2, 3);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(canvasState.zoom / 1.2, 0.1);
    onZoomChange(newZoom);
  };

  const zoomPercentage = Math.round(canvasState.zoom * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Canvas Controls</h3>
      
      {/* Zoom Controls */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">Zoom</label>
          <div className="flex items-center space-x-2 mb-2">
            <button
              onClick={handleZoomOut}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              title="Zoom Out"
            >
              ➖
            </button>
            <div className="flex-1 text-center text-sm font-mono bg-gray-50 py-1 px-2 rounded border">
              {zoomPercentage}%
            </div>
            <button
              onClick={handleZoomIn}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              title="Zoom In"
            >
              ➕
            </button>
          </div>
          
          {/* Zoom Slider */}
          <input
            type="range"
            min="10"
            max="300"
            value={zoomPercentage}
            onChange={(e) => onZoomChange(parseInt(e.target.value) / 100)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Quick Zoom Actions */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">Quick Actions</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onZoomFit}
              className="px-2 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              🔍 Fit All
            </button>
            <button
              onClick={onZoomReset}
              className="px-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              ↺ Reset
            </button>
            <button
              onClick={onCenterCanvas}
              className="px-2 py-1.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              ⊹ Center
            </button>
            {onToggleGrid && (
              <button
                onClick={onToggleGrid}
                className={`px-2 py-1.5 text-xs rounded transition-colors ${
                  showGrid 
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⊞ Grid
              </button>
            )}
          </div>
        </div>

        {/* Canvas Info */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">Canvas Info</label>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Nodes:</span>
              <span className="font-mono">{nodeCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Connections:</span>
              <span className="font-mono">{connectionCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Pan X:</span>
              <span className="font-mono">{Math.round(canvasState.pan.x)}</span>
            </div>
            <div className="flex justify-between">
              <span>Pan Y:</span>
              <span className="font-mono">{Math.round(canvasState.pan.y)}</span>
            </div>
          </div>
        </div>

        {/* Selection Info */}
        {(canvasState.selectedNodes.size > 0 || canvasState.selectedConnections.size > 0) && (
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Selection</label>
            <div className="space-y-1 text-xs text-gray-600">
              {canvasState.selectedNodes.size > 0 && (
                <div className="flex justify-between">
                  <span>Selected Nodes:</span>
                  <span className="font-mono">{canvasState.selectedNodes.size}</span>
                </div>
              )}
              {canvasState.selectedConnections.size > 0 && (
                <div className="flex justify-between">
                  <span>Selected Connections:</span>
                  <span className="font-mono">{canvasState.selectedConnections.size}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="pt-4 border-t border-gray-200">
          <label className="text-xs font-medium text-red-600 mb-2 block">Danger Zone</label>
          <button
            onClick={onClearCanvas}
            className="w-full px-2 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            🗑️ Clear Canvas
          </button>
          <p className="text-xs text-gray-500 mt-1">
            This will remove all nodes and connections
          </p>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <label className="text-xs font-medium text-gray-600 mb-2 block">Shortcuts</label>
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Zoom In/Out:</span>
            <span className="font-mono">Ctrl + Scroll</span>
          </div>
          <div className="flex justify-between">
            <span>Pan Canvas:</span>
            <span className="font-mono">Middle Click + Drag</span>
          </div>
          <div className="flex justify-between">
            <span>Select Multiple:</span>
            <span className="font-mono">Ctrl + Click</span>
          </div>
          <div className="flex justify-between">
            <span>Delete Selected:</span>
            <span className="font-mono">Delete</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasControls;