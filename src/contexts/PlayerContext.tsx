import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Track } from '@/services/api';
import { recordSongPlay } from '@/services/supabaseService';
import { useMediaSession } from '@/hooks/useMediaSession';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useToast } from '@/hooks/use-toast';

type RepeatMode = 'off' | 'all' | 'one';

interface PlayerContextProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  playTrack: (track: Track) => void;
  togglePlayPause: () => void;
  setVolumeLevel: (level: number) => void;
  seekToPosition: (position: number) => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  toggleRepeatMode: () => void;
  toggleShuffle: () => void;
  queue: Track[];
  addToQueue: (track: Track) => void;
  clearQueue: () => void;
  isPausedByVisibility: boolean;
  forceStop: () => void;
}

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [playHistory, setPlayHistory] = useState<Track[]>([]);
  const [hasRecordedPlay, setHasRecordedPlay] = useState(false);
  const [isPausedByVisibility, setIsPausedByVisibility] = useState(false);
  const [wasPlayingBeforeHidden, setWasPlayingBeforeHidden] = useState(false);
  
  // Repeat Modes
  const repeatModes: RepeatMode[] = ['off', 'all', 'one'];
  const [repeatIndex, setRepeatIndex] = useState(0); // 0 = off
  const repeatMode = repeatModes[repeatIndex];
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  
  // Page visibility hook
  const isPageVisible = usePageVisibility();

  // Shuffle function
  const shuffleArray = (array: Track[]): Track[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Toggle shuffle - fixed to not interrupt playback
  const toggleShuffle = useCallback(() => {
    setIsShuffled(prev => {
      const newShuffled = !prev;
      console.log('PlayerContext: Shuffle toggled to:', newShuffled);
      
      if (newShuffled) {
        // Enable shuffle - save original queue and shuffle current queue
        setOriginalQueue(queue);
        setQueue(shuffleArray(queue));
      } else {
        // Disable shuffle - restore original queue
        setQueue(originalQueue);
        setOriginalQueue([]);
      }
      
      return newShuffled;
    });
  }, [queue, originalQueue]);

  // Handle page visibility changes
  useEffect(() => {
    if (!currentTrack) return;

    if (!isPageVisible && isPlaying) {
      // Page became hidden while playing
      console.log('Page hidden, pausing audio to prevent conflicts');
      setWasPlayingBeforeHidden(true);
      setIsPlaying(false);
      setIsPausedByVisibility(true);
      toast({
        title: "Audio Paused",
        description: "Music paused to prevent conflicts with other apps",
        duration: 3000,
      });
    } else if (isPageVisible && isPausedByVisibility && wasPlayingBeforeHidden) {
      // Page became visible again and was paused due to visibility
      console.log('Page visible again, offering to resume audio');
      toast({
        title: "Resume Playback?",
        description: "Click to resume your music",
        duration: 5000,
        action: (
          <button
            onClick={() => {
              setIsPlaying(true);
              setIsPausedByVisibility(false);
              setWasPlayingBeforeHidden(false);
            }}
            className="bg-white text-black px-3 py-1 rounded text-sm hover:bg-gray-200"
          >
            Resume
          </button>
        ),
      });
      setIsPausedByVisibility(false);
    }
  }, [isPageVisible, isPlaying, isPausedByVisibility, wasPlayingBeforeHidden, currentTrack, toast]);

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
    setIsPausedByVisibility(false);
    setWasPlayingBeforeHidden(false);
  };
  
  const playTrack = (track: Track) => {
    loadAndPlay(track);
  };
  
  const togglePlayPause = () => {
    console.log('PlayerContext: togglePlayPause called, current isPlaying:', isPlaying);
    setIsPlaying(prev => {
      console.log('PlayerContext: setting isPlaying to:', !prev);
      if (!prev) {
        setIsPausedByVisibility(false);
        setWasPlayingBeforeHidden(false);
      }
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
      // Update original queue if shuffled
      if (isShuffled) {
        setOriginalQueue(prev => prev.filter(track => track.id !== nextTrack.id));
      }
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
        // Update original queue if shuffled
        if (isShuffled) {
          setOriginalQueue(prev => [currentTrack, ...prev]);
        }
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
  
  // Toggle repeat mode: off -> all -> one -> off (fixed to not interrupt playback)
  const toggleRepeatMode = useCallback(() => {
    setRepeatIndex(prev => {
      const newIndex = (prev + 1) % repeatModes.length;
      const newMode = repeatModes[newIndex];
      console.log('PlayerContext: Repeat mode changed from', repeatModes[prev], 'to', newMode);
      return newIndex;
    });
  }, []);
  
  const addToQueue = (track: Track) => {
    console.log('PlayerContext: Adding track to queue:', track.name);
    setQueue(prev => {
      const newQueue = [...prev, track];
      // Update original queue if shuffled
      if (isShuffled) {
        setOriginalQueue(prevOriginal => [...prevOriginal, track]);
      }
      return newQueue;
    });
  };
  
  const clearQueue = () => {
    console.log('PlayerContext: Clearing queue');
    setQueue([]);
    setOriginalQueue([]);
  };

  const forceStop = () => {
    console.log('PlayerContext: Force stopping playback');
    setIsPlaying(false);
    setProgress(0);
    setIsPausedByVisibility(false);
    setWasPlayingBeforeHidden(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Volume control functions for keyboard shortcuts
  const handleVolumeUp = () => {
    setVolumeLevel(Math.min(1, volume + 0.1));
  };

  const handleVolumeDown = () => {
    setVolumeLevel(Math.max(0, volume - 0.1));
  };

  const handleMute = () => {
    setVolumeLevel(volume > 0 ? 0 : 0.7);
  };

  // Media Session API integration
  const { resumeAudioContext } = useMediaSession({
    currentTrack,
    isPlaying,
    progress,
    duration,
    onPlay: togglePlayPause,
    onPause: togglePlayPause,
    onNextTrack: playNextTrack,
    onPreviousTrack: playPreviousTrack,
    onSeek: seekToPosition,
  });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onTogglePlayPause: togglePlayPause,
    onNextTrack: playNextTrack,
    onPreviousTrack: playPreviousTrack,
    onVolumeUp: handleVolumeUp,
    onVolumeDown: handleVolumeDown,
    onMute: handleMute,
  });

  // Resume audio context on user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      resumeAudioContext();
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [resumeAudioContext]);
  
  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        volume,
        progress,
        duration,
        repeatMode,
        isShuffled,
        playTrack,
        togglePlayPause,
        setVolumeLevel,
        seekToPosition,
        playNextTrack,
        playPreviousTrack,
        toggleRepeatMode,
        toggleShuffle,
        queue,
        addToQueue,
        clearQueue,
        isPausedByVisibility,
        forceStop
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
