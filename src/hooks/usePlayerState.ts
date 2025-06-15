
import { useState } from 'react';
import { Track } from '@/services/api';

export const usePlayerState = () => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasRecordedPlay, setHasRecordedPlay] = useState(false);

  return {
    currentTrack, setCurrentTrack,
    isPlaying, setIsPlaying,
    volume, setVolume,
    progress, setProgress,
    duration, setDuration,
    hasRecordedPlay, setHasRecordedPlay,
  };
};
