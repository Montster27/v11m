// /Users/montysharma/V11M2/src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import DebugPanel from './components/DebugPanel';
import MinigameManager from './components/minigames/MinigameManager';
import { CharacterCreation, Planner, Quests, Skills, StoryletDeveloper, SplashScreen } from './pages';
import { useSaveStore } from './store/useSaveStore';
import { useAppStore } from './store/useAppStore';
import { useStoryletStore } from './store/useStoryletStore';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { getSaveSlots } = useSaveStore();
  const { activeCharacter } = useAppStore();
  const { activeMinigame, completeMinigame, closeMinigame } = useStoryletStore();

  if (showSplash) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<SplashScreen onChoiceMade={() => setShowSplash(false)} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/planner" replace />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/character-creation" element={<CharacterCreation />} />
          <Route path="/storylet-developer" element={<StoryletDeveloper />} />
          <Route path="/splash" element={<SplashScreen />} />
        </Routes>
        
        {/* Debug Panel - only in development */}
        <DebugPanel />
        
        {/* Minigame Manager - renders when a minigame is active */}
        <MinigameManager
          gameId={activeMinigame}
          onGameComplete={completeMinigame}
          onClose={closeMinigame}
        />
      </div>
    </Router>
  );
}

export default App;