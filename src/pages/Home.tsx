// /Users/montysharma/V11M2/src/pages/Home.tsx

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useStoryletStore } from '../store/useStoryletStore';
import { Button, Card } from '../components/ui';
import StoryletPanel from '../components/StoryletPanel';
import ResourcePanel from '../components/ResourcePanel';
import TimeAllocationPanel from '../components/TimeAllocationPanel';

const Home: React.FC = () => {
  const { activeCharacter, setActiveCharacter, addExperience, isTimePaused } = useAppStore();
  const { evaluateStorylets } = useStoryletStore();
  
  // Evaluate storylets when component mounts and periodically
  useEffect(() => {
    // Force immediate evaluation on mount
    setTimeout(() => evaluateStorylets(), 100);
    evaluateStorylets();
    
    // Re-evaluate storylets every 10 seconds to catch time-based triggers
    const interval = setInterval(() => {
      // Don't evaluate storylets if time is paused (minigame active)
      if (!isTimePaused) {
        evaluateStorylets();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [evaluateStorylets, isTimePaused]);

  const handleCreateCharacter = () => {
    // Navigate to character creation - this should set activeCharacter when done
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
        {activeCharacter ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main Storylet Panel */}
            <div className="lg:col-span-2">
              <Card title="Current Events" className="mb-6">
                <StoryletPanel />
              </Card>
              
              {/* Character Info */}
              <Card title="Active Character" className="">
                <div className="text-center">
                  <div className="text-4xl mb-2">👤</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {activeCharacter.name}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Ready to continue your life simulation journey!
                  </p>
                  
                  <div className="flex justify-center space-x-3">
                    <Link to="/planner">
                      <Button variant="primary" size="sm">
                        Planner
                      </Button>
                    </Link>
                    <Link to="/quests">
                      <Button variant="outline" size="sm">
                        Quests
                      </Button>
                    </Link>
                    <Link to="/skills">
                      <Button variant="outline" size="sm">
                        Skills
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Sidebar with Resources and Time Allocation */}
            <div className="space-y-6">
              <ResourcePanel />
              <TimeAllocationPanel />
            </div>
          </div>
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
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Start?
          </h3>
          <div className="flex justify-center space-x-4">
            {activeCharacter ? (
              <>
                <Link to="/planner">
                  <Button variant="primary" className="px-6 py-2">
                    Go to Planner
                  </Button>
                </Link>
                <Link to="/quests">
                  <Button variant="outline" className="px-6 py-2">
                    View Quests
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/character-creation">
                  <Button 
                    variant="primary" 
                    className="px-6 py-2"
                    onClick={handleCreateCharacter}
                  >
                    Create Character
                  </Button>
                </Link>
                <Link to="/quests">
                  <Button variant="outline" className="px-6 py-2">
                    View Quests
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;