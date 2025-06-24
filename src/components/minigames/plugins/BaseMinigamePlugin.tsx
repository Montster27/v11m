// /Users/montysharma/V11M2/src/components/minigames/plugins/BaseMinigamePlugin.tsx
// Base plugin class for consistent minigame implementation

import React, { useState, useEffect, useCallback } from 'react';
import { MinigameProps, MinigameResult, MinigameStats } from '../core/types';

export interface BaseGameState {
  isStarted: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  startTime: number;
  endTime?: number;
  score: number;
  attempts: number;
}

export interface BaseMinigameProps extends MinigameProps {
  // Additional common props can be added here
}

export abstract class BaseMinigameComponent<GameState extends BaseGameState = BaseGameState> 
  extends React.Component<BaseMinigameProps, GameState> {
  
  protected gameTimer: NodeJS.Timeout | null = null;
  protected pauseStart: number = 0;
  protected totalPauseTime: number = 0;

  constructor(props: BaseMinigameProps) {
    super(props);
    
    // Initialize base state - subclasses should extend this
    this.state = this.getInitialState();
  }

  // Abstract methods that subclasses must implement
  protected abstract getInitialState(): GameState;
  protected abstract renderGameContent(): React.ReactNode;
  protected abstract calculateFinalScore(): number;
  protected abstract getGameSpecificStats(): Partial<MinigameStats>;

  // Common lifecycle methods
  componentDidMount() {
    this.handleGameStart();
  }

  componentWillUnmount() {
    this.cleanup();
  }

  // Game lifecycle management
  protected handleGameStart = () => {
    this.setState({
      isStarted: true,
      startTime: Date.now()
    } as Partial<GameState>);

    this.onGameStart();
  };

  protected handleGamePause = () => {
    if (this.state.isPaused || this.state.isCompleted) return;

    this.pauseStart = Date.now();
    this.setState({ isPaused: true } as Partial<GameState>);
    
    if (this.props.onPause) {
      this.props.onPause();
    }

    this.onGamePause();
  };

  protected handleGameResume = () => {
    if (!this.state.isPaused || this.state.isCompleted) return;

    this.totalPauseTime += Date.now() - this.pauseStart;
    this.setState({ isPaused: false } as Partial<GameState>);
    
    if (this.props.onResume) {
      this.props.onResume();
    }

    this.onGameResume();
  };

  protected handleGameComplete = (success: boolean) => {
    if (this.state.isCompleted) return;

    const endTime = Date.now();
    const actualElapsed = endTime - this.state.startTime - this.totalPauseTime;
    const finalScore = this.calculateFinalScore();

    this.setState({
      isCompleted: true,
      endTime,
      score: finalScore
    } as Partial<GameState>);

    // Prepare result
    const result: MinigameResult = {
      success,
      stats: {
        score: finalScore,
        timeElapsed: actualElapsed,
        attempts: this.state.attempts,
        ...this.getGameSpecificStats()
      }
    };

    this.onGameComplete(result);
    this.props.onGameComplete(result);
    this.cleanup();
  };

  protected handleGameClose = () => {
    this.cleanup();
    this.props.onClose();
  };

  // Hook methods for subclasses to override
  protected onGameStart(): void {}
  protected onGamePause(): void {}
  protected onGameResume(): void {}
  protected onGameComplete(result: MinigameResult): void {}

  // Utility methods
  protected incrementAttempts(): void {
    this.setState(prevState => ({
      attempts: prevState.attempts + 1
    } as Partial<GameState>));
  }

  protected getElapsedTime(): number {
    if (!this.state.isStarted) return 0;
    
    const now = this.state.isCompleted ? this.state.endTime! : Date.now();
    const pauseTime = this.state.isPaused ? Date.now() - this.pauseStart : 0;
    return now - this.state.startTime - this.totalPauseTime - pauseTime;
  }

  protected cleanup(): void {
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }
  }

  // Common UI components
  protected renderGameHeader(): React.ReactNode {
    const elapsed = Math.floor(this.getElapsedTime() / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    return (
      <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">{this.getGameTitle()}</h3>
          <div className="text-sm text-gray-600">
            Difficulty: <span className="capitalize font-medium">{this.props.difficulty}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            Time: {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
          <div className="text-sm">
            Score: {this.state.score}
          </div>
          <div className="text-sm">
            Attempts: {this.state.attempts}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!this.state.isCompleted && (
            <button
              onClick={this.state.isPaused ? this.handleGameResume : this.handleGamePause}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              {this.state.isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
          )}
          <button
            onClick={this.handleGameClose}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            ✕ Close
          </button>
        </div>
      </div>
    );
  }

  protected renderGameFooter(): React.ReactNode {
    return (
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {this.getGameInstructions()}
          </div>
          <div className="text-sm text-gray-500">
            Press ESC to close • Space to pause
          </div>
        </div>
      </div>
    );
  }

  // Methods for subclasses to implement
  protected getGameTitle(): string {
    return 'Minigame';
  }

  protected getGameInstructions(): string {
    return 'Follow the on-screen instructions to play.';
  }

  // Keyboard event handling
  protected handleKeyDown = (event: KeyboardEvent) => {
    if (this.state.isCompleted) return;

    switch (event.key) {
      case 'Escape':
        this.handleGameClose();
        break;
      case ' ':
        event.preventDefault();
        if (this.state.isPaused) {
          this.handleGameResume();
        } else {
          this.handleGamePause();
        }
        break;
      default:
        this.onKeyDown(event);
    }
  };

  protected onKeyDown(event: KeyboardEvent): void {
    // Override in subclasses for game-specific controls
  }

  // Main render method
  render(): React.ReactNode {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onKeyDown={this.handleKeyDown}
        tabIndex={0}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {this.renderGameHeader()}
          
          <div className="relative">
            {this.state.isPaused && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <div className="bg-white p-6 rounded-lg text-center">
                  <h3 className="text-xl font-semibold mb-2">Game Paused</h3>
                  <p className="text-gray-600 mb-4">Click Resume or press Space to continue</p>
                  <button
                    onClick={this.handleGameResume}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Resume Game
                  </button>
                </div>
              </div>
            )}
            
            {this.renderGameContent()}
          </div>
          
          {this.renderGameFooter()}
        </div>
      </div>
    );
  }
}

// Hook-based version for functional components
export const useBaseMinigameState = (props: BaseMinigameProps) => {
  const [gameState, setGameState] = useState<BaseGameState>({
    isStarted: false,
    isPaused: false,
    isCompleted: false,
    startTime: 0,
    score: 0,
    attempts: 0
  });

  const [pauseStart, setPauseStart] = useState(0);
  const [totalPauseTime, setTotalPauseTime] = useState(0);

  // Game lifecycle handlers
  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isStarted: true,
      startTime: Date.now()
    }));
  }, []);

  const pauseGame = useCallback(() => {
    if (gameState.isPaused || gameState.isCompleted) return;
    
    setPauseStart(Date.now());
    setGameState(prev => ({ ...prev, isPaused: true }));
    
    if (props.onPause) {
      props.onPause();
    }
  }, [gameState.isPaused, gameState.isCompleted, props]);

  const resumeGame = useCallback(() => {
    if (!gameState.isPaused || gameState.isCompleted) return;
    
    setTotalPauseTime(prev => prev + Date.now() - pauseStart);
    setGameState(prev => ({ ...prev, isPaused: false }));
    
    if (props.onResume) {
      props.onResume();
    }
  }, [gameState.isPaused, gameState.isCompleted, pauseStart, props]);

  const completeGame = useCallback((success: boolean, finalScore: number, additionalStats: Partial<MinigameStats> = {}) => {
    if (gameState.isCompleted) return;

    const endTime = Date.now();
    const actualElapsed = endTime - gameState.startTime - totalPauseTime;
    
    setGameState(prev => ({
      ...prev,
      isCompleted: true,
      endTime,
      score: finalScore
    }));

    const result: MinigameResult = {
      success,
      stats: {
        score: finalScore,
        timeElapsed: actualElapsed,
        attempts: gameState.attempts,
        ...additionalStats
      }
    };

    props.onGameComplete(result);
  }, [gameState, totalPauseTime, props]);

  const incrementAttempts = useCallback(() => {
    setGameState(prev => ({ ...prev, attempts: prev.attempts + 1 }));
  }, []);

  const getElapsedTime = useCallback(() => {
    if (!gameState.isStarted) return 0;
    
    const now = gameState.isCompleted ? gameState.endTime! : Date.now();
    const currentPauseTime = gameState.isPaused ? Date.now() - pauseStart : 0;
    return now - gameState.startTime - totalPauseTime - currentPauseTime;
  }, [gameState, pauseStart, totalPauseTime]);

  // Auto-start game
  useEffect(() => {
    startGame();
  }, [startGame]);

  return {
    gameState,
    setGameState,
    startGame,
    pauseGame,
    resumeGame,
    completeGame,
    incrementAttempts,
    getElapsedTime
  };
};