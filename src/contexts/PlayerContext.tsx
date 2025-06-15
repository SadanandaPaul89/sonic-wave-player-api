
import React, { createContext, useContext, useCallback } from 'react';
import { Track } from '@/services/api';
import { usePlayerState } from '@/hooks/usePlayerState';
import { usePlayerQueue } from '@/hooks/usePlayerQueue';
import { useRepeatMode, RepeatMode } from '@/hooks/useRepeatMode';
import { useAudioControls } from '@/hooks/useAudioControls';
import { usePlayerSideEffects } from '@/hooks/usePlayerSideEffects';

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
  const {
    currentTrack, setCurrentTrack,
    isPlaying, setIsPlaying,
    volume, setVolume,
    progress, setProgress,
    duration, setDuration,
    isPausedByVisibility, setIsPausedByVisibility,
    wasPlayingBeforeHidden, setWasPlayingBeforeHidden,
    hasRecordedPlay, setHasRecordedPlay,
  } = usePlayerState();
  
  const {
    queue, setQueue,
    isShuffled, toggleShuffle,
    playHistory, setPlayHistory,
    addToQueue,
    clearQueue,
    originalQueue, setOriginalQueue,
  } = usePlayerQueue();
  
  const { repeatMode, toggleRepeatMode } = useRepeatMode();

  const loadAndPlay = useCallback((track: Track) => {
    console.log('Loading and playing track:', track.name);
    if (currentTrack) {
      setPlayHistory(prev => [currentTrack, ...prev.slice(0, 9)]);
    }
    setCurrentTrack(track);
    setIsPlaying(true);
    setIsPausedByVisibility(false);
    setWasPlayingBeforeHidden(false);
  }, [currentTrack, setCurrentTrack, setIsPlaying, setPlayHistory, setIsPausedByVisibility, setWasPlayingBeforeHidden]);
  
  const playTrack = (track: Track) => {
    loadAndPlay(track);
  };

  const handleTrackEnd = useCallback(() => {
    console.log('TRACK_END: Track ended, repeat mode:', repeatMode, 'queue length:', queue.length);
    
    if (repeatMode === 'one') {
      console.log('TRACK_END: Repeating current track');
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (repeatMode === 'all') {
      console.log('TRACK_END: Repeat all mode');
      if (queue.length > 0) {
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
      console.log('TRACK_END: Repeat off mode');
      if (queue.length > 0) {
        const nextTrack = queue[0];
        const newQueue = queue.slice(1);
        setQueue(newQueue);
        loadAndPlay(nextTrack);
      } else {
        console.log('TRACK_END: No more tracks, stopping');
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setProgress(0);
      }
    }
  }, [repeatMode, queue, currentTrack, setQueue, loadAndPlay, setIsPlaying, setProgress]);

  const { audioRef, seekToPosition } = useAudioControls({
    currentTrack,
    isPlaying,
    volume,
    setProgress,
    setDuration,
    onTrackEnd: handleTrackEnd,
  });

  const togglePlayPause = useCallback(() => {
    console.log('PlayerContext: togglePlayPause called, current isPlaying:', isPlaying);
    setIsPlaying(prev => {
      console.log('PlayerContext: setting isPlaying to:', !prev);
      if (!prev) {
        setIsPausedByVisibility(false);
        setWasPlayingBeforeHidden(false);
      }
      return !prev;
    });
  }, [isPlaying, setIsPlaying, setIsPausedByVisibility, setWasPlayingBeforeHidden]);
  
  const setVolumeLevel = (level: number) => {
    setVolume(Math.max(0, Math.min(1, level)));
  };
  
  const playNextTrack = useCallback(() => {
    console.log('PlayerContext: playNextTrack called, queue length:', queue.length);
    if (queue.length > 0) {
      const nextTrack = queue[0];
      const newQueue = queue.slice(1);
      setQueue(newQueue);
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
  }, [queue, setQueue, loadAndPlay, repeatMode, currentTrack, isShuffled, setOriginalQueue, audioRef, setProgress, setIsPlaying]);
  
  const playPreviousTrack = useCallback(() => {
    console.log('PlayerContext: playPreviousTrack called, history length:', playHistory.length);
    if (playHistory.length > 0) {
      const previousTrack = playHistory[0];
      const newHistory = playHistory.slice(1);
      setPlayHistory(newHistory);
      
      if (currentTrack) {
        setQueue(prev => [currentTrack, ...prev]);
        if (isShuffled) {
          setOriginalQueue(prev => [currentTrack, ...prev]);
        }
      }
      
      loadAndPlay(previousTrack);
      console.log('PlayerContext: Playing previous track:', previousTrack.name);
    } else {
      console.log('PlayerContext: No history, restarting current track');
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setProgress(0);
        setIsPlaying(true);
      }
    }
  }, [playHistory, setPlayHistory, currentTrack, setQueue, loadAndPlay, isShuffled, setOriginalQueue, audioRef, setProgress, setIsPlaying]);

  const forceStop = useCallback(() => {
    console.log('PlayerContext: Force stopping playback');
    setIsPlaying(false);
    setProgress(0);
    setIsPausedByVisibility(false);
    setWasPlayingBeforeHidden(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [setIsPlaying, setProgress, setIsPausedByVisibility, setWasPlayingBeforeHidden, audioRef]);

  usePlayerSideEffects({
    currentTrack,
    isPlaying,
    isPausedByVisibility,
    wasPlayingBeforeHidden,
    progress,
    duration,
    volume,
    hasRecordedPlay,
    setIsPlaying,
    setIsPausedByVisibility,
    setWasPlayingBeforeHidden,
    setHasRecordedPlay,
    setVolumeLevel,
    togglePlayPause,
    playNextTrack,
    playPreviousTrack,
    seekToPosition,
  });
  
  const contextValue: PlayerContextProps = {
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
    forceStop,
  };

  return (
    <PlayerContext.Provider value={contextValue}>
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
