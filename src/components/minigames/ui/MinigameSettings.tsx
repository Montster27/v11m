// /Users/montysharma/V11M2/src/components/minigames/ui/MinigameSettings.tsx
// Enhanced settings panel for minigame preferences

import React, { useState } from 'react';
import { Card, Button } from '../../ui';
import { useMinigameStore } from '../../../stores/useMinigameStore';

interface MinigameSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const MinigameSettings: React.FC<MinigameSettingsProps> = ({
  isOpen,
  onClose
}) => {
  const minigameStore = useMinigameStore();
  const [activeTab, setActiveTab] = useState<'general' | 'accessibility' | 'data'>('general');

  if (!isOpen) return null;

  const handlePreferenceUpdate = (key: string, value: any) => {
    minigameStore.updatePreferences({ [key]: value });
  };

  const exportData = () => {
    const data = minigameStore.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minigame-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const success = minigameStore.importData(data);
        if (success) {
          alert('Data imported successfully!');
        } else {
          alert('Failed to import data. Please check the file format.');
        }
      } catch (error) {
        alert('Invalid file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const resetAllData = () => {
    if (confirm('Are you sure you want to reset all minigame data? This cannot be undone.')) {
      minigameStore.resetAllStats();
      alert('All data has been reset.');
    }
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: '⚙️' },
    { id: 'accessibility' as const, label: 'Accessibility', icon: '♿' },
    { id: 'data' as const, label: 'Data', icon: '💾' }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      {/* Sound Settings */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Audio</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Enable sound effects</span>
            <input
              type="checkbox"
              checked={minigameStore.preferences.enableSounds}
              onChange={(e) => handlePreferenceUpdate('enableSounds', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Gameplay Settings */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Gameplay</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Show tutorials for new games</span>
            <input
              type="checkbox"
              checked={minigameStore.preferences.enableTutorials}
              onChange={(e) => handlePreferenceUpdate('enableTutorials', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Enable hints</span>
            <input
              type="checkbox"
              checked={minigameStore.preferences.enableHints}
              onChange={(e) => handlePreferenceUpdate('enableHints', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Show timers</span>
            <input
              type="checkbox"
              checked={minigameStore.preferences.enableTimers}
              onChange={(e) => handlePreferenceUpdate('enableTimers', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Difficulty Settings */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Difficulty</h3>
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm text-gray-700 mb-2 block">Preferred difficulty</span>
            <select
              value={minigameStore.preferences.preferredDifficulty}
              onChange={(e) => handlePreferenceUpdate('preferredDifficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="auto">Auto (Adaptive)</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </label>
        </div>
      </div>

      {/* Animation Settings */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Visual</h3>
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm text-gray-700 mb-2 block">Animation speed</span>
            <select
              value={minigameStore.preferences.animationSpeed}
              onChange={(e) => handlePreferenceUpdate('animationSpeed', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );

  const renderAccessibilitySettings = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Accessibility Features</h3>
        <p className="text-sm text-blue-800">
          These settings help make minigames more accessible for players with different needs.
        </p>
      </div>

      {/* Visual Accessibility */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Visual</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-700">Reduce motion effects</span>
              <p className="text-xs text-gray-500">Minimizes animations and transitions</p>
            </div>
            <input
              type="checkbox"
              checked={minigameStore.preferences.animationSpeed === 'slow'}
              onChange={(e) => handlePreferenceUpdate('animationSpeed', e.target.checked ? 'slow' : 'normal')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Cognitive Accessibility */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Cognitive</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-700">Always show hints</span>
              <p className="text-xs text-gray-500">Display helpful hints throughout games</p>
            </div>
            <input
              type="checkbox"
              checked={minigameStore.preferences.enableHints}
              onChange={(e) => handlePreferenceUpdate('enableHints', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-700">Extended time limits</span>
              <p className="text-xs text-gray-500">Increases time available for timed games</p>
            </div>
            <input
              type="checkbox"
              checked={minigameStore.preferences.preferredDifficulty === 'easy'}
              onChange={(e) => handlePreferenceUpdate('preferredDifficulty', e.target.checked ? 'easy' : 'auto')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Motor Accessibility */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Motor</h3>
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <p>Motor accessibility features are game-specific and will be applied automatically based on your settings.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => {
    const overallStats = minigameStore.getOverallStats();
    
    return (
      <div className="space-y-6">
        {/* Statistics Overview */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Your Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">{overallStats.totalGames}</div>
              <div className="text-sm text-gray-600">Total Games</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(overallStats.overallWinRate * 100)}%
              </div>
              <div className="text-sm text-gray-600">Win Rate</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {Math.round(overallStats.totalPlayTime / 60000)}m
              </div>
              <div className="text-sm text-gray-600">Play Time</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {Object.keys(minigameStore.achievements).length}
              </div>
              <div className="text-sm text-gray-600">Achievements</div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Data Management</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900">Export Data</span>
                <p className="text-xs text-gray-600">Download your progress and statistics</p>
              </div>
              <Button onClick={exportData} variant="outline" className="text-sm">
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900">Import Data</span>
                <p className="text-xs text-gray-600">Restore from a backup file</p>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
                <Button variant="outline" className="text-sm">
                  Import
                </Button>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div>
                <span className="text-sm font-medium text-red-900">Reset All Data</span>
                <p className="text-xs text-red-700">Permanently delete all progress</p>
              </div>
              <Button onClick={resetAllData} variant="outline" className="text-sm text-red-600 border-red-300 hover:bg-red-100">
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Privacy</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>All your minigame data is stored locally in your browser.</p>
            <p>No data is sent to external servers unless you explicitly export it.</p>
            <p>You can delete all data at any time using the reset function above.</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-2xl w-full m-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Minigame Settings</h1>
            <Button onClick={onClose} variant="outline" className="text-white border-white hover:bg-white/20">
              ✕ Close
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'accessibility' && renderAccessibilitySettings()}
          {activeTab === 'data' && renderDataSettings()}
        </div>
      </Card>
    </div>
  );
};

export default MinigameSettings;