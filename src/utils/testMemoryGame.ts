// Test utility to launch Memory Card Game directly for image verification
// Run in browser console: testMemoryGame()

import React from 'react';
import { createRoot } from 'react-dom/client';
import MemoryCardGame from '../components/minigames/MemoryCardGame';

// Global function to test memory game
(window as any).testMemoryGame = function() {
  console.log('🃏 Launching Memory Card Game test...');
  
  // Create test container
  const testContainer = document.createElement('div');
  testContainer.id = 'memory-game-test';
  testContainer.style.zIndex = '10000';
  document.body.appendChild(testContainer);
  
  // Test completion handler
  const handleComplete = (success: boolean, stats: any) => {
    console.log('🎮 Memory Game completed:', { success, stats });
    cleanup();
  };
  
  // Test close handler
  const handleClose = () => {
    console.log('🎮 Memory Game closed');
    cleanup();
  };
  
  // Cleanup function
  const cleanup = () => {
    const container = document.getElementById('memory-game-test');
    if (container) {
      document.body.removeChild(container);
    }
  };
  
  // Render the game
  const root = createRoot(testContainer);
  root.render(
    React.createElement(MemoryCardGame, {
      onGameComplete: handleComplete,
      onClose: handleClose,
      difficulty: 'easy'
    })
  );
  
  console.log('✅ Memory Card Game launched! Check for image display.');
  console.log('📁 Images should be loaded from: /images/memory-game/');
  console.log('🔍 Open browser dev tools to check for any image loading errors.');
};

// Auto-expose function
if (typeof window !== 'undefined') {
  console.log('🃏 Memory Game test utility loaded. Run testMemoryGame() to start.');
}