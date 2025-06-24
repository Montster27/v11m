// /Users/montysharma/V11M2/src/components/CrashModal.tsx
// Crash recovery modal component - separated from Planner for better organization

import React from 'react';

interface CrashModalProps {
  isOpen: boolean;
  onComplete: () => void;
  type: 'exhaustion' | 'burnout';
  countdown: number;
}

const CrashModal: React.FC<CrashModalProps> = ({ isOpen, onComplete, type, countdown }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="text-center">
          <div className="text-6xl mb-4">
            {type === 'exhaustion' ? '😴' : '🤯'}
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            {type === 'exhaustion' ? 'Energy Depleted!' : 'Maximum Stress!'}
          </h2>
          <p className="text-gray-700 mb-4">
            You've crashed from {type}! You must rest for 3 in-game days.
          </p>
          <div className="text-lg font-bold text-blue-600">
            Recovering... {countdown} days remaining
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrashModal;