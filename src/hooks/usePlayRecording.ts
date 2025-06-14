
import { useEffect, useState } from 'react';
import { Track } from '@/services/api';
import { recordSongPlay } from '@/services/supabaseService';

interface UsePlayRecordingProps {
  isPlaying: boolean;
  currentTrack: Track | null;
  progress: number;
}

export const usePlayRecording = ({ isPlaying, currentTrack, progress }: UsePlayRecordingProps) => {
  const [hasRecordedPlay, setHasRecordedPlay] = useState(false);

  useEffect(() => {
    if (isPlaying && currentTrack && !hasRecordedPlay && progress > 5) {
      recordSongPlay(currentTrack.id);
      setHasRecordedPlay(true);
    }
  }, [isPlaying, currentTrack, hasRecordedPlay, progress]);
  
  useEffect(() => {
    setHasRecordedPlay(false);
  }, [currentTrack]);

  return { hasRecordedPlay };
};
