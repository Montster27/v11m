// Performance-optimized version of game test utilities
// Provides faster, more efficient helper functions for testing

import { renderHook } from '@testing-library/react'
import { useAppStore } from '../../stores/useAppStore'
import { useStoryletStore } from '../../stores/useStoryletStore'
import { useStoryletCatalogStore } from '../../stores/useStoryletCatalogStore'
import type { Storylet } from '../../types/storylet'

// Batch processing for better performance
const BATCH_SIZE = 20;
const OPTIMIZED_WAIT_TIME = 5; // Reduced from 10ms
const OPTIMIZED_EVAL_WAIT = 25; // Reduced from 50ms

/**
 * Optimized setup function with batching
 */
export const setupOptimizedGameState = (overrides = {}) => {
  const defaultState = {
    day: 1,
    resources: {
      energy: 100,
      stress: 0,
      money: 50,
      knowledge: 100,
      social: 150
    },
    activeCharacter: {
      id: 'test-char',
      name: 'Test Character'
    },
    ...overrides
  }
  
  // Use setState directly without intermediate calls
  useAppStore.setState(defaultState)
  return defaultState
}

/**
 * Optimized wait with shorter timeouts
 */
export const fastWaitForStoryletEvaluation = async () => {
  await new Promise(resolve => setTimeout(resolve, OPTIMIZED_EVAL_WAIT))
}

export const fastWaitForStoreUpdate = async () => {
  await new Promise(resolve => setTimeout(resolve, OPTIMIZED_WAIT_TIME))
}

/**
 * Optimized batch storylet creation
 */
export const createOptimizedTestStorylets = (count: number, baseOverrides = {}) => {
  const storylets: Storylet[] = []
  
  // Pre-calculate common values to avoid repeated computation
  const baseStorylet = {
    description: 'A test storylet for performance testing',
    sections: [{
      id: 'section1',
      content: 'Performance test content',
      choices: [{
        id: 'choice1',
        text: 'Test Choice',
        effects: []
      }]
    }],
    requirements: { flags: {} },
    effects: [],
    tags: ['test', 'performance'],
    frequency: 'once' as const,
    deployment: 'dev' as const,
    ...baseOverrides
  }
  
  for (let i = 0; i < count; i++) {
    storylets.push({
      ...baseStorylet,
      id: `optimized-test-storylet-${i}-${Date.now()}`,
      title: `Optimized Test Storylet ${i + 1}`,
      // Only customize what's actually different
      sections: [{
        ...baseStorylet.sections[0],
        content: `Performance test content ${i + 1}`
      }]
    })
  }
  
  return storylets
}

/**
 * Optimized batch storylet addition with reduced I/O
 */
export const addOptimizedStoryletsToTest = async (storylets: Record<string, Storylet>) => {
  // Single setState call instead of multiple
  useStoryletCatalogStore.setState({
    allStorylets: storylets,
    lastLoaded: Date.now(),
    isLoading: false
  })
  
  await fastWaitForStoreUpdate()
  
  // Direct sync without additional waiting
  useStoryletStore.getState().syncFromCatalogStore()
  await fastWaitForStoreUpdate()
}

/**
 * Optimized evaluation with minimal waiting
 */
export const fastEvaluateAndWait = async () => {
  useStoryletStore.getState().evaluateStorylets()
  await fastWaitForStoryletEvaluation()
}

/**
 * Optimized reset that only clears what's necessary
 */
export const fastResetStores = () => {
  // Minimal reset - only essential fields
  useAppStore.setState({
    day: 1,
    resources: {
      energy: 100,
      stress: 0,
      money: 50,
      knowledge: 100,
      social: 150
    },
    activeCharacter: null
  })

  useStoryletStore.setState({
    allStorylets: {},
    activeStoryletIds: [],
    completedStoryletIds: [],
    activeFlags: {},
    storyletCooldowns: {},
    deploymentFilter: new Set(['live', 'dev']),
    _testMode: true
  })

  useStoryletCatalogStore.setState({
    allStorylets: {},
    lastLoaded: 0,
    isLoading: false
  })
}

/**
 * Batch operations for better performance
 */
export const batchProcessStorylets = async (storylets: Storylet[], batchSize = BATCH_SIZE) => {
  const results = []
  
  for (let i = 0; i < storylets.length; i += batchSize) {
    const batch = storylets.slice(i, i + batchSize)
    const batchObject: Record<string, Storylet> = {}
    
    batch.forEach(storylet => {
      batchObject[storylet.id] = storylet
    })
    
    await addOptimizedStoryletsToTest(batchObject)
    await fastEvaluateAndWait()
    
    results.push(batch.length)
  }
  
  return results
}

/**
 * Performance-optimized storylet completion
 */
export const fastCompleteStorylets = async (storyletIds: string[]) => {
  const storyletStore = useStoryletStore.getState()
  
  // Batch complete storylets
  const updates = {
    completedStoryletIds: [...storyletStore.completedStoryletIds, ...storyletIds],
    activeStoryletIds: storyletStore.activeStoryletIds.filter(id => !storyletIds.includes(id))
  }
  
  useStoryletStore.setState(updates)
  await fastWaitForStoreUpdate()
}

/**
 * Optimized flag setting with batching
 */
export const batchSetFlags = async (flags: Record<string, boolean>) => {
  const storyletStore = useStoryletStore.getState()
  
  useStoryletStore.setState({
    activeFlags: {
      ...storyletStore.activeFlags,
      ...flags
    }
  })
  
  await fastWaitForStoreUpdate()
}

/**
 * Memory-efficient search implementation
 */
export const optimizedSearchStorylets = (storylets: Record<string, Storylet>, searchTerm: string) => {
  const lowerSearchTerm = searchTerm.toLowerCase()
  const results: Storylet[] = []
  
  // Use for...in for better performance than Object.values
  for (const id in storylets) {
    const storylet = storylets[id]
    
    // Early exit conditions for better performance
    if (storylet.title.toLowerCase().includes(lowerSearchTerm) ||
        storylet.description.toLowerCase().includes(lowerSearchTerm) ||
        storylet.tags?.some(tag => tag.toLowerCase().includes(lowerSearchTerm))) {
      results.push(storylet)
    }
  }
  
  return results
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private operations: Array<{ name: string; startTime: number; endTime?: number }> = []
  
  start(operationName: string): number {
    const startTime = performance.now()
    this.operations.push({ name: operationName, startTime })
    return this.operations.length - 1
  }
  
  end(operationIndex: number): number {
    const operation = this.operations[operationIndex]
    if (operation) {
      operation.endTime = performance.now()
      return operation.endTime - operation.startTime
    }
    return 0
  }
  
  getReport(): { name: string; duration: number }[] {
    return this.operations
      .filter(op => op.endTime)
      .map(op => ({
        name: op.name,
        duration: op.endTime! - op.startTime
      }))
  }
  
  getTotalTime(): number {
    return this.getReport().reduce((sum, op) => sum + op.duration, 0)
  }
  
  clear(): void {
    this.operations = []
  }
}

/**
 * Memory usage estimation
 */
export const estimateMemoryUsage = (stores: any[]) => {
  let totalSize = 0
  
  for (const store of stores) {
    try {
      const serialized = JSON.stringify(store)
      totalSize += serialized.length
    } catch (error) {
      console.warn('Could not estimate memory for store:', error)
    }
  }
  
  return {
    totalBytes: totalSize,
    totalKB: Math.round(totalSize / 1024 * 100) / 100,
    totalMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
  }
}

/**
 * Optimized concurrent operation handler
 */
export const runConcurrentOperations = async <T>(
  operations: (() => Promise<T>)[],
  maxConcurrency = 5
): Promise<T[]> => {
  const results: T[] = []
  
  for (let i = 0; i < operations.length; i += maxConcurrency) {
    const batch = operations.slice(i, i + maxConcurrency)
    const batchResults = await Promise.all(batch.map(op => op()))
    results.push(...batchResults)
  }
  
  return results
}

/**
 * Smart storylet evaluation that only processes changed storylets
 */
export const smartEvaluateStorylets = async () => {
  const storyletStore = useStoryletStore.getState()
  
  // This would require implementation in the actual store
  // For now, just use the regular evaluation but with optimized timing
  storyletStore.evaluateStorylets()
  await fastWaitForStoryletEvaluation()
}

/**
 * Debounced operations for rapid successive calls
 */
let debounceTimer: NodeJS.Timeout | null = null
export const debouncedEvaluation = async (delayMs = 10) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  return new Promise<void>((resolve) => {
    debounceTimer = setTimeout(async () => {
      await fastEvaluateAndWait()
      resolve()
    }, delayMs)
  })
}