// /Users/montysharma/V11M2/src/components/minigames/core/MinigameEngine.ts
// Unified game state management and lifecycle for minigames

import { 
  MinigameContext, 
  MinigameResult, 
  MinigameSessionData,
  MinigameDifficulty,
  PlayerMinigameStats 
} from './types';
import { DifficultyManager } from './DifficultyManager';
import registry from './MinigameRegistry';

export interface MinigameEngineConfig {
  enableAnalytics: boolean;
  enableAutoSave: boolean;
  enableDifficultyAdjustment: boolean;
  enableTutorials: boolean;
  maxSessionDuration: number; // seconds
  pauseTimeLimit: number; // seconds before auto-resume
}

export interface ActiveSession {
  sessionData: MinigameSessionData;
  startTime: number;
  pauseStart?: number;
  totalPauseTime: number;
  isActive: boolean;
  component?: React.ComponentType<any>;
}

export class MinigameEngine {
  private static instance: MinigameEngine;
  
  private config: MinigameEngineConfig = {
    enableAnalytics: true,
    enableAutoSave: true,
    enableDifficultyAdjustment: true,
    enableTutorials: true,
    maxSessionDuration: 600, // 10 minutes
    pauseTimeLimit: 120 // 2 minutes
  };

  private difficultyManager = new DifficultyManager();
  private currentSession: ActiveSession | null = null;
  private sessionHistory: MinigameSessionData[] = [];
  private pauseTimer: NodeJS.Timeout | null = null;

  // Event listeners for external integration
  private listeners: {
    sessionStart: Array<(session: MinigameSessionData) => void>;
    sessionEnd: Array<(session: MinigameSessionData, result: MinigameResult) => void>;
    sessionPause: Array<(session: MinigameSessionData) => void>;
    sessionResume: Array<(session: MinigameSessionData) => void>;
    difficultyAdjust: Array<(gameId: string, oldDiff: MinigameDifficulty, newDiff: MinigameDifficulty) => void>;
    [key: string]: Array<(...args: any[]) => void>; // Allow arbitrary event types for testing
  } = {
    sessionStart: [],
    sessionEnd: [],
    sessionPause: [],
    sessionResume: [],
    difficultyAdjust: []
  };

  private constructor() {
    console.log('🎮 MinigameEngine initialized');
  }

  static getInstance(): MinigameEngine {
    if (!MinigameEngine.instance) {
      MinigameEngine.instance = new MinigameEngine();
    }
    return MinigameEngine.instance;
  }

  /**
   * Launch a minigame with context
   */
  async launchGame(
    gameId: string, 
    context: MinigameContext,
    playerStats: PlayerMinigameStats
  ): Promise<{ 
    component: React.ComponentType<any>; 
    props: any; 
    sessionId: string 
  }> {
    console.log(`🚀 Launching minigame: ${gameId}`);

    // Get plugin
    const plugin = registry.get(gameId);
    if (!plugin) {
      throw new Error(`Minigame plugin not found: ${gameId}`);
    }

    // Calculate appropriate difficulty
    let difficulty = context.requiredDifficulty;
    if (!difficulty && this.config.enableDifficultyAdjustment) {
      difficulty = this.difficultyManager.calculateDifficulty(gameId, playerStats, context);
    }
    if (!difficulty) {
      difficulty = plugin.defaultDifficulty;
    }

    // Preprocess context if plugin provides handler
    let processedContext = context;
    if (plugin.preprocessContext) {
      processedContext = plugin.preprocessContext(context);
    }

    // Create session
    const sessionId = this.generateSessionId();
    const sessionData: MinigameSessionData = {
      sessionId,
      gameId,
      startTime: Date.now(),
      difficulty,
      context: processedContext,
      events: [{
        type: 'start',
        timestamp: Date.now(),
        data: { difficulty, context: processedContext }
      }]
    };

    // Set up active session
    this.currentSession = {
      sessionData,
      startTime: Date.now(),
      totalPauseTime: 0,
      isActive: true,
      component: plugin.component
    };

    // Fire session start event
    this.fireEvent('sessionStart', sessionData);

    // Auto-save session if enabled
    if (this.config.enableAutoSave) {
      this.saveSession(sessionData);
    }

    // Set up max duration timer
    setTimeout(() => {
      if (this.currentSession?.sessionData.sessionId === sessionId) {
        console.warn('⏰ Minigame session exceeded maximum duration, auto-completing');
        this.forceCompleteSession({
          success: false,
          stats: {
            score: 0,
            timeElapsed: this.config.maxSessionDuration * 1000,
            attempts: 1
          }
        });
      }
    }, this.config.maxSessionDuration * 1000);

    // Create component props
    const props = {
      difficulty,
      context: processedContext,
      onGameComplete: this.createCompletionHandler(sessionId),
      onClose: this.createCloseHandler(sessionId),
      onPause: this.createPauseHandler(sessionId),
      onResume: this.createResumeHandler(sessionId)
    };

    return {
      component: plugin.component,
      props,
      sessionId
    };
  }

  /**
   * Create game completion handler
   */
  private createCompletionHandler(sessionId: string) {
    return (result: MinigameResult) => {
      if (!this.currentSession || this.currentSession.sessionData.sessionId !== sessionId) {
        console.warn('⚠️ Completion called for inactive session');
        return;
      }

      this.completeSession(result);
    };
  }

  /**
   * Create game close handler
   */
  private createCloseHandler(sessionId: string) {
    return () => {
      if (!this.currentSession || this.currentSession.sessionData.sessionId !== sessionId) {
        console.warn('⚠️ Close called for inactive session');
        return;
      }

      // Close without completion (user cancelled)
      this.abortSession();
    };
  }

  /**
   * Create pause handler
   */
  private createPauseHandler(sessionId: string) {
    return () => {
      if (!this.currentSession || this.currentSession.sessionData.sessionId !== sessionId) {
        return;
      }

      this.pauseSession();
    };
  }

  /**
   * Create resume handler
   */
  private createResumeHandler(sessionId: string) {
    return () => {
      if (!this.currentSession || this.currentSession.sessionData.sessionId !== sessionId) {
        return;
      }

      this.resumeSession();
    };
  }

  /**
   * Complete current session with result
   */
  private completeSession(result: MinigameResult): void {
    if (!this.currentSession) return;

    const { sessionData } = this.currentSession;
    const plugin = registry.get(sessionData.gameId);

    // Clear pause timer if active
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }

    // Calculate actual elapsed time
    const endTime = Date.now();
    const actualElapsed = endTime - sessionData.startTime - this.currentSession.totalPauseTime;
    
    // Update result with actual timing
    const finalResult = {
      ...result,
      stats: {
        ...result.stats,
        timeElapsed: actualElapsed
      }
    };

    // Postprocess result if plugin provides handler
    let processedResult = finalResult;
    if (plugin?.postprocessResult) {
      processedResult = plugin.postprocessResult(finalResult, sessionData.context);
    }

    // Update session data
    sessionData.endTime = endTime;
    sessionData.result = processedResult;
    sessionData.events.push({
      type: 'complete',
      timestamp: endTime,
      data: processedResult
    });

    // Add to history
    this.sessionHistory.push(sessionData);

    // Fire completion event
    this.fireEvent('sessionEnd', sessionData, processedResult);

    // Auto-save if enabled
    if (this.config.enableAutoSave) {
      this.saveSession(sessionData);
    }

    // Clear current session
    this.currentSession = null;

    console.log(`✅ Completed minigame session: ${sessionData.gameId} (${finalResult.success ? 'success' : 'failure'})`);
  }

  /**
   * Pause current session
   */
  pauseSession(): void {
    if (!this.currentSession || this.currentSession.pauseStart) return;

    this.currentSession.pauseStart = Date.now();
    this.currentSession.isActive = false;

    // Add pause event
    this.currentSession.sessionData.events.push({
      type: 'pause',
      timestamp: Date.now()
    });

    // Set auto-resume timer
    this.pauseTimer = setTimeout(() => {
      console.log('⏰ Auto-resuming paused minigame session');
      this.resumeSession();
    }, this.config.pauseTimeLimit * 1000);

    this.fireEvent('sessionPause', this.currentSession.sessionData);
    console.log('⏸️ Minigame session paused');
  }

  /**
   * Resume current session
   */
  resumeSession(): void {
    if (!this.currentSession || !this.currentSession.pauseStart) return;

    const pauseDuration = Date.now() - this.currentSession.pauseStart;
    this.currentSession.totalPauseTime += pauseDuration;
    this.currentSession.pauseStart = undefined;
    this.currentSession.isActive = true;

    // Clear auto-resume timer
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }

    // Add resume event
    this.currentSession.sessionData.events.push({
      type: 'resume',
      timestamp: Date.now(),
      data: { pauseDuration }
    });

    this.fireEvent('sessionResume', this.currentSession.sessionData);
    console.log('▶️ Minigame session resumed');
  }

  /**
   * Abort current session without completion
   */
  private abortSession(): void {
    if (!this.currentSession) return;

    console.log('❌ Aborting minigame session');
    
    // Clear timers
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }

    // Mark as incomplete and add to history
    this.currentSession.sessionData.endTime = Date.now();
    this.sessionHistory.push(this.currentSession.sessionData);

    this.currentSession = null;
  }

  /**
   * Force complete session (e.g., timeout)
   */
  private forceCompleteSession(result: MinigameResult): void {
    if (this.currentSession) {
      this.completeSession(result);
    }
  }

  /**
   * Add event to current session
   */
  addSessionEvent(type: string, data?: any): void {
    if (this.currentSession) {
      this.currentSession.sessionData.events.push({
        type: type as any,
        timestamp: Date.now(),
        data
      });
    }
  }

  /**
   * Get current session info
   */
  getCurrentSession(): ActiveSession | null {
    return this.currentSession;
  }

  /**
   * Get session history
   */
  getSessionHistory(gameId?: string): MinigameSessionData[] {
    if (gameId) {
      return this.sessionHistory.filter(session => session.gameId === gameId);
    }
    return [...this.sessionHistory];
  }

  /**
   * Get active sessions (for compatibility with tests)
   */
  getActiveSessions(): ActiveSession[] {
    return this.currentSession ? [this.currentSession] : [];
  }

  /**
   * Dispatch event (for compatibility with tests)
   */
  dispatchEvent(
    event: string,
    ...args: any[]
  ): void {
    this.fireEvent(event, ...args);
  }

  /**
   * Event listener management
   */
  addEventListener(
    event: string, 
    callback: (...args: any[]) => void
  ): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeEventListener(
    event: string, 
    callback: (...args: any[]) => void
  ): void {
    if (!this.listeners[event]) return;
    
    const index = this.listeners[event].indexOf(callback);
    if (index >= 0) {
      this.listeners[event].splice(index, 1);
    }
  }

  /**
   * Fire event to all listeners
   */
  private fireEvent(
    event: string, 
    ...args: any[]
  ): void {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach((callback: any) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MinigameEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Updated MinigameEngine config:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): MinigameEngineConfig {
    return { ...this.config };
  }

  /**
   * Utility methods
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveSession(session: MinigameSessionData): void {
    // Implementation would save to persistent storage
    // For now, just log
    console.log('💾 Auto-saved session:', session.sessionId);
  }

  /**
   * Analytics and statistics
   */
  getEngineStatistics() {
    const totalSessions = this.sessionHistory.length;
    const completedSessions = this.sessionHistory.filter(s => s.result).length;
    const averageDuration = this.sessionHistory
      .filter(s => s.endTime)
      .reduce((sum, s) => sum + (s.endTime! - s.startTime), 0) / totalSessions || 0;

    return {
      totalSessions,
      completedSessions,
      completionRate: totalSessions > 0 ? completedSessions / totalSessions : 0,
      averageDuration: Math.round(averageDuration / 1000), // seconds
      activeSession: this.currentSession !== null,
      gamesPlayed: new Set(this.sessionHistory.map(s => s.gameId)).size
    };
  }

  // Static methods for backward compatibility and easier testing
  static addEventListener(
    event: string, 
    callback: (...args: any[]) => void
  ): void {
    MinigameEngine.getInstance().addEventListener(event, callback);
  }

  static removeEventListener(
    event: string, 
    callback: (...args: any[]) => void
  ): void {
    MinigameEngine.getInstance().removeEventListener(event, callback);
  }

  static dispatchEvent(
    event: string,
    ...args: any[]
  ): void {
    MinigameEngine.getInstance().dispatchEvent(event, ...args);
  }

  static getActiveSessions(): ActiveSession[] {
    return MinigameEngine.getInstance().getActiveSessions();
  }

  static launchGame(
    gameId: string, 
    context: MinigameContext,
    playerStats: PlayerMinigameStats
  ): Promise<{ 
    component: React.ComponentType<any>; 
    props: any; 
    sessionId: string 
  }> {
    return MinigameEngine.getInstance().launchGame(gameId, context, playerStats);
  }

  static getCurrentSession(): ActiveSession | null {
    return MinigameEngine.getInstance().getCurrentSession();
  }

  static getSessionHistory(gameId?: string): MinigameSessionData[] {
    return MinigameEngine.getInstance().getSessionHistory(gameId);
  }

  static getEngineStatistics() {
    return MinigameEngine.getInstance().getEngineStatistics();
  }
}

// Export the class (with static methods) and create a default instance
const engineInstance = MinigameEngine.getInstance();

// Export both the class and the instance
export default MinigameEngine;
export { engineInstance };