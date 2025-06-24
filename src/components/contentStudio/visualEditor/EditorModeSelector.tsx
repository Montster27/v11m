// /Users/montysharma/V11M2/src/components/contentStudio/visualEditor/EditorModeSelector.tsx
// Mode selector component for switching between storylet and arc editing modes

import React from 'react';
import { EditorMode } from './types';

interface EditorModeSelectorProps {
  mode: EditorMode;
  onModeChange: (mode: 'storylet' | 'arc') => void;
  disabled?: boolean;
}

const EditorModeSelector: React.FC<EditorModeSelectorProps> = ({
  mode,
  onModeChange,
  disabled = false
}) => {
  const availableModes = [
    {
      id: 'storylet' as const,
      label: 'Storylet Creator',
      description: 'Create individual storylets with choices and effects',
      icon: '📖'
    },
    {
      id: 'arc' as const,
      label: 'Arc Builder',
      description: 'Build story arcs by connecting multiple storylets',
      icon: '🌉'
    }
  ];

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Editor Mode</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {availableModes.map((modeOption) => (
          <button
            key={modeOption.id}
            onClick={() => onModeChange(modeOption.id)}
            disabled={disabled}
            className={`p-3 text-left border rounded-lg transition-all ${
              mode.current === modeOption.id
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-start space-x-2">
              <span className="text-lg">{modeOption.icon}</span>
              <div>
                <div className="font-medium text-sm">{modeOption.label}</div>
                <div className="text-xs opacity-75 mt-1">{modeOption.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Current mode indicator */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center text-xs text-gray-600">
          <span className="font-medium">Active:</span>
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded">
            {availableModes.find(m => m.id === mode.current)?.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EditorModeSelector;