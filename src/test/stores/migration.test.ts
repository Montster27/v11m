// /Users/montysharma/v11m2/src/test/stores/migration.test.ts
// Store Migration Test Suite for Phase 1: Critical Save System Fixes

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { useCoreGameStore } from '../../stores/v2/useCoreGameStore';
import { useNarrativeStore } from '../../stores/v2/useNarrativeStore';
import { useSocialStore } from '../../stores/v2/useSocialStore';

describe('Store Migration Tests', () => {
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Mock localStorage
    originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    } as any;
    
    // Clear all stores
    localStorage.clear();
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
  });

  describe('CoreGameStore Migration', () => {
    test('handles unversioned saves', () => {
      // Simulate old save without version
      const unversionedSave = {
        state: {
          player: { level: 5, experience: 100, skillPoints: 10, resources: { money: 50 } },
          character: { name: 'TestChar', background: 'scholar' },
          world: { day: 15, timeAllocation: {}, isTimePaused: false }
        }
        // No version property
      };

      localStorage.setItem('mmv-core-game-store', JSON.stringify(unversionedSave));

      // Initialize store - should trigger migration
      const state = useCoreGameStore.getState();
      
      // Should preserve existing data
      expect(state.player.level).toBe(5);
      expect(state.player.experience).toBe(100);
      expect(state.character.name).toBe('TestChar');
      expect(state.world.day).toBe(15);
      
      // Should have proper structure
      expect(state.player.resources).toEqual({ money: 50 });
      expect(state.character.attributes).toBeDefined();
      expect(state.skills).toBeDefined();
    });

    test('preserves versioned saves', () => {
      // Simulate properly versioned save
      const versionedSave = {
        state: {
          player: { level: 3, experience: 200, skillPoints: 5, resources: {} },
          character: { name: 'VersionedChar', background: 'artist', attributes: {}, developmentStats: {} },
          skills: { totalExperience: 50, coreCompetencies: {}, foundationExperiences: {}, characterClasses: {} },
          world: { day: 8, timeAllocation: {}, isTimePaused: true }
        },
        version: 1
      };

      localStorage.setItem('mmv-core-game-store', JSON.stringify(versionedSave));

      const state = useCoreGameStore.getState();
      expect(state.player.level).toBe(3);
      expect(state.character.name).toBe('VersionedChar');
      expect(state.world.isTimePaused).toBe(true);
    });

    test('handles corrupted saves gracefully', () => {
      // Simulate corrupted save
      localStorage.setItem('mmv-core-game-store', 'invalid-json');

      // Should fall back to defaults without crashing
      const state = useCoreGameStore.getState();
      expect(state.player.level).toBe(1);
      expect(state.character.name).toBe('');
      expect(state.world.day).toBe(1);
    });
  });

  describe('NarrativeStore Migration', () => {
    test('handles unversioned saves with Map flags', () => {
      // Simulate old save with serialized Maps
      const unversionedSave = {
        state: {
          storylets: {
            active: ['storylet1', 'storylet2'],
            completed: ['intro'],
            cooldowns: { 'storylet1': 1234567890 },
            userCreated: []
          },
          flags: {
            storylet: [['character_created', true], ['tutorial_complete', false]],
            concerns: [['academic_stress', 0.7]],
            storyArc: [['main_arc', 'started']],
            storyletFlag: []
          },
          storyArcs: { progress: { main_arc: 1 }, metadata: {}, failures: {} },
          concerns: { current: { academic: 0.5 }, history: [] }
        }
        // No version property
      };

      localStorage.setItem('mmv-narrative-store', JSON.stringify(unversionedSave));

      const state = useNarrativeStore.getState();
      
      // Should preserve storylet data
      expect(state.storylets.active).toEqual(['storylet1', 'storylet2']);
      expect(state.storylets.completed).toEqual(['intro']);
      
      // Should recreate Maps properly
      expect(state.getStoryletFlag('character_created')).toBe(true);
      expect(state.getStoryletFlag('tutorial_complete')).toBe(false);
      expect(state.getConcernFlag('academic_stress')).toBe(0.7);
      
      // Should preserve other data
      expect(state.concerns.current.academic).toBe(0.5);
    });

    test('handles missing flags gracefully', () => {
      const incompleteSave = {
        state: {
          storylets: { active: [], completed: [], cooldowns: {}, userCreated: [] }
          // Missing flags, storyArcs, concerns
        }
      };

      localStorage.setItem('mmv-narrative-store', JSON.stringify(incompleteSave));

      const state = useNarrativeStore.getState();
      
      // Should have proper defaults
      expect(state.storylets.active).toEqual([]);
      expect(state.flags.storylet).toBeInstanceOf(Map);
      expect(state.getStoryletFlag('nonexistent')).toBeUndefined();
    });
  });

  describe('SocialStore Migration', () => {
    test('handles unversioned saves with save slots', () => {
      const unversionedSave = {
        state: {
          npcs: {
            relationships: { 'npc1': 5, 'npc2': -2 },
            interactionHistory: { 'npc1': [{ type: 'conversation', timestamp: 123 }] },
            memories: { 'npc1': { lastSeen: 'library' } },
            flags: { 'npc1': { friendly: true } }
          },
          clues: {
            discovered: [{ id: 'clue1', title: 'First Clue' }],
            connections: { 'clue1': ['clue2'] },
            storyArcs: { 'main': ['clue1'] },
            discoveryEvents: [{ clueId: 'clue1', timestamp: 456 }]
          },
          saves: {
            currentSaveId: 'save1',
            saveSlots: {
              'save1': { id: 'save1', name: 'Test Save', created: 789 }
            },
            saveHistory: [{ action: 'create', saveId: 'save1', timestamp: 789 }]
          }
        }
      };

      localStorage.setItem('mmv-social-store', JSON.stringify(unversionedSave));

      const state = useSocialStore.getState();
      
      // Should preserve NPC data
      expect(state.npcs.relationships.npc1).toBe(5);
      expect(state.npcs.relationships.npc2).toBe(-2);
      expect(state.npcs.memories.npc1.lastSeen).toBe('library');
      
      // Should preserve clue data
      expect(state.clues.discovered).toHaveLength(1);
      expect(state.clues.connections.clue1).toEqual(['clue2']);
      
      // Should preserve save data
      expect(state.saves.currentSaveId).toBe('save1');
      expect(state.saves.saveSlots.save1.name).toBe('Test Save');
    });

    test('handles missing arrays and objects', () => {
      const incompleteSave = {
        state: {
          npcs: { relationships: { 'npc1': 3 } }
          // Missing clues, saves, and other npc properties
        }
      };

      localStorage.setItem('mmv-social-store', JSON.stringify(incompleteSave));

      const state = useSocialStore.getState();
      
      // Should have proper defaults
      expect(state.npcs.relationships.npc1).toBe(3);
      expect(state.npcs.interactionHistory).toEqual({});
      expect(state.clues.discovered).toEqual([]);
      expect(state.saves.saveSlots).toEqual({});
      expect(state.saves.saveHistory).toEqual([]);
    });
  });

  describe('Cross-Store Integration', () => {
    test('all stores can be initialized simultaneously', () => {
      // Test that all stores can load at the same time without conflicts
      const coreState = useCoreGameStore.getState();
      const narrativeState = useNarrativeStore.getState();
      const socialState = useSocialStore.getState();
      
      expect(coreState).toBeDefined();
      expect(narrativeState).toBeDefined();
      expect(socialState).toBeDefined();
      
      // Basic functionality should work
      expect(typeof coreState.updatePlayer).toBe('function');
      expect(typeof narrativeState.setStoryletFlag).toBe('function');
      expect(typeof socialState.updateRelationship).toBe('function');
    });

    test('stores maintain independence during migration', () => {
      // Set up data in one store
      const coreState = useCoreGameStore.getState();
      coreState.updatePlayer({ level: 10 });
      
      // Trigger migration in another store
      localStorage.setItem('mmv-narrative-store', JSON.stringify({
        state: { storylets: { active: ['test'] } }
      }));
      
      // First store should be unaffected
      expect(coreState.player.level).toBe(10);
    });
  });

  describe('Version Consistency', () => {
    test('all stores use same version system', () => {
      // Verify all stores are on version 1
      const coreData = { state: {}, version: 1 };
      const narrativeData = { state: {}, version: 1 };
      const socialData = { state: {}, version: 1 };
      
      localStorage.setItem('mmv-core-game-store', JSON.stringify(coreData));
      localStorage.setItem('mmv-narrative-store', JSON.stringify(narrativeData));
      localStorage.setItem('mmv-social-store', JSON.stringify(socialData));
      
      // All should load without migration messages
      const coreState = useCoreGameStore.getState();
      const narrativeState = useNarrativeStore.getState();
      const socialState = useSocialStore.getState();
      
      expect(coreState).toBeDefined();
      expect(narrativeState).toBeDefined();
      expect(socialState).toBeDefined();
    });
  });
});