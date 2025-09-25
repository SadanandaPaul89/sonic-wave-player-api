import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { ipfsMusicService } from '@/services/ipfsMusicService';
import { AudioFileStructure } from '@/types/yellowSDK';
import { web3Service } from '@/services/web3Service';

interface IPFSAudioPlayerProps {
  audioFiles: AudioFileStructure;
  title: string;
  artist: string;
  artwork?: string;
  nftContract?: string;
  tokenId?: string;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

interface NetworkQuality {
  connection: 'slow' | 'medium' | 'fast';
  bitrate: 128 | 192 | 320;
  format: 'mobile' | 'streaming' | 'high_quality';
}

const IPFSAudioPlayer: React.FC<IPFSAudioPlayerProps> = ({
  audioFiles,
  title,
  artist,
  artwork,
  nftContract,
  tokenId,
  className = '',
  onPlay,
  onPause,
  onEnded
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>({
    connection: 'medium',
    bitrate: 192,
    format: 'streaming'
  });
  const [hasAccess, setHasAccess] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Detect network quality
  useEffect(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      const getNetworkQuality = (): NetworkQuality => {
        const { effectiveType, downlink } = connection;
        
        if (effectiveType === '4g' && downlink > 10) {
          return { connection: 'fast', bitrate: 320, format: 'high_quality' };
        } else if (effectiveType === '3g' || (effectiveType === '4g' && downlink > 1)) {
          return { connection: 'medium', bitrate: 192, format: 'streaming' };
        } else {
          return { connection: 'slow', bitrate: 128, format: 'mobile' };
        }
      };

      setNetworkQuality(getNetworkQuality());

      const handleConnectionChange = () => {
        setNetworkQuality(getNetworkQuality());
      };

      connection.addEventListener('change', handleConnectionChange);
      return () => connection.removeEventListener('change', handleConnectionChange);
    }
  }, []);

  // Check NFT access if required
  useEffect(() => {
    const checkAccess = async () => {
      if (nftContract && tokenId) {
        const currentAccount = web3Service.getCurrentAccount();
        if (currentAccount) {
          const hasOwnership = await web3Service.checkNFTOwnership(
            nftContract,
            tokenId,
            currentAccount
          );
          setHasAccess(hasOwnership);
        } else {
          setHasAccess(false);
        }
      }
    };

    checkAccess();
  }, [nftContract, tokenId]);

  // Load audio file based on network quality and access level
  const loadAudioFile = async () => {
    if (!hasAccess) {
      setError('You need to own this NFT to play this track');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Select appropriate quality based on network and access
      let selectedAudio = audioFiles[networkQuality.format];
      
      // Fallback to available formats
      if (!selectedAudio) {
        selectedAudio = audioFiles.streaming || audioFiles.high_quality || audioFiles.mobile;
      }

      if (!selectedAudio) {
        throw new Error('No audio files available');
      }

      // For demo purposes, create a mock IPFS hash from the audio file info
      const mockIpfsHash = `demo_${title.replace(/\s+/g, '_').toLowerCase()}_${selectedAudio.bitrate}`;
      
      // Get streaming URL from IPFS music service
      const quality = networkQuality.format === 'high_quality' ? 'high_quality' : 
                     networkQuality.format === 'streaming' ? 'streaming' : 'mobile';
      
      const url = await ipfsMusicService.getStreamingUrl(mockIpfsHash, quality);
      
      if (!url) {
        // Fallback to a demo audio file for testing
        const demoUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
        setAudioUrl(demoUrl);
        console.log('Using demo audio file for testing');
      } else {
        setAudioUrl(url);
      }

      console.log(`Loading ${networkQuality.format} quality (${selectedAudio.bitrate}) from IPFS`);
    } catch (error) {
      console.error('Error loading audio file:', error);
      setError('Failed to load audio file');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize audio when component mounts
  useEffect(() => {
    loadAudioFile();
  }, [networkQuality.format, hasAccess]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setError('Error playing audio');
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, onEnded]);

  const togglePlay = async () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPause?.();
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        onPlay?.();
      } catch (error) {
        console.error('Error playing audio:', error);
        setError('Failed to play audio');
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!hasAccess) {
    return (
      <div className={`bg-white/5 rounded-figma-md p-6 border border-white/10 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <VolumeX size={24} className="text-red-400" />
          </div>
          <h3 className="text-white font-medium mb-2">NFT Required</h3>
          <p className="text-white/60 text-sm mb-4">
            You need to own this NFT to access this exclusive track.
          </p>
          <Button
            onClick={() => web3Service.connectWallet()}
            className="bg-figma-purple hover:bg-figma-purple/80"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 rounded-figma-md p-6 border border-white/10 backdrop-blur-sm ${className}`}>
      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          crossOrigin="anonymous"
        />
      )}

      {/* Track Info */}
      <div className="flex items-center gap-4 mb-6">
        {artwork && (
          <div className="w-16 h-16 rounded-figma-sm overflow-hidden bg-white/10">
            <img
              src={artwork}
              alt={`${title} artwork`}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{title}</h3>
          <p className="text-white/60 text-sm truncate">{artist}</p>
          {nftContract && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-figma-purple/20 text-figma-purple px-2 py-1 rounded-full">
                NFT Exclusive
              </span>
              <span className="text-xs text-white/40">
                {networkQuality.format} • {networkQuality.bitrate}kbps
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-figma-sm"
          >
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
            disabled={!audioUrl || isLoading}
          />
          <div className="flex justify-between text-xs text-white/60">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white"
            disabled
          >
            <SkipBack size={20} />
          </Button>

          <Button
            onClick={togglePlay}
            disabled={!audioUrl || isLoading}
            className="w-12 h-12 rounded-full bg-figma-purple hover:bg-figma-purple/80 text-white"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={20} />
            ) : (
              <Play size={20} className="ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white"
            disabled
          >
            <SkipForward size={20} />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-white/60 hover:text-white"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="flex-1 max-w-24"
          />
        </div>
      </div>
    </div>
  );
};

export default IPFSAudioPlayer;