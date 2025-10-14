/**
 * Sonic Wave Music Player
 * Advanced music player with full library integration and album art support
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Repeat,
  Shuffle,
  Heart,
  Share2,
  MoreHorizontal,
  Music
} from 'lucide-react';

import { SonicWaveTrack, sonicWaveMusicLibrary } from '@/services/sonicWaveMusicLibrary';

interface SonicWavePlayerProps {
  track?: SonicWaveTrack;
  playlist?: SonicWaveTrack[];
  autoPlay?: boolean;
  onTrackChange?: (track: SonicWaveTrack) => void;
  className?: string;
}

const SonicWavePlayer: React.FC<SonicWavePlayerProps> = ({
  track,
  playlist = [],
  autoPlay = false,
  onTrackChange,
  className = ''
}) => {
  // Audio state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  // Player state
  const [currentTrack, setCurrentTrack] = useState<SonicWaveTrack | undefined>(track);
  const [currentPlaylist, setCurrentPlaylist] = useState<SonicWaveTrack[]>(playlist);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // UI state
  const [isLiked, setIsLiked] = useState(false);

  // Update current track when prop changes
  useEffect(() => {
    if (track && track !== currentTrack) {
      setCurrentTrack(track);
      setCurrentIndex(0);
    }
  }, [track]);

  // Update playlist when prop changes
  useEffect(() => {
    if (playlist.length > 0) {
      setCurrentPlaylist(playlist);
      if (!currentTrack && playlist[0]) {
        setCurrentTrack(playlist[0]);
        setCurrentIndex(0);
      }
    }
  }, [playlist]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      handleNext();
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      if (autoPlay) {
        handlePlay();
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentTrack, autoPlay]);

  // Update audio source when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentTrack) {
      audio.src = currentTrack.audioFile.url;
      audio.volume = volume;
      setCurrentTime(0);
      
      // Increment play count
      sonicWaveMusicLibrary.incrementPlayCount(currentTrack.id);
      
      // Notify parent component
      onTrackChange?.(currentTrack);
    }
  }, [currentTrack, volume, onTrackChange]);

  const handlePlay = async () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const handlePause = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      const newTime = (value[0] / 100) * duration;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const handleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isMuted) {
        audio.volume = volume;
        setIsMuted(false);
      } else {
        audio.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleNext = () => {
    if (currentPlaylist.length === 0) return;

    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * currentPlaylist.length);
    } else if (isRepeat && currentIndex === currentPlaylist.length - 1) {
      nextIndex = 0;
    } else {
      nextIndex = currentIndex + 1;
    }

    if (nextIndex < currentPlaylist.length) {
      setCurrentIndex(nextIndex);
      setCurrentTrack(currentPlaylist[nextIndex]);
    } else if (isRepeat) {
      setCurrentIndex(0);
      setCurrentTrack(currentPlaylist[0]);
    }
  };

  const handlePrevious = () => {
    if (currentPlaylist.length === 0) return;

    let prevIndex;
    if (currentIndex === 0) {
      prevIndex = isRepeat ? currentPlaylist.length - 1 : 0;
    } else {
      prevIndex = currentIndex - 1;
    }

    setCurrentIndex(prevIndex);
    setCurrentTrack(currentPlaylist[prevIndex]);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentTrack) {
    return (
      <Card className={`glass-card border-figma-glass-border ${className}`}>
        <CardContent className="p-6 text-center">
          <Music className="h-12 w-12 text-white/40 mx-auto mb-4" />
          <p className="text-white/60">No track selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-card border-figma-glass-border ${className}`}>
      <CardContent className="p-6">
        <audio ref={audioRef} preload="metadata" />
        
        <div className="flex items-center gap-4">
          {/* Album Art */}
          <div className="flex-shrink-0">
            {currentTrack.artworkFile ? (
              <img
                src={currentTrack.artworkFile.url}
                alt={`${currentTrack.title} artwork`}
                className="w-16 h-16 object-cover rounded border border-white/20"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIGZpbGw9IiM2NjYiLz4KPC9zdmc+';
                }}
              />
            ) : (
              <div className="w-16 h-16 bg-white/10 rounded border border-white/20 flex items-center justify-center">
                <Music className="h-6 w-6 text-white/40" />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{currentTrack.title}</h3>
            <p className="text-white/60 text-sm truncate">{currentTrack.artist}</p>
            {currentTrack.album && (
              <p className="text-white/40 text-xs truncate">{currentTrack.album}</p>
            )}
            
            {/* Tags */}
            {currentTrack.tags.length > 0 && (
              <div className="flex gap-1 mt-1">
                {currentTrack.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsLiked(!isLiked)}
              className="text-white/60"
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-white text-white' : ''}`} />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className="text-white/60"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className="text-white/60"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <Slider
            value={[progressPercentage]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-white/60">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsShuffle(!isShuffle)}
              className={`text-white/60 ${isShuffle ? 'text-white' : ''}`}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsRepeat(!isRepeat)}
              className={`text-white/60 ${isRepeat ? 'text-white' : ''}`}
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </div>

          {/* Center Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentPlaylist.length === 0}
              className="text-white/60"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              onClick={handlePlayPause}
              disabled={isLoading}
              className="bg-white text-black"
            >
              {isLoading ? (
                <div className="w-4 h-4 bg-gray-400 rounded-full" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleNext}
              disabled={currentPlaylist.length === 0}
              className="text-white/60"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Right Controls - Volume */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleMute}
              className="text-white/60"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>

            <div className="w-20">
              <Slider
                value={[volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-20"
              />
            </div>
          </div>
        </div>

        {/* Play Count */}
        {currentTrack.playCount > 0 && (
          <div className="mt-2 text-center">
            <span className="text-xs text-white/40">
              Played {currentTrack.playCount} time{currentTrack.playCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SonicWavePlayer;