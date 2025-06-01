// /Users/montysharma/V11M2/src/components/CurrentEventPanel.tsx

import React from 'react';
import { Card, Button } from './ui';
import { useAppStore } from '../store/useAppStore';

interface EventChoice {
  id: string;
  title: string;
  description: string;
  consequences: {
    stat: string;
    value: number;
    color: string;
  }[];
}

const CurrentEventPanel: React.FC = () => {
  const { currentEvent, handleEventChoice, resources } = useAppStore();

  if (!currentEvent) {
    return (
      <div id="events">
        <Card title="Current Event" className="h-fit">
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🎲</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No Current Events
            </h3>
            <p className="text-sm">
              Continue with your daily activities
            </p>
            <p className="text-xs mt-2 text-gray-400">
              Events may appear based on your resource levels and activities
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div id="events">
      <Card title="Current Event" className="h-fit">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {currentEvent.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
            {currentEvent.description}
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Choose your action:
          </h4>
          
          {currentEvent.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => handleEventChoice(choice)}
              className="w-full p-4 border-2 border-teal-200 rounded-lg hover:border-teal-400 hover:bg-teal-50 transition-all duration-200 text-left group focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <div className="font-semibold text-gray-900 mb-2 group-hover:text-teal-700 text-base">
                {choice.title}
              </div>
              
              {/* Consequences */}
              <div className="flex flex-wrap gap-2 mb-2">
                {choice.consequences.map((consequence) => (
                  <span
                    key={`${consequence.stat}-${consequence.value}`}
                    className={`px-2 py-1 text-xs font-bold text-white rounded ${consequence.color}`}
                  >
                    {consequence.stat}: {consequence.value > 0 ? '+' : ''}{consequence.value}
                  </span>
                ))}
              </div>
              
              {/* Optional description */}
              {choice.description && (
                <p className="text-xs text-gray-500 mt-1">
                  {choice.description}
                </p>
              )}
            </button>
          ))}
        </div>
        
        {/* Current Resources Context */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Current Status:</span>
              <span>
                Energy: {resources.energy.toFixed(1)} | 
                Stress: {resources.stress.toFixed(1)} | 
                Social: {resources.social.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CurrentEventPanel;