// /Users/montysharma/V11M2/src/utils/validation.ts

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  type?: 'error' | 'warning' | 'success';
}

// Validate slider sum
export function validateSliderSum(total: number): ValidationResult {
  if (total > 100) {
    return {
      isValid: false,
      message: `Total: ${total.toFixed(1)}% - Reduce allocations to ≤ 100%`,
      type: 'error'
    };
  }
  
  if (total < 100) {
    return {
      isValid: true,
      message: `Total: ${total.toFixed(1)}%`,
      type: 'warning'
    };
  }
  
  return {
    isValid: true,
    message: `Total: ${total.toFixed(1)}%`,
    type: 'success'
  };
}

// Check for severe sleep deprivation
export function validateSleepHours(restPercent: number): ValidationResult {
  const sleepHours = (restPercent / 100) * 24;
  
  if (sleepHours < 4) {
    return {
      isValid: false,
      message: `Severe sleep deprivation! (${sleepHours.toFixed(1)} hrs/day) → Energy -10, Stress +20 per day`,
      type: 'error'
    };
  }
  
  if (sleepHours < 6) {
    return {
      isValid: true,
      message: `Low sleep (${sleepHours.toFixed(1)} hrs/day) - Consider more rest`,
      type: 'warning'
    };
  }
  
  return {
    isValid: true,
    message: '',
    type: 'success'
  };
}

// Check for crash conditions
export function checkCrashConditions(energy: number, stress: number): ValidationResult {
  if (energy <= 0) {
    return {
      isValid: false,
      message: "Energy depleted! You've crashed from exhaustion!",
      type: 'error'
    };
  }
  
  if (stress >= 100) {
    return {
      isValid: false,
      message: "Maximum stress reached! You've crashed from burnout!",
      type: 'error'
    };
  }
  
  if (energy < 20) {
    return {
      isValid: true,
      message: "Low energy - consider more rest",
      type: 'warning'
    };
  }
  
  if (stress > 80) {
    return {
      isValid: true,
      message: "High stress - consider reducing workload",
      type: 'warning'
    };
  }
  
  return {
    isValid: true,
    message: '',
    type: 'success'
  };
}