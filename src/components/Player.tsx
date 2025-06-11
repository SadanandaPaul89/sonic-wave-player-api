
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatTime } from '@/utils/formatTime';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, BadgeCheck, Maximize2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { getArtistById, isArtistVerified } from '@/services/localLibrary';
import FullScreenPlayer from './FullScreenPlayer';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const Player: React.FC = () => {
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
  
  const isMobile = useIsMobile();
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isArtistVerifiedState, setIsArtistVerifiedState] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);

  // Function to get the correct track image (prioritize album art, never artist image)
  const getTrackImage = (track: any): string => {
    if (!track) return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center';
    
    // Always prioritize track's own image (album art)
    if (track.image && 
        !track.image.includes('default-artist') && 
        track.image !== 'https://cdn.jamendo.com/default/default-artist_200.jpg') {
      return track.image;
    }
    
    // Fallback to default placeholder (NOT artist image)
    return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center';
  };

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
  
  // Check if artist is verified
  useEffect(() => {
    if (currentTrack && currentTrack.artistId) {
      const verified = isArtistVerified(currentTrack.artistId);
      setIsArtistVerifiedState(verified);
    } else {
      setIsArtistVerifiedState(false);
    }
  }, [currentTrack]);

  if (!currentTrack) {
    return (
      <div className={`${isMobile ? 'h-16' : 'h-20'} border-t border-spotify-highlight bg-spotify-elevated px-4 flex items-center justify-center text-gray-400`}>
        No track selected
      </div>
    );
  }

  const trackImageUrl = getTrackImage(currentTrack);

  if (isMobile) {
    return (
      <>
        <div className="h-16 border-t border-spotify-highlight bg-spotify-elevated px-3 flex items-center">
          {/* Mobile Track Info */}
          <div className="flex items-center flex-1 min-w-0 mr-3">
            <div 
              className="w-12 h-12 bg-gray-600 mr-3 rounded flex-shrink-0 cursor-pointer"
              onClick={() => setIsFullScreenOpen(true)}
            >
              <img
                src={trackImageUrl}
                alt={`${currentTrack.name} album art`}
                className="w-full h-full rounded object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center';
                }}
              />
            </div>
            <div className="truncate min-w-0">
              <div 
                className="text-sm font-medium truncate cursor-pointer"
                onClick={() => setIsFullScreenOpen(true)}
              >
                {currentTrack.name}
              </div>
              <div className="flex items-center text-xs text-gray-400 truncate">
                {currentTrack.artistId ? (
                  <Link to={`/artist-profile/${currentTrack.artistId}`} className="hover:text-white transition-colors truncate">
                    {currentTrack.artistName}
                  </Link>
                ) : (
                  <span className="truncate">{currentTrack.artistName}</span>
                )}
                {isArtistVerifiedState && (
                  <BadgeCheck size={12} className="ml-1 text-blue-500 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile Controls */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={playPreviousTrack} 
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              <SkipBack size={20} />
            </button>
            <button 
              onClick={togglePlayPause} 
              className="p-2 bg-white rounded-full text-black hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button 
              onClick={playNextTrack} 
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              <SkipForward size={20} />
            </button>
          </div>
        </div>

        {/* Full Screen Player */}
        <FullScreenPlayer 
          isOpen={isFullScreenOpen}
          onClose={() => setIsFullScreenOpen(false)}
        />
      </>
    );
  }

  // Desktop layout
  return (
    <>
      <div className="h-20 border-t border-spotify-highlight bg-spotify-elevated px-4 flex items-center">
        {/* Track Info */}
        <div className="w-1/4 flex items-center">
          <div 
            className="w-14 h-14 bg-gray-600 mr-3 rounded flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setIsFullScreenOpen(true)}
          >
            <img
              src={trackImageUrl}
              alt={`${currentTrack.name} album art`}
              className="w-full h-full rounded object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center';
              }}
            />
          </div>
          <div className="truncate">
            <div 
              className="text-sm font-medium truncate cursor-pointer hover:underline"
              onClick={() => setIsFullScreenOpen(true)}
            >
              {currentTrack.name}
            </div>
            <div className="flex items-center text-xs text-gray-400 truncate">
              {currentTrack.artistId ? (
                <Link to={`/artist-profile/${currentTrack.artistId}`} className="hover:text-white transition-colors">
                  {currentTrack.artistName}
                </Link>
              ) : (
                <span>{currentTrack.artistName}</span>
              )}
              
              {isArtistVerifiedState && (
                <BadgeCheck size={14} className="ml-1 text-blue-500" />
              )}
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="w-2/4 flex flex-col items-center">
          <div className="flex items-center mb-2">
            <button 
              onClick={playPreviousTrack} 
              className="mx-2 p-1 text-gray-300 hover:text-white transition-colors"
            >
              <SkipBack size={20} />
            </button>
            <button 
              onClick={togglePlayPause} 
              className="mx-2 p-2 bg-white rounded-full text-black hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button 
              onClick={playNextTrack} 
              className="mx-2 p-1 text-gray-300 hover:text-white transition-colors"
            >
              <SkipForward size={20} />
            </button>
          </div>
          
          <div className="w-full flex items-center">
            <span className="text-xs text-gray-400 w-10 text-right">{formatTime(progress)}</span>
            <Slider
              value={[progress]}
              max={duration || 100}
              step={0.1}
              className="mx-2 flex-1"
              onValueChange={(values) => seekToPosition(values[0])}
            />
            <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Volume Control & Full Screen Button */}
        <div className="w-1/4 flex justify-end items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullScreenOpen(true)}
            className="mr-2 text-gray-300 hover:text-white transition-colors"
          >
            <Maximize2 size={16} />
          </Button>
          <button 
            onClick={toggleMute}
            className="mr-2 text-gray-300 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <Slider 
            value={[volume * 100]}
            max={100}
            className="w-24"
            onValueChange={(values) => setVolumeLevel(values[0] / 100)}
          />
        </div>
      </div>

      {/* Full Screen Player */}
      <FullScreenPlayer 
        isOpen={isFullScreenOpen}
        onClose={() => setIsFullScreenOpen(false)}
      />
    </>
  );
};

export default Player;
