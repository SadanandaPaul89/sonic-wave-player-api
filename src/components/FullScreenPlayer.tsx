import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatTime } from '@/utils/formatTime';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  ChevronDown,
  Heart,
  MoreHorizontal,
  Shuffle,
  Repeat,
  Repeat1,
  BadgeCheck,
  Edit,
  Share2
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { isArtistVerified, getLyricsBySongId, toggleSongLike, getSongLikeStatus } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import LyricsEditor from './LyricsEditor';
import ShareModal from './ShareModal';
import ArtistNameWithBadge from "./ArtistNameWithBadge";
import AppleMusicLyrics from "./AppleMusicLyrics";

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LyricLine {
  time: number;
  text: string;
}

// Utility function to extract dominant colors from an image
const extractDominantColors = (imageUrl: string): Promise<{ primary: string; secondary: string; accent: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve({ primary: '240, 15%, 15%', secondary: '260, 20%, 20%', accent: '280, 25%, 25%' });
        return;
      }
      
      // Resize for faster processing
      const size = 30; // Reduced size for better performance
      canvas.width = size;
      canvas.height = size;
      
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      
      // Simple color extraction - get average RGB
      let r = 0, g = 0, b = 0;
      const pixelCount = data.length / 4;
      
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      
      r = Math.floor(r / pixelCount);
      g = Math.floor(g / pixelCount);
      b = Math.floor(b / pixelCount);
      
      // Convert to HSL for better color manipulation
      const hsl = rgbToHsl(r, g, b);
      
      // Create complementary colors
      const primary = `${hsl.h}, ${Math.max(40, hsl.s)}%, ${Math.max(15, Math.min(30, hsl.l))}%`;
      const secondary = `${(hsl.h + 30) % 360}, ${Math.max(35, hsl.s - 10)}%, ${Math.max(10, Math.min(25, hsl.l - 5))}%`;
      const accent = `${(hsl.h + 60) % 360}, ${Math.max(30, hsl.s - 20)}%, ${Math.max(8, Math.min(20, hsl.l - 10))}%`;
      
      resolve({ primary, secondary, accent });
    };
    
    img.onerror = () => {
      resolve({ primary: '240, 15%, 15%', secondary: '260, 20%, 20%', accent: '280, 25%, 25%' });
    };
    
    img.src = imageUrl;
  });
};

// RGB to HSL conversion
const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({ isOpen, onClose }) => {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    repeatMode,
    togglePlayPause,
    setVolumeLevel,
    seekToPosition,
    playNextTrack,
    playPreviousTrack,
    toggleRepeatMode,
    queue
  } = usePlayer();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isArtistVerifiedState, setIsArtistVerifiedState] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [isLyricsDialogOpen, setIsLyricsDialogOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dominantColors, setDominantColors] = useState({ 
    primary: '240, 15%, 15%', 
    secondary: '260, 20%, 20%', 
    accent: '280, 25%, 25%' 
  });
  const [isColorsLoading, setIsColorsLoading] = useState(false);

  // Extract colors from album art when track changes - debounced
  useEffect(() => {
    if (currentTrack?.image && !isColorsLoading) {
      setIsColorsLoading(true);
      const timeoutId = setTimeout(() => {
        extractDominantColors(currentTrack.image).then((colors) => {
          setDominantColors(colors);
          setIsColorsLoading(false);
        });
      }, 300); // Debounce color extraction

      return () => clearTimeout(timeoutId);
    } else if (!currentTrack?.image) {
      setDominantColors({ primary: '240, 15%, 15%', secondary: '260, 20%, 20%', accent: '280, 25%, 25%' });
    }
  }, [currentTrack?.image, isColorsLoading]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  // Check if artist is verified, load lyrics, and check like status - memoized
  useEffect(() => {
    if (currentTrack && currentTrack.artistId) {
      const checkVerificationAndLoadLyrics = async () => {
        const verified = await isArtistVerified(currentTrack.artistId);
        setIsArtistVerifiedState(verified);
        
        // Load lyrics for current track
        setIsLoadingLyrics(true);
        try {
          const lyricsData = await getLyricsBySongId(currentTrack.id);
          setLyrics(lyricsData);
        } catch (error) {
          console.error('Error loading lyrics:', error);
          setLyrics([]);
        } finally {
          setIsLoadingLyrics(false);
        }

        // Check if current track is liked
        if (isAuthenticated) {
          const likeStatus = await getSongLikeStatus(currentTrack.id);
          setIsLiked(likeStatus);
        }
      };
      
      checkVerificationAndLoadLyrics();
    } else {
      setIsArtistVerifiedState(false);
      setLyrics([]);
      setIsLiked(false);
    }
  }, [currentTrack?.id, currentTrack?.artistId, isAuthenticated]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleLikeToggle = useCallback(async () => {
    if (!currentTrack || !isAuthenticated) {
      console.log('User must be logged in to like songs');
      return;
    }
    
    const newLikeStatus = await toggleSongLike(currentTrack.id);
    setIsLiked(newLikeStatus);
  }, [currentTrack, isAuthenticated]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setVolumeLevel(prevVolume);
    } else {
      setPrevVolume(volume);
      setVolumeLevel(0);
    }
    setIsMuted(!isMuted);
  }, [isMuted, volume, prevVolume, setVolumeLevel]);

  // Update isMuted state when volume changes externally
  useEffect(() => {
    if (volume === 0 && !isMuted) {
      setIsMuted(true);
    } else if (volume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [volume, isMuted]);

  // Memoized lyric functions
  const getCurrentLyric = useCallback((): LyricLine | null => {
    if (!lyrics.length) return null;
    
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (progress >= lyrics[i].time) {
        return lyrics[i];
      }
    }
    return lyrics[0];
  }, [lyrics, progress]);

  const getUpcomingLyrics = useCallback((): LyricLine[] => {
    const currentLyric = getCurrentLyric();
    if (!currentLyric) return [];
    
    const currentIndex = lyrics.findIndex(lyric => lyric === currentLyric);
    return lyrics.slice(currentIndex + 1, currentIndex + 4);
  }, [lyrics, getCurrentLyric]);

  // Memoized handlers
  const handleProgressChange = useCallback((values: number[]) => {
    seekToPosition(values[0]);
  }, [seekToPosition]);

  const handleVolumeChange = useCallback((values: number[]) => {
    setVolumeLevel(values[0] / 100);
  }, [setVolumeLevel]);

  const handlePlayPause = useCallback(() => {
    togglePlayPause();
  }, [togglePlayPause]);

  const handleNextTrack = useCallback(() => {
    playNextTrack();
  }, [playNextTrack]);

  const handlePreviousTrack = useCallback(() => {
    playPreviousTrack();
  }, [playPreviousTrack]);

  const openLyricsEditor = useCallback(() => {
    setIsLyricsDialogOpen(true);
  }, []);

  const closeLyricsEditor = useCallback(() => {
    setIsLyricsDialogOpen(false);
  }, []);

  const openShareModal = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);

  const closeShareModal = useCallback(() => {
    setIsShareModalOpen(false);
  }, []);

  // Get repeat icon based on mode - memoized
  const getRepeatIcon = useCallback(() => {
    switch (repeatMode) {
      case 'one':
        return <Repeat1 size={20} />;
      case 'all':
        return <Repeat size={20} className="text-green-500" />;
      default:
        return <Repeat size={20} />;
    }
  }, [repeatMode]);

  // Optimized background styles with extracted colors - stable memoization
  const backgroundStyle = useMemo(() => {
    const intensity = isPlaying ? 1 : 0.8; // Reduced intensity change to minimize jarring transitions
    
    return {
      background: `linear-gradient(135deg, 
        hsl(${dominantColors.primary}) 0%,
        hsl(${dominantColors.secondary}) 40%,
        hsl(${dominantColors.accent}) 100%)`,
      opacity: intensity,
      transition: 'background 2s ease, opacity 0.8s ease' // Slower, smoother transitions
    };
  }, [dominantColors.primary, dominantColors.secondary, dominantColors.accent, isPlaying]);

  if (!isOpen || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-50 text-white overflow-hidden">
      {/* Dynamic Background based on album art */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0"
          style={backgroundStyle}
        />
        
        {/* Subtle overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10 transition-colors"
          >
            <ChevronDown size={24} />
          </Button>
          
          <div className="text-center">
            <div className="text-sm opacity-60">Playing from Sonic Wave</div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isArtistVerifiedState && (
              <Button
                variant="ghost"
                size="icon"
                onClick={openLyricsEditor}
                className="text-white hover:bg-white/10 transition-colors"
              >
                <Edit size={24} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={openShareModal}
              className="text-white hover:bg-white/10 transition-colors"
            >
              <Share2 size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal size={24} />
            </Button>
          </div>
        </div>

        <div className="flex flex-col h-full px-6 pb-6">
          {/* Album Art */}
          <div className="flex-1 flex items-center justify-center mb-4">
            <div className="w-80 h-80 max-w-[80vw] max-h-[40vh] bg-gray-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm bg-white/5 border border-white/10 transition-transform duration-300 hover:scale-[1.02]">
              <img
                src={currentTrack.image || 'https://cdn.jamendo.com/default/default-track_200.jpg'}
                alt={currentTrack.albumName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Track Info */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold mb-2 truncate drop-shadow-lg">{currentTrack.name}</h1>
            <div className="flex items-center justify-center text-xl text-gray-200 mb-2">
              <ArtistNameWithBadge
                artistId={currentTrack.artistId}
                artistName={currentTrack.artistName}
                className="truncate hover:underline"
                linkToProfile
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-8 mb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLikeToggle}
                className={`text-white hover:bg-white/10 backdrop-blur-sm transition-colors ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!isAuthenticated}
              >
                <Heart 
                  size={24} 
                  className={isLiked ? 'text-red-500 fill-current' : ''} 
                />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={openShareModal}
                className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors"
              >
                <Share2 size={24} />
              </Button>
              {isArtistVerifiedState && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={openLyricsEditor}
                  className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors"
                >
                  <Edit size={24} />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors">
                <MoreHorizontal size={24} />
              </Button>
            </div>
          </div>

          {/* Lyrics Section - replaced old lyrics UI with AppleMusicLyrics */}
          <div className="mb-4 text-center flex flex-col justify-center backdrop-blur-sm bg-black/20 rounded-lg p-4 min-h-[18rem]">
            <AppleMusicLyrics
              songId={currentTrack.id}
              currentTime={progress}
            />
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[progress]}
              max={duration || 100}
              step={0.1}
              className="mb-2"
              onValueChange={handleProgressChange}
            />
            <div className="flex justify-between text-sm text-gray-300">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors">
              <Shuffle size={20} />
            </Button>
            
            <div className="flex items-center space-x-6">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handlePreviousTrack}
                className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors"
              >
                <SkipBack size={28} />
              </Button>
              
              <button 
                onClick={handlePlayPause}
                className="w-16 h-16 bg-white text-black rounded-full hover:scale-105 transition-transform flex items-center justify-center backdrop-blur-sm shadow-2xl"
                type="button"
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
              </button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleNextTrack}
                className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors"
              >
                <SkipForward size={28} />
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleRepeatMode}
              className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors"
              title={`Repeat: ${repeatMode}`}
            >
              {getRepeatIcon()}
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleMute}
              className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Button>
            <Slider 
              value={[volume * 100]}
              max={100}
              className="w-32"
              onValueChange={handleVolumeChange}
            />
          </div>
        </div>
      </div>

      {/* Lyrics Editor Dialog */}
      <Dialog open={isLyricsDialogOpen} onOpenChange={setIsLyricsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {currentTrack && (
            <LyricsEditor
              songId={currentTrack.id}
              artistId={currentTrack.artistId || ''}
              onClose={closeLyricsEditor}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      {currentTrack && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={closeShareModal}
          track={currentTrack}
        />
      )}
    </div>
  );
};

export default FullScreenPlayer;
