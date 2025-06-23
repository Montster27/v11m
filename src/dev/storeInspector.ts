// /Users/montysharma/V11M2/src/dev/storeInspector.ts
// Store Inspection Utilities - Advanced debugging and visualization tools for consolidated stores

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';

export interface StoreStructureVisualization {
  stores: {
    [key: string]: {
      state: any;
      dependencies: string[];
      dataFlow: string[];
      size: number;
      complexity: number;
    };
  };
  relationships: {
    source: string;
    target: string;
    type: 'reference' | 'dependency' | 'cross-validation';
    description: string;
  }[];
  metrics: {
    totalStores: number;
    totalComplexity: number;
    crossReferences: number;
    memoryFootprint: string;
  };
}

export interface StateHistoryEntry {
  timestamp: number;
  action: string;
  store: 'core' | 'narrative' | 'social';
  beforeState: any;
  afterState: any;
  diff: any;
}

export interface StoreIntegrityReport {
  passed: boolean;
  errors: string[];
  warnings: string[];
  crossStoreValidations: {
    [key: string]: boolean;
  };
  performanceMetrics: {
    operationTimes: Record<string, number>;
    memoryUsage: Record<string, number>;
  };
}

// Global state history for time-travel debugging
let stateHistory: StateHistoryEntry[] = [];
let maxHistorySize = 100; // Keep last 100 state changes

// Store Inspector Implementation
export const createStoreInspector = () => {
  
  const getStoreSize = (state: any): number => {
    return JSON.stringify(state).length;
  };
  
  const calculateComplexity = (state: any): number => {
    const countProperties = (obj: any, depth = 0): number => {
      if (depth > 10 || obj === null || typeof obj !== 'object') return 1;
      
      if (Array.isArray(obj)) {
        return obj.reduce((sum, item) => sum + countProperties(item, depth + 1), 1);
      }
      
      if (obj instanceof Map) {
        return Array.from(obj.entries()).reduce((sum, [_, value]) => 
          sum + countProperties(value, depth + 1), 1);
      }
      
      return Object.values(obj).reduce((sum, value) => 
        sum + countProperties(value, depth + 1), 1);
    };
    
    return countProperties(state);
  };
  
  const analyzeDataFlow = (storeName: string): string[] => {
    const flows: Record<string, string[]> = {
      core: [
        'Player progression → Character development',
        'Skills advancement → World state changes',
        'Resource management → Story progression'
      ],
      narrative: [
        'Character data → Concern evaluation',
        'Storylet completion → Flag updates',
        'Arc progression → Cross-store references'
      ],
      social: [
        'NPC relationships → Storylet availability',
        'Clue discovery → Arc advancement',
        'Save system → State persistence'
      ]
    };
    
    return flows[storeName] || [];
  };
  
  const identifyDependencies = (storeName: string): string[] => {
    const deps: Record<string, string[]> = {
      core: [], // Core store is independent
      narrative: ['core'], // Narrative depends on character data
      social: ['core', 'narrative'] // Social depends on both
    };
    
    return deps[storeName] || [];
  };
  
  const visualizeStoreStructure = (): StoreStructureVisualization => {
    console.log('🔍 Generating store structure visualization...');
    
    const coreState = useCoreGameStore.getState();
    const narrativeState = useNarrativeStore.getState();
    const socialState = useSocialStore.getState();
    
    const stores = {
      core: {
        state: {
          player: coreState.player,
          character: coreState.character,
          skills: {
            totalExperience: coreState.skills.totalExperience,
            competencyCount: Object.keys(coreState.skills.coreCompetencies).length,
            classCount: Object.keys(coreState.skills.characterClasses).length
          },
          world: coreState.world
        },
        dependencies: identifyDependencies('core'),
        dataFlow: analyzeDataFlow('core'),
        size: getStoreSize(coreState),
        complexity: calculateComplexity(coreState)
      },
      narrative: {
        state: {
          storylets: {
            activeCount: narrativeState.storylets.active.length,
            completedCount: narrativeState.storylets.completed.length,
            userCreatedCount: narrativeState.storylets.userCreated.length
          },
          flags: {
            storyletFlags: narrativeState.flags.storylet.size,
            storyletFlagCount: narrativeState.flags.storyletFlag.size,
            concernFlags: narrativeState.flags.concerns.size,
            arcFlags: narrativeState.flags.storyArc.size
          },
          storyArcs: {
            progressCount: Object.keys(narrativeState.storyArcs.progress).length,
            metadataCount: Object.keys(narrativeState.storyArcs.metadata).length
          },
          concerns: narrativeState.concerns
        },
        dependencies: identifyDependencies('narrative'),
        dataFlow: analyzeDataFlow('narrative'),
        size: getStoreSize(narrativeState),
        complexity: calculateComplexity(narrativeState)
      },
      social: {
        state: {
          npcs: {
            relationshipCount: Object.keys(socialState.npcs.relationships).length,
            memoryCount: Object.keys(socialState.npcs.memories).length,
            flagCount: Object.keys(socialState.npcs.flags).length
          },
          clues: {
            discoveredCount: socialState.clues.discovered.length,
            connectionCount: Object.keys(socialState.clues.connections).length,
            arcAssociations: Object.keys(socialState.clues.storyArcs).length
          },
          saves: {
            currentSave: socialState.saves.currentSaveId,
            slotCount: Object.keys(socialState.saves.saveSlots).length,
            historyLength: socialState.saves.saveHistory.length
          }
        },
        dependencies: identifyDependencies('social'),
        dataFlow: analyzeDataFlow('social'),
        size: getStoreSize(socialState),
        complexity: calculateComplexity(socialState)
      }
    };
    
    const relationships = [
      {
        source: 'core',
        target: 'narrative',
        type: 'reference' as const,
        description: 'Character background influences narrative concerns'
      },
      {
        source: 'core',
        target: 'narrative',
        type: 'dependency' as const,
        description: 'Player level affects storylet availability'
      },
      {
        source: 'narrative',
        target: 'social',
        type: 'reference' as const,
        description: 'Storylets reference NPCs in social store'
      },
      {
        source: 'core',
        target: 'social',
        type: 'cross-validation' as const,
        description: 'Character skills validate clue discovery capabilities'
      },
      {
        source: 'social',
        target: 'narrative',
        type: 'cross-validation' as const,
        description: 'NPC relationships affect storylet evaluation'
      }
    ];
    
    const totalSize = stores.core.size + stores.narrative.size + stores.social.size;
    const totalComplexity = stores.core.complexity + stores.narrative.complexity + stores.social.complexity;
    
    const visualization: StoreStructureVisualization = {
      stores,
      relationships,
      metrics: {
        totalStores: 3,
        totalComplexity,
        crossReferences: relationships.length,
        memoryFootprint: `${(totalSize / 1024).toFixed(2)}KB`
      }
    };
    
    console.log('📊 Store Structure Analysis:', {
      stores: Object.keys(stores).length,
      relationships: relationships.length,
      memoryFootprint: visualization.metrics.memoryFootprint,
      averageComplexity: Math.round(totalComplexity / 3)
    });
    
    return visualization;
  };
  
  const recordStateChange = (action: string, store: 'core' | 'narrative' | 'social', beforeState: any, afterState: any) => {
    const diff = calculateStateDiff(beforeState, afterState);
    
    const entry: StateHistoryEntry = {
      timestamp: Date.now(),
      action,
      store,
      beforeState: JSON.parse(JSON.stringify(beforeState)),
      afterState: JSON.parse(JSON.stringify(afterState)),
      diff
    };
    
    stateHistory.push(entry);
    
    // Maintain history size limit
    if (stateHistory.length > maxHistorySize) {
      stateHistory = stateHistory.slice(-maxHistorySize);
    }
    
    console.log(`📝 State change recorded: ${action} in ${store} store`);
  };
  
  const calculateStateDiff = (before: any, after: any): any => {
    const diff: any = {};
    
    const findDifferences = (beforeObj: any, afterObj: any, path = '') => {
      if (beforeObj === afterObj) return;
      
      if (typeof beforeObj !== typeof afterObj) {
        diff[path || 'root'] = { before: beforeObj, after: afterObj };
        return;
      }
      
      if (typeof beforeObj !== 'object' || beforeObj === null) {
        if (beforeObj !== afterObj) {
          diff[path || 'root'] = { before: beforeObj, after: afterObj };
        }
        return;
      }
      
      // Handle arrays
      if (Array.isArray(beforeObj) && Array.isArray(afterObj)) {
        if (beforeObj.length !== afterObj.length) {
          diff[`${path}.length`] = { before: beforeObj.length, after: afterObj.length };
        }
        return;
      }
      
      // Handle objects
      const allKeys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
      allKeys.forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        findDifferences(beforeObj[key], afterObj[key], newPath);
      });
    };
    
    findDifferences(before, after);
    return diff;
  };
  
  const trackStateHistory = () => {
    console.log('🕰️ Initializing state history tracking...');
    
    // Wrap store methods to track changes
    const originalCoreReset = useCoreGameStore.getState().resetGame;
    const originalNarrativeReset = useNarrativeStore.getState().resetNarrative;
    const originalSocialReset = useSocialStore.getState().resetSocial;
    
    // Enhanced reset tracking
    useCoreGameStore.setState({
      resetGame: () => {
        const before = useCoreGameStore.getState();
        originalCoreReset();
        const after = useCoreGameStore.getState();
        recordStateChange('resetGame', 'core', before, after);
      }
    });
    
    console.log('✅ State history tracking enabled');
    
    return {
      getHistory: () => stateHistory,
      getHistoryForStore: (store: 'core' | 'narrative' | 'social') => 
        stateHistory.filter(entry => entry.store === store),
      getRecentChanges: (count = 10) => stateHistory.slice(-count),
      clearHistory: () => { stateHistory = []; },
      setMaxHistorySize: (size: number) => { maxHistorySize = size; },
      timeTravelTo: (timestamp: number) => {
        const entry = stateHistory.find(e => e.timestamp === timestamp);
        if (entry) {
          console.log(`🕰️ Time traveling to ${new Date(timestamp).toISOString()}`);
          // Restore state (this would need careful implementation)
          return entry.beforeState;
        }
        return null;
      }
    };
  };
  
  const validateStoreIntegrity = (): StoreIntegrityReport => {
    console.log('🔍 Validating store integrity...');
    
    const startTime = performance.now();
    const report: StoreIntegrityReport = {
      passed: true,
      errors: [],
      warnings: [],
      crossStoreValidations: {},
      performanceMetrics: {
        operationTimes: {},
        memoryUsage: {}
      }
    };
    
    try {
      // Memory usage measurements
      const coreState = useCoreGameStore.getState();
      const narrativeState = useNarrativeStore.getState();
      const socialState = useSocialStore.getState();
      
      report.performanceMetrics.memoryUsage = {
        core: getStoreSize(coreState),
        narrative: getStoreSize(narrativeState),
        social: getStoreSize(socialState)
      };
      
      // Cross-store validation 1: Character-Narrative consistency
      const characterNarrativeValid = coreState.character.name ? 
        Object.keys(narrativeState.concerns.current).length > 0 : true;
      report.crossStoreValidations.characterNarrative = characterNarrativeValid;
      
      if (!characterNarrativeValid) {
        report.errors.push('Character exists but has no narrative concerns');
        report.passed = false;
      }
      
      // Cross-store validation 2: Storylet-NPC references
      const storyletNPCValid = narrativeState.storylets.active.every(storyletId => {
        // Check if storylet references NPCs that exist
        const referencesNPC = storyletId.includes('_npc_') || 
                             storyletId.includes('lord_') || 
                             storyletId.includes('lady_');
        
        if (referencesNPC) {
          const npcName = storyletId.split('_').find(part => 
            part in socialState.npcs.relationships
          );
          return npcName || false;
        }
        return true;
      });
      report.crossStoreValidations.storyletNPC = storyletNPCValid;
      
      if (!storyletNPCValid) {
        report.warnings.push('Some storylets reference non-existent NPCs');
      }
      
      // Cross-store validation 3: Save state consistency
      const saveStateValid = socialState.saves.currentSaveId ? 
        socialState.saves.saveSlots[socialState.saves.currentSaveId] !== undefined : true;
      report.crossStoreValidations.saveState = saveStateValid;
      
      if (!saveStateValid) {
        report.errors.push('Current save ID references non-existent save slot');
        report.passed = false;
      }
      
      // Performance validation
      const endTime = performance.now();
      report.performanceMetrics.operationTimes.validation = endTime - startTime;
      
      if (report.performanceMetrics.operationTimes.validation > 100) {
        report.warnings.push('Store validation took longer than expected (>100ms)');
      }
      
      // Memory footprint validation
      const totalMemory = Object.values(report.performanceMetrics.memoryUsage).reduce((a, b) => a + b, 0);
      if (totalMemory > 1024 * 1024) { // 1MB warning threshold
        report.warnings.push(`Large memory footprint: ${(totalMemory / 1024 / 1024).toFixed(2)}MB`);
      }
      
      console.log('✅ Store integrity validation completed:', {
        passed: report.passed,
        errors: report.errors.length,
        warnings: report.warnings.length,
        validationTime: `${report.performanceMetrics.operationTimes.validation?.toFixed(2)}ms`
      });
      
    } catch (error) {
      report.passed = false;
      report.errors.push(`Validation error: ${error}`);
      console.error('❌ Store integrity validation failed:', error);
    }
    
    return report;
  };
  
  const generateStoreReport = () => {
    console.log('📋 Generating comprehensive store report...');
    
    const structure = visualizeStoreStructure();
    const integrity = validateStoreIntegrity();
    const history = trackStateHistory();
    
    const report = {
      timestamp: new Date().toISOString(),
      structure,
      integrity,
      historySize: history.getHistory().length,
      summary: {
        totalStores: structure.metrics.totalStores,
        memoryFootprint: structure.metrics.memoryFootprint,
        crossReferences: structure.metrics.crossReferences,
        integrityPassed: integrity.passed,
        errorCount: integrity.errors.length,
        warningCount: integrity.warnings.length
      },
      recommendations: generateRecommendations(structure, integrity)
    };
    
    console.log('📊 Store Report Summary:', report.summary);
    return report;
  };
  
  const generateRecommendations = (structure: StoreStructureVisualization, integrity: StoreIntegrityReport): string[] => {
    const recommendations: string[] = [];
    
    // Memory optimization recommendations
    const totalSize = Object.values(structure.stores).reduce((sum, store) => sum + store.size, 0);
    if (totalSize > 512 * 1024) { // 512KB threshold
      recommendations.push('Consider implementing data pagination for large datasets');
    }
    
    // Complexity recommendations
    const avgComplexity = structure.metrics.totalComplexity / structure.metrics.totalStores;
    if (avgComplexity > 100) {
      recommendations.push('Some stores have high complexity - consider further domain separation');
    }
    
    // Integrity recommendations
    if (integrity.errors.length > 0) {
      recommendations.push('Fix store integrity errors before production deployment');
    }
    
    if (integrity.warnings.length > 2) {
      recommendations.push('Review store warnings for potential optimization opportunities');
    }
    
    // Performance recommendations
    const validationTime = integrity.performanceMetrics.operationTimes.validation || 0;
    if (validationTime > 50) {
      recommendations.push('Store validation is slow - consider optimizing cross-store checks');
    }
    
    return recommendations;
  };
  
  return {
    visualizeStoreStructure,
    trackStateHistory,
    validateStoreIntegrity,
    generateStoreReport,
    recordStateChange,
    
    // Utility methods
    getStoreMetrics: () => ({
      core: {
        size: getStoreSize(useCoreGameStore.getState()),
        complexity: calculateComplexity(useCoreGameStore.getState())
      },
      narrative: {
        size: getStoreSize(useNarrativeStore.getState()),
        complexity: calculateComplexity(useNarrativeStore.getState())
      },
      social: {
        size: getStoreSize(useSocialStore.getState()),
        complexity: calculateComplexity(useSocialStore.getState())
      }
    }),
    
    exportStateSnapshot: () => ({
      timestamp: Date.now(),
      core: useCoreGameStore.getState(),
      narrative: useNarrativeStore.getState(),
      social: useSocialStore.getState()
    }),
    
    compareStates: (snapshot1: any, snapshot2: any) => ({
      core: calculateStateDiff(snapshot1.core, snapshot2.core),
      narrative: calculateStateDiff(snapshot1.narrative, snapshot2.narrative),
      social: calculateStateDiff(snapshot1.social, snapshot2.social)
    })
  };
};

// Global store inspector instance
export const storeInspector = createStoreInspector();

// Global functions for browser console access
if (typeof window !== 'undefined') {
  (window as any).storeInspector = storeInspector;
  (window as any).visualizeStores = storeInspector.visualizeStoreStructure;
  (window as any).validateStores = storeInspector.validateStoreIntegrity;
  (window as any).generateStoreReport = storeInspector.generateStoreReport;
  (window as any).getStoreMetrics = storeInspector.getStoreMetrics;
  
  console.log('🔍 Store Inspector loaded');
  console.log('   visualizeStores() - Analyze store structure and relationships');
  console.log('   validateStores() - Check store integrity and performance');
  console.log('   generateStoreReport() - Complete store analysis');
  console.log('   getStoreMetrics() - Quick store size and complexity metrics');
}