// Debug utilities for development environment
// Simple conditional exports - Phase 1 approach

/**
 * Development-only logging function
 * Replaced with no-op in production builds
 */
export const devLog = process.env.NODE_ENV === 'development' ? console.log : () => {};

/**
 * Safely expose values to global window object in development
 * Only functions in development environment, no-op in production
 * 
 * @param key - Property name to expose on window
 * @param value - Value to expose
 */
export const exposeToWindow = (key: string, value: unknown): void => {
  if (process.env.NODE_ENV === 'development') {
    (window as any)[key] = value;
  }
};

/**
 * Development-only warning function
 */
export const devWarn = process.env.NODE_ENV === 'development' ? console.warn : () => {};

/**
 * Development-only error function
 */
export const devError = process.env.NODE_ENV === 'development' ? console.error : () => {};

/**
 * Development-only table function for structured data
 */
export const devTable = process.env.NODE_ENV === 'development' ? console.table : () => {};

/**
 * Development-only group functions for organizing console output
 */
export const devGroup = process.env.NODE_ENV === 'development' ? console.group : () => {};
export const devGroupCollapsed = process.env.NODE_ENV === 'development' ? console.groupCollapsed : () => {};
export const devGroupEnd = process.env.NODE_ENV === 'development' ? console.groupEnd : () => {};

/**
 * Development-only time functions for performance tracking
 */
export const devTime = process.env.NODE_ENV === 'development' ? console.time : () => {};
export const devTimeEnd = process.env.NODE_ENV === 'development' ? console.timeEnd : () => {};