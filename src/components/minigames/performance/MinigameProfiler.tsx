// /Users/montysharma/V11M2/src/components/minigames/performance/MinigameProfiler.tsx
// Performance monitoring and optimization utilities for minigames

import React, { useState, useEffect, useRef } from 'react';
import { Card, Button } from '../../ui';

interface PerformanceMetrics {
  frameRate: number;
  renderTime: number;
  memoryUsage: number;
  eventLoopLag: number;
  componentCount: number;
  updateCount: number;
}

interface MinigameProfilerProps {
  isActive: boolean;
  gameId?: string;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  showOverlay?: boolean;
}

const MinigameProfiler: React.FC<MinigameProfilerProps> = ({
  isActive,
  gameId,
  onMetricsUpdate,
  showOverlay = false
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    frameRate: 60,
    renderTime: 0,
    memoryUsage: 0,
    eventLoopLag: 0,
    componentCount: 0,
    updateCount: 0
  });
  
  const [showDetails, setShowDetails] = useState(false);
  const metricsRef = useRef<PerformanceMetrics>(metrics);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!isActive) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      return;
    }

    const measurePerformance = () => {
      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;
      
      frameCountRef.current++;
      
      // Calculate FPS (update every second)
      if (deltaTime >= 1000) {
        const frameRate = Math.round((frameCountRef.current * 1000) / deltaTime);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
        
        // Measure render time
        const renderStart = performance.now();
        
        // Simulate work to measure render overhead
        const renderEnd = performance.now();
        const renderTime = renderEnd - renderStart;
        
        // Measure memory usage (if available)
        const memoryUsage = (performance as any).memory 
          ? (performance as any).memory.usedJSHeapSize / 1024 / 1024 
          : 0;
        
        // Measure event loop lag
        const lagStart = performance.now();
        setTimeout(() => {
          const eventLoopLag = performance.now() - lagStart;
          
          const newMetrics: PerformanceMetrics = {
            frameRate,
            renderTime,
            memoryUsage,
            eventLoopLag,
            componentCount: document.querySelectorAll('[data-minigame-component]').length,
            updateCount: metricsRef.current.updateCount + 1
          };
          
          metricsRef.current = newMetrics;
          setMetrics(newMetrics);
          onMetricsUpdate?.(newMetrics);
        }, 0);
      }
      
      rafRef.current = requestAnimationFrame(measurePerformance);
    };

    rafRef.current = requestAnimationFrame(measurePerformance);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isActive, onMetricsUpdate]);

  // Performance warnings
  const getPerformanceWarnings = () => {
    const warnings: string[] = [];
    
    if (metrics.frameRate < 30) {
      warnings.push('Low frame rate detected');
    }
    if (metrics.memoryUsage > 100) {
      warnings.push('High memory usage');
    }
    if (metrics.eventLoopLag > 16) {
      warnings.push('Event loop lag detected');
    }
    if (metrics.componentCount > 100) {
      warnings.push('High component count');
    }
    
    return warnings;
  };

  const getPerformanceGrade = () => {
    const score = Math.min(100, 
      (metrics.frameRate / 60) * 30 +
      Math.max(0, (100 - metrics.memoryUsage) / 100) * 25 +
      Math.max(0, (16 - metrics.eventLoopLag) / 16) * 25 +
      Math.max(0, (100 - metrics.componentCount) / 100) * 20
    );
    
    if (score >= 85) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 55) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (score >= 40) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-50' };
  };

  if (!isActive) return null;

  const warnings = getPerformanceWarnings();
  const performanceGrade = getPerformanceGrade();

  if (!showOverlay) return null;

  return (
    <div className="fixed top-4 left-4 z-50 max-w-sm">
      {/* Compact Performance Indicator */}
      <Card className="bg-black/80 text-white p-3 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Performance</div>
          <div className={`text-sm font-bold px-2 py-1 rounded ${performanceGrade.bg} ${performanceGrade.color}`}>
            {performanceGrade.grade}
          </div>
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
            className="text-xs text-white border-white/30 hover:bg-white/20 ml-2"
          >
            {showDetails ? '−' : '+'}
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-300">FPS:</span>
            <span className={`ml-1 font-mono ${metrics.frameRate < 30 ? 'text-red-400' : 'text-green-400'}`}>
              {metrics.frameRate}
            </span>
          </div>
          <div>
            <span className="text-gray-300">RAM:</span>
            <span className={`ml-1 font-mono ${metrics.memoryUsage > 100 ? 'text-red-400' : 'text-blue-400'}`}>
              {metrics.memoryUsage.toFixed(1)}MB
            </span>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mt-2 text-xs text-yellow-400">
            ⚠️ {warnings.length} warning{warnings.length > 1 ? 's' : ''}
          </div>
        )}

        {/* Detailed View */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-300">Render Time:</span>
                <span className="font-mono text-purple-400">{metrics.renderTime.toFixed(2)}ms</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Event Loop Lag:</span>
                <span className={`font-mono ${metrics.eventLoopLag > 16 ? 'text-red-400' : 'text-green-400'}`}>
                  {metrics.eventLoopLag.toFixed(1)}ms
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Components:</span>
                <span className="font-mono text-blue-400">{metrics.componentCount}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Updates:</span>
                <span className="font-mono text-gray-400">{metrics.updateCount}</span>
              </div>
            </div>

            {/* Game-specific info */}
            {gameId && (
              <div className="mt-2 pt-2 border-t border-white/20">
                <div className="text-xs text-gray-300">Game: {gameId}</div>
              </div>
            )}

            {/* Warning Details */}
            {warnings.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/20">
                <div className="text-xs text-yellow-400 space-y-1">
                  {warnings.map((warning, index) => (
                    <div key={index}>• {warning}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Optimization Tips */}
            <div className="mt-2 pt-2 border-t border-white/20">
              <div className="text-xs text-gray-400">
                <div className="font-medium text-gray-300 mb-1">Tips:</div>
                {metrics.frameRate < 30 && <div>• Reduce animation complexity</div>}
                {metrics.memoryUsage > 100 && <div>• Check for memory leaks</div>}
                {metrics.componentCount > 100 && <div>• Optimize component tree</div>}
                {warnings.length === 0 && <div>• Performance looks good!</div>}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

// Performance monitoring hook
export const useMinigamePerformance = (gameId?: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = () => setIsMonitoring(true);
  const stopMonitoring = () => setIsMonitoring(false);

  const handleMetricsUpdate = (newMetrics: PerformanceMetrics) => {
    setMetrics(newMetrics);
    
    // Log performance issues
    if (newMetrics.frameRate < 30) {
      console.warn(`🐌 Low FPS detected in ${gameId}: ${newMetrics.frameRate} fps`);
    }
    if (newMetrics.memoryUsage > 150) {
      console.warn(`🧠 High memory usage in ${gameId}: ${newMetrics.memoryUsage.toFixed(1)}MB`);
    }
  };

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    handleMetricsUpdate,
    ProfilerComponent: () => (
      <MinigameProfiler
        isActive={isMonitoring}
        gameId={gameId}
        onMetricsUpdate={handleMetricsUpdate}
        showOverlay={true}
      />
    )
  };
};

export default MinigameProfiler;