// Environment configuration for V11M2
// Handles different deployment environments and build configurations

interface Environment {
  name: 'development' | 'staging' | 'production';
  apiUrl?: string;
  debug: boolean;
  version: string;
  features: {
    enableDevTools: boolean;
    enablePerformanceMonitoring: boolean;
    enableErrorReporting: boolean;
    enableAnalytics: boolean;
  };
}

const getEnvironment = (): Environment => {
  const mode = import.meta.env.MODE || 'development';
  const isProduction = mode === 'production';
  const isStaging = mode === 'staging';
  
  return {
    name: mode as Environment['name'],
    apiUrl: import.meta.env.VITE_API_URL,
    debug: !isProduction,
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    features: {
      enableDevTools: !isProduction,
      enablePerformanceMonitoring: isProduction || isStaging,
      enableErrorReporting: isProduction,
      enableAnalytics: isProduction,
    }
  };
};

export const env = getEnvironment();

// Environment-specific logging
export const log = {
  debug: (...args: any[]) => {
    if (env.debug) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    console.info('[INFO]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  }
};

// Feature flags based on environment
export const features = env.features;

// Environment validation
if (typeof window !== 'undefined') {
  // Only run in browser
  if (env.name === 'production' && env.debug) {
    console.warn('⚠️ Debug mode enabled in production build');
  }
  
  log.info(`🚀 V11M2 ${env.version} running in ${env.name} mode`);
}