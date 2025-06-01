// /Users/montysharma/V11M2/src/pages/Home.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useCharacterStore } from '../store/characterStore';
import { Button, Card } from '../components/ui';
import { createTestCharacter } from '../utils/testCharacter';

const Home: React.FC = () => {
  const { currentCharacter, savedCharacters, createNewCharacter, loadCharacter } = useCharacterStore();

  const handleCreateCharacter = () => {
    createNewCharacter();
  };

  const handleCreateTestCharacter = () => {
    createTestCharacter();
  };

  const handleSelectCharacter = (characterId: string) => {
    loadCharacter(characterId);
  };

  return (
    <div className="page-container min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-teal-800 mb-4">
            Life Simulator
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transform your life into an engaging game experience
          </p>
          <div className="w-24 h-1 bg-teal-600 mx-auto rounded"></div>
        </div>

        {/* Current Character Section */}
        {currentCharacter ? (
          <Card title="Active Character" className="mb-8">
            <div className="text-center">
              <div className="text-6xl mb-4">👤</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentCharacter.name}
              </h2>
              <p className="text-gray-600 mb-6">
                Ready to continue your life simulation journey!
              </p>
              
              <div className="flex justify-center space-x-4">
                <Link to="/planner">
                  <Button variant="primary" className="px-8 py-3 text-lg">
                    Continue Playing
                  </Button>
                </Link>
                <Link to="/character-creation">
                  <Button variant="outline">
                    Edit Character
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <Card title="Get Started" className="mb-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Life Simulator!
              </h2>
              <p className="text-gray-600 mb-6">
                Create your character and start your personalized life simulation experience.
              </p>
              
              <Link to="/character-creation">
                <Button 
                  variant="primary" 
                  className="px-8 py-3 text-lg"
                  onClick={handleCreateCharacter}
                >
                  Create New Character
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="px-6 py-2 ml-4"
                onClick={handleCreateTestCharacter}
              >
                Quick Test Character
              </Button>
            </div>
          </Card>
        )}

        {/* Saved Characters */}
        {savedCharacters.length > 0 && (
          <Card title="Saved Characters" className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedCharacters.map((character) => (
                <div
                  key={character.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    currentCharacter?.id === character.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                  onClick={() => handleSelectCharacter(character.id)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">👤</div>
                    <h3 className="font-semibold text-gray-900">{character.name}</h3>
                    <p className="text-sm text-gray-600">
                      Created {new Date(character.createdAt).toLocaleDateString()}
                    </p>
                    {currentCharacter?.id === character.id && (
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded font-medium">
                          Active
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card title="Time Management" className="text-center">
            <div className="text-4xl mb-4">⏰</div>
            <p className="text-gray-600">
              Allocate your time across study, work, social activities, rest, and exercise.
            </p>
          </Card>
          
          <Card title="Resource Tracking" className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-600">
              Monitor your energy, stress, knowledge, social connections, and finances in real-time.
            </p>
          </Card>
          
          <Card title="Dynamic Events" className="text-center">
            <div className="text-4xl mb-4">🎲</div>
            <p className="text-gray-600">
              Experience random events and make choices that impact your character's development.
            </p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Start?
          </h3>
          <div className="flex justify-center space-x-4">
            {currentCharacter ? (
              <Link to="/planner">
                <Button variant="primary" className="px-6 py-2">
                  Go to Planner
                </Button>
              </Link>
            ) : (
              <Link to="/character-creation">
                <Button 
                  variant="primary" 
                  className="px-6 py-2"
                  onClick={handleCreateCharacter}
                >
                  Create Character
                </Button>
              </Link>
            )}
            <Link to="/quests">
              <Button variant="outline" className="px-6 py-2">
                View Quests
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;