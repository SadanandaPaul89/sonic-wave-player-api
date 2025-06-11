
import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Mic2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatTime } from '@/utils/formatTime';
import { useIsMobile } from '@/hooks/use-mobile';
import LyricsDisplay from '@/components/LyricsDisplay';
import FullScreenPlayer from '@/components/FullScreenPlayer';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

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

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const isMobile = useIsMobile();

  if (!currentTrack) {
    return null;
  }

  const handleSeek = (value: number[]) => {
    seekToPosition(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolumeLevel(value[0] / 100);
  };

  const toggleMute = () => {
    setVolumeLevel(volume > 0 ? 0 : 0.7);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-spotify-elevated border-t border-gray-700 px-2 sm:px-4 py-2 z-40">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          {/* Track Info */}
          <div className={`flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 ${isMobile ? 'max-w-[120px]' : ''}`}>
            <div 
              className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-gray-600 rounded flex-shrink-0 cursor-pointer hover:scale-105 transition-transform`}
              onClick={() => setIsFullScreenOpen(true)}
            >
              <img
                src={currentTrack.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center'}
                alt={currentTrack.name}
                className="w-full h-full rounded object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div 
                className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium truncate cursor-pointer hover:underline`}
                onClick={() => setIsFullScreenOpen(true)}
              >
                {currentTrack.name}
              </div>
              <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 truncate`}>{currentTrack.artistName}</div>
            </div>
          </div>

          {/* Player Controls */}
          <div className={`flex flex-col items-center ${isMobile ? 'space-y-1' : 'space-y-2'} flex-1 max-w-md`}>
            <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "icon"}
                onClick={playPreviousTrack}
                className="text-gray-400 hover:text-white"
              >
                <SkipBack size={isMobile ? 16 : 20} />
              </Button>
              
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "icon"}
                onClick={togglePlayPause}
                className={`bg-white text-black hover:bg-gray-200 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-full`}
              >
                {isPlaying ? <Pause size={isMobile ? 16 : 20} /> : <Play size={isMobile ? 16 : 20} />}
              </Button>
              
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "icon"}
                onClick={playNextTrack}
                className="text-gray-400 hover:text-white"
              >
                <SkipForward size={isMobile ? 16 : 20} />
              </Button>
            </div>

            {/* Progress Bar - Desktop only in header */}
            {!isMobile && (
              <div className="flex items-center space-x-2 w-full">
                <span className="text-xs text-gray-400 w-10 text-right">
                  {formatTime(progress)}
                </span>
                <Slider
                  value={[progress]}
                  max={duration}
                  step={1}
                  onValueChange={handleSeek}
                  className="flex-1"
                />
                <span className="text-xs text-gray-400 w-10">
                  {formatTime(duration)}
                </span>
              </div>
            )}
          </div>

          {/* Volume, Lyrics, and Full Screen Controls */}
          <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'} flex-1 justify-end ${isMobile ? 'max-w-[80px]' : ''}`}>
            {!isMobile && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                  className="text-gray-400 hover:text-white relative"
                >
                  {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </Button>
                
                {showVolumeSlider && (
                  <div 
                    className="absolute bottom-full mb-2 right-20 bg-spotify-elevated border border-gray-600 rounded p-3 w-32"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <Slider
                      value={[volume * 100]}
                      max={100}
                      step={1}
                      onValueChange={handleVolumeChange}
                      orientation="horizontal"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Lyrics Button */}
            <Dialog open={isLyricsOpen} onOpenChange={setIsLyricsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size={isMobile ? "sm" : "icon"}
                  className="text-gray-400 hover:text-white"
                  title="Show Lyrics"
                >
                  <Mic2 size={isMobile ? 16 : 20} />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh]">
                <div className="h-96">
                  <LyricsDisplay
                    songId={currentTrack.id}
                    currentTime={progress}
                    isVisible={true}
                  />
                </div>
              </DialogContent>
            </Dialog>

            {/* Full Screen Button */}
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "icon"}
              onClick={() => setIsFullScreenOpen(true)}
              className="text-gray-400 hover:text-white"
              title="Full Screen Player"
            >
              <Maximize2 size={isMobile ? 16 : 20} />
            </Button>
          </div>
        </div>

        {/* Mobile Progress Bar */}
        {isMobile && (
          <div className="mt-2">
            <Slider
              value={[progress]}
              max={duration}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}
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
