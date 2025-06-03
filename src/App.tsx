// /Users/montysharma/V11M2/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import DebugPanel from './components/DebugPanel';
import { Home, CharacterCreation, Planner, Quests, Skills, StoryletDeveloper } from './pages';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/character-creation" element={<CharacterCreation />} />
          <Route path="/storylet-developer" element={<StoryletDeveloper />} />
        </Routes>
        
        {/* Debug Panel - only in development */}
        <DebugPanel />
      </div>
    </Router>
  );
}

export default App;