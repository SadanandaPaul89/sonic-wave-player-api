// Simplified IPFS Service that works without external API keys

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
  private fileBlobCache: Map<string, Blob> = new Map();

  constructor() {
    console.log('Simple IPFS Service initialized');
  }

  // Simple file upload that works locally
  async uploadFile(file: File, onProgress?: (progress: UploadProgress) => void, allowMetadata: boolean = false): Promise<string> {
    const uploadId = `upload_${Date.now()}`;
    if (onProgress) {
      this.uploadProgressCallbacks.set(uploadId, onProgress);
    }

    try {
      console.log('Starting simple upload for:', file.name);

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
        progress: 60,
        message: 'Generating hash...'
      });

      // Generate a content-based hash
      const hash = await this.generateContentHash(new Uint8Array(arrayBuffer));
      console.log('Generated hash:', hash);

      this.updateProgress(uploadId, {
        stage: 'pinning',
        progress: 80,
        message: 'Storing file...'
      });

      // Store file metadata and create blob URL for playback
      const blob = new Blob([arrayBuffer], { type: file.type });
      const blobUrl = URL.createObjectURL(blob);
      
      // Store only metadata and blob URL reference
      const fileData = {
        hash,
        name: file.name,
        type: file.type,
        size: file.size,
        blobUrl,
        uploadedAt: new Date().toISOString()
      };

      // Store metadata only (much smaller)
      try {
        localStorage.setItem(`ipfs_file_${hash}`, JSON.stringify(fileData));
      } catch (error) {
        console.warn('Failed to store file metadata in localStorage:', error);
        // Continue without localStorage - file will still work via blob cache
      }
      
      // Store blob reference in memory for this session
      this.fileBlobCache.set(hash, blob);
      console.log('File stored locally with hash:', hash);

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

  private async generateContentHash(data: Uint8Array): Promise<string> {
    // Generate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Convert to IPFS-like hash format
    return `Qm${hashHex.substring(0, 44)}`;
  }

  private updateProgress(uploadId: string, progress: UploadProgress) {
    const callback = this.uploadProgressCallbacks.get(uploadId);
    if (callback) {
      callback(progress);
    }
  }

  // Get file URL for playback
  async getOptimalGatewayUrl(ipfsHash: string): Promise<string> {
    // Check if file is cached in memory first
    const cachedBlob = this.fileBlobCache.get(ipfsHash);
    if (cachedBlob) {
      const url = URL.createObjectURL(cachedBlob);
      console.log('Created blob URL from cache:', url);
      return url;
    }

    // Check if file metadata is stored locally
    const localFile = localStorage.getItem(`ipfs_file_${ipfsHash}`);
    if (localFile) {
      try {
        const fileData = JSON.parse(localFile);
        // If we have a stored blob URL, return it
        if (fileData.blobUrl) {
          console.log('Using stored blob URL:', fileData.blobUrl);
          return fileData.blobUrl;
        }
      } catch (error) {
        console.error('Error reading local file metadata:', error);
      }
    }

    // Fallback to public IPFS gateway
    console.log('Falling back to public IPFS gateway for:', ipfsHash);
    return `https://ipfs.io/ipfs/${ipfsHash}`;
  }

  // Process audio file with metadata extraction
  async processAudioFile(file: File, onProgress?: (progress: UploadProgress) => void): Promise<{
    metadata: MusicMetadata;
    ipfsHashes: AudioFileStructure;
  }> {
    try {
      console.log('Processing audio file:', file.name);

      // Upload the file
      const hash = await this.uploadFile(file, onProgress);

      // Extract basic metadata
      const audioMetadata = await this.extractAudioMetadata(file);

      // Create metadata object
      const metadata: MusicMetadata = {
        title: audioMetadata.title || file.name.replace(/\.[^/.]+$/, ''),
        artist: audioMetadata.artist || 'Unknown Artist',
        album: audioMetadata.album,
        duration: audioMetadata.duration || 0,
        genre: audioMetadata.genre,
        year: audioMetadata.year || new Date().getFullYear(),
        ipfs_hashes: {
          high_quality: {
            uri: `ipfs://${hash}`,
            format: this.getAudioFormat(file.type),
            bitrate: '320kbps',
            size: file.size
          },
          streaming: {
            uri: `ipfs://${hash}`,
            format: this.getAudioFormat(file.type),
            bitrate: '192kbps',
            size: Math.floor(file.size * 0.6)
          },
          mobile: {
            uri: `ipfs://${hash}`,
            format: this.getAudioFormat(file.type),
            bitrate: '128kbps',
            size: Math.floor(file.size * 0.4)
          }
        },
        artwork: audioMetadata.artwork,
        created_at: new Date().toISOString(),
        file_size: {
          high_quality: file.size,
          streaming: Math.floor(file.size * 0.6),
          mobile: Math.floor(file.size * 0.4)
        },
        properties: {
          originalFilename: file.name,
          mimeType: file.type,
          uploadedAt: new Date().toISOString()
        }
      };

      console.log('Audio file processed successfully:', metadata);

      return {
        metadata,
        ipfsHashes: metadata.ipfs_hashes
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

  // Get cached files info
  getCachedFiles(): Array<{ hash: string; name: string; size: number; uploadedAt: string }> {
    const files: Array<{ hash: string; name: string; size: number; uploadedAt: string }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ipfs_file_')) {
        try {
          const fileData = JSON.parse(localStorage.getItem(key) || '{}');
          files.push({
            hash: fileData.hash,
            name: fileData.name,
            size: fileData.size,
            uploadedAt: fileData.uploadedAt
          });
        } catch (error) {
          console.error('Error reading cached file:', key, error);
        }
      }
    }
    
    return files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  // Clear all cached files
  clearCache(): void {
    // Clear localStorage entries
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ipfs_file_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear blob cache
    this.fileBlobCache.clear();
    
    console.log('IPFS cache cleared');
  }
}

export const simpleIPFSService = new SimpleIPFSService();
export default simpleIPFSService;