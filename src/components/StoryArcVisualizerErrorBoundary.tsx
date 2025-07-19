// StoryArcVisualizerErrorBoundary.tsx
// Error boundary specifically designed for StoryArcVisualizer crash prevention

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Card } from './ui';

interface Props {
  children: ReactNode;
  arcName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

export class StoryArcVisualizerErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state to show error UI
    return {
      hasError: true,
      error,
      errorId: `arc-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with context about the arc and visualization state
    console.error('🚨 StoryArcVisualizer Error Boundary Caught Error:', {
      arcName: this.props.arcName,
      error: error.message,
      stack: error.stack,
      errorInfo: errorInfo.componentStack,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString()
    });

    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Try to recover graph state if possible
    this.attemptStateRecovery();
  }

  private attemptStateRecovery = () => {
    try {
      // Clear potentially corrupted localStorage entries
      const keysToCheck = [
        `mmv-arc-visualizer-${this.props.arcName}`,
        'mmv-viewport-state',
        'mmv-edit-state'
      ];

      keysToCheck.forEach(key => {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            // Validate stored data
            JSON.parse(stored);
          }
        } catch (e) {
          console.warn(`🔧 Clearing corrupted localStorage key: ${key}`);
          localStorage.removeItem(key);
        }
      });

      // Reset arc visualizer store if available
      const arcVisualizerStore = (window as any).useArcVisualizerStore?.getState();
      if (arcVisualizerStore?.reset) {
        console.log('🔧 Resetting Arc Visualizer store for recovery');
        arcVisualizerStore.reset();
      }

    } catch (recoveryError) {
      console.error('🚨 Recovery attempt failed:', recoveryError);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      console.log(`🔄 Attempting retry ${this.state.retryCount + 1}/${this.maxRetries} for arc: ${this.props.arcName}`);
      
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));

      // Additional recovery steps for retry
      this.attemptStateRecovery();
    }
  };

  private handleReportError = () => {
    const errorReport = {
      arcName: this.props.arcName,
      errorId: this.state.errorId,
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Copy error report to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error report copied to clipboard. Please paste it in a bug report.');
      })
      .catch(() => {
        console.error('Failed to copy error report:', errorReport);
        alert('Failed to copy error report. Check console for details.');
      });
  };

  private handleForceReload = () => {
    // Clear all arc-related data and reload
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.includes('arc') || key.includes('storylet') || key.includes('visualizer')
    );
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const canRetry = this.state.retryCount < this.maxRetries;
      
      return (
        <Card className="fixed inset-0 z-50 bg-white p-8 overflow-auto">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-red-600 mb-2">
                Story Arc Visualizer Error
              </h1>
              <p className="text-gray-600">
                An error occurred while visualizing arc "<strong>{this.props.arcName}</strong>"
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
              <p className="text-red-700 text-sm mb-2">
                <strong>Message:</strong> {this.state.error?.message || 'Unknown error'}
              </p>
              <p className="text-red-600 text-xs">
                <strong>Error ID:</strong> {this.state.errorId}
              </p>
              {this.state.retryCount > 0 && (
                <p className="text-red-600 text-xs mt-1">
                  <strong>Retry Attempts:</strong> {this.state.retryCount}/{this.maxRetries}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    variant="primary"
                    className="w-full"
                  >
                    🔄 Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                  </Button>
                )}
                
                <Button
                  onClick={() => window.location.href = '/content-creator'}
                  variant="outline"
                  className="w-full"
                >
                  ← Back to Content Studio
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={this.handleReportError}
                  variant="outline"
                  className="w-full text-sm"
                >
                  📋 Copy Error Report
                </Button>
                
                <Button
                  onClick={this.handleForceReload}
                  variant="outline"
                  className="w-full text-sm text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  🔄 Reset All Data & Reload
                </Button>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-xs">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  🛠️ Development Details (Click to expand)
                </summary>
                <div className="bg-gray-100 p-4 rounded border text-xs font-mono overflow-auto max-h-60">
                  <div className="mb-4">
                    <strong>Error Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">{this.state.error.stack}</pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                If this error persists, please contact support with the error ID: 
                <span className="font-mono ml-1">{this.state.errorId}</span>
              </p>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default StoryArcVisualizerErrorBoundary;