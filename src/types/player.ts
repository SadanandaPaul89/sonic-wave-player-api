
export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerContextProps {
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

export interface Track {
  id: string;
  name: string;
  artistName: string;
  previewURL: string;
  image?: string;
}
