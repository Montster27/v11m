// /Users/montysharma/V11M2/src/components/ui/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  showValues?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal';
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  label,
  showValues = true,
  color = 'blue',
  className = ''
}) => {
  const percentage = Math.min((current / max) * 100, 100);
  
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600', 
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    teal: 'from-teal-500 to-teal-600'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showValues) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showValues && (
            <span className="text-sm text-gray-600">
              {current}/{max}
            </span>
          )}
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;