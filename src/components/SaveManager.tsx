// /Users/montysharma/V11M2/src/components/SaveManager.tsx

import React, { useState } from 'react';
import { useSocialStore } from '../stores/v2';
import type { SaveSlot } from '../types/save';
import Button from './ui/Button';

interface SaveManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaveManager: React.FC<SaveManagerProps> = ({ isOpen, onClose }) => {
  // Migrated to v2 consolidated store
  const saveSlots = useSocialStore(state => state.saves.saveSlots);
  const currentSaveId = useSocialStore(state => state.saves.currentSaveId);
  const createSaveSlot = useSocialStore(state => state.createSaveSlot);
  const loadSaveSlot = useSocialStore(state => state.loadSaveSlot);
  const deleteSaveSlot = useSocialStore(state => state.deleteSaveSlot);
  const updateSaveSlot = useSocialStore(state => state.updateSaveSlot);
  
  // TODO: Implement export/import functionality in useSocialStore
  const exportSave = (saveId: string) => {
    console.log('Export functionality temporarily disabled during v2 migration');
  };
  const importSave = (saveData: string) => {
    console.log('Import functionality temporarily disabled during v2 migration');
  };
  
  const [newSaveName, setNewSaveName] = useState('');
  const [importData, setImportData] = useState('');
  const [activeTab, setActiveTab] = useState<'saves' | 'import' | 'export'>('saves');
  const [selectedSaveForExport, setSelectedSaveForExport] = useState<string>('');

  if (!isOpen) return null;

  // Convert saveSlots object to array for display
  const saveSlotArray = Object.entries(saveSlots).map(([id, data]) => ({
    id,
    ...data
  }));

  const handleCreateSave = () => {
    if (newSaveName.trim()) {
      try {
        // Generate a unique save ID
        const saveId = `save_${Date.now()}`;
        // Create basic save data - TODO: capture full game state
        const saveData = {
          name: newSaveName.trim(),
          timestamp: Date.now()
        };
        createSaveSlot(saveId, saveData);
        setNewSaveName('');
        alert(`Save created: ${newSaveName}`);
      } catch (error) {
        console.error('Failed to create save:', error);
        alert('Failed to create save. Please try again.');
      }
    }
  };

  const handleLoadSave = (saveId: string) => {
    try {
      loadSaveSlot(saveId);
      alert('Save loaded successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to load save:', error);
      alert('Failed to load save.');
    }
  };

  const handleDeleteSave = (saveId: string, saveName: string) => {
    if (confirm(`Are you sure you want to delete save "${saveName}"?`)) {
      deleteSaveSlot(saveId);
    }
  };

  const handleUpdateCurrentSave = () => {
    if (currentSaveId) {
      try {
        // TODO: Capture full game state for save data
        const saveData = {
          name: saveSlots[currentSaveId]?.name || 'Updated Save',
          timestamp: Date.now()
        };
        updateSaveSlot(currentSaveId, saveData);
        alert('Current save updated successfully!');
      } catch (error) {
        console.error('Failed to update current save:', error);
        alert('Failed to update save.');
      }
    } else {
      alert('No current save to update.');
    }
  };

  const handleExportSave = () => {
    if (selectedSaveForExport) {
      const exportData = exportSave(selectedSaveForExport);
      if (exportData) {
        // Copy to clipboard
        navigator.clipboard.writeText(exportData).then(() => {
          alert('Save data copied to clipboard!');
        }).catch(() => {
          // Fallback: show in textarea for manual copy
          const textarea = document.createElement('textarea');
          textarea.value = exportData;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          alert('Save data copied to clipboard!');
        });
      }
    }
  };

  const handleImportSave = () => {
    if (importData.trim()) {
      if (importSave(importData.trim())) {
        setImportData('');
        alert('Save imported successfully!');
      } else {
        alert('Failed to import save. Please check the format.');
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSaveStatusIcon = (saveId: string) => {
    return currentSaveId === saveId ? '🟢' : '⚪';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">💾 Save Manager</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'saves', label: '💾 Save Files', icon: '📁' },
            { id: 'import', label: '📥 Import', icon: '⬇️' },
            { id: 'export', label: '📤 Export', icon: '⬆️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {activeTab === 'saves' && (
            <div className="space-y-4">
              {/* Create New Save */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-bold mb-3">🆕 Create New Save</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSaveName}
                    onChange={(e) => setNewSaveName(e.target.value)}
                    placeholder="Enter save name..."
                    className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateSave()}
                  />
                  <Button onClick={handleCreateSave} disabled={!newSaveName.trim()}>
                    💾 Save Current Game
                  </Button>
                </div>
                {currentSaveId && (
                  <div className="mt-2">
                    <Button 
                      onClick={handleUpdateCurrentSave}
                      variant="secondary"
                      className="text-sm"
                    >
                      🔄 Update Current Save
                    </Button>
                  </div>
                )}
              </div>

              {/* Save Slots */}
              <div className="space-y-3">
                <h3 className="font-bold">📁 Saved Games ({saveSlotArray.length})</h3>
                {saveSlotArray.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                    No saves yet. Create your first save above!
                  </div>
                ) : (
                  saveSlotArray
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((slot) => (
                      <div key={slot.id} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{getSaveStatusIcon(slot.id)}</span>
                              <h4 className="font-bold text-lg">{slot.name}</h4>
                              {currentSaveId === slot.id && (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                  CURRENT
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                              <div>
                                <strong>Character:</strong><br />
                                {slot.characterName || 'Unnamed'}
                              </div>
                              <div>
                                <strong>Day:</strong><br />
                                {slot.gameDay}
                              </div>
                              <div>
                                <strong>Level:</strong><br />
                                {slot.preview.level}
                              </div>
                              <div>
                                <strong>Storylets:</strong><br />
                                {slot.preview.storyletsCompleted}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              Saved: {formatDate(slot.timestamp)}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              onClick={() => handleLoadSave(slot.id)}
                              variant="secondary"
                              className="text-sm"
                              disabled={currentSaveId === slot.id}
                            >
                              📂 Load
                            </Button>
                            <Button
                              onClick={() => handleDeleteSave(slot.id, slot.name)}
                              variant="secondary"
                              className="text-sm text-red-600 hover:bg-red-50"
                            >
                              🗑️ Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-bold mb-3">📤 Export Save Data</h3>
                <p className="text-gray-600 mb-4">
                  Export save data to share with others or create backups.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Save to Export:</label>
                    <select
                      value={selectedSaveForExport}
                      onChange={(e) => setSelectedSaveForExport(e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a save...</option>
                      {saveSlots.map(slot => (
                        <option key={slot.id} value={slot.id}>
                          {slot.name} (Day {slot.gameDay})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button 
                    onClick={handleExportSave}
                    disabled={!selectedSaveForExport}
                    className="w-full"
                  >
                    📋 Copy Save Data to Clipboard
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-bold mb-3">📥 Import Save Data</h3>
                <p className="text-gray-600 mb-4">
                  Paste save data from another game or backup to import it.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Save Data (JSON):</label>
                    <textarea
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="Paste exported save data here..."
                      className="w-full h-32 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  </div>
                  <Button 
                    onClick={handleImportSave}
                    disabled={!importData.trim()}
                    className="w-full"
                  >
                    📥 Import Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center text-sm text-gray-600">
          <div>
            💡 Tip: Saves are stored locally in your browser. Export saves to keep backups!
          </div>
          <div>
            {saveSlotArray.length} save{saveSlotArray.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveManager;
