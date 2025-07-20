// Professional logging framework to replace console.log pollution
// Provides structured logging with levels, formatting, and production controls

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  OFF = 4
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stack?: string;
}

class Logger {
  private currentLevel: LogLevel = LogLevel.INFO;
  private logHistory: LogEntry[] = [];
  private maxHistorySize: number = 1000;
  private categories: Set<string> = new Set();
  
  constructor() {
    // Set log level based on environment
    if (process.env.NODE_ENV === 'development') {
      this.currentLevel = LogLevel.DEBUG;
    } else if (process.env.NODE_ENV === 'production') {
      this.currentLevel = LogLevel.WARN;
    }
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  getLevel(): LogLevel {
    return this.currentLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel && this.currentLevel !== LogLevel.OFF;
  }

  private formatMessage(level: LogLevel, category: string, message: string): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const emoji = this.getLevelEmoji(level);
    return `${timestamp} ${emoji} [${levelName}] ${category}: ${message}`;
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      default: return '📝';
    }
  }

  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);
    this.categories.add(entry.category);
    
    // Maintain history size limit
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory = this.logHistory.slice(-this.maxHistorySize);
    }
  }

  private log(level: LogLevel, category: string, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data
    };

    // Add stack trace for errors
    if (level === LogLevel.ERROR) {
      entry.stack = new Error().stack;
    }

    this.addToHistory(entry);

    const formattedMessage = this.formatMessage(level, category, message);
    
    // Output to console with appropriate method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data);
        break;
    }
  }

  debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  warn(category: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  error(category: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  // Convenience methods for common categories
  game = {
    debug: (message: string, data?: any) => this.debug('GAME', message, data),
    info: (message: string, data?: any) => this.info('GAME', message, data),
    warn: (message: string, data?: any) => this.warn('GAME', message, data),
    error: (message: string, data?: any) => this.error('GAME', message, data)
  };

  store = {
    debug: (message: string, data?: any) => this.debug('STORE', message, data),
    info: (message: string, data?: any) => this.info('STORE', message, data),
    warn: (message: string, data?: any) => this.warn('STORE', message, data),
    error: (message: string, data?: any) => this.error('STORE', message, data)
  };

  minigame = {
    debug: (message: string, data?: any) => this.debug('MINIGAME', message, data),
    info: (message: string, data?: any) => this.info('MINIGAME', message, data),
    warn: (message: string, data?: any) => this.warn('MINIGAME', message, data),
    error: (message: string, data?: any) => this.error('MINIGAME', message, data)
  };

  narrative = {
    debug: (message: string, data?: any) => this.debug('NARRATIVE', message, data),
    info: (message: string, data?: any) => this.info('NARRATIVE', message, data),
    warn: (message: string, data?: any) => this.warn('NARRATIVE', message, data),
    error: (message: string, data?: any) => this.error('NARRATIVE', message, data)
  };

  ui = {
    debug: (message: string, data?: any) => this.debug('UI', message, data),
    info: (message: string, data?: any) => this.info('UI', message, data),
    warn: (message: string, data?: any) => this.warn('UI', message, data),
    error: (message: string, data?: any) => this.error('UI', message, data)
  };

  test = {
    debug: (message: string, data?: any) => this.debug('TEST', message, data),
    info: (message: string, data?: any) => this.info('TEST', message, data),
    warn: (message: string, data?: any) => this.warn('TEST', message, data),
    error: (message: string, data?: any) => this.error('TEST', message, data)
  };

  // Utility methods
  getHistory(category?: string, level?: LogLevel): LogEntry[] {
    let filtered = this.logHistory;
    
    if (category) {
      filtered = filtered.filter(entry => entry.category === category);
    }
    
    if (level !== undefined) {
      filtered = filtered.filter(entry => entry.level >= level);
    }
    
    return filtered;
  }

  getCategories(): string[] {
    return Array.from(this.categories).sort();
  }

  clearHistory(): void {
    this.logHistory = [];
    this.categories.clear();
  }

  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  getStats(): {
    totalLogs: number;
    categoryCounts: Record<string, number>;
    levelCounts: Record<string, number>;
  } {
    const categoryCounts: Record<string, number> = {};
    const levelCounts: Record<string, number> = {};

    this.logHistory.forEach(entry => {
      categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
      const levelName = LogLevel[entry.level];
      levelCounts[levelName] = (levelCounts[levelName] || 0) + 1;
    });

    return {
      totalLogs: this.logHistory.length,
      categoryCounts,
      levelCounts
    };
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Expose logger globally for console access in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).logger = logger;
  (window as any).LogLevel = LogLevel;
  
  console.info('🪵 Logger initialized and exposed globally');
  console.info('Usage: logger.game.info("message", data)');
  console.info('Categories: game, store, minigame, narrative, ui, test');
  console.info('Methods: debug, info, warn, error');
  console.info('Utils: logger.getHistory(), logger.getStats(), logger.setLevel(LogLevel.DEBUG)');
}

export default logger;