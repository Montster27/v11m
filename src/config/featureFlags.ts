// /Users/montysharma/v11m2/src/config/featureFlags.ts
// Feature flags for gradual rollout and rollback capabilities

export interface FeatureFlags {
  // Save System Features
  USE_SAVE_VERSIONING: boolean;
  USE_DEBOUNCED_STORAGE: boolean;
  USE_ATOMIC_SAVES: boolean;
  USE_COMPRESSED_SAVES: boolean;
  USE_SAVE_VALIDATION: boolean;
  USE_BACKUP_SAVES: boolean;
  
  // Performance Features
  USE_MEMOIZED_FLAGS: boolean;
  USE_BATCHED_STORYLET_EVALUATION: boolean;
  USE_IDLE_CALLBACK_OPTIMIZATION: boolean;
  USE_FLAG_CACHE_PREWARMING: boolean;
  
  // Memory Management Features
  USE_SUBSCRIPTION_MANAGER: boolean;
  USE_MEMORY_LEAK_DETECTION: boolean;
  USE_RENDER_TRACKING: boolean;
  USE_AUTOMATIC_CLEANUP: boolean;
  USE_EMERGENCY_CLEANUP: boolean;
  
  // Development Features
  ENABLE_PERFORMANCE_MONITORING: boolean;
  ENABLE_DEBUG_LOGGING: boolean;
  ENABLE_STRESS_TESTING: boolean;
  ENABLE_BENCHMARK_REPORTING: boolean;
  
  // Experimental Features
  EXPERIMENTAL_SAVE_COMPRESSION: boolean;
  EXPERIMENTAL_PARALLEL_PROCESSING: boolean;
  EXPERIMENTAL_ADVANCED_CACHING: boolean;
}

// Production feature flags
export const PRODUCTION_FEATURES: FeatureFlags = {
  // Save System - Stable features
  USE_SAVE_VERSIONING: true,
  USE_DEBOUNCED_STORAGE: true,
  USE_ATOMIC_SAVES: true,
  USE_COMPRESSED_SAVES: false, // Disable until fully tested
  USE_SAVE_VALIDATION: true,
  USE_BACKUP_SAVES: true,
  
  // Performance - Tested optimizations
  USE_MEMOIZED_FLAGS: true,
  USE_BATCHED_STORYLET_EVALUATION: true,
  USE_IDLE_CALLBACK_OPTIMIZATION: true,
  USE_FLAG_CACHE_PREWARMING: false, // Conservative approach
  
  // Memory Management - Critical for stability
  USE_SUBSCRIPTION_MANAGER: true,
  USE_MEMORY_LEAK_DETECTION: true,
  USE_RENDER_TRACKING: false, // Only in development
  USE_AUTOMATIC_CLEANUP: true,
  USE_EMERGENCY_CLEANUP: true,
  
  // Development - Disabled in production
  ENABLE_PERFORMANCE_MONITORING: false,
  ENABLE_DEBUG_LOGGING: false,
  ENABLE_STRESS_TESTING: false,
  ENABLE_BENCHMARK_REPORTING: false,
  
  // Experimental - Disabled in production
  EXPERIMENTAL_SAVE_COMPRESSION: false,
  EXPERIMENTAL_PARALLEL_PROCESSING: false,
  EXPERIMENTAL_ADVANCED_CACHING: false
};

// Development feature flags
export const DEVELOPMENT_FEATURES: FeatureFlags = {
  // Save System - All features enabled for testing
  USE_SAVE_VERSIONING: true,
  USE_DEBOUNCED_STORAGE: true,
  USE_ATOMIC_SAVES: true,
  USE_COMPRESSED_SAVES: true,
  USE_SAVE_VALIDATION: true,
  USE_BACKUP_SAVES: true,
  
  // Performance - All optimizations enabled
  USE_MEMOIZED_FLAGS: true,
  USE_BATCHED_STORYLET_EVALUATION: true,
  USE_IDLE_CALLBACK_OPTIMIZATION: true,
  USE_FLAG_CACHE_PREWARMING: true,
  
  // Memory Management - Full monitoring enabled
  USE_SUBSCRIPTION_MANAGER: true,
  USE_MEMORY_LEAK_DETECTION: true,
  USE_RENDER_TRACKING: true,
  USE_AUTOMATIC_CLEANUP: true,
  USE_EMERGENCY_CLEANUP: true,
  
  // Development - All enabled
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_DEBUG_LOGGING: true,
  ENABLE_STRESS_TESTING: true,
  ENABLE_BENCHMARK_REPORTING: true,
  
  // Experimental - Enabled for testing
  EXPERIMENTAL_SAVE_COMPRESSION: true,
  EXPERIMENTAL_PARALLEL_PROCESSING: false, // Still unstable
  EXPERIMENTAL_ADVANCED_CACHING: true
};

// Staging feature flags (gradual rollout)
export const STAGING_FEATURES: FeatureFlags = {
  // Save System - Gradual rollout
  USE_SAVE_VERSIONING: true,
  USE_DEBOUNCED_STORAGE: true,
  USE_ATOMIC_SAVES: true,
  USE_COMPRESSED_SAVES: true, // Test in staging first
  USE_SAVE_VALIDATION: true,
  USE_BACKUP_SAVES: true,
  
  // Performance - Conservative rollout
  USE_MEMOIZED_FLAGS: true,
  USE_BATCHED_STORYLET_EVALUATION: true,
  USE_IDLE_CALLBACK_OPTIMIZATION: true,
  USE_FLAG_CACHE_PREWARMING: true, // Test performance impact
  
  // Memory Management - Full monitoring
  USE_SUBSCRIPTION_MANAGER: true,
  USE_MEMORY_LEAK_DETECTION: true,
  USE_RENDER_TRACKING: true, // Monitor in staging
  USE_AUTOMATIC_CLEANUP: true,
  USE_EMERGENCY_CLEANUP: true,
  
  // Development - Limited monitoring
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_DEBUG_LOGGING: false,
  ENABLE_STRESS_TESTING: false,
  ENABLE_BENCHMARK_REPORTING: true,
  
  // Experimental - Careful testing
  EXPERIMENTAL_SAVE_COMPRESSION: true,
  EXPERIMENTAL_PARALLEL_PROCESSING: false,
  EXPERIMENTAL_ADVANCED_CACHING: false
};

// Get current feature flags based on environment
export function getFeatureFlags(): FeatureFlags {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return PRODUCTION_FEATURES;
    case 'staging':
      return STAGING_FEATURES;
    case 'development':
    default:
      return DEVELOPMENT_FEATURES;
  }
}

// Individual feature flag checkers
export const Features = {
  // Save System
  isSaveVersioningEnabled: () => getFeatureFlags().USE_SAVE_VERSIONING,
  isDebouncedStorageEnabled: () => getFeatureFlags().USE_DEBOUNCED_STORAGE,
  isAtomicSavesEnabled: () => getFeatureFlags().USE_ATOMIC_SAVES,
  isCompressedSavesEnabled: () => getFeatureFlags().USE_COMPRESSED_SAVES,
  isSaveValidationEnabled: () => getFeatureFlags().USE_SAVE_VALIDATION,
  isBackupSavesEnabled: () => getFeatureFlags().USE_BACKUP_SAVES,
  
  // Performance
  isMemoizedFlagsEnabled: () => getFeatureFlags().USE_MEMOIZED_FLAGS,
  isBatchedStoryletEvaluationEnabled: () => getFeatureFlags().USE_BATCHED_STORYLET_EVALUATION,
  isIdleCallbackOptimizationEnabled: () => getFeatureFlags().USE_IDLE_CALLBACK_OPTIMIZATION,
  isFlagCachePrewarmingEnabled: () => getFeatureFlags().USE_FLAG_CACHE_PREWARMING,
  
  // Memory Management
  isSubscriptionManagerEnabled: () => getFeatureFlags().USE_SUBSCRIPTION_MANAGER,
  isMemoryLeakDetectionEnabled: () => getFeatureFlags().USE_MEMORY_LEAK_DETECTION,
  isRenderTrackingEnabled: () => getFeatureFlags().USE_RENDER_TRACKING,
  isAutomaticCleanupEnabled: () => getFeatureFlags().USE_AUTOMATIC_CLEANUP,
  isEmergencyCleanupEnabled: () => getFeatureFlags().USE_EMERGENCY_CLEANUP,
  
  // Development
  isPerformanceMonitoringEnabled: () => getFeatureFlags().ENABLE_PERFORMANCE_MONITORING,
  isDebugLoggingEnabled: () => getFeatureFlags().ENABLE_DEBUG_LOGGING,
  isStressTestingEnabled: () => getFeatureFlags().ENABLE_STRESS_TESTING,
  isBenchmarkReportingEnabled: () => getFeatureFlags().ENABLE_BENCHMARK_REPORTING,
  
  // Experimental
  isExperimentalSaveCompressionEnabled: () => getFeatureFlags().EXPERIMENTAL_SAVE_COMPRESSION,
  isExperimentalParallelProcessingEnabled: () => getFeatureFlags().EXPERIMENTAL_PARALLEL_PROCESSING,
  isExperimentalAdvancedCachingEnabled: () => getFeatureFlags().EXPERIMENTAL_ADVANCED_CACHING
};

// Feature flag override for testing
let featureFlagOverrides: Partial<FeatureFlags> = {};

export function setFeatureFlagOverride(flag: keyof FeatureFlags, value: boolean): void {
  featureFlagOverrides[flag] = value;
  console.log(`🚩 Feature flag override: ${flag} = ${value}`);
}

export function clearFeatureFlagOverrides(): void {
  featureFlagOverrides = {};
  console.log('🚩 Feature flag overrides cleared');
}

export function getFeatureFlagWithOverride(flag: keyof FeatureFlags): boolean {
  if (flag in featureFlagOverrides) {
    return featureFlagOverrides[flag]!;
  }
  return getFeatureFlags()[flag];
}

// Feature flag monitoring
export function logFeatureFlagStatus(): void {
  const flags = getFeatureFlags();
  const enabledFlags = Object.entries(flags)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag);
  
  console.log('🚩 Active Feature Flags:', enabledFlags);
}

// Gradual rollout utility
export function isFeatureEnabledForUser(
  flag: keyof FeatureFlags,
  userId?: string,
  rolloutPercentage: number = 100
): boolean {
  // Check base feature flag
  if (!getFeatureFlagWithOverride(flag)) {
    return false;
  }
  
  // If no gradual rollout, return true
  if (rolloutPercentage >= 100) {
    return true;
  }
  
  // Simple hash-based rollout
  if (userId) {
    const hash = userId.split('').reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff;
    }, 0);
    return Math.abs(hash) % 100 < rolloutPercentage;
  }
  
  // Random rollout if no user ID
  return Math.random() * 100 < rolloutPercentage;
}

// Export for easy access
export default Features;