
import { useEffect, useRef } from 'react';
import { Track } from '@/services/api';

interface MediaSessionHookProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onNextTrack: () => void;
  onPreviousTrack: () => void;
  onSeek: (time: number) => void;
}

export const useMediaSession = ({
  currentTrack,
  isPlaying,
  progress,
  duration,
  onPlay,
  onPause,
  onNextTrack,
  onPreviousTrack,
  onSeek
}: MediaSessionHookProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name,
        artist: currentTrack.artistName,
        album: currentTrack.albumName || 'Unknown Album',
        artwork: [
          {
            src: currentTrack.image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=512&h=512&fit=crop',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      });

      // Set playback state
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      // Set position state
      if (duration > 0) {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1.0,
          position: progress
        });
      }

      // Set action handlers
      navigator.mediaSession.setActionHandler('play', onPlay);
      navigator.mediaSession.setActionHandler('pause', onPause);
      navigator.mediaSession.setActionHandler('nexttrack', onNextTrack);
      navigator.mediaSession.setActionHandler('previoustrack', onPreviousTrack);
      
      navigator.mediaSession.setActionHandler('seekto', (event) => {
        if (event.seekTime !== undefined) {
          onSeek(event.seekTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', () => {
        onSeek(Math.max(0, progress - 10));
      });

      navigator.mediaSession.setActionHandler('seekforward', () => {
        onSeek(Math.min(duration, progress + 10));
      });
    }

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
      }
    };
  }, [currentTrack, isPlaying, progress, duration, onPlay, onPause, onNextTrack, onPreviousTrack, onSeek]);

  // Initialize audio context for better audio focus management
  useEffect(() => {
    if (!audioContextRef.current && 'AudioContext' in window) {
      audioContextRef.current = new AudioContext();
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Resume audio context on user interaction if suspended
  const resumeAudioContext = async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        console.log('Audio context resumed');
      } catch (error) {
        console.error('Failed to resume audio context:', error);
      }
    }
  };

  return { resumeAudioContext };
};
