
import React, { createContext, useContext, useState } from 'react';
import { Track } from '@/services/api';
import { PlayerContextProps, RepeatMode } from '@/types/player';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useRepeatLogic } from '@/hooks/useRepeatLogic';
import { usePlayRecording } from '@/hooks/usePlayRecording';

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playHistory, setPlayHistory] = useState<Track[]>([]);

  const loadAndPlay = (track: Track) => {
    console.log('Loading and playing track:', track.name);
    if (currentTrack) {
      setPlayHistory(prev => [currentTrack, ...prev.slice(0, 9)]);
    }
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const { audioRef, seekTo } = useAudioPlayer({
    currentTrack,
    isPlaying,
    volume,
    onProgress: setProgress,
    onDuration: setDuration,
    onTrackEnd: () => handleTrackEnd()
  });

  const { repeatMode, handleTrackEnd, toggleRepeatMode } = useRepeatLogic({
    queue,
    currentTrack,
    setQueue,
    loadAndPlay,
    setIsPlaying,
    audioRef,
    setProgress
  });

  usePlayRecording({ isPlaying, currentTrack, progress });

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
    seekTo(position);
    setProgress(position);
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
