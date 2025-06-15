
import React, { createContext, useContext } from 'react';
import { Track } from '@/services/api';
import { usePlayerCore } from '@/hooks/usePlayerCore';
import { RepeatMode } from '@/hooks/useRepeatMode';

export interface PlayerContextProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  playTrack: (track: Track) => void;
  togglePlayPause: () => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
  setVolumeLevel: (level: number) => void;
  seekToPosition: (position: number) => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  toggleRepeatMode: () => void;
  toggleShuffle: () => void;
  queue: Track[];
  addToQueue: (track: Track) => void;
  clearQueue: () => void;
  forceStop: () => void;
}

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const playerState = usePlayerCore();

  return (
    <PlayerContext.Provider value={playerState}>
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
