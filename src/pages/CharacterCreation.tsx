// /Users/montysharma/V11M2/src/pages/CharacterCreation.tsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCoreGameStore, useSocialStore } from '../stores/v2';
import { Card, Button } from '../components/ui';
import ConsolidatedCharacterCreationFlow from '../components/CharacterCreation/ConsolidatedCharacterCreationFlow';

const CharacterCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const coreStore = useCoreGameStore();
  const socialStore = useSocialStore();
  
  // Get saved characters from save slots
  const saveSlots = Object.values(socialStore.saves.saveSlots);
  const savedCharacters = saveSlots.filter(slot => slot.characterName);
  
  // Check if coming from splash screen "New Game"
  const isNewGame = searchParams.get('new') === 'true';
  const shouldCreateDirectly = isNewGame || savedCharacters.length === 0;
  const [mode, setMode] = useState<'menu' | 'create' | 'edit'>(shouldCreateDirectly ? 'create' : 'menu');

  const handleNewCharacter = () => {
    setMode('create');
  };

  const handleEditCharacter = () => {
    // In consolidated system, we only have one active character
    setMode('edit');
  };

  const handleBackToMenu = () => {
    setMode('menu');
  };

  const handleDeleteCharacter = () => {
    // Use atomic reset from consolidated stores
    const { resetAllGameState } = require('../utils/characterFlowIntegration');
    if (confirm('Delete character and all progress? This cannot be undone.')) {
      resetAllGameState();
      window.location.reload(); // Refresh to clear UI state
    }
  };

  const handleSelectCharacter = (character: any) => {
    // Load the character's save slot
    console.log('✅ Loading character save slot:', character.id);
    socialStore.loadSaveSlot(character.id);
    navigate('/planner');
  };

  if (mode === 'create' || mode === 'edit') {
    return (
      <div>
        <div className="container mx-auto px-4 py-4">
          <Button onClick={handleBackToMenu} variant="outline" className="mb-4">
            ← Back to Character Menu
          </Button>
        </div>
        <ConsolidatedCharacterCreationFlow />
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
                  Select an existing character to start playing:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedCharacters.map((character, index) => (
                    <div 
                      key={character.id || index} 
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{character.characterName || character.name}</h3>
                          <p className="text-xs text-gray-500">
                            Background: {character.background || 'General'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Day {character.day || 1} • Level {character.level || 1}
                          </p>
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          <div className="grid grid-cols-2 gap-1">
                            <div>Intelligence: {character.gameState?.core?.character?.attributes?.intelligence || 'N/A'}</div>
                            <div>Charisma: {character.gameState?.core?.character?.attributes?.charisma || 'N/A'}</div>
                            <div>Strength: {character.gameState?.core?.character?.attributes?.strength || 'N/A'}</div>
                            <div>Creativity: {character.gameState?.core?.character?.attributes?.creativity || 'N/A'}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Button
                            onClick={() => handleSelectCharacter(character)}
                            variant="primary"
                            size="sm"
                            className="w-full"
                          >
                            Select Character
                          </Button>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => socialStore.deleteSaveSlot(character.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 w-full"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Instructions */}
          <Card title="How Character Management Works" className="mt-8" variant="outlined">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">🚀 Quick Start</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Have existing characters? Simply click "Select Character" to jump straight into the game with your chosen character.
                </p>
                
                <h3 className="font-semibold text-gray-900 mb-2">🎯 Creating New Characters</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose a unique name that will represent you throughout the life simulation.
                </p>
                
                <h3 className="font-semibold text-gray-900 mb-2">📊 Attribute Distribution</h3>
                <p className="text-sm text-gray-600">
                  Allocate 100 points across 16 different attributes including cognitive, physical, social, and mental traits.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">✅ Review & Create</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Review your character's final attributes with a visual radar chart before finalizing.
                </p>
                
                <h3 className="font-semibold text-gray-900 mb-2">✏️ Edit Existing Characters</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Want to modify a character? Use the "Edit" button to change their attributes and settings.
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