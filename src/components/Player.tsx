
import React, { useState, useEffect } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatTime } from '@/utils/formatTime';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

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
  
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

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

  if (!currentTrack) {
    return (
      <div className="h-20 border-t border-spotify-highlight bg-spotify-elevated px-4 flex items-center justify-center text-gray-400">
        No track selected
      </div>
    );
  }

  return (
    <div className="h-20 border-t border-spotify-highlight bg-spotify-elevated px-4 flex items-center">
      {/* Track Info */}
      <div className="w-1/4 flex items-center">
        <div className="w-14 h-14 bg-gray-600 mr-3 rounded flex-shrink-0">
          {currentTrack.albumId && (
            <img
              src={`https://api.napster.com/imageserver/v2/albums/${currentTrack.albumId}/images/70x70.jpg`}
              alt={currentTrack.albumName}
              className="w-full h-full rounded object-cover"
            />
          )}
        </div>
        <div className="truncate">
          <div className="text-sm font-medium truncate">{currentTrack.name}</div>
          <div className="text-xs text-gray-400 truncate">{currentTrack.artistName}</div>
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
      
      {/* Volume Control */}
      <div className="w-1/4 flex justify-end items-center">
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
  );
};

export default Player;
