
import { useRef, useCallback, useState } from 'react';
import { Track } from '@/services/api';
import { usePlayerState } from '@/hooks/usePlayerState';
import { usePlayerQueue } from '@/hooks/usePlayerQueue';
import { useRepeatMode } from '@/hooks/useRepeatMode';
import { useAudioControls } from '@/hooks/useAudioControls';
import { usePlayerSideEffects } from '@/hooks/usePlayerSideEffects';
import { useIPFSPlayer } from '@/hooks/useIPFSPlayer';
import { PlayerContextProps } from '@/contexts/PlayerContext';

export const usePlayerCore = (): PlayerContextProps => {
  const {
    currentTrack, setCurrentTrack,
    isPlaying, setIsPlaying,
    volume, setVolume,
    progress, setProgress,
    duration, setDuration,
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
  const [audioElement] = useState(() => {
    if (typeof window !== "undefined") {
      return new Audio();
    }
    return null;
  });

  // Initialize IPFS player
  const { loadTrack, playWithIPFS, pauseWithIPFS } = useIPFSPlayer(
    audioElement,
    currentTrack,
    setIsPlaying,
    setProgress,
    setDuration
  );

  const loadAndPlay = useCallback(async (track: Track) => {
    console.log('Loading and playing track:', track.name, track.ipfs ? '(IPFS)' : '(Traditional)');
    if (currentTrack) {
      setPlayHistory(prev => [currentTrack, ...prev.slice(0, 9)]);
    }
    setCurrentTrack(track);
    
    // Use IPFS-aware play function
    setTimeout(() => {
      playWithIPFS();
    }, 100); // Small delay to ensure track is set
  }, [currentTrack, setCurrentTrack, setPlayHistory, playWithIPFS]);

  const playTrack = (track: Track) => {
    loadAndPlay(track);
  };

  const handleTrackEnd = useCallback(() => {
    console.log('TRACK_END: Track ended, repeat mode:', repeatMode, 'queue length:', queue.length);

    if (repeatMode === 'one') {
      console.log('TRACK_END: Repeating current track');
      if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.play();
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
        if (audioElement && currentTrack) {
          audioElement.currentTime = 0;
          audioElement.play();
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
        if (audioElement) {
          audioElement.pause();
          audioElement.currentTime = 0;
        }
        setIsPlaying(false);
        setProgress(0);
      }
    }
  }, [repeatMode, queue, currentTrack, setQueue, loadAndPlay, setIsPlaying, setProgress, audioElement]);

  const { seekToPosition } = useAudioControls({
    audio: audioElement,
    currentTrack,
    isPlaying,
    volume,
    setProgress,
    setDuration,
    onTrackEnd: handleTrackEnd,
  });

  const pausePlayback = useCallback(() => {
    console.log('PlayerContext: Pausing playback due to external event.');
    setIsPlaying(false);
  }, [setIsPlaying]);

  const resumePlayback = useCallback(() => {
    if (currentTrack) {
      console.log('PlayerContext: Resuming playback.');
      setIsPlaying(true);
    }
  }, [currentTrack, setIsPlaying]);

  const togglePlayPause = useCallback(() => {
    console.log('PlayerContext: togglePlayPause called, current isPlaying:', isPlaying);
    if (isPlaying) {
      pauseWithIPFS();
    } else {
      playWithIPFS();
    }
  }, [isPlaying, playWithIPFS, pauseWithIPFS]);

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
      if (audioElement) {
        audioElement.currentTime = 0;
        setProgress(0);
        setIsPlaying(true);
      }
    } else {
      console.log('PlayerContext: No tracks in queue, stopping playback');
      setIsPlaying(false);
    }
  }, [queue, setQueue, loadAndPlay, repeatMode, currentTrack, isShuffled, setOriginalQueue, setProgress, setIsPlaying, audioElement]);

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
      if (audioElement) {
        audioElement.currentTime = 0;
        setProgress(0);
        setIsPlaying(true);
      }
    }
  }, [playHistory, setPlayHistory, currentTrack, setQueue, loadAndPlay, isShuffled, setOriginalQueue, setProgress, setIsPlaying, audioElement]);

  const forceStop = useCallback(() => {
    console.log('PlayerContext: Force stopping playback');
    setIsPlaying(false);
    setProgress(0);
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
  }, [setIsPlaying, setProgress, audioElement]);

  usePlayerSideEffects({
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    hasRecordedPlay,
    setHasRecordedPlay,
    setVolumeLevel,
    togglePlayPause,
    playNextTrack,
    playPreviousTrack,
    seekToPosition,
    pausePlayback,
    resumePlayback,
  });

  return {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    repeatMode,
    isShuffled,
    playTrack,
    togglePlayPause,
    pausePlayback,
    resumePlayback,
    setVolumeLevel,
    seekToPosition,
    playNextTrack,
    playPreviousTrack,
    toggleRepeatMode,
    toggleShuffle,
    queue,
    addToQueue,
    clearQueue,
    forceStop,
  };
};
