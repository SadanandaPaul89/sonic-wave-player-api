// React hook for persistent music library management

import { useState, useEffect, useCallback } from 'react';
import { persistentMusicService, PersistentTrack, UserLibrary, UserPlaylist } from '@/services/persistentMusicService';
import { web3Service } from '@/services/web3Service';

interface PersistentMusicState {
  library: UserLibrary | null;
  tracks: PersistentTrack[];
  playlists: UserPlaylist[];
  currentTrack: PersistentTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

interface PersistentMusicActions {
  initializeLibrary: () => Promise<void>;
  addTrack: (track: PersistentTrack) => Promise<void>;
  removeTrack: (trackId: string) => Promise<void>;
  playTrack: (trackId: string) => Promise<void>;
  pauseTrack: () => void;
  searchTracks: (query: string) => PersistentTrack[];
  createPlaylist: (name: string, description?: string) => Promise<UserPlaylist>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  getPlaylistTracks: (playlistId: string) => PersistentTrack[];
  clearError: () => void;
}

export const usePersistentMusic = (): PersistentMusicState & PersistentMusicActions => {
  const [state, setState] = useState<PersistentMusicState>({
    library: null,
    tracks: [],
    playlists: [],
    currentTrack: null,
    isPlaying: false,
    isLoading: false,
    error: null
  });

  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    
    // Audio event listeners
    audio.addEventListener('loadstart', () => {
      setState(prev => ({ ...prev, isLoading: true }));
    });

    audio.addEventListener('canplay', () => {
      setState(prev => ({ ...prev, isLoading: false }));
    });

    audio.addEventListener('play', () => {
      setState(prev => ({ ...prev, isPlaying: true }));
    });

    audio.addEventListener('pause', () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    });

    audio.addEventListener('ended', () => {
      setState(prev => ({ ...prev, isPlaying: false, currentTrack: null }));
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isLoading: false,
        error: 'Failed to play audio'
      }));
    });

    setAudioElement(audio);

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Library event listeners
  useEffect(() => {
    const handleLibraryUpdated = (library: UserLibrary) => {
      setState(prev => ({
        ...prev,
        library,
        tracks: library.tracks,
        playlists: library.playlists
      }));
    };

    const handleTrackAdded = (track: PersistentTrack) => {
      setState(prev => ({
        ...prev,
        tracks: [...prev.tracks, track]
      }));
    };

    const handleTrackRemoved = (track: PersistentTrack) => {
      setState(prev => ({
        ...prev,
        tracks: prev.tracks.filter(t => t.id !== track.id),
        currentTrack: prev.currentTrack?.id === track.id ? null : prev.currentTrack
      }));
    };

    persistentMusicService.on('libraryUpdated', handleLibraryUpdated);
    persistentMusicService.on('trackAdded', handleTrackAdded);
    persistentMusicService.on('trackRemoved', handleTrackRemoved);

    return () => {
      persistentMusicService.off('libraryUpdated', handleLibraryUpdated);
      persistentMusicService.off('trackAdded', handleTrackAdded);
      persistentMusicService.off('trackRemoved', handleTrackRemoved);
    };
  }, []);

  // Initialize library when wallet connects
  const initializeLibrary = useCallback(async () => {
    const walletAddress = web3Service.getCurrentAccount();
    if (!walletAddress) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const library = await persistentMusicService.initializeLibrary(walletAddress);
      
      setState(prev => ({
        ...prev,
        library,
        tracks: library.tracks,
        playlists: library.playlists,
        isLoading: false
      }));

      console.log('Persistent music library initialized');
    } catch (error: any) {
      console.error('Error initializing library:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to initialize library',
        isLoading: false
      }));
    }
  }, []);

  // Add track to library
  const addTrack = useCallback(async (track: PersistentTrack) => {
    try {
      await persistentMusicService.addTrackToLibrary(track);
    } catch (error: any) {
      console.error('Error adding track:', error);
      setState(prev => ({ ...prev, error: error.message || 'Failed to add track' }));
    }
  }, []);

  // Remove track from library
  const removeTrack = useCallback(async (trackId: string) => {
    try {
      await persistentMusicService.removeTrackFromLibrary(trackId);
    } catch (error: any) {
      console.error('Error removing track:', error);
      setState(prev => ({ ...prev, error: error.message || 'Failed to remove track' }));
    }
  }, []);

  // Play track
  const playTrack = useCallback(async (trackId: string) => {
    if (!audioElement) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const track = persistentMusicService.getTrackById(trackId);
      if (!track) {
        throw new Error('Track not found');
      }

      if (!persistentMusicService.hasAccessToTrack(trackId)) {
        throw new Error('Access denied to this track');
      }

      const audioUrl = await persistentMusicService.getTrackAudioUrl(trackId, 'streaming');
      if (!audioUrl) {
        throw new Error('Audio URL not available');
      }

      // Stop current track
      audioElement.pause();
      audioElement.currentTime = 0;

      // Load new track
      audioElement.src = audioUrl;
      
      setState(prev => ({ ...prev, currentTrack: track }));

      // Play the track
      await audioElement.play();

      console.log('Playing track:', track.title);
    } catch (error: any) {
      console.error('Error playing track:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to play track',
        isLoading: false,
        isPlaying: false
      }));
    }
  }, [audioElement]);

  // Pause track
  const pauseTrack = useCallback(() => {
    if (audioElement) {
      audioElement.pause();
    }
  }, [audioElement]);

  // Search tracks
  const searchTracks = useCallback((query: string): PersistentTrack[] => {
    return persistentMusicService.searchTracks(query);
  }, []);

  // Create playlist
  const createPlaylist = useCallback(async (name: string, description?: string): Promise<UserPlaylist> => {
    try {
      const playlist = await persistentMusicService.createPlaylist(name, description);
      return playlist;
    } catch (error: any) {
      console.error('Error creating playlist:', error);
      setState(prev => ({ ...prev, error: error.message || 'Failed to create playlist' }));
      throw error;
    }
  }, []);

  // Add to playlist
  const addToPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    try {
      await persistentMusicService.addTrackToPlaylist(playlistId, trackId);
    } catch (error: any) {
      console.error('Error adding to playlist:', error);
      setState(prev => ({ ...prev, error: error.message || 'Failed to add to playlist' }));
    }
  }, []);

  // Get playlist tracks
  const getPlaylistTracks = useCallback((playlistId: string): PersistentTrack[] => {
    return persistentMusicService.getPlaylistTracks(playlistId);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    initializeLibrary,
    addTrack,
    removeTrack,
    playTrack,
    pauseTrack,
    searchTracks,
    createPlaylist,
    addToPlaylist,
    getPlaylistTracks,
    clearError
  };
};