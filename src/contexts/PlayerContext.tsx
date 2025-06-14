import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Track } from '@/services/api';
import { recordSongPlay } from '@/services/supabaseService';

type RepeatMode = 'off' | 'one' | 'all';

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
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [queue, setQueue] = useState<Track[]>([]);
  const [playHistory, setPlayHistory] = useState<Track[]>([]);
  const [hasRecordedPlay, setHasRecordedPlay] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isHandlingTrackEndRef = useRef(false);
  
  useEffect(() => {
    audioRef.current = new Audio();
    
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
  }, []);
  
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
  
  const playTrack = (track: Track) => {
    console.log('Playing track:', track.name);
    if (currentTrack) {
      setPlayHistory(prev => [currentTrack, ...prev.slice(0, 9)]);
    }
    setCurrentTrack(track);
    setIsPlaying(true);
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
  
  const seekToPosition = (position: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = position;
      setProgress(position);
    }
  };
  
  const restartCurrentTrack = useCallback(async () => {
    console.log('RESTART: Starting restart process');
    if (!audioRef.current || !currentTrack) {
      console.log('RESTART: No audio ref or current track');
      return;
    }

    try {
      console.log('RESTART: Pausing and resetting audio');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setProgress(0);
      
      console.log('RESTART: Reloading audio source');
      audioRef.current.load();
      
      await new Promise((resolve) => {
        const onCanPlay = () => {
          console.log('RESTART: Audio ready to play');
          audioRef.current?.removeEventListener('canplay', onCanPlay);
          resolve(true);
        };
        audioRef.current?.addEventListener('canplay', onCanPlay);
        
        setTimeout(() => {
          console.log('RESTART: Timeout waiting for canplay, proceeding anyway');
          audioRef.current?.removeEventListener('canplay', onCanPlay);
          resolve(true);
        }, 1000);
      });
      
      console.log('RESTART: Setting isPlaying to true');
      setIsPlaying(true);
      
      console.log('RESTART: Attempting to play');
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
        console.log('RESTART: Successfully restarted track');
      }
    } catch (error) {
      console.error('RESTART: Error restarting track:', error);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setProgress(0);
        setIsPlaying(true);
        setTimeout(() => {
          audioRef.current?.play().catch(e => console.error('RESTART: Fallback play failed:', e));
        }, 100);
      }
    }
  }, [currentTrack]);
  
  const handleTrackEnd = useCallback(() => {
    console.log('TRACK_END: Track ended, repeat mode:', repeatMode, 'queue length:', queue.length);
    
    if (isHandlingTrackEndRef.current) {
      console.log('TRACK_END: Already handling track end, ignoring');
      return;
    }
    
    isHandlingTrackEndRef.current = true;
    
    setTimeout(() => {
      console.log('TRACK_END: Processing track end with repeat mode:', repeatMode);
      
      if (repeatMode === 'one') {
        console.log('TRACK_END: Repeat ONE - restarting current track');
        restartCurrentTrack();
      } else if (repeatMode === 'all') {
        if (queue.length > 0) {
          console.log('TRACK_END: Repeat ALL - playing next track from queue');
          const nextTrack = queue[0];
          const newQueue = queue.slice(1);
          setQueue(newQueue);
          if (currentTrack) {
            setPlayHistory(prev => [currentTrack, ...prev.slice(0, 9)]);
          }
          setCurrentTrack(nextTrack);
          setIsPlaying(true);
        } else {
          console.log('TRACK_END: Repeat ALL - no queue, restarting current track');
          restartCurrentTrack();
        }
      } else {
        // Repeat mode is 'off'
        if (queue.length > 0) {
          console.log('TRACK_END: Repeat OFF - playing next track from queue');
          const nextTrack = queue[0];
          const newQueue = queue.slice(1);
          setQueue(newQueue);
          if (currentTrack) {
            setPlayHistory(prev => [currentTrack, ...prev.slice(0, 9)]);
          }
          setCurrentTrack(nextTrack);
          setIsPlaying(true);
        } else {
          console.log('TRACK_END: Repeat OFF - no queue, stopping playback');
          setIsPlaying(false);
          setProgress(0);
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
          }
        }
      }
      
      isHandlingTrackEndRef.current = false;
    }, 100);
  }, [repeatMode, queue, restartCurrentTrack, currentTrack]);
  
  const playNextTrack = () => {
    console.log('PlayerContext: playNextTrack called, queue length:', queue.length);
    if (queue.length > 0) {
      const nextTrack = queue[0];
      const newQueue = queue.slice(1);
      setQueue(newQueue);
      playTrack(nextTrack);
      console.log('PlayerContext: Playing next track from queue:', nextTrack.name);
    } else if (repeatMode === 'all' && currentTrack) {
      console.log('PlayerContext: Repeat all - restarting current track');
      restartCurrentTrack();
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
      restartCurrentTrack();
    }
  };
  
  const toggleRepeatMode = () => {
    setRepeatMode(prev => {
      const newMode = prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off';
      console.log('PlayerContext: Repeat mode changed from', prev, 'to', newMode);
      return newMode;
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
