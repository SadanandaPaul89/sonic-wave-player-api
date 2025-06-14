
import { useState, useCallback } from 'react';
import { RepeatMode } from '@/types/player';
import { Track } from '@/services/api';

interface UseRepeatLogicProps {
  queue: Track[];
  currentTrack: Track | null;
  setQueue: (queue: Track[]) => void;
  loadAndPlay: (track: Track) => void;
  setIsPlaying: (playing: boolean) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  setProgress: (progress: number) => void;
}

export const useRepeatLogic = ({
  queue,
  currentTrack,
  setQueue,
  loadAndPlay,
  setIsPlaying,
  audioRef,
  setProgress
}: UseRepeatLogicProps) => {
  const repeatModes: RepeatMode[] = ['off', 'all', 'one'];
  const [repeatIndex, setRepeatIndex] = useState(0);
  const repeatMode = repeatModes[repeatIndex];

  const isLastTrack = () => {
    return queue.length === 0;
  };

  const handleTrackEnd = useCallback(() => {
    console.log('TRACK_END: Track ended, repeat mode:', repeatMode, 'queue length:', queue.length);
    
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.error('Error restarting track:', e));
        }
      }
    } else if (repeatMode === 'all') {
      if (queue.length > 0) {
        const nextTrack = queue[0];
        const newQueue = queue.slice(1);
        setQueue(newQueue);
        loadAndPlay(nextTrack);
      } else {
        if (audioRef.current && currentTrack) {
          audioRef.current.currentTime = 0;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => console.error('Error restarting track:', e));
          }
        }
      }
    } else if (repeatMode === 'off') {
      if (!isLastTrack()) {
        const nextTrack = queue[0];
        const newQueue = queue.slice(1);
        setQueue(newQueue);
        loadAndPlay(nextTrack);
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setProgress(0);
      }
    }
  }, [repeatMode, queue, currentTrack, setQueue, loadAndPlay, setIsPlaying, audioRef, setProgress]);

  const toggleRepeatMode = () => {
    setRepeatIndex(prev => {
      const newIndex = (prev + 1) % repeatModes.length;
      const newMode = repeatModes[newIndex];
      console.log('PlayerContext: Repeat mode changed from', repeatModes[prev], 'to', newMode);
      return newIndex;
    });
  };

  return {
    repeatMode,
    handleTrackEnd,
    toggleRepeatMode
  };
};
