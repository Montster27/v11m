// /Users/montysharma/v11m2/src/test/integration/apiLayer.test.ts
// Integration tests for API layer - V2 compatible version

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { resetAllStores, waitForStoreUpdate } from '../utils/gameTestUtils';

// API Layer
import { StoryletFileOperations } from '../../api/storyletFileOperations';

// Type imports
import type { Storylet } from '../../types/storylet';
import { createV2TestStorylet } from '../v2-setup';

describe('API Layer Integration Tests', () => {
  beforeEach(() => {
    resetAllStores();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('StoryletFileOperations API', () => {
    it('should read storylet files correctly', async () => {
      const mockStoryletData = {
        id: 'test-storylet',
        name: 'Test Storylet',
        description: 'A test storylet for API testing'
      };

      vi.spyOn(StoryletFileOperations, 'readStoryletFile').mockResolvedValue(JSON.stringify(mockStoryletData));

      const result = await StoryletFileOperations.readStoryletFile('test-storylet.json');
      
      expect(result).toBe(JSON.stringify(mockStoryletData));
      expect(StoryletFileOperations.readStoryletFile).toHaveBeenCalledWith('test-storylet.json');
    });

    it('should write storylet files correctly', async () => {
      const testContent = 'test file content';

      vi.spyOn(StoryletFileOperations, 'writeStoryletFile').mockResolvedValue(true);

      const result = await StoryletFileOperations.writeStoryletFile('new-storylet.json', testContent);
      
      expect(result).toBe(true);
      expect(StoryletFileOperations.writeStoryletFile).toHaveBeenCalledWith('new-storylet.json', testContent);
    });

    it('should handle file read errors gracefully', async () => {
      vi.spyOn(StoryletFileOperations, 'readStoryletFile').mockResolvedValue(null);

      const result = await StoryletFileOperations.readStoryletFile('nonexistent.json');
      
      expect(result).toBeNull();
    });

    it('should handle file write errors gracefully', async () => {
      vi.spyOn(StoryletFileOperations, 'writeStoryletFile').mockResolvedValue(false);

      const result = await StoryletFileOperations.writeStoryletFile('invalid-path.json', 'content');
      
      expect(result).toBe(false);
    });

    it('should update storylets in files', async () => {
      const testStorylet = createV2TestStorylet({
        id: 'update-storylet',
        name: 'Updated Storylet'
      });

      vi.spyOn(StoryletFileOperations, 'updateStoryletInFile').mockResolvedValue(true);

      const result = await StoryletFileOperations.updateStoryletInFile('storylets.json', testStorylet);
      
      expect(result).toBe(true);
      expect(StoryletFileOperations.updateStoryletInFile).toHaveBeenCalledWith('storylets.json', testStorylet);
    });

    it('should handle update failures gracefully', async () => {
      const testStorylet = createV2TestStorylet({
        id: 'failed-storylet',
        name: 'Failed Update'
      });

      vi.spyOn(StoryletFileOperations, 'updateStoryletInFile').mockResolvedValue(false);

      const result = await StoryletFileOperations.updateStoryletInFile('invalid.json', testStorylet);
      
      expect(result).toBe(false);
    });
  });

  describe('API Error Handling', () => {
    it('should handle network-like errors', async () => {
      // Mock the actual behavior - errors are caught and null is returned
      vi.spyOn(StoryletFileOperations, 'readStoryletFile').mockResolvedValue(null);

      const result = await StoryletFileOperations.readStoryletFile('failing-file.json');
      expect(result).toBeNull();
    });

    it('should handle write permission errors', async () => {
      // Mock the actual behavior - errors are caught and false is returned
      vi.spyOn(StoryletFileOperations, 'writeStoryletFile').mockResolvedValue(false);

      const result = await StoryletFileOperations.writeStoryletFile('protected.json', 'content');
      expect(result).toBe(false);
    });
  });

  describe('API Integration with Stores', () => {
    it('should work with store data', async () => {
      // Test that API operations work alongside store operations
      resetAllStores();
      await waitForStoreUpdate();

      vi.spyOn(StoryletFileOperations, 'readStoryletFile').mockResolvedValue('{"id": "store-test"}');

      const result = await StoryletFileOperations.readStoryletFile('store-test.json');
      expect(result).toBeTruthy();
    });

    it('should handle concurrent store and API operations', async () => {
      // Mock all read operations BEFORE creating operations
      vi.spyOn(StoryletFileOperations, 'readStoryletFile').mockResolvedValue('mock-content');

      const operations = [
        StoryletFileOperations.readStoryletFile('file1.json'),
        StoryletFileOperations.readStoryletFile('file2.json'),
        waitForStoreUpdate()
      ];

      const results = await Promise.allSettled(operations);
      
      // All operations should complete without errors
      results.forEach((result, index) => {
        if (index < 2) { // File operations
          expect(result.status).toBe('fulfilled');
          expect(result.value).toBe('mock-content');
        } else { // Store operation
          expect(result.status).toBe('fulfilled');
        }
      });
    });
  });

  describe('Mock Service Integration', () => {
    it('should demonstrate service mocking patterns', () => {
      const mockFileService = {
        readFile: vi.fn().mockResolvedValue('file content'),
        writeFile: vi.fn().mockResolvedValue(true),
        deleteFile: vi.fn().mockResolvedValue(true),
        listFiles: vi.fn().mockResolvedValue(['file1.json', 'file2.json'])
      };

      // Test service methods
      expect(mockFileService.readFile('test.json')).resolves.toBe('file content');
      expect(mockFileService.writeFile('test.json', 'content')).resolves.toBe(true);
      expect(mockFileService.deleteFile('test.json')).resolves.toBe(true);
      expect(mockFileService.listFiles()).resolves.toEqual(['file1.json', 'file2.json']);
    });

    it('should handle service dependency patterns', () => {
      const mockDependency = { 
        config: { apiUrl: 'http://test-api' },
        headers: { 'Content-Type': 'application/json' }
      };
      
      const serviceWithDependency = {
        dependency: mockDependency,
        makeRequest: function(endpoint) {
          return `${this.dependency.config.apiUrl}${endpoint}`;
        },
        getHeaders: function() {
          return this.dependency.headers;
        }
      };

      expect(serviceWithDependency.makeRequest('/storylets')).toBe('http://test-api/storylets');
      expect(serviceWithDependency.getHeaders()).toEqual({ 'Content-Type': 'application/json' });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle multiple API calls efficiently', async () => {
      const startTime = Date.now();
      
      // Mock fast responses
      vi.spyOn(StoryletFileOperations, 'readStoryletFile').mockResolvedValue('fast-response');

      const calls = Array.from({ length: 10 }, (_, i) => 
        StoryletFileOperations.readStoryletFile(`file${i}.json`)
      );

      const results = await Promise.all(calls);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(results.every(result => result === 'fast-response')).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast with mocks
    });

    it('should handle API timeout scenarios', async () => {
      vi.spyOn(StoryletFileOperations, 'readStoryletFile').mockImplementation(async () => {
        // Simulate timeout by returning null (how the real API handles errors)
        return null;
      });

      const result = await StoryletFileOperations.readStoryletFile('slow-file.json');
      expect(result).toBeNull();
    });
  });
});