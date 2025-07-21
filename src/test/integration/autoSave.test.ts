// Auto-Save System Tests
// Tests the reliability and performance of the auto-save system

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAppStore } from '../../stores/useAppStore'
import { resetAllStores } from '../utils/gameTestUtils'

// Import the actual auto-save hook
import { useAutoSave } from '../../hooks/useAutoSave'

describe('Auto-Save System', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetAllStores()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic Auto-Save Functionality', () => {
    it('should initialize auto-save system', () => {
      const { result } = renderHook(() => useAutoSave())
      
      expect(result.current).toHaveProperty('isEnabled')
      expect(result.current).toHaveProperty('status')
      expect(result.current).toHaveProperty('mode')
      expect(result.current).toHaveProperty('forceFlush')
      expect(result.current).toHaveProperty('forceAtomicSave')
    })

    it('should be enabled by default', () => {
      const { result } = renderHook(() => useAutoSave())
      
      expect(result.current.isEnabled).toBe(true)
      expect(result.current.status).toBe('active')
    })

    it('should provide save statistics', () => {
      const { result } = renderHook(() => useAutoSave())
      
      expect(result.current.stats).toBeDefined()
      expect(result.current.stats.day).toBeDefined()
      expect(result.current.stats.playerLevel).toBeDefined()
      expect(result.current.stats.totalSkills).toBeDefined()
    })
  })

  describe('Save Triggers', () => {
    it('should detect significant game state changes', async () => {
      const { result } = renderHook(() => useAutoSave())
      const initialStats = { ...result.current.stats }
      
      // The hook reads from v2 stores, so we need to import and use them
      const { useCoreGameStore } = await import('../../stores/v2')
      
      // Make a significant change in the v2 store
      useCoreGameStore.setState(state => ({
        world: {
          ...state.world,
          day: 10
        }
      }))
      
      // Re-render to get updated stats
      const { result: updatedResult } = renderHook(() => useAutoSave())
      
      // Stats should reflect the change
      expect(updatedResult.current.stats.day).toBe(10)
      expect(updatedResult.current.stats.day).not.toBe(initialStats.day)
    })

    it('should provide force save functions', async () => {
      const { result } = renderHook(() => useAutoSave())
      
      // Test force flush
      expect(() => result.current.forceFlush()).not.toThrow()
      
      // Test force atomic save
      const savePromise = result.current.forceAtomicSave()
      expect(savePromise).toBeInstanceOf(Promise)
      
      const saveResult = await savePromise
      expect(typeof saveResult).toBe('boolean')
    })
  })

  describe('Save Modes', () => {
    it('should support different save modes', () => {
      const { result } = renderHook(() => useAutoSave())
      
      expect(['legacy', 'atomic', 'hybrid']).toContain(result.current.mode)
    })
  })

  describe('Resource Changes', () => {
    it('should track resource changes', () => {
      const { result: hookResult } = renderHook(() => useAutoSave())
      
      // Change resources
      useAppStore.setState(state => ({
        resources: {
          ...state.resources,
          money: 1000,
          energy: 50
        }
      }))
      
      // Advance timers
      vi.advanceTimersByTime(10000)
      
      // Hook should still be active
      expect(hookResult.current.isEnabled).toBe(true)
    })
  })

  describe('Save Timing', () => {
    it('should track last save times', () => {
      const { result } = renderHook(() => useAutoSave())
      
      expect(typeof result.current.stats.lastAtomicSave).toBe('number')
      expect(typeof result.current.stats.lastLegacySave).toBe('number')
    })
  })
})