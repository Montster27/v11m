import { describe, test, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useTimeoutManager,
  useIntervalManager,
  useEventListenerManager,
  useResourceManager,
  withTimeout,
  createDebouncedFunction,
  createThrottledFunction
} from '../memoryManagement'

// Mock timers
vi.useFakeTimers()

describe('memoryManagement', () => {
  beforeEach(() => {
    vi.clearAllTimers()
  })

  describe('useTimeoutManager', () => {
    test('should create and track timeouts', () => {
      const { result } = renderHook(() => useTimeoutManager())
      const callback = vi.fn()

      act(() => {
        result.current.createTimeout(callback, 1000)
      })

      expect(result.current.activeTimeouts).toBe(1)
      
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(result.current.activeTimeouts).toBe(0)
    })

    test('should clear specific timeouts', () => {
      const { result } = renderHook(() => useTimeoutManager())
      const callback = vi.fn()

      let timeoutId: NodeJS.Timeout
      act(() => {
        timeoutId = result.current.createTimeout(callback, 1000)
      })

      expect(result.current.activeTimeouts).toBe(1)

      act(() => {
        result.current.clearTimeout(timeoutId)
      })

      expect(result.current.activeTimeouts).toBe(0)
      
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(callback).not.toHaveBeenCalled()
    })

    test('should clear all timeouts', () => {
      const { result } = renderHook(() => useTimeoutManager())
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      act(() => {
        result.current.createTimeout(callback1, 1000)
        result.current.createTimeout(callback2, 2000)
      })

      expect(result.current.activeTimeouts).toBe(2)

      act(() => {
        result.current.clearAllTimeouts()
      })

      expect(result.current.activeTimeouts).toBe(0)
      
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })

    test('should cleanup on unmount', () => {
      const { result, unmount } = renderHook(() => useTimeoutManager())
      const callback = vi.fn()

      act(() => {
        result.current.createTimeout(callback, 1000)
      })

      expect(result.current.activeTimeouts).toBe(1)

      unmount()

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('useIntervalManager', () => {
    test('should create and track intervals', () => {
      const { result } = renderHook(() => useIntervalManager())
      const callback = vi.fn()

      act(() => {
        result.current.createInterval(callback, 1000)
      })

      expect(result.current.activeIntervals).toBe(1)
      
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(callback).toHaveBeenCalledTimes(3)
    })

    test('should clear specific intervals', () => {
      const { result } = renderHook(() => useIntervalManager())
      const callback = vi.fn()

      let intervalId: NodeJS.Timeout
      act(() => {
        intervalId = result.current.createInterval(callback, 1000)
      })

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(callback).toHaveBeenCalledTimes(2)

      act(() => {
        result.current.clearInterval(intervalId)
      })

      expect(result.current.activeIntervals).toBe(0)

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(callback).toHaveBeenCalledTimes(2) // Should not increase
    })

    test('should cleanup on unmount', () => {
      const { result, unmount } = renderHook(() => useIntervalManager())
      const callback = vi.fn()

      act(() => {
        result.current.createInterval(callback, 1000)
      })

      unmount()

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('useEventListenerManager', () => {
    test('should add and track event listeners', () => {
      const { result } = renderHook(() => useEventListenerManager())
      const element = document.createElement('div')
      const handler = vi.fn()

      act(() => {
        result.current.addEventListener(element, 'click', handler)
      })

      expect(result.current.activeListeners).toBe(1)

      element.click()
      expect(handler).toHaveBeenCalledTimes(1)
    })

    test('should remove specific event listeners', () => {
      const { result } = renderHook(() => useEventListenerManager())
      const element = document.createElement('div')
      const handler = vi.fn()

      act(() => {
        result.current.addEventListener(element, 'click', handler)
      })

      act(() => {
        result.current.removeEventListener(element, 'click', handler)
      })

      expect(result.current.activeListeners).toBe(0)

      element.click()
      expect(handler).not.toHaveBeenCalled()
    })

    test('should cleanup on unmount', () => {
      const { result, unmount } = renderHook(() => useEventListenerManager())
      const element = document.createElement('div')
      const handler = vi.fn()

      act(() => {
        result.current.addEventListener(element, 'click', handler)
      })

      unmount()

      element.click()
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('useResourceManager', () => {
    test('should combine all resource managers', () => {
      const { result } = renderHook(() => useResourceManager())
      const callback = vi.fn()
      const element = document.createElement('div')
      const handler = vi.fn()

      act(() => {
        result.current.timeouts.createTimeout(callback, 1000)
        result.current.intervals.createInterval(callback, 500)
        result.current.listeners.addEventListener(element, 'click', handler)
      })

      expect(result.current.totalActiveResources).toBe(3)

      act(() => {
        result.current.cleanupAll()
      })

      expect(result.current.totalActiveResources).toBe(0)
    })
  })

  describe('withTimeout', () => {
    test('should resolve promise before timeout', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 500))
      
      const result = withTimeout(promise, 1000)
      
      act(() => {
        vi.advanceTimersByTime(500)
      })

      await expect(result).resolves.toBe('success')
    })

    test('should reject promise on timeout', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 2000))
      
      const result = withTimeout(promise, 1000)
      
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      await expect(result).rejects.toThrow('Operation timed out after 1000ms')
    })
  })

  describe('createDebouncedFunction', () => {
    test('should debounce function calls', () => {
      const fn = vi.fn()
      const debouncedFn = createDebouncedFunction(fn, 1000)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(fn).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('createThrottledFunction', () => {
    test('should throttle function calls', () => {
      const fn = vi.fn()
      const throttledFn = createThrottledFunction(fn, 1000)

      throttledFn()
      expect(fn).toHaveBeenCalledTimes(1)

      throttledFn()
      throttledFn()
      expect(fn).toHaveBeenCalledTimes(1) // Still only called once

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      throttledFn()
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })
})