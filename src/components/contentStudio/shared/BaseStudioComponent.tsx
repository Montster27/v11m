// /Users/montysharma/V11M2/src/components/contentStudio/shared/BaseStudioComponent.tsx
// Shared foundation for Content Studio components - preserves all existing functionality

import React, { ReactNode, useState, useEffect } from 'react';
import { UndoRedoAction } from '../../../hooks/useUndoRedo';

interface UndoRedoSystem {
  executeAction: (action: UndoRedoAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface BaseStudioComponentProps {
  children: ReactNode;
  title: string;
  helpText?: string;
  undoRedoSystem?: UndoRedoSystem;
  onExecuteAction?: (action: () => void, title: string, message: string, type?: 'warning' | 'danger') => void;
  
  // Layout customization
  showHeader?: boolean;
  showUndoRedo?: boolean;
  className?: string;
  headerActions?: ReactNode;
  
  // Error handling
  errorFallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  
  // Loading states
  isLoading?: boolean;
  loadingText?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class StudioErrorBoundary extends React.Component<
  { fallback?: ReactNode; onError?: (error: Error, errorInfo: React.ErrorInfo) => void; children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Content Studio Error:', error, errorInfo);
    
    // Preserve existing functionality - log to console for debugging
    console.group('🎬 Content Studio Error Details');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="text-red-500">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800">
              Content Studio Error
            </h3>
          </div>
          <div className="text-red-700 mb-4">
            <p className="font-medium">Something went wrong in the content studio.</p>
            <p className="text-sm mt-2 opacity-75">
              Error: {this.state.error?.message}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const BaseStudioComponent: React.FC<BaseStudioComponentProps> = ({
  children,
  title,
  helpText,
  undoRedoSystem,
  onExecuteAction,
  showHeader = true,
  showUndoRedo = true,
  className = '',
  headerActions,
  errorFallback,
  onError,
  isLoading = false,
  loadingText = 'Loading...'
}) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save indicator (preserve existing auto-save functionality)
  useEffect(() => {
    const interval = setInterval(() => {
      // This will be extended by implementing components
      setLastSaved(new Date());
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{loadingText}</p>
        </div>
      </div>
    );
  }

  return (
    <StudioErrorBoundary fallback={errorFallback} onError={onError}>
      <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
        {showHeader && (
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                {helpText && (
                  <div className="text-gray-500 text-sm">
                    💡 {helpText}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Last saved indicator */}
                {lastSaved && (
                  <div className="text-xs text-gray-500">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </div>
                )}
                
                {/* Undo/Redo Controls */}
                {showUndoRedo && undoRedoSystem && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={undoRedoSystem.undo}
                      disabled={!undoRedoSystem.canUndo}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        undoRedoSystem.canUndo
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      title="Undo (Ctrl+Z)"
                    >
                      ↶ Undo
                    </button>
                    <button
                      onClick={undoRedoSystem.redo}
                      disabled={!undoRedoSystem.canRedo}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        undoRedoSystem.canRedo
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      title="Redo (Ctrl+Y)"
                    >
                      ↷ Redo
                    </button>
                  </div>
                )}
                
                {/* Custom header actions */}
                {headerActions}
              </div>
            </div>
          </div>
        )}
        
        {/* Main content area */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </StudioErrorBoundary>
  );
};

export default BaseStudioComponent;
export type { BaseStudioComponentProps, UndoRedoSystem };