// /Users/montysharma/V11M2/src/components/Navigation.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCoreGameStore } from '../stores/v2';
// REMOVED: import { useCharacterStore } from '../store/characterStore';
import { ProgressBadge } from './ui';
import SaveManager from './SaveManager';
import StoryletProgress from './StoryletProgress';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  // Fix: Read ALL data from the NEW consolidated store only
  const userLevel = useCoreGameStore((state) => state.player.level);
  const experience = useCoreGameStore((state) => state.player.experience);
  const day = useCoreGameStore((state) => state.world.day);
  const activeCharacter = useCoreGameStore((state) => state.character);
  const isTimePaused = useCoreGameStore((state) => state.world.isTimePaused);
  
  // REMOVED: const { currentCharacter } = useCharacterStore();
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showStoryletProgress, setShowStoryletProgress] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  const navLinkClass = (path: string) => 
    `nav-link px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-blue-500 text-white'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <>
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand and Character Info */}
            <div className="flex items-center space-x-6">
              <Link to="/planner" className="flex items-center space-x-2">
                <div className="text-2xl">🎮</div>
                <span className="text-xl font-bold text-gray-900">MMV</span>
              </Link>
              
              {/* Active Character - FIXED: Only read from new store */}
              {activeCharacter?.name && (
                <div className="flex items-center space-x-2 text-lg">
                  <div className="text-xl">👤</div>
                  <span className="font-medium text-gray-700">
                    Character: {activeCharacter.name}
                  </span>
                </div>
              )}
            </div>
            
            {/* Navigation Links */}
            <div className="flex items-center space-x-2">
              <Link to="/planner" className={navLinkClass('/planner')}>
                Planner
              </Link>
              <Link to="/quests" className={navLinkClass('/quests')}>
                Quests
              </Link>
              <Link to="/skills" className={navLinkClass('/skills')}>
                Skills
              </Link>
              
              {/* Save & Progress Buttons */}
              <button
                onClick={() => setShowSaveManager(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 flex items-center gap-1"
              >
                💾 Save
              </button>
              <button
                onClick={() => setShowStoryletProgress(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 flex items-center gap-1"
              >
                📚 Progress
              </button>
              
              <Link to="/character-creation" className={navLinkClass('/character-creation')}>
                New Character
              </Link>
              
              {/* Developer Tools - only in development */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <Link to="/storylet-developer" className={navLinkClass('/storylet-developer')}>
                    📖 Dev
                  </Link>
                  <Link to="/content-creator" className={navLinkClass('/content-creator')}>
                    🎨 Creator
                  </Link>
                </>
              )}
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center space-x-3">
              <ProgressBadge title="Level" value={userLevel || 1} color="purple" />
              <ProgressBadge title="XP" value={experience || 0} color="blue" />
              <ProgressBadge title="Day" value={day || 1} color="teal" />
              
              {/* Time Pause Indicator */}
              {isTimePaused && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium">
                  <span>⏸️</span>
                  <span>Time Paused</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Modals */}
      <SaveManager 
        isOpen={showSaveManager} 
        onClose={() => setShowSaveManager(false)} 
      />
      <StoryletProgress 
        isOpen={showStoryletProgress} 
        onClose={() => setShowStoryletProgress(false)} 
      />
    </>
  );
};

export default Navigation;