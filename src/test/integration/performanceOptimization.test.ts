// /Users/montysharma/v11m2/src/test/integration/performanceOptimization.test.ts
// Performance optimization tests and benchmarks for critical system components

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetAllStores, addStoryletsToTest, evaluateAndWait, waitForStoreUpdate, createTestStorylets } from '../utils/gameTestUtils';
import { useStoryletStore } from '../../stores/useStoryletStore';
import { useAppStore } from '../../stores/useAppStore';
import { useSocialStore } from '../../stores/v2/useSocialStore';
import type { Storylet } from '../../types/storylet';

describe('Performance Optimization Tests', () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe('Storylet Evaluation Performance', () => {
    it('should handle large numbers of storylets efficiently (OPTIMIZED)', async () => {
      const storyletStore = useStoryletStore.getState();
      
      // Create 100 test storylets with various conditions
      const largeStoryletSet: Record<string, Storylet> = {};
      
      for (let i = 0; i < 100; i++) {
        largeStoryletSet[`perf-storylet-${i}`] = {
          id: `perf-storylet-${i}`,
          title: `Performance Test Storylet ${i}`,
          description: `Test storylet ${i} for performance testing`,
          sections: [{
            id: 'section1',
            content: `Performance test content ${i}`,
            choices: [{
              id: 'choice1',
              text: 'Continue',
              effects: [{ type: 'flag', flag: `perf_flag_${i}`, value: true }]
            }]
          }],
          requirements: {
            flags: i % 10 === 0 ? { [`prereq_${Math.floor(i/10)}`]: true } : {},
            resources: i % 5 === 0 ? { energy: Math.min(50, i * 2) } : {}
          },
          effects: [],
          tags: ['performance', `group-${Math.floor(i/10)}`],
          frequency: i % 3 === 0 ? 'repeatable' : 'once',
          deployment: 'dev'
        };
      }

      // Add storylets with proper timing
      await addStoryletsToTest(largeStoryletSet);

      // Measure evaluation performance
      const startTime = performance.now();
      
      // Perform multiple evaluations to test sustained performance
      for (let iteration = 0; iteration < 5; iteration++) {
        await evaluateAndWait();
        
        // Simulate some game state changes between evaluations
        if (iteration % 2 === 0) {
          useAppStore.setState({ 
            resources: { 
              ...useAppStore.getState().resources, 
              energy: 75 + iteration * 5 
            } 
          });
        }
        
        if (iteration === 2) {
          // Set some prerequisite flags to activate more storylets
          storyletStore.setFlag('prereq_0', true);
          storyletStore.setFlag('prereq_1', true);
        }
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      console.log(`📊 Performance test completed in ${totalTime.toFixed(2)}ms`);
      console.log(`📈 Average time per evaluation: ${(totalTime / 5).toFixed(2)}ms`);
      console.log(`🎯 Active storylets: ${storyletStore.activeStoryletIds.length}`);
      
      // Performance expectations:
      // - Total time should be under 200ms for 100 storylets x 5 evaluations
      // - Memory usage should be reasonable
      // - System should remain responsive
      expect(totalTime).toBeLessThan(200);
      expect(storyletStore.activeStoryletIds.length).toBeGreaterThan(0);
    });

    it('should efficiently handle complex storylet conditions', async () => {
      const storyletStore = useStoryletStore.getState();
      
      // Create storylets with complex nested conditions
      const complexStorylets: Record<string, Storylet> = {};
      
      for (let i = 0; i < 25; i++) {
        complexStorylets[`complex-${i}`] = {
          id: `complex-${i}`,
          title: `Complex Storylet ${i}`,
          description: 'Complex condition testing',
          sections: [{
            id: 'section1',
            content: 'Complex content',
            choices: [{
              id: 'choice1',
              text: 'Choose',
              effects: []
            }]
          }],
          requirements: {
            flags: {
              [`flag_a_${i}`]: true,
              [`flag_b_${i}`]: i % 2 === 0,
              [`flag_c_${i}`]: i % 3 === 0
            },
            resources: {
              energy: 10 + i,
              stress: i * 2,
              money: i * 5,
              knowledge: 100 + i * 3
            },
            day: Math.max(1, i - 5)
          },
          effects: [],
          tags: ['complex'],
          frequency: 'once',
          deployment: 'dev'
        };
      }

      await addStoryletsToTest(complexStorylets);

      // Set up complex game state
      useAppStore.setState({
        day: 15,
        resources: {
          energy: 80,
          stress: 30,
          money: 200,
          knowledge: 150,
          social: 100
        }
      });

      // Set various flags to create different condition matches
      for (let i = 0; i < 25; i++) {
        if (i % 4 === 0) {
          storyletStore.setFlag(`flag_a_${i}`, true);
        }
        if (i % 6 === 0) {
          storyletStore.setFlag(`flag_b_${i}`, true);
        }
      }

      const startTime = performance.now();
      await evaluateAndWait();
      const endTime = performance.now();
      
      const evaluationTime = endTime - startTime;
      console.log(`🧮 Complex conditions evaluated in ${evaluationTime.toFixed(2)}ms`);
      
      // Should handle complex conditions efficiently
      expect(evaluationTime).toBeLessThan(50);
      expect(storyletStore.activeStoryletIds.length).toBeGreaterThan(0);
    });

    it('should optimize memory usage during evaluation cycles', async () => {
      const storyletStore = useStoryletStore.getState();
      
      // Measure initial memory usage (approximate)
      const initialStoryletCount = Object.keys(storyletStore.allStorylets).length;
      
      // Create and evaluate storylets in batches to test memory management
      for (let batch = 0; batch < 10; batch++) {
        const batchStorylets: Record<string, Storylet> = {};
        
        for (let i = 0; i < 20; i++) {
          const id = `memory-test-${batch}-${i}`;
          batchStorylets[id] = {
            id,
            title: `Memory Test ${batch}-${i}`,
            description: 'Memory optimization test',
            sections: [{
              id: 'section1',
              content: `Batch ${batch} Content ${i}`,
              choices: [{
                id: 'choice1',
                text: 'Continue',
                effects: [{ type: 'flag', flag: `batch_${batch}_${i}`, value: true }]
              }]
            }],
            requirements: { flags: {} },
            effects: [],
            tags: [`batch-${batch}`],
            frequency: 'once',
            deployment: 'dev'
          };
        }

        await addStoryletsToTest(batchStorylets);
        await evaluateAndWait();
        
        // Complete some storylets to test cleanup
        const activeIds = storyletStore.activeStoryletIds.slice(0, 5);
        for (const id of activeIds) {
          storyletStore.chooseStorylet(id, 'choice1');
        }
        
        await waitForStoreUpdate();
      }

      const finalStoryletCount = Object.keys(storyletStore.allStorylets).length;
      const completedCount = storyletStore.completedStoryletIds.length;
      
      console.log(`📦 Memory test: ${initialStoryletCount} → ${finalStoryletCount} storylets`);
      console.log(`✅ Completed storylets: ${completedCount}`);
      
      // Verify memory is being managed appropriately
      expect(finalStoryletCount).toBeGreaterThan(initialStoryletCount);
      expect(completedCount).toBeGreaterThan(0);
      expect(storyletStore.activeStoryletIds.length).toBeLessThan(finalStoryletCount); // Not all should be active
    });
  });

  describe('Store Performance Optimization', () => {
    it('should handle rapid store updates efficiently', async () => {
      const appStore = useAppStore.getState();
      const updates = [];
      
      const startTime = performance.now();
      
      // Perform 100 rapid resource updates
      for (let i = 0; i < 100; i++) {
        const updateStart = performance.now();
        
        useAppStore.setState({
          resources: {
            ...useAppStore.getState().resources,
            energy: Math.max(0, 100 - i),
            stress: Math.min(100, i),
            money: 50 + i * 2
          }
        });
        
        const updateEnd = performance.now();
        updates.push(updateEnd - updateStart);
        
        // Small delay to prevent overwhelming the system
        if (i % 10 === 0) {
          await waitForStoreUpdate();
        }
      }
      
      const totalTime = performance.now() - startTime;
      const averageUpdateTime = updates.reduce((a, b) => a + b, 0) / updates.length;
      const maxUpdateTime = Math.max(...updates);
      
      console.log(`⚡ 100 store updates completed in ${totalTime.toFixed(2)}ms`);
      console.log(`📊 Average update time: ${averageUpdateTime.toFixed(3)}ms`);
      console.log(`⏱️ Max update time: ${maxUpdateTime.toFixed(3)}ms`);
      
      // Performance expectations
      expect(totalTime).toBeLessThan(100); // Total should be under 100ms
      expect(averageUpdateTime).toBeLessThan(1); // Average should be under 1ms
      expect(maxUpdateTime).toBeLessThan(10); // No single update should take more than 10ms
    });

    it('should optimize cross-store synchronization', async () => {
      const socialStore = useSocialStore.getState();
      const appStore = useAppStore.getState();
      
      const startTime = performance.now();
      
      // Create many clues and test synchronization performance
      for (let i = 0; i < 50; i++) {
        const clue = {
          id: `sync-clue-${i}`,
          name: `Sync Test Clue ${i}`,
          description: `Synchronization test clue ${i}`,
          discoveryMethod: 'storylet' as const,
          content: `Sync content ${i}`,
          tags: ['sync', `group-${Math.floor(i/10)}`],
          importance: 'medium' as const
        };
        
        socialStore.discoverClue(clue);
        
        // Also update app store to test cross-store impacts
        if (i % 5 === 0) {
          useAppStore.setState({
            resources: {
              ...useAppStore.getState().resources,
              knowledge: useAppStore.getState().resources.knowledge + 1
            }
          });
        }
      }
      
      const syncTime = performance.now() - startTime;
      const clueCount = socialStore.getAllDiscoveredClues().length;
      
      console.log(`🔄 Cross-store sync completed in ${syncTime.toFixed(2)}ms`);
      console.log(`🔍 Total clues created: ${clueCount}`);
      
      expect(syncTime).toBeLessThan(100);
      expect(clueCount).toBe(50);
    });

    it('should handle concurrent store operations safely', async () => {
      const concurrentOperations = [];
      
      // Create multiple concurrent operations
      for (let i = 0; i < 20; i++) {
        const operation = async () => {
          const operationStart = performance.now();
          
          // Simulate various store operations
          useAppStore.setState({
            resources: {
              ...useAppStore.getState().resources,
              energy: Math.random() * 100
            }
          });
          
          await waitForStoreUpdate();
          
          const operationEnd = performance.now();
          return operationEnd - operationStart;
        };
        
        concurrentOperations.push(operation());
      }
      
      const startTime = performance.now();
      const results = await Promise.all(concurrentOperations);
      const totalTime = performance.now() - startTime;
      
      const averageTime = results.reduce((a, b) => a + b, 0) / results.length;
      const maxTime = Math.max(...results);
      
      console.log(`🚀 20 concurrent operations completed in ${totalTime.toFixed(2)}ms`);
      console.log(`📈 Average operation time: ${averageTime.toFixed(3)}ms`);
      console.log(`⏱️ Slowest operation: ${maxTime.toFixed(3)}ms`);
      
      // Concurrent operations should complete efficiently
      expect(totalTime).toBeLessThan(150);
      expect(averageTime).toBeLessThan(20);
      expect(results.every(time => time > 0)).toBe(true); // All should complete
    });
  });

  describe('Rendering and UI Performance', () => {
    it('should handle large storylet lists without performance degradation', async () => {
      const storyletStore = useStoryletStore.getState();
      
      // Create a large number of active storylets
      const largeActiveSet = createTestStorylets(100, {
        requirements: { flags: {} }, // Make them all available
        deployment: 'dev'
      });
      
      const storyletsObject: Record<string, Storylet> = {};
      largeActiveSet.forEach(storylet => {
        storyletsObject[storylet.id] = storylet;
      });
      
      await addStoryletsToTest(storyletsObject);
      await evaluateAndWait();
      
      const startTime = performance.now();
      
      // Simulate rendering operations (getting storylet data for UI)
      const renderOperations = [];
      
      for (let i = 0; i < 10; i++) {
        const renderStart = performance.now();
        
        // Simulate what a UI component would do
        const activeStorylets = storyletStore.activeStoryletIds.map(id => 
          storyletStore.allStorylets[id]
        ).filter(Boolean);
        
        const filteredStorylets = activeStorylets.filter(storylet => 
          storylet.tags?.includes('test')
        );
        
        const sortedStorylets = filteredStorylets.sort((a, b) => 
          a.title.localeCompare(b.title)
        );
        
        const renderEnd = performance.now();
        renderOperations.push(renderEnd - renderStart);
        
        // Small delay between render operations
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      const totalRenderTime = performance.now() - startTime;
      const averageRenderTime = renderOperations.reduce((a, b) => a + b, 0) / renderOperations.length;
      
      console.log(`🎨 Rendering simulation completed in ${totalRenderTime.toFixed(2)}ms`);
      console.log(`📊 Average render operation: ${averageRenderTime.toFixed(3)}ms`);
      console.log(`📋 Active storylets rendered: ${storyletStore.activeStoryletIds.length}`);
      
      // Rendering should be fast even with many storylets
      expect(averageRenderTime).toBeLessThan(5);
      expect(totalRenderTime).toBeLessThan(100);
    });

    it('should optimize search and filtering operations', async () => {
      const storyletStore = useStoryletStore.getState();
      
      // Create storylets with various searchable properties
      const searchableStorylets: Record<string, Storylet> = {};
      const searchTerms = ['academic', 'social', 'mystery', 'adventure', 'romance'];
      
      for (let i = 0; i < 200; i++) {
        const term = searchTerms[i % searchTerms.length];
        searchableStorylets[`search-${i}`] = {
          id: `search-${i}`,
          title: `${term} storylet ${i}`,
          description: `A ${term} themed storylet for search testing`,
          sections: [{
            id: 'section1',
            content: `${term} content here`,
            choices: [{ id: 'choice1', text: 'Continue', effects: [] }]
          }],
          requirements: { flags: {} },
          effects: [],
          tags: [term, `category-${Math.floor(i/20)}`],
          frequency: 'once',
          deployment: 'dev'
        };
      }
      
      await addStoryletsToTest(searchableStorylets);
      
      const searchTests = [
        { term: 'academic', expectedMin: 30 },
        { term: 'mystery', expectedMin: 30 },
        { term: 'category-5', expectedMin: 15 },
        { term: 'nonexistent', expectedMin: 0 }
      ];
      
      const searchResults = [];
      
      for (const test of searchTests) {
        const searchStart = performance.now();
        
        // Simulate search operation
        const results = Object.values(storyletStore.allStorylets).filter(storylet => 
          storylet.title.toLowerCase().includes(test.term.toLowerCase()) ||
          storylet.description.toLowerCase().includes(test.term.toLowerCase()) ||
          storylet.tags?.some(tag => tag.toLowerCase().includes(test.term.toLowerCase()))
        );
        
        const searchEnd = performance.now();
        const searchTime = searchEnd - searchStart;
        
        searchResults.push({
          term: test.term,
          results: results.length,
          time: searchTime
        });
        
        console.log(`🔍 Search "${test.term}": ${results.length} results in ${searchTime.toFixed(3)}ms`);
        
        expect(results.length).toBeGreaterThanOrEqual(test.expectedMin);
        expect(searchTime).toBeLessThan(10); // Each search should be under 10ms
      }
      
      const totalSearchTime = searchResults.reduce((sum, result) => sum + result.time, 0);
      console.log(`🎯 All searches completed in ${totalSearchTime.toFixed(2)}ms`);
      
      expect(totalSearchTime).toBeLessThan(25); // All searches combined should be under 25ms
    });
  });

  describe('Memory Management and Cleanup', () => {
    it('should properly clean up completed storylets and prevent memory leaks', async () => {
      const storyletStore = useStoryletStore.getState();
      
      const initialMemoryFootprint = {
        allStorylets: Object.keys(storyletStore.allStorylets).length,
        activeStorylets: storyletStore.activeStoryletIds.length,
        completedStorylets: storyletStore.completedStoryletIds.length
      };
      
      // Create, activate, and complete many storylets
      for (let batch = 0; batch < 5; batch++) {
        const batchStorylets = createTestStorylets(20, {
          id: `cleanup-batch-${batch}`,
          requirements: { flags: {} },
          deployment: 'dev'
        });
        
        const batchObject: Record<string, Storylet> = {};
        batchStorylets.forEach(storylet => {
          batchObject[storylet.id] = storylet;
        });
        
        await addStoryletsToTest(batchObject);
        await evaluateAndWait();
        
        // Complete all active storylets from this batch
        const activeIds = storyletStore.activeStoryletIds.filter(id => 
          id.includes(`cleanup-batch-${batch}`)
        );
        
        for (const id of activeIds) {
          storyletStore.chooseStorylet(id, 'choice1');
        }
        
        await waitForStoreUpdate();
      }
      
      const finalMemoryFootprint = {
        allStorylets: Object.keys(storyletStore.allStorylets).length,
        activeStorylets: storyletStore.activeStoryletIds.length,
        completedStorylets: storyletStore.completedStoryletIds.length
      };
      
      console.log(`🧹 Memory cleanup test results:`);
      console.log(`📚 Total storylets: ${initialMemoryFootprint.allStorylets} → ${finalMemoryFootprint.allStorylets}`);
      console.log(`⚡ Active storylets: ${initialMemoryFootprint.activeStorylets} → ${finalMemoryFootprint.activeStorylets}`);
      console.log(`✅ Completed storylets: ${initialMemoryFootprint.completedStorylets} → ${finalMemoryFootprint.completedStorylets}`);
      
      // Verify memory management
      expect(finalMemoryFootprint.completedStorylets).toBeGreaterThan(initialMemoryFootprint.completedStorylets);
      expect(finalMemoryFootprint.allStorylets).toBeGreaterThan(initialMemoryFootprint.allStorylets);
      
      // Active storylets should be manageable
      expect(finalMemoryFootprint.activeStorylets).toBeLessThan(50);
    });

    it('should handle garbage collection efficiently during intensive operations', async () => {
      const intensiveOperations = async () => {
        // Create temporary objects that should be garbage collected
        const tempObjects = [];
        
        for (let i = 0; i < 1000; i++) {
          tempObjects.push({
            id: `temp-${i}`,
            data: 'temporary data '.repeat(100),
            timestamp: Date.now()
          });
        }
        
        // Process the objects
        const processed = tempObjects.map(obj => ({
          id: obj.id,
          hash: obj.data.length,
          age: Date.now() - obj.timestamp
        }));
        
        return processed.length;
      };
      
      const startTime = performance.now();
      
      // Run intensive operations multiple times
      const results = [];
      for (let i = 0; i < 10; i++) {
        const result = await intensiveOperations();
        results.push(result);
        
        // Force garbage collection opportunity
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      console.log(`♻️ Garbage collection test completed in ${totalTime.toFixed(2)}ms`);
      console.log(`🔄 Operations completed: ${results.length}`);
      console.log(`📊 Average operation size: ${results[0]} objects`);
      
      expect(totalTime).toBeLessThan(500);
      expect(results.every(r => r === 1000)).toBe(true);
    });
  });

  describe('Real-World Performance Scenarios', () => {
    it('should handle end-game performance with accumulated data', async () => {
      const storyletStore = useStoryletStore.getState();
      const socialStore = useSocialStore.getState();
      
      // Simulate end-game state with lots of accumulated data
      
      // Add many completed storylets
      for (let i = 0; i < 150; i++) {
        storyletStore.completeStorylet(`end-game-storylet-${i}`);
      }
      
      // Add many flags
      for (let i = 0; i < 100; i++) {
        storyletStore.setFlag(`end_game_flag_${i}`, true);
      }
      
      // Add many discovered clues
      for (let i = 0; i < 75; i++) {
        socialStore.discoverClue({
          id: `end-game-clue-${i}`,
          name: `End Game Clue ${i}`,
          description: 'End game content',
          discoveryMethod: 'storylet',
          content: 'End game clue content',
          tags: ['endgame'],
          importance: 'medium'
        });
      }
      
      // Set advanced game state
      useAppStore.setState({
        day: 120,
        resources: {
          energy: 85,
          stress: 45,
          money: 2500,
          knowledge: 800,
          social: 600
        }
      });
      
      // Test performance with this loaded state
      const performanceTests = [];
      
      // Test storylet evaluation
      const evalStart = performance.now();
      await evaluateAndWait();
      const evalTime = performance.now() - evalStart;
      performanceTests.push({ operation: 'storylet_evaluation', time: evalTime });
      
      // Test clue operations
      const clueStart = performance.now();
      const allClues = socialStore.getAllDiscoveredClues();
      const filteredClues = allClues.filter(clue => clue.importance === 'medium');
      const clueTime = performance.now() - clueStart;
      performanceTests.push({ operation: 'clue_operations', time: clueTime });
      
      // Test state serialization (like save game)
      const serializeStart = performance.now();
      const gameState = {
        app: useAppStore.getState(),
        storylets: useStoryletStore.getState(),
        social: useSocialStore.getState()
      };
      const serialized = JSON.stringify(gameState);
      const serializeTime = performance.now() - serializeStart;
      performanceTests.push({ operation: 'state_serialization', time: serializeTime });
      
      console.log(`🎮 End-game performance test results:`);
      for (const test of performanceTests) {
        console.log(`  ${test.operation}: ${test.time.toFixed(2)}ms`);
      }
      console.log(`💾 Serialized state size: ${(serialized.length / 1024).toFixed(2)}KB`);
      
      // All operations should still be performant with accumulated data
      expect(evalTime).toBeLessThan(75);
      expect(clueTime).toBeLessThan(25);
      expect(serializeTime).toBeLessThan(100);
      expect(allClues.length).toBe(75);
    });
  });
});