// Arc Progress Display Component
import React from 'react';
import { useStoryletStore } from '../store/useStoryletStore';
import { Card, ProgressBar } from './ui';

interface ArcProgressDisplayProps {
  className?: string;
}

export const ArcProgressDisplay: React.FC<ArcProgressDisplayProps> = ({ className = '' }) => {
  const { getArcStats, getArcProgress } = useStoryletStore();
  const arcStats = getArcStats();
  
  // Filter to show only arcs that have storylets
  const activeArcs = arcStats.filter(arc => arc.status !== 'not_started');
  
  if (activeArcs.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Story Arc Progress</h3>
        <p className="text-sm text-gray-500">No active story arcs found.</p>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Story Arc Progress</h3>
      
      <div className="space-y-3">
        {activeArcs.map(arc => {
          const progress = getArcProgress(arc.name);
          
          return (
            <div key={arc.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900">{arc.name}</h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    arc.status === 'complete' 
                      ? 'bg-green-100 text-green-800'
                      : arc.status === 'failed'
                      ? 'bg-red-100 text-red-800' 
                      : arc.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {arc.status === 'complete' ? 'Complete' :
                     arc.status === 'failed' ? 'Failed' :
                     arc.status === 'active' ? 'In Progress' : 'Not Started'}
                  </span>
                </div>
                <span className="text-sm text-gray-500">{arc.progress}</span>
              </div>
              
              <ProgressBar 
                current={progress.completed} 
                max={progress.total}
                showValues={false}
                color={
                  arc.status === 'complete' ? 'green' :
                  arc.status === 'failed' ? 'red' : 'blue'
                }
                className="h-2"
              />
              
              {arc.current && (
                <p className="text-xs text-gray-600">
                  Current: {arc.current}
                </p>
              )}
              
              {arc.failureReason && (
                <p className="text-xs text-red-600">
                  Failed: {arc.failureReason}
                </p>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {arcStats.filter(a => a.status === 'active').length}
            </div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {arcStats.filter(a => a.status === 'complete').length}
            </div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600">
              {arcStats.filter(a => a.status === 'failed').length}
            </div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-600">
              {arcStats.filter(a => a.status === 'not_started').length}
            </div>
            <div className="text-xs text-gray-500">Planned</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ArcProgressDisplay;