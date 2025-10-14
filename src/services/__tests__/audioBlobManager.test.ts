// Unit tests for AudioBlobManager

import { audioBlobManager, BlobInfo } from '../audioBlobManager';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

Object.defineProperty(global.URL, 'createObjectURL', {
  value: mockCreateObjectURL,
  writable: true,
});

Object.defineProperty(global.URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
  writable: true,
});

// Mock fetch for URL validation
global.fetch = jest.fn();

// Mock timers
jest.useFakeTimers();

describe('AudioBlobManager', () => {
  const testAudioData = new ArrayBuffer(1024 * 1024); // 1MB
  const testMimeType = 'audio/mpeg';
  const testHash = 'QmTestHash123';
  const mockBlobUrl = 'blob:http://localhost:3000/test-blob-url';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the blob manager state
    audioBlobManager.clearAllBlobs();
    
    // Setup default mocks
    mockCreateObjectURL.mockReturnValue(mockBlobUrl);
    mockRevokeObjectURL.mockImplementation(() => {});
    
    // Mock fetch to return successful response for URL validation
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Blob URL Creation', () => {
    test('should create blob URL successfully', () => {
      const url = audioBlobManager.createBlobUrl(testAudioData, testMimeType, testHash);

      expect(url).toBe(mockBlobUrl);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      
      const blobInfo = audioBlobManager.getBlobInfo(testHash);
      expect(blobInfo).toBeTruthy();
      expect(blobInfo!.url).toBe(mockBlobUrl);
      expect(blobInfo!.hash).toBe(testHash);
      expect(blobInfo!.mimeType).toBe(testMimeType);
      expect(blobInfo!.size).toBe(testAudioData.byteLength);
      expect(blobInfo!.isActive).toBe(true);
      expect(blobInfo!.accessCount).toBe(1);
    });

    test('should reuse existing blob URL', () => {
      // Create initial blob URL
      const url1 = audioBlobManager.createBlobUrl(testAudioData, testMimeType, testHash);
      
      // Try to create again - should reuse
      const url2 = audioBlobManager.createBlobUrl(testAudioData, testMimeType, testHash);

      expect(url1).toBe(url2);
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1); // Only called once
      
      const blobInfo = audioBlobManager.getBlobInfo(testHash);
      expect(blobInfo!.accessCount).toBe(2); // Should increment access count
    });

    test('should handle blob creation errors', () => {
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error('Blob creation failed');
      });

      expect(() => {
        audioBlobManager.createBlobUrl(testAudioData, testMimeType, testHash);
      }).toThrow('Failed to create blob URL');
    });
  });

  describe('Blob URL Retrieval', () => {
    test('should retrieve existing blob URL', async () => {
      // Create blob URL first
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, testHash);
      
      const retrievedUrl = await audioBlobManager.getBlobUrl(testHash);

      expect(retrievedUrl).toBe(mockBlobUrl);
      
      const blobInfo = audioBlobManager.getBlobInfo(testHash);
      expect(blobInfo!.accessCount).toBe(2); // Initial creation + retrieval
    });

    test('should return null for non-existent blob', async () => {
      const retrievedUrl = await audioBlobManager.getBlobUrl('non-existent-hash');
      expect(retrievedUrl).toBeNull();
    });

    test('should handle invalid blob URLs', async () => {
      // Create blob URL first
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, testHash);
      
      // Mock fetch to return error (invalid URL)
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const retrievedUrl = await audioBlobManager.getBlobUrl(testHash);

      expect(retrievedUrl).toBeNull();
      
      const blobInfo = audioBlobManager.getBlobInfo(testHash);
      expect(blobInfo!.isActive).toBe(false); // Should be marked as inactive
    });
  });

  describe('Blob URL Recreation', () => {
    test('should recreate blob URL from cached data', async () => {
      // Create initial blob URL
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, testHash);
      
      // Mock new URL for recreation
      const newMockUrl = 'blob:http://localhost:3000/recreated-blob-url';
      mockCreateObjectURL.mockReturnValue(newMockUrl);

      const recreatedUrl = await audioBlobManager.recreateBlobUrl(testHash);

      expect(recreatedUrl).toBe(newMockUrl);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockBlobUrl); // Old URL revoked
      
      const blobInfo = audioBlobManager.getBlobInfo(testHash);
      expect(blobInfo!.url).toBe(newMockUrl);
      expect(blobInfo!.isActive).toBe(true);
    });

    test('should create new blob URL with provided data', async () => {
      const newHash = 'QmNewHash456';
      const newMockUrl = 'blob:http://localhost:3000/new-blob-url';
      mockCreateObjectURL.mockReturnValue(newMockUrl);

      const recreatedUrl = await audioBlobManager.recreateBlobUrl(
        newHash, 
        testAudioData, 
        testMimeType
      );

      expect(recreatedUrl).toBe(newMockUrl);
      
      const blobInfo = audioBlobManager.getBlobInfo(newHash);
      expect(blobInfo).toBeTruthy();
      expect(blobInfo!.url).toBe(newMockUrl);
    });

    test('should return null when no data available', async () => {
      const recreatedUrl = await audioBlobManager.recreateBlobUrl('non-existent-hash');
      expect(recreatedUrl).toBeNull();
    });
  });

  describe('Blob URL Revocation', () => {
    test('should revoke blob URL successfully', () => {
      // Create blob URL first
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, testHash);
      
      const revoked = audioBlobManager.revokeBlobUrl(testHash);

      expect(revoked).toBe(true);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockBlobUrl);
      
      const blobInfo = audioBlobManager.getBlobInfo(testHash);
      expect(blobInfo!.isActive).toBe(false);
    });

    test('should revoke blob URL by URL string', () => {
      // Create blob URL first
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, testHash);
      
      const revoked = audioBlobManager.revokeBlobUrlByUrl(mockBlobUrl);

      expect(revoked).toBe(true);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockBlobUrl);
    });

    test('should handle revocation of non-existent blob', () => {
      const revoked = audioBlobManager.revokeBlobUrl('non-existent-hash');
      expect(revoked).toBe(false);
    });
  });

  describe('Blob Statistics', () => {
    test('should provide accurate blob statistics', () => {
      // Create multiple blobs
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, 'hash1');
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, 'hash2');
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, 'hash3');

      const stats = audioBlobManager.getBlobStats();

      expect(stats.totalBlobs).toBe(3);
      expect(stats.activeBlobs).toBe(3);
      expect(stats.totalSize).toBe(testAudioData.byteLength * 3);
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.oldestBlob).toBeDefined();
      expect(stats.newestBlob).toBeDefined();
    });

    test('should list blobs sorted by access time', () => {
      // Create blobs with different access patterns
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, 'hash1');
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, 'hash2');
      
      // Access hash1 again to change its access time
      audioBlobManager.updateBlobAccess('hash1');

      const blobs = audioBlobManager.listBlobs();

      expect(blobs).toHaveLength(2);
      expect(blobs[0].hash).toBe('hash1'); // Most recently accessed
      expect(blobs[1].hash).toBe('hash2');
    });
  });

  describe('Cleanup Operations', () => {
    test('should cleanup expired blobs', () => {
      // Create blob
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, testHash);
      
      // Fast-forward time to make blob expired
      const originalDate = Date.now;
      Date.now = jest.fn(() => originalDate() + 35 * 60 * 1000); // 35 minutes later

      const cleanedCount = audioBlobManager.cleanupExpiredBlobs();

      expect(cleanedCount).toBe(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockBlobUrl);
      
      // Restore Date.now
      Date.now = originalDate;
    });

    test('should enforce cache size limit', () => {
      // Create more blobs than the cache limit (assuming limit is 50)
      const hashes: string[] = [];
      for (let i = 0; i < 55; i++) {
        const hash = `QmTestHash${i}`;
        hashes.push(hash);
        audioBlobManager.createBlobUrl(testAudioData, testMimeType, hash);
      }

      const stats = audioBlobManager.getBlobStats();
      expect(stats.totalBlobs).toBeLessThanOrEqual(50); // Should enforce limit
    });

    test('should clear all blobs', () => {
      // Create multiple blobs
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, 'hash1');
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, 'hash2');

      audioBlobManager.clearAllBlobs();

      const stats = audioBlobManager.getBlobStats();
      expect(stats.totalBlobs).toBe(0);
      expect(stats.activeBlobs).toBe(0);
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(2);
    });
  });

  describe('Batch Operations', () => {
    test('should batch create blob URLs', () => {
      const items = [
        { hash: 'hash1', audioData: testAudioData, mimeType: testMimeType },
        { hash: 'hash2', audioData: testAudioData, mimeType: testMimeType },
        { hash: 'hash3', audioData: testAudioData, mimeType: testMimeType },
      ];

      const results = audioBlobManager.batchCreateBlobUrls(items);

      expect(results.size).toBe(3);
      expect(results.get('hash1')).toBe(mockBlobUrl);
      expect(results.get('hash2')).toBe(mockBlobUrl);
      expect(results.get('hash3')).toBe(mockBlobUrl);
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(3);
    });

    test('should handle errors in batch creation', () => {
      mockCreateObjectURL.mockImplementationOnce(() => {
        throw new Error('Blob creation failed');
      });

      const items = [
        { hash: 'hash1', audioData: testAudioData, mimeType: testMimeType },
        { hash: 'hash2', audioData: testAudioData, mimeType: testMimeType },
      ];

      const results = audioBlobManager.batchCreateBlobUrls(items);

      expect(results.size).toBe(1); // Only one should succeed
      expect(results.has('hash2')).toBe(true);
      expect(results.has('hash1')).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    test('should check if blob exists', () => {
      expect(audioBlobManager.hasBlob(testHash)).toBe(false);
      
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, testHash);
      expect(audioBlobManager.hasBlob(testHash)).toBe(true);
      
      audioBlobManager.revokeBlobUrl(testHash);
      expect(audioBlobManager.hasBlob(testHash)).toBe(false);
    });

    test('should get blob directly', () => {
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, testHash);
      
      const blob = audioBlobManager.getBlob(testHash);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob!.size).toBe(testAudioData.byteLength);
      expect(blob!.type).toBe(testMimeType);
    });

    test('should update blob access', () => {
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, testHash);
      
      const initialInfo = audioBlobManager.getBlobInfo(testHash)!;
      const initialAccessCount = initialInfo.accessCount;
      
      audioBlobManager.updateBlobAccess(testHash);
      
      const updatedInfo = audioBlobManager.getBlobInfo(testHash)!;
      expect(updatedInfo.accessCount).toBe(initialAccessCount + 1);
    });

    test('should get most accessed blobs', () => {
      // Create blobs with different access patterns
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, 'hash1');
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, 'hash2');
      
      // Access hash2 multiple times
      audioBlobManager.updateBlobAccess('hash2');
      audioBlobManager.updateBlobAccess('hash2');

      const mostAccessed = audioBlobManager.getMostAccessedBlobs(1);
      
      expect(mostAccessed).toHaveLength(1);
      expect(mostAccessed[0].hash).toBe('hash2');
    });

    test('should get recent blobs', () => {
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, 'hash1');
      
      // Wait a bit and create another
      setTimeout(() => {
        audioBlobManager.createBlobUrl(testAudioData, testMimeType, 'hash2');
      }, 100);

      jest.advanceTimersByTime(100);

      const recent = audioBlobManager.getRecentBlobs(1);
      
      expect(recent).toHaveLength(1);
      expect(recent[0].hash).toBe('hash2'); // Most recent
    });
  });

  describe('Automatic Cleanup', () => {
    test('should run automatic cleanup', () => {
      // Create an expired blob
      audioBlobManager.createBlobUrl(testAudioData, testMimeType, testHash);
      
      // Mock the blob as expired
      const blobInfo = audioBlobManager.getBlobInfo(testHash)!;
      blobInfo.createdAt = new Date(Date.now() - 35 * 60 * 1000).toISOString(); // 35 minutes ago

      // Fast-forward the cleanup timer
      jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes

      // The blob should be cleaned up automatically
      const stats = audioBlobManager.getBlobStats();
      expect(stats.activeBlobs).toBe(0);
    });
  });
});