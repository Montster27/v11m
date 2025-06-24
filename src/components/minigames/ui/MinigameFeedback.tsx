// /Users/montysharma/V11M2/src/components/minigames/ui/MinigameFeedback.tsx
// Enhanced feedback system for minigames

import React, { useState, useEffect } from 'react';
import { Card, Button } from '../../ui';
import { MinigameResult, MinigamePlugin } from '../core/types';
import { useMinigameStore } from '../../../stores/useMinigameStore';

interface MinigameFeedbackProps {
  plugin: MinigamePlugin;
  result: MinigameResult;
  difficulty: string;
  onClose: () => void;
  onPlayAgain: () => void;
  onChangeDifficulty: (difficulty: string) => void;
}

interface PerformanceInsight {
  type: 'positive' | 'neutral' | 'improvement';
  icon: string;
  title: string;
  message: string;
}

const MinigameFeedback: React.FC<MinigameFeedbackProps> = ({
  plugin,
  result,
  difficulty,
  onClose,
  onPlayAgain,
  onChangeDifficulty
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'stable' | 'celebrating'>('enter');
  
  const minigameStore = useMinigameStore();
  const gameStats = minigameStore.getGameStats(plugin.id);
  const recentAchievements = minigameStore.getUnlockedAchievements(plugin.id)
    .filter(achievement => Date.now() - achievement.unlockedAt < 5000); // Last 5 seconds

  useEffect(() => {
    // Entrance animation
    setTimeout(() => setAnimationPhase('stable'), 300);
    
    // Celebration animation for success
    if (result.success) {
      setTimeout(() => setAnimationPhase('celebrating'), 600);
      setTimeout(() => setAnimationPhase('stable'), 2000);
    }
  }, [result.success]);

  const generatePerformanceInsights = (): PerformanceInsight[] => {
    const insights: PerformanceInsight[] = [];
    const { stats } = result;

    // Score-based insights
    if (stats.score >= 900) {
      insights.push({
        type: 'positive',
        icon: '🌟',
        title: 'Excellent Performance!',
        message: 'You achieved an outstanding score!'
      });
    } else if (stats.score >= 700) {
      insights.push({
        type: 'positive',
        icon: '👍',
        title: 'Good Job!',
        message: 'You performed well above average.'
      });
    } else if (stats.score >= 500) {
      insights.push({
        type: 'neutral',
        icon: '📈',
        title: 'Solid Effort',
        message: 'You\'re making good progress.'
      });
    } else {
      insights.push({
        type: 'improvement',
        icon: '💪',
        title: 'Keep Practicing',
        message: 'Every attempt makes you better!'
      });
    }

    // Time-based insights
    const timeInSeconds = stats.timeElapsed / 1000;
    if (timeInSeconds < plugin.estimatedDuration * 0.75) {
      insights.push({
        type: 'positive',
        icon: '⚡',
        title: 'Speed Demon!',
        message: 'You completed this faster than expected.'
      });
    } else if (timeInSeconds > plugin.estimatedDuration * 1.5) {
      insights.push({
        type: 'improvement',
        icon: '🐌',
        title: 'Take Your Time',
        message: 'Accuracy is more important than speed.'
      });
    }

    // Streak-based insights
    if (gameStats && gameStats.currentStreak >= 3) {
      insights.push({
        type: 'positive',
        icon: '🔥',
        title: `${gameStats.currentStreak} Win Streak!`,
        message: 'You\'re on fire! Keep it up!'
      });
    }

    // Improvement insights
    if (gameStats && gameStats.totalPlays > 1) {
      const previousAverage = gameStats.averageScore;
      if (stats.score > previousAverage * 1.2) {
        insights.push({
          type: 'positive',
          icon: '📊',
          title: 'Personal Best Territory!',
          message: 'You scored well above your average.'
        });
      }
    }

    // First-time insights
    if (gameStats && gameStats.totalPlays === 1) {
      insights.push({
        type: 'neutral',
        icon: '🎯',
        title: 'First Attempt Complete!',
        message: 'Great job trying something new.'
      });
    }

    return insights;
  };

  const getScoreGrade = (score: number): { letter: string; color: string; description: string } => {
    if (score >= 950) return { letter: 'S', color: 'text-purple-600', description: 'Perfect!' };
    if (score >= 900) return { letter: 'A+', color: 'text-green-600', description: 'Excellent' };
    if (score >= 850) return { letter: 'A', color: 'text-green-600', description: 'Great' };
    if (score >= 800) return { letter: 'A-', color: 'text-green-500', description: 'Very Good' };
    if (score >= 750) return { letter: 'B+', color: 'text-blue-600', description: 'Good' };
    if (score >= 700) return { letter: 'B', color: 'text-blue-600', description: 'Above Average' };
    if (score >= 650) return { letter: 'B-', color: 'text-blue-500', description: 'Decent' };
    if (score >= 600) return { letter: 'C+', color: 'text-yellow-600', description: 'Fair' };
    if (score >= 550) return { letter: 'C', color: 'text-yellow-600', description: 'Average' };
    if (score >= 500) return { letter: 'C-', color: 'text-yellow-500', description: 'Below Average' };
    if (score >= 400) return { letter: 'D', color: 'text-orange-600', description: 'Needs Work' };
    return { letter: 'F', color: 'text-red-600', description: 'Keep Trying' };
  };

  const getDifficultyRecommendation = (): string | null => {
    if (!gameStats || gameStats.totalPlays < 3) return null;
    
    const winRate = gameStats.totalWins / gameStats.totalPlays;
    const avgScore = gameStats.averageScore;
    
    if (winRate >= 0.8 && avgScore >= 750 && difficulty !== 'expert') {
      const nextDifficulty = difficulty === 'easy' ? 'medium' : difficulty === 'medium' ? 'hard' : 'expert';
      return `Try ${nextDifficulty} difficulty for a greater challenge!`;
    } else if (winRate <= 0.3 && difficulty !== 'easy') {
      const prevDifficulty = difficulty === 'expert' ? 'hard' : difficulty === 'hard' ? 'medium' : 'easy';
      return `Consider ${prevDifficulty} difficulty to build confidence.`;
    }
    
    return null;
  };

  const insights = generatePerformanceInsights();
  const grade = getScoreGrade(result.stats.score);
  const difficultyRecommendation = getDifficultyRecommendation();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className={`max-w-2xl w-full m-4 transition-all duration-300 ${
        animationPhase === 'enter' ? 'scale-95 opacity-0' : 
        animationPhase === 'celebrating' ? 'scale-105' : 'scale-100 opacity-100'
      }`}>
        {/* Header */}
        <div className={`p-6 text-white ${
          result.success 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
            : 'bg-gradient-to-r from-blue-500 to-indigo-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {result.success ? 'Success!' : 'Game Complete'}
              </h1>
              <p className="opacity-90 mt-1">{plugin.name}</p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${grade.color.replace('text-', 'text-white opacity-')}90`}>
                {grade.letter}
              </div>
              <div className="text-sm opacity-80">{grade.description}</div>
            </div>
          </div>
        </div>

        {/* Achievement Notifications */}
        {recentAchievements.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🏆</div>
              <div>
                <h3 className="font-medium text-yellow-900">New Achievement{recentAchievements.length > 1 ? 's' : ''}!</h3>
                <div className="text-sm text-yellow-800 mt-1">
                  {recentAchievements.map(achievement => achievement.name).join(', ')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-6">
          {/* Performance Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{result.stats.score}</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(result.stats.timeElapsed / 1000)}s
              </div>
              <div className="text-sm text-gray-600">Time</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 capitalize">{difficulty}</div>
              <div className="text-sm text-gray-600">Difficulty</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {gameStats ? `${Math.round((gameStats.totalWins / gameStats.totalPlays) * 100)}%` : '100%'}
              </div>
              <div className="text-sm text-gray-600">Win Rate</div>
            </div>
          </div>

          {/* Performance Insights */}
          {insights.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Performance Insights</h3>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div 
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      insight.type === 'positive' ? 'bg-green-50 border border-green-200' :
                      insight.type === 'improvement' ? 'bg-orange-50 border border-orange-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <div className="text-2xl">{insight.icon}</div>
                    <div>
                      <div className={`font-medium ${
                        insight.type === 'positive' ? 'text-green-900' :
                        insight.type === 'improvement' ? 'text-orange-900' :
                        'text-blue-900'
                      }`}>
                        {insight.title}
                      </div>
                      <div className={`text-sm ${
                        insight.type === 'positive' ? 'text-green-700' :
                        insight.type === 'improvement' ? 'text-orange-700' :
                        'text-blue-700'
                      }`}>
                        {insight.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Recommendation */}
          {difficultyRecommendation && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <div className="font-medium text-purple-900">Difficulty Suggestion</div>
                  <div className="text-sm text-purple-700 mt-1">{difficultyRecommendation}</div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Statistics Toggle */}
          {gameStats && (
            <div className="mb-6">
              <Button
                onClick={() => setShowDetails(!showDetails)}
                variant="outline"
                className="w-full"
              >
                {showDetails ? 'Hide' : 'Show'} Detailed Statistics
              </Button>
              
              {showDetails && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900">Total Games</div>
                    <div className="text-gray-600">{gameStats.totalPlays}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900">Best Score</div>
                    <div className="text-gray-600">{gameStats.bestScore}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900">Average Score</div>
                    <div className="text-gray-600">{Math.round(gameStats.averageScore)}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900">Best Time</div>
                    <div className="text-gray-600">{Math.round(gameStats.bestTime)}s</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900">Current Streak</div>
                    <div className="text-gray-600">{gameStats.currentStreak}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900">Longest Streak</div>
                    <div className="text-gray-600">{gameStats.longestStreak}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="flex space-x-3">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
            {difficultyRecommendation && (
              <select
                onChange={(e) => onChangeDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                defaultValue={difficulty}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            )}
          </div>
          
          <Button onClick={onPlayAgain} variant="primary">
            Play Again
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MinigameFeedback;