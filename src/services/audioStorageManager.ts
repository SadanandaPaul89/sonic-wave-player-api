// Enhanced Audio Storage Manager with IndexedDB Support
// Provides reliable storage for large audio files with fallback mechanisms

export interface StoredAudioFile {
  hash: string;
  originalName: string;
  mimeType: string;
  size: number;
  audioData: ArrayBuffer;
  metadata: AudioMetadata;
  uploadedAt: string;
  lastAccessedAt: string;
  blobUrl?: string;
  storageLocation: 'indexeddb' | 'localstorage' | 'memory';
}

export interface AudioMetadata {
  title: string;
  artist: string;
  album?: string;
  duration: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  format: string;
  genre?: string;
  year?: number;
  artwork?: string;
}

export interface StorageQuota {
  used: number;
  available: number;
  total: number;
  percentage: number;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  indexedDBFiles: number;
  localStorageFiles: number;
  memoryFiles: number;
  quota: StorageQuota;
}

class AudioStorageManager {
  private dbName = 'IPFSAudioStorage';
  private dbVersion = 1;
  private storeName = 'audioFiles';
  private db: IDBDatabase | null = null;
  private memoryCache: Map<string, StoredAudioFile> = new Map();
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initializeDatabase();
  }

  // Initialize IndexedDB
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        console.warn('IndexedDB not supported, falling back to localStorage');
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        resolve(); // Don't reject, just continue without IndexedDB
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'hash' });
          store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
          store.createIndex('lastAccessedAt', 'lastAccessedAt', { unique: false });
          store.createIndex('size', 'size', { unique: false });
          console.log('IndexedDB object store created');
        }
      };
    });
  }

  // Ensure database is initialized
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  // Store audio file with automatic storage selection
  async storeAudioFile(audioFile: Omit<StoredAudioFile, 'storageLocation' | 'uploadedAt' | 'lastAccessedAt'>): Promise<void> {
    await this.ensureInitialized();

    const now = new Date().toISOString();
    const completeFile: StoredAudioFile = {
      ...audioFile,
      uploadedAt: now,
      lastAccessedAt: now,
      storageLocation: 'memory' // Will be updated based on actual storage
    };

    try {
      // Try IndexedDB first for large files
      if (this.db && audioFile.size > 1024 * 1024) { // > 1MB
        await this.storeInIndexedDB(completeFile);
        completeFile.storageLocation = 'indexeddb';
        console.log(`Stored ${audioFile.originalName} in IndexedDB (${(audioFile.size / 1024 / 1024).toFixed(2)}MB)`);
      } else {
        // Try localStorage for smaller files
        await this.storeInLocalStorage(completeFile);
        completeFile.storageLocation = 'localstorage';
        console.log(`Stored ${audioFile.originalName} in localStorage (${(audioFile.size / 1024).toFixed(2)}KB)`);
      }
    } catch (error) {
      console.warn('Primary storage failed, using memory cache:', error);
      // Fallback to memory cache
      this.memoryCache.set(audioFile.hash, completeFile);
      completeFile.storageLocation = 'memory';
    }

    // Always keep metadata in localStorage for quick access
    try {
      const metadata = {
        hash: completeFile.hash,
        originalName: completeFile.originalName,
        mimeType: completeFile.mimeType,
        size: completeFile.size,
        metadata: completeFile.metadata,
        uploadedAt: completeFile.uploadedAt,
        lastAccessedAt: completeFile.lastAccessedAt,
        storageLocation: completeFile.storageLocation
      };
      localStorage.setItem(`audio_meta_${audioFile.hash}`, JSON.stringify(metadata));
    } catch (error) {
      console.warn('Failed to store metadata in localStorage:', error);
    }
  }

  // Store in IndexedDB
  private async storeInIndexedDB(audioFile: StoredAudioFile): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB not available');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.createTransaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(audioFile);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Store in localStorage (without audio data for large files)
  private async storeInLocalStorage(audioFile: StoredAudioFile): Promise<void> {
    try {
      // For localStorage, we store the full file only if it's small enough
      if (audioFile.size < 5 * 1024 * 1024) { // < 5MB
        const serialized = JSON.stringify({
          ...audioFile,
          audioData: Array.from(new Uint8Array(audioFile.audioData))
        });
        localStorage.setItem(`audio_file_${audioFile.hash}`, serialized);
      } else {
        throw new Error('File too large for localStorage');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('localStorage quota exceeded');
      }
      throw error;
    }
  }

  // Retrieve audio file
  async getAudioFile(hash: string): Promise<StoredAudioFile | null> {
    await this.ensureInitialized();

    // Check memory cache first
    if (this.memoryCache.has(hash)) {
      const file = this.memoryCache.get(hash)!;
      file.lastAccessedAt = new Date().toISOString();
      return file;
    }

    // Check metadata to determine storage location
    const metadataStr = localStorage.getItem(`audio_meta_${hash}`);
    if (!metadataStr) {
      return null;
    }

    let metadata;
    try {
      metadata = JSON.parse(metadataStr);
    } catch (error) {
      console.error('Failed to parse audio metadata:', error);
      return null;
    }

    let audioFile: StoredAudioFile | null = null;

    // Retrieve from appropriate storage
    switch (metadata.storageLocation) {
      case 'indexeddb':
        audioFile = await this.getFromIndexedDB(hash);
        break;
      case 'localstorage':
        audioFile = await this.getFromLocalStorage(hash);
        break;
      case 'memory':
        audioFile = this.memoryCache.get(hash) || null;
        break;
    }

    if (audioFile) {
      // Update last accessed time
      audioFile.lastAccessedAt = new Date().toISOString();
      this.updateMetadata(hash, { lastAccessedAt: audioFile.lastAccessedAt });
    }

    return audioFile;
  }

  // Get from IndexedDB
  private async getFromIndexedDB(hash: string): Promise<StoredAudioFile | null> {
    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.createTransaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(hash);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        console.error('Failed to retrieve from IndexedDB:', request.error);
        resolve(null);
      };
    });
  }

  // Get from localStorage
  private async getFromLocalStorage(hash: string): Promise<StoredAudioFile | null> {
    try {
      const serialized = localStorage.getItem(`audio_file_${hash}`);
      if (!serialized) {
        return null;
      }

      const parsed = JSON.parse(serialized);
      return {
        ...parsed,
        audioData: new Uint8Array(parsed.audioData).buffer
      };
    } catch (error) {
      console.error('Failed to retrieve from localStorage:', error);
      return null;
    }
  }

  // Update metadata
  private updateMetadata(hash: string, updates: Partial<StoredAudioFile>): void {
    try {
      const metadataStr = localStorage.getItem(`audio_meta_${hash}`);
      if (metadataStr) {
        const metadata = JSON.parse(metadataStr);
        const updated = { ...metadata, ...updates };
        localStorage.setItem(`audio_meta_${hash}`, JSON.stringify(updated));
      }
    } catch (error) {
      console.warn('Failed to update metadata:', error);
    }
  }

  // List all stored audio files
  async listAudioFiles(): Promise<Array<Omit<StoredAudioFile, 'audioData'>>> {
    const files: Array<Omit<StoredAudioFile, 'audioData'>> = [];

    // Get from localStorage metadata
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('audio_meta_')) {
        try {
          const metadata = JSON.parse(localStorage.getItem(key)!);
          files.push(metadata);
        } catch (error) {
          console.warn('Failed to parse metadata for key:', key, error);
        }
      }
    }

    // Sort by last accessed time (most recent first)
    return files.sort((a, b) => 
      new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
    );
  }

  // Delete audio file
  async deleteAudioFile(hash: string): Promise<boolean> {
    await this.ensureInitialized();

    let deleted = false;

    // Remove from memory cache
    if (this.memoryCache.has(hash)) {
      this.memoryCache.delete(hash);
      deleted = true;
    }

    // Remove from IndexedDB
    if (this.db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.createTransaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.delete(hash);

          request.onsuccess = () => {
            deleted = true;
            resolve();
          };
          request.onerror = () => resolve(); // Don't fail if not found
        });
      } catch (error) {
        console.warn('Failed to delete from IndexedDB:', error);
      }
    }

    // Remove from localStorage
    try {
      localStorage.removeItem(`audio_file_${hash}`);
      localStorage.removeItem(`audio_meta_${hash}`);
      deleted = true;
    } catch (error) {
      console.warn('Failed to delete from localStorage:', error);
    }

    return deleted;
  }

  // Get storage statistics
  async getStorageStats(): Promise<StorageStats> {
    const files = await this.listAudioFiles();
    
    const stats: StorageStats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      indexedDBFiles: files.filter(f => f.storageLocation === 'indexeddb').length,
      localStorageFiles: files.filter(f => f.storageLocation === 'localstorage').length,
      memoryFiles: files.filter(f => f.storageLocation === 'memory').length,
      quota: await this.getStorageQuota()
    };

    return stats;
  }

  // Get storage quota information
  private async getStorageQuota(): Promise<StorageQuota> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const total = estimate.quota || 0;
        const available = total - used;
        const percentage = total > 0 ? (used / total) * 100 : 0;

        return {
          used,
          available,
          total,
          percentage
        };
      }
    } catch (error) {
      console.warn('Failed to get storage quota:', error);
    }

    // Fallback values
    return {
      used: 0,
      available: 0,
      total: 0,
      percentage: 0
    };
  }

  // Cleanup old files based on access time and storage pressure
  async cleanupOldFiles(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> { // 30 days default
    const files = await this.listAudioFiles();
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      const lastAccessed = new Date(file.lastAccessedAt).getTime();
      const age = now - lastAccessed;

      if (age > maxAge) {
        const deleted = await this.deleteAudioFile(file.hash);
        if (deleted) {
          deletedCount++;
          console.log(`Cleaned up old file: ${file.originalName} (${Math.floor(age / (24 * 60 * 60 * 1000))} days old)`);
        }
      }
    }

    return deletedCount;
  }

  // Clear all stored audio files
  async clearAllFiles(): Promise<void> {
    await this.ensureInitialized();

    // Clear memory cache
    this.memoryCache.clear();

    // Clear IndexedDB
    if (this.db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.createTransaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.clear();

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error('Failed to clear IndexedDB:', error);
      }
    }

    // Clear localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('audio_file_') || key.startsWith('audio_meta_'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove localStorage key:', key, error);
      }
    });

    console.log('All audio files cleared from storage');
  }

  // Check if storage is available
  isStorageAvailable(): boolean {
    return 'indexedDB' in window || 'localStorage' in window;
  }

  // Get preferred storage method for a file size
  getPreferredStorageMethod(fileSize: number): 'indexeddb' | 'localstorage' | 'memory' {
    if (this.db && fileSize > 1024 * 1024) { // > 1MB
      return 'indexeddb';
    } else if (fileSize < 5 * 1024 * 1024) { // < 5MB
      return 'localstorage';
    } else {
      return 'memory';
    }
  }
}

// Export singleton instance
export const audioStorageManager = new AudioStorageManager();
export default audioStorageManager;