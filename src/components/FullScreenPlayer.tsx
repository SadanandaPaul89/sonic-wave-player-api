import React, { useState, useEffect } from 'react';
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
  BadgeCheck,
  Edit
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { isArtistVerified, getLyricsBySongId } from '@/services/supabaseService';
import LyricsEditor from './LyricsEditor';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LyricLine {
  time: number;
  text: string;
}

const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({ isOpen, onClose }) => {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    togglePlayPause,
    setVolumeLevel,
    seekToPosition,
    playNextTrack,
    playPreviousTrack,
    queue
  } = usePlayer();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isArtistVerifiedState, setIsArtistVerifiedState] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [isLyricsDialogOpen, setIsLyricsDialogOpen] = useState(false);

  // Check if artist is verified and load lyrics
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
      };
      
      checkVerificationAndLoadLyrics();
    } else {
      setIsArtistVerifiedState(false);
      setLyrics([]);
    }
  }, [currentTrack]);

  // Handle mute toggle
  const toggleMute = () => {
    console.log('Mute toggle clicked', { isMuted, volume, prevVolume });
    if (isMuted) {
      setVolumeLevel(prevVolume);
    } else {
      setPrevVolume(volume);
      setVolumeLevel(0);
    }
    setIsMuted(!isMuted);
  };

  // Update isMuted state when volume changes externally
  useEffect(() => {
    if (volume === 0 && !isMuted) {
      setIsMuted(true);
    } else if (volume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [volume]);

  // Find current lyric based on progress
  const getCurrentLyric = (): LyricLine | null => {
    if (!lyrics.length) return null;
    
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (progress >= lyrics[i].time) {
        return lyrics[i];
      }
    }
    return lyrics[0];
  };

  // Get upcoming lyrics
  const getUpcomingLyrics = (): LyricLine[] => {
    const currentLyric = getCurrentLyric();
    if (!currentLyric) return [];
    
    const currentIndex = lyrics.findIndex(lyric => lyric === currentLyric);
    return lyrics.slice(currentIndex + 1, currentIndex + 4);
  };

  // Handle progress bar change
  const handleProgressChange = (values: number[]) => {
    console.log('Progress change:', values[0]);
    seekToPosition(values[0]);
  };

  // Handle volume change
  const handleVolumeChange = (values: number[]) => {
    console.log('Volume change:', values[0]);
    setVolumeLevel(values[0] / 100);
  };

  // Handle play/pause with explicit logging
  const handlePlayPause = () => {
    console.log('FullScreen Play/pause button clicked - Current state:', { isPlaying });
    togglePlayPause();
    console.log('FullScreen Play/pause after toggle');
  };

  // Handle next track - improved to work with queue
  const handleNextTrack = () => {
    console.log('FullScreen Next track clicked - Queue length:', queue.length);
    playNextTrack();
  };

  // Handle previous track - improved to work with queue
  const handlePreviousTrack = () => {
    console.log('FullScreen Previous track clicked');
    playPreviousTrack();
  };

  const openLyricsEditor = () => {
    setIsLyricsDialogOpen(true);
  };

  const closeLyricsEditor = () => {
    setIsLyricsDialogOpen(false);
  };

  // Create background images array from current track and queue
  const getBackgroundImages = () => {
    const images = [];
    if (currentTrack?.image) {
      images.push(currentTrack.image);
    }
    
    // Add images from queue
    queue.forEach(track => {
      if (track.image && track.image !== currentTrack?.image) {
        images.push(track.image);
      }
    });
    
    // If we don't have enough images, duplicate current track image
    while (images.length < 5) {
      if (currentTrack?.image) {
        images.push(currentTrack.image);
      } else {
        images.push('https://cdn.jamendo.com/default/default-track_200.jpg');
      }
    }
    
    return images;
  };

  if (!isOpen || !currentTrack) return null;

  const backgroundImages = getBackgroundImages();

  return (
    <div className="fixed inset-0 bg-black z-50 text-white overflow-hidden">
      {/* Dynamic Carousel Background */}
      <div className="absolute inset-0 opacity-20">
        <Carousel 
          className="w-full h-full"
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent className="h-full">
            {backgroundImages.map((image, index) => (
              <CarouselItem key={index} className="h-full basis-full">
                <div 
                  className="w-full h-full bg-cover bg-center transition-all duration-[10000ms] ease-linear"
                  style={{
                    backgroundImage: `url(${image})`,
                    filter: 'blur(40px) brightness(0.3)',
                    transform: `translateX(${index * -100}%) scale(1.1)`,
                    animation: `smoothSlide 25s infinite linear ${index * 5}s`,
                  }}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Professional Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 backdrop-blur-xl bg-black/20">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10"
          >
            <ChevronDown size={24} />
          </Button>
          
          <div className="text-center">
            <div className="text-sm opacity-70 font-medium">Playing from Sonic Wave</div>
          </div>
          
          <div className="flex items-center space-x-3">
            {isArtistVerifiedState && (
              <Button
                variant="ghost"
                size="icon"
                onClick={openLyricsEditor}
                className="text-white hover:bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10"
              >
                <Edit size={20} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10"
            >
              <MoreHorizontal size={24} />
            </Button>
          </div>
        </div>

        <div className="flex flex-col flex-1 px-8 pb-8">
          {/* Large Circular Album Art with Professional Glow */}
          <div className="flex-1 flex items-center justify-center mb-8">
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30 blur-3xl scale-110 animate-pulse" />
              
              {/* Main album container */}
              <div className="relative w-80 h-80 max-w-[70vw] max-h-[40vh] rounded-full shadow-2xl overflow-hidden backdrop-blur-sm bg-gradient-to-br from-white/5 to-white/10 border border-white/20">
                <img
                  src={currentTrack.image || 'https://cdn.jamendo.com/default/default-track_200.jpg'}
                  alt={currentTrack.albumName}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              
              {/* Inner reflection effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-transparent to-white/10" />
            </div>
          </div>

          {/* Track Info with Glass Effect */}
          <div className="text-center mb-8 backdrop-blur-xl bg-black/30 rounded-3xl p-6 border border-white/10">
            <h1 className="text-4xl font-bold mb-3 truncate bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              {currentTrack.name}
            </h1>
            <div className="flex items-center justify-center text-xl text-gray-300 mb-6">
              <span className="truncate">{currentTrack.artistName}</span>
              {isArtistVerifiedState && (
                <BadgeCheck size={24} className="ml-2 text-blue-400" />
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-6">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                <Heart size={24} />
              </Button>
              {isArtistVerifiedState && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={openLyricsEditor}
                  className="text-white hover:bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10"
                >
                  <Edit size={24} />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                <MoreHorizontal size={24} />
              </Button>
            </div>
          </div>

          {/* Lyrics Section */}
          <div className="mb-8 text-center min-h-[120px] flex flex-col justify-center backdrop-blur-xl bg-black/20 rounded-3xl p-6 border border-white/10">
            {isLoadingLyrics ? (
              <div className="text-xl text-gray-400">Loading lyrics...</div>
            ) : lyrics.length > 0 ? (
              <>
                <div className="text-3xl font-bold mb-4 text-white leading-relaxed">
                  {getCurrentLyric()?.text || "♪ Instrumental ♪"}
                </div>
                <div className="space-y-2">
                  {getUpcomingLyrics().slice(0, 2).map((lyric, index) => (
                    <div 
                      key={index} 
                      className={`text-lg transition-all duration-500 text-gray-400`}
                      style={{ opacity: Math.max(0.6 - index * 0.2, 0.2) }}
                    >
                      {lyric.text}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-xl text-gray-400">♪ No lyrics available ♪</div>
            )}
          </div>

          {/* Progress Bar with Gradient */}
          <div className="mb-8 backdrop-blur-xl bg-black/20 rounded-3xl p-6 border border-white/10">
            <Slider
              value={[progress]}
              max={duration || 100}
              step={0.1}
              className="mb-3 [&>span:first-child]:bg-gradient-to-r [&>span:first-child]:from-purple-500 [&>span:first-child]:to-pink-500 [&>span:first-child]:h-2 [&>span:first-child]:rounded-full"
              onValueChange={handleProgressChange}
            />
            <div className="flex justify-between text-sm text-gray-400 font-medium">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Floating Control Bar */}
          <div className="flex items-center justify-between mb-6 backdrop-blur-xl bg-black/30 rounded-3xl p-6 border border-white/10 shadow-2xl">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-2xl transition-all duration-300">
              <Shuffle size={24} />
            </Button>
            
            <div className="flex items-center space-x-8">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handlePreviousTrack}
                className="text-white hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-110"
              >
                <SkipBack size={32} />
              </Button>
              
              {/* Professional Play/Pause Button */}
              <div className="relative">
                <button 
                  onClick={handlePlayPause}
                  className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:scale-105 transition-all duration-300 flex items-center justify-center shadow-2xl border-2 border-white/20"
                  type="button"
                >
                  {isPlaying ? <Pause size={36} /> : <Play size={36} className="ml-1" />}
                </button>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/40 to-pink-500/40 blur-xl scale-125 -z-10 animate-pulse" />
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleNextTrack}
                className="text-white hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-110"
              >
                <SkipForward size={32} />
              </Button>
            </div>
            
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-2xl transition-all duration-300">
              <Repeat size={24} />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-center space-x-4 backdrop-blur-xl bg-black/20 rounded-3xl p-4 border border-white/10">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleMute}
              className="text-white hover:bg-white/10 rounded-2xl"
            >
              {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </Button>
            <Slider 
              value={[volume * 100]}
              max={100}
              className="w-40 [&>span:first-child]:bg-gradient-to-r [&>span:first-child]:from-purple-500 [&>span:first-child]:to-pink-500 [&>span:first-child]:h-2 [&>span:first-child]:rounded-full"
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

      <style>{`
        @keyframes smoothSlide {
          0% { transform: translateX(0) scale(1.1); }
          100% { transform: translateX(-100%) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default FullScreenPlayer;
