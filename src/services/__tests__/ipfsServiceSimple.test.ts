// Unit tests for Enhanced IPFS Service

import { simpleIPFSService, UploadProgress } from '../ipfsServiceSimple';
import { audioStorageManager } from '../audioStorageManager';
import { contentHashService } from '../contentHashService';
import { playbackUrlResolver } from '../playbackUrlResolver';
import { audioBlobManager } from '../audioBlobManager';

// Mock dependencies
jest.mock('../audioStorageManager');
jest.mock('../contentHashService');
jest.mock('../playbackUrlResolver');
jest.mock('../audioBlobManager');

// Mock File and Blob APIs
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  
  constructor(chunks: any[], filename: string, options: any = {}) {
    this.name = filename;
    this.size = chunks.reduce((size, chunk) => size + chunk.length, 0);
    this.type = options.type || '';
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return new ArrayBuffer(this.size);
  }
} as any;

// Mock Audio constructor for metadata extraction
global.Audio = jest.fn(() => ({
  addEventListener: jest.fn(),
  src: '',
  duration: 180,
})) as any;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('Enhanced IPFS Service', () => {
  const mockFile = new File(['test audio data'], 'test-song.mp3', { type: 'audio/mpeg' });
  const mockHash = 'QmTestHash123456789';
  const mockBlobUrl = 'blob:mock-blob-url';
  const mockIPFSUrl = 'https://ipfs.io/ipfs/QmTestHash123456789';

  const mockStoredFile = {
    hash: mockHash,
    originalName: 'test-song.mp3',
    mimeType: 'audio/mpeg',
    size: 1024 * 1024,
    audioData: new ArrayBuffer(1024 * 1024),
    metadata: {
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      duration: 180,
      format: 'MP3',
      bitrate: 192,
      sampleRate: 44100,
      channels: 2
    },
    uploadedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    storageLocation: 'indexeddb' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (contentHashService.generateHashFromFile as jest.Mock).mockResolvedValue({
      hash: mockHash,
      algorithm: 'sha256',
      format: 'ipfs-compatible',
      size: mockFile.size,
      timestamp: new Date().toISOString()
    });

    (contentHashService.createIPFSURI as jest.Mock).mockReturnValue(`ipfs://${mockHash}`);

    (audioStorageManager.storeAudioFile as jest.Mock).mockResolvedValue(undefined);
    (audioStorageManager.getAudioFile as jest.Mock).mockResolvedValue(mockStoredFile);
    (audioStorageManager.listAudioFiles as jest.Mock).mockResolvedValue([mockStoredFile]);
    (audioStorageManager.clearAllFiles as jest.Mock).mockResolvedValue(undefined);
    (audioStorageManager.cleanupOldFiles as jest.Mock).mockResolvedValue(5);
    (audioStorageManager.getStorageStats as jest.Mock).mockResolvedValue({
      totalFiles: 1,
      totalSize: mockFile.size,
      quota: { used: 1024, available: 1024 * 1024, total: 1024 * 1024 + 1024, percentage: 0.1 }
    });

    (audioBlobManager.createBlobUrl as jest.Mock).mockReturnValue(mockBlobUrl);
    (audioBlobManager.getBlobUrl as jest.Mock).mockResolvedValue(mockBlobUrl);
    (audioBlobManager.clearAllBlobs as jest.Mock).mockImplementation(() => {});
    (audioBlobManager.getBlobStats as jest.Mock).mockReturnValue({
      totalBlobs: 1,
      activeBlobs: 1,
      totalSize: mockFile.size,
      memoryUsage: mockFile.size
    });

    (playbackUrlResolver.resolveAudioUrl as jest.Mock).mockResolvedValue({
      url: mockIPFSUrl,
      strategy: 'ipfs_gateway',
      quality: null,
      cached: false,
      latency: 100
    });
    (playbackUrlResolver.preloadAudio as jest.Mock).mockResolvedValue(undefined);
    (playbackUrlResolver.clearCache as jest.Mock).mockImplementation(() => {});
    (playbackUrlResolver.getResolutionStats as jest.Mock).mockReturnValue({
      cacheSize: 0,
      gatewayLatencies: {}
    });

    (contentHashService.clearCache as jest.Mock).mockImplementation(() => {});
    (contentHashService.getCacheStats as jest.Mock).mockReturnValue({
      size: 0,
      maxSize: 100
    });
  });

  describe('File Upload', () => {
    test('should upload file with enhanced storage', async () => {
      const progressCallback = jest.fn();
      
      const hash = await simpleIPFSService.uploadFile(mockFile, progressCallback);

      expect(hash).toBe(mockHash);
      expect(contentHashService.generateHashFromFile).toHaveBeenCalledWith(mockFile);
      expect(audioStorageManager.storeAudioFile).toHaveBeenCalledWith(
        expect.objectContaining({
          hash: mockHash,
          originalName: mockFile.name,
          mimeType: mockFile.type,
          size: mockFile.size,
          audioData: expect.any(ArrayBuffer)
        })
      );
      expect(audioBlobManager.createBlobUrl).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        mockFile.type,
        mockHash
      );

      // Check progress callbacks
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({ stage: 'preparing', progress: 10 })
      );
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({ stage: 'complete', progress: 100 })
      );
    });

    test('should handle upload errors gracefully', async () => {
      (contentHashService.generateHashFromFile as jest.Mock).mockRejectedValue(
        new Error('Hash generation failed')
      );

      const progressCallback = jest.fn();

      await expect(simpleIPFSService.uploadFile(mockFile, progressCallback))
        .rejects.toThrow('Hash generation failed');

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({ 
          stage: 'complete', 
          progress: 0,
          message: expect.stringContaining('Upload failed')
        })
      );
    });

    test('should validate file types', async () => {
      const invalidFile = new File(['invalid'], 'test.txt', { type: 'text/plain' });

      await expect(simpleIPFSService.uploadFile(invalidFile))
        .rejects.toThrow('Invalid file type');
    });

    test('should validate file size', async () => {
      const largeFile = new File([new ArrayBuffer(200 * 1024 * 1024)], 'large.mp3', { 
        type: 'audio/mpeg' 
      });

      await expect(simpleIPFSService.uploadFile(largeFile))
        .rejects.toThrow('File too large');
    });
  });

  describe('URL Resolution', () => {
    test('should resolve optimal gateway URL', async () => {
      const url = await simpleIPFSService.getOptimalGatewayUrl(mockHash);

      expect(url).toBe(mockIPFSUrl);
      expect(playbackUrlResolver.resolveAudioUrl).toHaveBeenCalledWith({
        type: 'ipfs',
        identifier: mockHash
      });
    });

    test('should fallback to demo audio on resolution failure', async () => {
      (playbackUrlResolver.resolveAudioUrl as jest.Mock).mockRejectedValue(
        new Error('Resolution failed')
      );

      const url = await simpleIPFSService.getOptimalGatewayUrl(mockHash);

      expect(url).toBe('https://www.soundjay.com/misc/sounds/bell-ringing-05.wav');
    });
  });

  describe('Audio Processing', () => {
    test('should process audio file with enhanced metadata', async () => {
      const progressCallback = jest.fn();

      const result = await simpleIPFSService.processAudioFile(mockFile, progressCallback);

      expect(result.metadata.title).toBe('Test Song');
      expect(result.metadata.artist).toBe('Test Artist');
      expect(result.metadata.ipfs_hashes.high_quality.uri).toBe(`ipfs://${mockHash}`);
      expect(result.metadata.ipfs_hashes.streaming.uri).toBe(`ipfs://${mockHash}`);
      expect(result.metadata.ipfs_hashes.mobile.uri).toBe(`ipfs://${mockHash}`);
      
      expect(result.ipfsHashes).toEqual(result.metadata.ipfs_hashes);
      expect(contentHashService.createIPFSURI).toHaveBeenCalledWith(mockHash);
    });

    test('should handle processing errors', async () => {
      (audioStorageManager.getAudioFile as jest.Mock).mockResolvedValue(null);

      await expect(simpleIPFSService.processAudioFile(mockFile))
        .rejects.toThrow('Failed to retrieve stored audio file');
    });
  });

  describe('Audio Validation and Access', () => {
    test('should validate audio access from storage', async () => {
      const hasAccess = await simpleIPFSService.validateAudioAccess(mockHash);

      expect(hasAccess).toBe(true);
      expect(audioStorageManager.getAudioFile).toHaveBeenCalledWith(mockHash);
    });

    test('should validate audio access from blob cache', async () => {
      (audioStorageManager.getAudioFile as jest.Mock).mockResolvedValue(null);

      const hasAccess = await simpleIPFSService.validateAudioAccess(mockHash);

      expect(hasAccess).toBe(true);
      expect(audioBlobManager.getBlobUrl).toHaveBeenCalledWith(mockHash);
    });

    test('should validate audio access via IPFS resolution', async () => {
      (audioStorageManager.getAudioFile as jest.Mock).mockResolvedValue(null);
      (audioBlobManager.getBlobUrl as jest.Mock).mockResolvedValue(null);

      const hasAccess = await simpleIPFSService.validateAudioAccess(mockHash);

      expect(hasAccess).toBe(true);
      expect(playbackUrlResolver.resolveAudioUrl).toHaveBeenCalledWith({
        type: 'ipfs',
        identifier: mockHash
      });
    });

    test('should return false for inaccessible audio', async () => {
      (audioStorageManager.getAudioFile as jest.Mock).mockResolvedValue(null);
      (audioBlobManager.getBlobUrl as jest.Mock).mockResolvedValue(null);
      (playbackUrlResolver.resolveAudioUrl as jest.Mock).mockResolvedValue({
        strategy: 'fallback_demo'
      });

      const hasAccess = await simpleIPFSService.validateAudioAccess(mockHash);

      expect(hasAccess).toBe(false);
    });

    test('should handle validation errors', async () => {
      (audioStorageManager.getAudioFile as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const hasAccess = await simpleIPFSService.validateAudioAccess(mockHash);

      expect(hasAccess).toBe(false);
    });
  });

  describe('Preloading', () => {
    test('should preload audio successfully', async () => {
      await simpleIPFSService.preloadAudio(mockHash);

      expect(playbackUrlResolver.preloadAudio).toHaveBeenCalledWith({
        type: 'ipfs',
        identifier: mockHash
      });
    });

    test('should handle preload errors gracefully', async () => {
      (playbackUrlResolver.preloadAudio as jest.Mock).mockRejectedValue(
        new Error('Preload failed')
      );

      // Should not throw
      await expect(simpleIPFSService.preloadAudio(mockHash))
        .resolves.not.toThrow();
    });
  });

  describe('Cache Management', () => {
    test('should get cached files from enhanced storage', async () => {
      const files = await simpleIPFSService.getCachedFiles();

      expect(files).toHaveLength(1);
      expect(files[0]).toEqual({
        hash: mockHash,
        name: 'test-song.mp3',
        size: mockStoredFile.size,
        uploadedAt: mockStoredFile.uploadedAt
      });
      expect(audioStorageManager.listAudioFiles).toHaveBeenCalled();
    });

    test('should handle errors when getting cached files', async () => {
      (audioStorageManager.listAudioFiles as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const files = await simpleIPFSService.getCachedFiles();

      expect(files).toEqual([]);
    });

    test('should clear all caches', async () => {
      await simpleIPFSService.clearCache();

      expect(audioStorageManager.clearAllFiles).toHaveBeenCalled();
      expect(audioBlobManager.clearAllBlobs).toHaveBeenCalled();
      expect(playbackUrlResolver.clearCache).toHaveBeenCalled();
      expect(contentHashService.clearCache).toHaveBeenCalled();
    });

    test('should handle cache clearing errors', async () => {
      (audioStorageManager.clearAllFiles as jest.Mock).mockRejectedValue(
        new Error('Clear failed')
      );

      // Should not throw
      await expect(simpleIPFSService.clearCache()).resolves.not.toThrow();
    });

    test('should cleanup old files', async () => {
      const deletedCount = await simpleIPFSService.cleanupOldFiles(30 * 24 * 60 * 60 * 1000);

      expect(deletedCount).toBe(5);
      expect(audioStorageManager.cleanupOldFiles).toHaveBeenCalledWith(30 * 24 * 60 * 60 * 1000);
    });

    test('should handle cleanup errors', async () => {
      (audioStorageManager.cleanupOldFiles as jest.Mock).mockRejectedValue(
        new Error('Cleanup failed')
      );

      const deletedCount = await simpleIPFSService.cleanupOldFiles();

      expect(deletedCount).toBe(0);
    });
  });

  describe('Storage Statistics', () => {
    test('should get comprehensive storage statistics', async () => {
      const stats = await simpleIPFSService.getStorageStats();

      expect(stats.audioStorage).toBeDefined();
      expect(stats.blobManager).toBeDefined();
      expect(stats.resolver).toBeDefined();
      expect(stats.hashService).toBeDefined();

      expect(audioStorageManager.getStorageStats).toHaveBeenCalled();
      expect(audioBlobManager.getBlobStats).toHaveBeenCalled();
      expect(playbackUrlResolver.getResolutionStats).toHaveBeenCalled();
      expect(contentHashService.getCacheStats).toHaveBeenCalled();
    });

    test('should handle statistics errors', async () => {
      (audioStorageManager.getStorageStats as jest.Mock).mockRejectedValue(
        new Error('Stats error')
      );

      const stats = await simpleIPFSService.getStorageStats();

      expect(stats.audioStorage).toBeNull();
      expect(stats.blobManager).toBeNull();
      expect(stats.resolver).toBeNull();
      expect(stats.hashService).toBeNull();
    });
  });

  describe('Metadata Extraction', () => {
    test('should extract audio metadata', async () => {
      // Mock Audio element behavior
      const mockAudio = {
        addEventListener: jest.fn((event, callback) => {
          if (event === 'loadedmetadata') {
            setTimeout(() => callback(), 10);
          }
        }),
        duration: 180,
        src: ''
      };
      
      global.Audio = jest.fn(() => mockAudio) as any;
      global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
      global.URL.revokeObjectURL = jest.fn();

      // Access private method through any cast for testing
      const metadata = await (simpleIPFSService as any).extractAudioMetadata(mockFile);

      expect(metadata.duration).toBe(180);
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    test('should handle metadata extraction errors', async () => {
      const mockAudio = {
        addEventListener: jest.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(() => callback(), 10);
          }
        }),
        src: ''
      };
      
      global.Audio = jest.fn(() => mockAudio) as any;

      const metadata = await (simpleIPFSService as any).extractAudioMetadata(mockFile);

      expect(metadata.duration).toBe(0);
    });

    test('should handle metadata extraction timeout', async () => {
      const mockAudio = {
        addEventListener: jest.fn(),
        src: ''
      };
      
      global.Audio = jest.fn(() => mockAudio) as any;

      const metadata = await (simpleIPFSService as any).extractAudioMetadata(mockFile);

      expect(metadata.duration).toBe(0);
    });
  });

  describe('Audio Format Detection', () => {
    test('should detect MP3 format', () => {
      const format = (simpleIPFSService as any).getAudioFormat('audio/mpeg');
      expect(format).toBe('MP3');
    });

    test('should detect AAC format', () => {
      const format = (simpleIPFSService as any).getAudioFormat('audio/aac');
      expect(format).toBe('AAC');
    });

    test('should detect WAV format', () => {
      const format = (simpleIPFSService as any).getAudioFormat('audio/wav');
      expect(format).toBe('WAV');
    });

    test('should default to MP3 for unknown formats', () => {
      const format = (simpleIPFSService as any).getAudioFormat('audio/unknown');
      expect(format).toBe('MP3');
    });
  });

  describe('Progress Tracking', () => {
    test('should track upload progress correctly', async () => {
      const progressCallback = jest.fn();

      await simpleIPFSService.uploadFile(mockFile, progressCallback);

      const progressCalls = progressCallback.mock.calls.map(call => call[0]);
      
      expect(progressCalls).toContainEqual(
        expect.objectContaining({ stage: 'preparing', progress: 10 })
      );
      expect(progressCalls).toContainEqual(
        expect.objectContaining({ stage: 'uploading', progress: 30 })
      );
      expect(progressCalls).toContainEqual(
        expect.objectContaining({ stage: 'processing', progress: 50 })
      );
      expect(progressCalls).toContainEqual(
        expect.objectContaining({ stage: 'processing', progress: 70 })
      );
      expect(progressCalls).toContainEqual(
        expect.objectContaining({ stage: 'pinning', progress: 85 })
      );
      expect(progressCalls).toContainEqual(
        expect.objectContaining({ stage: 'complete', progress: 100 })
      );
    });
  });
});