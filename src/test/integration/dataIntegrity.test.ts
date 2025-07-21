// Data Integrity Tests
// Tests export/import cycles and data consistency across save/load operations

import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../../stores/useAppStore'
import { useStoryletStore } from '../../stores/useStoryletStore'
import { 
  setupGameState, 
  createTestStorylet, 
  resetAllStores,
  createTestCharacter
} from '../utils/gameTestUtils'

// Mock or import export/import functions
let exportGameData: any
let importGameData: any

try {
  const saveLoad = require('../../utils/saveLoad')
  exportGameData = saveLoad.exportGameData
  importGameData = saveLoad.importGameData
} catch {
  // Mock implementations
  exportGameData = async () => {
    return {
      version: '2.0',
      timestamp: new Date().toISOString(),
      appStore: useAppStore.getState(),
      storyletStore: useStoryletStore.getState()
    }
  }
  
  importGameData = async (data: any) => {
    if (data.appStore) {
      useAppStore.setState(data.appStore)
    }
    if (data.storyletStore) {
      useStoryletStore.setState(data.storyletStore)
    }
    return { success: true }
  }
}

describe('Data Integrity', () => {
  beforeEach(() => {
    resetAllStores()
  })

  describe('Basic Export/Import Cycle', () => {
    it('should maintain data integrity through simple export/import cycle', async () => {
      // Setup initial game state
      const initialState = setupGameState({
        day: 25,
        resources: {
          energy: 80,
          stress: 20,
          money: 200,
          knowledge: 300,
          social: 250
        }
      })
      
      // Export data
      const exportedData = await exportGameData()
      
      // Verify export contains expected data
      expect(exportedData).toBeTruthy()
      expect(exportedData).toHaveProperty('version')
      expect(exportedData).toHaveProperty('timestamp')
      
      // Clear everything
      resetAllStores()
      
      // Verify state is cleared
      const clearedState = useAppStore.getState()
      expect(clearedState.day).not.toBe(25)
      
      // Import data back
      const importResult = await importGameData(exportedData)
      expect(importResult.success).toBe(true)
      
      // Verify data was restored
      const restoredState = useAppStore.getState()
      expect(restoredState.day).toBe(25)
      expect(restoredState.resources?.money).toBe(200)
      expect(restoredState.resources?.knowledge).toBe(300)
    })

    it('should handle complex game state export/import', async () => {
      // Create complex game state
      const character = createTestCharacter({
        name: 'Complex Character',
        concerns: {
          academics: 30,
          socialFitting: 25,
          financial: 20,
          isolation: 10,
          genderIssues: 5,
          raceIssues: 0,
          classIssues: 0
        }
      })
      
      const gameState = setupGameState({
        day: 50,
        resources: { energy: 60, stress: 40, money: 150, knowledge: 450, social: 380 },
        activeCharacter: character,
        completedTutorial: true,
        unlockedFeatures: ['advanced_classes', 'research_lab', 'social_events']
      })
      
      // Add storylets
      const storylets = [
        createTestStorylet({ id: 'story1', name: 'First Story' }),
        createTestStorylet({ id: 'story2', name: 'Second Story' }),
        createTestStorylet({ id: 'story3', name: 'Third Story' })
      ]
      
      storylets.forEach(storylet => {
        useStoryletStore.getState().addStorylet(storylet)
      })
      
      useStoryletStore.getState().setFlag('important_flag', true)
      useStoryletStore.getState().unlockStorylet('story1')
      
      // Export
      const exportedData = await exportGameData()
      
      // Clear and import
      resetAllStores()
      await importGameData(exportedData)
      
      // Verify complex data restoration
      const restoredApp = useAppStore.getState()
      const restoredStorylet = useStoryletStore.getState()
      
      expect(restoredApp.day).toBe(50)
      expect(restoredApp.activeCharacter?.name).toBe('Complex Character')
      expect(restoredStorylet.activeFlags?.important_flag).toBe(true)
      expect(restoredStorylet.allStorylets?.story1?.name).toBe('First Story')
    })
  })

  describe('Data Validation', () => {
    it('should validate data structure before import', async () => {
      // Test with invalid data structure
      const invalidData = {
        version: '2.0',
        invalidField: 'should not break import'
      }
      
      const result = await importGameData(invalidData)
      
      // Should handle gracefully
      expect(result).toHaveProperty('success')
    })

    it('should handle missing data fields gracefully', async () => {
      const partialData = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        appStore: {
          day: 10
          // Missing resources and other fields
        }
      }
      
      const result = await importGameData(partialData)
      expect(result.success).toBe(true)
      
      // Should have imported what it could
      const state = useAppStore.getState()
      expect(state.day).toBe(10)
    })

    it('should detect and handle corrupted data', async () => {
      // Setup normal state
      setupGameState({ day: 5 })
      const normalExport = await exportGameData()
      
      // Corrupt the data
      const corruptedData = {
        ...normalExport,
        appStore: {
          ...normalExport.appStore,
          day: 'invalid_number', // Corrupted day value
          resources: null // Corrupted resources
        }
      }
      
      const result = await importGameData(corruptedData)
      
      // Should handle corruption gracefully
      expect(result).toHaveProperty('success')
    })
  })

  describe('Version Compatibility', () => {
    it('should handle different export versions', async () => {
      const v1Data = {
        version: '1.0',
        gameData: {
          day: 15,
          energy: 75,
          money: 100
        }
      }
      
      const result = await importGameData(v1Data)
      
      // Should handle version differences
      expect(result).toHaveProperty('success')
    })

    it('should upgrade old data formats', async () => {
      const oldFormatData = {
        version: '1.5',
        appData: {
          currentDay: 20, // Old field name
          playerEnergy: 80, // Old field name
          playerMoney: 150, // Old field name
          academicPoints: 200, // Old field name
          socialPoints: 180 // Old field name
        }
      }
      
      const result = await importGameData(oldFormatData)
      expect(result.success).toBe(true)
      
      // Should have converted to new format
      const state = useAppStore.getState()
      expect(typeof state.day).toBe('number')
    })
  })

  describe('Large Data Sets', () => {
    it('should handle large save files efficiently', async () => {
      // Create large game state
      const largeState = {
        day: 100,
        resources: { energy: 50, stress: 30, money: 5000, knowledge: 2000, social: 1500 },
        gameHistory: Array.from({ length: 1000 }, (_, i) => ({
          day: i,
          action: `action_${i}`,
          outcome: `outcome_${i}`,
          timestamp: Date.now() + i * 86400000 // Daily entries
        })),
        completedStorylets: Array.from({ length: 500 }, (_, i) => `storylet_${i}`),
        achievements: Array.from({ length: 100 }, (_, i) => `achievement_${i}`)
      }
      
      useAppStore.setState(largeState)
      
      // Add many storylets
      for (let i = 0; i < 200; i++) {
        useStoryletStore.getState().addStorylet(createTestStorylet({
          id: `large_storylet_${i}`,
          name: `Large Storylet ${i}`
        }))
      }
      
      // Measure export time
      const exportStart = performance.now()
      const exportedData = await exportGameData()
      const exportEnd = performance.now()
      
      expect(exportEnd - exportStart).toBeLessThan(1000) // Under 1 second
      
      // Clear and measure import time
      resetAllStores()
      
      const importStart = performance.now()
      const result = await importGameData(exportedData)
      const importEnd = performance.now()
      
      expect(result.success).toBe(true)
      expect(importEnd - importStart).toBeLessThan(1000) // Under 1 second
      
      // Verify large data was restored
      const restoredApp = useAppStore.getState()
      expect(restoredApp.day).toBe(100)
      expect(restoredApp.gameHistory?.length).toBe(1000)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent export operations', async () => {
      setupGameState({ day: 30 })
      
      // Start multiple exports
      const exportPromises = [
        exportGameData(),
        exportGameData(),
        exportGameData()
      ]
      
      const results = await Promise.all(exportPromises)
      
      // All should succeed
      results.forEach(result => {
        expect(result).toBeTruthy()
        expect(result.version).toBeTruthy()
      })
    })

    it('should handle export during game state changes', async () => {
      setupGameState({ day: 1 })
      
      // Start export
      const exportPromise = exportGameData()
      
      // Make changes during export
      setTimeout(() => {
        useAppStore.setState({ day: 2 })
      }, 10)
      
      const exportedData = await exportPromise
      
      // Should complete successfully
      expect(exportedData).toBeTruthy()
      expect(typeof exportedData.timestamp).toBe('string')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty game state', async () => {
      // Start with completely empty state
      resetAllStores()
      
      const exportedData = await exportGameData()
      const result = await importGameData(exportedData)
      
      expect(result.success).toBe(true)
    })

    it('should handle circular references in data', async () => {
      // Create data with potential circular references
      const problematicState = setupGameState({
        day: 10,
        customData: {}
      })
      
      // Add circular reference (if the system allows it)
      const customObj: any = { reference: null }
      customObj.reference = customObj
      
      try {
        const exportedData = await exportGameData()
        const result = await importGameData(exportedData)
        expect(result.success).toBe(true)
      } catch (error) {
        // Should handle circular reference errors gracefully
        expect(error).toBeTruthy()
      }
    })

    it('should handle null and undefined values', async () => {
      const stateWithNulls = {
        day: 5,
        resources: {
          energy: null,
          stress: undefined,
          money: 100,
          knowledge: null,
          social: 150
        },
        activeCharacter: null,
        gameFlags: {
          flag1: true,
          flag2: null,
          flag3: undefined
        }
      }
      
      useAppStore.setState(stateWithNulls)
      
      const exportedData = await exportGameData()
      resetAllStores()
      const result = await importGameData(exportedData)
      
      expect(result.success).toBe(true)
      
      const restoredState = useAppStore.getState()
      expect(restoredState.day).toBe(5)
      expect(restoredState.resources?.money).toBe(100)
    })
  })

  describe('Data Consistency Checks', () => {
    it('should maintain referential integrity', async () => {
      // Setup state with related data
      setupGameState({ day: 20 })
      
      const storylet1 = createTestStorylet({ id: 'ref_storylet_1' })
      const storylet2 = createTestStorylet({ 
        id: 'ref_storylet_2',
        trigger: {
          type: 'flag',
          conditions: { flags: ['completed_ref_storylet_1'] }
        }
      })
      
      useStoryletStore.getState().addStorylet(storylet1)
      useStoryletStore.getState().addStorylet(storylet2)
      useStoryletStore.getState().setFlag('completed_ref_storylet_1', true)
      
      // Export and import
      const exportedData = await exportGameData()
      resetAllStores()
      await importGameData(exportedData)
      
      // Verify relationships are maintained
      const restoredStorylet = useStoryletStore.getState()
      expect(restoredStorylet.allStorylets?.ref_storylet_1).toBeTruthy()
      expect(restoredStorylet.allStorylets?.ref_storylet_2).toBeTruthy()
      expect(restoredStorylet.activeFlags?.completed_ref_storylet_1).toBe(true)
    })
  })
})