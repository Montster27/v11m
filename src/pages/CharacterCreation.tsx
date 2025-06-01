// /Users/montysharma/V11M2/src/pages/CharacterCreation.tsx
import React, { useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { Card, Button } from '../components/ui';
import CharacterCreationFlow from '../components/CharacterCreation';

const CharacterCreationPage: React.FC = () => {
  const { 
    savedCharacters, 
    createNewCharacter, 
    loadCharacter, 
    deleteCharacter,
    currentCharacter 
  } = useCharacterStore();
  
  const [mode, setMode] = useState<'menu' | 'create' | 'edit'>('menu');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  const handleNewCharacter = () => {
    createNewCharacter();
    setMode('create');
  };

  const handleEditCharacter = (id: string) => {
    loadCharacter(id);
    setSelectedCharacterId(id);
    setMode('edit');
  };

  const handleBackToMenu = () => {
    setMode('menu');
    setSelectedCharacterId(null);
  };

  const handleDeleteCharacter = (id: string) => {
    deleteCharacter(id);
    // Also remove from localStorage
    try {
      const updated = savedCharacters.filter(c => c.id !== id);
      localStorage.setItem('lifeSimulator_characters', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to update localStorage:', error);
    }
  };

  if (mode === 'create' || mode === 'edit') {
    return (
      <div>
        <div className="container mx-auto px-4 py-4">
          <Button onClick={handleBackToMenu} variant="outline" className="mb-4">
            ← Back to Character Menu
          </Button>
        </div>
        <CharacterCreationFlow />
      </div>
    );
  }

  return (
    <div className="page-container min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Character Creation</h1>
            <p className="text-lg text-gray-600">
              Create or manage your life simulation characters
            </p>
          </div>

          {/* New Character Section */}
          <Card title="Create New Character" className="mb-8" variant="elevated">
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Start your life simulation journey by creating a unique character with custom attributes and personality traits.
              </p>
              <Button onClick={handleNewCharacter} variant="primary" size="lg">
                Create New Character
              </Button>
            </div>
          </Card>

          {/* Saved Characters */}
          {savedCharacters.length > 0 && (
            <Card title="Saved Characters" variant="elevated">
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Edit or manage your existing characters:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedCharacters.map((character) => (
                    <div 
                      key={character.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{character.name}</h3>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(character.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          <div className="grid grid-cols-2 gap-1">
                            <div>Intelligence: {character.attributes.intelligence}</div>
                            <div>Charisma: {character.attributes.charisma}</div>
                            <div>Strength: {character.attributes.strength}</div>
                            <div>Creativity: {character.attributes.creativity}</div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleEditCharacter(character.id)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteCharacter(character.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Instructions */}
          <Card title="How Character Creation Works" className="mt-8" variant="outlined">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">🎯 Step 1: Name Your Character</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose a unique name that will represent you throughout the life simulation.
                </p>
                
                <h3 className="font-semibold text-gray-900 mb-2">📊 Step 2: Distribute Attributes</h3>
                <p className="text-sm text-gray-600">
                  Allocate 100 points across 16 different attributes including cognitive, physical, social, and mental traits.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">✅ Step 3: Review & Create</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Review your character's final attributes with a visual radar chart and create your character for the simulation.
                </p>
                
                <h3 className="font-semibold text-gray-900 mb-2">💾 Character Management</h3>
                <p className="text-sm text-gray-600">
                  Save, edit, and manage multiple characters. All character data is stored locally and can be exported as JSON.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreationPage;