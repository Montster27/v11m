// /Users/montysharma/V11M2/src/utils/validation.ts
// Comprehensive validation and sanitization utilities
// Addresses security vulnerabilities in storylet editing and data processing

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  type?: 'error' | 'warning' | 'success';
}

export interface CrashCheckResult extends ValidationResult {
  // Same as ValidationResult but with specific crash semantics
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string, public code?: string) {
    super(message);
    this.name = 'ValidationError';
  }
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

// HTML/XSS sanitization
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 10000); // Limit length
}

// Safe JSON parsing to replace unsafe JSON.parse usage
export function safeParseJSON<T>(jsonString: string, fallback: T): T {
  if (!jsonString || typeof jsonString !== 'string') {
    return fallback;
  }
  
  try {
    // Basic validation before parsing
    if (jsonString.length > 100000) { // 100KB limit
      throw new ValidationError('JSON string too large');
    }
    
    const parsed = JSON.parse(jsonString);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (error) {
    console.warn('Failed to parse JSON safely:', error);
    return fallback;
  }
}

// Storylet name validation
export function validateStoryletName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Storylet name is required', 'name');
  }
  
  const sanitized = sanitizeText(name);
  if (sanitized.length < 1) {
    throw new ValidationError('Storylet name cannot be empty after sanitization', 'name');
  }
  
  if (sanitized.length > 200) {
    throw new ValidationError('Storylet name is too long (max 200 characters)', 'name');
  }
  
  return sanitized;
}

// Storylet description validation
export function validateStoryletDescription(description: string): string {
  if (!description || typeof description !== 'string') {
    return '';
  }
  
  const sanitized = sanitizeText(description);
  if (sanitized.length > 5000) {
    throw new ValidationError('Storylet description is too long (max 5000 characters)', 'description');
  }
  
  return sanitized;
}

// Choice text validation
export function validateChoiceText(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new ValidationError('Choice text is required', 'choice.text');
  }
  
  const sanitized = sanitizeText(text);
  if (sanitized.length < 1) {
    throw new ValidationError('Choice text cannot be empty after sanitization', 'choice.text');
  }
  
  if (sanitized.length > 500) {
    throw new ValidationError('Choice text is too long (max 500 characters)', 'choice.text');
  }
  
  return sanitized;
}

// Validate trigger conditions safely
export function validateTriggerConditions(conditions: unknown): Record<string, unknown> {
  if (!conditions || typeof conditions !== 'object') {
    return {};
  }
  
  const validated: Record<string, unknown> = {};
  
  // Validate common trigger condition patterns
  Object.entries(conditions as Record<string, unknown>).forEach(([key, value]) => {
    const sanitizedKey = sanitizeText(String(key));
    
    if (sanitizedKey.length === 0) {
      return; // Skip invalid keys
    }
    
    // Validate different value types
    if (typeof value === 'string') {
      validated[sanitizedKey] = sanitizeText(value);
    } else if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
      validated[sanitizedKey] = Math.max(-10000, Math.min(10000, value)); // Clamp numbers
    } else if (typeof value === 'boolean') {
      validated[sanitizedKey] = value;
    } else if (Array.isArray(value)) {
      // Validate arrays (like flags)
      validated[sanitizedKey] = value
        .slice(0, 50) // Limit array size
        .map(item => typeof item === 'string' ? sanitizeText(item) : item)
        .filter(item => item !== null && item !== undefined);
    } else if (value && typeof value === 'object') {
      // Recursively validate nested objects (like resource conditions)
      validated[sanitizedKey] = validateTriggerConditions(value);
    }
  });
  
  return validated;
}

// Complete storylet validation
export function validateStorylet(storylet: unknown): unknown {
  if (!storylet || typeof storylet !== 'object') {
    throw new ValidationError('Storylet must be an object');
  }
  
  const storyletObj = storylet as Record<string, unknown>;
  
  const validated = {
    ...storyletObj,
    id: sanitizeText(String(storyletObj.id || '')),
    name: validateStoryletName(String(storyletObj.name || '')),
    description: validateStoryletDescription(String(storyletObj.description || '')),
  };
  
  // Validate trigger
  if (storyletObj.trigger && typeof storyletObj.trigger === 'object') {
    const triggerObj = storyletObj.trigger as Record<string, unknown>;
    validated.trigger = {
      type: triggerObj.type,
      conditions: validateTriggerConditions(triggerObj.conditions)
    };
  }
  
  // Validate choices
  if (Array.isArray(storyletObj.choices)) {
    validated.choices = storyletObj.choices.map((choice: unknown, index: number) => {
      try {
        const choiceObj = choice as Record<string, unknown>;
        return {
          id: sanitizeText(String(choiceObj.id || `choice_${index}`)),
          text: validateChoiceText(String(choiceObj.text || '')),
          effects: Array.isArray(choiceObj.effects) ? choiceObj.effects : [],
          nextStoryletId: choiceObj.nextStoryletId 
            ? sanitizeText(String(choiceObj.nextStoryletId))
            : undefined
        };
      } catch (error) {
        throw new ValidationError(
          `Invalid choice at index ${index}: ${(error as Error).message}`,
          `choices[${index}]`
        );
      }
    });
  } else {
    validated.choices = [];
  }
  
  // Validate optional fields
  if (storyletObj.involvedNPCs && Array.isArray(storyletObj.involvedNPCs)) {
    validated.involvedNPCs = storyletObj.involvedNPCs
      .map((npcId: unknown) => sanitizeText(String(npcId)))
      .filter((npcId: string) => npcId.length > 0);
  }
  
  if (storyletObj.primaryNPC) {
    validated.primaryNPC = sanitizeText(String(storyletObj.primaryNPC));
  }
  
  if (storyletObj.locationId) {
    validated.locationId = sanitizeText(String(storyletObj.locationId));
  }
  
  if (storyletObj.storyArc) {
    validated.storyArc = sanitizeText(String(storyletObj.storyArc));
  }
  
  return validated;
}