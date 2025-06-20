/**
 * @fileoverview Error handling utilities and helpers
 * Provides centralized error handling, logging, and recovery mechanisms
 */

/**
 * Error severity levels for categorization
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for better organization
 */
export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  BUSINESS_LOGIC = 'business_logic',
  UI = 'ui',
  PERFORMANCE = 'performance',
  UNKNOWN = 'unknown'
}

/**
 * Enhanced error interface with additional context
 */
export interface ApplicationError extends Error {
  code?: string
  severity: ErrorSeverity
  category: ErrorCategory
  context?: Record<string, unknown>
  userMessage?: string
  timestamp: Date
  sessionId?: string
}

/**
 * Error reporting configuration
 */
interface ErrorReportConfig {
  enableConsoleLogging: boolean
  enableRemoteLogging: boolean
  logLevel: ErrorSeverity
  maxRetries: number
}

const defaultConfig: ErrorReportConfig = {
  enableConsoleLogging: true,
  enableRemoteLogging: process.env.NODE_ENV === 'production',
  logLevel: ErrorSeverity.LOW,
  maxRetries: 3
}

/**
 * Creates a standardized application error
 * @param message - Error message
 * @param options - Additional error options
 * @returns Formatted ApplicationError
 */
export function createAppError(
  message: string,
  options: Partial<ApplicationError> = {}
): ApplicationError {
  const error = new Error(message) as ApplicationError
  
  error.code = options.code
  error.severity = options.severity || ErrorSeverity.MEDIUM
  error.category = options.category || ErrorCategory.UNKNOWN
  error.context = options.context
  error.userMessage = options.userMessage || message
  error.timestamp = new Date()
  error.sessionId = getSessionId()
  
  return error
}

/**
 * Error handler class for centralized error management
 */
export class ErrorHandler {
  private config: ErrorReportConfig
  private errorHistory: ApplicationError[] = []
  private retryCount = new Map<string, number>()

  constructor(config: Partial<ErrorReportConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * Handles an error with appropriate logging and reporting
   * @param error - The error to handle
   * @param context - Additional context information
   */
  handle(error: Error | ApplicationError, context?: Record<string, unknown>): void {
    const appError = this.normalizeError(error, context)
    
    // Add to history
    this.errorHistory.push(appError)
    
    // Keep only last 100 errors
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-100)
    }
    
    // Log based on severity
    if (this.shouldLog(appError.severity)) {
      this.logError(appError)
    }
    
    // Report to external service if configured
    if (this.config.enableRemoteLogging) {
      this.reportError(appError)
    }
    
    // Trigger recovery if possible
    this.attemptRecovery(appError)
  }

  /**
   * Normalizes any error into an ApplicationError
   * @param error - Original error
   * @param context - Additional context
   * @returns Normalized ApplicationError
   */
  private normalizeError(error: Error | ApplicationError, context?: Record<string, unknown>): ApplicationError {
    if (this.isApplicationError(error)) {
      return { ...error, context: { ...error.context, ...context } }
    }
    
    return createAppError(error.message, {
      severity: ErrorSeverity.MEDIUM,
      category: this.categorizeError(error),
      context: { ...context, originalStack: error.stack }
    })
  }

  /**
   * Categorizes an error based on its characteristics
   * @param error - Error to categorize
   * @returns Error category
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ErrorCategory.NETWORK
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return ErrorCategory.PERMISSION
    }
    if (message.includes('performance') || message.includes('memory')) {
      return ErrorCategory.PERFORMANCE
    }
    
    return ErrorCategory.UNKNOWN
  }

  /**
   * Checks if an error is an ApplicationError
   * @param error - Error to check
   * @returns True if it's an ApplicationError
   */
  private isApplicationError(error: Error | ApplicationError): error is ApplicationError {
    return 'severity' in error && 'category' in error
  }

  /**
   * Determines if an error should be logged based on severity
   * @param severity - Error severity
   * @returns True if should log
   */
  private shouldLog(severity: ErrorSeverity): boolean {
    const severityLevels = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 1,
      [ErrorSeverity.HIGH]: 2,
      [ErrorSeverity.CRITICAL]: 3
    }
    
    return severityLevels[severity] >= severityLevels[this.config.logLevel]
  }

  /**
   * Logs an error to console or external service
   * @param error - Error to log
   */
  private logError(error: ApplicationError): void {
    if (!this.config.enableConsoleLogging) return
    
    const logData = {
      message: error.message,
      code: error.code,
      severity: error.severity,
      category: error.category,
      timestamp: error.timestamp,
      context: error.context,
      stack: error.stack
    }
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error('🚨 Error:', logData)
        break
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️ Warning:', logData)
        break
      case ErrorSeverity.LOW:
        console.info('ℹ️ Info:', logData)
        break
    }
  }

  /**
   * Reports an error to external service
   * @param error - Error to report
   */
  private reportError(error: ApplicationError): void {
    // In a real application, this would send to an error reporting service
    // like Sentry, Bugsnag, or custom logging endpoint
    
    try {
      // Example implementation
      // errorReportingService.report(error)
      console.log('Would report to external service:', {
        message: error.message,
        severity: error.severity,
        category: error.category,
        sessionId: error.sessionId
      })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  /**
   * Attempts to recover from certain types of errors
   * @param error - Error to recover from
   */
  private attemptRecovery(error: ApplicationError): void {
    const errorKey = `${error.category}-${error.code}`
    const currentRetries = this.retryCount.get(errorKey) || 0
    
    if (currentRetries >= this.config.maxRetries) {
      console.warn(`Max retries exceeded for error: ${errorKey}`)
      return
    }
    
    switch (error.category) {
      case ErrorCategory.NETWORK:
        this.retryCount.set(errorKey, currentRetries + 1)
        // Could implement exponential backoff retry logic here
        break
      case ErrorCategory.PERMISSION:
        // Could trigger re-authentication flow
        break
      default:
        // No automatic recovery for this error type
        break
    }
  }

  /**
   * Gets error history for debugging
   * @returns Array of recent errors
   */
  getErrorHistory(): ApplicationError[] {
    return [...this.errorHistory]
  }

  /**
   * Clears error history
   */
  clearHistory(): void {
    this.errorHistory = []
    this.retryCount.clear()
  }

  /**
   * Gets error statistics
   * @returns Error statistics by category and severity
   */
  getStatistics(): { byCategory: Record<string, number>; bySeverity: Record<string, number> } {
    const byCategory: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}
    
    this.errorHistory.forEach(error => {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1
    })
    
    return { byCategory, bySeverity }
  }
}

// Global error handler instance
export const globalErrorHandler = new ErrorHandler()

/**
 * React hook for error handling in functional components
 * @returns Error handling utilities
 */
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: Record<string, unknown>) => {
    globalErrorHandler.handle(error, context)
  }, [])
  
  const createError = React.useCallback((message: string, options?: Partial<ApplicationError>) => {
    return createAppError(message, options)
  }, [])
  
  return { handleError, createError }
}

/**
 * Async function wrapper that handles errors automatically
 * @param fn - Async function to wrap
 * @param context - Error context
 * @returns Wrapped function
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, unknown>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      globalErrorHandler.handle(error as Error, context)
      throw error
    }
  }) as T
}

/**
 * Safe execution wrapper for potentially failing operations
 * @param operation - Operation to execute safely
 * @param fallback - Fallback value if operation fails
 * @param context - Error context
 * @returns Result or fallback value
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  fallback: T,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    globalErrorHandler.handle(error as Error, context)
    return fallback
  }
}

/**
 * Gets a session ID for error tracking
 * @returns Session ID string
 */
function getSessionId(): string {
  // In a real app, this would be a proper session ID
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Performance monitoring wrapper
 * @param name - Operation name
 * @param operation - Operation to monitor
 * @returns Result with performance metrics
 */
export async function withPerformanceMonitoring<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  
  try {
    const result = await operation()
    const duration = performance.now() - startTime
    
    if (duration > 1000) { // Log slow operations
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
    }
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    globalErrorHandler.handle(error as Error, {
      operation: name,
      duration,
      category: ErrorCategory.PERFORMANCE
    })
    throw error
  }
}

export default ErrorHandler