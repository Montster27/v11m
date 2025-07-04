// /Users/montysharma/V11M2/src/hooks/useUndoRedo.ts

import { useState, useCallback } from 'react';

export interface UndoRedoAction {
  id: string;
  description: string;
  timestamp: Date;
  undoAction: () => void;
  redoAction: () => void;
  data?: Record<string, unknown>;
}

interface UndoRedoState {
  undoStack: UndoRedoAction[];
  redoStack: UndoRedoAction[];
  maxHistorySize: number;
}

export const useUndoRedo = (maxHistorySize: number = 20) => {
  const [state, setState] = useState<UndoRedoState>({
    undoStack: [],
    redoStack: [],
    maxHistorySize
  });

  const executeAction = useCallback((action: UndoRedoAction) => {
    setState(prev => {
      // Add action to undo stack
      const newUndoStack = [...prev.undoStack, action];
      
      // Limit stack size
      if (newUndoStack.length > prev.maxHistorySize) {
        newUndoStack.shift();
      }

      return {
        ...prev,
        undoStack: newUndoStack,
        redoStack: [] // Clear redo stack when new action is performed
      };
    });

    // NOTE: We don't execute the action here because it's already been executed
    // The action is just being recorded for undo/redo purposes
    // action.redoAction(); // REMOVED - this was causing duplicate creation
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.undoStack.length === 0) return prev;

      const actionToUndo = prev.undoStack[prev.undoStack.length - 1];
      const newUndoStack = prev.undoStack.slice(0, -1);
      const newRedoStack = [...prev.redoStack, actionToUndo];

      // Execute undo
      try {
        actionToUndo.undoAction();
      } catch (error) {
        console.error('Failed to undo action:', error);
        return prev; // Don't update state if undo fails
      }

      return {
        ...prev,
        undoStack: newUndoStack,
        redoStack: newRedoStack
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.redoStack.length === 0) return prev;

      const actionToRedo = prev.redoStack[prev.redoStack.length - 1];
      const newRedoStack = prev.redoStack.slice(0, -1);
      const newUndoStack = [...prev.undoStack, actionToRedo];

      // Execute redo
      try {
        actionToRedo.redoAction();
      } catch (error) {
        console.error('Failed to redo action:', error);
        return prev; // Don't update state if redo fails
      }

      return {
        ...prev,
        undoStack: newUndoStack,
        redoStack: newRedoStack
      };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      undoStack: [],
      redoStack: []
    }));
  }, []);

  const getLastAction = useCallback(() => {
    return state.undoStack[state.undoStack.length - 1] || null;
  }, [state.undoStack]);

  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;

  return {
    executeAction,
    undo,
    redo,
    clearHistory,
    getLastAction,
    canUndo,
    canRedo,
    undoStackSize: state.undoStack.length,
    redoStackSize: state.redoStack.length,
    history: state.undoStack
  };
};