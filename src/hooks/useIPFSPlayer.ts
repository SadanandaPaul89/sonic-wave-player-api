// Enhanced Player Hook with IPFS Support
import { useCallback, useEffect } from 'react';
import { Track } from '@/services/api';
import { musicService } from '@/services/musicService';
import { toast } from 'sonner';

export const useIPFSPlayer = (
  audioElement: HTMLAudioElement | null,
  currentTrack: Track | null,
  setIsPlaying: (playing: boolean) => void,
  setProgress: (progress: number) => void,
  setDuration: (duration: number) => void
) => {
  // Load track with IPFS support
  const loadTrack = useCallback(async (track: Track) => {
    if (!audioElement) return;

    try {
      // Check if user has access to the track
      const hasAccess = await musicService.checkTrackAccess(track);
      if (!hasAccess) {
        toast.error('Access Denied', {
          description: 'You need to own the NFT to play this exclusive track',
        });
        return;
      }

      // Get the optimal audio URL (IPFS or traditional)
      const audioUrl = await musicService.getTrackAudioUrl(track);
      
      // Show loading state for IPFS tracks
      if (track.ipfs) {
        const networkQuality = musicService.getNetworkQuality();
        toast.success('Loading from IPFS', {
          description: `Quality: ${networkQuality.format} (${networkQuality.bitrate}kbps)`,
        });
      }

      // Load the audio
      audioElement.src = audioUrl;
      audioElement.load();

      console.log('Track loaded:', {
        name: track.name,
        source: track.ipfs ? 'IPFS' : 'Traditional',
        url: audioUrl,
        quality: track.ipfs ? musicService.getNetworkQuality().format : 'standard'
      });

    } catch (error) {
      console.error('Error loading track:', error);
      toast.error('Failed to load track', {
        description: 'Please try again or check your connection',
      });
    }
  }, [audioElement, setIsPlaying]);

  // Enhanced play function with IPFS support
  const playWithIPFS = useCallback(async () => {
    if (!audioElement || !currentTrack) return;

    try {
      // Ensure track is loaded
      if (!audioElement.src || audioElement.src === '') {
        await loadTrack(currentTrack);
      }

      await audioElement.play();
      setIsPlaying(true);

      // Show IPFS info for decentralized tracks
      if (currentTrack.ipfs) {
        const networkQuality = musicService.getNetworkQuality();
        console.log('Playing IPFS track:', {
          title: currentTrack.name,
          artist: currentTrack.artistName,
          quality: networkQuality.format,
          bitrate: networkQuality.bitrate,
          hash: currentTrack.ipfs.hash
        });
      }

    } catch (error) {
      console.error('Error playing track:', error);
      setIsPlaying(false);
      
      // Try to reload the track if it failed
      if (currentTrack.ipfs) {
        toast.error('IPFS playback failed', {
          description: 'Trying alternative gateway...',
        });
        await loadTrack(currentTrack);
      }
    }
  }, [audioElement, currentTrack, loadTrack, setIsPlaying]);

  // Enhanced pause function
  const pauseWithIPFS = useCallback(() => {
    if (!audioElement) return;

    audioElement.pause();
    setIsPlaying(false);
  }, [audioElement, setIsPlaying]);

  // Load track when currentTrack changes
  useEffect(() => {
    if (currentTrack && audioElement) {
      loadTrack(currentTrack);
    }
  }, [currentTrack, audioElement, loadTrack]);

  // Enhanced audio event listeners for IPFS tracks
  useEffect(() => {
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      setProgress(audioElement.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audioElement.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
      
      if (currentTrack?.ipfs) {
        toast.error('IPFS streaming error', {
          description: 'The track may be temporarily unavailable',
        });
      }
    };

    const handleLoadStart = () => {
      if (currentTrack?.ipfs) {
        console.log('Loading IPFS track...');
      }
    };

    const handleCanPlay = () => {
      if (currentTrack?.ipfs) {
        console.log('IPFS track ready to play');
      }
    };

    const handleWaiting = () => {
      if (currentTrack?.ipfs) {
        console.log('Buffering IPFS track...');
      }
    };

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('durationchange', handleDurationChange);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('loadstart', handleLoadStart);
    audioElement.addEventListener('canplay', handleCanPlay);
    audioElement.addEventListener('waiting', handleWaiting);

    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('durationchange', handleDurationChange);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('loadstart', handleLoadStart);
      audioElement.removeEventListener('canplay', handleCanPlay);
      audioElement.removeEventListener('waiting', handleWaiting);
    };
  }, [audioElement, currentTrack, setProgress, setDuration, setIsPlaying]);

  return {
    loadTrack,
    playWithIPFS,
    pauseWithIPFS
  };
};