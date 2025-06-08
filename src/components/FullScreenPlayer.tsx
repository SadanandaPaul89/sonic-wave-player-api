
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
  BadgeCheck
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { isArtistVerified, getLyricsBySongId } from '@/services/supabaseService';

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
    playPreviousTrack
  } = usePlayer();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isArtistVerifiedState, setIsArtistVerifiedState] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

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

  // Handle play/pause
  const handlePlayPause = () => {
    console.log('Play/pause clicked', { isPlaying });
    togglePlayPause();
  };

  // Handle next track
  const handleNextTrack = () => {
    console.log('Next track clicked');
    playNextTrack();
  };

  // Handle previous track
  const handlePreviousTrack = () => {
    console.log('Previous track clicked');
    playPreviousTrack();
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
        
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
        >
          <MoreHorizontal size={24} />
        </Button>
      </div>

      <div className="flex flex-col h-full px-6 pb-6">
        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <div className="w-80 h-80 max-w-[80vw] max-h-[40vh] bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <img
              src={currentTrack.image || 'https://cdn.jamendo.com/default/default-track_200.jpg'}
              alt={currentTrack.albumName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Track Info */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 truncate">{currentTrack.name}</h1>
          <div className="flex items-center justify-center text-xl text-gray-300 mb-4">
            <span className="truncate">{currentTrack.artistName}</span>
            {isArtistVerifiedState && (
              <BadgeCheck size={20} className="ml-2 text-blue-500" />
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-8 mb-6">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Heart size={24} />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <MoreHorizontal size={24} />
            </Button>
          </div>
        </div>

        {/* Lyrics Section */}
        <div className="mb-8 text-center min-h-[120px] flex flex-col justify-center">
          {isLoadingLyrics ? (
            <div className="text-xl text-gray-400">Loading lyrics...</div>
          ) : lyrics.length > 0 ? (
            <>
              <div className="text-2xl font-semibold mb-4">
                {getCurrentLyric()?.text || "♪ Instrumental ♪"}
              </div>
              <div className="space-y-2">
                {getUpcomingLyrics().map((lyric, index) => (
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

        {/* Progress Bar */}
        <div className="mb-6">
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

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
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
            
            <Button 
              onClick={handlePlayPause}
              className="w-16 h-16 bg-white text-black rounded-full hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </Button>
            
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
    </div>
  );
};

export default FullScreenPlayer;
