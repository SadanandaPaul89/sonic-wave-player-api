
import { useRef, useEffect, useCallback } from 'react';
import { Track } from '@/services/api';

interface UseAudioPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  onProgress: (progress: number) => void;
  onDuration: (duration: number) => void;
  onTrackEnd: () => void;
}

export const useAudioPlayer = ({
  currentTrack,
  isPlaying,
  volume,
  onProgress,
  onDuration,
  onTrackEnd
}: UseAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    audioRef.current = new Audio();
    
    const updateProgress = () => {
      if (audioRef.current) {
        onProgress(audioRef.current.currentTime);
      }
    };
    
    const setAudioDuration = () => {
      if (audioRef.current) {
        onDuration(audioRef.current.duration);
        isLoadingRef.current = false;
      }
    };
    
    const handleLoadStart = () => {
      isLoadingRef.current = true;
    };
    
    audioRef.current.addEventListener('timeupdate', updateProgress);
    audioRef.current.addEventListener('loadedmetadata', setAudioDuration);
    audioRef.current.addEventListener('loadstart', handleLoadStart);
    audioRef.current.addEventListener('ended', onTrackEnd);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateProgress);
        audioRef.current.removeEventListener('loadedmetadata', setAudioDuration);
        audioRef.current.removeEventListener('loadstart', handleLoadStart);
        audioRef.current.removeEventListener('ended', onTrackEnd);
        audioRef.current.pause();
      }
    };
  }, [onProgress, onDuration, onTrackEnd]);
  
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      console.log('Loading track:', currentTrack.name);
      // Stop any current playback
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      isLoadingRef.current = true;
      
      // Set new source and load
      audioRef.current.src = currentTrack.previewURL;
      audioRef.current.load();
    }
  }, [currentTrack]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  useEffect(() => {
    if (audioRef.current && currentTrack && !isLoadingRef.current) {
      if (isPlaying) {
        console.log('Playing audio, current src:', audioRef.current.src);
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.error('Error playing audio:', e);
            // Reset loading state if play fails
            isLoadingRef.current = false;
          });
        }
      } else {
        console.log('Pausing audio');
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const seekTo = useCallback((position: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = position;
    }
  }, []);

  return { audioRef, seekTo };
};
