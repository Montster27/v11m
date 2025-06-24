// /Users/montysharma/V11M2/src/hooks/useCrashRecovery.ts
// Crash recovery hook - handles crash detection, modal state, and recovery logic

import { useState, useEffect, useRef, useCallback } from 'react';
import { checkCrashConditions, type CrashCheckResult } from '../utils/validation';

export interface CrashState {
  showCrashModal: boolean;
  crashType: 'exhaustion' | 'burnout';
  isCrashRecovery: boolean;
  countdown: number;
  crashCheck: CrashCheckResult;
}

export interface CrashActions {
  handleCrash: (type: 'exhaustion' | 'burnout') => void;
  handleCrashRecovery: () => void;
  resetCrashState: () => void;
}

export interface UseCrashRecoveryReturn {
  state: CrashState;
  actions: CrashActions;
}

interface UseCrashRecoveryOptions {
  onCrashStart?: (type: 'exhaustion' | 'burnout') => void;
  onCrashComplete?: () => void;
  onForceRest?: () => void;
  onRecoveryBonus?: (energyBonus: number, stressReduction: number) => void;
}

export const useCrashRecovery = (
  energy: number = 100,
  stress: number = 0,
  options: UseCrashRecoveryOptions = {}
): UseCrashRecoveryReturn => {
  const {
    onCrashStart,
    onCrashComplete,
    onForceRest,
    onRecoveryBonus
  } = options;

  const [showCrashModal, setShowCrashModal] = useState(false);
  const [crashType, setCrashType] = useState<'exhaustion' | 'burnout'>('exhaustion');
  const [isCrashRecovery, setIsCrashRecovery] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check current crash conditions
  const crashCheck = checkCrashConditions(energy, stress);

  // Handle crash initiation
  const handleCrash = useCallback((type: 'exhaustion' | 'burnout') => {
    console.log(`CRASH INITIATED: ${type.toUpperCase()}`);
    
    setCrashType(type);
    setShowCrashModal(true);
    setIsCrashRecovery(true);
    setCountdown(3);
    
    // Notify external handlers
    if (onCrashStart) {
      onCrashStart(type);
    }
    
    // Force rest allocation
    if (onForceRest) {
      onForceRest();
    }
  }, [onCrashStart, onForceRest]);

  // Handle crash recovery completion
  const handleCrashRecovery = useCallback(() => {
    console.log('CRASH RECOVERY COMPLETED');
    
    setShowCrashModal(false);
    setIsCrashRecovery(false);
    
    // Apply recovery bonuses
    const energyBonus = 50;
    const stressReduction = 30;
    
    if (onRecoveryBonus) {
      onRecoveryBonus(energyBonus, stressReduction);
    }
    
    // Notify completion
    if (onCrashComplete) {
      onCrashComplete();
    }
  }, [onRecoveryBonus, onCrashComplete]);

  // Reset crash state
  const resetCrashState = useCallback(() => {
    setShowCrashModal(false);
    setIsCrashRecovery(false);
    setCrashType('exhaustion');
    setCountdown(3);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Crash modal countdown timer
  useEffect(() => {
    if (!showCrashModal) {
      // Clean up timer when modal closes
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    // Reset countdown when modal opens
    setCountdown(3);
    
    // Clear any existing timer before creating new one
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // Trigger recovery completion
          setTimeout(() => handleCrashRecovery(), 100);
          return 0;
        }
        return prev - 1;
      });
    }, 3000); // 3 seconds per day

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [showCrashModal, handleCrashRecovery]);

  // Auto-detect crash conditions
  useEffect(() => {
    if (!isCrashRecovery && !crashCheck.isValid) {
      const type = energy <= 0 ? 'exhaustion' : 'burnout';
      handleCrash(type);
    }
  }, [energy, stress, isCrashRecovery, crashCheck.isValid, handleCrash]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return {
    state: {
      showCrashModal,
      crashType,
      isCrashRecovery,
      countdown,
      crashCheck
    },
    actions: {
      handleCrash,
      handleCrashRecovery,
      resetCrashState
    }
  };
};