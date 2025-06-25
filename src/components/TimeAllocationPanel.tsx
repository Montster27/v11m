// /Users/montysharma/V11M2/src/components/TimeAllocationPanel.tsx

import React from 'react';
import { Card, Slider } from './ui';
import { useCoreGameStore } from '../stores/v2';
import { getActivityStats, percentToHoursPerWeek, percentToHoursPerDay } from '../utils/resourceCalculations';
import { validateSleepHours } from '../utils/validation';

interface TimeAllocationPanelProps {
  disabled?: boolean;
}

const TimeAllocationPanel: React.FC<TimeAllocationPanelProps> = ({ disabled = false }) => {
  const allocations = useCoreGameStore((state) => state.world.timeAllocation);
  const character = useCoreGameStore((state) => state.character);
  const updateWorld = useCoreGameStore((state) => state.updateWorld);
  
  // Ensure allocations have default values
  const normalizedAllocations = {
    study: allocations?.study ?? 40,
    work: allocations?.work ?? 25,
    social: allocations?.social ?? 15,
    rest: allocations?.rest ?? 15,
    exercise: allocations?.exercise ?? 5
  };
  
  const updateTimeAllocation = (activity: string, value: number) => {
    updateWorld({
      timeAllocation: {
        ...normalizedAllocations,
        [activity]: Math.max(0, Math.min(100, value))
      }
    });
  };
  
  const getTotalTimeAllocated = () => {
    return Object.values(normalizedAllocations).reduce((sum, value) => sum + value, 0);
  };
  
  const totalAllocated = getTotalTimeAllocated();
  const isBalanced = totalAllocated === 100;
  
  const activities = [
    { key: 'study', label: 'Study' },
    { key: 'work', label: 'Work' },
    { key: 'social', label: 'Social' },
    { key: 'rest', label: 'Rest' },
    { key: 'exercise', label: 'Exercise' }
  ] as const;

  const StatBadge: React.FC<{ stat: { stat: string; value: number; color: string } }> = ({ stat }) => (
    <span 
      className={`inline-block px-2 py-1 text-xs font-bold text-white rounded mr-1 mb-1 ${stat.color}`}
    >
      {stat.stat}: {stat.value > 0 ? '+' : ''}{stat.value}
    </span>
  );

  return (
    <div id="time-allocation">
      <Card title="Time Allocation" className="h-auto min-h-fit">
        {/* Total Allocation Display */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Total:</span>
            <div className="flex items-center space-x-2">
              <span className={`font-bold text-lg ${
                totalAllocated > 100 ? 'text-red-600' : 
                totalAllocated < 100 ? 'text-amber-600' : 
                'text-green-600'
              }`}>
                {totalAllocated.toFixed(1)}%
              </span>
              {isBalanced && (
                <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                  BALANCED
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Sliders */}
        <div className="space-y-6">
          {activities.map(({ key, label }) => {
            const value = normalizedAllocations[key];
            const hoursPerWeek = percentToHoursPerWeek(value);
            const stats = getActivityStats(key, character);
            const sleepValidation = key === 'rest' ? validateSleepHours(value) : null;
            
            return (
              <div key={key} className={disabled ? 'opacity-50' : ''}>
                {/* Slider */}
                <Slider
                  label={`${label}: ${value}%`}
                  value={value}
                  onChange={(newValue) => !disabled && updateTimeAllocation(key, newValue)}
                  max={100}
                  disabled={disabled}
                  className="mb-2"
                />
                
                {/* Hours per week display */}
                <div className="text-right text-xs text-gray-500 mb-2">
                  ≈ {hoursPerWeek.toFixed(1)} hrs/week
                  {key === 'rest' && (
                    <span className="ml-2">
                      ({percentToHoursPerDay(value).toFixed(1)} hrs/day sleep)
                    </span>
                  )}
                </div>
                
                {/* Activity effect badges */}
                <div className="flex flex-wrap mb-2">
                  {stats.map((stat, idx) => (
                    <StatBadge key={idx} stat={stat} />
                  ))}
                </div>
                
                {/* Sleep deprivation warning */}
                {sleepValidation && sleepValidation.type === 'error' && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
                    {sleepValidation.message}
                  </div>
                )}
                
                {sleepValidation && sleepValidation.type === 'warning' && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
                    {sleepValidation.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Disabled State Message */}
        {disabled && (
          <div className="mt-4 text-center text-sm text-gray-500 bg-gray-100 p-3 rounded">
            Time allocation locked while simulation is running
          </div>
        )}
      </Card>
    </div>
  );
};

export default TimeAllocationPanel;