// /Users/montysharma/V11M2/src/components/CharacterCreation/Step3_Review.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacterStore } from '../../store/characterStore';
import { useAppStore } from '../../store/useAppStore';
import { Card, Button } from '../ui';
import RadarChart from './RadarChart';

const Step3_Review: React.FC = () => {
  const navigate = useNavigate();
  const { currentCharacter, prevStep, saveCharacter } = useCharacterStore();
  const { setActiveCharacter } = useAppStore();
  const [showJson, setShowJson] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [characterCreated, setCharacterCreated] = useState(false);

  const handleCreateCharacter = () => {
    setIsCreating(true);
    
    // Simulate character creation process
    setTimeout(() => {
      saveCharacter();
      // Also set as active character in the app store
      if (currentCharacter) {
        setActiveCharacter(currentCharacter);
      }
      setIsCreating(false);
      setCharacterCreated(true);
      setShowJson(true);
    }, 1000);
  };

  if (!currentCharacter) {
    return (
      <Card title="Error" className="max-w-md mx-auto text-center">
        <p className="text-red-600">No character data found. Please start over.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card title="Step 3: Character Review" className="text-center">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">
            Meet {currentCharacter.name}!
          </h2>
          <p className="text-gray-600">
            Review your character's attributes and create your character when ready.
          </p>
          
          {characterCreated && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-green-800 font-medium">🎉 Character Created Successfully!</h3>
              <p className="text-green-700 text-sm">
                Your character has been saved and is ready for the life simulation.
              </p>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Character Summary */}
        <Card title="Character Summary" variant="elevated">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <p className="text-gray-900">{currentCharacter.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">ID:</span>
                    <p className="text-gray-900 text-xs font-mono">
                      {currentCharacter.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Attributes</h3>
              <div className="grid grid-cols-2 gap-2 text-sm max-h-64 overflow-y-auto">
                {currentCharacter.attributes && Object.entries(currentCharacter.attributes).map(([attr, value]) => (
                  <div key={attr} className="flex justify-between">
                    <span className="text-gray-600 capitalize">
                      {attr.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Starting Resources</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {currentCharacter.initialResources && Object.entries(currentCharacter.initialResources).map(([resource, value]) => (
                    <div key={resource} className="flex justify-between">
                      <span className="text-blue-700 capitalize">{resource}:</span>
                      <span className="font-medium text-blue-900">
                        {resource === 'money' ? `$${value}` : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Radar Chart */}
        <Card title="Attribute Visualization" variant="elevated" className="text-center">
          {currentCharacter.attributes && (
            <RadarChart attributes={currentCharacter.attributes} size={350} />
          )}
        </Card>
      </div>

      {/* JSON Output */}
      {showJson && (
        <Card title="Character JSON Data" variant="elevated">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                This is the JSON representation of your character:
              </p>
              <Button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(currentCharacter, null, 2))}
                variant="outline"
                size="sm"
              >
                Copy JSON
              </Button>
            </div>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs max-h-64">
              {JSON.stringify(currentCharacter, null, 2)}
            </pre>
          </div>
        </Card>
      )}

      {/* Actions */}
      <Card className="bg-gray-50">
        <div className="flex justify-between items-center">
          <Button onClick={prevStep} variant="outline">
            Back: Attributes
          </Button>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowJson(!showJson)}
              variant="outline"
            >
              {showJson ? 'Hide' : 'Show'} JSON
            </Button>
            
            {!characterCreated ? (
              <Button
                onClick={handleCreateCharacter}
                disabled={isCreating}
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
              >
                {isCreating ? 'Creating Character...' : 'Create Character'}
              </Button>
            ) : (
              <div className="flex space-x-3">
                <Button
                  onClick={() => navigate('/planner')}
                  variant="primary"
                >
                  Start Playing
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Create Another Character
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Step3_Review;