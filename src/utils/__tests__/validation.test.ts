import { describe, test, expect } from 'vitest'
import { 
  validateStorylet, 
  validateChoice, 
  validateEffect, 
  validateTrigger,
  findOrphanedStorylets,
  findCircularDependencies 
} from '../validation'
import type { Storylet, Choice, Effect, Trigger } from '../../types/storylet'

describe('validation', () => {
  describe('validateStorylet', () => {
    test('should validate a correct storylet', () => {
      const validStorylet: Storylet = {
        id: 'test-storylet',
        name: 'Test Storylet',
        description: 'A test storylet',
        deploymentStatus: 'live',
        choices: [
          {
            id: 'choice-1',
            text: 'Test choice',
            effects: []
          }
        ]
      }
      
      const result = validateStorylet(validStorylet)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should detect missing required fields', () => {
      const invalidStorylet = {
        name: 'Test',
        description: 'Test'
      } as Storylet
      
      const result = validateStorylet(invalidStorylet)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('ID is required')
    })

    test('should validate storylet with trigger', () => {
      const storyletWithTrigger: Storylet = {
        id: 'triggered-storylet',
        name: 'Triggered',
        description: 'Has a trigger',
        deploymentStatus: 'live',
        trigger: {
          type: 'time',
          conditions: { day: 5 }
        },
        choices: []
      }
      
      const result = validateStorylet(storyletWithTrigger)
      expect(result.isValid).toBe(true)
    })

    test('should detect invalid choices', () => {
      const storyletWithInvalidChoice: Storylet = {
        id: 'invalid-choice-storylet',
        name: 'Invalid Choice',
        description: 'Has invalid choice',
        deploymentStatus: 'live',
        choices: [
          {
            id: '',
            text: '',
            effects: []
          }
        ]
      }
      
      const result = validateStorylet(storyletWithInvalidChoice)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateChoice', () => {
    test('should validate a correct choice', () => {
      const validChoice: Choice = {
        id: 'valid-choice',
        text: 'Valid choice text',
        effects: [
          {
            type: 'resource',
            key: 'energy',
            delta: 10
          }
        ]
      }
      
      const result = validateChoice(validChoice)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should detect missing ID', () => {
      const choiceWithoutId = {
        text: 'Choice text',
        effects: []
      } as Choice
      
      const result = validateChoice(choiceWithoutId)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Choice ID is required')
    })

    test('should detect empty text', () => {
      const choiceWithEmptyText: Choice = {
        id: 'choice-1',
        text: '',
        effects: []
      }
      
      const result = validateChoice(choiceWithEmptyText)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Choice text cannot be empty')
    })

    test('should validate choice with conditions', () => {
      const conditionalChoice: Choice = {
        id: 'conditional',
        text: 'Conditional choice',
        effects: [],
        conditions: {
          type: 'resource',
          conditions: { energy: { greater_than: 50 } }
        }
      }
      
      const result = validateChoice(conditionalChoice)
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateEffect', () => {
    test('should validate resource effects', () => {
      const resourceEffect: Effect = {
        type: 'resource',
        key: 'energy',
        delta: 10
      }
      
      const result = validateEffect(resourceEffect)
      expect(result.isValid).toBe(true)
    })

    test('should validate flag effects', () => {
      const flagEffect: Effect = {
        type: 'flag',
        key: 'quest_completed',
        value: true
      }
      
      const result = validateEffect(flagEffect)
      expect(result.isValid).toBe(true)
    })

    test('should validate unlock effects', () => {
      const unlockEffect: Effect = {
        type: 'unlock',
        storyletId: 'next-storylet'
      }
      
      const result = validateEffect(unlockEffect)
      expect(result.isValid).toBe(true)
    })

    test('should detect invalid effect type', () => {
      const invalidEffect = {
        type: 'invalid'
      } as Effect
      
      const result = validateEffect(invalidEffect)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('should detect missing required fields for resource effect', () => {
      const incompleteResourceEffect = {
        type: 'resource',
        key: 'energy'
        // missing delta
      } as Effect
      
      const result = validateEffect(incompleteResourceEffect)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Resource effect must have delta value')
    })
  })

  describe('validateTrigger', () => {
    test('should validate time triggers', () => {
      const timeTrigger: Trigger = {
        type: 'time',
        conditions: { day: 5 }
      }
      
      const result = validateTrigger(timeTrigger)
      expect(result.isValid).toBe(true)
    })

    test('should validate flag triggers', () => {
      const flagTrigger: Trigger = {
        type: 'flag',
        conditions: { flags: ['flag1', 'flag2'] }
      }
      
      const result = validateTrigger(flagTrigger)
      expect(result.isValid).toBe(true)
    })

    test('should validate resource triggers', () => {
      const resourceTrigger: Trigger = {
        type: 'resource',
        conditions: { 
          energy: { greater_equal: 50 },
          money: 100
        }
      }
      
      const result = validateTrigger(resourceTrigger)
      expect(result.isValid).toBe(true)
    })

    test('should detect invalid trigger type', () => {
      const invalidTrigger = {
        type: 'invalid',
        conditions: {}
      } as Trigger
      
      const result = validateTrigger(invalidTrigger)
      expect(result.isValid).toBe(false)
    })
  })

  describe('findOrphanedStorylets', () => {
    test('should find storylets with no incoming connections', () => {
      const storylets: Storylet[] = [
        {
          id: 'start',
          name: 'Start',
          description: 'Starting storylet',
          deploymentStatus: 'live',
          choices: [
            {
              id: 'choice-1',
              text: 'Go to middle',
              effects: [{ type: 'unlock', storyletId: 'middle' }]
            }
          ]
        },
        {
          id: 'middle',
          name: 'Middle',
          description: 'Middle storylet',
          deploymentStatus: 'live',
          choices: []
        },
        {
          id: 'orphan',
          name: 'Orphan',
          description: 'Orphaned storylet',
          deploymentStatus: 'live',
          choices: []
        }
      ]
      
      const orphans = findOrphanedStorylets(storylets)
      expect(orphans).toContain('orphan')
      expect(orphans).not.toContain('start')
      expect(orphans).not.toContain('middle')
    })
  })

  describe('findCircularDependencies', () => {
    test('should detect circular dependencies', () => {
      const storylets: Storylet[] = [
        {
          id: 'story-a',
          name: 'Story A',
          description: 'Points to B',
          deploymentStatus: 'live',
          choices: [
            {
              id: 'choice-a',
              text: 'Go to B',
              effects: [{ type: 'unlock', storyletId: 'story-b' }]
            }
          ]
        },
        {
          id: 'story-b',
          name: 'Story B',
          description: 'Points back to A',
          deploymentStatus: 'live',
          choices: [
            {
              id: 'choice-b',
              text: 'Go back to A',
              effects: [{ type: 'unlock', storyletId: 'story-a' }]
            }
          ]
        }
      ]
      
      const cycles = findCircularDependencies(storylets)
      expect(cycles.length).toBeGreaterThan(0)
    })

    test('should handle storylets with no dependencies', () => {
      const isolatedStorylets: Storylet[] = [
        {
          id: 'isolated-1',
          name: 'Isolated 1',
          description: 'No connections',
          deploymentStatus: 'live',
          choices: []
        },
        {
          id: 'isolated-2',
          name: 'Isolated 2',
          description: 'No connections',
          deploymentStatus: 'live',
          choices: []
        }
      ]
      
      const cycles = findCircularDependencies(isolatedStorylets)
      expect(cycles).toHaveLength(0)
    })
  })
})