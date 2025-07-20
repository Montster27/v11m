import { describe, test, expect, beforeEach } from 'vitest'
import { useStoryletFlagStore, flagUtils } from '../useStoryletFlagStore'

describe('useStoryletFlagStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useStoryletFlagStore.getState().clearAllFlags()
  })

  test('should initialize with empty flags', () => {
    const state = useStoryletFlagStore.getState()
    expect(state.activeFlags).toEqual({})
    expect(state.getFlagCount()).toBe(0)
  })

  test('should set and get flags', () => {
    const store = useStoryletFlagStore.getState()
    
    store.setFlag('test_flag', true)
    expect(store.getFlag('test_flag')).toBe(true)
    
    store.setFlag('another_flag', false)
    expect(store.getFlag('another_flag')).toBe(false)
  })

  test('should return false for non-existent flags', () => {
    const store = useStoryletFlagStore.getState()
    expect(store.getFlag('non_existent')).toBe(false)
  })

  test('should check if flag exists and is true', () => {
    const store = useStoryletFlagStore.getState()
    
    expect(store.hasFlag('test_flag')).toBe(false)
    
    store.setFlag('test_flag', true)
    expect(store.hasFlag('test_flag')).toBe(true)
    
    store.setFlag('test_flag', false)
    expect(store.hasFlag('test_flag')).toBe(false) // hasFlag checks for truthy value
  })

  test('should clear individual flags', () => {
    const store = useStoryletFlagStore.getState()
    
    store.setFlag('flag1', true)
    store.setFlag('flag2', false)
    
    expect(store.getFlagCount()).toBe(2)
    
    store.clearFlag('flag1')
    
    expect(store.getFlagCount()).toBe(1)
    expect(store.getFlag('flag1')).toBe(false)
    expect(store.getFlag('flag2')).toBe(false)
  })

  test('should clear all flags', () => {
    const store = useStoryletFlagStore.getState()
    
    store.setFlag('flag1', true)
    store.setFlag('flag2', false)
    store.setFlag('flag3', true)
    
    expect(store.getFlagCount()).toBe(3)
    
    store.clearAllFlags()
    
    expect(store.activeFlags).toEqual({})
    expect(store.getFlagCount()).toBe(0)
  })

  test('should set multiple flags at once', () => {
    const store = useStoryletFlagStore.getState()
    
    const flagsToSet = {
      flag1: true,
      flag2: false,
      flag3: true
    }
    
    store.setFlags(flagsToSet)
    
    expect(store.getFlag('flag1')).toBe(true)
    expect(store.getFlag('flag2')).toBe(false)
    expect(store.getFlag('flag3')).toBe(true)
  })

  test('should get multiple flags', () => {
    const store = useStoryletFlagStore.getState()
    
    store.setFlag('flag1', true)
    store.setFlag('flag2', false)
    
    const flags = store.getFlags(['flag1', 'flag2', 'non_existent'])
    
    expect(flags).toEqual({
      flag1: true,
      flag2: false,
      non_existent: false
    })
  })

  test('should export and import flags', () => {
    const store = useStoryletFlagStore.getState()
    
    // Set some initial flags
    store.setFlag('export_flag1', true)
    store.setFlag('export_flag2', false)
    
    // Export flags
    const exported = store.exportFlags()
    const exportedObj = JSON.parse(exported)
    expect(exportedObj).toEqual({
      export_flag1: true,
      export_flag2: false
    })
    
    // Clear and import
    store.clearAllFlags()
    expect(store.getFlagCount()).toBe(0)
    
    store.importFlags(exported)
    expect(store.getFlag('export_flag1')).toBe(true)
    expect(store.getFlag('export_flag2')).toBe(false)
  })

  test('should get all flags', () => {
    const store = useStoryletFlagStore.getState()
    
    store.setFlag('flag1', true)
    store.setFlag('flag2', false)
    
    const allFlags = store.getAllFlags()
    expect(allFlags).toEqual({
      flag1: true,
      flag2: false
    })
    
    // Should return a copy, not reference
    allFlags.flag3 = true
    expect(store.getFlag('flag3')).toBe(false)
  })

  test('should handle subscription updates', () => {
    let updateCount = 0
    let lastState: any = null
    
    const unsubscribe = useStoryletFlagStore.subscribe((state) => {
      updateCount++
      lastState = state
    })
    
    const store = useStoryletFlagStore.getState()
    
    store.setFlag('sub_test', true)
    expect(updateCount).toBeGreaterThan(0)
    expect(lastState?.activeFlags.sub_test).toBe(true)
    
    store.setFlag('sub_test', false)
    expect(lastState?.activeFlags.sub_test).toBe(false)
    
    unsubscribe()
  })

  test('should maintain immutability', () => {
    const store = useStoryletFlagStore.getState()
    
    const initialFlags = store.activeFlags
    store.setFlag('immutable_test', true)
    
    // Original reference should not be modified
    expect(initialFlags).not.toBe(store.activeFlags)
    expect(initialFlags.immutable_test).toBeUndefined()
    expect(store.activeFlags.immutable_test).toBe(true)
  })
})

describe('flagUtils', () => {
  beforeEach(() => {
    useStoryletFlagStore.getState().clearAllFlags()
  })

  test('should check if all flags are set', () => {
    const store = useStoryletFlagStore.getState()
    
    store.setFlag('flag1', true)
    store.setFlag('flag2', true)
    store.setFlag('flag3', false)
    
    expect(flagUtils.hasAllFlags(['flag1', 'flag2'])).toBe(true)
    expect(flagUtils.hasAllFlags(['flag1', 'flag2', 'flag3'])).toBe(false)
  })

  test('should check if any flags are set', () => {
    const store = useStoryletFlagStore.getState()
    
    store.setFlag('flag1', false)
    store.setFlag('flag2', true)
    store.setFlag('flag3', false)
    
    expect(flagUtils.hasAnyFlag(['flag1', 'flag3'])).toBe(false)
    expect(flagUtils.hasAnyFlag(['flag1', 'flag2', 'flag3'])).toBe(true)
  })

  test('should toggle flags', () => {
    const store = useStoryletFlagStore.getState()
    
    // Start with false (default)
    expect(store.getFlag('toggle_test')).toBe(false)
    
    flagUtils.toggleFlag('toggle_test')
    expect(store.getFlag('toggle_test')).toBe(true)
    
    flagUtils.toggleFlag('toggle_test')
    expect(store.getFlag('toggle_test')).toBe(false)
  })

  test('should set conditional flags', () => {
    const store = useStoryletFlagStore.getState()
    
    flagUtils.setConditionalFlags([
      { condition: true, flag: 'should_set', value: true },
      { condition: false, flag: 'should_not_set', value: true },
      { condition: true, flag: 'should_clear', value: false }
    ])
    
    expect(store.getFlag('should_set')).toBe(true)
    expect(store.getFlag('should_not_set')).toBe(false)
    expect(store.getFlag('should_clear')).toBe(false)
  })

  test('should get flags matching pattern', () => {
    const store = useStoryletFlagStore.getState()
    
    store.setFlag('quest_complete', true)
    store.setFlag('quest_failed', false)
    store.setFlag('other_flag', true)
    
    const questFlags = flagUtils.getFlagsMatching(/^quest_/)
    
    expect(questFlags).toEqual({
      quest_complete: true,
      quest_failed: false
    })
  })

  test('should clear flags matching pattern', () => {
    const store = useStoryletFlagStore.getState()
    
    store.setFlag('temp_flag1', true)
    store.setFlag('temp_flag2', false)
    store.setFlag('permanent_flag', true)
    
    flagUtils.clearFlagsMatching(/^temp_/)
    
    expect(store.getFlag('temp_flag1')).toBe(false)
    expect(store.getFlag('temp_flag2')).toBe(false)
    expect(store.getFlag('permanent_flag')).toBe(true)
  })
})