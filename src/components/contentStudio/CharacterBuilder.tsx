// /Users/montysharma/V11M2/src/components/contentStudio/CharacterBuilder.tsx

import React, { useState } from 'react';
import { UndoRedoAction } from '../../hooks/useUndoRedo';
import HelpTooltip from '../ui/HelpTooltip';

interface UndoRedoSystem {
  executeAction: (action: UndoRedoAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface CharacterBuilderProps {
  onExecuteAction: (action: () => void, title: string, message: string, type?: 'warning' | 'danger') => void;
  undoRedoSystem: UndoRedoSystem;
}

interface CharacterForm {
  name: string;
  description: string;
  personality: {
    traits: string[];
    interests: string[];
    values: string[];
  };
  background: {
    major: string;
    year: string;
    hometown: string;
  };
  relationshipLevel: number;
}

const personalityTraits = [
  'friendly', 'studious', 'outgoing', 'shy', 'creative', 'analytical', 
  'adventurous', 'cautious', 'optimistic', 'realistic', 'ambitious', 'laid-back'
];

const interests = [
  'music', 'art', 'literature', 'sports', 'technology', 'politics',
  'science', 'history', 'gaming', 'travel', 'cooking', 'photography'
];

const values = [
  'honesty', 'creativity', 'independence', 'family', 'success', 'justice',
  'knowledge', 'friendship', 'adventure', 'security', 'tradition', 'innovation'
];

const CharacterBuilder: React.FC<CharacterBuilderProps> = ({ onExecuteAction, undoRedoSystem }) => {
  const [character, setCharacter] = useState<CharacterForm>({
    name: '',
    description: '',
    personality: {
      traits: [],
      interests: [],
      values: []
    },
    background: {
      major: '',
      year: 'Freshman',
      hometown: ''
    },
    relationshipLevel: 50
  });

  const togglePersonalityItem = (category: keyof CharacterForm['personality'], item: string) => {
    setCharacter(prev => ({
      ...prev,
      personality: {
        ...prev.personality,
        [category]: prev.personality[category].includes(item)
          ? prev.personality[category].filter(i => i !== item)
          : [...prev.personality[category], item]
      }
    }));
  };

  const handleCreateCharacter = () => {
    if (!character.name.trim() || !character.description.trim()) {
      alert('Please fill in character name and description');
      return;
    }

    onExecuteAction(
      () => {
        console.log('Creating character:', character);
        alert('Character created successfully! (Implementation pending)');
        
        // Reset form
        setCharacter({
          name: '',
          description: '',
          personality: { traits: [], interests: [], values: [] },
          background: { major: '', year: 'Freshman', hometown: '' },
          relationshipLevel: 50
        });
      },
      'Create New Character',
      `Create character "${character.name}"? This will add them to the game as an NPC.`,
      'warning'
    );
  };

  const renderPersonalitySection = (
    title: string,
    category: keyof CharacterForm['personality'],
    options: string[],
    helpText: string
  ) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <label className="block text-sm font-medium text-gray-700">{title}</label>
        <HelpTooltip content={helpText} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => togglePersonalityItem(category, option)}
            className={`px-3 py-2 text-sm rounded-md border transition-colors ${
              character.personality[category].includes(option)
                ? 'bg-blue-100 border-blue-500 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Selected: {character.personality[category].length}/3 recommended
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Character Builder</h3>
        <p className="text-gray-600">Design memorable NPCs with rich personalities and backgrounds</p>
      </div>

      <div className="max-w-2xl">
        {/* Basic Information */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Basic Information</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Character Name *
              </label>
              <input
                type="text"
                value={character.name}
                onChange={(e) => setCharacter(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter character name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Character Description *
              </label>
              <textarea
                value={character.description}
                onChange={(e) => setCharacter(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe this character's appearance, role, and what makes them interesting..."
              />
            </div>
          </div>
        </div>

        {/* Background */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Background</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Major/Field</label>
              <input
                type="text"
                value={character.background.major}
                onChange={(e) => setCharacter(prev => ({
                  ...prev,
                  background: { ...prev.background, major: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Computer Science, English Literature"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <select
                value={character.background.year}
                onChange={(e) => setCharacter(prev => ({
                  ...prev,
                  background: { ...prev.background, year: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Graduate">Graduate Student</option>
                <option value="Faculty">Faculty/Staff</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hometown</label>
              <input
                type="text"
                value={character.background.hometown}
                onChange={(e) => setCharacter(prev => ({
                  ...prev,
                  background: { ...prev.background, hometown: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Portland, Oregon"
              />
            </div>
          </div>
        </div>

        {/* Personality */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4">Personality</h4>

          {renderPersonalitySection(
            'Personality Traits',
            'traits',
            personalityTraits,
            'Choose 2-3 traits that define how this character behaves and interacts with others.'
          )}

          {renderPersonalitySection(
            'Interests',
            'interests',
            interests,
            'Select topics and activities this character enjoys. This affects conversation topics and shared interests with the player.'
          )}

          {renderPersonalitySection(
            'Core Values',
            'values',
            values,
            'Pick values that are important to this character. These influence their reactions to player choices.'
          )}
        </div>

        {/* Relationship Settings */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="font-medium text-gray-900">Initial Relationship Level</h4>
            <HelpTooltip content="How well the player knows this character when they first meet. 0-25: Stranger, 26-50: Acquaintance, 51-75: Friend, 76-100: Close Friend" />
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Stranger</span>
            <input
              type="range"
              min="0"
              max="100"
              value={character.relationshipLevel}
              onChange={(e) => setCharacter(prev => ({ ...prev, relationshipLevel: parseInt(e.target.value) }))}
              className="flex-1"
            />
            <span className="text-sm text-gray-600">Close Friend</span>
            <span className="text-sm font-medium w-12 text-center">{character.relationshipLevel}</span>
          </div>
          
          <div className="text-sm text-gray-600 mt-1">
            Level: {character.relationshipLevel <= 25 ? 'Stranger' : 
                    character.relationshipLevel <= 50 ? 'Acquaintance' :
                    character.relationshipLevel <= 75 ? 'Friend' : 'Close Friend'}
          </div>
        </div>

        {/* Character Preview */}
        {character.name && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-3">Character Preview</h4>
            <div className="text-sm text-blue-800">
              <p><strong>{character.name}</strong> - {character.background.year} studying {character.background.major || 'an undeclared major'}</p>
              <p className="mt-1">{character.description}</p>
              {character.personality.traits.length > 0 && (
                <p className="mt-2">
                  <strong>Traits:</strong> {character.personality.traits.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setCharacter({
              name: '',
              description: '',
              personality: { traits: [], interests: [], values: [] },
              background: { major: '', year: 'Freshman', hometown: '' },
              relationshipLevel: 50
            })}
            className="px-4 py-2 text-gray-600 hover:text-gray-700"
          >
            Clear Form
          </button>
          <button
            onClick={handleCreateCharacter}
            disabled={!character.name.trim() || !character.description.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            Create Character
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterBuilder;