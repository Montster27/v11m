// /Users/montysharma/V11M2/src/components/contentStudio/visualEditor/ArcExportImport.tsx
// Arc export/import functionality for saving and loading story arcs

import React, { useState } from 'react';
import { StoryArc, FlowNode, FlowConnection } from './types';

interface ArcExportImportProps {
  currentArc: StoryArc | null;
  onImport: (arc: StoryArc) => void;
  onExport: (arc: StoryArc) => void;
  onSaveArc: (arc: StoryArc) => void;
  onLoadArc: (arcId: string) => void;
  savedArcs: StoryArc[];
}

const ArcExportImport: React.FC<ArcExportImportProps> = ({
  currentArc,
  onImport,
  onExport,
  onSaveArc,
  onLoadArc,
  savedArcs
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [exportText, setExportText] = useState('');
  const [arcName, setArcName] = useState('');
  const [arcDescription, setArcDescription] = useState('');

  const handleExport = () => {
    if (!currentArc) return;
    
    const exportData = {
      version: '1.0',
      arc: currentArc,
      timestamp: new Date().toISOString(),
      metadata: {
        nodeCount: currentArc.nodes.length,
        connectionCount: currentArc.connections.length,
        hasEntryPoints: currentArc.entryPoints.length > 0,
        hasExitPoints: currentArc.exitPoints.length > 0,
        isValid: currentArc.isValid
      }
    };
    
    setExportText(JSON.stringify(exportData, null, 2));
    setShowExportModal(true);
    
    if (onExport) {
      onExport(currentArc);
    }
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      
      // Validate import data structure
      if (!data.arc || !data.arc.nodes || !data.arc.connections) {
        throw new Error('Invalid arc format');
      }
      
      // Validate required fields
      const arc = data.arc as StoryArc;
      if (!arc.id || !arc.name) {
        throw new Error('Arc must have id and name');
      }
      
      onImport(arc);
      setShowImportModal(false);
      setImportText('');
    } catch (error) {
      alert(`Import failed: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  };

  const handleSave = () => {
    if (!currentArc || !arcName.trim()) return;
    
    const arcToSave: StoryArc = {
      ...currentArc,
      name: arcName.trim(),
      description: arcDescription.trim()
    };
    
    onSaveArc(arcToSave);
    setShowSaveModal(false);
    setArcName('');
    setArcDescription('');
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      alert('Arc data copied to clipboard!');
    } catch (error) {
      alert('Failed to copy to clipboard');
    }
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([exportText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentArc?.name || 'story-arc'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Arc Management</h3>
      
      <div className="space-y-3">
        {/* Current Arc Info */}
        {currentArc && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <h4 className="font-medium text-blue-900 text-sm">{currentArc.name}</h4>
            <div className="text-xs text-blue-700 mt-1 space-y-0.5">
              <div>Nodes: {currentArc.nodes.length}</div>
              <div>Connections: {currentArc.connections.length}</div>
              <div>Status: {currentArc.isValid ? '✅ Valid' : '⚠️ Invalid'}</div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={!currentArc}
            className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💾 Save Arc
          </button>
          <button
            onClick={handleExport}
            disabled={!currentArc}
            className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📤 Export
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
          >
            📥 Import
          </button>
          <button
            onClick={() => {/* Load modal logic */}}
            className="px-3 py-2 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
          >
            📁 Load Arc
          </button>
        </div>

        {/* Saved Arcs */}
        {savedArcs.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
              Saved Arcs ({savedArcs.length})
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {savedArcs.map((arc) => (
                <div
                  key={arc.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded border text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{arc.name}</div>
                    <div className="text-gray-500">
                      {arc.nodes.length} nodes, {arc.connections.length} connections
                    </div>
                  </div>
                  <button
                    onClick={() => onLoadArc(arc.id)}
                    className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Story Arc</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arc Name</label>
                <input
                  type="text"
                  value={arcName}
                  onChange={(e) => setArcName(e.target.value)}
                  placeholder="Enter arc name"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={arcDescription}
                  onChange={(e) => setArcDescription(e.target.value)}
                  placeholder="Describe this story arc"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!arcName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Save Arc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-4 w-full max-h-[80vh] overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Story Arc</h3>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Copy the JSON data below or download as a file:
              </p>
              
              <textarea
                value={exportText}
                readOnly
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-xs bg-gray-50"
              />
              
              <div className="flex space-x-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                >
                  📋 Copy to Clipboard
                </button>
                <button
                  onClick={handleDownloadJSON}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                >
                  💾 Download JSON
                </button>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-4 w-full max-h-[80vh] overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Story Arc</h3>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Paste the exported JSON data below:
              </p>
              
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste JSON data here..."
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-xs"
              />
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Import Arc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArcExportImport;