
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
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { isArtistVerified, getLyricsBySongId } from '@/services/supabaseService';
import LyricsEditor from './LyricsEditor';

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

  // Create carousel images array (current track + queue images)
  const carouselImages = React.useMemo(() => {
    const images = [];
    if (currentTrack?.image) {
      images.push(currentTrack.image);
    }
    queue.slice(0, 8).forEach(track => {
      if (track.image) {
        images.push(track.image);
      }
    });
    
    // Add some default images if we don't have enough
    const defaultImages = [
      'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1518877593221-1f28583780b4?w=800&h=800&fit=crop'
    ];
    
    while (images.length < 6) {
      images.push(defaultImages[images.length % defaultImages.length]);
    }
    
    return images;
  }, [currentTrack, queue]);

  // Check if artist is verified and load lyrics
  useEffect(() => {
    if (currentTrack && currentTrack.artistId) {
      const checkVerificationAndLoadLyrics = async () => {
        const verified = await isArtistVerified(currentTrack.artistId);
        setIsArtistVerifiedState(verified);
        
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

  const toggleMute = () => {
    if (isMuted) {
      setVolumeLevel(prevVolume);
    } else {
      setPrevVolume(volume);
      setVolumeLevel(0);
    }
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    if (volume === 0 && !isMuted) {
      setIsMuted(true);
    } else if (volume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [volume]);

  const getCurrentLyric = (): LyricLine | null => {
    if (!lyrics.length) return null;
    
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (progress >= lyrics[i].time) {
        return lyrics[i];
      }
    }
    return lyrics[0];
  };

  const handleProgressChange = (values: number[]) => {
    seekToPosition(values[0]);
  };

  const handleVolumeChange = (values: number[]) => {
    setVolumeLevel(values[0] / 100);
  };

  const handlePlayPause = () => {
    togglePlayPause();
  };

  const handleNextTrack = () => {
    playNextTrack();
  };

  const handlePreviousTrack = () => {
    playPreviousTrack();
  };

  const openLyricsEditor = () => {
    setIsLyricsDialogOpen(true);
  };

  const closeLyricsEditor = () => {
    setIsLyricsDialogOpen(false);
  };

  if (!isOpen || !currentTrack) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 text-white overflow-hidden">
      {/* Animated Background Carousel */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="relative h-full w-full">
          <Carousel 
            opts={{ 
              loop: true,
              align: "center",
              skipSnaps: false,
            }}
            className="h-full w-full"
          >
            <CarouselContent className="h-full -ml-0">
              {carouselImages.map((image, index) => (
                <CarouselItem key={index} className="pl-0 basis-full h-full relative">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transform scale-110 animate-pulse"
                    style={{
                      backgroundImage: `url(${image})`,
                      filter: 'blur(20px) brightness(0.3)',
                      animation: `slideBackground 20s linear infinite`,
                      animationDelay: `${index * 3}s`
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-purple-900/40 to-black/80" />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/10 backdrop-blur-sm rounded-2xl"
        >
          <ChevronDown size={24} />
        </Button>
        
        <div className="text-center backdrop-blur-sm bg-black/20 rounded-2xl px-4 py-2">
          <div className="text-sm opacity-80">Playing from Sonic Wave</div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isArtistVerifiedState && (
            <Button
              variant="ghost"
              size="icon"
              onClick={openLyricsEditor}
              className="text-white hover:bg-white/10 backdrop-blur-sm rounded-2xl"
            >
              <Edit size={20} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 backdrop-blur-sm rounded-2xl"
          >
            <MoreHorizontal size={24} />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 pb-20">
        {/* Large Circular Album Art with Neon Glow */}
        <div className="mb-8 relative">
          <div className="w-80 h-80 max-w-[70vw] max-h-[70vw] relative">
            {/* Neon Glow Effect */}
            <div 
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                background: `radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, rgba(147, 51, 234, 0.1) 50%, transparent 70%)`,
                filter: 'blur(20px)',
                transform: 'scale(1.2)'
              }}
            />
            
            {/* Album Art */}
            <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-purple-500/30">
              <img
                src={currentTrack.image || 'https://cdn.jamendo.com/default/default-track_200.jpg'}
                alt={currentTrack.albumName}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              
              {/* Inner Glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-purple-400/20" />
            </div>
          </div>
        </div>

        {/* Track Info */}
        <div className="text-center mb-8 backdrop-blur-sm bg-black/20 rounded-2xl p-6 max-w-md">
          <h1 className="text-3xl font-bold mb-2 truncate text-white drop-shadow-lg">
            {currentTrack.name}
          </h1>
          <div className="flex items-center justify-center text-xl text-gray-300 mb-4">
            <span className="truncate">{currentTrack.artistName}</span>
            {isArtistVerifiedState && (
              <BadgeCheck size={20} className="ml-2 text-blue-400" />
            )}
          </div>
          
          {/* Current Lyric Display */}
          {lyrics.length > 0 && (
            <div className="text-lg text-purple-200 italic opacity-80">
              "{getCurrentLyric()?.text || "♪ Instrumental ♪"}"
            </div>
          )}
        </div>

        {/* Floating Controls Bar */}
        <div className="backdrop-blur-md bg-black/40 rounded-2xl p-6 border border-white/10 shadow-2xl">
          {/* Progress Bar */}
          <div className="mb-6 w-80 max-w-[80vw]">
            <div className="relative">
              <Slider
                value={[progress]}
                max={duration || 100}
                step={0.1}
                className="mb-2 [&>span]:bg-gradient-to-r [&>span]:from-purple-400 [&>span]:to-pink-400"
                onValueChange={handleProgressChange}
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-sm -z-10" />
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10 rounded-2xl hover:scale-110 transition-all duration-200"
            >
              <Shuffle size={20} />
            </Button>
            
            <div className="flex items-center space-x-6">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handlePreviousTrack}
                className="text-white hover:bg-white/10 rounded-2xl hover:scale-110 transition-all duration-200"
              >
                <SkipBack size={28} />
              </Button>
              
              {/* Main Play/Pause Button with Enhanced Styling */}
              <button 
                onClick={handlePlayPause}
                className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-2xl relative group"
                type="button"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
              </button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleNextTrack}
                className="text-white hover:bg-white/10 rounded-2xl hover:scale-110 transition-all duration-200"
              >
                <SkipForward size={28} />
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10 rounded-2xl hover:scale-110 transition-all duration-200"
            >
              <Repeat size={20} />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleMute}
              className="text-white hover:bg-white/10 rounded-2xl"
            >
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Button>
            <div className="relative w-32">
              <Slider 
                value={[volume * 100]}
                max={100}
                className="[&>span]:bg-gradient-to-r [&>span]:from-purple-400 [&>span]:to-pink-400"
                onValueChange={handleVolumeChange}
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-sm -z-10" />
            </div>
          </div>
        </div>

        {/* Additional Controls */}
        <div className="flex items-center space-x-4 mt-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10 backdrop-blur-sm rounded-2xl hover:scale-110 transition-all duration-200"
          >
            <Heart size={24} />
          </Button>
        </div>
      </div>

      {/* Lyrics Editor Dialog */}
      <Dialog open={isLyricsDialogOpen} onOpenChange={setIsLyricsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-black/90 backdrop-blur-xl border-purple-500/30">
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
          0% { transform: scale(1.1) translateX(-10px); }
          50% { transform: scale(1.15) translateX(10px); }
          100% { transform: scale(1.1) translateX(-10px); }
        }
      `}</style>
    </div>
  );
};

export default FullScreenPlayer;
