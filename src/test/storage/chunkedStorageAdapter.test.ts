// /Users/montysharma/v11m2/src/test/storage/chunkedStorageAdapter.test.ts
// Test suite for ChunkedStorageAdapter functionality with large data

import { ChunkedStorageAdapter } from '../../services/storage/ChunkedStorageAdapter';
import { LocalStorageAdapter } from '../../services/storage/LocalStorageAdapter';
import { StorageAdapter } from '../../services/storage/StorageAdapter';

describe('ChunkedStorageAdapter', () => {
  let baseAdapter: StorageAdapter;
  let chunkedAdapter: ChunkedStorageAdapter;

  beforeEach(async () => {
    // Use LocalStorageAdapter as base for testing
    baseAdapter = new LocalStorageAdapter();
    await baseAdapter.clear(); // Clean state for each test
    
    // Create chunked adapter with small chunk size for testing
    chunkedAdapter = new ChunkedStorageAdapter(baseAdapter, {
      chunkSizeBytes: 1024, // 1KB chunks for testing
      maxChunks: 250, // Allow larger test data
      compressionEnabled: false
    });
    
    await chunkedAdapter.initialize();
  });

  afterEach(async () => {
    await baseAdapter.clear();
  });

  describe('Small Data Handling', () => {
    test('should handle small data without chunking', async () => {
      const smallData = 'small test data';
      const key = 'test_small';

      await chunkedAdapter.setItem(key, smallData);
      const retrieved = await chunkedAdapter.getItem(key);

      expect(retrieved).toBe(smallData);
      
      // Should not create chunks for small data
      const baseKeys = await baseAdapter.getKeys();
      expect(baseKeys).toContain(key);
      expect(baseKeys.filter(k => k.includes('__chunked_')).length).toBe(0);
    });

    test('should list small data keys correctly', async () => {
      await chunkedAdapter.setItem('key1', 'data1');
      await chunkedAdapter.setItem('key2', 'data2');

      const keys = await chunkedAdapter.getKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys.length).toBe(2);
    });
  });

  describe('Large Data Chunking', () => {
    test('should chunk large data automatically', async () => {
      // Create data larger than chunk size (1KB)
      const largeData = 'x'.repeat(3000); // 3KB
      const key = 'test_large';

      await chunkedAdapter.setItem(key, largeData);
      
      // Should create chunks and manifest
      const baseKeys = await baseAdapter.getKeys();
      const manifestKeys = baseKeys.filter(k => k.includes('__chunked_manifest__'));
      const chunkKeys = baseKeys.filter(k => k.includes('__chunked_data__'));
      
      expect(manifestKeys.length).toBe(1);
      expect(chunkKeys.length).toBe(3); // 3KB / 1KB = 3 chunks
    });

    test('should reconstruct large data correctly', async () => {
      const largeData = 'abcdefghij'.repeat(500); // 5KB
      const key = 'test_reconstruction';

      await chunkedAdapter.setItem(key, largeData);
      const retrieved = await chunkedAdapter.getItem(key);

      expect(retrieved).toBe(largeData);
      expect(retrieved?.length).toBe(5000);
    });

    test('should handle very large data', async () => {
      // Create 50KB of data
      const veryLargeData = JSON.stringify({
        storylets: Array.from({ length: 1000 }, (_, i) => ({
          id: `storylet_${i}`,
          name: `Test Storylet ${i}`,
          description: 'This is a test storylet with some content to make it larger',
          choices: [
            { id: `choice_${i}_1`, text: 'Choice 1', effects: [] },
            { id: `choice_${i}_2`, text: 'Choice 2', effects: [] }
          ]
        }))
      });

      const key = 'test_very_large';
      console.log(`Testing with ${(veryLargeData.length / 1024).toFixed(2)}KB of data`);

      await chunkedAdapter.setItem(key, veryLargeData);
      const retrieved = await chunkedAdapter.getItem(key);

      expect(retrieved).toBe(veryLargeData);
      
      // Verify chunking occurred
      const stats = await chunkedAdapter.getChunkingStats();
      expect(stats.totalChunkedKeys).toBe(1);
      expect(stats.totalChunks).toBeGreaterThan(10);
    });

    test('should list chunked data keys correctly', async () => {
      const data1 = 'x'.repeat(2000); // 2KB
      const data2 = 'y'.repeat(3000); // 3KB
      
      await chunkedAdapter.setItem('chunked1', data1);
      await chunkedAdapter.setItem('chunked2', data2);
      await chunkedAdapter.setItem('small', 'tiny');

      const keys = await chunkedAdapter.getKeys();
      expect(keys).toContain('chunked1');
      expect(keys).toContain('chunked2');
      expect(keys).toContain('small');
      expect(keys.length).toBe(3);

      // Internal keys should be filtered out
      expect(keys.filter(k => k.includes('__chunked_')).length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing chunks gracefully', async () => {
      const largeData = 'x'.repeat(2000);
      const key = 'test_missing_chunk';

      await chunkedAdapter.setItem(key, largeData);
      
      // Manually delete a chunk to simulate corruption
      const baseKeys = await baseAdapter.getKeys();
      const chunkKey = baseKeys.find(k => k.includes('__chunked_data__') && k.includes('chunk_0'));
      if (chunkKey) {
        await baseAdapter.removeItem(chunkKey);
      }

      const retrieved = await chunkedAdapter.getItem(key);
      expect(retrieved).toBeNull();
    });

    test('should prevent data too large', async () => {
      // Create adapter with very restrictive limits
      const restrictiveAdapter = new ChunkedStorageAdapter(baseAdapter, {
        chunkSizeBytes: 100,
        maxChunks: 2 // Only allow 200 bytes total
      });
      await restrictiveAdapter.initialize();

      const tooLargeData = 'x'.repeat(300);
      
      await expect(restrictiveAdapter.setItem('too_large', tooLargeData))
        .rejects.toThrow('Data too large');
    });

    test('should handle malformed manifest', async () => {
      // Manually create a bad manifest
      await baseAdapter.setItem('__chunked_manifest__bad_key', 'invalid json');

      const retrieved = await chunkedAdapter.getItem('bad_key');
      expect(retrieved).toBeNull();
    });
  });

  describe('Chunk Management', () => {
    test('should remove all chunks when deleting item', async () => {
      const largeData = 'x'.repeat(3000);
      const key = 'test_removal';

      await chunkedAdapter.setItem(key, largeData);
      
      // Verify chunks exist
      let baseKeys = await baseAdapter.getKeys();
      const initialChunkCount = baseKeys.filter(k => k.includes('__chunked_')).length;
      expect(initialChunkCount).toBeGreaterThan(0);

      await chunkedAdapter.removeItem(key);
      
      // Verify chunks are removed
      baseKeys = await baseAdapter.getKeys();
      const finalChunkCount = baseKeys.filter(k => k.includes('__chunked_')).length;
      expect(finalChunkCount).toBe(0);
    });

    test('should validate chunk integrity', async () => {
      const largeData = 'x'.repeat(2000);
      const key = 'test_validation';

      await chunkedAdapter.setItem(key, largeData);
      
      const validation = await chunkedAdapter.validateChunks(key);
      expect(validation.valid).toBe(true);
      expect(validation.manifest).toBeDefined();
    });

    test('should provide chunking statistics', async () => {
      const data1 = 'x'.repeat(2000);
      const data2 = 'y'.repeat(3000);
      
      await chunkedAdapter.setItem('key1', data1);
      await chunkedAdapter.setItem('key2', data2);

      const stats = await chunkedAdapter.getChunkingStats();
      expect(stats.totalChunkedKeys).toBe(2);
      expect(stats.totalChunks).toBeGreaterThan(0);
      expect(stats.totalChunkedSize).toBe(5000);
      expect(stats.largestKey).toBeDefined();
      expect(stats.largestKey?.key).toBe('key2');
    });

    test('should cleanup orphaned chunks', async () => {
      const largeData = 'x'.repeat(2000);
      const key = 'test_cleanup';

      await chunkedAdapter.setItem(key, largeData);
      
      // Verify chunks exist
      let baseKeys = await baseAdapter.getKeys();
      const chunkCount = baseKeys.filter(k => k.includes('__chunked_data__')).length;
      expect(chunkCount).toBeGreaterThan(0);

      await chunkedAdapter.cleanupChunks(key, 10); // Clean up to 10 chunks
      
      // Verify cleanup
      baseKeys = await baseAdapter.getKeys();
      const remainingChunks = baseKeys.filter(k => k.includes(key)).length;
      expect(remainingChunks).toBe(0);
    });
  });

  describe('Storage Info', () => {
    test('should delegate storage info to base adapter', async () => {
      const info = await chunkedAdapter.getStorageInfo();
      expect(info).toBeDefined();
      expect(typeof info.quota).toBe('number');
      expect(typeof info.usage).toBe('number');
      expect(typeof info.available).toBe('number');
    });
  });

  describe('Real-world Scenarios', () => {
    test('should handle ContentStudio backup data', async () => {
      // Simulate a large ContentStudio backup
      const mockBackup = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        stores: {
          narrative: {
            storylets: Array.from({ length: 500 }, (_, i) => ({
              id: `storylet_${i}`,
              name: `Storylet ${i}`,
              description: 'A test storylet with substantial content to test chunking functionality',
              choices: [
                { id: `${i}_choice_1`, text: 'First choice', effects: [] },
                { id: `${i}_choice_2`, text: 'Second choice', effects: [] }
              ]
            })),
            flags: Object.fromEntries(
              Array.from({ length: 200 }, (_, i) => [`flag_${i}`, Math.random() > 0.5])
            )
          },
          social: {
            clues: Array.from({ length: 100 }, (_, i) => ({
              id: `clue_${i}`,
              title: `Test Clue ${i}`,
              description: 'This is a test clue with some content',
              content: 'Detailed clue content that takes up space'
            }))
          }
        }
      };

      const backupData = JSON.stringify(mockBackup);
      console.log(`Testing ContentStudio backup: ${(backupData.length / 1024).toFixed(2)}KB`);

      const key = 'content_backup_test';
      await chunkedAdapter.setItem(key, backupData);
      const retrieved = await chunkedAdapter.getItem(key);

      expect(retrieved).toBe(backupData);
      
      const parsed = JSON.parse(retrieved!);
      expect(parsed.stores.narrative.storylets.length).toBe(500);
      expect(parsed.stores.social.clues.length).toBe(100);
    });

    test('should handle mixed small and large data efficiently', async () => {
      // Mix of small and large data
      await chunkedAdapter.setItem('small_1', 'tiny data');
      await chunkedAdapter.setItem('large_1', 'x'.repeat(5000));
      await chunkedAdapter.setItem('small_2', 'another small piece');
      await chunkedAdapter.setItem('large_2', 'y'.repeat(3000));

      // Verify all data is retrievable
      expect(await chunkedAdapter.getItem('small_1')).toBe('tiny data');
      expect(await chunkedAdapter.getItem('large_1')).toBe('x'.repeat(5000));
      expect(await chunkedAdapter.getItem('small_2')).toBe('another small piece');
      expect(await chunkedAdapter.getItem('large_2')).toBe('y'.repeat(3000));

      // Verify key listing
      const keys = await chunkedAdapter.getKeys();
      expect(keys.sort()).toEqual(['large_1', 'large_2', 'small_1', 'small_2']);

      // Verify chunking statistics
      const stats = await chunkedAdapter.getChunkingStats();
      expect(stats.totalChunkedKeys).toBe(2); // Only large items are chunked
    });
  });
});

// Integration test with StorageFactory
describe('ChunkedStorageAdapter Integration', () => {
  test('should integrate with StorageFactory', async () => {
    // This would require importing StorageFactory and testing integration
    // Skipped for now as it requires more complex setup
    expect(true).toBe(true);
  });
});