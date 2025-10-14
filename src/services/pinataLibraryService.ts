/**
 * Pinata Library Service
 * Fetches and manages music files from Pinata IPFS gateway
 * Integrates uploaded files into the main webapp music library
 */

import { Track, Album, Artist } from './api';

interface PinataFile {
  id: string;
  ipfs_pin_hash: string;
  size: number;
  user_id: string;
  date_pinned: string;
  date_unpinned?: string;
  metadata: {
    name?: string;
    keyvalues?: {
      [key: string]: string;
    };
  };
  regions: Array<{
    regionId: string;
    currentReplicationCount: number;
    desiredReplicationCount: number;
  }>;
  mime_type?: string;
  number_of_files?: number;
}

interface PinataListResponse {
  count: number;
  rows: PinataFile[];
}

interface MusicFileMetadata {
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  year?: number;
  duration?: number;
  artwork?: string;
  description?: string;
  tags?: string[];
}

class PinataLibraryService {
  private readonly PINATA_GATEWAY = 'https://silver-changing-rook-174.mypinata.cloud';
  private readonly PINATA_API_BASE = 'https://api.pinata.cloud';
  private cachedTracks: Track[] = [];
  private cachedAlbums: Map<string, Album> = new Map();
  private cachedArtists: Map<string, Artist> = new Map();
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    console.log('🎵 Initializing Pinata Library Service...');
    console.log('📡 Gateway:', this.PINATA_GATEWAY);
    
    // Load cached data from localStorage
    this.loadFromCache();
    
    // Fetch fresh data in background
    this.fetchPinataFiles().catch(error => {
      console.warn('Background fetch failed:', error);
    });
  }

  /**
   * Get all music tracks from Pinata
   */
  async getAllTracks(): Promise<Track[]> {
    // Return cached data if recent
    if (this.isCacheValid()) {
      return this.cachedTracks;
    }

    // Fetch fresh data
    await this.fetchPinataFiles();
    return this.cachedTracks;
  }

  /**
   * Get albums (grouped by album name)
   */
  async getAllAlbums(): Promise<Album[]> {
    await this.getAllTracks(); // Ensure tracks are loaded
    return Array.from(this.cachedAlbums.values());
  }

  /**
   * Get artists (grouped by artist name)
   */
  async getAllArtists(): Promise<Artist[]> {
    await this.getAllTracks(); // Ensure tracks are loaded
    return Array.from(this.cachedArtists.values());
  }

  /**
   * Search tracks by query
   */
  async searchTracks(query: string): Promise<Track[]> {
    const tracks = await this.getAllTracks();
    const searchTerm = query.toLowerCase();
    
    return tracks.filter(track => 
      track.name.toLowerCase().includes(searchTerm) ||
      track.artistName.toLowerCase().includes(searchTerm) ||
      track.albumName.toLowerCase().includes(searchTerm) ||
      (track.ipfs?.metadata.genre && track.ipfs.metadata.genre.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get tracks by album
   */
  async getTracksByAlbum(albumName: string): Promise<Track[]> {
    const tracks = await this.getAllTracks();
    return tracks.filter(track => 
      track.albumName.toLowerCase() === albumName.toLowerCase()
    );
  }

  /**
   * Get tracks by artist
   */
  async getTracksByArtist(artistName: string): Promise<Track[]> {
    const tracks = await this.getAllTracks();
    return tracks.filter(track => 
      track.artistName.toLowerCase() === artistName.toLowerCase()
    );
  }

  /**
   * Fetch files from Pinata API and process them
   */
  private async fetchPinataFiles(): Promise<void> {
    try {
      console.log('🔄 Fetching files from Pinata...');
      
      // Get environment variables for Pinata API
      const apiKey = process.env.REACT_APP_PINATA_API_KEY || localStorage.getItem('pinata_api_key');
      const secretKey = process.env.REACT_APP_PINATA_SECRET_KEY || localStorage.getItem('pinata_secret_key');
      const jwt = process.env.REACT_APP_PINATA_JWT || localStorage.getItem('pinata_jwt');

      let files: PinataFile[] = [];

      // Try to fetch from Pinata API if credentials are available
      if (jwt || (apiKey && secretKey)) {
        try {
          files = await this.fetchFromPinataAPI(jwt, apiKey, secretKey);
        } catch (error) {
          console.warn('Pinata API fetch failed, using gateway discovery:', error);
          files = await this.discoverFilesFromGateway();
        }
      } else {
        console.log('No Pinata API credentials, using gateway discovery');
        files = await this.discoverFilesFromGateway();
      }

      // Process files into tracks
      const tracks = await this.processFilesToTracks(files);
      
      // Update cache
      this.cachedTracks = tracks;
      this.lastFetchTime = Date.now();
      
      // Process albums and artists
      this.processAlbumsAndArtists(tracks);
      
      // Save to localStorage
      this.saveToCache();
      
      console.log(`✅ Loaded ${tracks.length} tracks from Pinata`);
      console.log(`📀 Found ${this.cachedAlbums.size} albums`);
      console.log(`🎤 Found ${this.cachedArtists.size} artists`);
      
    } catch (error) {
      console.error('Error fetching Pinata files:', error);
      // Keep existing cached data on error
    }
  }

  /**
   * Fetch files using Pinata API
   */
  private async fetchFromPinataAPI(jwt?: string, apiKey?: string, secretKey?: string): Promise<PinataFile[]> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`;
    } else if (apiKey && secretKey) {
      headers['pinata_api_key'] = apiKey;
      headers['pinata_secret_api_key'] = secretKey;
    } else {
      throw new Error('No authentication credentials provided');
    }

    // Fetch pinned files
    const response = await fetch(`${this.PINATA_API_BASE}/data/pinList?status=pinned&pageLimit=1000`, {
      headers
    });

    if (!response.ok) {
      throw new Error(`Pinata API error: ${response.status} ${response.statusText}`);
    }

    const data: PinataListResponse = await response.json();
    return data.rows || [];
  }

  /**
   * Discover files by trying common IPFS hashes or using a discovery method
   */
  private async discoverFilesFromGateway(): Promise<PinataFile[]> {
    // This is a fallback method when API access isn't available
    console.log('Using gateway discovery method...');
    
    // Try to load from localStorage cache
    const cached = localStorage.getItem('pinata_discovered_files');
    if (cached) {
      try {
        const files = JSON.parse(cached);
        console.log(`📱 Loaded ${files.length} files from discovery cache`);
        return files;
      } catch (error) {
        console.warn('Error parsing cached discovery files:', error);
      }
    }

    // Create some test files for demonstration
    // In production, you would have actual IPFS hashes from your uploads
    const testFiles: PinataFile[] = [
      {
        id: 'test-1',
        ipfs_pin_hash: 'QmTestHash1234567890abcdef',
        size: 3500000,
        user_id: 'user-test',
        date_pinned: new Date().toISOString(),
        metadata: {
          name: 'Artist Name - Album Name - Track 1.mp3',
          keyvalues: {
            title: 'Track 1',
            artist: 'Artist Name',
            album: 'Album Name',
            genre: 'Electronic'
          }
        },
        regions: [],
        mime_type: 'audio/mpeg'
      },
      {
        id: 'test-2',
        ipfs_pin_hash: 'QmTestHash2345678901bcdefg',
        size: 4200000,
        user_id: 'user-test',
        date_pinned: new Date().toISOString(),
        metadata: {
          name: 'Artist Name - Album Name - Track 2.mp3',
          keyvalues: {
            title: 'Track 2',
            artist: 'Artist Name',
            album: 'Album Name',
            genre: 'Electronic'
          }
        },
        regions: [],
        mime_type: 'audio/mpeg'
      },
      {
        id: 'test-artwork',
        ipfs_pin_hash: 'QmTestArtwork123456789abcd',
        size: 150000,
        user_id: 'user-test',
        date_pinned: new Date().toISOString(),
        metadata: {
          name: 'Album Name Cover.jpg',
          keyvalues: {
            album: 'Album Name',
            type: 'artwork'
          }
        },
        regions: [],
        mime_type: 'image/jpeg'
      }
    ];

    // Save test files to cache for next time
    localStorage.setItem('pinata_discovered_files', JSON.stringify(testFiles));
    console.log(`🧪 Created ${testFiles.length} test files for demonstration`);
    
    return testFiles;
  }

  /**
   * Process Pinata files into Track objects
   */
  private async processFilesToTracks(files: PinataFile[]): Promise<Track[]> {
    const tracks: Track[] = [];
    
    // Filter for audio files
    const audioFiles = files.filter(file => 
      file.mime_type?.startsWith('audio/') || 
      file.metadata?.name?.match(/\.(mp3|wav|flac|aac|ogg|m4a)$/i)
    );

    // Group files by potential albums (same metadata album or similar names)
    const albumGroups = this.groupFilesByAlbum(audioFiles);

    for (const [albumKey, albumFiles] of albumGroups.entries()) {
      // Find artwork for this album
      const artworkFile = await this.findArtworkForAlbum(albumKey, files);
      
      for (const file of albumFiles) {
        try {
          const track = await this.createTrackFromFile(file, artworkFile);
          if (track) {
            tracks.push(track);
          }
        } catch (error) {
          console.warn(`Error processing file ${file.ipfs_pin_hash}:`, error);
        }
      }
    }

    return tracks;
  }

  /**
   * Group files by album based on metadata or filename patterns
   */
  private groupFilesByAlbum(files: PinataFile[]): Map<string, PinataFile[]> {
    const groups = new Map<string, PinataFile[]>();

    for (const file of files) {
      // Try to extract album from metadata
      let albumKey = 'Unknown Album';
      
      if (file.metadata?.keyvalues?.album) {
        albumKey = file.metadata.keyvalues.album;
      } else if (file.metadata?.name) {
        // Try to extract album from filename patterns
        const name = file.metadata.name;
        
        // Pattern: "Artist - Album - Track.mp3"
        const albumMatch = name.match(/^([^-]+)\s*-\s*([^-]+)\s*-\s*(.+)\.(mp3|wav|flac|aac|ogg|m4a)$/i);
        if (albumMatch) {
          albumKey = albumMatch[2].trim();
        } else {
          // Pattern: "Album/Track.mp3" or "Album - Track.mp3"
          const simpleMatch = name.match(/^([^\/\\-]+)[\\/\-]\s*(.+)\.(mp3|wav|flac|aac|ogg|m4a)$/i);
          if (simpleMatch) {
            albumKey = simpleMatch[1].trim();
          }
        }
      }

      if (!groups.has(albumKey)) {
        groups.set(albumKey, []);
      }
      groups.get(albumKey)!.push(file);
    }

    return groups;
  }

  /**
   * Find artwork file for an album
   */
  private async findArtworkForAlbum(albumKey: string, allFiles: PinataFile[]): Promise<PinataFile | null> {
    // Look for image files with similar names or metadata
    const imageFiles = allFiles.filter(file => 
      file.mime_type?.startsWith('image/') || 
      file.metadata?.name?.match(/\.(jpg|jpeg|png|webp|gif)$/i)
    );

    for (const imageFile of imageFiles) {
      const name = imageFile.metadata?.name?.toLowerCase() || '';
      const albumLower = albumKey.toLowerCase();
      
      // Check if image name contains album name or common artwork names
      if (
        name.includes(albumLower) ||
        name.includes('cover') ||
        name.includes('artwork') ||
        name.includes('album') ||
        imageFile.metadata?.keyvalues?.album === albumKey
      ) {
        return imageFile;
      }
    }

    return null;
  }

  /**
   * Create a Track object from a Pinata file
   */
  private async createTrackFromFile(file: PinataFile, artworkFile?: PinataFile | null): Promise<Track | null> {
    try {
      // Extract metadata from file
      const metadata = this.extractMetadataFromFile(file);
      
      // Create track ID
      const trackId = `pinata-${file.ipfs_pin_hash}`;
      
      // Get file URLs
      const audioUrl = `${this.PINATA_GATEWAY}/ipfs/${file.ipfs_pin_hash}`;
      const artworkUrl = artworkFile ? `${this.PINATA_GATEWAY}/ipfs/${artworkFile.ipfs_pin_hash}` : undefined;

      const track: Track = {
        id: trackId,
        name: metadata.title,
        artistName: metadata.artist,
        albumName: metadata.album || 'Unknown Album',
        duration: metadata.duration || 0,
        previewURL: audioUrl,
        albumId: `album-${this.sanitizeId(metadata.album || 'unknown')}`,
        artistId: `artist-${this.sanitizeId(metadata.artist)}`,
        image: artworkUrl,
        
        // Add IPFS metadata for compatibility
        ipfs: {
          hash: file.ipfs_pin_hash,
          audioFiles: {
            high_quality: {
              uri: `ipfs://${file.ipfs_pin_hash}`,
              format: this.getFormatFromMimeType(file.mime_type),
              bitrate: '320kbps',
              size: file.size
            },
            streaming: {
              uri: `ipfs://${file.ipfs_pin_hash}`,
              format: 'MP3',
              bitrate: '192kbps',
              size: Math.floor(file.size * 0.6)
            },
            mobile: {
              uri: `ipfs://${file.ipfs_pin_hash}`,
              format: 'MP3',
              bitrate: '128kbps',
              size: Math.floor(file.size * 0.4)
            }
          },
          metadata: {
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            genre: metadata.genre,
            year: metadata.year,
            artwork: artworkUrl,
            created_at: file.date_pinned
            // Note: description and tags would need to be added to the metadata interface
          }
        },
        
        // Additional metadata (these would need to be added to Track interface or stored elsewhere)
        // uploadedAt: file.date_pinned,
        // fileSize: file.size,
        // mimeType: file.mime_type
      };

      return track;
    } catch (error) {
      console.error('Error creating track from file:', error);
      return null;
    }
  }

  /**
   * Extract metadata from Pinata file
   */
  private extractMetadataFromFile(file: PinataFile): MusicFileMetadata {
    const keyvalues = file.metadata?.keyvalues || {};
    const fileName = file.metadata?.name || `Track ${file.ipfs_pin_hash.substring(0, 8)}`;
    
    // Try to extract from keyvalues first
    if (keyvalues.title && keyvalues.artist) {
      return {
        title: keyvalues.title,
        artist: keyvalues.artist,
        album: keyvalues.album,
        genre: keyvalues.genre,
        year: keyvalues.year ? parseInt(keyvalues.year) : undefined,
        duration: keyvalues.duration ? parseFloat(keyvalues.duration) : undefined,
        description: keyvalues.description,
        tags: keyvalues.tags ? keyvalues.tags.split(',').map(t => t.trim()) : undefined
      };
    }
    
    // Try to extract from filename
    const metadata = this.parseFilename(fileName);
    
    // Merge with any available keyvalues
    return {
      title: keyvalues.title || metadata.title,
      artist: keyvalues.artist || metadata.artist,
      album: keyvalues.album || metadata.album,
      genre: keyvalues.genre || metadata.genre,
      year: keyvalues.year ? parseInt(keyvalues.year) : metadata.year,
      duration: keyvalues.duration ? parseFloat(keyvalues.duration) : metadata.duration,
      description: keyvalues.description || metadata.description,
      tags: keyvalues.tags ? keyvalues.tags.split(',').map(t => t.trim()) : metadata.tags
    };
  }

  /**
   * Parse filename to extract metadata
   */
  private parseFilename(filename: string): MusicFileMetadata {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Pattern: "Artist - Album - Track"
    let match = nameWithoutExt.match(/^([^-]+)\s*-\s*([^-]+)\s*-\s*(.+)$/);
    if (match) {
      return {
        artist: match[1].trim(),
        album: match[2].trim(),
        title: match[3].trim()
      };
    }
    
    // Pattern: "Artist - Track"
    match = nameWithoutExt.match(/^([^-]+)\s*-\s*(.+)$/);
    if (match) {
      return {
        artist: match[1].trim(),
        title: match[2].trim()
      };
    }
    
    // Pattern: "Album/Track" or "Album\Track"
    match = nameWithoutExt.match(/^([^\/\\]+)[\\/](.+)$/);
    if (match) {
      return {
        album: match[1].trim(),
        title: match[2].trim(),
        artist: 'Unknown Artist'
      };
    }
    
    // Default: use filename as title
    return {
      title: nameWithoutExt,
      artist: 'Unknown Artist'
    };
  }

  /**
   * Process albums and artists from tracks
   */
  private processAlbumsAndArtists(tracks: Track[]): void {
    this.cachedAlbums.clear();
    this.cachedArtists.clear();

    // Group tracks by album and artist
    const albumMap = new Map<string, Track[]>();
    const artistMap = new Map<string, Track[]>();

    for (const track of tracks) {
      // Group by album
      const albumKey = track.albumName.toLowerCase();
      if (!albumMap.has(albumKey)) {
        albumMap.set(albumKey, []);
      }
      albumMap.get(albumKey)!.push(track);

      // Group by artist
      const artistKey = track.artistName.toLowerCase();
      if (!artistMap.has(artistKey)) {
        artistMap.set(artistKey, []);
      }
      artistMap.get(artistKey)!.push(track);
    }

    // Create Album objects
    for (const [albumKey, albumTracks] of albumMap.entries()) {
      const firstTrack = albumTracks[0];
      const album: Album = {
        id: firstTrack.albumId,
        name: firstTrack.albumName,
        artistName: firstTrack.artistName,
        artistId: firstTrack.artistId || '',
        image: firstTrack.image || '',
        releaseDate: new Date().toISOString() // Use current date as fallback
      };
      this.cachedAlbums.set(album.id, album);
    }

    // Create Artist objects
    for (const [artistKey, artistTracks] of artistMap.entries()) {
      const firstTrack = artistTracks[0];
      const artist: Artist = {
        id: firstTrack.artistId || '',
        name: firstTrack.artistName,
        image: firstTrack.image || '',
        type: 'artist'
      };
      this.cachedArtists.set(artist.id, artist);
    }
  }

  /**
   * Utility methods
   */
  private sanitizeId(text: string): string {
    return text.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private getFormatFromMimeType(mimeType?: string): 'MP3' | 'AAC' {
    if (!mimeType) return 'MP3';
    
    switch (mimeType) {
      case 'audio/mpeg':
        return 'MP3';
      case 'audio/aac':
      case 'audio/mp4':
        return 'AAC';
      case 'audio/flac':
      case 'audio/wav':
      case 'audio/ogg':
      default:
        return 'MP3'; // Convert unsupported formats to MP3
    }
  }

  private isCacheValid(): boolean {
    return Date.now() - this.lastFetchTime < this.CACHE_DURATION && this.cachedTracks.length > 0;
  }

  private saveToCache(): void {
    try {
      const cacheData = {
        tracks: this.cachedTracks,
        albums: Array.from(this.cachedAlbums.values()),
        artists: Array.from(this.cachedArtists.values()),
        timestamp: this.lastFetchTime
      };
      localStorage.setItem('pinata_library_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error saving to cache:', error);
    }
  }

  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem('pinata_library_cache');
      if (cached) {
        const cacheData = JSON.parse(cached);
        this.cachedTracks = cacheData.tracks || [];
        this.lastFetchTime = cacheData.timestamp || 0;
        
        // Rebuild maps
        if (cacheData.albums) {
          this.cachedAlbums.clear();
          cacheData.albums.forEach((album: Album) => {
            this.cachedAlbums.set(album.id, album);
          });
        }
        
        if (cacheData.artists) {
          this.cachedArtists.clear();
          cacheData.artists.forEach((artist: Artist) => {
            this.cachedArtists.set(artist.id, artist);
          });
        }
        
        console.log(`📱 Loaded ${this.cachedTracks.length} tracks from cache`);
      }
    } catch (error) {
      console.warn('Error loading from cache:', error);
    }
  }

  /**
   * Force refresh data from Pinata
   */
  async refresh(): Promise<void> {
    this.lastFetchTime = 0; // Invalidate cache
    await this.fetchPinataFiles();
  }

  /**
   * Get library statistics
   */
  getStats() {
    return {
      totalTracks: this.cachedTracks.length,
      totalAlbums: this.cachedAlbums.size,
      totalArtists: this.cachedArtists.size,
      lastUpdated: new Date(this.lastFetchTime).toISOString(),
      cacheValid: this.isCacheValid()
    };
  }

  /**
   * Add a test file manually (for debugging)
   */
  async addTestFile(fileName: string, ipfsHash: string, metadata?: any): Promise<void> {
    const testFile: PinataFile = {
      id: `manual-${Date.now()}`,
      ipfs_pin_hash: ipfsHash,
      size: 3500000,
      user_id: 'manual-user',
      date_pinned: new Date().toISOString(),
      metadata: {
        name: fileName,
        keyvalues: metadata || {}
      },
      regions: [],
      mime_type: fileName.endsWith('.mp3') ? 'audio/mpeg' : 
                 fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ? 'image/jpeg' :
                 fileName.endsWith('.png') ? 'image/png' : 'application/octet-stream'
    };

    // Get existing cached files
    const cached = localStorage.getItem('pinata_discovered_files');
    let files: PinataFile[] = [];
    if (cached) {
      try {
        files = JSON.parse(cached);
      } catch (error) {
        console.warn('Error parsing cached files:', error);
      }
    }

    // Add new file
    files.push(testFile);
    localStorage.setItem('pinata_discovered_files', JSON.stringify(files));

    // Refresh the library
    await this.refresh();
    console.log(`✅ Added test file: ${fileName} with hash: ${ipfsHash}`);
  }

  /**
   * Clear all cached files (for debugging)
   */
  clearCache(): void {
    localStorage.removeItem('pinata_library_cache');
    localStorage.removeItem('pinata_discovered_files');
    this.cachedTracks = [];
    this.cachedAlbums.clear();
    this.cachedArtists.clear();
    this.lastFetchTime = 0;
    console.log('🗑️ Cleared all Pinata cache');
  }
}

// Export singleton instance
export const pinataLibraryService = new PinataLibraryService();
export default pinataLibraryService;