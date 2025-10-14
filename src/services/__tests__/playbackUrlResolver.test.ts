// Unit tests for PlaybackUrlResolver

import { playbackUrlResolver, AudioSource, ResolutionResult } from '../playbackUrlResolver';
import { audioStorageManager } from '../audioStorageManager';
import { audioBlobManager } from '../audioBlobManager';
import { contentHashService } from '../contentHashService';

// Mock dependencies
jest.mock('../audioStorageManager');
jest.mock('../audioBlobManager');
jest.mock('../contentHashService');

// Mock fetch
global.fetch = jest.fn();

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false,
  },
  writable: true,
});

// Mock performance.now
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
  writable: true,
});

describe('PlaybackUrlResolver', () => {
  const mockAudioSource: AudioSource = {
    type: 'ipfs',
    identifier: 'QmTestHash123',
    qualities: [
      {
        format: 'high_quality',
        bitrate: '320kbps',
        size: 8000000,
        uri: 'ipfs://QmTestHash123_320'
      },
      {
        format: 'streaming',
        bitrate: '192kbps',
        size: 5000000,
        uri: 'ipfs://QmTestHash123_192'
      },
      {
        format: 'mobile',
        bitrate: '128kbps',
        size: 3000000,
        uri: 'ipfs://QmTestHash123_128'
      }
    ],
    metadata: {
      title: 'Test Song',
      artist: 'Test Artist',
      mimeType: 'audio/mpeg'
    }
  };

  const mockBlobUrl = 'blob:http://localhost:3000/test-blob';
  const mockHttpUrl = 'https://example.com/audio.mp3';
  const mockIPFSUrl = 'https://ipfs.io/ipfs/QmTestHash123';

  beforeEach(() => {
    jest.clearAllMocks();
    playbackUrlResolver.clearCache();

    // Setup default mocks
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });

    (audioBlobManager.getBlobUrl as jest.Mock).mockResolvedValue(null);
    (audioBlobManager.createBlobUrl as jest.Mock).mockReturnValue(mockBlobUrl);
    (audioBlobManager.recreateBlobUrl as jest.Mock).mockResolvedValue(mockBlobUrl);

    (audioStorageManager.getAudioFile as jest.Mock).mockResolvedValue(null);

    (contentHashService.extractHashFromURI as jest.Mock).mockReturnValue('QmTestHash123');
    (contentHashService.isValidHashFormat as jest.Mock).mockReturnValue(true);
  });

  describe('Resolution Strategies', () => {
    test('should resolve from blob cache', async () => {
      (audioBlobManager.getBlobUrl as jest.Mock).mockResolvedValue(mockBlobUrl);

      const result = await playbackUrlResolver.resolveAudioUrl(mockAudioSource);

      expect(result.url).toBe(mockBlobUrl);
      expect(result.strategy).toBe('blob_cache');
      expect(result.cached).toBe(true);
      expect(audioBlobManager.getBlobUrl).toHaveBeenCalledWith('QmTestHash123');
    });

    test('should resolve from storage direct', async () => {
      const mockStoredFile = {
        hash: 'QmTestHash123',
        audioData: new ArrayBuffer(1024),
        mimeType: 'audio/mpeg',
        originalName: 'test.mp3',
        size: 1024,
        metadata: {},
        uploadedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        storageLocation: 'indexeddb' as const
      };

      (audioStorageManager.getAudioFile as jest.Mock).mockResolvedValue(mockStoredFile);

      const result = await playbackUrlResolver.resolveAudioUrl(mockAudioSource);

      expect(result.url).toBe(mockBlobUrl);
      expect(result.strategy).toBe('storage_direct');
      expect(result.cached).toBe(false);
      expect(audioStorageManager.getAudioFile).toHaveBeenCalledWith('QmTestHash123');
      expect(audioBlobManager.createBlobUrl).toHaveBeenCalledWith(
        mockStoredFile.audioData,
        mockStoredFile.mimeType,
        mockStoredFile.hash
      );
    });

    test('should resolve from storage recreate', async () => {
      const mockStoredFile = {
        hash: 'QmTestHash123',
        audioData: new ArrayBuffer(1024),
        mimeType: 'audio/mpeg',
        originalName: 'test.mp3',
        size: 1024,
        metadata: {},
        uploadedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        storageLocation: 'indexeddb' as const
      };

      // Mock storage direct to fail, recreate to succeed
      (audioStorageManager.getAudioFile as jest.Mock)
        .mockResolvedValueOnce(null) // First call (storage_direct)
        .mockResolvedValueOnce(mockStoredFile); // Second call (storage_recreate)

      const result = await playbackUrlResolver.resolveAudioUrl(mockAudioSource);

      expect(result.url).toBe(mockBlobUrl);
      expect(result.strategy).toBe('storage_recreate');
      expect(audioBlobManager.recreateBlobUrl).toHaveBeenCalledWith(
        'QmTestHash123',
        mockStoredFile.audioData,
        mockStoredFile.mimeType
      );
    });

    test('should resolve from IPFS gateway', async () => {
      const result = await playbackUrlResolver.resolveAudioUrl(mockAudioSource);

      expect(result.url).toMatch(/^https:\/\/.*\/ipfs\/QmTestHash123$/);
      expect(result.strategy).toBe('ipfs_gateway');
      expect(result.cached).toBe(false);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/ipfs\/QmTestHash123$/),
        expect.objectContaining({ method: 'HEAD' })
      );
    });

    test('should resolve HTTP direct', async () => {
      const httpSource: AudioSource = {
        type: 'http',
        identifier: mockHttpUrl
      };

      const result = await playbackUrlResolver.resolveAudioUrl(httpSource);

      expect(result.url).toBe(mockHttpUrl);
      expect(result.strategy).toBe('http_direct');
      expect(fetch).toHaveBeenCalledWith(
        mockHttpUrl,
        expect.objectContaining({ method: 'HEAD' })
      );
    });

    test('should fallback to demo audio', async () => {
      // Mock all strategies to fail
      (audioBlobManager.getBlobUrl as jest.Mock).mockResolvedValue(null);
      (audioStorageManager.getAudioFile as jest.Mock).mockResolvedValue(null);
      (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });

      const result = await playbackUrlResolver.resolveAudioUrl(mockAudioSource);

      expect(result.strategy).toBe('fallback_demo');
      expect(result.url).toBe('https://www.soundjay.com/misc/sounds/bell-ringing-05.wav');
    });
  });

  describe('Quality Selection', () => {
    test('should select high quality for fast connection', () => {
      // Mock fast connection
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '4g',
          downlink: 15,
          rtt: 50,
          saveData: false,
        },
        writable: true,
      });

      const quality = playbackUrlResolver.getOptimalQuality(mockAudioSource.qualities);

      expect(quality?.format).toBe('high_quality');
      expect(quality?.bitrate).toBe('320kbps');
    });

    test('should select streaming quality for medium connection', () => {
      // Mock medium connection
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '3g',
          downlink: 5,
          rtt: 200,
          saveData: false,
        },
        writable: true,
      });

      const quality = playbackUrlResolver.getOptimalQuality(mockAudioSource.qualities);

      expect(quality?.format).toBe('streaming');
      expect(quality?.bitrate).toBe('192kbps');
    });

    test('should select mobile quality for slow connection', () => {
      // Mock slow connection
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.5,
          rtt: 500,
          saveData: true,
        },
        writable: true,
      });

      const quality = playbackUrlResolver.getOptimalQuality(mockAudioSource.qualities);

      expect(quality?.format).toBe('mobile');
      expect(quality?.bitrate).toBe('128kbps');
    });

    test('should return null for no qualities', () => {
      const quality = playbackUrlResolver.getOptimalQuality([]);
      expect(quality).toBeNull();
    });
  });

  describe('Retry Logic', () => {
    test('should retry on retryable errors', async () => {
      let callCount = 0;
      (audioBlobManager.getBlobUrl as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('NetworkError: Failed to fetch');
        }
        return mockBlobUrl;
      });

      const result = await playbackUrlResolver.resolveAudioUrl(mockAudioSource, {
        maxAttempts: 3,
        backoffMultiplier: 1,
        initialDelay: 10,
        maxDelay: 100
      });

      expect(result.url).toBe(mockBlobUrl);
      expect(callCount).toBe(3);
    });

    test('should not retry on non-retryable errors', async () => {
      (audioBlobManager.getBlobUrl as jest.Mock).mockRejectedValue(
        new Error('Invalid hash format')
      );

      await expect(playbackUrlResolver.resolveAudioUrl(mockAudioSource))
        .rejects.toThrow();

      expect(audioBlobManager.getBlobUrl).toHaveBeenCalledTimes(1);
    });

    test('should respect max attempts', async () => {
      (audioBlobManager.getBlobUrl as jest.Mock).mockRejectedValue(
        new Error('NetworkError: Failed to fetch')
      );

      await expect(playbackUrlResolver.resolveAudioUrl(mockAudioSource, {
        maxAttempts: 2,
        backoffMultiplier: 1,
        initialDelay: 10,
        maxDelay: 100
      })).rejects.toThrow();

      // Should try blob_cache twice, then move to next strategy
      expect(audioBlobManager.getBlobUrl).toHaveBeenCalledTimes(2);
    });
  });

  describe('Caching', () => {
    test('should cache successful resolutions', async () => {
      (audioBlobManager.getBlobUrl as jest.Mock).mockResolvedValue(mockBlobUrl);

      // First resolution
      const result1 = await playbackUrlResolver.resolveAudioUrl(mockAudioSource);
      
      // Second resolution should use cache
      const result2 = await playbackUrlResolver.resolveAudioUrl(mockAudioSource);

      expect(result1.url).toBe(mockBlobUrl);
      expect(result2.url).toBe(mockBlobUrl);
      expect(result2.cached).toBe(true);
      expect(audioBlobManager.getBlobUrl).toHaveBeenCalledTimes(1); // Only called once
    });

    test('should expire cache after TTL', async () => {
      (audioBlobManager.getBlobUrl as jest.Mock).mockResolvedValue(mockBlobUrl);

      // First resolution
      await playbackUrlResolver.resolveAudioUrl(mockAudioSource);

      // Mock time passing beyond TTL
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 6 * 60 * 1000); // 6 minutes later

      // Second resolution should not use cache
      const result2 = await playbackUrlResolver.resolveAudioUrl(mockAudioSource);

      expect(result2.cached).toBe(false);
      expect(audioBlobManager.getBlobUrl).toHaveBeenCalledTimes(2);

      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('URL Validation', () => {
    test('should validate accessible URLs', async () => {
      (fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });

      const isValid = await playbackUrlResolver.validateUrl(mockHttpUrl);

      expect(isValid).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        mockHttpUrl,
        expect.objectContaining({ method: 'HEAD' })
      );
    });

    test('should reject inaccessible URLs', async () => {
      (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });

      const isValid = await playbackUrlResolver.validateUrl(mockHttpUrl);

      expect(isValid).toBe(false);
    });

    test('should handle network errors in validation', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const isValid = await playbackUrlResolver.validateUrl(mockHttpUrl);

      expect(isValid).toBe(false);
    });
  });

  describe('Batch Operations', () => {
    test('should resolve multiple URLs', async () => {
      const sources: AudioSource[] = [
        { type: 'http', identifier: 'https://example.com/audio1.mp3' },
        { type: 'http', identifier: 'https://example.com/audio2.mp3' },
        { type: 'ipfs', identifier: 'QmTestHash456' }
      ];

      const results = await playbackUrlResolver.resolveMultipleUrls(sources);

      expect(results.size).toBe(3);
      expect(results.get('https://example.com/audio1.mp3')).toBeInstanceOf(Object);
      expect(results.get('https://example.com/audio2.mp3')).toBeInstanceOf(Object);
      expect(results.get('QmTestHash456')).toBeInstanceOf(Object);
    });

    test('should handle errors in batch resolution', async () => {
      const sources: AudioSource[] = [
        { type: 'http', identifier: 'https://example.com/good.mp3' },
        { type: 'http', identifier: 'https://example.com/bad.mp3' }
      ];

      // Mock one to succeed, one to fail
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({ ok: false, status: 404 });

      const results = await playbackUrlResolver.resolveMultipleUrls(sources);

      expect(results.size).toBe(2);
      expect(results.get('https://example.com/good.mp3')).toBeInstanceOf(Object);
      expect(results.get('https://example.com/bad.mp3')).toBeInstanceOf(Error);
    });
  });

  describe('Preloading', () => {
    test('should preload audio successfully', async () => {
      (audioBlobManager.getBlobUrl as jest.Mock).mockResolvedValue(mockBlobUrl);

      // Mock Audio constructor
      const mockAudio = {
        preload: '',
        src: ''
      };
      global.Audio = jest.fn(() => mockAudio) as any;

      await playbackUrlResolver.preloadAudio(mockAudioSource);

      expect(mockAudio.preload).toBe('metadata');
      expect(mockAudio.src).toBe(mockBlobUrl);
    });

    test('should handle preload errors gracefully', async () => {
      (audioBlobManager.getBlobUrl as jest.Mock).mockRejectedValue(
        new Error('Preload failed')
      );

      // Should not throw
      await expect(playbackUrlResolver.preloadAudio(mockAudioSource))
        .resolves.not.toThrow();
    });
  });

  describe('Statistics and Management', () => {
    test('should provide resolution statistics', () => {
      const stats = playbackUrlResolver.getResolutionStats();

      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('gatewayLatencies');
      expect(typeof stats.cacheSize).toBe('number');
      expect(typeof stats.gatewayLatencies).toBe('object');
    });

    test('should clear cache', () => {
      playbackUrlResolver.clearCache();
      
      const stats = playbackUrlResolver.getResolutionStats();
      expect(stats.cacheSize).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should throw error when all strategies fail', async () => {
      // Mock all strategies to fail
      (audioBlobManager.getBlobUrl as jest.Mock).mockResolvedValue(null);
      (audioStorageManager.getAudioFile as jest.Mock).mockResolvedValue(null);
      (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });

      // Mock fallback demo to also fail
      (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });

      await expect(playbackUrlResolver.resolveAudioUrl(mockAudioSource))
        .rejects.toThrow('Failed to resolve audio URL');
    });

    test('should handle invalid IPFS hash', async () => {
      (contentHashService.isValidHashFormat as jest.Mock).mockReturnValue(false);

      await expect(playbackUrlResolver.resolveAudioUrl(mockAudioSource))
        .rejects.toThrow('Invalid IPFS hash format');
    });
  });
});