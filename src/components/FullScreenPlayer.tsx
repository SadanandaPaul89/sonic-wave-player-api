
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
import { isArtistVerified, getLyricsBySongId, toggleSongLike, getSongLikeStatus } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
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
  const [isLiked, setIsLiked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  // Check if artist is verified, load lyrics, and check like status
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

        // Check if current track is liked
        if (isAuthenticated) {
          const likeStatus = await getSongLikeStatus(currentTrack.id);
          setIsLiked(likeStatus);
        }
      };
      
      checkVerificationAndLoadLyrics();
    } else {
      setIsArtistVerifiedState(false);
      setLyrics([]);
      setIsLiked(false);
    }
  }, [currentTrack, isAuthenticated]);

  // Handle like toggle
  const handleLikeToggle = async () => {
    if (!currentTrack || !isAuthenticated) {
      console.log('User must be logged in to like songs');
      return;
    }
    
    const newLikeStatus = await toggleSongLike(currentTrack.id);
    setIsLiked(newLikeStatus);
  };

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
    <div className="fixed inset-0 z-50 text-white overflow-hidden">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0">
        {/* Base gradient that changes with play state */}
        <div 
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            isPlaying 
              ? 'bg-gradient-to-br from-purple-600 via-pink-500 to-indigo-700' 
              : 'bg-gradient-to-br from-purple-800 via-purple-900 to-black'
          }`}
        />
        
        {/* Animated gradient orbs */}
        <div 
          className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30 blur-3xl transition-all duration-2000 ${
            isPlaying ? 'animate-pulse bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-purple-500'
          }`}
          style={{
            animation: isPlaying ? 'float 6s ease-in-out infinite' : 'none',
            transform: `translate(${Math.sin(progress / 10) * 50}px, ${Math.cos(progress / 15) * 30}px)`
          }}
        />
        
        <div 
          className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl transition-all duration-3000 ${
            isPlaying ? 'bg-gradient-to-r from-pink-400 to-red-500' : 'bg-indigo-500'
          }`}
          style={{
            animation: isPlaying ? 'float 8s ease-in-out infinite reverse' : 'none',
            transform: `translate(${Math.cos(progress / 12) * 40}px, ${Math.sin(progress / 18) * 35}px)`
          }}
        />
        
        <div 
          className={`absolute top-3/4 left-1/2 w-64 h-64 rounded-full opacity-25 blur-2xl transition-all duration-4000 ${
            isPlaying ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-purple-600'
          }`}
          style={{
            animation: isPlaying ? 'float 10s ease-in-out infinite' : 'none',
            transform: `translate(${Math.sin(progress / 8) * 60}px, ${Math.cos(progress / 20) * 25}px)`
          }}
        />
        
        {/* Progress-based overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
          style={{
            opacity: 0.3 + (progress / duration) * 0.2
          }}
        />
        
        {/* Subtle noise texture */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content with backdrop blur for better readability */}
      <div className="relative z-10 h-full backdrop-blur-sm bg-black/10">
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
            <div className="w-80 h-80 max-w-[80vw] max-h-[40vh] bg-gray-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm bg-white/5 border border-white/10">
              <img
                src={currentTrack.image || 'https://cdn.jamendo.com/default/default-track_200.jpg'}
                alt={currentTrack.albumName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Track Info - Reduced margins */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold mb-2 truncate drop-shadow-lg">{currentTrack.name}</h1>
            <div className="flex items-center justify-center text-xl text-gray-200 mb-2">
              <span className="truncate">{currentTrack.artistName}</span>
              {isArtistVerifiedState && (
                <BadgeCheck size={20} className="ml-2 text-blue-400" />
              )}
            </div>
            
            {/* Action Buttons - Reduced margin */}
            <div className="flex items-center justify-center space-x-8 mb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLikeToggle}
                className={`text-white hover:bg-white/10 backdrop-blur-sm ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!isAuthenticated}
              >
                <Heart 
                  size={24} 
                  className={isLiked ? 'text-red-500 fill-current' : ''} 
                />
              </Button>
              {isArtistVerifiedState && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={openLyricsEditor}
                  className="text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  <Edit size={24} />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 backdrop-blur-sm">
                <MoreHorizontal size={24} />
              </Button>
            </div>
          </div>

          {/* Lyrics Section - Reduced height and margin */}
          <div className="mb-4 text-center min-h-[80px] flex flex-col justify-center backdrop-blur-sm bg-black/20 rounded-lg p-4">
            {isLoadingLyrics ? (
              <div className="text-xl text-gray-300">Loading lyrics...</div>
            ) : lyrics.length > 0 ? (
              <>
                <div className="text-2xl font-semibold mb-2 drop-shadow-lg">
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
              <div className="text-xl text-gray-300">♪ No lyrics available ♪</div>
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
            <div className="flex justify-between text-sm text-gray-300">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls - Moved up with reduced margin */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 backdrop-blur-sm">
              <Shuffle size={20} />
            </Button>
            
            <div className="flex items-center space-x-6">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handlePreviousTrack}
                className="text-white hover:bg-white/10 backdrop-blur-sm"
              >
                <SkipBack size={28} />
              </Button>
              
              {/* Main Play/Pause Button */}
              <button 
                onClick={handlePlayPause}
                className="w-16 h-16 bg-white text-black rounded-full hover:scale-105 transition-transform flex items-center justify-center backdrop-blur-sm shadow-2xl"
                type="button"
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
              </button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleNextTrack}
                className="text-white hover:bg-white/10 backdrop-blur-sm"
              >
                <SkipForward size={28} />
              </Button>
            </div>
            
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 backdrop-blur-sm">
              <Repeat size={20} />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleMute}
              className="text-white hover:bg-white/10 backdrop-blur-sm"
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
