// Simple logger wrapper for Phase 1
// Defers Winston integration to Phase 4 as per plan
// This is the minimal implementation specified in Phase 1

import { devLog } from './debug';

/**
 * Simple console wrapper logger
 * Phase 1 implementation - will be replaced with Winston in Phase 4
 */
const logger = {
  /**
   * Log informational messages
   */
  info: (...args: any[]) => console.info('[INFO]', ...args),
  
  /**
   * Log warning messages
   */
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  
  /**
   * Log error messages
   */
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  
  /**
   * Log debug messages (development only)
   */
  debug: devLog,
  
  /**
   * Log success messages
   */
  success: (...args: any[]) => console.log('[SUCCESS]', ...args)
};

export default logger;