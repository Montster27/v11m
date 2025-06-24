// /Users/montysharma/V11M2/src/components/contentStudio/visualEditor/types.ts
// Shared types for Visual Storylet Editor components

import type { Storylet } from '../../../types/storylet';
import { UndoRedoAction } from '../../../hooks/useUndoRedo';

export interface UndoRedoSystem {
  executeAction: (action: UndoRedoAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export interface FlowNode {
  id: string;
  type: 'storylet' | 'start' | 'end';
  position: { x: number; y: number };
  data: {
    title: string;
    content: string;
    effects?: Array<{ type: string; key: string; delta: number }>;
  };
  connections: string[]; // IDs of connected nodes
  storyletId?: string; // Reference to actual storylet
  storylet?: Storylet; // Full storylet data for storylet nodes
  connectionPoints?: Array<{
    choiceId: string;
    choiceText: string;
    isConnected: boolean;
  }>; // Available connection points for storylet nodes
}

export interface FlowConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
  fromChoiceId?: string; // Which choice creates this connection
  choiceText?: string; // Text of the choice
}

export interface StoryArc {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  entryPoints: string[]; // Node IDs that can start the arc
  exitPoints: string[]; // Node IDs that end the arc
  isValid: boolean; // Has at least one complete path
}

export interface NodeType {
  type: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  dragStart: { x: number; y: number } | null;
  selectedNodes: Set<string>;
  selectedConnections: Set<string>;
  isConnecting: boolean;
  connectionStart: string | null;
  connectionStartChoice?: string;
}

export interface EditorMode {
  current: 'storylet' | 'arc';
  availableModes: Array<{
    id: 'storylet' | 'arc';
    label: string;
    description: string;
    icon: string;
  }>;
}