// /Users/montysharma/v11m2/src/test/stores/useClueStoreV2.test.ts
// Test suite for ClueStoreV2 with UnifiedPersistenceService integration

import { renderHook, act } from '@testing-library/react';
import { useClueStoreV2 } from '../../stores/useClueStoreV2';
import { usePersistenceActions, destroyGlobalPersistenceService } from '../../stores/middleware/unifiedPersistenceMiddleware';
import type { ClueFormData } from '../../types/clue';

describe('ClueStoreV2 with UnifiedPersistence', () => {
  const sampleClueData: ClueFormData = {
    title: 'Test Clue',
    description: 'A test clue for testing',
    content: 'This is test content',
    category: 'academic',
    difficulty: 'easy',
    minigameTypes: ['word-association'],
    associatedStorylets: ['test-storylet'],
    tags: ['test'],
    rarity: 'common'
  };

  beforeEach(async () => {
    // Reset store state
    const { result } = renderHook(() => useClueStoreV2());
    await act(async () => {
      await result.current.reset();
    });
  });

  afterEach(() => {
    // Cleanup persistence service
    destroyGlobalPersistenceService();
  });

  describe('Basic Functionality', () => {
    test('should create and retrieve clues', () => {
      const { result } = renderHook(() => useClueStoreV2());

      act(() => {
        result.current.createClue(sampleClueData);
      });

      const clues = result.current.clues;
      expect(clues).toHaveLength(1);
      expect(clues[0].title).toBe('Test Clue');
      expect(clues[0].isDiscovered).toBe(false);
    });

    test('should update clue properties', () => {
      const { result } = renderHook(() => useClueStoreV2());

      let clueId: string;
      act(() => {
        const clue = result.current.createClue(sampleClueData);
        clueId = clue.id;
      });

      act(() => {
        result.current.updateClue(clueId, {
          title: 'Updated Test Clue',
          difficulty: 'hard'
        });
      });

      const updatedClue = result.current.getClueById(clueId);
      expect(updatedClue?.title).toBe('Updated Test Clue');
      expect(updatedClue?.difficulty).toBe('hard');
    });

    test('should delete clues with pre-action backup', async () => {
      const { result } = renderHook(() => useClueStoreV2());

      let clueId: string;
      act(() => {
        const clue = result.current.createClue(sampleClueData);
        clueId = clue.id;
      });

      expect(result.current.clues).toHaveLength(1);

      await act(async () => {
        await result.current.deleteClue(clueId);
      });

      expect(result.current.clues).toHaveLength(0);
      expect(result.current.getClueById(clueId)).toBeNull();
    });
  });

  describe('Discovery System', () => {
    test('should discover clues and track events', () => {
      const { result } = renderHook(() => useClueStoreV2());

      let clueId: string;
      act(() => {
        const clue = result.current.createClue(sampleClueData);
        clueId = clue.id;
      });

      const discoveryContext = {
        storyletId: 'test-storylet',
        minigameType: 'word-association',
        characterId: 'test-character',
        dayNumber: 1,
        gameState: { test: true }
      };

      act(() => {
        result.current.discoverClue(clueId, discoveryContext);
      });

      const clue = result.current.getClueById(clueId);
      expect(clue?.isDiscovered).toBe(true);
      expect(clue?.discoveredBy).toBe('test-character');
      expect(result.current.discoveredClues).toContain(clueId);
      expect(result.current.discoveryEvents).toHaveLength(1);
    });

    test('should calculate discovery statistics', () => {
      const { result } = renderHook(() => useClueStoreV2());

      // Create multiple clues
      let clueIds: string[] = [];
      act(() => {
        for (let i = 0; i < 5; i++) {
          const clue = result.current.createClue({
            ...sampleClueData,
            title: `Test Clue ${i}`
          });
          clueIds.push(clue.id);
        }
      });

      // Discover some clues
      act(() => {
        result.current.discoverClue(clueIds[0], {
          storyletId: 'test-storylet',
          minigameType: 'word-association',
          characterId: 'test-character',
          dayNumber: 1,
          gameState: {}
        });
        result.current.discoverClue(clueIds[1], {
          storyletId: 'test-storylet',
          minigameType: 'word-association',
          characterId: 'test-character',
          dayNumber: 1,
          gameState: {}
        });
      });

      const stats = result.current.getDiscoveryStats();
      expect(stats.totalClues).toBe(5);
      expect(stats.discoveredClues).toBe(2);
      expect(stats.discoveryRate).toBe(40);
    });
  });

  describe('Story Arc Management', () => {
    test('should create and manage story arcs', () => {
      const { result } = renderHook(() => useClueStoreV2());

      act(() => {
        result.current.createStoryArc('Test Arc', 'A test story arc', 'academic');
      });

      const arcs = result.current.getAllStoryArcs();
      expect(arcs).toHaveLength(1);
      expect(arcs[0].name).toBe('Test Arc');
      expect(arcs[0].category).toBe('academic');
    });

    test('should update story arc progress when clues are discovered', () => {
      const { result } = renderHook(() => useClueStoreV2());

      // Create story arc
      let arcId: string;
      act(() => {
        const arc = result.current.createStoryArc('Test Arc', 'Test description', 'academic');
        arcId = arc.id;
      });

      // Create clues in the arc
      let clueIds: string[] = [];
      act(() => {
        for (let i = 0; i < 3; i++) {
          const clue = result.current.createClue({
            ...sampleClueData,
            title: `Arc Clue ${i}`,
            storyArc: arcId,
            arcOrder: i
          });
          clueIds.push(clue.id);
        }
      });

      // Discover all clues
      act(() => {
        clueIds.forEach(clueId => {
          result.current.discoverClue(clueId, {
            storyletId: 'test-storylet',
            minigameType: 'word-association',
            characterId: 'test-character',
            dayNumber: 1,
            gameState: {}
          });
        });
      });

      const arc = result.current.getStoryArcById(arcId);
      expect(arc?.totalClues).toBe(3);
      expect(arc?.discoveredClues).toBe(3);
      expect(arc?.isCompleted).toBe(true);
      expect(arc?.completedAt).toBeDefined();
    });

    test('should delete story arc with pre-action backup', async () => {
      const { result } = renderHook(() => useClueStoreV2());

      let arcId: string;
      act(() => {
        const arc = result.current.createStoryArc('Test Arc', 'Test description', 'academic');
        arcId = arc.id;
      });

      // Create clue in the arc
      act(() => {
        result.current.createClue({
          ...sampleClueData,
          storyArc: arcId
        });
      });

      expect(result.current.getAllStoryArcs()).toHaveLength(1);

      await act(async () => {
        await result.current.deleteStoryArc(arcId);
      });

      expect(result.current.getAllStoryArcs()).toHaveLength(0);
      
      // Clue should have arc reference removed
      const clue = result.current.clues[0];
      expect(clue?.storyArc).toBeUndefined();
    });
  });

  describe('V2 Enhanced Features', () => {
    test('should perform bulk operations with backups', async () => {
      const { result } = renderHook(() => useClueStoreV2());

      const bulkClueData: ClueFormData[] = [
        { ...sampleClueData, title: 'Bulk Clue 1' },
        { ...sampleClueData, title: 'Bulk Clue 2' },
        { ...sampleClueData, title: 'Bulk Clue 3' }
      ];

      await act(async () => {
        await result.current.bulkCreateClues(bulkClueData);
      });

      expect(result.current.clues).toHaveLength(3);
      expect(result.current.clues.map(c => c.title)).toEqual([
        'Bulk Clue 1',
        'Bulk Clue 2',
        'Bulk Clue 3'
      ]);
    });

    test('should export and import clues', async () => {
      const { result } = renderHook(() => useClueStoreV2());

      // Create initial clues
      act(() => {
        result.current.createClue({ ...sampleClueData, title: 'Export Clue 1' });
        result.current.createClue({ ...sampleClueData, title: 'Export Clue 2' });
      });

      // Export clues
      const exportedClues = result.current.exportClues();
      expect(exportedClues).toHaveLength(2);

      // Reset store
      await act(async () => {
        await result.current.reset();
      });

      expect(result.current.clues).toHaveLength(0);

      // Import clues
      await act(async () => {
        await result.current.importClues(exportedClues);
      });

      expect(result.current.clues).toHaveLength(2);
      expect(result.current.clues.map(c => c.title)).toEqual([
        'Export Clue 1',
        'Export Clue 2'
      ]);
    });
  });

  describe('Persistence Integration', () => {
    test('should handle state changes without errors', async () => {
      const { result } = renderHook(() => useClueStoreV2());

      // Reset the store to ensure clean state
      await act(async () => {
        result.current.reset();
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Should be able to create clues without errors
      await act(async () => {
        result.current.createClue(sampleClueData);
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Should have the clue in the store
      const clues = Object.values(result.current.clues);
      expect(clues.length).toBeGreaterThan(0);
    });

    test('should create manual backups', async () => {
      const { result } = renderHook(() => useClueStoreV2());

      await act(async () => {
        result.current.createClue(sampleClueData);
        // Wait for dirty state to propagate
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await act(async () => {
        const success = await result.current._createBackup('Manual test backup');
        expect(success).toBe(true);
        // Wait for clean state to propagate
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Should be marked clean after backup
      expect(result.current._isDirty).toBe(false);
    });

    test('should provide persistence actions', () => {
      const { result } = renderHook(() => usePersistenceActions('clue-store-v2'));

      expect(result.current.createBackup).toBeDefined();
      expect(result.current.createPreActionBackup).toBeDefined();
      expect(result.current.listBackups).toBeDefined();
      expect(result.current.restoreBackup).toBeDefined();
      expect(result.current.getStats).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle duplicate clue creation', () => {
      const { result } = renderHook(() => useClueStoreV2());

      const clueDataWithId = { ...sampleClueData, id: 'test-clue-id' };

      act(() => {
        result.current.createClue(clueDataWithId);
      });

      expect(() => {
        act(() => {
          result.current.createClue(clueDataWithId);
        });
      }).toThrow('Clue with ID "test-clue-id" already exists');
    });

    test('should handle updates to non-existent clues', () => {
      const { result } = renderHook(() => useClueStoreV2());

      expect(() => {
        act(() => {
          result.current.updateClue('non-existent-id', { title: 'Updated' });
        });
      }).toThrow('Clue with ID "non-existent-id" not found');
    });

    test('should handle discovery of non-existent clues', () => {
      const { result } = renderHook(() => useClueStoreV2());

      const discoveryResult = result.current.discoverClue('non-existent-id', {
        storyletId: 'test-storylet',
        minigameType: 'word-association',
        characterId: 'test-character',
        dayNumber: 1,
        gameState: {}
      });

      expect(discoveryResult).toBeNull();
    });
  });
});