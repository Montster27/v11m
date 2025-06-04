// /Users/montysharma/V11M2/src/components/StoryletProgress.tsx

import React, { useState } from 'react';
import { useSaveStore } from '../store/useSaveStore';
import { useStoryletStore } from '../store/useStoryletStore';
import type { StoryletCompletion } from '../types/save';
import Button from './ui/Button';

interface StoryletProgressProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoryletProgress: React.FC<StoryletProgressProps> = ({ isOpen, onClose }) => {
  const { getStoryletCompletions, getStoryletStats } = useSaveStore();
  const { allStorylets } = useStoryletStore();
  const [activeTab, setActiveTab] = useState<'completed' | 'statistics' | 'available'>('completed');
  const [sortBy, setSortBy] = useState<'timestamp' | 'day' | 'storylet'>('timestamp');

  if (!isOpen) return null;

  const completions = getStoryletCompletions();
  const stats = getStoryletStats();

  // Sort completions based on selected criteria
  const sortedCompletions = [...completions].sort((a, b) => {
    switch (sortBy) {
      case 'timestamp':
        return b.timestamp - a.timestamp;
      case 'day':
        return b.day - a.day;
      case 'storylet':
        return a.storyletId.localeCompare(b.storyletId);
      default:
        return b.timestamp - a.timestamp;
    }
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStoryletName = (storyletId: string) => {
    return allStorylets[storyletId]?.name || storyletId;
  };

  // Get available storylets (not yet completed)
  const availableStorylets = Object.values(allStorylets).filter(
    storylet => !completions.some(c => c.storyletId === storylet.id)
  );

  // Calculate completion rate by day
  const completionsByDay = Object.entries(stats.completionsByDay)
    .map(([day, count]) => ({ day: parseInt(day), count }))
    .sort((a, b) => a.day - b.day);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">📚 Storylet Progress</h2>
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
            { id: 'completed', label: '✅ Completed', icon: '📝' },
            { id: 'statistics', label: '📊 Statistics', icon: '📈' },
            { id: 'available', label: '🎯 Available', icon: '🔓' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {activeTab === 'completed' && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="font-medium">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="timestamp">Most Recent</option>
                    <option value="day">Game Day</option>
                    <option value="storylet">Storylet Name</option>
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  {completions.length} storylet{completions.length !== 1 ? 's' : ''} completed
                </div>
              </div>

              {/* Completion List */}
              {completions.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                  <div className="text-4xl mb-4">📝</div>
                  <div className="text-lg font-medium mb-2">No storylets completed yet</div>
                  <div>Start playing to see your storylet progress here!</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedCompletions.map((completion, index) => (
                    <div key={`${completion.storyletId}-${completion.timestamp}`} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">📖</span>
                            <h4 className="font-bold text-lg">
                              {getStoryletName(completion.storyletId)}
                            </h4>
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                              Day {completion.day}
                            </span>
                          </div>
                          
                          <div className="mb-3">
                            <div className="font-medium text-green-700 mb-1">
                              🎯 Choice Made: {completion.choice.text}
                            </div>
                            <div className="text-sm text-gray-600">
                              Storylet ID: {completion.storyletId}
                            </div>
                          </div>

                          {/* Effects */}
                          {completion.choice.effects && completion.choice.effects.length > 0 && (
                            <div className="mb-2">
                              <div className="text-sm font-medium text-gray-700 mb-1">Effects:</div>
                              <div className="flex flex-wrap gap-2">
                                {completion.choice.effects.map((effect, effectIndex) => (
                                  <span
                                    key={effectIndex}
                                    className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                                  >
                                    {effect.type === 'resource' && `${effect.key} ${effect.delta >= 0 ? '+' : ''}${effect.delta}`}
                                    {effect.type === 'skillXp' && `${effect.key} +${effect.amount} XP`}
                                    {effect.type === 'flag' && `${effect.key}: ${effect.value}`}
                                    {effect.type === 'unlock' && `Unlock: ${effect.storyletId}`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-gray-500">
                            Completed: {formatDate(completion.timestamp)}
                          </div>
                        </div>
                        
                        <div className="text-right ml-4">
                          <div className="text-sm font-medium text-gray-600">
                            #{index + 1}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="space-y-6">
              {/* Overall Stats */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-4">📊 Overall Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.totalCompleted}</div>
                    <div className="text-sm text-gray-600">Total Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{Object.keys(allStorylets).length}</div>
                    <div className="text-sm text-gray-600">Total Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((stats.totalCompleted / Object.keys(allStorylets).length) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Object.keys(stats.completionsByDay).length}
                    </div>
                    <div className="text-sm text-gray-600">Active Days</div>
                  </div>
                </div>
              </div>

              {/* Daily Activity */}
              {completionsByDay.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4">📅 Daily Activity</h3>
                  <div className="space-y-2">
                    {completionsByDay.map(({ day, count }) => (
                      <div key={day} className="flex items-center">
                        <div className="w-16 text-sm font-medium">Day {day}:</div>
                        <div className="flex-1 mx-2">
                          <div 
                            className="bg-purple-200 h-4 rounded"
                            style={{
                              width: `${Math.min(100, (count / Math.max(...completionsByDay.map(d => d.count))) * 100)}%`
                            }}
                          />
                        </div>
                        <div className="w-8 text-sm text-right">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Choice Frequency */}
              {Object.keys(stats.choiceFrequency).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4">🎯 Most Common Choices</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.choiceFrequency)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 10)
                      .map(([choiceKey, frequency]) => {
                        const [storyletId, choiceId] = choiceKey.split(':');
                        const storylet = allStorylets[storyletId];
                        const choice = storylet?.choices.find(c => c.id === choiceId);
                        
                        return (
                          <div key={choiceKey} className="flex items-center">
                            <div className="flex-1">
                              <div className="font-medium">{storylet?.name || storyletId}</div>
                              <div className="text-sm text-gray-600">{choice?.text || choiceId}</div>
                            </div>
                            <div className="text-sm font-medium text-purple-600">
                              {frequency}x
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'available' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold">🎯 Available Storylets</h3>
                <div className="text-sm text-gray-600">
                  {availableStorylets.length} storylet{availableStorylets.length !== 1 ? 's' : ''} not yet completed
                </div>
              </div>

              {availableStorylets.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                  <div className="text-4xl mb-4">🎉</div>
                  <div className="text-lg font-medium mb-2">All storylets completed!</div>
                  <div>You've experienced every storylet available. Amazing!</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableStorylets.map((storylet) => (
                    <div key={storylet.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-2">{storylet.name}</h4>
                          <p className="text-gray-600 mb-3">{storylet.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="font-medium">Trigger:</span> {storylet.trigger.type}
                            </div>
                            <div>
                              <span className="font-medium">Choices:</span> {storylet.choices.length}
                            </div>
                          </div>
                          
                          {/* Trigger conditions */}
                          <div className="mt-2 text-sm text-gray-500">
                            <span className="font-medium">Conditions:</span>{' '}
                            {JSON.stringify(storylet.trigger.conditions)}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                            {storylet.trigger.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center text-sm text-gray-600">
          <div>
            📚 Track your storylet journey and choices
          </div>
          <div>
            {stats.totalCompleted}/{Object.keys(allStorylets).length} completed
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryletProgress;
