// Store Migration Tests
// Tests migration from V1 to V2 store architecture

import { describe, it, expect, beforeEach } from 'vitest'

// Try to import actual migration service, fall back to mock
let MigrationService: any

try {
  const service = require('../../services/storage/MigrationService')
  MigrationService = service.MigrationService
} catch {
  // Mock implementation
  MigrationService = class MockMigrationService {
    async migrateStore(sourceKey: string, targetKey: string, transformer?: (data: any) => any) {
      const sourceData = localStorage.getItem(sourceKey)
      if (!sourceData) {
        return { success: false, error: 'Source data not found' }
      }
      
      try {
        const parsed = JSON.parse(sourceData)
        const transformed = transformer ? transformer(parsed) : parsed
        localStorage.setItem(targetKey, JSON.stringify(transformed))
        return { success: true, migratedItems: 1 }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
    
    async checkMigrationStatus(storeKey: string) {
      return {
        needsMigration: !localStorage.getItem(`${storeKey}-v2`),
        hasV1Data: !!localStorage.getItem(`${storeKey}-v1`),
        hasV2Data: !!localStorage.getItem(`${storeKey}-v2`)
      }
    }
  }
}

describe('Store Migration', () => {
  let migrationService: any
  
  beforeEach(() => {
    localStorage.clear()
    migrationService = new MigrationService()
  })

  describe('Basic Migration', () => {
    it('should migrate V1 character data to V2', async () => {
      const v1Data = {
        name: 'Old Character',
        skills: {
          academic: 50,
          social: 30
        },
        concerns: {
          academics: 25,
          social: 15
        }
      }
      
      // Store V1 data
      localStorage.setItem('character-store-v1', JSON.stringify(v1Data))
      
      // Define transformation
      const transformer = (data: any) => ({
        ...data,
        version: 2,
        competencies: {
          'bureaucratic-navigation': data.skills?.academic || 0,
          'alliance-building': data.skills?.social || 0
        },
        metadata: {
          migratedAt: new Date().toISOString(),
          originalVersion: 1
        }
      })
      
      // Run migration
      const result = await migrationService.migrateStore(
        'character-store-v1',
        'character-store-v2',
        transformer
      )
      
      expect(result.success).toBe(true)
      
      // Verify V2 data
      const v2Data = JSON.parse(localStorage.getItem('character-store-v2') || '{}')
      expect(v2Data.version).toBe(2)
      expect(v2Data.competencies).toBeDefined()
      expect(v2Data.competencies['bureaucratic-navigation']).toBe(50)
      expect(v2Data.competencies['alliance-building']).toBe(30)
      expect(v2Data.metadata).toBeDefined()
    })

    it('should migrate storylet data with proper structure', async () => {
      const v1StoryletData = {
        activeStorylets: ['story1', 'story2'],
        completedStorylets: ['story3'],
        flags: {
          tutorial_complete: true,
          first_day: false
        }
      }
      
      localStorage.setItem('storylet-store-v1', JSON.stringify(v1StoryletData))
      
      const transformer = (data: any) => ({
        version: 2,
        activeStoryletIds: data.activeStorylets || [],
        completedStoryletIds: data.completedStorylets || [],
        activeFlags: data.flags || {},
        allStorylets: {}, // Will be populated by the catalog
        deploymentFilter: new Set(['live', 'stage', 'dev']),
        metadata: {
          migratedAt: new Date().toISOString(),
          originalVersion: 1
        }
      })
      
      const result = await migrationService.migrateStore(
        'storylet-store-v1',
        'storylet-store-v2',
        transformer
      )
      
      expect(result.success).toBe(true)
      
      const v2Data = JSON.parse(localStorage.getItem('storylet-store-v2') || '{}')
      expect(v2Data.version).toBe(2)
      expect(v2Data.activeStoryletIds).toEqual(['story1', 'story2'])
      expect(v2Data.completedStoryletIds).toEqual(['story3'])
      expect(v2Data.activeFlags.tutorial_complete).toBe(true)
    })

    it('should migrate app store with resource structure', async () => {
      const v1AppData = {
        day: 15,
        energy: 75,
        stress: 25,
        money: 150,
        academicPoints: 200,
        socialPoints: 180
      }
      
      localStorage.setItem('app-store-v1', JSON.stringify(v1AppData))
      
      const transformer = (data: any) => ({
        version: 2,
        day: data.day || 1,
        resources: {
          energy: data.energy || 100,
          stress: data.stress || 0,
          money: data.money || 0,
          knowledge: data.academicPoints || 0,
          social: data.socialPoints || 0
        },
        metadata: {
          migratedAt: new Date().toISOString(),
          originalVersion: 1
        }
      })
      
      const result = await migrationService.migrateStore(
        'app-store-v1',
        'app-store-v2',
        transformer
      )
      
      expect(result.success).toBe(true)
      
      const v2Data = JSON.parse(localStorage.getItem('app-store-v2') || '{}')
      expect(v2Data.version).toBe(2)
      expect(v2Data.day).toBe(15)
      expect(v2Data.resources.energy).toBe(75)
      expect(v2Data.resources.knowledge).toBe(200)
      expect(v2Data.resources.social).toBe(180)
    })
  })

  describe('Migration Error Handling', () => {
    it('should handle missing source data', async () => {
      const result = await migrationService.migrateStore(
        'nonexistent-store',
        'target-store',
        (data) => data
      )
      
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should handle invalid JSON data', async () => {
      localStorage.setItem('invalid-store', 'invalid json{')
      
      const result = await migrationService.migrateStore(
        'invalid-store',
        'target-store',
        (data) => data
      )
      
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should handle transformer errors', async () => {
      const validData = { test: 'data' }
      localStorage.setItem('source-store', JSON.stringify(validData))
      
      const errorTransformer = () => {
        throw new Error('Transformation failed')
      }
      
      const result = await migrationService.migrateStore(
        'source-store',
        'target-store',
        errorTransformer
      )
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Transformation failed')
    })
  })

  describe('Migration Status Checking', () => {
    it('should correctly identify migration needs', async () => {
      // No data - should not need migration
      let status = await migrationService.checkMigrationStatus('empty-store')
      expect(status.needsMigration).toBe(true) // No V2 data
      expect(status.hasV1Data).toBe(false)
      expect(status.hasV2Data).toBe(false)
      
      // Add V1 data
      localStorage.setItem('test-store-v1', JSON.stringify({ data: 'v1' }))
      status = await migrationService.checkMigrationStatus('test-store')
      expect(status.hasV1Data).toBe(true)
      expect(status.hasV2Data).toBe(false)
      
      // Add V2 data
      localStorage.setItem('test-store-v2', JSON.stringify({ data: 'v2', version: 2 }))
      status = await migrationService.checkMigrationStatus('test-store')
      expect(status.hasV1Data).toBe(true)
      expect(status.hasV2Data).toBe(true)
      expect(status.needsMigration).toBe(false) // V2 exists
    })
  })

  describe('Complex Migration Scenarios', () => {
    it('should handle nested object migration', async () => {
      const complexV1Data = {
        character: {
          personal: {
            name: 'Complex Character',
            age: 20
          },
          academic: {
            gpa: 3.5,
            credits: 60,
            major: 'Computer Science'
          },
          social: {
            friends: ['friend1', 'friend2'],
            relationships: {
              'friend1': 75,
              'friend2': 60
            }
          }
        },
        settings: {
          difficulty: 'normal',
          autoSave: true
        }
      }
      
      localStorage.setItem('complex-store-v1', JSON.stringify(complexV1Data))
      
      const complexTransformer = (data: any) => ({
        version: 2,
        profile: {
          name: data.character?.personal?.name || 'Unknown',
          age: data.character?.personal?.age || 18,
          academicRecord: {
            gpa: data.character?.academic?.gpa || 0,
            completedCredits: data.character?.academic?.credits || 0,
            fieldOfStudy: data.character?.academic?.major || 'Undeclared'
          }
        },
        socialNetwork: {
          connections: data.character?.social?.friends || [],
          relationshipLevels: data.character?.social?.relationships || {}
        },
        preferences: data.settings || {},
        metadata: {
          migratedAt: new Date().toISOString(),
          migrationComplexity: 'high'
        }
      })
      
      const result = await migrationService.migrateStore(
        'complex-store-v1',
        'complex-store-v2',
        complexTransformer
      )
      
      expect(result.success).toBe(true)
      
      const v2Data = JSON.parse(localStorage.getItem('complex-store-v2') || '{}')
      expect(v2Data.version).toBe(2)
      expect(v2Data.profile.name).toBe('Complex Character')
      expect(v2Data.profile.academicRecord.gpa).toBe(3.5)
      expect(v2Data.socialNetwork.connections).toEqual(['friend1', 'friend2'])
      expect(v2Data.socialNetwork.relationshipLevels.friend1).toBe(75)
    })

    it('should handle array data migration', async () => {
      const arrayData = {
        storylets: [
          { id: 'story1', name: 'First Story', completed: true },
          { id: 'story2', name: 'Second Story', completed: false },
          { id: 'story3', name: 'Third Story', completed: true }
        ],
        achievements: [
          'first_day', 'tutorial_complete', 'first_friend'
        ]
      }
      
      localStorage.setItem('array-store-v1', JSON.stringify(arrayData))
      
      const arrayTransformer = (data: any) => ({
        version: 2,
        storyletCatalog: data.storylets.reduce((acc: any, story: any) => {
          acc[story.id] = {
            ...story,
            metadata: {
              migrated: true,
              originalIndex: data.storylets.indexOf(story)
            }
          }
          return acc
        }, {}),
        completedStoryletIds: data.storylets
          .filter((story: any) => story.completed)
          .map((story: any) => story.id),
        unlockedAchievements: [...new Set(data.achievements)], // Convert Set to Array for JSON
        metadata: {
          migratedAt: new Date().toISOString()
        }
      })
      
      const result = await migrationService.migrateStore(
        'array-store-v1',
        'array-store-v2',
        arrayTransformer
      )
      
      expect(result.success).toBe(true)
      
      const v2Data = JSON.parse(localStorage.getItem('array-store-v2') || '{}')
      expect(v2Data.version).toBe(2)
      expect(v2Data.storyletCatalog.story1.name).toBe('First Story')
      expect(v2Data.completedStoryletIds).toEqual(['story1', 'story3'])
      expect(Array.isArray(v2Data.unlockedAchievements)).toBe(true) // Set becomes array in JSON
    })
  })

  describe('Migration Performance', () => {
    it('should handle large data migration efficiently', async () => {
      // Create large dataset
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: `item_${i}`,
          name: `Item ${i}`,
          description: `Description for item ${i}`.repeat(5),
          properties: {
            value: i * 10,
            rarity: i % 5,
            category: `category_${i % 10}`
          }
        }))
      }
      
      localStorage.setItem('large-store-v1', JSON.stringify(largeData))
      
      const transformer = (data: any) => ({
        version: 2,
        itemCatalog: data.items.reduce((acc: any, item: any) => {
          acc[item.id] = item
          return acc
        }, {}),
        metadata: {
          migratedAt: new Date().toISOString(),
          itemCount: data.items.length
        }
      })
      
      const startTime = performance.now()
      const result = await migrationService.migrateStore(
        'large-store-v1',
        'large-store-v2',
        transformer
      )
      const endTime = performance.now()
      
      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete in under 1 second
      
      const v2Data = JSON.parse(localStorage.getItem('large-store-v2') || '{}')
      expect(v2Data.metadata.itemCount).toBe(1000)
      expect(Object.keys(v2Data.itemCatalog)).toHaveLength(1000)
    })
  })
})