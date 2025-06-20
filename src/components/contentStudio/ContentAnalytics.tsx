// /Users/montysharma/V11M2/src/components/contentStudio/ContentAnalytics.tsx

import React, { useState, useEffect } from 'react';
import { useStoryletStore } from '../../store/useStoryletStore';
import HelpTooltip from '../ui/HelpTooltip';

interface ContentMetrics {
  totalStorylets: number;
  activeStorylets: number;
  completedStorylets: number;
  completionRate: number;
  topStorylets: Array<{
    id: string;
    title: string;
    completions: number;
    category: string;
  }>;
  categoryDistribution: Record<string, number>;
  difficultyAnalysis: {
    easy: number;
    medium: number;
    hard: number;
  };
}

const ContentAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<ContentMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week');
  
  const storyletStore = useStoryletStore();

  useEffect(() => {
    calculateMetrics();
  }, [timeRange]);

  const calculateMetrics = () => {
    const state = storyletStore;
    const allStorylets = Object.entries(state.allStorylets);
    
    // Basic counts
    const totalStorylets = allStorylets.length;
    const activeStorylets = state.activeStoryletIds.length;
    const completedStorylets = state.completedStoryletIds.length;
    const completionRate = totalStorylets > 0 ? (completedStorylets / totalStorylets) * 100 : 0;

    // Category distribution
    const categoryDistribution: Record<string, number> = {};
    allStorylets.forEach(([id, storylet]) => {
      const category = (storylet as any).category || 'uncategorized';
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });

    // Mock top storylets (in real implementation, this would come from engagement data)
    const topStorylets = state.completedStoryletIds.slice(0, 5).map((id, index) => {
      const storylet = state.allStorylets[id];
      return {
        id,
        title: (storylet as any)?.title || `Storylet ${id}`,
        completions: Math.floor(Math.random() * 50) + 10, // Mock data
        category: (storylet as any)?.category || 'general'
      };
    });

    // Mock difficulty analysis
    const difficultyAnalysis = {
      easy: Math.floor(totalStorylets * 0.4),
      medium: Math.floor(totalStorylets * 0.4),
      hard: Math.floor(totalStorylets * 0.2)
    };

    setMetrics({
      totalStorylets,
      activeStorylets,
      completedStorylets,
      completionRate,
      topStorylets,
      categoryDistribution,
      difficultyAnalysis
    });
  };

  const exportAnalytics = () => {
    if (!metrics) return;
    
    const report = {
      generatedAt: new Date().toISOString(),
      timeRange,
      metrics,
      rawData: {
        activeStoryletIds: storyletStore.activeStoryletIds,
        completedStoryletIds: storyletStore.completedStoryletIds,
        totalStorylets: Object.keys(storyletStore.allStorylets).length
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Calculating content metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Content Analytics</h3>
          <p className="text-gray-600">Monitor content performance and player engagement</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="all">All Time</option>
          </select>
          
          <button
            onClick={exportAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Content</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.totalStorylets}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              📚
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Stories</p>
              <p className="text-2xl font-semibold text-green-600">{metrics.activeStorylets}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              ⚡
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-purple-600">{metrics.completedStorylets}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              ✅
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-semibold text-orange-600">{metrics.completionRate.toFixed(1)}%</p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              📊
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Content */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Top Performing Stories</h4>
            <HelpTooltip content="Stories with the highest completion rates and player engagement" />
          </div>
          
          {metrics.topStorylets.length > 0 ? (
            <div className="space-y-3">
              {metrics.topStorylets.map((storylet, index) => (
                <div key={storylet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-400 text-gray-900' :
                      index === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-blue-100 text-blue-900'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{storylet.title}</div>
                      <div className="text-xs text-gray-600 capitalize">{storylet.category}</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {storylet.completions} plays
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No story performance data yet</p>
              <p className="text-sm">Data will appear as players engage with content</p>
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Content by Category</h4>
            <HelpTooltip content="Distribution of content across different story categories" />
          </div>
          
          <div className="space-y-3">
            {Object.entries(metrics.categoryDistribution).map(([category, count]) => {
              const percentage = (count / metrics.totalStorylets) * 100;
              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize text-gray-700">{category}</span>
                    <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Difficulty Analysis */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Content Difficulty</h4>
            <HelpTooltip content="Distribution of content across difficulty levels" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Easy</span>
              </div>
              <span className="text-sm font-semibold">{metrics.difficultyAnalysis.easy}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">Medium</span>
              </div>
              <span className="text-sm font-semibold">{metrics.difficultyAnalysis.medium}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">Hard</span>
              </div>
              <span className="text-sm font-semibold">{metrics.difficultyAnalysis.hard}</span>
            </div>
          </div>
        </div>

        {/* Content Health */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Content Health</h4>
            <HelpTooltip content="Overall health indicators for your content library" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Content</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  metrics.activeStorylets > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {metrics.activeStorylets > 0 ? 'Good' : 'Needs Attention'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  metrics.completionRate > 50 ? 'bg-green-500' : 
                  metrics.completionRate > 25 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {metrics.completionRate > 50 ? 'Excellent' : 
                   metrics.completionRate > 25 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Content Variety</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  Object.keys(metrics.categoryDistribution).length > 3 ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {Object.keys(metrics.categoryDistribution).length > 3 ? 'Good' : 'Could Be Better'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded">
            <h5 className="text-sm font-medium text-blue-900 mb-1">💡 Recommendations</h5>
            <ul className="text-xs text-blue-800 space-y-1">
              {metrics.activeStorylets === 0 && (
                <li>• Create more active storylets to engage players</li>
              )}
              {metrics.completionRate < 25 && (
                <li>• Review storylet difficulty and player progression</li>
              )}
              {Object.keys(metrics.categoryDistribution).length <= 3 && (
                <li>• Add content variety across different categories</li>
              )}
              {metrics.totalStorylets < 10 && (
                <li>• Expand content library for better player experience</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentAnalytics;