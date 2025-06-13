
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
      <div className="absolute inset-0 opacity-30">
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
                  className="w-full h-full bg-cover bg-center transition-transform duration-[8000ms] ease-linear transform scale-110 animate-pulse"
                  style={{
                    backgroundImage: `url(${image})`,
                    filter: 'blur(60px) brightness(0.4)',
                    animation: `slideBackground 20s infinite linear ${index * 4}s`,
                  }}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-transparent to-blue-900/10" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 backdrop-blur-sm bg-black/10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <ChevronDown size={24} />
          </Button>
          
          <div className="text-center">
            <div className="text-sm opacity-80">Playing from Sonic Wave</div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isArtistVerifiedState && (
              <Button
                variant="ghost"
                size="icon"
                onClick={openLyricsEditor}
                className="text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Edit size={20} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <MoreHorizontal size={24} />
            </Button>
          </div>
        </div>

        <div className="flex flex-col flex-1 px-6 pb-6">
          {/* Album Art - Large with Glow Effect */}
          <div className="flex-1 flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-80 h-80 max-w-[80vw] max-h-[50vh] rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm bg-white/5 border border-white/10">
                <img
                  src={currentTrack.image || 'https://cdn.jamendo.com/default/default-track_200.jpg'}
                  alt={currentTrack.albumName}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Glow Effect */}
              <div 
                className="absolute inset-0 rounded-3xl opacity-20 blur-2xl -z-10"
                style={{
                  background: `radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 70%)`,
                  transform: 'scale(1.1)',
                }}
              />
            </div>
          </div>

          {/* Track Info */}
          <div className="text-center mb-6 backdrop-blur-sm bg-black/10 rounded-2xl p-4">
            <h1 className="text-3xl font-bold mb-2 truncate">{currentTrack.name}</h1>
            <div className="flex items-center justify-center text-xl text-gray-300 mb-4">
              <span className="truncate">{currentTrack.artistName}</span>
              {isArtistVerifiedState && (
                <BadgeCheck size={20} className="ml-2 text-blue-400" />
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-8">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Heart size={24} />
              </Button>
              {isArtistVerifiedState && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={openLyricsEditor}
                  className="text-white hover:bg-white/20"
                >
                  <Edit size={24} />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <MoreHorizontal size={24} />
              </Button>
            </div>
          </div>

          {/* Lyrics Section */}
          <div className="mb-6 text-center min-h-[100px] flex flex-col justify-center backdrop-blur-sm bg-black/10 rounded-2xl p-4">
            {isLoadingLyrics ? (
              <div className="text-xl text-gray-400">Loading lyrics...</div>
            ) : lyrics.length > 0 ? (
              <>
                <div className="text-2xl font-semibold mb-2 text-white">
                  {getCurrentLyric()?.text || "♪ Instrumental ♪"}
                </div>
                <div className="space-y-1">
                  {getUpcomingLyrics().slice(0, 2).map((lyric, index) => (
                    <div 
                      key={index} 
                      className={`text-lg transition-opacity duration-300 text-gray-400`}
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

          {/* Progress Bar */}
          <div className="mb-6 backdrop-blur-sm bg-black/10 rounded-2xl p-4">
            <Slider
              value={[progress]}
              max={duration || 100}
              step={0.1}
              className="mb-2"
              onValueChange={handleProgressChange}
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-between mb-6 backdrop-blur-sm bg-black/20 rounded-2xl p-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Shuffle size={20} />
            </Button>
            
            <div className="flex items-center space-x-6">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handlePreviousTrack}
                className="text-white hover:bg-white/20"
              >
                <SkipBack size={28} />
              </Button>
              
              {/* Main Play/Pause Button with Glow */}
              <div className="relative">
                <button 
                  onClick={handlePlayPause}
                  className="w-16 h-16 bg-white text-black rounded-full hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-2xl"
                  type="button"
                >
                  {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                </button>
                <div 
                  className="absolute inset-0 rounded-full opacity-30 blur-xl -z-10"
                  style={{
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%)',
                    transform: 'scale(1.2)',
                  }}
                />
              </div>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleNextTrack}
                className="text-white hover:bg-white/20"
              >
                <SkipForward size={28} />
              </Button>
            </div>
            
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Repeat size={20} />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-center space-x-4 backdrop-blur-sm bg-black/10 rounded-2xl p-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
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

      <style jsx>{`
        @keyframes slideBackground {
          0% { transform: translateX(-100%) scale(1.1); }
          100% { transform: translateX(100%) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default FullScreenPlayer;
