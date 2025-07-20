// Simple, robust logging utility to replace console.log pollution
// Designed to avoid runtime errors and dependency issues

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  OFF = 4
}

interface LogConfig {
  level: LogLevel;
  enableHistory: boolean;
  maxHistorySize: number;
}

class SimpleLogger {
  private config: LogConfig;
  private history: Array<{ timestamp: number; level: LogLevel; category: string; message: string; data?: any }> = [];

  constructor() {
    this.config = {
      level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.WARN,
      enableHistory: process.env.NODE_ENV === 'development',
      maxHistorySize: 500
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level && this.config.level !== LogLevel.OFF;
  }

  private log(level: LogLevel, category: string, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const timestamp = Date.now();
    const entry = { timestamp, level, category, message, data };

    // Add to history if enabled
    if (this.config.enableHistory) {
      this.history.push(entry);
      if (this.history.length > this.config.maxHistorySize) {
        this.history = this.history.slice(-this.config.maxHistorySize);
      }
    }

    // Format message
    const levelName = LogLevel[level];
    const formattedMessage = `[${levelName}] ${category}: ${message}`;

    // Output to console
    try {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, data || '');
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, data || '');
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, data || '');
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, data || '');
          break;
      }
    } catch (error) {
      // Fallback to console.log if specific method fails
      console.log(formattedMessage, data || '');
    }
  }

  // Main logging methods
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

  // Category-specific loggers
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

  ui = {
    debug: (message: string, data?: any) => this.debug('UI', message, data),
    info: (message: string, data?: any) => this.info('UI', message, data),
    warn: (message: string, data?: any) => this.warn('UI', message, data),
    error: (message: string, data?: any) => this.error('UI', message, data)
  };

  // Utility methods
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  getHistory(): Array<{ timestamp: number; level: LogLevel; category: string; message: string; data?: any }> {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }
}

// Create singleton instance
export const logger = new SimpleLogger();

// Expose globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).logger = logger;
  (window as any).LogLevel = LogLevel;
}

export default logger;