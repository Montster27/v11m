// /Users/montysharma/V11M2/src/components/CharacterCreation/Step1_Name.tsx
import React, { useState, useEffect } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { Card, Button } from '../ui';

const Step1_Name: React.FC = () => {
  const { currentCharacter, updateCharacter, nextStep, isStepValid } = useCharacterStore();
  const [name, setName] = useState(currentCharacter?.name || '');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    setName(currentCharacter?.name || '');
  }, [currentCharacter]);

  const handleNameChange = (value: string) => {
    setName(value);
    setNameError('');
    updateCharacter({ name: value });
  };

  const handleNext = () => {
    if (!name.trim()) {
      setNameError('Please enter a character name');
      return;
    }
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters long');
      return;
    }
    nextStep();
  };

  const canProceed = isStepValid(1);

  return (
    <Card title="Step 1: Character Name" className="max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Character</h2>
          <p className="text-gray-600">
            Let's start by giving your character a name. This will be how you're known throughout your life simulation.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="characterName" className="block text-sm font-medium text-gray-700 mb-2">
              Character Name *
            </label>
            <input
              id="characterName"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter your character's name"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                nameError ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={50}
              autoFocus
            />
            {nameError && (
              <p className="mt-1 text-sm text-red-600">{nameError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {name.length}/50 characters
            </p>
          </div>

          {name.trim() && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-1">Preview</h3>
              <p className="text-blue-800">Hello, <strong>{name.trim()}</strong>! Ready to start your life simulation?</p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            variant="primary"
          >
            Next: Attributes
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default Step1_Name;