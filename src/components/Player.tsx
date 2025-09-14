
import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Mic2, Maximize2, Repeat, Repeat1, Square, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatTime } from '@/utils/formatTime';
import { useIsMobile } from '@/hooks/use-mobile';
import LyricsDisplay from '@/components/LyricsDisplay';
import FullScreenPlayer from '@/components/FullScreenPlayer';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import ArtistNameWithBadge from "./ArtistNameWithBadge";

const Player: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    repeatMode,
    isShuffled,
    togglePlayPause,
    setVolumeLevel,
    seekToPosition,
    playNextTrack,
    playPreviousTrack,
    toggleRepeatMode,
    toggleShuffle,
    forceStop
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

  const getRepeatIcon = () => {
    if (repeatMode === 'one') {
      return <Repeat1 size={20} />;
    }
    return <Repeat size={20} />;
  };

  const getRepeatButtonClass = () => {
    if (repeatMode === 'off') {
      return 'text-white/70 hover:text-white';
    }
    return 'text-figma-purple hover:text-figma-purple-light';
  };

  const getShuffleButtonClass = () => {
    if (isShuffled) {
      return 'text-figma-purple hover:text-figma-purple-light';
    }
    return 'text-white/70 hover:text-white';
  };

  return (
    <>
      <div className="player-glass px-3 sm:px-4 py-2">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          {/* Track Info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Link
              to={`/artist/${currentTrack.artistId}`}
              className="w-12 h-12 bg-secondary rounded-md flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              tabIndex={0}
              aria-label={`Go to artist: ${currentTrack.artistName}`}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentTrack.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center'}
                alt={currentTrack.name}
                className="w-full h-full rounded-md object-cover"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="text-sm truncate text-white font-medium">
                {currentTrack.name}
              </div>
              <div className="text-xs text-white/70 truncate">
                <ArtistNameWithBadge
                  artistId={currentTrack.artistId}
                  artistName={currentTrack.artistName}
                  className="hover:underline text-muted-foreground"
                  linkToProfile
                />
              </div>
            </div>
          </div>

          {isMobile ? (
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="default"
                size="icon"
                onClick={togglePlayPause}
                className="w-11 h-11 rounded-full flex-shrink-0 btn-purple"
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullScreenOpen(true)}
                className="text-white/70 hover:text-white"
                title="Full Screen Player"
              >
                <Maximize2 size={22} />
              </Button>
            </div>
          ) : (
            <>
              {/* Player Controls */}
              <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="icon" onClick={toggleShuffle} className={getShuffleButtonClass()} title={`Shuffle: ${isShuffled ? 'On' : 'Off'}`}>
                    <Shuffle size={20} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={playPreviousTrack} className="text-white/70 hover:text-white">
                    <SkipBack size={20} />
                  </Button>
                  <Button variant="default" size="icon" onClick={togglePlayPause} className="w-10 h-10 rounded-full btn-purple">
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={forceStop} className="text-white/70 hover:text-red-400" title="Stop playback completely">
                    <Square size={18} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={playNextTrack} className="text-white/70 hover:text-white">
                    <SkipForward size={20} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={toggleRepeatMode} className={getRepeatButtonClass()} title={`Repeat: ${repeatMode}`}>
                    {getRepeatIcon()}
                  </Button>
                </div>

                <div className="flex items-center space-x-2 w-full">
                  <span className="text-xs text-white/70 w-10 text-right">
                    {formatTime(progress)}
                  </span>
                  <Slider value={[progress]} max={duration} step={1} onValueChange={handleSeek} className="flex-1" />
                  <span className="text-xs text-white/70 w-10">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Volume, Lyrics, and Full Screen Controls */}
              <div className="flex items-center space-x-2 flex-1 justify-end">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                    className="text-muted-foreground hover:text-foreground relative"
                  >
                    {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </Button>
                  
                  {showVolumeSlider && (
                    <div 
                      className="absolute bottom-full mb-2 right-20 bg-popover border border-border rounded p-3 w-32 shadow-lg"
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                      <Slider value={[volume * 100]} max={100} step={1} onValueChange={handleVolumeChange} orientation="horizontal" />
                    </div>
                  )}
                </div>

                <Dialog open={isLyricsOpen} onOpenChange={setIsLyricsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Show Lyrics">
                      <Mic2 size={20} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh]">
                    <div className="h-96">
                      <LyricsDisplay key={currentTrack?.id} songId={currentTrack.id} currentTime={progress} isVisible={true} />
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="ghost" size="icon" onClick={() => setIsFullScreenOpen(true)} className="text-muted-foreground hover:text-foreground" title="Full Screen Player">
                  <Maximize2 size={20} />
                </Button>
              </div>
            </>
          )}
        </div>

        {isMobile && (
          <div className="mt-2">
            <Slider
              value={[progress]}
              max={duration}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}
      </div>

      <FullScreenPlayer
        isOpen={isFullScreenOpen}
        onClose={() => setIsFullScreenOpen(false)}
      />
    </>
  );
};

export default Player;
