// V11M2 Error Tracking and Monitoring
// Simple, lightweight error tracking for production

import { env, log } from '../config/env';

// Error report interface
interface ErrorReport {
  message: string;
  stack?: string;
  userAgent: string;
  timestamp: string;
  version: string;
  url: string;
  userId?: string;
  sessionId: string;
  errorId: string;
  context?: Record<string, any>;
}

// Error classification
interface ErrorClassification {
  type: 'javascript' | 'network' | 'ui' | 'game' | 'storage' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

// Simple session ID generation
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Simple error ID generation
const generateErrorId = (): string => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
};

// Session management
class SessionManager {
  private static sessionId: string | null = null;
  
  static getSessionId(): string {
    if (!this.sessionId) {
      this.sessionId = generateSessionId();
    }
    return this.sessionId;
  }
  
  static renewSession(): string {
    this.sessionId = generateSessionId();
    return this.sessionId;
  }
}

// Error classification logic
const classifyError = (error: Error, context?: Record<string, any>): ErrorClassification => {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return { type: 'network', severity: 'medium', recoverable: true };
  }
  
  // Storage errors
  if (message.includes('storage') || message.includes('quota') || message.includes('localstorage')) {
    return { type: 'storage', severity: 'high', recoverable: false };
  }
  
  // Game logic errors
  if (stack.includes('stores/') || stack.includes('storylet') || stack.includes('minigame')) {
    return { type: 'game', severity: 'medium', recoverable: true };
  }
  
  // UI/React errors
  if (message.includes('react') || stack.includes('component') || message.includes('render')) {
    return { type: 'ui', severity: 'medium', recoverable: true };
  }
  
  // Critical errors that might crash the app
  if (message.includes('out of memory') || message.includes('stack overflow') || message.includes('maximum call stack')) {
    return { type: 'javascript', severity: 'critical', recoverable: false };
  }
  
  // Default classification
  return { type: 'unknown', severity: 'medium', recoverable: true };
};

// Error reporter
class ErrorReporter {
  private static errorQueue: ErrorReport[] = [];
  private static isReporting = false;
  
  static report(error: Error, context?: Record<string, any>): void {
    try {
      const classification = classifyError(error, context);
      
      const report: ErrorReport = {
        message: error.message,
        stack: error.stack,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        version: env.version,
        url: window.location.href,
        sessionId: SessionManager.getSessionId(),
        errorId: generateErrorId(),
        context: {
          ...context,
          classification,
          environmentName: env.name,
          debug: env.debug
        }
      };
      
      // Log to console in development
      if (env.debug) {
        log.error('Error Report:', report);
      }
      
      // In production, you could send to an error tracking service
      if (env.features.enableErrorReporting) {
        this.queueReport(report);
      }
      
      // Store in localStorage for debugging (limit to last 10 errors)
      this.storeErrorLocally(report);
      
    } catch (reportingError) {
      log.error('Failed to report error:', reportingError);
    }
  }
  
  private static queueReport(report: ErrorReport): void {
    this.errorQueue.push(report);
    
    if (!this.isReporting) {
      this.flushQueue();
    }
  }
  
  private static async flushQueue(): Promise<void> {
    if (this.errorQueue.length === 0 || this.isReporting) {
      return;
    }
    
    this.isReporting = true;
    
    try {
      // In a real implementation, you would send these to your error tracking service
      // For now, just log them
      for (const report of this.errorQueue) {
        log.info('Would send error report:', {
          errorId: report.errorId,
          message: report.message,
          severity: report.context?.classification?.severity
        });
      }
      
      this.errorQueue = [];
    } catch (flushError) {
      log.error('Failed to flush error queue:', flushError);
    } finally {
      this.isReporting = false;
    }
  }
  
  private static storeErrorLocally(report: ErrorReport): void {
    try {
      const storageKey = 'v11m2_error_reports';
      const stored = localStorage.getItem(storageKey);
      const errors = stored ? JSON.parse(stored) : [];
      
      // Add new error
      errors.push({
        errorId: report.errorId,
        message: report.message,
        timestamp: report.timestamp,
        severity: report.context?.classification?.severity,
        type: report.context?.classification?.type
      });
      
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(errors));
    } catch (storageError) {
      // Storage might be full or unavailable
      log.warn('Could not store error locally:', storageError);
    }
  }
  
  // Get locally stored errors for debugging
  static getStoredErrors(): any[] {
    try {
      const stored = localStorage.getItem('v11m2_error_reports');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  // Clear stored errors
  static clearStoredErrors(): void {
    try {
      localStorage.removeItem('v11m2_error_reports');
    } catch (clearError) {
      log.warn('Could not clear stored errors:', clearError);
    }
  }
}

// Main error reporting function
export const reportError = (error: Error, context?: Record<string, any>): void => {
  ErrorReporter.report(error, context);
};

// Convenience functions for different error types
export const reportGameError = (error: Error, gameContext?: Record<string, any>): void => {
  reportError(error, { ...gameContext, errorType: 'game' });
};

export const reportUIError = (error: Error, component?: string): void => {
  reportError(error, { component, errorType: 'ui' });
};

export const reportNetworkError = (error: Error, endpoint?: string): void => {
  reportError(error, { endpoint, errorType: 'network' });
};

// Error boundary helper
export const createErrorBoundary = (componentName: string) => {
  return (error: Error, errorInfo: any) => {
    reportUIError(error, componentName);
    log.error(`Error in ${componentName}:`, error, errorInfo);
  };
};

// Utility functions
export const getStoredErrors = (): any[] => ErrorReporter.getStoredErrors();
export const clearStoredErrors = (): void => ErrorReporter.clearStoredErrors();

// Install global error handlers
if (typeof window !== 'undefined') {
  // Unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    reportError(new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      errorType: 'unhandled'
    });
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    reportError(error, {
      errorType: 'unhandled_promise'
    });
  });

  // Log successful error tracking initialization
  log.info('🔍 Error tracking initialized');
  
  // Expose error utilities in development
  if (env.debug) {
    (window as any).V11M2ErrorUtils = {
      getStoredErrors,
      clearStoredErrors,
      reportError,
      getSessionId: SessionManager.getSessionId
    };
  }
}