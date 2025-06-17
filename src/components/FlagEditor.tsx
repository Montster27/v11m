// /Users/montysharma/V11M2/src/components/FlagEditor.tsx
import React from 'react';

interface FlagEditorProps {
  flags: string[];
  onChange: (flags: string[]) => void;
  className?: string;
}

const FlagEditor: React.FC<FlagEditorProps> = ({ flags, onChange, className = '' }) => {
  const addFlag = () => {
    onChange([...flags, '']);
  };

  const removeFlag = (index: number) => {
    const newFlags = flags.filter((_, i) => i !== index);
    onChange(newFlags);
  };

  const updateFlag = (index: number, value: string) => {
    const newFlags = [...flags];
    newFlags[index] = value;
    onChange(newFlags);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="bg-blue-50 p-3 rounded border">
        <div className="text-sm font-medium text-blue-900 mb-2">🎯 Required Flags (OR logic)</div>
        <div className="space-y-2">
          {flags.map((flag, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={flag}
                onChange={(e) => updateFlag(index, e.target.value)}
                placeholder="Flag name (e.g., metMysteriousStudent)"
                className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                type="button"
                onClick={() => removeFlag(index)}
                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addFlag}
            className="w-full px-3 py-2 border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 rounded text-sm"
          >
            + Add Flag
          </button>
        </div>
        <div className="text-xs text-blue-700 mt-2">
          Storylet triggers when ANY of these flags are true. Common flags include:
          college_started, analyticalApproach, socialApproach, emma_romance:coffee_success
        </div>
      </div>
    </div>
  );
};

export default FlagEditor;