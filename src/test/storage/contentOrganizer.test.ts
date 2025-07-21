// /Users/montysharma/v11m2/src/test/storage/contentOrganizer.test.ts
// Test suite for ContentOrganizer data organization patterns

import { ContentOrganizer } from '../../services/storage/ContentOrganizer';
import { LocalStorageAdapter } from '../../services/storage/LocalStorageAdapter';
import type { Storylet, StoryArc } from '../../types/storylet';
import type { Clue } from '../../types/clue';

describe('ContentOrganizer', () => {
  let adapter: LocalStorageAdapter;
  let organizer: ContentOrganizer;

  beforeEach(async () => {
    adapter = new LocalStorageAdapter();
    await adapter.clear();
    
    organizer = new ContentOrganizer(adapter, {
      chunkSize: 10, // Small chunks for testing
      enableIndexing: true,
      enableCompression: false,
      enableLazyLoading: true,
      cacheSize: 3
    });
  });

  afterEach(async () => {
    await adapter.clear();
  });

  // Helper functions to create test data
  const createTestStorylets = (count: number): Storylet[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `storylet_${i}`,
      name: `Test Storylet ${i}`,
      description: `Description for storylet ${i}`,
      category: i % 3 === 0 ? 'academic' : i % 3 === 1 ? 'social' : 'personal',
      tags: [`tag_${i % 4}`, `category_${i % 3}`],
      author: `author_${i % 2}`,
      choices: [],
      trigger: { type: 'time', conditions: {} },
      requirements: {},
      version: '1.0.0',
      metadata: {
        createdAt: new Date().toISOString(),
        category: 'test'
      }
    }));
  };

  const createTestClues = (count: number): Clue[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `clue_${i}`,
      title: `Test Clue ${i}`,
      description: `Description for clue ${i}`,
      content: `Content for clue ${i}`,
      category: i % 2 === 0 ? 'academic' : 'social',
      difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
      storyArc: `arc_${i % 3}`,
      arcOrder: i,
      minigameTypes: ['word-association'],
      associatedStorylets: [`storylet_${i}`],
      isDiscovered: true,
      discoveredAt: new Date(),
      tags: [`tag_${i % 2}`, `difficulty_${i % 3}`],
      rarity: 'common',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  };

  const createTestArcs = (count: number): StoryArc[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `arc_${i}`,
      name: `Test Arc ${i}`,
      description: `Description for arc ${i}`,
      tags: [`tag_${i % 2}`],
      storylets: [`storylet_${i}`, `storylet_${i + 1}`],
      progress: 0,
      isCompleted: false,
      failures: 0
    }));
  };

  describe('Storylet Organization', () => {
    test('should save and organize storylets into chunks', async () => {
      const storylets = createTestStorylets(25); // 3 chunks with chunkSize=10
      
      const result = await organizer.saveStorylets(storylets);
      
      expect(result.success).toBe(true);
      expect(result.chunksCreated).toBe(3); // 25 items / 10 per chunk = 3 chunks
    });

    test('should load storylets with pagination', async () => {
      const storylets = createTestStorylets(25);
      await organizer.saveStorylets(storylets);
      
      // Load first page
      const page1 = await organizer.loadStorylets({ limit: 10, offset: 0 });
      expect(page1.items.length).toBe(10);
      expect(page1.totalCount).toBe(25);
      expect(page1.hasMore).toBe(true);
      expect(page1.nextOffset).toBe(10);
      
      // Load second page
      const page2 = await organizer.loadStorylets({ limit: 10, offset: 10 });
      expect(page2.items.length).toBe(10);
      expect(page2.hasMore).toBe(true);
      expect(page2.nextOffset).toBe(20);
      
      // Load last page
      const page3 = await organizer.loadStorylets({ limit: 10, offset: 20 });
      expect(page3.items.length).toBe(5);
      expect(page3.hasMore).toBe(false);
      expect(page3.nextOffset).toBeUndefined();
    });

    test('should find storylet by ID using index', async () => {
      const storylets = createTestStorylets(25);
      await organizer.saveStorylets(storylets);
      
      const found = await organizer.findById<Storylet>('storylets', 'storylet_15');
      expect(found).toBeDefined();
      expect(found?.id).toBe('storylet_15');
      expect(found?.name).toBe('Test Storylet 15');
    });

    test('should find storylets by tag', async () => {
      const storylets = createTestStorylets(25);
      await organizer.saveStorylets(storylets);
      
      // Find storylets with tag_0 (items 0, 4, 8, 12, 16, 20, 24)
      const found = await organizer.findByTag<Storylet>('storylets', 'tag_0');
      expect(found.length).toBe(7);
      expect(found.every(s => s.tags.includes('tag_0'))).toBe(true);
    });

    test('should filter storylets', async () => {
      const storylets = createTestStorylets(25);
      await organizer.saveStorylets(storylets);
      
      // Filter by category
      const academicStorylets = await organizer.loadStorylets({
        filter: (s: Storylet) => s.category === 'academic'
      });
      
      expect(academicStorylets.items.every(s => s.category === 'academic')).toBe(true);
      expect(academicStorylets.items.length).toBeGreaterThan(0);
    });

    test('should sort storylets', async () => {
      const storylets = createTestStorylets(15);
      await organizer.saveStorylets(storylets);
      
      // Sort by name descending
      const sorted = await organizer.loadStorylets({
        sortBy: 'name',
        sortOrder: 'desc'
      });
      
      expect(sorted.items[0].name.localeCompare(sorted.items[1].name)).toBeGreaterThan(0);
    });
  });

  describe('Clue Organization', () => {
    test('should save clues with arc-based grouping', async () => {
      const clues = createTestClues(21); // 3 chunks
      
      const result = await organizer.saveClues(clues);
      
      expect(result.success).toBe(true);
      expect(result.chunksCreated).toBe(3);
    });

    test('should find clues by story arc', async () => {
      const clues = createTestClues(21);
      await organizer.saveClues(clues);
      
      // Find clues for arc_0 (items 0, 3, 6, 9, 12, 15, 18)
      const arcClues = await organizer.findCluesByArc('arc_0');
      expect(arcClues.length).toBe(7);
      expect(arcClues.every(c => c.storyArc === 'arc_0')).toBe(true);
    });

    test('should load clues with filtering by difficulty', async () => {
      const clues = createTestClues(21);
      await organizer.saveClues(clues);
      
      const hardClues = await organizer.loadClues({
        filter: (c: Clue) => c.difficulty === 'hard'
      });
      
      expect(hardClues.items.every(c => c.difficulty === 'hard')).toBe(true);
    });
  });

  describe('Story Arc Organization', () => {
    test('should save and load story arcs', async () => {
      const arcs = createTestArcs(8);
      
      const result = await organizer.saveStoryArcs(arcs);
      expect(result.success).toBe(true);
      expect(result.chunksCreated).toBe(1); // 8 items fit in 1 chunk of size 10
      
      const loaded = await organizer.loadStoryArcs();
      expect(loaded.items.length).toBe(8);
      expect(loaded.totalCount).toBe(8);
    });

    test('should find arc by ID', async () => {
      const arcs = createTestArcs(5);
      await organizer.saveStoryArcs(arcs);
      
      const found = await organizer.findById<StoryArc>('story_arcs', 'arc_2');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Arc 2');
    });
  });

  describe('Incremental Updates', () => {
    test('should update individual storylet', async () => {
      const storylets = createTestStorylets(15);
      await organizer.saveStorylets(storylets);
      
      // Update a specific storylet
      const updatedStorylet = {
        ...storylets[5],
        name: 'Updated Storylet Name',
        description: 'Updated description'
      };
      
      const result = await organizer.updateItem('storylets', updatedStorylet);
      expect(result.success).toBe(true);
      
      // Verify the update
      const found = await organizer.findById<Storylet>('storylets', updatedStorylet.id);
      expect(found?.name).toBe('Updated Storylet Name');
      expect(found?.description).toBe('Updated description');
    });

    test('should handle update of non-existent item', async () => {
      const storylets = createTestStorylets(5);
      await organizer.saveStorylets(storylets);
      
      const nonExistentStorylet = {
        id: 'non_existent',
        name: 'Non-existent',
        description: 'Should fail',
        category: 'test',
        tags: [],
        author: 'test',
        choices: [],
        trigger: { type: 'time', conditions: {} },
        requirements: {},
        version: '1.0.0',
        metadata: { createdAt: new Date().toISOString(), category: 'test' }
      };
      
      const result = await organizer.updateItem('storylets', nonExistentStorylet);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Item not found');
    });
  });

  describe('Statistics and Management', () => {
    test('should provide collection statistics', async () => {
      const storylets = createTestStorylets(25);
      await organizer.saveStorylets(storylets);
      
      const stats = await organizer.getCollectionStats('storylets');
      expect(stats).toBeDefined();
      expect(stats!.totalItems).toBe(25);
      expect(stats!.totalChunks).toBe(3);
      expect(stats!.averageChunkSize).toBeCloseTo(8.33, 1);
      expect(stats!.totalSize).toBeGreaterThan(0);
    });

    test('should clear collection', async () => {
      const storylets = createTestStorylets(15);
      await organizer.saveStorylets(storylets);
      
      // Verify data exists
      let stats = await organizer.getCollectionStats('storylets');
      expect(stats?.totalItems).toBe(15);
      
      // Clear collection
      const cleared = await organizer.clearCollection('storylets');
      expect(cleared).toBe(true);
      
      // Verify data is gone
      stats = await organizer.getCollectionStats('storylets');
      expect(stats).toBeNull();
      
      const loaded = await organizer.loadStorylets();
      expect(loaded.items.length).toBe(0);
    });
  });

  describe('Caching Behavior', () => {
    test('should cache chunks for performance', async () => {
      const storylets = createTestStorylets(25);
      await organizer.saveStorylets(storylets);
      
      // First access should load from storage
      const start1 = Date.now();
      await organizer.findById<Storylet>('storylets', 'storylet_5');
      const time1 = Date.now() - start1;
      
      // Second access to same chunk should be faster (cached)
      const start2 = Date.now();
      await organizer.findById<Storylet>('storylets', 'storylet_7'); // Same chunk as storylet_5
      const time2 = Date.now() - start2;
      
      // Cache should make it faster (though timing can be variable in tests)
      expect(time2).toBeLessThanOrEqual(time1 + 5); // Allow some variance
    });

    test('should handle cache eviction with LRU', async () => {
      // Create enough data to exceed cache size (3 chunks)
      const storylets = createTestStorylets(50); // 5 chunks
      await organizer.saveStorylets(storylets);
      
      // Access first 3 chunks (fills cache)
      await organizer.findById<Storylet>('storylets', 'storylet_0');  // chunk 0
      await organizer.findById<Storylet>('storylets', 'storylet_10'); // chunk 1
      await organizer.findById<Storylet>('storylets', 'storylet_20'); // chunk 2
      
      // Access 4th chunk (should evict oldest)
      await organizer.findById<Storylet>('storylets', 'storylet_30'); // chunk 3
      
      // Access 5th chunk (should evict another)
      await organizer.findById<Storylet>('storylets', 'storylet_40'); // chunk 4
      
      // Should still work (cache management is internal)
      const found = await organizer.findById<Storylet>('storylets', 'storylet_15');
      expect(found?.id).toBe('storylet_15');
    });
  });

  describe('Error Handling', () => {
    test('should handle empty collections gracefully', async () => {
      const result = await organizer.saveStorylets([]);
      expect(result.success).toBe(true);
      expect(result.chunksCreated).toBe(0);
      
      const loaded = await organizer.loadStorylets();
      expect(loaded.items.length).toBe(0);
      expect(loaded.totalCount).toBe(0);
    });

    test('should handle missing collection gracefully', async () => {
      const found = await organizer.findById<Storylet>('nonexistent', 'test');
      expect(found).toBeNull();
      
      const loaded = await organizer.loadStorylets();
      expect(loaded.items.length).toBe(0);
      
      const stats = await organizer.getCollectionStats('nonexistent');
      expect(stats).toBeNull();
    });

    test('should handle corrupted data gracefully', async () => {
      // Manually create corrupted manifest
      await adapter.setItem('content_manifest_corrupted', 'invalid json');
      
      const found = await organizer.findById<Storylet>('corrupted', 'test');
      expect(found).toBeNull();
    });
  });

  describe('Large Data Handling', () => {
    test('should handle large collections efficiently', async () => {
      // Create 1000 storylets
      const storylets = createTestStorylets(1000);
      
      const start = Date.now();
      const result = await organizer.saveStorylets(storylets);
      const saveTime = Date.now() - start;
      
      expect(result.success).toBe(true);
      expect(result.chunksCreated).toBe(100); // 1000 / 10 = 100 chunks
      expect(saveTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Test paginated loading
      const loadStart = Date.now();
      const page = await organizer.loadStorylets({ limit: 50, offset: 500 });
      const loadTime = Date.now() - loadStart;
      
      expect(page.items.length).toBe(50);
      expect(page.totalCount).toBe(1000);
      expect(loadTime).toBeLessThan(500); // Should be fast with chunking
      
      // Test ID lookup
      const lookupStart = Date.now();
      const found = await organizer.findById<Storylet>('storylets', 'storylet_750');
      const lookupTime = Date.now() - lookupStart;
      
      expect(found?.id).toBe('storylet_750');
      expect(lookupTime).toBeLessThan(100); // Index lookup should be very fast
    });
  });

  describe('Mixed Content Types', () => {
    test('should handle multiple content types simultaneously', async () => {
      const storylets = createTestStorylets(30);
      const clues = createTestClues(25);
      const arcs = createTestArcs(10);
      
      // Save all content types
      const [storyletResult, clueResult, arcResult] = await Promise.all([
        organizer.saveStorylets(storylets),
        organizer.saveClues(clues),
        organizer.saveStoryArcs(arcs)
      ]);
      
      expect(storyletResult.success).toBe(true);
      expect(clueResult.success).toBe(true);
      expect(arcResult.success).toBe(true);
      
      // Load and verify all content types
      const [loadedStorylets, loadedClues, loadedArcs] = await Promise.all([
        organizer.loadStorylets(),
        organizer.loadClues(),
        organizer.loadStoryArcs()
      ]);
      
      expect(loadedStorylets.totalCount).toBe(30);
      expect(loadedClues.totalCount).toBe(25);
      expect(loadedArcs.totalCount).toBe(10);
    });
  });
});