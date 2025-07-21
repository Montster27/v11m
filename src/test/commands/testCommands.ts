// Test Commands and Utilities
// Provides helper commands for testing and validation

import { useAppStore } from '../../stores/useAppStore'
import { useStoryletStore } from '../../stores/useStoryletStore'
import { generateGameScenario, generateBatchTestData } from '../generators/testDataGenerators'

export const testCommands = {
  /**
   * Run a specific game scenario for testing
   */
  async runScenario(scenarioName: string) {
    console.log(`🎮 Running test scenario: ${scenarioName}`)
    
    let scenario
    switch (scenarioName) {
      case 'tutorial':
        scenario = generateGameScenario('tutorial')
        break
      case 'early-game':
        scenario = generateGameScenario('early')
        break
      case 'mid-game':
        scenario = generateGameScenario('mid')
        break
      case 'late-game':
        scenario = generateGameScenario('late')
        break
      case 'crisis':
        scenario = generateGameScenario('crisis')
        break
      default:
        try {
          // Try to load custom scenario
          const customScenario = await import(`../scenarios/${scenarioName}`)
          scenario = customScenario.default || customScenario
        } catch {
          throw new Error(`Unknown scenario: ${scenarioName}`)
        }
    }
    
    // Apply scenario to stores
    useAppStore.setState(scenario.gameState)
    
    // Add storylets
    scenario.storylets.forEach((storylet: any) => {
      useStoryletStore.getState().addStorylet(storylet)
    })
    
    // Set flags
    if (scenario.gameState.flags) {
      Object.entries(scenario.gameState.flags).forEach(([key, value]) => {
        useStoryletStore.getState().setFlag(key, value as boolean)
      })
    }
    
    console.log(`✅ Scenario '${scenarioName}' loaded successfully`)
    console.log(`📊 Stats: Day ${scenario.gameState.day}, ${scenario.storylets.length} storylets`)
    
    return scenario
  },
  
  /**
   * Generate test data of specified type and count
   */
  generateTestData(type: string, count: number = 10) {
    console.log(`🔧 Generating ${count} ${type}...`)
    
    let data
    switch (type) {
      case 'characters':
        data = generateBatchTestData.characters(count)
        break
      case 'storylets':
        data = generateBatchTestData.storylets(count)
        break
      case 'npcs':
        data = generateBatchTestData.npcs(count)
        break
      case 'scenarios':
        const types: Array<'tutorial' | 'early' | 'mid' | 'late' | 'crisis'> = ['tutorial', 'early', 'mid', 'late', 'crisis']
        data = generateBatchTestData.scenarios(types.slice(0, count))
        break
      default:
        throw new Error(`Unknown data type: ${type}`)
    }
    
    console.log(`✅ Generated ${data.length} ${type}`)
    return data
  },
  
  /**
   * Validate current game state for consistency
   */
  validateGameState() {
    console.log('🔍 Validating game state...')
    
    const errors: string[] = []
    const warnings: string[] = []
    
    const appState = useAppStore.getState()
    const storyletState = useStoryletStore.getState()
    
    // Check basic app state
    if (!appState) {
      errors.push('App state is null or undefined')
      return { errors, warnings, isValid: false }
    }
    
    // Validate day
    if (typeof appState.day !== 'number' || appState.day < 1) {
      errors.push(`Invalid day value: ${appState.day}`)
    }
    
    // Validate resources
    if (appState.resources) {
      Object.entries(appState.resources).forEach(([key, value]) => {
        if (typeof value !== 'number') {
          errors.push(`Resource ${key} is not a number: ${value}`)
        }
        
        if (value < 0) {
          errors.push(`Negative resource: ${key} = ${value}`)
        }
        
        if ((key === 'energy' || key === 'stress') && value > 100) {
          warnings.push(`Resource ${key} over 100: ${value}`)
        }
        
        if (key === 'stress' && value > 80) {
          warnings.push(`High stress level: ${value}`)
        }
        
        if (key === 'energy' && value < 20) {
          warnings.push(`Low energy level: ${value}`)
        }
      })
    } else {
      errors.push('Resources object is missing')
    }
    
    // Validate storylet state
    if (storyletState) {
      // Check for orphaned active storylets
      if (storyletState.activeStoryletIds && storyletState.allStorylets) {
        storyletState.activeStoryletIds.forEach(id => {
          if (!storyletState.allStorylets[id]) {
            errors.push(`Orphaned active storylet: ${id}`)
          }
        })
      }
      
      // Check for duplicate storylets in active list
      if (storyletState.activeStoryletIds) {
        const duplicates = storyletState.activeStoryletIds.filter((id, index, arr) => 
          arr.indexOf(id) !== index
        )
        if (duplicates.length > 0) {
          errors.push(`Duplicate active storylets: ${duplicates.join(', ')}`)
        }
      }
      
      // Validate storylet structure
      if (storyletState.allStorylets) {
        Object.entries(storyletState.allStorylets).forEach(([id, storylet]) => {
          if (!storylet) {
            errors.push(`Null storylet in catalog: ${id}`)
            return
          }
          
          // Check required fields
          if (!storylet.name) {
            errors.push(`Storylet ${id} missing name`)
          }
          
          if (!storylet.choices || storylet.choices.length === 0) {
            errors.push(`Storylet ${id} has no choices`)
          }
          
          if (!storylet.trigger) {
            errors.push(`Storylet ${id} missing trigger`)
          }
          
          // Validate choices
          if (storylet.choices) {
            storylet.choices.forEach((choice, index) => {
              if (!choice.id) {
                errors.push(`Storylet ${id}, choice ${index} missing id`)
              }
              if (!choice.text) {
                warnings.push(`Storylet ${id}, choice ${choice.id} missing text`)
              }
            })
          }
        })
      }
      
      // Check cooldowns
      if (storyletState.storyletCooldowns && appState.day) {
        Object.entries(storyletState.storyletCooldowns).forEach(([id, cooldownDay]) => {
          if (typeof cooldownDay !== 'number') {
            errors.push(`Invalid cooldown for storylet ${id}: ${cooldownDay}`)
          }
          
          if (cooldownDay < appState.day! - 1000) {
            warnings.push(`Very old cooldown for storylet ${id}: day ${cooldownDay}`)
          }
        })
      }
    } else {
      errors.push('Storylet state is missing')
    }
    
    // Check for data consistency
    if (appState.activeCharacter) {
      if (!appState.activeCharacter.id) {
        errors.push('Active character missing ID')
      }
      if (!appState.activeCharacter.name) {
        errors.push('Active character missing name')
      }
    }
    
    const isValid = errors.length === 0
    
    console.log(`📋 Validation complete: ${isValid ? '✅ VALID' : '❌ INVALID'}`)
    console.log(`📊 Found ${errors.length} errors, ${warnings.length} warnings`)
    
    if (errors.length > 0) {
      console.log('❌ Errors:')
      errors.forEach(error => console.log(`  - ${error}`))
    }
    
    if (warnings.length > 0) {
      console.log('⚠️ Warnings:')
      warnings.forEach(warning => console.log(`  - ${warning}`))
    }
    
    return { errors, warnings, isValid }
  },
  
  /**
   * Reset all stores to clean state
   */
  resetAll() {
    console.log('🧹 Resetting all stores...')
    
    // Reset app store
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
    
    // Reset storylet store
    useStoryletStore.setState({
      allStorylets: {},
      activeFlags: {},
      activeStoryletIds: [],
      completedStoryletIds: [],
      storyletCooldowns: {}
    })
    
    // Clear localStorage
    localStorage.clear()
    
    console.log('✅ All stores reset to default state')
  },
  
  /**
   * Create a save point for testing
   */
  createSavePoint(name: string = `savepoint_${Date.now()}`) {
    console.log(`💾 Creating save point: ${name}`)
    
    const saveData = {
      timestamp: new Date().toISOString(),
      appState: useAppStore.getState(),
      storyletState: useStoryletStore.getState()
    }
    
    localStorage.setItem(`test_save_${name}`, JSON.stringify(saveData))
    
    console.log(`✅ Save point '${name}' created`)
    return name
  },
  
  /**
   * Load a save point
   */
  loadSavePoint(name: string) {
    console.log(`📂 Loading save point: ${name}`)
    
    const saveData = localStorage.getItem(`test_save_${name}`)
    if (!saveData) {
      throw new Error(`Save point '${name}' not found`)
    }
    
    try {
      const parsed = JSON.parse(saveData)
      
      if (parsed.appState) {
        useAppStore.setState(parsed.appState)
      }
      
      if (parsed.storyletState) {
        useStoryletStore.setState(parsed.storyletState)
      }
      
      console.log(`✅ Save point '${name}' loaded successfully`)
      console.log(`📅 Save date: ${parsed.timestamp}`)
      
      return parsed
    } catch (error) {
      throw new Error(`Failed to load save point '${name}': ${error}`)
    }
  },
  
  /**
   * List all available save points
   */
  listSavePoints() {
    const savePoints: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('test_save_')) {
        savePoints.push(key.replace('test_save_', ''))
      }
    }
    
    console.log(`💾 Found ${savePoints.length} save points:`)
    savePoints.forEach(name => console.log(`  - ${name}`))
    
    return savePoints
  },
  
  /**
   * Run performance benchmark
   */
  async benchmarkPerformance() {
    console.log('🏃 Running performance benchmark...')
    
    const results = {
      storyletAddition: 0,
      stateUpdates: 0,
      evaluation: 0,
      serialization: 0
    }
    
    // Benchmark storylet addition
    console.log('  Testing storylet addition...')
    const storylets = generateBatchTestData.storylets(100)
    
    let start = performance.now()
    storylets.forEach(storylet => {
      useStoryletStore.getState().addStorylet(storylet)
    })
    results.storyletAddition = performance.now() - start
    
    // Benchmark state updates
    console.log('  Testing state updates...')
    start = performance.now()
    for (let i = 0; i < 100; i++) {
      useAppStore.setState(state => ({
        day: (state.day || 1) + 1,
        resources: {
          ...state.resources,
          money: (state.resources?.money || 0) + 1
        }
      }))
    }
    results.stateUpdates = performance.now() - start
    
    // Benchmark evaluation
    console.log('  Testing storylet evaluation...')
    useStoryletStore.getState().setFlag('benchmark_flag', true)
    
    start = performance.now()
    useStoryletStore.getState().evaluateStorylets()
    results.evaluation = performance.now() - start
    
    // Benchmark serialization
    console.log('  Testing serialization...')
    start = performance.now()
    const serialized = JSON.stringify({
      app: useAppStore.getState(),
      storylet: useStoryletStore.getState()
    })
    results.serialization = performance.now() - start
    
    console.log('📊 Benchmark Results:')
    console.log(`  Storylet Addition (100): ${results.storyletAddition.toFixed(2)}ms`)
    console.log(`  State Updates (100): ${results.stateUpdates.toFixed(2)}ms`)
    console.log(`  Storylet Evaluation: ${results.evaluation.toFixed(2)}ms`)
    console.log(`  Serialization: ${results.serialization.toFixed(2)}ms`)
    console.log(`  Serialized Size: ${(serialized.length / 1024).toFixed(2)}KB`)
    
    return results
  }
}

// Export for use in tests and development
export default testCommands

// For browser console access in development
if (typeof window !== 'undefined') {
  (window as any).testCommands = testCommands
}