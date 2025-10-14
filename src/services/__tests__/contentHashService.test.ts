// Unit tests for ContentHashService

import { contentHashService, HashResult } from '../contentHashService';

// Mock crypto.subtle for testing
const mockDigest = jest.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: mockDigest,
    },
  },
  writable: true,
});

// Mock performance for testing
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
  writable: true,
});

describe('ContentHashService', () => {
  const testData = new ArrayBuffer(1024);
  const testDataView = new Uint8Array(testData);
  
  // Fill with test pattern
  for (let i = 0; i < testDataView.length; i++) {
    testDataView[i] = i % 256;
  }

  const mockHashBuffer = new ArrayBuffer(32); // SHA-256 produces 32 bytes
  const mockHashView = new Uint8Array(mockHashBuffer);
  
  // Fill with predictable hash pattern
  for (let i = 0; i < mockHashView.length; i++) {
    mockHashView[i] = (i * 7) % 256;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    contentHashService.clearCache();
    
    // Mock crypto.subtle.digest to return predictable hash
    mockDigest.mockResolvedValue(mockHashBuffer);
  });

  describe('Hash Generation', () => {
    test('should generate hash from ArrayBuffer', async () => {
      const result = await contentHashService.generateHash(testData, 'test.mp3');

      expect(result).toBeDefined();
      expect(result.hash).toMatch(/^Qm[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{44}$/);
      expect(result.algorithm).toBe('sha256');
      expect(result.format).toBe('ipfs-compatible');
      expect(result.size).toBe(testData.byteLength);
      expect(result.timestamp).toBeDefined();
      expect(mockDigest).toHaveBeenCalledWith('SHA-256', testData);
    });

    test('should generate hash from File', async () => {
      const mockFile = new File([testData], 'test.mp3', { type: 'audio/mpeg' });
      
      // Mock File.arrayBuffer()
      jest.spyOn(mockFile, 'arrayBuffer').mockResolvedValue(testData);

      const result = await contentHashService.generateHashFromFile(mockFile);

      expect(result).toBeDefined();
      expect(result.hash).toMatch(/^Qm/);
      expect(result.size).toBe(testData.byteLength);
    });

    test('should generate hash from Blob', async () => {
      const mockBlob = new Blob([testData], { type: 'audio/mpeg' });
      
      // Mock Blob.arrayBuffer()
      jest.spyOn(mockBlob, 'arrayBuffer').mockResolvedValue(testData);

      const result = await contentHashService.generateHashFromBlob(mockBlob, 'test.mp3');

      expect(result).toBeDefined();
      expect(result.hash).toMatch(/^Qm/);
      expect(result.size).toBe(testData.byteLength);
    });

    test('should generate consistent hashes for same data', async () => {
      const result1 = await contentHashService.generateHash(testData, 'test1.mp3');
      const result2 = await contentHashService.generateHash(testData, 'test2.mp3');

      expect(result1.hash).toBe(result2.hash);
      expect(result1.algorithm).toBe(result2.algorithm);
    });

    test('should use cache for repeated hash generation', async () => {
      const filename = 'cached-test.mp3';
      
      const result1 = await contentHashService.generateHash(testData, filename);
      const result2 = await contentHashService.generateHash(testData, filename);

      expect(result1.hash).toBe(result2.hash);
      expect(mockDigest).toHaveBeenCalledTimes(1); // Should only call crypto once due to caching
    });
  });

  describe('Hash Validation', () => {
    test('should validate correct hash', async () => {
      const hashResult = await contentHashService.generateHash(testData, 'test.mp3');
      const validation = await contentHashService.validateHash(testData, hashResult.hash, 'test.mp3');

      expect(validation.isValid).toBe(true);
      expect(validation.expectedHash).toBe(hashResult.hash);
      expect(validation.actualHash).toBe(hashResult.hash);
      expect(validation.error).toBeUndefined();
    });

    test('should detect invalid hash', async () => {
      const fakeHash = 'QmInvalidHashThatDoesNotMatchTheActualContent123456';
      const validation = await contentHashService.validateHash(testData, fakeHash, 'test.mp3');

      expect(validation.isValid).toBe(false);
      expect(validation.expectedHash).toBe(fakeHash);
      expect(validation.error).toContain('Hash mismatch');
    });

    test('should handle validation errors gracefully', async () => {
      mockDigest.mockRejectedValue(new Error('Crypto error'));
      
      const validation = await contentHashService.validateHash(testData, 'QmSomeHash', 'test.mp3');

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('Validation failed');
    });
  });

  describe('Hash Format Validation', () => {
    test('should validate correct IPFS hash format', () => {
      const validHash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      expect(contentHashService.isValidHashFormat(validHash)).toBe(true);
    });

    test('should reject invalid hash formats', () => {
      const invalidHashes = [
        'InvalidHash',
        'Qm', // Too short
        'QmTooLongHashThatExceedsTheExpectedLengthForIPFSHashes123456789',
        'XmValidLengthButWrongPrefix123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
        'Qm!@#$%^&*()InvalidCharacters123456789ABCDEFGHJKLMNPQRSTUVWXYZ',
      ];

      invalidHashes.forEach(hash => {
        expect(contentHashService.isValidHashFormat(hash)).toBe(false);
      });
    });
  });

  describe('IPFS URI Handling', () => {
    test('should extract hash from IPFS URI', () => {
      const hash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const uri = `ipfs://${hash}`;
      
      const extractedHash = contentHashService.extractHashFromURI(uri);
      expect(extractedHash).toBe(hash);
    });

    test('should return null for invalid IPFS URI', () => {
      const invalidURIs = [
        'http://example.com/file.mp3',
        'ipfs://InvalidHash',
        'not-a-uri',
      ];

      invalidURIs.forEach(uri => {
        expect(contentHashService.extractHashFromURI(uri)).toBeNull();
      });
    });

    test('should create IPFS URI from hash', () => {
      const hash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const uri = contentHashService.createIPFSURI(hash);
      
      expect(uri).toBe(`ipfs://${hash}`);
    });

    test('should throw error for invalid hash when creating URI', () => {
      const invalidHash = 'InvalidHash';
      
      expect(() => {
        contentHashService.createIPFSURI(invalidHash);
      }).toThrow('Invalid hash format for IPFS URI');
    });
  });

  describe('Batch Operations', () => {
    test('should generate hashes for multiple files', async () => {
      const files = [
        new File([testData], 'file1.mp3', { type: 'audio/mpeg' }),
        new File([testData], 'file2.mp3', { type: 'audio/mpeg' }),
        new File([testData], 'file3.mp3', { type: 'audio/mpeg' }),
      ];

      // Mock File.arrayBuffer() for all files
      files.forEach(file => {
        jest.spyOn(file, 'arrayBuffer').mockResolvedValue(testData);
      });

      const results = await contentHashService.generateHashBatch(files);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.hash).toMatch(/^Qm/);
        expect(result.algorithm).toBe('sha256');
      });
    });

    test('should handle errors in batch processing', async () => {
      const files = [
        new File([testData], 'good-file.mp3', { type: 'audio/mpeg' }),
        new File([testData], 'bad-file.mp3', { type: 'audio/mpeg' }),
      ];

      // Mock first file to succeed, second to fail
      jest.spyOn(files[0], 'arrayBuffer').mockResolvedValue(testData);
      jest.spyOn(files[1], 'arrayBuffer').mockRejectedValue(new Error('File read error'));

      const results = await contentHashService.generateHashBatch(files);

      expect(results).toHaveLength(2);
      expect(results[0].hash).toMatch(/^Qm/);
      expect(results[1].hash).toBe(''); // Error case
    });
  });

  describe('Deterministic Hashing', () => {
    test('should generate deterministic hash with salt', async () => {
      const salt = 'test-salt';
      const result1 = await contentHashService.generateDeterministicHash(testData, salt);
      const result2 = await contentHashService.generateDeterministicHash(testData, salt);

      expect(result1.hash).toBe(result2.hash);
      expect(result1.hash).toMatch(/^Qm/);
    });

    test('should generate different hashes with different salts', async () => {
      const result1 = await contentHashService.generateDeterministicHash(testData, 'salt1');
      const result2 = await contentHashService.generateDeterministicHash(testData, 'salt2');

      expect(result1.hash).not.toBe(result2.hash);
    });
  });

  describe('Cache Management', () => {
    test('should provide cache statistics', () => {
      const stats = contentHashService.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
    });

    test('should clear cache', () => {
      contentHashService.clearCache();
      const stats = contentHashService.getCacheStats();
      
      expect(stats.size).toBe(0);
    });
  });

  describe('Hash Comparison and Info', () => {
    test('should compare hashes correctly', () => {
      const hash1 = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const hash2 = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const hash3 = 'QmDifferentHashValue123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqr';

      expect(contentHashService.compareHashes(hash1, hash2)).toBe(true);
      expect(contentHashService.compareHashes(hash1, hash3)).toBe(false);
    });

    test('should provide hash information', () => {
      const validHash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
      const info = contentHashService.getHashInfo(validHash);

      expect(info.isValid).toBe(true);
      expect(info.prefix).toBe('Qm');
      expect(info.length).toBe(46);
      expect(info.format).toBe('ipfs-compatible');
    });

    test('should provide info for invalid hash', () => {
      const invalidHash = 'InvalidHash';
      const info = contentHashService.getHashInfo(invalidHash);

      expect(info.isValid).toBe(false);
      expect(info.format).toBe('unknown');
    });
  });

  describe('Error Handling', () => {
    test('should handle crypto API errors', async () => {
      mockDigest.mockRejectedValue(new Error('Crypto API unavailable'));

      await expect(contentHashService.generateHash(testData, 'test.mp3'))
        .rejects.toThrow('Failed to generate hash');
    });

    test('should handle file reading errors', async () => {
      const mockFile = new File([testData], 'test.mp3', { type: 'audio/mpeg' });
      jest.spyOn(mockFile, 'arrayBuffer').mockRejectedValue(new Error('File read error'));

      await expect(contentHashService.generateHashFromFile(mockFile))
        .rejects.toThrow('Failed to generate hash from file');
    });
  });
});