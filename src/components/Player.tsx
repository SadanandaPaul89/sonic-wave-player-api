
import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Mic2, Maximize2, Repeat, Repeat1, Square, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatTime } from '@/utils/formatTime';
import { useIsMobile } from '@/hooks/use-mobile';
import LyricsDisplay from '@/components/LyricsDisplay';
import FullScreenPlayer from '@/components/FullScreenPlayer';
import IPFSStatusIndicator from '@/components/IPFSStatusIndicator';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import ArtistNameWithBadge from "./ArtistNameWithBadge";
import { motion, AnimatePresence } from 'framer-motion';
import AnimationWrapper from '@/components/AnimationWrapper';

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
      <div className="player-glass px-3 sm:px-4 py-2 border-t border-white/10">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          {/* Track Info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Link
              to={`/artist/${currentTrack.artistId}`}
              className="w-12 h-12 bg-secondary rounded-figma-md flex-shrink-0 cursor-pointer overflow-hidden group hover:opacity-80 transition-opacity duration-200"
              tabIndex={0}
              aria-label={`Go to artist: ${currentTrack.artistName}`}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentTrack.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center'}
                alt={currentTrack.name}
                className="w-full h-full object-cover"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="text-sm truncate text-white font-medium hover:text-figma-purple transition-colors cursor-pointer">
                {currentTrack.name}
              </div>
              <div className="text-xs text-white/70 truncate">
                <ArtistNameWithBadge
                  artistId={currentTrack.artistId}
                  artistName={currentTrack.artistName}
                  className="hover:underline hover:text-white transition-colors"
                  linkToProfile
                />
              </div>
              {/* IPFS Status Indicator */}
              <IPFSStatusIndicator track={currentTrack} className="mt-1" />
            </div>
          </div>

          {isMobile ? (
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="default"
                size="icon"
                onClick={togglePlayPause}
                className="w-11 h-11 rounded-full flex-shrink-0 bg-figma-purple hover:bg-figma-purple/80 transition-colors duration-200"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isPlaying ? 'pause' : 'play'}
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                  </motion.div>
                </AnimatePresence>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullScreenOpen(true)}
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-figma-md transition-colors duration-200"
                title="Full Screen Player"
              >
                <Maximize2 size={20} />
              </Button>
            </div>
          ) : (
            <>
              {/* Player Controls */}
              <div className="flex flex-col items-center space-y-2 flex-1 max-w-md">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleShuffle} 
                    className={`${getShuffleButtonClass()} hover:bg-white/10 rounded-figma-sm transition-colors duration-200`} 
                    title={`Shuffle: ${isShuffled ? 'On' : 'Off'}`}
                  >
                    <Shuffle size={18} />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={playPreviousTrack} 
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-figma-sm transition-colors duration-200"
                  >
                    <SkipBack size={18} />
                  </Button>
                  
                  <Button 
                    variant="default" 
                    size="icon" 
                    onClick={togglePlayPause} 
                    className="w-10 h-10 rounded-full bg-figma-purple hover:bg-figma-purple/80 transition-colors duration-200"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isPlaying ? 'pause' : 'play'}
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                      </motion.div>
                    </AnimatePresence>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={forceStop} 
                    className="text-white/70 hover:text-red-400 hover:bg-red-500/10 rounded-figma-sm transition-colors duration-200" 
                    title="Stop playback completely"
                  >
                    <Square size={16} />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={playNextTrack} 
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-figma-sm transition-colors duration-200"
                  >
                    <SkipForward size={18} />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleRepeatMode} 
                    className={`${getRepeatButtonClass()} hover:bg-white/10 rounded-figma-sm transition-colors duration-200`} 
                    title={`Repeat: ${repeatMode}`}
                  >
                    {getRepeatIcon()}
                  </Button>
                </div>

                <div className="flex items-center space-x-2 w-full">
                  <span className="text-xs text-white/70 w-10 text-right">
                    {formatTime(progress)}
                  </span>
                  <Slider 
                    value={[progress]} 
                    max={duration} 
                    step={1} 
                    onValueChange={handleSeek} 
                    className="flex-1" 
                  />
                  <span className="text-xs text-white/70 w-10">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Volume, Lyrics, and Full Screen Controls */}
              <div className="flex items-center space-x-2 flex-1 justify-end">
                <div className="flex items-center space-x-2 relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-figma-sm transition-colors duration-200"
                  >
                    {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </Button>
                  
                  <AnimatePresence>
                    {showVolumeSlider && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full mb-2 right-0 bg-black/80 backdrop-blur-md border border-white/20 rounded-figma-md p-3 w-32 shadow-xl"
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
                        <div className="text-center text-xs text-white/60 mt-2">
                          {Math.round(volume * 100)}%
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Dialog open={isLyricsOpen} onOpenChange={setIsLyricsOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white/70 hover:text-white hover:bg-white/10 rounded-figma-sm transition-colors duration-200" 
                      title="Show Lyrics"
                    >
                      <Mic2 size={18} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] bg-black/90 backdrop-blur-md border-white/20">
                    <div className="h-96">
                      <LyricsDisplay key={currentTrack?.id} songId={currentTrack.id} currentTime={progress} isVisible={true} />
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsFullScreenOpen(true)} 
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-figma-sm transition-colors duration-200" 
                  title="Full Screen Player"
                >
                  <Maximize2 size={18} />
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
            <div className="flex justify-between text-xs text-white/70 mt-1">
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
