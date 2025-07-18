// Store hydration provider to ensure all stores are hydrated before rendering
import React, { useState, useEffect, ReactNode } from 'react';
import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';

interface StoreHydrationProviderProps {
  children: ReactNode;
}

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Game Data...</h2>
      <p className="text-gray-600">Hydrating stores from saved data</p>
    </div>
  </div>
);

export function StoreHydrationProvider({ children }: StoreHydrationProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydrationStatus, setHydrationStatus] = useState({
    core: false,
    narrative: false,
    social: false
  });

  // Check hydration status from stores
  const coreHydrated = useCoreGameStore(state => state._hasHydrated);
  const narrativeHydrated = useNarrativeStore(state => state._hasHydrated);
  const socialHydrated = useSocialStore(state => state._hasHydrated);

  useEffect(() => {
    const checkHydration = () => {
      const status = {
        core: coreHydrated,
        narrative: narrativeHydrated,
        social: socialHydrated
      };
      
      console.log('🔍 Hydration status check:', status);
      setHydrationStatus(status);
      
      // All stores must be hydrated
      const allHydrated = status.core && status.narrative && status.social;
      
      if (allHydrated && !isHydrated) {
        console.log('✅ All stores hydrated, rendering app');
        console.log('🔍 Store states:');
        console.log('- Core arcs:', Object.keys(useCoreGameStore.getState().character || {}).length);
        console.log('- Narrative arcs:', Object.keys(useNarrativeStore.getState().storyArcs || {}).length);
        console.log('- Social clues:', Object.keys(useSocialStore.getState().clues?.discovered || {}).length);
        setIsHydrated(true);
      }
    };

    checkHydration();
  }, [coreHydrated, narrativeHydrated, socialHydrated, isHydrated]);

  // Fallback timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isHydrated) {
        console.warn('⚠️ Store hydration timeout, rendering app anyway');
        setIsHydrated(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [isHydrated]);

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

// Debug utilities
if (process.env.NODE_ENV === 'development') {
  (window as any).debugStoreHydration = () => {
    console.log('Store Hydration Status:');
    console.log('Core:', useCoreGameStore.getState()._hasHydrated);
    console.log('Narrative:', useNarrativeStore.getState()._hasHydrated);
    console.log('Social:', useSocialStore.getState()._hasHydrated);
  };
}