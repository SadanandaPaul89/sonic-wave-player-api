
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

  if (!isOpen || !currentTrack) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-purple-900 via-purple-800 to-black z-50 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/10"
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
              className="text-white hover:bg-white/10"
            >
              <Edit size={20} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <MoreHorizontal size={24} />
          </Button>
        </div>
      </div>

      <div className="flex flex-col h-full px-6 pb-6">
        {/* Album Art - Reduced bottom margin */}
        <div className="flex-1 flex items-center justify-center mb-4">
          <div className="w-80 h-80 max-w-[80vw] max-h-[40vh] bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <img
              src={currentTrack.image || 'https://cdn.jamendo.com/default/default-track_200.jpg'}
              alt={currentTrack.albumName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Track Info - Reduced margins */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold mb-2 truncate">{currentTrack.name}</h1>
          <div className="flex items-center justify-center text-xl text-gray-300 mb-2">
            <span className="truncate">{currentTrack.artistName}</span>
            {isArtistVerifiedState && (
              <BadgeCheck size={20} className="ml-2 text-blue-500" />
            )}
          </div>
          
          {/* Action Buttons - Reduced margin */}
          <div className="flex items-center justify-center space-x-8 mb-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Heart size={24} />
            </Button>
            {isArtistVerifiedState && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={openLyricsEditor}
                className="text-white hover:bg-white/10"
              >
                <Edit size={24} />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <MoreHorizontal size={24} />
            </Button>
          </div>
        </div>

        {/* Lyrics Section - Reduced height and margin */}
        <div className="mb-4 text-center min-h-[80px] flex flex-col justify-center">
          {isLoadingLyrics ? (
            <div className="text-xl text-gray-400">Loading lyrics...</div>
          ) : lyrics.length > 0 ? (
            <>
              <div className="text-2xl font-semibold mb-2">
                {getCurrentLyric()?.text || "♪ Instrumental ♪"}
              </div>
              <div className="space-y-1">
                {getUpcomingLyrics().slice(0, 2).map((lyric, index) => (
                  <div 
                    key={index} 
                    className={`text-lg transition-opacity duration-300`}
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

        {/* Progress Bar - Reduced margin */}
        <div className="mb-4">
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

        {/* Main Controls - Moved up with reduced margin */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Shuffle size={20} />
          </Button>
          
          <div className="flex items-center space-x-6">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handlePreviousTrack}
              className="text-white hover:bg-white/10"
            >
              <SkipBack size={28} />
            </Button>
            
            {/* Main Play/Pause Button */}
            <button 
              onClick={handlePlayPause}
              className="w-16 h-16 bg-white text-black rounded-full hover:scale-105 transition-transform flex items-center justify-center"
              type="button"
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
            </button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleNextTrack}
              className="text-white hover:bg-white/10"
            >
              <SkipForward size={28} />
            </Button>
          </div>
          
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Repeat size={20} />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center justify-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleMute}
            className="text-white hover:bg-white/10"
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
    </div>
  );
};

export default FullScreenPlayer;
