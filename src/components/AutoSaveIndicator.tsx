// /Users/montysharma/v11m2/src/components/AutoSaveIndicator.tsx
// Auto-save indicator that shows real-time save status using debounced storage callbacks

import React, { useState, useEffect } from 'react';
import { debouncedStorage } from '../utils/debouncedStorage';
import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';

interface AutoSaveIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ 
  className = '',
  showDetails = true
}) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [lastSavedStore, setLastSavedStore] = useState<string>('');
  const [saveCount, setSaveCount] = useState(0);

  useEffect(() => {
    // Subscribe to debounced storage save events
    const unsubscribeSave = debouncedStorage.onSave((success, storeName) => {
      if (success) {
        setSaveStatus('saved');
        setLastSaveTime(new Date());
        setLastSavedStore(storeName);
        setSaveCount(prev => prev + 1);
        
        // Reset to idle after showing "saved" briefly
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        console.error(`[AutoSaveIndicator] Save failed for ${storeName}`);
        
        // Reset to idle after showing error
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    });

    // Subscribe to store changes to show "saving..." status
    const storeSubscriptions = [
      useCoreGameStore.subscribe(() => {
        setSaveStatus('saving');
      }),
      useNarrativeStore.subscribe(() => {
        setSaveStatus('saving');
      }),
      useSocialStore.subscribe(() => {
        setSaveStatus('saving');
      })
    ];

    return () => {
      unsubscribeSave();
      storeSubscriptions.forEach(unsub => unsub());
    };
  }, []);

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return '⏳';
      case 'saved':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '💾';
    }
  };

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save Failed';
      default:
        return lastSaveTime ? `Saved ${formatTime(lastSaveTime)}` : 'Ready';
    }
  };

  const getStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'text-yellow-600';
      case 'saved':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`autosave-indicator flex items-center space-x-2 ${className}`}>
      <span className="text-sm" role="img" aria-label="Save status">
        {getStatusIcon()}
      </span>
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {showDetails && lastSaveTime && saveStatus !== 'saving' && (
          <div className="text-xs text-gray-500">
            {lastSavedStore && (
              <span>Store: {lastSavedStore.replace('mmv-', '').replace('-store', '')}</span>
            )}
            {saveCount > 0 && (
              <span className="ml-2">({saveCount} saves)</span>
            )}
          </div>
        )}
      </div>
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 ml-2">
          <button
            onClick={() => {
              const stats = debouncedStorage.getStats();
              console.log('[AutoSaveIndicator] Storage stats:', stats);
            }}
            className="hover:text-gray-600"
            title="Log storage statistics"
          >
            🔍
          </button>
          <button
            onClick={() => {
              debouncedStorage.flush();
              console.log('[AutoSaveIndicator] Forced flush');
            }}
            className="hover:text-gray-600 ml-1"
            title="Force save flush"
          >
            🚀
          </button>
        </div>
      )}
    </div>
  );
};

// Compact version for navigation bars
export const CompactAutoSaveIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <AutoSaveIndicator 
      className={`${className} text-xs`}
      showDetails={false}
    />
  );
};

export default AutoSaveIndicator;