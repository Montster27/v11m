// Test script for dynamic difficulty system
// Run this in browser console to verify Phase 2 implementation

import { useMinigameStore } from '../stores/useMinigameStore';
import { MinigameResult } from '../components/minigames/core/types';

export function testDynamicDifficulty() {
  console.log('🧪 Testing Dynamic Difficulty System');
  
  const gameId = 'memory-cards';
  const store = useMinigameStore.getState();
  
  // Reset game stats first
  store.resetGameStats(gameId);
  
  console.log('\n1️⃣ Testing Win Progression (Easy → Medium → Hard → Expert)');
  
  // First game: Win at Easy
  let result: MinigameResult = {
    success: true,
    stats: { score: 800, timeElapsed: 60000, attempts: 10, accuracy: 90, hintsUsed: 0 }
  };
  
  store.recordGameResult(gameId, result, 'easy');
  let gameStats = store.getGameStats(gameId);
  console.log(`After 1st win: difficulty = ${gameStats?.currentDifficulty} (should be medium)`);
  
  // Second game: Win at Medium  
  store.recordGameResult(gameId, result, gameStats?.currentDifficulty || 'medium');
  gameStats = store.getGameStats(gameId);
  console.log(`After 2nd win: difficulty = ${gameStats?.currentDifficulty} (should be hard)`);
  
  // Third game: Win at Hard
  store.recordGameResult(gameId, result, gameStats?.currentDifficulty || 'hard');
  gameStats = store.getGameStats(gameId);
  console.log(`After 3rd win: difficulty = ${gameStats?.currentDifficulty} (should be expert)`);
  
  // Fourth game: Win at Expert (should stay expert)
  store.recordGameResult(gameId, result, gameStats?.currentDifficulty || 'expert');
  gameStats = store.getGameStats(gameId);
  console.log(`After 4th win: difficulty = ${gameStats?.currentDifficulty} (should stay expert)`);
  
  console.log('\n2️⃣ Testing Loss Regression (Expert → Hard after 3 losses)');
  
  // Lose 3 times in a row
  const lossResult: MinigameResult = {
    success: false,
    stats: { score: 200, timeElapsed: 120000, attempts: 20, accuracy: 40, hintsUsed: 5 }
  };
  
  store.recordGameResult(gameId, lossResult, 'expert');
  gameStats = store.getGameStats(gameId);
  console.log(`After 1st loss: difficulty = ${gameStats?.currentDifficulty} (should stay expert)`);
  
  store.recordGameResult(gameId, lossResult, 'expert');
  gameStats = store.getGameStats(gameId);
  console.log(`After 2nd loss: difficulty = ${gameStats?.currentDifficulty} (should stay expert)`);
  
  store.recordGameResult(gameId, lossResult, 'expert');
  gameStats = store.getGameStats(gameId);
  console.log(`After 3rd loss: difficulty = ${gameStats?.currentDifficulty} (should be hard)`);
  
  console.log('\n3️⃣ Final Game Stats:');
  console.log('Total games:', gameStats?.totalPlays);
  console.log('Total wins:', gameStats?.totalWins);
  console.log('Total losses:', gameStats?.totalLosses);
  console.log('Current streak:', gameStats?.currentStreak);
  console.log('Difficulty history:', gameStats?.difficultyHistory);
  
  const passed = 
    gameStats?.totalPlays === 7 &&
    gameStats?.totalWins === 4 &&
    gameStats?.totalLosses === 3 &&
    gameStats?.currentDifficulty === 'hard';
    
  console.log(`\n✨ Test ${passed ? 'PASSED' : 'FAILED'}`);
  
  return {
    passed,
    stats: gameStats,
    message: passed ? 
      'Dynamic difficulty system working correctly!' :
      'Dynamic difficulty system has issues - check implementation'
  };
}

// Auto-run test if in browser
if (typeof window !== 'undefined') {
  console.log('Dynamic Difficulty Test loaded. Run testDynamicDifficulty() to test.');
}