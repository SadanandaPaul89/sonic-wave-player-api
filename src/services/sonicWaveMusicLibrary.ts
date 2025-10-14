/**
 * Sonic Wave Music Library Service
 * Centralized service for managing all music uploads and retrieval via Pinata IPFS
 */

import { ipfsService } from './ipfsService';
import { IPFS_CONFIG } from '@/config/environment';

export interface SonicWaveTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  year?: number;
  duration?: number;
  description?: string;
  
  // IPFS Hashes
  metadataHash: string;
  audioHash: string;
  artworkHash?: string;
  
  // File Info
  audioFile: {
    name: string;
    size: number;
    type: string;
    url: string;
  };
  artworkFile?: {
    name: string;
    size: number;
    type: string;
    url: string;
  };
  
  // Timestamps
  uploadedAt: string;
  lastPlayed?: string;
  playCount: number;
  
  // Tags and metadata
  tags: string[];
  isPublic: boolean;
  uploadedBy?: string;
}

export interface UploadProgress {
  stage: 'preparing' | 'uploading-audio' | 'uploading-artwork' | 'creating-metadata' | 'complete';
  progress: number;
  message: string;
}

class SonicWaveMusicLibrary {
  private tracks: Map<string, SonicWaveTrack> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeLibrary();
  }

  /**
   * Initialize the music library by loading existing tracks from Pinata
   */
  async initializeLibrary(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🎵 Initializing Sonic Wave Music Library...');
      
      // Load tracks from Pinata
      await this.loadTracksFromPinata();
      
      // Load tracks from local storage (fallback)
      this.loadTracksFromLocalStorage();
      
      this.isInitialized = true;
      console.log(`✅ Music library initialized with ${this.tracks.size} tracks`);
      
    } catch (error) {
      console.error('Error initializing music library:', error);
      // Continue with local storage only
      this.loadTracksFromLocalStorage();
      this.isInitialized = true;
    }
  }

  /**
   * Upload a complete track (audio + artwork + metadata) to Pinata
   */
  async uploadTrack(
    audioFile: File,
    metadata: {
      title: string;
      artist: string;
      album?: string;
      genre?: string;
      year?: number;
      description?: string;
      tags?: string[];
    },
    artworkFile?: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<SonicWaveTrack> {
    
    const trackId = this.generateTrackId();
    
    try {
      // Stage 1: Upload audio file
      onProgress?.({
        stage: 'uploading-audio',
        progress: 10,
        message: 'Uploading audio file to IPFS...'
      });

      const audioHash = await ipfsService.uploadFile(audioFile, (progress) => {
        onProgress?.({
          stage: 'uploading-audio',
          progress: 10 + (progress.progress * 0.4), // 10-50%
          message: `Uploading audio: ${progress.progress.toFixed(0)}%`
        });
      });

      console.log('✅ Audio uploaded:', audioHash);

      // Stage 2: Upload artwork (if provided)
      let artworkHash: string | undefined;
      if (artworkFile) {
        onProgress?.({
          stage: 'uploading-artwork',
          progress: 50,
          message: 'Uploading artwork to IPFS...'
        });

        artworkHash = await ipfsService.uploadArtwork(artworkFile, (progress) => {
          onProgress?.({
            stage: 'uploading-artwork',
            progress: 50 + (progress.progress * 0.2), // 50-70%
            message: `Uploading artwork: ${progress.progress.toFixed(0)}%`
          });
        });

        console.log('✅ Artwork uploaded:', artworkHash);
      }

      // Stage 3: Create and upload metadata
      onProgress?.({
        stage: 'creating-metadata',
        progress: 70,
        message: 'Creating metadata...'
      });

      const trackMetadata = {
        id: trackId,
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        genre: metadata.genre,
        year: metadata.year || new Date().getFullYear(),
        description: metadata.description,
        
        // IPFS references
        audioHash,
        artworkHash,
        
        // File information
        audioFile: {
          name: audioFile.name,
          size: audioFile.size,
          type: audioFile.type,
          originalName: audioFile.name
        },
        artworkFile: artworkFile ? {
          name: artworkFile.name,
          size: artworkFile.size,
          type: artworkFile.type,
          originalName: artworkFile.name
        } : undefined,
        
        // Metadata
        uploadedAt: new Date().toISOString(),
        playCount: 0,
        tags: metadata.tags || [],
        isPublic: true,
        
        // Sonic Wave specific
        platform: 'SonicWave',
        version: '1.0'
      };

      const metadataHash = await ipfsService.uploadMetadata(trackMetadata);
      console.log('✅ Metadata uploaded:', metadataHash);

      // Stage 4: Create track object
      const track: SonicWaveTrack = {
        id: trackId,
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        genre: metadata.genre,
        year: metadata.year,
        description: metadata.description,
        
        metadataHash,
        audioHash,
        artworkHash,
        
        audioFile: {
          name: audioFile.name,
          size: audioFile.size,
          type: audioFile.type,
          url: `https://gateway.pinata.cloud/ipfs/${audioHash}`
        },
        artworkFile: artworkFile ? {
          name: artworkFile.name,
          size: artworkFile.size,
          type: artworkFile.type,
          url: `https://gateway.pinata.cloud/ipfs/${artworkHash}`
        } : undefined,
        
        uploadedAt: new Date().toISOString(),
        playCount: 0,
        tags: metadata.tags || [],
        isPublic: true
      };

      // Add to library
      this.tracks.set(trackId, track);
      
      // Save to local storage
      this.saveTracksToLocalStorage();

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Upload complete!'
      });

      console.log('🎵 Track added to Sonic Wave library:', track.title);
      return track;

    } catch (error) {
      console.error('Error uploading track:', error);
      throw error;
    }
  }

  /**
   * Get all tracks in the library
   */
  getAllTracks(): SonicWaveTrack[] {
    return Array.from(this.tracks.values()).sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  /**
   * Get track by ID
   */
  getTrack(id: string): SonicWaveTrack | undefined {
    return this.tracks.get(id);
  }

  /**
   * Search tracks by title, artist, or album
   */
  searchTracks(query: string): SonicWaveTrack[] {
    const searchTerm = query.toLowerCase();
    return this.getAllTracks().filter(track => 
      track.title.toLowerCase().includes(searchTerm) ||
      track.artist.toLowerCase().includes(searchTerm) ||
      track.album?.toLowerCase().includes(searchTerm) ||
      track.genre?.toLowerCase().includes(searchTerm) ||
      track.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get tracks by artist
   */
  getTracksByArtist(artist: string): SonicWaveTrack[] {
    return this.getAllTracks().filter(track => 
      track.artist.toLowerCase() === artist.toLowerCase()
    );
  }

  /**
   * Get tracks by album
   */
  getTracksByAlbum(album: string): SonicWaveTrack[] {
    return this.getAllTracks().filter(track => 
      track.album?.toLowerCase() === album.toLowerCase()
    );
  }

  /**
   * Get tracks by genre
   */
  getTracksByGenre(genre: string): SonicWaveTrack[] {
    return this.getAllTracks().filter(track => 
      track.genre?.toLowerCase() === genre.toLowerCase()
    );
  }

  /**
   * Update play count for a track
   */
  incrementPlayCount(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.playCount++;
      track.lastPlayed = new Date().toISOString();
      this.tracks.set(trackId, track);
      this.saveTracksToLocalStorage();
    }
  }

  /**
   * Get most played tracks
   */
  getMostPlayedTracks(limit: number = 10): SonicWaveTrack[] {
    return this.getAllTracks()
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);
  }

  /**
   * Get recently played tracks
   */
  getRecentlyPlayedTracks(limit: number = 10): SonicWaveTrack[] {
    return this.getAllTracks()
      .filter(track => track.lastPlayed)
      .sort((a, b) => new Date(b.lastPlayed!).getTime() - new Date(a.lastPlayed!).getTime())
      .slice(0, limit);
  }

  /**
   * Get recently uploaded tracks
   */
  getRecentlyUploadedTracks(limit: number = 10): SonicWaveTrack[] {
    return this.getAllTracks().slice(0, limit);
  }

  /**
   * Load tracks from Pinata by querying pinned files
   */
  private async loadTracksFromPinata(): Promise<void> {
    try {
      // This would require implementing a way to query Pinata for our specific files
      // For now, we'll rely on local storage
      console.log('Loading tracks from Pinata (not implemented yet)');
    } catch (error) {
      console.warn('Could not load tracks from Pinata:', error);
    }
  }

  /**
   * Load tracks from local storage
   */
  private loadTracksFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('sonicwave_music_library');
      if (stored) {
        const tracksData = JSON.parse(stored);
        Object.entries(tracksData).forEach(([id, track]) => {
          this.tracks.set(id, track as SonicWaveTrack);
        });
        console.log(`📱 Loaded ${this.tracks.size} tracks from local storage`);
      }
    } catch (error) {
      console.warn('Could not load tracks from local storage:', error);
    }
  }

  /**
   * Save tracks to local storage
   */
  private saveTracksToLocalStorage(): void {
    try {
      const tracksData = Object.fromEntries(this.tracks);
      localStorage.setItem('sonicwave_music_library', JSON.stringify(tracksData));
    } catch (error) {
      console.warn('Could not save tracks to local storage:', error);
    }
  }

  /**
   * Generate unique track ID
   */
  private generateTrackId(): string {
    return `track_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get library statistics
   */
  getLibraryStats() {
    const tracks = this.getAllTracks();
    const totalTracks = tracks.length;
    const totalSize = tracks.reduce((sum, track) => sum + track.audioFile.size + (track.artworkFile?.size || 0), 0);
    const totalPlayCount = tracks.reduce((sum, track) => sum + track.playCount, 0);
    
    const artists = new Set(tracks.map(t => t.artist)).size;
    const albums = new Set(tracks.filter(t => t.album).map(t => t.album)).size;
    const genres = new Set(tracks.filter(t => t.genre).map(t => t.genre)).size;

    return {
      totalTracks,
      totalSize,
      totalPlayCount,
      uniqueArtists: artists,
      uniqueAlbums: albums,
      uniqueGenres: genres,
      averagePlayCount: totalTracks > 0 ? totalPlayCount / totalTracks : 0
    };
  }
}

// Export singleton instance
export const sonicWaveMusicLibrary = new SonicWaveMusicLibrary();
export default sonicWaveMusicLibrary;