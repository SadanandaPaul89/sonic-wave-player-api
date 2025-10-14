import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { playbackUrlResolver, AudioSource } from '@/services/playbackUrlResolver';
import { simpleIPFSService } from '@/services/ipfsServiceSimple';
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

interface AudioError {
  type: 'network' | 'access' | 'format' | 'storage' | 'unknown';
  message: string;
  retryable: boolean;
  details?: string;
}

interface LoadingState {
  isLoading: boolean;
  stage: 'resolving' | 'loading' | 'buffering' | 'ready';
  progress: number;
  message: string;
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
  const [error, setError] = useState<AudioError | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    stage: 'ready',
    progress: 0,
    message: ''
  });
  const [retryCount, setRetryCount] = useState(0);
  const [debugMode, setDebugMode] = useState(false);

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

  // Enhanced audio file loading with proper error handling
  const loadAudioFile = async (forceReload: boolean = false) => {
    if (!hasAccess) {
      setError({
        type: 'access',
        message: 'You need to own this NFT to play this track',
        retryable: false,
        details: 'NFT ownership required for exclusive content'
      });
      return;
    }

    setLoadingState({
      isLoading: true,
      stage: 'resolving',
      progress: 10,
      message: 'Resolving audio source...'
    });
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

      setLoadingState(prev => ({
        ...prev,
        stage: 'resolving',
        progress: 30,
        message: 'Finding optimal audio source...'
      }));

      // Extract IPFS hash from URI
      const ipfsHash = selectedAudio.uri.replace('ipfs://', '');
      
      // Create audio source for resolver
      const audioSource: AudioSource = {
        type: 'ipfs',
        identifier: ipfsHash,
        qualities: Object.entries(audioFiles).map(([format, audio]) => ({
          format: format as any,
          bitrate: audio.bitrate,
          size: audio.size,
          uri: audio.uri
        })),
        metadata: {
          title,
          artist,
          mimeType: 'audio/mpeg' // Default, could be enhanced
        }
      };

      setLoadingState(prev => ({
        ...prev,
        stage: 'loading',
        progress: 60,
        message: 'Loading audio file...'
      }));

      // Use enhanced resolver to get playable URL
      const result = await playbackUrlResolver.resolveAudioUrl(audioSource);
      
      setAudioUrl(result.url);
      setRetryCount(0); // Reset retry count on success

      setLoadingState(prev => ({
        ...prev,
        stage: 'ready',
        progress: 100,
        message: `Loaded via ${result.strategy}`
      }));

      if (debugMode) {
        console.log('Audio loaded successfully:', {
          title,
          artist,
          hash: ipfsHash,
          strategy: result.strategy,
          quality: networkQuality.format,
          url: result.url,
          cached: result.cached,
          latency: result.latency
        });
      }

    } catch (error) {
      console.error('Error loading audio file:', error);
      
      const audioError: AudioError = {
        type: this.categorizeError(error),
        message: this.getErrorMessage(error),
        retryable: this.isRetryableError(error),
        details: error instanceof Error ? error.message : 'Unknown error'
      };

      setError(audioError);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  };

  // Categorize error types for better handling
  const categorizeError = (error: unknown): AudioError['type'] => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('network') || message.includes('fetch')) return 'network';
      if (message.includes('access') || message.includes('permission')) return 'access';
      if (message.includes('format') || message.includes('codec')) return 'format';
      if (message.includes('storage') || message.includes('quota')) return 'storage';
    }
    return 'unknown';
  };

  // Get user-friendly error messages
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('network')) return 'Network connection issue';
      if (message.includes('access')) return 'Access denied';
      if (message.includes('format')) return 'Unsupported audio format';
      if (message.includes('storage')) return 'Storage limit reached';
      if (message.includes('not found')) return 'Audio file not found';
    }
    return 'Failed to load audio file';
  };

  // Check if error is retryable
  const isRetryableError = (error: unknown): boolean => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('network') || 
             message.includes('timeout') || 
             message.includes('fetch') ||
             message.includes('gateway');
    }
    return true; // Default to retryable
  };

  // Retry loading with exponential backoff
  const retryLoad = async () => {
    if (retryCount >= 3) {
      setError(prev => prev ? {
        ...prev,
        message: 'Maximum retry attempts reached',
        retryable: false
      } : null);
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    console.log(`Retrying audio load in ${delay}ms (attempt ${retryCount + 1})`);
    
    setTimeout(() => {
      loadAudioFile(true);
    }, delay);
  };

  // Initialize audio when component mounts
  useEffect(() => {
    loadAudioFile();
  }, [networkQuality.format, hasAccess]);

  // Enhanced audio event handlers with better error handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    
    const handleLoadStart = () => {
      setLoadingState(prev => ({
        ...prev,
        isLoading: true,
        stage: 'loading',
        message: 'Loading audio...'
      }));
    };
    
    const handleCanPlay = () => {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        stage: 'ready',
        progress: 100,
        message: 'Ready to play'
      }));
    };
    
    const handleWaiting = () => {
      setLoadingState(prev => ({
        ...prev,
        stage: 'buffering',
        message: 'Buffering...'
      }));
    };
    
    const handleError = (e: Event) => {
      const audioError = audio.error;
      let errorType: AudioError['type'] = 'unknown';
      let errorMessage = 'Error playing audio';
      
      if (audioError) {
        switch (audioError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorType = 'network';
            errorMessage = 'Playback aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorType = 'network';
            errorMessage = 'Network error during playback';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorType = 'format';
            errorMessage = 'Audio format not supported';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorType = 'format';
            errorMessage = 'Audio source not supported';
            break;
        }
      }

      setError({
        type: errorType,
        message: errorMessage,
        retryable: errorType === 'network',
        details: audioError?.message || 'Media error occurred'
      });
      
      setIsPlaying(false);
      setLoadingState(prev => ({
        ...prev,
        isLoading: false
      }));

      if (debugMode) {
        console.error('Audio playback error:', {
          code: audioError?.code,
          message: audioError?.message,
          src: audio.src
        });
      }
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        const duration = audio.duration;
        if (duration > 0) {
          const progress = (bufferedEnd / duration) * 100;
          setLoadingState(prev => ({
            ...prev,
            progress: Math.min(progress, 100)
          }));
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);
    audio.addEventListener('progress', handleProgress);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('progress', handleProgress);
    };
  }, [audioUrl, onEnded, debugMode]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    // If no audio URL, try to load it first
    if (!audioUrl) {
      await loadAudioFile();
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPause?.();
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setError(null); // Clear any previous errors
        onPlay?.();
      } catch (error) {
        console.error('Error playing audio:', error);
        
        const playError: AudioError = {
          type: 'network',
          message: 'Failed to start playback',
          retryable: true,
          details: error instanceof Error ? error.message : 'Unknown playback error'
        };
        
        setError(playError);
        setIsPlaying(false);

        // Auto-retry for certain errors
        if (error instanceof Error && error.name === 'NotAllowedError') {
          playError.type = 'access';
          playError.message = 'Playback blocked - user interaction required';
          playError.retryable = false;
        }
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
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {nftContract && (
              <span className="text-xs bg-figma-purple/20 text-figma-purple px-2 py-1 rounded-full">
                NFT Exclusive
              </span>
            )}
            <span className="text-xs text-white/40">
              {networkQuality.format} • {networkQuality.bitrate}kbps
            </span>
            {loadingState.stage === 'ready' && audioUrl && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                Ready
              </span>
            )}
            <button
              onClick={() => setDebugMode(!debugMode)}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
              title="Toggle debug mode"
            >
              Debug
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-figma-sm"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-red-400 text-sm font-medium">{error.message}</p>
                {debugMode && error.details && (
                  <p className="text-red-300 text-xs mt-1 opacity-75">{error.details}</p>
                )}
                {error.retryable && retryCount < 3 && (
                  <Button
                    onClick={retryLoad}
                    size="sm"
                    variant="ghost"
                    className="mt-2 h-6 px-2 text-xs text-red-300 hover:text-red-200 hover:bg-red-500/10"
                  >
                    <RefreshCw size={12} className="mr-1" />
                    Retry ({3 - retryCount} attempts left)
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Loading Display */}
      <AnimatePresence>
        {loadingState.isLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-figma-sm"
          >
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="text-blue-400 animate-spin flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-blue-400 text-sm">{loadingState.message}</p>
                {loadingState.progress > 0 && (
                  <div className="mt-2 w-full bg-blue-900/30 rounded-full h-1">
                    <div 
                      className="bg-blue-400 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${loadingState.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
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
            disabled={loadingState.isLoading}
            className="w-12 h-12 rounded-full bg-figma-purple hover:bg-figma-purple/80 text-white disabled:opacity-50"
          >
            {loadingState.isLoading ? (
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

        {/* Debug Panel */}
        <AnimatePresence>
          {debugMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 bg-gray-800/50 border border-gray-600/30 rounded-figma-sm"
            >
              <h4 className="text-white/80 text-xs font-medium mb-2">Debug Information</h4>
              <div className="space-y-1 text-xs text-white/60">
                <div>Audio URL: {audioUrl ? audioUrl.substring(0, 50) + '...' : 'None'}</div>
                <div>Loading Stage: {loadingState.stage}</div>
                <div>Network Quality: {networkQuality.format} ({networkQuality.bitrate}kbps)</div>
                <div>Retry Count: {retryCount}</div>
                <div>Has Access: {hasAccess ? 'Yes' : 'No'}</div>
                {error && (
                  <div className="text-red-400">
                    Error Type: {error.type} | Retryable: {error.retryable ? 'Yes' : 'No'}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => loadAudioFile(true)}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-white/60 hover:text-white/80"
                  >
                    Force Reload
                  </Button>
                  <Button
                    onClick={async () => {
                      const hasAccess = await simpleIPFSService.validateAudioAccess(
                        audioFiles.high_quality?.uri.replace('ipfs://', '') || ''
                      );
                      console.log('Access validation result:', hasAccess);
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-white/60 hover:text-white/80"
                  >
                    Test Access
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default IPFSAudioPlayer;