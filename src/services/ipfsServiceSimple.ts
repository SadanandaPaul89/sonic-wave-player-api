// Enhanced IPFS Service with reliable audio storage and retrieval
// Integrates with audioStorageManager, contentHashService, and playbackUrlResolver

import { audioStorageManager, StoredAudioFile, AudioMetadata } from './audioStorageManager';
import { contentHashService } from './contentHashService';
import { playbackUrlResolver, AudioSource } from './playbackUrlResolver';
import { audioBlobManager } from './audioBlobManager';

export interface UploadProgress {
  stage: 'preparing' | 'uploading' | 'processing' | 'pinning' | 'complete';
  progress: number;
  message: string;
}

export interface AudioFileStructure {
  original?: {
    uri: string;
    format: 'FLAC' | 'WAV';
    bitrate: 'lossless';
    size: number;
  };
  high_quality: {
    uri: string;
    format: 'MP3' | 'AAC';
    bitrate: '320kbps';
    size: number;
  };
  streaming: {
    uri: string;
    format: 'MP3' | 'AAC';
    bitrate: '192kbps';
    size: number;
  };
  mobile: {
    uri: string;
    format: 'MP3';
    bitrate: '128kbps';
    size: number;
  };
}

export interface MusicMetadata {
  title: string;
  artist: string;
  album?: string;
  duration: number;
  genre?: string;
  year?: number;
  ipfs_hashes: AudioFileStructure;
  artwork?: string;
  created_at: string;
  file_size: {
    original?: number;
    high_quality: number;
    streaming: number;
    mobile: number;
  };
  properties?: any;
}

class SimpleIPFSService {
  private uploadProgressCallbacks: Map<string, (progress: UploadProgress) => void> = new Map();

  constructor() {
    console.log('Enhanced IPFS Service initialized with reliable storage');
  }

  // Enhanced file upload with proper storage and hashing
  async uploadFile(file: File, onProgress?: (progress: UploadProgress) => void, allowMetadata: boolean = false): Promise<string> {
    const uploadId = `upload_${Date.now()}`;
    if (onProgress) {
      this.uploadProgressCallbacks.set(uploadId, onProgress);
    }

    try {
      console.log('Starting enhanced upload for:', file.name);

      this.updateProgress(uploadId, {
        stage: 'preparing',
        progress: 10,
        message: 'Preparing file for upload...'
      });

      // Validate file
      this.validateFile(file, allowMetadata);

      this.updateProgress(uploadId, {
        stage: 'uploading',
        progress: 30,
        message: 'Reading file...'
      });

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      console.log('File read successfully, size:', arrayBuffer.byteLength);

      this.updateProgress(uploadId, {
        stage: 'processing',
        progress: 50,
        message: 'Generating content hash...'
      });

      // Generate proper content-based hash
      const hashResult = await contentHashService.generateHashFromFile(file);
      const hash = hashResult.hash;
      console.log('Generated content hash:', hash);

      this.updateProgress(uploadId, {
        stage: 'processing',
        progress: 70,
        message: 'Extracting metadata...'
      });

      // Extract audio metadata
      const audioMetadata = await this.extractAudioMetadata(file);

      this.updateProgress(uploadId, {
        stage: 'pinning',
        progress: 85,
        message: 'Storing file in persistent storage...'
      });

      // Create stored audio file object
      const storedFile: Omit<StoredAudioFile, 'storageLocation' | 'uploadedAt' | 'lastAccessedAt'> = {
        hash,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        audioData: arrayBuffer,
        metadata: {
          title: audioMetadata.title || file.name.replace(/\.[^/.]+$/, ''),
          artist: audioMetadata.artist || 'Unknown Artist',
          album: audioMetadata.album,
          duration: audioMetadata.duration || 0,
          bitrate: audioMetadata.bitrate,
          sampleRate: audioMetadata.sampleRate,
          channels: audioMetadata.channels,
          format: this.getAudioFormat(file.type),
          genre: audioMetadata.genre,
          year: audioMetadata.year || new Date().getFullYear(),
          artwork: audioMetadata.artwork
        }
      };

      // Store in persistent storage
      await audioStorageManager.storeAudioFile(storedFile);

      // Create blob URL for immediate playback
      const blobUrl = audioBlobManager.createBlobUrl(arrayBuffer, file.type, hash);
      console.log('File stored with hash:', hash, 'Blob URL:', blobUrl);

      this.updateProgress(uploadId, {
        stage: 'complete',
        progress: 100,
        message: 'Upload complete!'
      });

      return hash;

    } catch (error: any) {
      console.error('Upload error:', error);
      this.updateProgress(uploadId, {
        stage: 'complete',
        progress: 0,
        message: `Upload failed: ${error.message}`
      });
      throw error;
    } finally {
      this.uploadProgressCallbacks.delete(uploadId);
    }
  }

  private validateFile(file: File, allowMetadata: boolean = false) {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/mp4'];
    
    // Allow JSON files for metadata uploads
    if (allowMetadata && file.type === 'application/json') {
      return;
    }
    
    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Supported types: ${validTypes.join(', ')}`);
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 100MB`);
    }
  }

  // Validate audio file access and availability
  async validateAudioAccess(ipfsHash: string): Promise<boolean> {
    try {
      // Check if file exists in storage
      const storedFile = await audioStorageManager.getAudioFile(ipfsHash);
      if (storedFile) {
        return true;
      }

      // Check if blob URL is available
      const blobUrl = await audioBlobManager.getBlobUrl(ipfsHash);
      if (blobUrl) {
        return true;
      }

      // Try to resolve via IPFS gateways
      const audioSource: AudioSource = {
        type: 'ipfs',
        identifier: ipfsHash
      };

      const result = await playbackUrlResolver.resolveAudioUrl(audioSource);
      return result.strategy !== 'fallback_demo';

    } catch (error) {
      console.error('Failed to validate audio access:', error);
      return false;
    }
  }

  // Preload audio for better performance
  async preloadAudio(ipfsHash: string): Promise<void> {
    try {
      const audioSource: AudioSource = {
        type: 'ipfs',
        identifier: ipfsHash
      };

      await playbackUrlResolver.preloadAudio(audioSource);
      console.log('Preloaded audio:', ipfsHash);
    } catch (error) {
      console.warn('Failed to preload audio:', ipfsHash, error);
    }
  }

  private updateProgress(uploadId: string, progress: UploadProgress) {
    const callback = this.uploadProgressCallbacks.get(uploadId);
    if (callback) {
      callback(progress);
    }
  }

  // Get optimal playback URL using the enhanced resolver
  async getOptimalGatewayUrl(ipfsHash: string): Promise<string> {
    try {
      // Create audio source for the resolver
      const audioSource: AudioSource = {
        type: 'ipfs',
        identifier: ipfsHash
      };

      // Use the playback URL resolver with all fallback strategies
      const result = await playbackUrlResolver.resolveAudioUrl(audioSource);
      
      console.log(`Resolved ${ipfsHash} using ${result.strategy}: ${result.url}`);
      return result.url;

    } catch (error) {
      console.error('Failed to resolve playback URL for:', ipfsHash, error);
      
      // Final fallback to demo audio
      console.warn('Using demo audio as final fallback');
      return 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
    }
  }

  // Process audio file with enhanced metadata extraction and storage
  async processAudioFile(file: File, onProgress?: (progress: UploadProgress) => void): Promise<{
    metadata: MusicMetadata;
    ipfsHashes: AudioFileStructure;
  }> {
    try {
      console.log('Processing audio file with enhanced pipeline:', file.name);

      // Upload the file (this now uses enhanced storage)
      const hash = await this.uploadFile(file, onProgress);

      // Get the stored file to access its metadata
      const storedFile = await audioStorageManager.getAudioFile(hash);
      if (!storedFile) {
        throw new Error('Failed to retrieve stored audio file');
      }

      // Create IPFS-compatible metadata structure
      const ipfsHashes: AudioFileStructure = {
        high_quality: {
          uri: contentHashService.createIPFSURI(hash),
          format: this.getAudioFormat(file.type),
          bitrate: '320kbps',
          size: file.size
        },
        streaming: {
          uri: contentHashService.createIPFSURI(hash),
          format: this.getAudioFormat(file.type),
          bitrate: '192kbps',
          size: Math.floor(file.size * 0.6)
        },
        mobile: {
          uri: contentHashService.createIPFSURI(hash),
          format: this.getAudioFormat(file.type),
          bitrate: '128kbps',
          size: Math.floor(file.size * 0.4)
        }
      };

      const metadata: MusicMetadata = {
        title: storedFile.metadata.title,
        artist: storedFile.metadata.artist,
        album: storedFile.metadata.album,
        duration: storedFile.metadata.duration,
        genre: storedFile.metadata.genre,
        year: storedFile.metadata.year,
        ipfs_hashes: ipfsHashes,
        artwork: storedFile.metadata.artwork,
        created_at: storedFile.uploadedAt,
        file_size: {
          high_quality: file.size,
          streaming: Math.floor(file.size * 0.6),
          mobile: Math.floor(file.size * 0.4)
        },
        properties: {
          originalFilename: storedFile.originalName,
          mimeType: storedFile.mimeType,
          uploadedAt: storedFile.uploadedAt,
          contentHash: hash,
          storageLocation: storedFile.storageLocation
        }
      };

      console.log('Audio file processed with enhanced metadata:', metadata);

      return {
        metadata,
        ipfsHashes
      };

    } catch (error) {
      console.error('Error processing audio file:', error);
      throw error;
    }
  }

  private async extractAudioMetadata(file: File): Promise<any> {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      const cleanup = () => {
        URL.revokeObjectURL(url);
      };

      audio.addEventListener('loadedmetadata', () => {
        const metadata = {
          duration: audio.duration,
          title: null,
          artist: null,
          album: null,
          genre: null,
          year: null,
          artwork: null
        };
        
        cleanup();
        resolve(metadata);
      });

      audio.addEventListener('error', () => {
        cleanup();
        resolve({
          duration: 0,
          title: null,
          artist: null,
          album: null,
          genre: null,
          year: null,
          artwork: null
        });
      });

      // Set timeout to prevent hanging
      setTimeout(() => {
        cleanup();
        resolve({
          duration: 0,
          title: null,
          artist: null,
          album: null,
          genre: null,
          year: null,
          artwork: null
        });
      }, 5000);

      audio.src = url;
    });
  }

  private getAudioFormat(mimeType: string): 'MP3' | 'AAC' | 'FLAC' | 'WAV' | 'OGG' {
    switch (mimeType) {
      case 'audio/mpeg':
        return 'MP3';
      case 'audio/aac':
      case 'audio/mp4':
        return 'AAC';
      case 'audio/flac':
        return 'FLAC';
      case 'audio/wav':
        return 'WAV';
      case 'audio/ogg':
        return 'OGG';
      default:
        return 'MP3';
    }
  }

  // Upload metadata
  async uploadMetadata(metadata: any): Promise<string> {
    const metadataString = JSON.stringify(metadata, null, 2);
    const metadataFile = new File([metadataString], 'metadata.json', { type: 'application/json' });
    return await this.uploadFile(metadataFile, undefined, true);
  }

  // Pin content (no-op for local storage)
  async pinContent(ipfsHash: string): Promise<void> {
    console.log('Content pinned locally:', ipfsHash);
  }

  // Get file URL
  async getFileUrl(ipfsHash: string): Promise<string> {
    return await this.getOptimalGatewayUrl(ipfsHash);
  }

  // Clean up blob URLs to prevent memory leaks
  cleanupBlobUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  // Get cached files info from enhanced storage
  async getCachedFiles(): Promise<Array<{ hash: string; name: string; size: number; uploadedAt: string }>> {
    try {
      const storedFiles = await audioStorageManager.listAudioFiles();
      return storedFiles.map(file => ({
        hash: file.hash,
        name: file.originalName,
        size: file.size,
        uploadedAt: file.uploadedAt
      }));
    } catch (error) {
      console.error('Error getting cached files:', error);
      return [];
    }
  }

  // Clear all cached files using enhanced storage
  async clearCache(): Promise<void> {
    try {
      // Clear audio storage
      await audioStorageManager.clearAllFiles();
      
      // Clear blob cache
      audioBlobManager.clearAllBlobs();
      
      // Clear resolver cache
      playbackUrlResolver.clearCache();
      
      // Clear hash cache
      contentHashService.clearCache();
      
      console.log('All IPFS caches cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Get comprehensive storage statistics
  async getStorageStats(): Promise<{
    audioStorage: any;
    blobManager: any;
    resolver: any;
    hashService: any;
  }> {
    try {
      const [audioStats, blobStats, resolverStats, hashStats] = await Promise.all([
        audioStorageManager.getStorageStats(),
        Promise.resolve(audioBlobManager.getBlobStats()),
        Promise.resolve(playbackUrlResolver.getResolutionStats()),
        Promise.resolve(contentHashService.getCacheStats())
      ]);

      return {
        audioStorage: audioStats,
        blobManager: blobStats,
        resolver: resolverStats,
        hashService: hashStats
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        audioStorage: null,
        blobManager: null,
        resolver: null,
        hashService: null
      };
    }
  }

  // Cleanup old files based on access patterns
  async cleanupOldFiles(maxAge?: number): Promise<number> {
    try {
      const deletedCount = await audioStorageManager.cleanupOldFiles(maxAge);
      console.log(`Cleaned up ${deletedCount} old audio files`);
      return deletedCount;
    } catch (error) {
      console.error('Error during cleanup:', error);
      return 0;
    }
  }
}

export const simpleIPFSService = new SimpleIPFSService();
export default simpleIPFSService;