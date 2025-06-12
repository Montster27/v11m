// /Users/montysharma/V11M2/src/components/StoryletOverview.tsx
import React from 'react';
import { Card } from './ui';
import { Storylet } from '../types/storylet';

interface StoryletOverviewProps {
  allStorylets: Record<string, Storylet>;
  activeStoryletIds: string[];
  completedStoryletIds: string[];
  storyArcs: string[];
  getStoryletsByArc: (arcName: string) => Storylet[];
}

export const StoryletOverview: React.FC<StoryletOverviewProps> = ({
  allStorylets,
  activeStoryletIds,
  completedStoryletIds,
  storyArcs,
  getStoryletsByArc
}) => {
  const totalStorylets = Object.keys(allStorylets).length;
  const availableStorylets = totalStorylets - completedStoryletIds.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalStorylets}</div>
          <div className="text-sm text-gray-600">Total Storylets</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{activeStoryletIds.length}</div>
          <div className="text-sm text-gray-600">Currently Active</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{completedStoryletIds.length}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{availableStorylets}</div>
          <div className="text-sm text-gray-600">Available</div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Story Arc Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {storyArcs.map(arc => {
            const arcStorylets = getStoryletsByArc(arc);
            const activeInArc = arcStorylets.filter(s => activeStoryletIds.includes(s.id)).length;
            const completedInArc = arcStorylets.filter(s => completedStoryletIds.includes(s.id)).length;
            const totalInArc = arcStorylets.length;
            
            return (
              <div key={arc} className="bg-gray-50 rounded p-3">
                <h4 className="font-medium text-gray-900 mb-2">{arc}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{totalInArc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active:</span>
                    <span className="font-medium text-green-600">{activeInArc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="font-medium text-purple-600">{completedInArc}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${totalInArc > 0 ? (completedInArc / totalInArc) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};