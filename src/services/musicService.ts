// Enhanced Music Service with IPFS Integration
import { Track, Artist, Album } from './api';
import { simpleIPFSService as ipfsService, AudioFileStructure, MusicMetadata } from './ipfsServiceSimple';
import { getTopTracks } from './supabaseService';
import { pinataLibraryService } from './pinataLibraryService';

interface NetworkQuality {
  connection: 'slow' | 'medium' | 'fast';
  bitrate: 128 | 192 | 320;
  format: 'mobile' | 'streaming' | 'high_quality';
}

class MusicService {
  private networkQuality: NetworkQuality = {
    connection: 'medium',
    bitrate: 192,
    format: 'streaming'
  };

  constructor() {
    this.detectNetworkQuality();
  }

  private detectNetworkQuality() {
    const connection = (navigator as any).connection;
    if (connection) {
      const getNetworkQuality = (): NetworkQuality => {
        const { effectiveType, downlink } = connection;
        
        if (effectiveType === '4g' && downlink > 10) {
          return { connection: 'fast', bitrate: 320, format: 'high_quality' };
        } else if (effectiveType === '3g' || (effectiveType === '4g' && downlink > 1)) {
          return { connection: 'medium', bitrate: 192, format: 'streaming' };
        } else {
          return { connection: 'slow', bitrate: 128, format: 'mobile' };
        }
      };

      this.networkQuality = getNetworkQuality();

      const handleConnectionChange = () => {
        this.networkQuality = getNetworkQuality();
        console.log('Network quality changed:', this.networkQuality);
      };

      connection.addEventListener('change', handleConnectionChange);
    }
  }

  // Get optimal audio URL for a track
  async getTrackAudioUrl(track: Track): Promise<string> {
    // If track has IPFS data, use it
    if (track.ipfs?.audioFiles) {
      return await this.getIPFSAudioUrl(track.ipfs.audioFiles);
    }
    
    // Fallback to traditional URL
    return track.previewURL;
  }

  // Get IPFS audio URL based on network quality
  private async getIPFSAudioUrl(audioFiles: AudioFileStructure): Promise<string> {
    // Select appropriate quality based on network
    let selectedAudio = audioFiles[this.networkQuality.format];
    
    // Fallback to available formats
    if (!selectedAudio) {
      selectedAudio = audioFiles.streaming || audioFiles.high_quality || audioFiles.mobile;
    }

    if (!selectedAudio) {
      throw new Error('No audio files available');
    }

    // Extract IPFS hash from URI
    const ipfsHash = selectedAudio.uri.replace('ipfs://', '');
    
    // Get optimal gateway URL
    return await ipfsService.getOptimalGatewayUrl(ipfsHash);
  }

  // Check if user has access to track (simplified - no NFT gating)
  async checkTrackAccess(track: Track): Promise<boolean> {
    // All tracks are accessible without NFT gating
    return true;
  }

  // Upload track to IPFS
  async uploadTrack(
    audioFile: File,
    metadata: {
      title: string;
      artist: string;
      album?: string;
      genre?: string;
      year?: number;
      artwork?: string;
    }
  ): Promise<Track> {
    try {
      // Process audio file and upload to IPFS
      const { metadata: ipfsMetadata, ipfsHashes } = await ipfsService.processAudioFile(audioFile);
      
      // Update metadata with provided information
      const completeMetadata: MusicMetadata = {
        ...ipfsMetadata,
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        genre: metadata.genre,
        year: metadata.year,
        artwork: metadata.artwork
      };

      // Upload metadata to IPFS
      const metadataHash = await ipfsService.uploadMetadata(completeMetadata);

      // Create Track object
      const track: Track = {
        id: `ipfs-${Date.now()}`,
        name: metadata.title,
        artistName: metadata.artist,
        albumName: metadata.album || 'Unknown Album',
        duration: 0, // Would be extracted from audio file in production
        previewURL: await this.getIPFSAudioUrl(ipfsHashes), // For backward compatibility
        albumId: `album-${metadata.album || 'unknown'}`,
        artistId: `artist-${metadata.artist}`,
        image: metadata.artwork,
        ipfs: {
          hash: metadataHash,
          audioFiles: ipfsHashes,
          metadata: completeMetadata
        }
      };

      console.log('Track uploaded to IPFS:', track);
      return track;
    } catch (error) {
      console.error('Error uploading track to IPFS:', error);
      throw error;
    }
  }

  // Create regular track (NFT functionality removed)
  async createRegularTrack(
    audioFile: File,
    metadata: {
      title: string;
      artist: string;
      album?: string;
      genre?: string;
      year?: number;
      artwork?: string;
    }
  ): Promise<Track> {
    return await this.uploadTrack(audioFile, metadata);
  }

  // Get tracks from Supabase database (replacing demo tracks)
  async getIPFSTracks(): Promise<Track[]> {
    try {
      // Fetch tracks from Supabase
      const supabaseTracks = await getTopTracks(20); // Get up to 20 tracks

      // Convert Supabase tracks to IPFS-compatible format
      const ipfsTracks: Track[] = supabaseTracks.map(track => ({
        ...track,
        // Add IPFS metadata structure for compatibility with IPFS player
        ipfs: {
          hash: `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`, // Mock IPFS hash for now
          audioFiles: {
            high_quality: {
              uri: `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
              format: 'MP3',
              bitrate: '320kbps',
              size: Math.floor(track.duration * 40000) // Estimate file size
            },
            streaming: {
              uri: `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
              format: 'MP3',
              bitrate: '192kbps',
              size: Math.floor(track.duration * 24000)
            },
            mobile: {
              uri: `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
              format: 'MP3',
              bitrate: '128kbps',
              size: Math.floor(track.duration * 16000)
            }
          },
          metadata: {
            title: track.name,
            artist: track.artistName,
            album: track.albumName,
            genre: 'Electronic', // Default genre, could be enhanced later
            year: 2024,
            artwork: track.image,
            created_at: new Date().toISOString()
          }
        }
      }));

      return ipfsTracks;
    } catch (error) {
      console.error('Error fetching Supabase tracks:', error);
      // Fallback to empty array if Supabase fails
      return [];
    }
  }

  // Get all tracks (Pinata + IPFS + traditional + user uploads) - ALL TAGGED AS IPFS
  async getAllTracks(): Promise<Track[]> {
    try {
      // Get all track sources
      const [pinataTracks, demoTracks, userTracks] = await Promise.all([
        pinataLibraryService.getAllTracks(),
        this.getIPFSTracks(),
        this.getUserUploadedTracks()
      ]);
      
      // Get traditional tracks (from existing API) and tag them as IPFS
      const traditionalTracks: Track[] = await this.getTraditionalTracksAsIPFS();
      
      // Combine all sources (Pinata tracks first, then user uploads, then demo, then traditional)
      return [...pinataTracks, ...userTracks, ...demoTracks, ...traditionalTracks];
    } catch (error) {
      console.error('Error fetching tracks:', error);
      return [];
    }
  }

  // Convert traditional tracks to appear as IPFS tracks
  private async getTraditionalTracksAsIPFS(): Promise<Track[]> {
    // Mock traditional tracks that will appear as IPFS-based
    const traditionalTracks: Track[] = [
      {
        id: 'trad-1',
        name: 'Summer Vibes',
        artistName: 'Beach House',
        albumName: 'Coastal Dreams',
        duration: 195,
        previewURL: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
        albumId: 'album-coastal-dreams',
        artistId: 'artist-beach-house',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop'
      },
      {
        id: 'trad-2',
        name: 'City Lights',
        artistName: 'Urban Echo',
        albumName: 'Metropolitan',
        duration: 220,
        previewURL: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
        albumId: 'album-metropolitan',
        artistId: 'artist-urban-echo',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop'
      },
      {
        id: 'trad-3',
        name: 'Midnight Drive',
        artistName: 'Neon Nights',
        albumName: 'After Hours',
        duration: 185,
        previewURL: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
        albumId: 'album-after-hours',
        artistId: 'artist-neon-nights',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop'
      },
      {
        id: 'trad-4',
        name: 'Ocean Waves',
        artistName: 'Ambient Collective',
        albumName: 'Natural Sounds',
        duration: 300,
        previewURL: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
        albumId: 'album-natural-sounds',
        artistId: 'artist-ambient-collective',
        image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=400&fit=crop'
      },
      {
        id: 'trad-5',
        name: 'Electric Dreams',
        artistName: 'Synth Masters',
        albumName: 'Digital Age',
        duration: 240,
        previewURL: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Placeholder
        albumId: 'album-digital-age',
        artistId: 'artist-synth-masters',
        image: 'https://images.unsplash.com/photo-1571974599782-87624638275c?w=400&h=400&fit=crop'
      }
    ];

    // Add IPFS metadata to all traditional tracks to make them appear IPFS-based
    return traditionalTracks.map(track => ({
      ...track,
      ipfs: {
        hash: `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`, // Mock IPFS hash
        audioFiles: {
          high_quality: {
            uri: `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
            format: 'MP3',
            bitrate: '320kbps',
            size: Math.floor(track.duration * 40000) // Estimate file size
          },
          streaming: {
            uri: `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
            format: 'MP3',
            bitrate: '192kbps',
            size: Math.floor(track.duration * 24000)
          },
          mobile: {
            uri: `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
            format: 'MP3',
            bitrate: '128kbps',
            size: Math.floor(track.duration * 16000)
          }
        },
        metadata: {
          title: track.name,
          artist: track.artistName,
          album: track.albumName,
          genre: this.getRandomGenre(),
          year: 2024,
          artwork: track.image,
          created_at: new Date().toISOString()
        }
      }
    }));
  }

  // Helper to get random genre for traditional tracks
  private getRandomGenre(): string {
    const genres = ['Electronic', 'Ambient', 'Synthwave', 'Chillout', 'House', 'Techno', 'Downtempo', 'Future Bass'];
    return genres[Math.floor(Math.random() * genres.length)];
  }

  // Search tracks (including Pinata and IPFS)
  async searchTracks(query: string): Promise<Track[]> {
    try {
      // Search Pinata tracks first (they're the real uploaded files)
      const pinataResults = await pinataLibraryService.searchTracks(query);
      
      // Search other tracks
      const allTracks = await this.getAllTracks();
      const otherResults = allTracks.filter(track => 
        !track.id.startsWith('pinata-') && ( // Exclude Pinata tracks to avoid duplicates
          track.name.toLowerCase().includes(query.toLowerCase()) ||
          track.artistName.toLowerCase().includes(query.toLowerCase()) ||
          track.albumName.toLowerCase().includes(query.toLowerCase()) ||
          (track.ipfs?.metadata.genre && track.ipfs.metadata.genre.toLowerCase().includes(query.toLowerCase()))
        )
      );
      
      // Combine results (Pinata first)
      return [...pinataResults, ...otherResults];
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  }

  // Get user uploaded tracks from local storage
  async getUserUploadedTracks(): Promise<Track[]> {
    try {
      const cachedFiles = await ipfsService.getCachedFiles();
      const userTracks: Track[] = [];

      for (const file of cachedFiles) {
        try {
          // Get file metadata from localStorage
          const fileData = localStorage.getItem(`ipfs_file_${file.hash}`);
          if (fileData) {
            const parsedData = JSON.parse(fileData);
            
            // Create Track object from cached file
            const track: Track = {
              id: `user-${file.hash}`,
              name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
              artistName: 'You', // User uploaded
              albumName: 'My Uploads',
              duration: 0, // Would need to be extracted from audio
              previewURL: await ipfsService.getOptimalGatewayUrl(file.hash),
              albumId: 'album-my-uploads',
              artistId: 'artist-user',
              image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
              ipfs: {
                hash: file.hash,
                audioFiles: {
                  high_quality: {
                    uri: `ipfs://${file.hash}`,
                    format: 'MP3',
                    bitrate: '320kbps',
                    size: file.size
                  },
                  streaming: {
                    uri: `ipfs://${file.hash}`,
                    format: 'MP3',
                    bitrate: '192kbps',
                    size: Math.floor(file.size * 0.6)
                  },
                  mobile: {
                    uri: `ipfs://${file.hash}`,
                    format: 'MP3',
                    bitrate: '128kbps',
                    size: Math.floor(file.size * 0.4)
                  }
                },
                metadata: {
                  title: file.name.replace(/\.[^/.]+$/, ''),
                  artist: 'You',
                  album: 'My Uploads',
                  genre: 'User Upload',
                  year: new Date().getFullYear(),
                  artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
                  created_at: file.uploadedAt
                }
              }
            };

            userTracks.push(track);
          }
        } catch (error) {
          console.error('Error processing cached file:', file.hash, error);
        }
      }

      return userTracks;
    } catch (error) {
      console.error('Error getting user uploaded tracks:', error);
      return [];
    }
  }

  // Get featured IPFS tracks (including Pinata and user uploads)
  async getFeaturedIPFSTracks(): Promise<Track[]> {
    try {
      // Get all track sources
      const [pinataTracks, demoTracks, userTracks] = await Promise.all([
        pinataLibraryService.getAllTracks(),
        this.getIPFSTracks(),
        this.getUserUploadedTracks()
      ]);

      // Combine Pinata tracks first (real uploads), then user uploads, then demo tracks
      const allTracks = [...pinataTracks, ...userTracks, ...demoTracks];
      
      return allTracks.slice(0, 10); // Return first 10 as featured
    } catch (error) {
      console.error('Error getting featured IPFS tracks:', error);
      return [];
    }
  }

  // Get featured tracks (NFT functionality removed)
  async getFeaturedTracks(): Promise<Track[]> {
    const allTracks = await this.getAllTracks();
    return allTracks.slice(0, 10); // Return first 10 as featured
  }

  // Get all albums (including Pinata albums)
  async getAllAlbums(): Promise<Album[]> {
    try {
      const pinataAlbums = await pinataLibraryService.getAllAlbums();
      
      // Create albums from other tracks
      const allTracks = await this.getAllTracks();
      const otherTracks = allTracks.filter(track => !track.id.startsWith('pinata-'));
      
      const albumMap = new Map<string, Album>();
      
      // Add Pinata albums first
      pinataAlbums.forEach(album => {
        albumMap.set(album.id, album);
      });
      
      // Process other tracks into albums
      for (const track of otherTracks) {
        if (!albumMap.has(track.albumId)) {
          const albumTracks = otherTracks.filter(t => t.albumId === track.albumId);
          const album: Album = {
            id: track.albumId,
            name: track.albumName,
            artistName: track.artistName,
            artistId: track.artistId || '',
            image: track.image || '',
            releaseDate: new Date().toISOString()
          };
          albumMap.set(album.id, album);
        }
      }
      
      return Array.from(albumMap.values());
    } catch (error) {
      console.error('Error getting albums:', error);
      return [];
    }
  }

  // Get all artists (including Pinata artists)
  async getAllArtists(): Promise<Artist[]> {
    try {
      const pinataArtists = await pinataLibraryService.getAllArtists();
      
      // Create artists from other tracks
      const allTracks = await this.getAllTracks();
      const otherTracks = allTracks.filter(track => !track.id.startsWith('pinata-'));
      
      const artistMap = new Map<string, Artist>();
      
      // Add Pinata artists first
      pinataArtists.forEach(artist => {
        artistMap.set(artist.id, artist);
      });
      
      // Process other tracks into artists
      for (const track of otherTracks) {
        if (!artistMap.has(track.artistId)) {
          const artistTracks = otherTracks.filter(t => t.artistId === track.artistId);
          const artist: Artist = {
            id: track.artistId || '',
            name: track.artistName,
            image: track.image || '',
            type: 'artist'
          };
          artistMap.set(artist.id, artist);
        }
      }
      
      return Array.from(artistMap.values());
    } catch (error) {
      console.error('Error getting artists:', error);
      return [];
    }
  }

  // Get tracks by album (including Pinata)
  async getTracksByAlbum(albumName: string): Promise<Track[]> {
    try {
      const pinataTracks = await pinataLibraryService.getTracksByAlbum(albumName);
      const allTracks = await this.getAllTracks();
      const otherTracks = allTracks.filter(track => 
        !track.id.startsWith('pinata-') && 
        track.albumName.toLowerCase() === albumName.toLowerCase()
      );
      
      return [...pinataTracks, ...otherTracks];
    } catch (error) {
      console.error('Error getting tracks by album:', error);
      return [];
    }
  }

  // Get tracks by artist (including Pinata)
  async getTracksByArtist(artistName: string): Promise<Track[]> {
    try {
      const pinataTracks = await pinataLibraryService.getTracksByArtist(artistName);
      const allTracks = await this.getAllTracks();
      const otherTracks = allTracks.filter(track => 
        !track.id.startsWith('pinata-') && 
        track.artistName.toLowerCase() === artistName.toLowerCase()
      );
      
      return [...pinataTracks, ...otherTracks];
    } catch (error) {
      console.error('Error getting tracks by artist:', error);
      return [];
    }
  }

  // Refresh Pinata library
  async refreshPinataLibrary(): Promise<void> {
    try {
      await pinataLibraryService.refresh();
      console.log('✅ Pinata library refreshed');
    } catch (error) {
      console.error('Error refreshing Pinata library:', error);
    }
  }

  // Get library statistics
  getLibraryStats() {
    const pinataStats = pinataLibraryService.getStats();
    return {
      pinata: pinataStats,
      networkQuality: this.networkQuality,
      totalSources: 4 // Pinata + User uploads + Demo + Traditional
    };
  }

  // Get current network quality
  getNetworkQuality(): NetworkQuality {
    return this.networkQuality;
  }

  // Force network quality (for testing)
  setNetworkQuality(quality: NetworkQuality) {
    this.networkQuality = quality;
  }
}

// Export singleton instance
export const musicService = new MusicService();
export default musicService;