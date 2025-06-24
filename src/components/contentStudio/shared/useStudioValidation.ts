// /Users/montysharma/V11M2/src/components/contentStudio/shared/useStudioValidation.ts
// Shared validation patterns for Content Studio components

import { useState, useCallback, useMemo } from 'react';
import { safeParseJSON } from '../../../utils/validation';

interface ValidationRule {
  field: string;
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom' | 'json';
  value?: any;
  message: string;
  validator?: (value: any, allData?: any) => boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

interface StudioValidationConfig {
  rules: ValidationRule[];
  validateOnChange?: boolean;
  debounceMs?: number;
}

interface UseStudioValidationReturn {
  validate: (data: any) => ValidationResult;
  validateField: (field: string, value: any, allData?: any) => string | null;
  isValidating: boolean;
  lastValidation: ValidationResult | null;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  clearErrors: () => void;
  clearFieldError: (field: string) => void;
  setFieldError: (field: string, error: string) => void;
}

// Common validation patterns for Content Studio
export const commonValidationRules = {
  // Storylet validation rules
  storylet: {
    required: (field: string, message?: string): ValidationRule => ({
      field,
      type: 'required',
      message: message || `${field} is required`
    }),
    
    title: (): ValidationRule => ({
      field: 'title',
      type: 'required',
      message: 'Storylet title is required'
    }),
    
    content: (): ValidationRule => ({
      field: 'content',
      type: 'minLength',
      value: 10,
      message: 'Storylet content must be at least 10 characters'
    }),
    
    id: (): ValidationRule => ({
      field: 'id',
      type: 'pattern',
      value: /^[a-zA-Z0-9_-]+$/,
      message: 'ID can only contain letters, numbers, underscores, and hyphens'
    }),
    
    choices: (): ValidationRule => ({
      field: 'choices',
      type: 'custom',
      message: 'At least one choice is required',
      validator: (choices: any[]) => Array.isArray(choices) && choices.length > 0
    }),
    
    choiceText: (): ValidationRule => ({
      field: 'text',
      type: 'required',
      message: 'Choice text is required'
    })
  },
  
  // Clue validation rules
  clue: {
    title: (): ValidationRule => ({
      field: 'title',
      type: 'required',
      message: 'Clue title is required'
    }),
    
    content: (): ValidationRule => ({
      field: 'content',
      type: 'minLength',
      value: 5,
      message: 'Clue content must be at least 5 characters'
    }),
    
    difficulty: (): ValidationRule => ({
      field: 'difficulty',
      type: 'custom',
      message: 'Difficulty must be between 1 and 10',
      validator: (value: number) => value >= 1 && value <= 10
    })
  },
  
  // JSON validation for complex objects
  json: (field: string, message?: string): ValidationRule => ({
    field,
    type: 'json',
    message: message || `${field} must be valid JSON`
  }),
  
  // Arc validation rules  
  arc: {
    name: (): ValidationRule => ({
      field: 'name',
      type: 'required',
      message: 'Arc name is required'
    }),
    
    storylets: (): ValidationRule => ({
      field: 'storylets',
      type: 'custom',
      message: 'Arc must contain at least one storylet',
      validator: (storylets: string[]) => Array.isArray(storylets) && storylets.length > 0
    })
  },
  
  // Character validation rules
  character: {
    name: (): ValidationRule => ({
      field: 'name',
      type: 'required',
      message: 'Character name is required'
    }),
    
    attributes: (): ValidationRule => ({
      field: 'attributes',
      type: 'custom',
      message: 'Character attributes must be valid',
      validator: (attrs: any) => {
        if (!attrs || typeof attrs !== 'object') return false;
        // Check if all attribute values are numbers between 0 and 100
        return Object.values(attrs).every(val => 
          typeof val === 'number' && val >= 0 && val <= 100
        );
      }
    })
  }
};

export function useStudioValidation(config: StudioValidationConfig): UseStudioValidationReturn {
  const { rules, validateOnChange = false, debounceMs = 300 } = config;
  
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});

  // Validate individual field
  const validateField = useCallback((field: string, value: any, allData?: any): string | null => {
    const rule = rules.find(r => r.field === field);
    if (!rule) return null;

    try {
      switch (rule.type) {
        case 'required':
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            return rule.message;
          }
          break;
          
        case 'minLength':
          if (typeof value === 'string' && value.length < rule.value) {
            return rule.message;
          }
          break;
          
        case 'maxLength':
          if (typeof value === 'string' && value.length > rule.value) {
            return rule.message;
          }
          break;
          
        case 'pattern':
          if (typeof value === 'string' && !rule.value.test(value)) {
            return rule.message;
          }
          break;
          
        case 'json':
          try {
            if (typeof value === 'string') {
              safeParseJSON(value, null);
            }
          } catch {
            return rule.message;
          }
          break;
          
        case 'custom':
          if (rule.validator && !rule.validator(value, allData)) {
            return rule.message;
          }
          break;
      }
    } catch (error) {
      console.warn(`Validation error for field ${field}:`, error);
      return 'Validation error occurred';
    }

    return null;
  }, [rules]);

  // Validate all data
  const validate = useCallback((data: any): ValidationResult => {
    setIsValidating(true);
    
    try {
      const newErrors: Record<string, string> = {};
      const newWarnings: Record<string, string> = {};

      for (const rule of rules) {
        const fieldValue = data[rule.field];
        const error = validateField(rule.field, fieldValue, data);
        
        if (error) {
          newErrors[rule.field] = error;
        }
      }

      // Special validation for storylet structures
      if (data.choices && Array.isArray(data.choices)) {
        data.choices.forEach((choice: any, index: number) => {
          if (!choice.text || choice.text.trim() === '') {
            newErrors[`choice_${index}_text`] = 'Choice text is required';
          }
          
          // Validate choice effects
          if (choice.effects && Array.isArray(choice.effects)) {
            choice.effects.forEach((effect: any, effectIndex: number) => {
              if (!effect.type) {
                newErrors[`choice_${index}_effect_${effectIndex}_type`] = 'Effect type is required';
              }
            });
          }
        });
      }

      // Special validation for trigger conditions
      if (data.triggers && Array.isArray(data.triggers)) {
        data.triggers.forEach((trigger: any, index: number) => {
          if (!trigger.type) {
            newErrors[`trigger_${index}_type`] = 'Trigger type is required';
          }
          if (!trigger.key) {
            newErrors[`trigger_${index}_key`] = 'Trigger key is required';
          }
        });
      }

      // Arc-specific validation
      if (data.storyArc && data.storyArc.trim() === '') {
        newWarnings['storyArc'] = 'Consider assigning this storylet to a story arc';
      }

      const result: ValidationResult = {
        isValid: Object.keys(newErrors).length === 0,
        errors: newErrors,
        warnings: newWarnings
      };

      setErrors(newErrors);
      setWarnings(newWarnings);
      setLastValidation(result);
      
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [rules, validateField]);

  // Error management helpers
  const clearErrors = useCallback(() => {
    setErrors({});
    setWarnings({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, []);

  return {
    validate,
    validateField,
    isValidating,
    lastValidation,
    errors,
    warnings,
    clearErrors,
    clearFieldError,
    setFieldError
  };
}

// Predefined validation configurations for common Content Studio entities
export const validationConfigs = {
  storylet: {
    rules: [
      commonValidationRules.storylet.title(),
      commonValidationRules.storylet.content(),
      commonValidationRules.storylet.id()
    ]
  },
  
  clue: {
    rules: [
      commonValidationRules.clue.title(),
      commonValidationRules.clue.content(),
      commonValidationRules.clue.difficulty()
    ]
  },
  
  arc: {
    rules: [
      commonValidationRules.arc.name(),
      commonValidationRules.arc.storylets()
    ]
  },
  
  character: {
    rules: [
      commonValidationRules.character.name(),
      commonValidationRules.character.attributes()
    ]
  }
};