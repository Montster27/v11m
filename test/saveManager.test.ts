// /Users/montysharma/v11m2/test/saveManager.test.ts
// Comprehensive test suite for SaveManager atomic save operations

import { saveManager, SaveGame } from '../src/utils/saveManager';
import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../src/stores/v2';

// Mock localStorage for testing
const mockLocalStorage = {
  data: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockLocalStorage.data[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.data[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.data[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.data = {};
  })
};

// Mock compression functions
jest.mock('lz-string', () => ({
  compress: jest.fn((str: string) => `compressed:${str}`),
  decompress: jest.fn((str: string) => str.replace('compressed:', ''))
}));

describe('SaveManager Integration Tests', () => {
  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Clear mock data
    mockLocalStorage.data = {};
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockLocalStorage.clear.mockClear();
    
    // Reset stores to initial state
    useCoreGameStore.setState(useCoreGameStore.getInitialState?.() || {});
    useNarrativeStore.setState(useNarrativeStore.getInitialState?.() || {});
    useSocialStore.setState(useSocialStore.getInitialState?.() || {});
    
    // Clear save manager state
    saveManager.clearSave();
  });

  describe('Atomic Save Operations', () => {
    test('should save all store states atomically', async () => {
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

      // Verify backup was created
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'v11m2-unified-save-backup',
        expect.any(String)
      );
    });

    test('should load all store states atomically', async () => {
      // Create test save data
      const testSaveData: SaveGame = {
        version: 1,
        timestamp: Date.now(),
        metadata: {
          playerName: 'Test Player',
          gameDay: 10,
          playerLevel: 5,
          playtime: 2000
        },
        data: {
          core: {
            world: { day: 10, gameState: 'playing' },
            player: { level: 5, resources: { money: 1000 } },
            character: { name: 'Test Player' }
          },
          narrative: {
            storylets: { completed: ['story1', 'story2'] },
            flags: {
              storylet: [['flag1', 'value1']]
            }
          },
          social: {
            npcs: { relationships: { 'npc1': 15 } },
            saves: { currentSaveId: 'test-save' }
          }
        },
        checksum: 'test-checksum'
      };

      // Mock the save data in localStorage
      mockLocalStorage.data['v11m2-unified-save'] = `compressed:${JSON.stringify(testSaveData)}`;

      // Load game atomically
      const loadResult = await saveManager.loadGame();
      expect(loadResult).toBe(true);

      // Verify all stores were restored
      const coreState = useCoreGameStore.getState();
      expect(coreState.world.day).toBe(10);
      expect(coreState.player.level).toBe(5);
      expect(coreState.character.name).toBe('Test Player');

      const narrativeState = useNarrativeStore.getState();
      expect(narrativeState.storylets.completed).toContain('story1');

      const socialState = useSocialStore.getState();
      expect(socialState.npcs.relationships['npc1']).toBe(15);
    });

    test('should handle Map serialization correctly', async () => {
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
    test('should detect corrupted saves with checksum mismatch', async () => {
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

    test('should fallback to backup on corruption', async () => {
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

    test('should handle compression failures gracefully', async () => {
      // Mock compression to fail
      const { compress } = require('lz-string');
      compress.mockImplementationOnce(() => {
        throw new Error('Compression failed');
      });

      const saveResult = await saveManager.saveGame();
      expect(saveResult).toBe(false);
    });
  });

  describe('Export/Import Functionality', () => {
    test('should export save data as string', async () => {
      // Set some data and save
      useCoreGameStore.setState({ world: { day: 7 } });
      await saveManager.saveGame();

      // Export save
      const exportedSave = await saveManager.exportSave();
      expect(exportedSave).toContain('compressed:');
      expect(exportedSave).toBeTruthy();
    });

    test('should import save data from string', async () => {
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

    test('should reject invalid import data', async () => {
      const invalidSave = 'invalid-save-data';
      const importResult = await saveManager.importSave(invalidSave);
      expect(importResult).toBe(false);
    });
  });

  describe('Metadata Operations', () => {
    test('should extract save metadata without full load', async () => {
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

    test('should return null metadata for missing save', () => {
      const metadata = saveManager.getSaveMetadata();
      expect(metadata).toBeNull();
    });

    test('should track save statistics', async () => {
      // Perform saves
      await saveManager.saveGame();
      await saveManager.saveGame();

      const stats = saveManager.getStats();
      expect(stats.totalSaves).toBe(2);
      expect(stats.lastSaveTime).toBeTruthy();
      expect(stats.saveSize).toBeGreaterThan(0);
    });
  });

  describe('Save Management', () => {
    test('should clear all save data', () => {
      // Create some localStorage data
      mockLocalStorage.data['v11m2-unified-save'] = 'test-save';
      mockLocalStorage.data['mmv-core-game-store'] = 'legacy-save';

      saveManager.clearSave();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('v11m2-unified-save');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('mmv-core-game-store');
    });

    test('should detect save existence', async () => {
      expect(saveManager.hasSave()).toBe(false);

      await saveManager.saveGame();
      expect(saveManager.hasSave()).toBe(true);

      saveManager.clearSave();
      expect(saveManager.hasSave()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle localStorage quota exceeded', async () => {
      // Mock localStorage to throw quota error
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new DOMException('QuotaExceededError');
      });

      const saveResult = await saveManager.saveGame();
      expect(saveResult).toBe(false);
    });

    test('should handle malformed JSON in localStorage', async () => {
      mockLocalStorage.data['v11m2-unified-save'] = 'compressed:{invalid-json}';

      const loadResult = await saveManager.loadGame();
      expect(loadResult).toBe(false);
    });

    test('should handle missing store methods gracefully', async () => {
      // Mock store to have missing setState
      const originalSetState = useCoreGameStore.setState;
      delete (useCoreGameStore as any).setState;

      const saveResult = await saveManager.saveGame();
      expect(saveResult).toBe(false);

      // Restore
      useCoreGameStore.setState = originalSetState;
    });
  });
});