import { describe, test, expect } from 'vitest'
import {
  formatConditionValue,
  formatTriggerSummary,
  formatEffectSummary,
  truncateText,
  formatStoryletName,
  formatSearchSummary,
  formatValidationIssue
} from '../displayFormatters'

describe('displayFormatters', () => {
  describe('formatConditionValue', () => {
    test('should format primitive values', () => {
      expect(formatConditionValue('test')).toBe('test')
      expect(formatConditionValue(42)).toBe('42')
      expect(formatConditionValue(true)).toBe('true')
    })

    test('should format arrays', () => {
      expect(formatConditionValue(['flag1', 'flag2'])).toBe('flag1, flag2')
      expect(formatConditionValue([])).toBe('')
    })

    test('should format operator objects', () => {
      expect(formatConditionValue({ greater_equal: 5 })).toBe('≥5')
      expect(formatConditionValue({ greater_than: 10 })).toBe('>10')
      expect(formatConditionValue({ less_equal: 3 })).toBe('≤3')
      expect(formatConditionValue({ less_than: 7 })).toBe('<7')
      expect(formatConditionValue({ equals: 50 })).toBe('=50')
      expect(formatConditionValue({ not_equals: 0 })).toBe('≠0')
    })

    test('should handle complex objects', () => {
      const complexObj = { multiple: 'keys', here: true }
      expect(formatConditionValue(complexObj)).toBe(JSON.stringify(complexObj))
    })

    test('should handle null and undefined', () => {
      expect(formatConditionValue(null)).toBe('null')
      expect(formatConditionValue(undefined)).toBe('undefined')
    })
  })

  describe('formatTriggerSummary', () => {
    test('should format time triggers', () => {
      const trigger = {
        type: 'time',
        conditions: { day: 5 }
      }
      expect(formatTriggerSummary(trigger)).toBe('Day 5')
    })

    test('should format flag triggers', () => {
      const trigger = {
        type: 'flag',
        conditions: { flags: ['flag1', 'flag2'] }
      }
      expect(formatTriggerSummary(trigger)).toBe('Requires flags: flag1, flag2')
    })

    test('should format resource triggers', () => {
      const trigger = {
        type: 'resource',
        conditions: { energy: { greater_equal: 50 }, money: 100 }
      }
      expect(formatTriggerSummary(trigger)).toContain('Resources:')
      expect(formatTriggerSummary(trigger)).toContain('energy: ≥50')
      expect(formatTriggerSummary(trigger)).toContain('money: 100')
    })

    test('should handle null trigger', () => {
      expect(formatTriggerSummary(null)).toBe('No trigger')
      expect(formatTriggerSummary(undefined)).toBe('No trigger')
    })
  })

  describe('formatEffectSummary', () => {
    test('should format resource effects', () => {
      const effects = [
        { type: 'resource', key: 'energy', delta: 10 },
        { type: 'resource', key: 'stress', delta: -5 }
      ]
      const result = formatEffectSummary(effects)
      expect(result).toContain('energy +10')
      expect(result).toContain('stress -5')
    })

    test('should format flag effects', () => {
      const effects = [
        { type: 'flag', key: 'quest_completed', value: true }
      ]
      expect(formatEffectSummary(effects)).toBe('Set quest_completed: true')
    })

    test('should format skill XP effects', () => {
      const effects = [
        { type: 'skillXp', key: 'programming', amount: 25 }
      ]
      expect(formatEffectSummary(effects)).toBe('programming +25 XP')
    })

    test('should format unlock effects', () => {
      const effects = [
        { type: 'unlock', storyletId: 'next-story' }
      ]
      expect(formatEffectSummary(effects)).toBe('Unlock: next-story')
    })

    test('should handle empty effects', () => {
      expect(formatEffectSummary([])).toBe('No effects')
      expect(formatEffectSummary(undefined as any)).toBe('No effects')
    })

    test('should format multiple effects', () => {
      const effects = [
        { type: 'resource', key: 'energy', delta: 10 },
        { type: 'flag', key: 'completed', value: true }
      ]
      const result = formatEffectSummary(effects)
      expect(result).toContain('energy +10')
      expect(result).toContain('Set completed: true')
      expect(result).toContain(', ')
    })
  })

  describe('truncateText', () => {
    test('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated'
      expect(truncateText(longText, 20)).toBe('This is a very lo...')
    })

    test('should not truncate short text', () => {
      const shortText = 'Short'
      expect(truncateText(shortText, 20)).toBe('Short')
    })

    test('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('')
    })

    test('should handle exact length', () => {
      const text = 'Exactly twenty chars'
      expect(truncateText(text, 20)).toBe('Exactly twenty chars')
    })
  })

  describe('formatStoryletName', () => {
    test('should format normal names', () => {
      expect(formatStoryletName('Normal Name')).toBe('Normal Name')
    })

    test('should truncate long names', () => {
      const longName = 'This is a very long storylet name that exceeds the limit'
      const result = formatStoryletName(longName, 25)
      expect(result).toHaveLength(25)
      expect(result).toEndWith('...')
    })

    test('should handle empty name', () => {
      expect(formatStoryletName('')).toBe('Untitled Storylet')
    })
  })

  describe('formatSearchSummary', () => {
    test('should format normal search results', () => {
      expect(formatSearchSummary(5, 10, 'test')).toBe('5 results for "test"')
      expect(formatSearchSummary(1, 10, 'single')).toBe('1 result for "single"')
    })

    test('should format no results', () => {
      expect(formatSearchSummary(0, 10, 'nothing')).toBe('No results for "nothing"')
    })

    test('should format without search query', () => {
      expect(formatSearchSummary(8, 10, '')).toBe('8 of 10 storylets')
      expect(formatSearchSummary(10, 10, '')).toBe('10 storylets')
    })
  })

  describe('formatValidationIssue', () => {
    test('should format different issue types', () => {
      const orphanIssue = {
        type: 'orphan',
        nodeId: 'node-1',
        message: 'Node has no connections'
      }
      expect(formatValidationIssue(orphanIssue)).toBe('🔗 Node has no connections')

      const cycleIssue = {
        type: 'cycle',
        nodeId: 'node-2',
        message: 'Circular dependency detected'
      }
      expect(formatValidationIssue(cycleIssue)).toBe('🔄 Circular dependency detected')
    })

    test('should use default icon for unknown types', () => {
      const unknownIssue = {
        type: 'unknown',
        nodeId: 'node-3',
        message: 'Unknown issue'
      }
      expect(formatValidationIssue(unknownIssue)).toBe('⚠️ Unknown issue')
    })
  })
})