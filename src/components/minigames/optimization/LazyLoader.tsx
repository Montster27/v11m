// /Users/montysharma/V11M2/src/components/minigames/optimization/LazyLoader.tsx
// Lazy loading and code splitting for minigame components

import React, { Suspense, lazy, ComponentType, useState, useEffect } from 'react';
import { Card } from '../../ui';

interface LazyMinigameProps {
  gameId: string;
  componentPath: string;
  fallback?: React.ComponentType;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  component: ComponentType<any> | null;
}

// Cache for loaded components to avoid re-importing
const componentCache = new Map<string, ComponentType<any>>();

// Loading fallback component
const DefaultFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Card className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Game...</h3>
      <p className="text-sm text-gray-600">Preparing your minigame experience</p>
      
      {/* Loading tips */}
      <div className="mt-4 text-xs text-gray-500">
        💡 Tip: Games are loaded on-demand to improve performance
      </div>
    </Card>
  </div>
);

// Error fallback component
const ErrorFallback: React.FC<{ error: Error; gameId: string; onRetry: () => void }> = ({ 
  error, 
  gameId, 
  onRetry 
}) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Card className="p-8 text-center max-w-md border-red-200 bg-red-50">
      <div className="text-red-500 mb-4">
        <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Game</h3>
      <p className="text-sm text-red-700 mb-4">
        Unable to load the minigame component for "{gameId}"
      </p>
      
      <details className="text-left mb-4">
        <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
          Error Details
        </summary>
        <pre className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded overflow-auto">
          {error.message}
        </pre>
      </details>
      
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </Card>
  </div>
);

// Enhanced lazy loader with performance monitoring
const LazyMinigameLoader: React.FC<LazyMinigameProps> = ({
  gameId,
  componentPath,
  fallback: CustomFallback = DefaultFallback,
  onLoad,
  onError,
  ...props
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    component: null
  });

  const loadComponent = async () => {
    // Check cache first
    if (componentCache.has(gameId)) {
      const cachedComponent = componentCache.get(gameId)!;
      setLoadingState({
        isLoading: false,
        error: null,
        component: cachedComponent
      });
      return;
    }

    setLoadingState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const loadStart = performance.now();
    
    try {
      // Dynamic import with performance monitoring
      const module = await import(componentPath);
      const Component = module.default || module[gameId];
      
      if (!Component) {
        throw new Error(`Component not found in module: ${componentPath}`);
      }

      const loadDuration = performance.now() - loadStart;
      console.log(`🎮 Loaded ${gameId} in ${loadDuration.toFixed(2)}ms`);
      
      // Cache the component
      componentCache.set(gameId, Component);
      
      setLoadingState({
        isLoading: false,
        error: null,
        component: Component
      });
      
      onLoad?.();
      
    } catch (error) {
      const loadError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ Failed to load ${gameId}:`, loadError);
      
      setLoadingState({
        isLoading: false,
        error: loadError,
        component: null
      });
      
      onError?.(loadError);
    }
  };

  useEffect(() => {
    loadComponent();
  }, [gameId, componentPath]);

  const handleRetry = () => {
    // Clear cache for this component to force reload
    componentCache.delete(gameId);
    loadComponent();
  };

  // Loading state
  if (loadingState.isLoading) {
    return <CustomFallback />;
  }

  // Error state
  if (loadingState.error) {
    return (
      <ErrorFallback 
        error={loadingState.error} 
        gameId={gameId} 
        onRetry={handleRetry} 
      />
    );
  }

  // Success state
  if (loadingState.component) {
    const Component = loadingState.component;
    return (
      <Suspense fallback={<CustomFallback />}>
        <Component {...props} />
      </Suspense>
    );
  }

  // Default fallback
  return <CustomFallback />;
};

// Higher-order component for lazy loading
export const withLazyLoading = (
  gameId: string,
  componentPath: string,
  options: {
    fallback?: React.ComponentType;
    preload?: boolean;
    onLoad?: () => void;
    onError?: (error: Error) => void;
  } = {}
) => {
  // Preload component if requested
  if (options.preload) {
    import(componentPath).then(module => {
      const Component = module.default || module[gameId];
      if (Component) {
        componentCache.set(gameId, Component);
        console.log(`🎮 Preloaded ${gameId}`);
      }
    }).catch(error => {
      console.warn(`⚠️ Failed to preload ${gameId}:`, error);
    });
  }

  return (props: any) => (
    <LazyMinigameLoader
      gameId={gameId}
      componentPath={componentPath}
      fallback={options.fallback}
      onLoad={options.onLoad}
      onError={options.onError}
      {...props}
    />
  );
};

// Preloader utility for warming up components
export class MinigamePreloader {
  private static preloadQueue: Array<{ gameId: string; componentPath: string }> = [];
  private static isPreloading = false;

  static add(gameId: string, componentPath: string) {
    if (!componentCache.has(gameId)) {
      this.preloadQueue.push({ gameId, componentPath });
      this.processQueue();
    }
  }

  private static async processQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return;
    }

    this.isPreloading = true;
    
    while (this.preloadQueue.length > 0) {
      const { gameId, componentPath } = this.preloadQueue.shift()!;
      
      try {
        const module = await import(componentPath);
        const Component = module.default || module[gameId];
        
        if (Component) {
          componentCache.set(gameId, Component);
          console.log(`🎮 Preloaded ${gameId}`);
        }
        
        // Small delay to avoid blocking the main thread
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        console.warn(`⚠️ Failed to preload ${gameId}:`, error);
      }
    }
    
    this.isPreloading = false;
  }

  static preloadAll(games: Array<{ id: string; componentPath: string }>) {
    games.forEach(game => this.add(game.id, game.componentPath));
  }

  static getCacheStats() {
    return {
      cachedComponents: componentCache.size,
      queueLength: this.preloadQueue.length,
      isPreloading: this.isPreloading,
      cachedGameIds: Array.from(componentCache.keys())
    };
  }

  static clearCache(gameId?: string) {
    if (gameId) {
      componentCache.delete(gameId);
      console.log(`🧹 Cleared cache for ${gameId}`);
    } else {
      componentCache.clear();
      console.log('🧹 Cleared all component cache');
    }
  }
}

// Performance monitoring hook for lazy loading
export const useLazyLoadingStats = () => {
  const [stats, setStats] = useState(MinigamePreloader.getCacheStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(MinigamePreloader.getCacheStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    ...stats,
    preloadGame: MinigamePreloader.add.bind(MinigamePreloader),
    clearCache: MinigamePreloader.clearCache.bind(MinigamePreloader),
    preloadAll: MinigamePreloader.preloadAll.bind(MinigamePreloader)
  };
};

export default LazyMinigameLoader;