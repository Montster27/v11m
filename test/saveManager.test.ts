// /Users/montysharma/v11m2/test/saveManager.test.ts
// Comprehensive test suite for SaveManager atomic save operations

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveManager, SaveGame } from '../src/utils/saveManager';
import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../src/stores/v2';

// Mock localStorage for testing
const mockLocalStorage = {
  data: {} as Record<string, string>,
  getItem: vi.fn((key: string) => mockLocalStorage.data[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockLocalStorage.data[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockLocalStorage.data[key];
  }),
  clear: vi.fn(() => {
    mockLocalStorage.data = {};
  })
};

// Mock compression functions
vi.mock('lz-string', () => ({
  compress: vi.fn((str: string) => `compressed:${str}`),
  decompress: vi.fn((str: string) => str.replace('compressed:', ''))
}));

describe('SaveManager Integration Tests', () => {
  beforeEach(async () => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Clear mock data
    mockLocalStorage.data = {};
    vi.clearAllMocks();
    
    // Reset compression mocks  
    const { compress, decompress } = await import('lz-string');
    vi.mocked(compress).mockImplementation((str: string) => `compressed:${str}`);
    vi.mocked(decompress).mockImplementation((str: string) => str.replace('compressed:', ''));
    
    // Reset stores to initial state
    try {
      useCoreGameStore.setState(useCoreGameStore.getInitialState?.() || {});
      useNarrativeStore.setState(useNarrativeStore.getInitialState?.() || {});
      useSocialStore.setState(useSocialStore.getInitialState?.() || {});
    } catch (error) {
      console.warn('Failed to reset store states:', error);
    }
    
    // Clear save manager state
    saveManager.clearSave();
  });

  describe('Atomic Save Operations', () => {
    it('should save all store states atomically', async () => {
      // Set different data in each store
      useCoreGameStore.setState({
        world: { day: 5, gameState: 'playing', playtime: 1000 },
        player: { level: 3, resources: { money: 500, energy: 80 } },
        character: { name: 'Test Character' }
      });
      
      useNarrativeStore.setState({
        storylets: { completed: ['storylet1', 'storylet2'] }
      });
      
      useSocialStore.setState({
        npcs: { relationships: { 'npc1': 10 } }
      });

      // Save game atomically
      const saveResult = await saveManager.saveGame();
      expect(saveResult).toBe(true);

      // Verify save was written to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'v11m2-unified-save',
        expect.any(String)
      );
      
      // Verify at least one save was made
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('should load all store states atomically', async () => {
      // Set up stores with initial data
      useCoreGameStore.setState({
        world: { day: 10, gameState: 'playing' },
        player: { level: 5, resources: { money: 1000 } },
        character: { name: 'Test Player' }
      });
      
      useNarrativeStore.setState({
        storylets: { completed: ['story1', 'story2'] }
      });
      
      useSocialStore.setState({
        npcs: { relationships: { 'npc1': 15 } }
      });

      // Save the current state
      const saveResult = await saveManager.saveGame();
      expect(saveResult).toBe(true);

      // Reset stores to initial state
      try {
        useCoreGameStore.setState(useCoreGameStore.getInitialState?.() || {});
        useNarrativeStore.setState(useNarrativeStore.getInitialState?.() || {});
        useSocialStore.setState(useSocialStore.getInitialState?.() || {});
      } catch (error) {
        console.warn('Failed to reset store states:', error);
      }

      // Load game atomically
      const loadResult = await saveManager.loadGame();
      expect(loadResult).toBe(true);

      // Verify all stores were restored
      const coreState = useCoreGameStore.getState();
      expect(coreState.world?.day).toBe(10);
      expect(coreState.player?.level).toBe(5);
      expect(coreState.character?.name).toBe('Test Player');

      const narrativeState = useNarrativeStore.getState();
      expect(narrativeState.storylets?.completed).toContain('story1');

      const socialState = useSocialStore.getState();
      expect(socialState.npcs?.relationships?.['npc1']).toBe(15);
    });

    it('should handle Map serialization correctly', async () => {
      // Set Maps in narrative store
      useNarrativeStore.setState({
        flags: {
          storylet: new Map([['key1', 'value1'], ['key2', 'value2']]),
          concerns: new Map([['concern1', 10]]),
          storyArc: new Map(),
          storyletFlag: new Map()
        }
      });

      // Save and clear
      await saveManager.saveGame();
      useNarrativeStore.setState({ flags: { storylet: new Map(), concerns: new Map(), storyArc: new Map(), storyletFlag: new Map() } });

      // Load and verify Maps are restored
      await saveManager.loadGame();
      const narrativeState = useNarrativeStore.getState();
      
      expect(narrativeState.flags.storylet.get('key1')).toBe('value1');
      expect(narrativeState.flags.concerns.get('concern1')).toBe(10);
      expect(narrativeState.flags.storylet instanceof Map).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    it('should detect corrupted saves with checksum mismatch', async () => {
      // Create valid save
      await saveManager.saveGame();

      // Corrupt the save data
      const saveData = JSON.parse(mockLocalStorage.data['v11m2-unified-save'].replace('compressed:', ''));
      saveData.data.core.world.day = 999; // Change data without updating checksum
      mockLocalStorage.data['v11m2-unified-save'] = `compressed:${JSON.stringify(saveData)}`;

      // Should fail to load corrupted save
      const loadResult = await saveManager.loadGame();
      expect(loadResult).toBe(false);
    });

    it('should fallback to backup on corruption', async () => {
      // Create initial save
      useCoreGameStore.setState({ world: { day: 5 } });
      await saveManager.saveGame();

      // Create backup
      useCoreGameStore.setState({ world: { day: 10 } });
      await saveManager.saveGame();

      // Corrupt main save
      mockLocalStorage.data['v11m2-unified-save'] = 'invalid-data';

      // Should load from backup
      const loadResult = await saveManager.loadGame();
      expect(loadResult).toBe(true);
    });

    it('should handle compression failures gracefully', async () => {
      // Mock compression to fail
      const { compress } = await import('lz-string');
      vi.mocked(compress).mockImplementationOnce(() => {
        throw new Error('Compression failed');
      });

      const saveResult = await saveManager.saveGame();
      expect(saveResult).toBe(false);
    });
  });

  describe('Export/Import Functionality', () => {
    it('should export save data as string', async () => {
      // Set some data and save
      useCoreGameStore.setState({ world: { day: 7 } });
      await saveManager.saveGame();

      // Export save
      const exportedSave = await saveManager.exportSave();
      expect(exportedSave).toContain('compressed:');
      expect(exportedSave).toBeTruthy();
    });

    it('should import save data from string', async () => {
      // Create test save data
      const testSave = {
        version: 1,
        timestamp: Date.now(),
        metadata: { gameDay: 15, playerLevel: 7, playerName: 'Imported Player', playtime: 3000 },
        data: {
          core: { world: { day: 15 }, player: { level: 7 } },
          narrative: { storylets: { completed: [] } },
          social: { npcs: { relationships: {} } }
        }
      };

      const saveString = `compressed:${JSON.stringify(testSave)}`;

      // Import save
      const importResult = await saveManager.importSave(saveString);
      expect(importResult).toBe(true);

      // Verify data was loaded
      const coreState = useCoreGameStore.getState();
      expect(coreState.world.day).toBe(15);
      expect(coreState.player.level).toBe(7);
    });

    it('should reject invalid import data', async () => {
      const invalidSave = 'invalid-save-data';
      const importResult = await saveManager.importSave(invalidSave);
      expect(importResult).toBe(false);
    });
  });

  describe('Metadata Operations', () => {
    it('should extract save metadata without full load', async () => {
      // Set up data and save
      useCoreGameStore.setState({
        world: { day: 20, playtime: 5000 },
        player: { level: 8 },
        character: { name: 'Metadata Test' }
      });
      await saveManager.saveGame();

      // Get metadata
      const metadata = saveManager.getSaveMetadata();
      expect(metadata).toMatchObject({
        gameDay: 20,
        playerLevel: 8,
        playerName: 'Metadata Test',
        playtime: 5000
      });
    });

    it('should return null metadata for missing save', () => {
      const metadata = saveManager.getSaveMetadata();
      expect(metadata).toBeNull();
    });

    it('should track save statistics', async () => {
      // Get initial stats
      const initialStats = saveManager.getStats();
      const initialSaveCount = initialStats.totalSaves || 0;
      
      // Perform saves
      await saveManager.saveGame();
      await saveManager.saveGame();

      const stats = saveManager.getStats();
      expect(stats.totalSaves).toBe(initialSaveCount + 2);
      expect(stats.lastSaveTime).toBeTruthy();
      expect(stats.saveSize).toBeGreaterThan(0);
    });
  });

  describe('Save Management', () => {
    it('should clear all save data', () => {
      // Create some localStorage data
      mockLocalStorage.data['v11m2-unified-save'] = 'test-save';
      mockLocalStorage.data['mmv-core-game-store'] = 'legacy-save';

      saveManager.clearSave();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('v11m2-unified-save');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('mmv-core-game-store');
    });

    it('should detect save existence', async () => {
      expect(saveManager.hasSave()).toBe(false);

      await saveManager.saveGame();
      expect(saveManager.hasSave()).toBe(true);

      saveManager.clearSave();
      expect(saveManager.hasSave()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage quota exceeded', async () => {
      // Mock localStorage to throw quota error
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new DOMException('QuotaExceededError');
      });

      const saveResult = await saveManager.saveGame();
      expect(saveResult).toBe(false);
    });

    it('should handle malformed JSON in localStorage', async () => {
      mockLocalStorage.data['v11m2-unified-save'] = 'compressed:{invalid-json}';

      const loadResult = await saveManager.loadGame();
      expect(loadResult).toBe(false);
    });

    it('should handle missing store methods gracefully', async () => {
      // Mock store to have missing setState
      const originalSetState = useCoreGameStore.setState;
      delete (useCoreGameStore as any).setState;

      const saveResult = await saveManager.saveGame();
      // The save manager is resilient and can still save even with missing store methods
      expect(saveResult).toBe(true);

      // Restore
      useCoreGameStore.setState = originalSetState;
    });
  });
});