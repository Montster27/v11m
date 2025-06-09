import React from 'react';

// Timeout Manager for Better Resource Management
export class TimeoutManager {
  private timeouts = new Set<NodeJS.Timeout>();
  private intervals = new Set<NodeJS.Timeout>();

  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timeoutId = setTimeout(() => {
      this.timeouts.delete(timeoutId);
      try {
        callback();
      } catch (error) {
        console.error('Error in managed timeout:', error);
      }
    }, delay);
    
    this.timeouts.add(timeoutId);
    return timeoutId;
  }

  setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const intervalId = setInterval(() => {
      try {
        callback();
      } catch (error) {
        console.error('Error in managed interval:', error);
      }
    }, delay);
    
    this.intervals.add(intervalId);
    return intervalId;
  }

  clearTimeout(timeoutId: NodeJS.Timeout): void {
    clearTimeout(timeoutId);
    this.timeouts.delete(timeoutId);
  }

  clearInterval(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
    this.intervals.delete(intervalId);
  }

  clearAll(): void {
    // Clear all timeouts
    for (const timeoutId of this.timeouts) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();

    // Clear all intervals
    for (const intervalId of this.intervals) {
      clearInterval(intervalId);
    }
    this.intervals.clear();
  }

  getActiveCount(): { timeouts: number; intervals: number } {
    return {
      timeouts: this.timeouts.size,
      intervals: this.intervals.size
    };
  }
}

// Global timeout manager for stores
export const globalTimeoutManager = new TimeoutManager();

// React hook for component-scoped timeout management
export const useTimeoutManager = () => {
  const managerRef = React.useRef<TimeoutManager>();
  
  if (!managerRef.current) {
    managerRef.current = new TimeoutManager();
  }

  React.useEffect(() => {
    const manager = managerRef.current;
    return () => {
      manager?.clearAll();
    };
  }, []);

  return managerRef.current;
};