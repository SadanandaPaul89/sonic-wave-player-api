// Persistent Music Service - Spotify-like persistent access to purchased/owned music

import { AudioFileStructure } from '@/types/yellowSDK';

export interface PersistentTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  duration?: number;
  audioFiles: AudioFileStructure;
  accessType: 'purchased' | 'subscription' | 'nft_owned' | 'free';
  purchaseDate?: Date;
  transactionHash?: string;
  nftContract?: string;
  nftTokenId?: string;
  subscriptionTier?: string;
  expiresAt?: Date; // For subscription content
  metadata?: {
    genre?: string;
    year?: number;
    description?: string;
    tags?: string[];
  };
}

export interface UserLibrary {
  userId: string;
  walletAddress: string;
  tracks: PersistentTrack[];
  playlists: UserPlaylist[];
  lastUpdated: Date;
  totalTracks: number;
  storageUsed: number; // In MB
}

export interface UserPlaylist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  artwork?: string;
}

class PersistentMusicService {
  private readonly STORAGE_KEY = 'sonic_wave_music_library';
  private readonly CACHE_KEY = 'sonic_wave_audio_cache';
  private library: UserLibrary | null = null;
  private audioCache: Map<string, string> = new Map(); // Track ID -> Blob URL
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeEventListeners();
    this.loadLibraryFromStorage();
    this.setupStorageListener();
  }

  private initializeEventListeners() {
    const events = ['libraryUpdated', 'trackAdded', 'trackRemoved', 'playlistCreated', 'playlistUpdated'];
    events.forEach(event => {
      this.eventListeners.set(event, []);
    });
  }

  // Event management
  on(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Initialize library for user
  async initializeLibrary(walletAddress: string): Promise<UserLibrary> {
    const existingLibrary = this.loadLibraryFromStorage();
    
    if (existingLibrary && existingLibrary.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
      this.library = existingLibrary;
      console.log('Loaded existing library for:', walletAddress);
    } else {
      // Create new library
      this.library = {
        userId: `user_${Date.now()}`,
        walletAddress: walletAddress.toLowerCase(),
        tracks: [],
        playlists: [
          {
            id: 'liked_songs',
            name: 'Liked Songs',
            description: 'Your favorite tracks',
            trackIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isPublic: false,
            artwork: undefined
          }
        ],
        lastUpdated: new Date(),
        totalTracks: 0,
        storageUsed: 0
      };
      
      await this.saveLibraryToStorage();
      console.log('Created new library for:', walletAddress);
    }

    // Load demo content for new users
    if (this.library.tracks.length === 0) {
      await this.addDemoContent();
    }

    // Sync NFT-owned music (async, don't block initialization)
    this.syncNFTMusic(walletAddress).catch(error => {
      console.error('Error syncing NFT music:', error);
    });

    this.emit('libraryUpdated', this.library);
    return this.library;
  }

  // Sync NFT-owned music to library
  private async syncNFTMusic(walletAddress: string): Promise<void> {
    try {
      // Dynamic import to avoid circular dependency
      const { nftService } = await import('./nftService');
      await nftService.syncNFTMusicToLibrary(walletAddress);
      console.log('NFT music sync completed for:', walletAddress);
    } catch (error) {
      console.error('Error syncing NFT music:', error);
    }
  }

  // Add demo content for new users
  private async addDemoContent() {
    const demoTracks: PersistentTrack[] = [
      {
        id: 'demo_track_1',
        title: 'Cosmic Dreams',
        artist: 'Digital Artist',
        album: 'Web3 Sounds',
        artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        duration: 225,
        audioFiles: {
          high_quality: {
            uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
            format: 'WAV',
            bitrate: '1411kbps',
            size: 15000000
          },
          streaming: {
            uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
            format: 'MP3',
            bitrate: '320kbps',
            size: 8000000
          },
          mobile: {
            uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
            format: 'MP3',
            bitrate: '128kbps',
            size: 3000000
          }
        },
        accessType: 'free',
        metadata: {
          genre: 'Electronic',
          year: 2024,
          description: 'A dreamy electronic track exploring cosmic themes',
          tags: ['electronic', 'ambient', 'space']
        }
      },
      {
        id: 'demo_track_2',
        title: 'Neon Nights',
        artist: 'Synth Master',
        album: 'Retro Future',
        artwork: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop',
        duration: 198,
        audioFiles: {
          high_quality: {
            uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
            format: 'WAV',
            bitrate: '1411kbps',
            size: 12000000
          },
          streaming: {
            uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
            format: 'MP3',
            bitrate: '320kbps',
            size: 6500000
          },
          mobile: {
            uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
            format: 'MP3',
            bitrate: '128kbps',
            size: 2500000
          }
        },
        accessType: 'free',
        metadata: {
          genre: 'Synthwave',
          year: 2024,
          description: 'Retro-futuristic synthwave with neon aesthetics',
          tags: ['synthwave', 'retro', 'neon']
        }
      }
    ];

    for (const track of demoTracks) {
      await this.addTrackToLibrary(track);
    }
  }

  // Add track to user's library
  async addTrackToLibrary(track: PersistentTrack): Promise<void> {
    if (!this.library) {
      throw new Error('Library not initialized');
    }

    // Check if track already exists
    const existingTrack = this.library.tracks.find(t => t.id === track.id);
    if (existingTrack) {
      console.log('Track already in library:', track.title);
      return;
    }

    // Add track
    this.library.tracks.push(track);
    this.library.totalTracks = this.library.tracks.length;
    this.library.lastUpdated = new Date();

    // Calculate storage used (rough estimate)
    const trackSize = track.audioFiles.streaming?.size || 5000000; // 5MB default
    this.library.storageUsed += Math.round(trackSize / 1024 / 1024); // Convert to MB

    await this.saveLibraryToStorage();
    this.emit('trackAdded', track);
    this.emit('libraryUpdated', this.library);

    console.log('Added track to library:', track.title);
  }

  // Remove track from library
  async removeTrackFromLibrary(trackId: string): Promise<void> {
    if (!this.library) {
      throw new Error('Library not initialized');
    }

    const trackIndex = this.library.tracks.findIndex(t => t.id === trackId);
    if (trackIndex === -1) {
      throw new Error('Track not found in library');
    }

    const track = this.library.tracks[trackIndex];
    
    // Remove from library
    this.library.tracks.splice(trackIndex, 1);
    this.library.totalTracks = this.library.tracks.length;
    this.library.lastUpdated = new Date();

    // Update storage used
    const trackSize = track.audioFiles.streaming?.size || 5000000;
    this.library.storageUsed -= Math.round(trackSize / 1024 / 1024);
    this.library.storageUsed = Math.max(0, this.library.storageUsed);

    // Remove from playlists
    this.library.playlists.forEach(playlist => {
      const index = playlist.trackIds.indexOf(trackId);
      if (index > -1) {
        playlist.trackIds.splice(index, 1);
        playlist.updatedAt = new Date();
      }
    });

    // Clear audio cache
    this.clearTrackFromCache(trackId);

    await this.saveLibraryToStorage();
    this.emit('trackRemoved', track);
    this.emit('libraryUpdated', this.library);

    console.log('Removed track from library:', track.title);
  }

  // Get user's library
  getUserLibrary(): UserLibrary | null {
    return this.library;
  }

  // Get all tracks
  getAllTracks(): PersistentTrack[] {
    return this.library?.tracks || [];
  }

  // Get track by ID
  getTrackById(trackId: string): PersistentTrack | null {
    return this.library?.tracks.find(t => t.id === trackId) || null;
  }

  // Search tracks in library
  searchTracks(query: string): PersistentTrack[] {
    if (!this.library || !query.trim()) {
      return this.getAllTracks();
    }

    const searchTerm = query.toLowerCase();
    return this.library.tracks.filter(track => 
      track.title.toLowerCase().includes(searchTerm) ||
      track.artist.toLowerCase().includes(searchTerm) ||
      track.album?.toLowerCase().includes(searchTerm) ||
      track.metadata?.genre?.toLowerCase().includes(searchTerm) ||
      track.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Filter tracks by access type
  getTracksByAccessType(accessType: PersistentTrack['accessType']): PersistentTrack[] {
    return this.library?.tracks.filter(t => t.accessType === accessType) || [];
  }

  // Check if user has access to track
  hasAccessToTrack(trackId: string): boolean {
    const track = this.getTrackById(trackId);
    if (!track) return false;

    // Check expiration for subscription content
    if (track.accessType === 'subscription' && track.expiresAt) {
      return new Date() < track.expiresAt;
    }

    return true;
  }

  // Get audio URL for track (with caching)
  async getTrackAudioUrl(trackId: string, quality: 'high_quality' | 'streaming' | 'mobile' = 'streaming'): Promise<string | null> {
    const track = this.getTrackById(trackId);
    if (!track || !this.hasAccessToTrack(trackId)) {
      return null;
    }

    const cacheKey = `${trackId}_${quality}`;
    
    // Check cache first
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    // Get audio file info
    const audioFile = track.audioFiles[quality];
    if (!audioFile) {
      return null;
    }

    try {
      // For IPFS URLs, use gateway
      if (audioFile.uri.startsWith('ipfs://')) {
        const ipfsHash = audioFile.uri.replace('ipfs://', '');
        const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        
        // Cache the URL
        this.audioCache.set(cacheKey, gatewayUrl);
        return gatewayUrl;
      }

      // For regular URLs, return as-is
      this.audioCache.set(cacheKey, audioFile.uri);
      return audioFile.uri;
    } catch (error) {
      console.error('Error getting track audio URL:', error);
      return null;
    }
  }

  // Playlist management
  async createPlaylist(name: string, description?: string): Promise<UserPlaylist> {
    if (!this.library) {
      throw new Error('Library not initialized');
    }

    const playlist: UserPlaylist = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      trackIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false
    };

    this.library.playlists.push(playlist);
    this.library.lastUpdated = new Date();

    await this.saveLibraryToStorage();
    this.emit('playlistCreated', playlist);
    this.emit('libraryUpdated', this.library);

    return playlist;
  }

  // Add track to playlist
  async addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
    if (!this.library) {
      throw new Error('Library not initialized');
    }

    const playlist = this.library.playlists.find(p => p.id === playlistId);
    if (!playlist) {
      throw new Error('Playlist not found');
    }

    const track = this.getTrackById(trackId);
    if (!track) {
      throw new Error('Track not found in library');
    }

    if (!playlist.trackIds.includes(trackId)) {
      playlist.trackIds.push(trackId);
      playlist.updatedAt = new Date();
      this.library.lastUpdated = new Date();

      await this.saveLibraryToStorage();
      this.emit('playlistUpdated', playlist);
      this.emit('libraryUpdated', this.library);
    }
  }

  // Get playlist tracks
  getPlaylistTracks(playlistId: string): PersistentTrack[] {
    const playlist = this.library?.playlists.find(p => p.id === playlistId);
    if (!playlist) return [];

    return playlist.trackIds
      .map(id => this.getTrackById(id))
      .filter(track => track !== null) as PersistentTrack[];
  }

  // Storage management
  private loadLibraryFromStorage(): UserLibrary | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        parsed.lastUpdated = new Date(parsed.lastUpdated);
        parsed.playlists.forEach((playlist: any) => {
          playlist.createdAt = new Date(playlist.createdAt);
          playlist.updatedAt = new Date(playlist.updatedAt);
        });
        parsed.tracks.forEach((track: any) => {
          if (track.purchaseDate) track.purchaseDate = new Date(track.purchaseDate);
          if (track.expiresAt) track.expiresAt = new Date(track.expiresAt);
        });
        return parsed;
      }
    } catch (error) {
      console.error('Error loading library from storage:', error);
    }
    return null;
  }

  private async saveLibraryToStorage(): Promise<void> {
    try {
      if (this.library) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.library));
      }
    } catch (error) {
      console.error('Error saving library to storage:', error);
    }
  }

  private setupStorageListener(): void {
    // Listen for storage changes (multi-tab sync)
    window.addEventListener('storage', (event) => {
      if (event.key === this.STORAGE_KEY && event.newValue) {
        try {
          const newLibrary = JSON.parse(event.newValue);
          this.library = newLibrary;
          this.emit('libraryUpdated', this.library);
        } catch (error) {
          console.error('Error syncing library from storage:', error);
        }
      }
    });
  }

  // Cache management
  private clearTrackFromCache(trackId: string): void {
    const keysToRemove = Array.from(this.audioCache.keys()).filter(key => key.startsWith(trackId));
    keysToRemove.forEach(key => {
      const url = this.audioCache.get(key);
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      this.audioCache.delete(key);
    });
  }

  // Clear all cache
  clearCache(): void {
    this.audioCache.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.audioCache.clear();
  }

  // Get library stats
  getLibraryStats() {
    if (!this.library) return null;

    const accessTypeCounts = this.library.tracks.reduce((acc, track) => {
      acc[track.accessType] = (acc[track.accessType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTracks: this.library.totalTracks,
      totalPlaylists: this.library.playlists.length,
      storageUsed: this.library.storageUsed,
      accessTypeCounts,
      lastUpdated: this.library.lastUpdated
    };
  }

  // Export library (for backup)
  exportLibrary(): string {
    if (!this.library) {
      throw new Error('No library to export');
    }
    return JSON.stringify(this.library, null, 2);
  }

  // Import library (from backup)
  async importLibrary(libraryData: string): Promise<void> {
    try {
      const imported = JSON.parse(libraryData);
      // Validate structure
      if (!imported.walletAddress || !Array.isArray(imported.tracks)) {
        throw new Error('Invalid library format');
      }
      
      this.library = imported;
      await this.saveLibraryToStorage();
      this.emit('libraryUpdated', this.library);
    } catch (error) {
      console.error('Error importing library:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const persistentMusicService = new PersistentMusicService();
export default persistentMusicService;