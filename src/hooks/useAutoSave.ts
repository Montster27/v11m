// /Users/montysharma/V11M2/src/hooks/useAutoSave.ts
import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { REFACTOR_CONFIG } from '../config/refactorFlags';
import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';
import { shallow } from 'zustand/shallow';

/**
 * Auto-save hook that reactively saves game progress when significant changes occur
 * This replaces the setTimeout-based auto-save pattern that could cause race conditions
 */
export function useAutoSave() {
  // Temporarily disable auto-save completely to prevent infinite loops
  // TODO: Re-enable after resolving React/Zustand interaction issues
  console.log('⚠️ Auto-save temporarily disabled to prevent infinite loops');
  return null;
}