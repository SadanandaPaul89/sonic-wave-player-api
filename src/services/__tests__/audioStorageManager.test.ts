// Unit tests for AudioStorageManager

import { audioStorageManager, StoredAudioFile, AudioMetadata } from '../audioStorageManager';

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

const mockIDBDatabase = {
  createObjectStore: jest.fn(),
  transaction: jest.fn(),
  close: jest.fn(),
};

const mockIDBTransaction = {
  objectStore: jest.fn(),
  oncomplete: null,
  onerror: null,
  onabort: null,
};

const mockIDBObjectStore = {
  put: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  createIndex: jest.fn(),
};

const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
};

// Setup mocks
beforeAll(() => {
  // Mock IndexedDB
  Object.defineProperty(window, 'indexedDB', {
    value: mockIndexedDB,
    writable: true,
  });

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Mock navigator.storage
  Object.defineProperty(navigator, 'storage', {
    value: {
      estimate: jest.fn().mockResolvedValue({
        usage: 1024 * 1024 * 10, // 10MB
        quota: 1024 * 1024 * 100, // 100MB
      }),
    },
    writable: true,
  });
});

describe('AudioStorageManager', () => {
  const mockAudioFile: Omit<StoredAudioFile, 'storageLocation' | 'uploadedAt' | 'lastAccessedAt'> = {
    hash: 'QmTestHash123',
    originalName: 'test-audio.mp3',
    mimeType: 'audio/mpeg',
    size: 1024 * 1024 * 2, // 2MB
    audioData: new ArrayBuffer(1024 * 1024 * 2),
    metadata: {
      title: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      duration: 180,
      format: 'MP3',
      bitrate: 192,
      sampleRate: 44100,
      channels: 2,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset localStorage mock
    const localStorageMock = window.localStorage as jest.Mocked<Storage>;
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    localStorageMock.clear.mockImplementation(() => {});
    localStorageMock.length = 0;
    localStorageMock.key.mockReturnValue(null);
  });

  describe('Storage Operations', () => {
    test('should store audio file successfully', async () => {
      const localStorageMock = window.localStorage as jest.Mocked<Storage>;
      localStorageMock.setItem.mockImplementation(() => {});

      await audioStorageManager.storeAudioFile(mockAudioFile);

      // Should store metadata in localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `audio_meta_${mockAudioFile.hash}`,
        expect.stringContaining(mockAudioFile.originalName)
      );
    });

    test('should retrieve audio file successfully', async () => {
      const localStorageMock = window.localStorage as jest.Mocked<Storage>;
      
      // Mock metadata exists
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === `audio_meta_${mockAudioFile.hash}`) {
          return JSON.stringify({
            hash: mockAudioFile.hash,
            originalName: mockAudioFile.originalName,
            mimeType: mockAudioFile.mimeType,
            size: mockAudioFile.size,
            metadata: mockAudioFile.metadata,
            uploadedAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
            storageLocation: 'localstorage',
          });
        }
        if (key === `audio_file_${mockAudioFile.hash}`) {
          return JSON.stringify({
            ...mockAudioFile,
            audioData: Array.from(new Uint8Array(mockAudioFile.audioData)),
            uploadedAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
            storageLocation: 'localstorage',
          });
        }
        return null;
      });

      const retrievedFile = await audioStorageManager.getAudioFile(mockAudioFile.hash);

      expect(retrievedFile).toBeTruthy();
      expect(retrievedFile?.hash).toBe(mockAudioFile.hash);
      expect(retrievedFile?.originalName).toBe(mockAudioFile.originalName);
    });

    test('should return null for non-existent file', async () => {
      const localStorageMock = window.localStorage as jest.Mocked<Storage>;
      localStorageMock.getItem.mockReturnValue(null);

      const retrievedFile = await audioStorageManager.getAudioFile('non-existent-hash');

      expect(retrievedFile).toBeNull();
    });

    test('should delete audio file successfully', async () => {
      const localStorageMock = window.localStorage as jest.Mocked<Storage>;
      localStorageMock.removeItem.mockImplementation(() => {});

      const deleted = await audioStorageManager.deleteAudioFile(mockAudioFile.hash);

      expect(deleted).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(`audio_file_${mockAudioFile.hash}`);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(`audio_meta_${mockAudioFile.hash}`);
    });
  });

  describe('Storage Statistics', () => {
    test('should return storage statistics', async () => {
      const localStorageMock = window.localStorage as jest.Mocked<Storage>;
      
      // Mock localStorage with some files
      localStorageMock.length = 2;
      localStorageMock.key.mockImplementation((index) => {
        if (index === 0) return 'audio_meta_hash1';
        if (index === 1) return 'audio_meta_hash2';
        return null;
      });
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'audio_meta_hash1') {
          return JSON.stringify({
            hash: 'hash1',
            size: 1024 * 1024,
            storageLocation: 'localstorage',
            lastAccessedAt: new Date().toISOString(),
          });
        }
        if (key === 'audio_meta_hash2') {
          return JSON.stringify({
            hash: 'hash2',
            size: 2 * 1024 * 1024,
            storageLocation: 'indexeddb',
            lastAccessedAt: new Date().toISOString(),
          });
        }
        return null;
      });

      const stats = await audioStorageManager.getStorageStats();

      expect(stats.totalFiles).toBe(2);
      expect(stats.totalSize).toBe(3 * 1024 * 1024); // 3MB total
      expect(stats.localStorageFiles).toBe(1);
      expect(stats.indexedDBFiles).toBe(1);
      expect(stats.quota.total).toBe(100 * 1024 * 1024); // 100MB
    });
  });

  describe('Storage Method Selection', () => {
    test('should prefer IndexedDB for large files', () => {
      const largeFileSize = 10 * 1024 * 1024; // 10MB
      const method = audioStorageManager.getPreferredStorageMethod(largeFileSize);
      expect(method).toBe('indexeddb');
    });

    test('should prefer localStorage for small files', () => {
      const smallFileSize = 1024 * 1024; // 1MB
      const method = audioStorageManager.getPreferredStorageMethod(smallFileSize);
      expect(method).toBe('localstorage');
    });

    test('should use memory for very large files when IndexedDB unavailable', () => {
      // Mock IndexedDB as unavailable
      Object.defineProperty(window, 'indexedDB', {
        value: undefined,
        writable: true,
      });

      const veryLargeFileSize = 50 * 1024 * 1024; // 50MB
      const method = audioStorageManager.getPreferredStorageMethod(veryLargeFileSize);
      expect(method).toBe('memory');
    });
  });

  describe('Cleanup Operations', () => {
    test('should cleanup old files', async () => {
      const localStorageMock = window.localStorage as jest.Mocked<Storage>;
      
      // Mock old file
      const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
      
      localStorageMock.length = 1;
      localStorageMock.key.mockReturnValue('audio_meta_oldhash');
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        hash: 'oldhash',
        originalName: 'old-file.mp3',
        size: 1024 * 1024,
        storageLocation: 'localstorage',
        lastAccessedAt: oldDate.toISOString(),
      }));

      const deletedCount = await audioStorageManager.cleanupOldFiles(30 * 24 * 60 * 60 * 1000); // 30 days

      expect(deletedCount).toBe(1);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('audio_file_oldhash');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('audio_meta_oldhash');
    });

    test('should clear all files', async () => {
      const localStorageMock = window.localStorage as jest.Mocked<Storage>;
      
      localStorageMock.length = 4;
      localStorageMock.key.mockImplementation((index) => {
        const keys = ['audio_file_hash1', 'audio_meta_hash1', 'other_key', 'audio_file_hash2'];
        return keys[index] || null;
      });

      await audioStorageManager.clearAllFiles();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('audio_file_hash1');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('audio_meta_hash1');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('audio_file_hash2');
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('other_key');
    });
  });

  describe('Error Handling', () => {
    test('should handle localStorage quota exceeded error', async () => {
      const localStorageMock = window.localStorage as jest.Mocked<Storage>;
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });

      // Should not throw, should fallback to memory storage
      await expect(audioStorageManager.storeAudioFile(mockAudioFile)).resolves.not.toThrow();
    });

    test('should handle corrupted metadata gracefully', async () => {
      const localStorageMock = window.localStorage as jest.Mocked<Storage>;
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const retrievedFile = await audioStorageManager.getAudioFile('test-hash');

      expect(retrievedFile).toBeNull();
    });
  });

  describe('Storage Availability', () => {
    test('should detect storage availability', () => {
      expect(audioStorageManager.isStorageAvailable()).toBe(true);
    });

    test('should handle missing storage APIs', () => {
      // Mock missing APIs
      Object.defineProperty(window, 'indexedDB', {
        value: undefined,
        writable: true,
      });
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      expect(audioStorageManager.isStorageAvailable()).toBe(false);
    });
  });
});