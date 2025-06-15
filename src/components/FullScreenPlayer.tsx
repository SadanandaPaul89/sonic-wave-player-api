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
  const [isMobile, setIsMobile] = React.useState(false);
  const [isShowLyrics, setIsShowLyrics] = useState(true); // Show lyrics toggle

  // Detect mobile (reuse useIsMobile hook if available)
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // UI: Show lyrics toggle button
  const showLyricsButton = (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsShowLyrics((x) => !x)}
      className={`
        text-white hover:bg-white/10 transition-colors px-2 py-1 rounded
        border ${isShowLyrics ? 'border-white/60 bg-white/20' : 'border-white/30'}
        text-xs sm:text-sm ml-1 sm:ml-2
      `}
      aria-pressed={isShowLyrics}
      aria-label={isShowLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
    >
      {isShowLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
    </Button>
  );

  if (!isOpen || !currentTrack) return null;

  // Desktop/PC two-column layout with lyrics, else default stack/center
  const renderMainContent = () => {
    if (!isMobile && isShowLyrics) {
      return (
        <div className="flex flex-row gap-6 w-full h-full justify-center items-stretch max-w-[1280px] mx-auto px-0 sm:px-4">
          {/* Left: Album Art and details */}
          <div className="flex flex-col items-center justify-start min-w-[260px] max-w-[460px] flex-1">
            {/* Album Art, Track Info, Buttons, Controls */}
            <div className="rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm bg-white/5 border border-white/10 transition-transform duration-300 hover:scale-[1.02] w-60 h-60 sm:w-72 sm:h-72 max-w-[92vw] mb-2">
              <img
                src={currentTrack.image || 'https://cdn.jamendo.com/default/default-track_200.jpg'}
                alt={currentTrack.albumName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {/* Track Info */}
            <div className="text-center mb-2 sm:mb-4 px-2 max-w-full">
              <h1 className="truncate font-bold drop-shadow-lg text-base sm:text-3xl mb-1 sm:mb-2">{currentTrack.name}</h1>
              <div className="flex items-center justify-center text-xs sm:text-xl mb-1 sm:mb-2 text-gray-200">
                <ArtistNameWithBadge
                  artistId={currentTrack.artistId}
                  artistName={currentTrack.artistName}
                  className="truncate hover:underline"
                  linkToProfile
                />
              </div>
              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-2 sm:space-x-8 mb-1 sm:mb-4">
                <Button 
                  variant="ghost"
                  size="icon" 
                  onClick={handleLikeToggle}
                  className={`text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-8 h-8 sm:w-10 sm:h-10 ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isAuthenticated}
                >
                  <Heart size={20} className={isLiked ? 'text-red-500 fill-current' : ''} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={openShareModal}
                  className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-8 h-8 sm:w-10 sm:h-10"
                >
                  <Share2 size={20} />
                </Button>
                {isArtistVerifiedState && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={openLyricsEditor}
                    className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-8 h-8 sm:w-10 sm:h-10"
                  >
                    <Edit size={20} />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-8 h-8 sm:w-10 sm:h-10">
                  <MoreHorizontal size={20} />
                </Button>
              </div>
            </div>
            {/* Seek Bar & Controls */}
            <div className="w-full flex flex-col gap-3 mt-2">
              <div>
                <Slider
                  value={[progress]}
                  max={duration || 100}
                  step={0.1}
                  className="mb-1"
                  onValueChange={handleProgressChange}
                />
                <div className="flex justify-between text-[11px] sm:text-sm text-gray-300 px-1">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-8 h-8"
                >
                  <Shuffle size={18} />
                </Button>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={handlePreviousTrack}
                    className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-10 h-10"
                  >
                    <SkipBack size={22} />
                  </Button>
                  <button 
                    onClick={handlePlayPause}
                    className="bg-white text-black rounded-full hover:scale-105 transition-transform flex items-center justify-center backdrop-blur-sm shadow-2xl w-12 h-12"
                    type="button"
                  >
                    {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                  </button>
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={handleNextTrack}
                    className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-10 h-10"
                  >
                    <SkipForward size={22} />
                  </Button>
                </div>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={toggleRepeatMode}
                  className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-8 h-8"
                  title={`Repeat: ${repeatMode}`}
                >
                  {getRepeatIcon()}
                </Button>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-8 h-8"
                >
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </Button>
                <Slider 
                  value={[volume * 100]}
                  max={100}
                  className="w-20"
                  onValueChange={handleVolumeChange}
                />
              </div>
            </div>
          </div>
          {/* Right: Lyrics - Expanded for full height/width, minimal vertical padding */}
          <div
            className="
              flex-1 flex flex-col justify-center items-center
              rounded-xl bg-black/20
              px-2 py-1
              min-w-[340px] max-w-[800px]
              w-full h-full
              shadow-lg transition-all
              overflow-hidden
            "
            style={{
              minHeight: 0, // allow flex to handle height
              maxHeight: '100vh', // safe max in desktop modal
            }}
          >
            <div className="w-full h-full flex flex-col justify-center items-center">
              <AppleMusicLyrics
                lyrics={lyrics}
                currentTime={progress}
                isLoading={isLoadingLyrics}
                isMobile={false}
              />
            </div>
          </div>
        </div>
      );
    }

    // Mobile OR desktop w/o lyrics
    return (
      <div className="flex flex-col h-full px-2 sm:px-6 pb-2 sm:pb-6">
        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center mb-1 sm:mb-4">
          <div
            className={`
              rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm bg-white/5 border border-white/10 transition-transform duration-300 hover:scale-[1.02]
              w-[52vw] h-[52vw] max-w-[98vw] max-h-[25vh]
              sm:w-80 sm:h-80 sm:max-w-[80vw] sm:max-h-[40vh]
            `}
          >
            <img
              src={currentTrack.image || 'https://cdn.jamendo.com/default/default-track_200.jpg'}
              alt={currentTrack.albumName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
        {/* Track Info, Controls, Seek Bar, Lyrics (if mobile and visible) */}
        <div className="text-center mb-2 sm:mb-4">
          <h1 className="truncate font-bold drop-shadow-lg text-base sm:text-3xl mb-1 sm:mb-2">{currentTrack.name}</h1>
          <div className="flex items-center justify-center text-xs sm:text-xl mb-1 sm:mb-2 text-gray-200">
            <ArtistNameWithBadge
              artistId={currentTrack.artistId}
              artistName={currentTrack.artistName}
              className="truncate hover:underline"
              linkToProfile
            />
          </div>
          <div className="flex items-center justify-center space-x-2 sm:space-x-8 mb-1 sm:mb-4">
            <Button 
              variant="ghost"
              size="icon" 
              onClick={handleLikeToggle}
              className={`text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-8 h-8 sm:w-10 sm:h-10 ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!isAuthenticated}
            >
              <Heart size={20} className={isLiked ? 'text-red-500 fill-current' : ''} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={openShareModal}
              className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-8 h-8 sm:w-10 sm:h-10"
            >
              <Share2 size={20} />
            </Button>
            {isArtistVerifiedState && (
              <Button
                variant="ghost"
                size="icon"
                onClick={openLyricsEditor}
                className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-8 h-8 sm:w-10 sm:h-10"
              >
                <Edit size={20} />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-8 h-8 sm:w-10 sm:h-10">
              <MoreHorizontal size={20} />
            </Button>
          </div>
        </div>

        {/* Lyrics (shown only if visible on mobile or on desktop with lyrics off) */}
        {(isMobile && isShowLyrics) && (
          <div className="mb-2 sm:mb-4 text-center flex flex-col justify-center backdrop-blur-sm bg-black/20 rounded-lg p-2 sm:p-4 min-h-[74px] sm:min-h-[100px] max-w-[98vw] mx-auto w-full">
            <AppleMusicLyrics
              lyrics={lyrics}
              currentTime={progress}
              isLoading={isLoadingLyrics}
              isMobile={isMobile}
            />
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-1 sm:mb-4">
          <Slider
            value={[progress]}
            max={duration || 100}
            step={0.1}
            className="mb-1 sm:mb-2"
            onValueChange={handleProgressChange}
          />
          <div className="flex justify-between text-[11px] sm:text-sm text-gray-300">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between mb-1 sm:mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-8 h-8 sm:w-10 sm:h-10"
          >
            <Shuffle size={18} className="sm:size-[20px]" />
          </Button>
          <div className="flex items-center space-x-2 sm:space-x-6">
            <Button 
              variant="ghost"
              size="icon"
              onClick={handlePreviousTrack}
              className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-10 h-10 sm:w-12 sm:h-12"
            >
              <SkipBack size={22} className="sm:size-[28px]" />
            </Button>
            <button 
              onClick={handlePlayPause}
              className="bg-white text-black rounded-full hover:scale-105 transition-transform flex items-center justify-center backdrop-blur-sm shadow-2xl w-12 h-12 sm:w-16 sm:h-16"
              type="button"
            >
              {isPlaying ? <Pause size={28} className="sm:size-[32px]" /> : <Play size={28} className="ml-1 sm:size-[32px]" />}
            </button>
            <Button 
              variant="ghost"
              size="icon"
              onClick={handleNextTrack}
              className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-10 h-10 sm:w-12 sm:h-12"
            >
              <SkipForward size={22} className="sm:size-[28px]" />
            </Button>
          </div>
          <Button 
            variant="ghost"
            size="icon"
            onClick={toggleRepeatMode}
            className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-8 h-8 sm:w-10 sm:h-10"
            title={`Repeat: ${repeatMode}`}
          >
            {getRepeatIcon()}
          </Button>
        </div>
        {/* Volume Control */}
        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
          <Button 
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-white hover:bg-white/10 backdrop-blur-sm transition-colors w-8 h-8 sm:w-10 sm:h-10"
          >
            {isMuted || volume === 0 ? <VolumeX size={18} className="sm:size-[20px]" /> : <Volume2 size={18} className="sm:size-[20px]" />}
          </Button>
          <Slider 
            value={[volume * 100]}
            max={100}
            className="w-20 sm:w-32"
            onValueChange={handleVolumeChange}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 text-white overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={backgroundStyle} />
        <div className="absolute inset-0 bg-black/20" />
      </div>
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between p-2 sm:p-4 px-2 py-2 sm:px-4 sm:py-4`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={`text-white hover:bg-white/10 transition-colors flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10`}
          >
            <ChevronDown size={20} className="sm:size-[24px]" />
          </Button>
          <div className="text-center flex-1 min-w-0 flex justify-center items-center">
            <div className={`text-xs sm:text-sm opacity-60 truncate`}>Playing from Sonic Wave</div>
            {showLyricsButton}
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {isArtistVerifiedState && (
              <Button
                variant="ghost"
                size="icon"
                onClick={openLyricsEditor}
                className={`text-white hover:bg-white/10 transition-colors w-8 h-8 sm:w-10 sm:h-10`}
              >
                <Edit size={20} className="sm:size-[24px]" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={openShareModal}
              className={`text-white hover:bg-white/10 transition-colors w-8 h-8 sm:w-10 sm:h-10`}
            >
              <Share2 size={18} className="sm:size-[20px]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`text-white hover:bg-white/10 transition-colors w-8 h-8 sm:w-10 sm:h-10`}
            >
              <MoreHorizontal size={20} className="sm:size-[24px]" />
            </Button>
          </div>
        </div>

        {/* Main Panel (mobile/desktop layout chosen based on state) */}
        <div className="flex-1 flex items-center justify-center w-full">
          {(!isMobile && isShowLyrics)
            ? renderMainContent()
            : renderMainContent()}
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
