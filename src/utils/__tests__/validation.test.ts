import { describe, test, expect } from 'vitest'
import { 
  validateStorylet, 
  validateStoryletName, 
  validateStoryletDescription,
  validateChoiceText,
  ValidationError,
  validateSliderSum,
  validateSleepHours,
  checkCrashConditions
} from '../validation'
import type { Storylet } from '../../types/storylet'

describe('validation', () => {
  describe('validateStoryletName', () => {
    test('should validate a correct name', () => {
      const result = validateStoryletName('Test Storylet')
      expect(result).toBe('Test Storylet')
    })

    test('should throw error for empty name', () => {
      expect(() => validateStoryletName('')).toThrow(ValidationError)
      expect(() => validateStoryletName('')).toThrow('Storylet name is required')
    })

    test('should throw error for null/undefined name', () => {
      expect(() => validateStoryletName(null as any)).toThrow(ValidationError)
      expect(() => validateStoryletName(undefined as any)).toThrow(ValidationError)
    })

    test('should throw error for non-string name', () => {
      expect(() => validateStoryletName(123 as any)).toThrow(ValidationError)
    })

    test('should throw error for name too long', () => {
      const longName = 'a'.repeat(201)
      expect(() => validateStoryletName(longName)).toThrow(ValidationError)
      expect(() => validateStoryletName(longName)).toThrow('too long')
    })
  })

  describe('validateStoryletDescription', () => {
    test('should validate a correct description', () => {
      const result = validateStoryletDescription('A test description')
      expect(result).toBe('A test description')
    })

    test('should return empty string for null/undefined description', () => {
      expect(validateStoryletDescription(null as any)).toBe('')
      expect(validateStoryletDescription(undefined as any)).toBe('')
    })

    test('should throw error for description too long', () => {
      const longDesc = 'a'.repeat(5001)
      expect(() => validateStoryletDescription(longDesc)).toThrow(ValidationError)
      expect(() => validateStoryletDescription(longDesc)).toThrow('too long')
    })
  })

  describe('validateChoiceText', () => {
    test('should validate correct choice text', () => {
      const result = validateChoiceText('Test choice')
      expect(result).toBe('Test choice')
    })

    test('should throw error for empty choice text', () => {
      expect(() => validateChoiceText('')).toThrow(ValidationError)
      expect(() => validateChoiceText('')).toThrow('Choice text is required')
    })

    test('should throw error for null/undefined choice text', () => {
      expect(() => validateChoiceText(null as any)).toThrow(ValidationError)
      expect(() => validateChoiceText(undefined as any)).toThrow(ValidationError)
    })
  })

  describe('validateStorylet', () => {
    test('should validate a basic storylet', () => {
      const storylet = {
        id: 'test-storylet',
        name: 'Test Storylet',
        description: 'A test storylet'
      }
      
      const result = validateStorylet(storylet)
      expect(result).toBeDefined()
      expect((result as any).id).toBe('test-storylet')
      expect((result as any).name).toBe('Test Storylet')
      expect((result as any).description).toBe('A test storylet')
    })

    test('should throw error for null storylet', () => {
      expect(() => validateStorylet(null)).toThrow(ValidationError)
      expect(() => validateStorylet(null)).toThrow('Storylet must be an object')
    })

    test('should throw error for non-object storylet', () => {
      expect(() => validateStorylet('not an object')).toThrow(ValidationError)
    })

    test('should sanitize storylet fields', () => {
      const storylet = {
        id: '  test-id  ',
        name: '  Test Name  ',
        description: '  Test Description  '
      }
      
      const result = validateStorylet(storylet) as any
      // The sanitizeText function should clean up whitespace
      expect(result.name).toBeTruthy()
      expect(result.description).toBeTruthy()
    })
  })

  describe('validateSliderSum', () => {
    test('should validate correct sum', () => {
      const result = validateSliderSum(100)
      expect(result.isValid).toBe(true)
      expect(result.type).toBe('success')
    })

    test('should warn for sum less than 100', () => {
      const result = validateSliderSum(80)
      expect(result.isValid).toBe(true)
      expect(result.type).toBe('warning')
      expect(result.message).toContain('80.0%')
    })

    test('should error for sum greater than 100', () => {
      const result = validateSliderSum(120)
      expect(result.isValid).toBe(false)
      expect(result.type).toBe('error')
      expect(result.message).toContain('120.0%')
      expect(result.message).toContain('Reduce allocations')
    })
  })

  describe('validateSleepHours', () => {
    test('should validate normal sleep', () => {
      const result = validateSleepHours(33.3) // ~8 hours
      expect(result.isValid).toBe(true)
      expect(result.type).toBe('success')
    })

    test('should warn for low sleep', () => {
      const result = validateSleepHours(20) // ~4.8 hours
      expect(result.isValid).toBe(true)
      expect(result.type).toBe('warning')
      expect(result.message).toContain('Low sleep')
    })

    test('should error for severe sleep deprivation', () => {
      const result = validateSleepHours(10) // ~2.4 hours
      expect(result.isValid).toBe(false)
      expect(result.type).toBe('error')
      expect(result.message).toContain('Severe sleep deprivation')
    })
  })

  describe('checkCrashConditions', () => {
    test('should pass for normal values', () => {
      const result = checkCrashConditions(50, 50)
      expect(result.isValid).toBe(true)
    })

    test('should error for zero energy', () => {
      const result = checkCrashConditions(0, 50)
      expect(result.isValid).toBe(false)
      expect(result.type).toBe('error')
      expect(result.message).toContain('Energy depleted')
    })

    test('should error for maximum stress', () => {
      const result = checkCrashConditions(50, 100)
      expect(result.isValid).toBe(false)
      expect(result.type).toBe('error')
      expect(result.message).toContain('Maximum stress')
    })

    test('should warn for low energy', () => {
      const result = checkCrashConditions(15, 50)
      expect(result.isValid).toBe(true)
      expect(result.type).toBe('warning')
      expect(result.message).toContain('Low energy')
    })

    test('should warn for high stress', () => {
      const result = checkCrashConditions(50, 85)
      expect(result.isValid).toBe(true)
      expect(result.type).toBe('warning')
      expect(result.message).toContain('High stress')
    })
  })

  describe('ValidationError', () => {
    test('should create validation error with message', () => {
      const error = new ValidationError('Test error')
      expect(error.message).toBe('Test error')
      expect(error.name).toBe('ValidationError')
    })

    test('should create validation error with field and code', () => {
      const error = new ValidationError('Test error', 'testField', 'TEST_CODE')
      expect(error.message).toBe('Test error')
      expect(error.field).toBe('testField')
      expect(error.code).toBe('TEST_CODE')
    })
  })
})