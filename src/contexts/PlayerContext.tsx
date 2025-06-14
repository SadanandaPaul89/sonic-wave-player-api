
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Track } from '@/services/api';
import { recordSongPlay } from '@/services/supabaseService';

type RepeatMode = 'off' | 'all' | 'one';

interface PlayerContextProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  repeatMode: RepeatMode;
  playTrack: (track: Track) => void;
  togglePlayPause: () => void;
  setVolumeLevel: (level: number) => void;
  seekToPosition: (position: number) => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  toggleRepeatMode: () => void;
  queue: Track[];
  addToQueue: (track: Track) => void;
  clearQueue: () => void;
}

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playHistory, setPlayHistory] = useState<Track[]>([]);
  const [hasRecordedPlay, setHasRecordedPlay] = useState(false);
  
  // Repeat Modes
  const repeatModes: RepeatMode[] = ['off', 'all', 'one'];
  const [repeatIndex, setRepeatIndex] = useState(0); // 0 = off
  const repeatMode = repeatModes[repeatIndex];
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Handle track end with your exact logic
  const handleTrackEnd = useCallback(() => {
    console.log('TRACK_END: Track ended, repeat mode:', repeatMode, 'queue length:', queue.length);
    
    if (repeatMode === 'one') {
      // Repeat current track
      console.log('TRACK_END: Repeating current track');
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (repeatMode === 'all') {
      // Play next track, loop if needed
      console.log('TRACK_END: Repeat all mode');
      if (queue.length > 0) {
        console.log('TRACK_END: Playing next track from queue');
        const nextTrack = queue[0];
        const newQueue = queue.slice(1);
        setQueue(newQueue);
        loadAndPlay(nextTrack);
      } else {
        console.log('TRACK_END: No queue, restarting current track for repeat all');
        if (audioRef.current && currentTrack) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
      }
    } else if (repeatMode === 'off') {
      // Play next or stop
      console.log('TRACK_END: Repeat off mode');
      if (queue.length > 0) {
        console.log('TRACK_END: Playing next track');
        const nextTrack = queue[0];
        const newQueue = queue.slice(1);
        setQueue(newQueue);
        loadAndPlay(nextTrack);
      } else {
        console.log('TRACK_END: No more tracks, stopping');
        // Stop
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setProgress(0);
      }
    }
  }, [repeatMode, queue, currentTrack]);
  
  useEffect(() => {
    audioRef.current = new Audio();
    
    const updateProgress = () => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
      }
    };
    
    const setAudioDuration = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };
    
    audioRef.current.addEventListener('timeupdate', updateProgress);
    audioRef.current.addEventListener('loadedmetadata', setAudioDuration);
    audioRef.current.addEventListener('ended', handleTrackEnd);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateProgress);
        audioRef.current.removeEventListener('loadedmetadata', setAudioDuration);
        audioRef.current.removeEventListener('ended', handleTrackEnd);
        audioRef.current.pause();
      }
    };
  }, [handleTrackEnd]);
  
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      console.log('Loading track:', currentTrack.name);
      audioRef.current.src = currentTrack.previewURL;
      audioRef.current.load();
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.error('Error playing audio:', e));
        }
      }
    }
  }, [currentTrack]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        console.log('Playing audio, current src:', audioRef.current.src);
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.error('Error playing audio:', e));
        }
      } else {
        console.log('Pausing audio');
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);
  
  useEffect(() => {
    if (isPlaying && currentTrack && !hasRecordedPlay && progress > 5) {
      recordSongPlay(currentTrack.id);
      setHasRecordedPlay(true);
    }
  }, [isPlaying, currentTrack, hasRecordedPlay, progress]);
  
  useEffect(() => {
    setHasRecordedPlay(false);
  }, [currentTrack]);
  
  // Load and play function
  const loadAndPlay = (track: Track) => {
    console.log('Loading and playing track:', track.name);
    if (currentTrack) {
      setPlayHistory(prev => [currentTrack, ...prev.slice(0, 9)]);
    }
    setCurrentTrack(track);
    setIsPlaying(true);
  };
  
  const playTrack = (track: Track) => {
    loadAndPlay(track);
  };
  
  const togglePlayPause = () => {
    console.log('PlayerContext: togglePlayPause called, current isPlaying:', isPlaying);
    setIsPlaying(prev => {
      console.log('PlayerContext: setting isPlaying to:', !prev);
      return !prev;
    });
  };
  
  const setVolumeLevel = (level: number) => {
    setVolume(Math.max(0, Math.min(1, level)));
  };
  
  const seekToPosition = (position: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = position;
      setProgress(position);
    }
  };
  
  const playNextTrack = () => {
    console.log('PlayerContext: playNextTrack called, queue length:', queue.length);
    if (queue.length > 0) {
      const nextTrack = queue[0];
      const newQueue = queue.slice(1);
      setQueue(newQueue);
      loadAndPlay(nextTrack);
      console.log('PlayerContext: Playing next track from queue:', nextTrack.name);
    } else if (repeatMode === 'all' && currentTrack) {
      console.log('PlayerContext: Repeat all - restarting current track');
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setProgress(0);
        setIsPlaying(true);
      }
    } else {
      console.log('PlayerContext: No tracks in queue, stopping playback');
      setIsPlaying(false);
    }
  };
  
  const playPreviousTrack = () => {
    console.log('PlayerContext: playPreviousTrack called, history length:', playHistory.length);
    if (playHistory.length > 0) {
      const previousTrack = playHistory[0];
      const newHistory = playHistory.slice(1);
      setPlayHistory(newHistory);
      
      if (currentTrack) {
        setQueue(prev => [currentTrack, ...prev]);
      }
      
      setCurrentTrack(previousTrack);
      setIsPlaying(true);
      console.log('PlayerContext: Playing previous track:', previousTrack.name);
    } else {
      console.log('PlayerContext: No history, restarting current track');
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setProgress(0);
        setIsPlaying(true);
      }
    }
  };
  
  // Toggle repeat mode: off -> all -> one -> off
  const toggleRepeatMode = () => {
    setRepeatIndex(prev => {
      const newIndex = (prev + 1) % repeatModes.length;
      const newMode = repeatModes[newIndex];
      console.log('PlayerContext: Repeat mode changed from', repeatModes[prev], 'to', newMode);
      return newIndex;
    });
  };
  
  const addToQueue = (track: Track) => {
    console.log('PlayerContext: Adding track to queue:', track.name);
    setQueue(prev => [...prev, track]);
  };
  
  const clearQueue = () => {
    console.log('PlayerContext: Clearing queue');
    setQueue([]);
  };
  
  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        volume,
        progress,
        duration,
        repeatMode,
        playTrack,
        togglePlayPause,
        setVolumeLevel,
        seekToPosition,
        playNextTrack,
        playPreviousTrack,
        toggleRepeatMode,
        queue,
        addToQueue,
        clearQueue
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextProps => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

export default PlayerProvider;
