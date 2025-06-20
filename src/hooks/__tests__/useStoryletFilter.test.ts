import { describe, test, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useStoryletFilter, getFilterStats } from '../useStoryletFilter'
import type { Storylet } from '../../types/storylet'

const mockStorylets: Storylet[] = [
  {
    id: 'storylet-1',
    name: 'Study Session',
    description: 'A focused study session in the library',
    deploymentStatus: 'live',
    trigger: {
      type: 'flag',
      conditions: { flags: ['academic_focus'] }
    },
    choices: [
      {
        id: 'choice-1',
        text: 'Study mathematics',
        effects: [{ type: 'resource', key: 'knowledge', delta: 10 }]
      }
    ]
  },
  {
    id: 'storylet-2',
    name: 'Social Gathering',
    description: 'A party with friends at the dormitory',
    deploymentStatus: 'live',
    trigger: {
      type: 'flag',
      conditions: { flags: ['social_butterfly'] }
    },
    choices: [
      {
        id: 'choice-2',
        text: 'Join the party',
        effects: [{ type: 'resource', key: 'social', delta: 15 }]
      }
    ]
  },
  {
    id: 'storylet-3',
    name: 'Study Group',
    description: 'Collaborative study session with classmates',
    deploymentStatus: 'dev',
    trigger: {
      type: 'resource',
      conditions: { knowledge: { greater_than: 50 } }
    },
    choices: [
      {
        id: 'choice-3',
        text: 'Lead the study group',
        effects: [
          { type: 'resource', key: 'knowledge', delta: 8 },
          { type: 'resource', key: 'social', delta: 5 }
        ]
      }
    ]
  }
]

describe('useStoryletFilter', () => {
  test('should return all storylets with no active filters', () => {
    const { result } = renderHook(() =>
      useStoryletFilter(mockStorylets, { searchQuery: '', triggerType: 'all', status: 'all' })
    )

    expect(result.current.filteredStorylets).toHaveLength(3)
    expect(result.current.hasActiveFilters).toBe(false)
  })

  test('should filter by search query', () => {
    const { result } = renderHook(() =>
      useStoryletFilter(mockStorylets, { searchQuery: 'study', triggerType: 'all', status: 'all' })
    )

    expect(result.current.filteredStorylets).toHaveLength(2)
    expect(result.current.hasActiveFilters).toBe(true)
    expect(result.current.filteredStorylets.map(s => s.name)).toContain('Study Session')
    expect(result.current.filteredStorylets.map(s => s.name)).toContain('Study Group')
  })

  test('should filter by deployment status', () => {
    const { result } = renderHook(() =>
      useStoryletFilter(mockStorylets, { searchQuery: '', triggerType: 'all', status: 'dev' })
    )

    expect(result.current.filteredStorylets).toHaveLength(1)
    expect(result.current.filteredStorylets[0].id).toBe('storylet-3')
  })

  test('should filter by trigger type', () => {
    const { result } = renderHook(() =>
      useStoryletFilter(mockStorylets, { searchQuery: '', triggerType: 'flag', status: 'all' })
    )

    expect(result.current.filteredStorylets).toHaveLength(2)
    expect(result.current.filteredStorylets.map(s => s.id)).toContain('storylet-1')
    expect(result.current.filteredStorylets.map(s => s.id)).toContain('storylet-2')
  })

  test('should combine multiple filters', () => {
    const { result } = renderHook(() =>
      useStoryletFilter(mockStorylets, {
        searchQuery: 'study',
        triggerType: 'all',
        status: 'live'
      })
    )

    expect(result.current.filteredStorylets).toHaveLength(1)
    expect(result.current.filteredStorylets[0].name).toBe('Study Session')
  })

  test('should be case insensitive for search', () => {
    const { result } = renderHook(() =>
      useStoryletFilter(mockStorylets, { searchQuery: 'STUDY', triggerType: 'all', status: 'all' })
    )

    expect(result.current.filteredStorylets).toHaveLength(2)
  })

  test('should search in description', () => {
    const { result } = renderHook(() =>
      useStoryletFilter(mockStorylets, { searchQuery: 'library', triggerType: 'all', status: 'all' })
    )

    expect(result.current.filteredStorylets).toHaveLength(1)
    expect(result.current.filteredStorylets[0].id).toBe('storylet-1')
  })

  test('should search in choice text', () => {
    const { result } = renderHook(() =>
      useStoryletFilter(mockStorylets, { searchQuery: 'mathematics', triggerType: 'all', status: 'all' })
    )

    expect(result.current.filteredStorylets).toHaveLength(1)
    expect(result.current.filteredStorylets[0].id).toBe('storylet-1')
  })

  test('should search in flags', () => {
    const { result } = renderHook(() =>
      useStoryletFilter(mockStorylets, { searchQuery: 'academic_focus', triggerType: 'all', status: 'all' })
    )

    expect(result.current.filteredStorylets).toHaveLength(1)
    expect(result.current.filteredStorylets[0].id).toBe('storylet-1')
  })

  test('should return correct counts', () => {
    const { result } = renderHook(() =>
      useStoryletFilter(mockStorylets, { searchQuery: 'study', triggerType: 'all', status: 'all' })
    )

    expect(result.current.totalCount).toBe(3)
    expect(result.current.filteredCount).toBe(2)
  })

  test('should handle storylets without triggers', () => {
    const storyletsWithoutTriggers: Storylet[] = [
      {
        id: 'no-trigger',
        name: 'No Trigger',
        description: 'Storylet without trigger',
        deploymentStatus: 'live',
        choices: []
      }
    ]

    const { result } = renderHook(() =>
      useStoryletFilter(storyletsWithoutTriggers, { searchQuery: '', triggerType: 'time', status: 'all' })
    )

    expect(result.current.filteredStorylets).toHaveLength(0)
  })

  test('should handle empty storylet array', () => {
    const { result } = renderHook(() =>
      useStoryletFilter([], { searchQuery: 'anything', triggerType: 'all', status: 'all' })
    )

    expect(result.current.filteredStorylets).toHaveLength(0)
    expect(result.current.totalCount).toBe(0)
    expect(result.current.filteredCount).toBe(0)
  })
})

describe('getFilterStats', () => {
  test('should return correct statistics', () => {
    const stats = getFilterStats(mockStorylets, mockStorylets.slice(0, 2), 'study')

    expect(stats.total).toBe(3)
    expect(stats.filtered).toBe(2)
    expect(stats.searchResults).toBe(2)
    expect(stats.byTriggerType.flag).toBe(2)
    expect(stats.byTriggerType.resource).toBe(1)
    expect(stats.byStatus.live).toBe(2)
    expect(stats.byStatus.dev).toBe(1)
  })

  test('should handle empty arrays', () => {
    const stats = getFilterStats([], [], '')

    expect(stats.total).toBe(0)
    expect(stats.filtered).toBe(0)
    expect(stats.searchResults).toBe(0)
  })
})