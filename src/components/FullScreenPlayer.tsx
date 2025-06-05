
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
import { isArtistVerified } from '@/services/localLibrary';

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
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
  const [showLyrics, setShowLyrics] = useState(true);

  // Mock lyrics data - in a real app, this would come from an API
  const lyrics = [
    { time: 0, text: "Welcome to this amazing song" },
    { time: 15, text: "Feel the rhythm and the beat" },
    { time: 30, text: "Music flowing through your soul" },
    { time: 45, text: "Let the melody take control" },
    { time: 60, text: "Dancing to the sound of freedom" },
    { time: 75, text: "Every note tells a story" },
    { time: 90, text: "In this moment we are one" },
    { time: 105, text: "Music brings us all together" },
  ];

  // Check if artist is verified
  useEffect(() => {
    if (currentTrack && currentTrack.artistId) {
      const verified = isArtistVerified(currentTrack.artistId);
      setIsArtistVerifiedState(verified);
    } else {
      setIsArtistVerifiedState(false);
    }
  }, [currentTrack]);

  // Handle mute toggle
  const toggleMute = () => {
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
  const getCurrentLyric = () => {
    if (!lyrics.length) return null;
    
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (progress >= lyrics[i].time) {
        return lyrics[i];
      }
    }
    return lyrics[0];
  };

  // Get upcoming lyrics
  const getUpcomingLyrics = () => {
    const currentLyric = getCurrentLyric();
    if (!currentLyric) return [];
    
    const currentIndex = lyrics.findIndex(lyric => lyric === currentLyric);
    return lyrics.slice(currentIndex + 1, currentIndex + 4);
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
        {showLyrics && (
          <div className="mb-8 text-center min-h-[120px] flex flex-col justify-center">
            <div className="text-2xl font-semibold mb-4">
              {getCurrentLyric()?.text || "♪ Instrumental ♪"}
            </div>
            <div className="space-y-2">
              {getUpcomingLyrics().map((lyric, index) => (
                <div 
                  key={index} 
                  className={`text-lg opacity-${60 - index * 20} transition-opacity duration-300`}
                >
                  {lyric.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <Slider
            value={[progress]}
            max={duration || 100}
            step={0.1}
            className="mb-2"
            onValueChange={(values) => seekToPosition(values[0])}
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
              onClick={playPreviousTrack}
              className="text-white hover:bg-white/10"
            >
              <SkipBack size={28} />
            </Button>
            
            <Button 
              onClick={togglePlayPause}
              className="w-16 h-16 bg-white text-black rounded-full hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={playNextTrack}
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
            onValueChange={(values) => setVolumeLevel(values[0] / 100)}
          />
        </div>
      </div>
    </div>
  );
};

export default FullScreenPlayer;
