
import React, { useState, useEffect } from 'react';
import { Track } from '@/services/supabaseService';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatTime } from '@/utils/formatTime';
import { Play, Pause, Music, Heart, Headphones, MoreHorizontal, Share } from 'lucide-react';
import { toggleSongLike, getSongLikeStatus } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import ShareModal from './ShareModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import ArtistNameWithBadge from "./ArtistNameWithBadge";

interface TrackListProps {
  tracks: Track[];
  showHeader?: boolean;
  showAlbum?: boolean;
}

const TrackList: React.FC<TrackListProps> = ({ 
  tracks, 
  showHeader = true,
  showAlbum = true
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayer();
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  // Load liked status for all tracks
  useEffect(() => {
    const loadLikedStatus = async () => {
      if (!isAuthenticated) return;
      
      const likedSet = new Set<string>();
      for (const track of tracks) {
        const isLiked = await getSongLikeStatus(track.id);
        if (isLiked) {
          likedSet.add(track.id);
        }
      }
      setLikedTracks(likedSet);
    };
    
    loadLikedStatus();
  }, [tracks, isAuthenticated]);

  const handlePlayClick = (track: Track) => {
    if (currentTrack && currentTrack.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  const handleLikeClick = async (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      console.log('User must be logged in to like songs');
      return;
    }
    
    const isNowLiked = await toggleSongLike(track.id);
    
    setLikedTracks(prev => {
      const newSet = new Set(prev);
      if (isNowLiked) {
        newSet.add(track.id);
      } else {
        newSet.delete(track.id);
      }
      return newSet;
    });
  };

  const handleShareClick = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrack(track);
    setShareModalOpen(true);
  };

  // Function to get the correct track image (prioritize album art)
  const getTrackImage = (track: Track): string => {
    // Always prioritize track's own image (album art)
    if (track.image && 
        !track.image.includes('default-artist') && 
        track.image !== 'https://cdn.jamendo.com/default/default-artist_200.jpg') {
      return track.image;
    }
    
    // Fallback to default placeholder (NOT artist image)
    return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center';
  };

  if (!tracks || tracks.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 text-gray-400">
        <Music size={64} className="mb-4" />
        <h3 className="text-xl font-medium mb-2">No tracks available</h3>
        <p>Try searching for something else or check back later.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {showHeader && (
        // Desktop/tablet headers
        <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 border-b border-spotify-highlight text-gray-400 text-sm">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4">TITLE</div>
          {showAlbum && <div className="col-span-3">ALBUM</div>}
          <div className="col-span-2 text-center">STATS</div>
          <div className="col-span-2 text-right">DURATION</div>
        </div>
      )}
      {/* Add bottom padding to prevent mini player from covering last track */}
      <div className="mt-2 pb-24 sm:pb-28">
        {tracks.map((track, index) => {
          const isCurrentTrack = currentTrack && currentTrack.id === track.id;
          const isCurrentPlaying = isCurrentTrack && isPlaying;
          const trackImageUrl = getTrackImage(track);
          const isLiked = likedTracks.has(track.id);

          return (
            // Mobile: flex-col, Desktop: grid
            <div 
              key={track.id}
              className={`group ${
                isCurrentTrack ? 'text-spotify-green' : 'text-gray-300'
              } sm:grid sm:grid-cols-12 sm:gap-4 
                px-2 py-[10px] sm:px-4 sm:py-2 
                hover:bg-spotify-highlight rounded-md 
                flex flex-col mb-2 sm:mb-0`}
            >

              {/* Row 1: Index/Play, Title/Artist */}
              <div className="flex items-center gap-3 sm:col-span-5">
                <div className="w-6 flex-shrink-0 flex items-center justify-center relative">
                  <span className={`group-hover:hidden ${isCurrentTrack ? 'text-spotify-green' : 'text-gray-400'} text-sm sm:text-base`}>
                    {index + 1}
                  </span>
                  <button 
                    className="hidden group-hover:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    onClick={() => handlePlayClick(track)}
                  >
                    {isCurrentPlaying ? 
                      <Pause size={16} className="text-white" /> : 
                      <Play size={16} className="text-white" />
                    }
                  </button>
                </div>
                <div className="flex items-center gap-2 truncate sm:w-auto w-full">
                  <div className="w-10 h-10 bg-gray-600 rounded flex-shrink-0">
                    <img
                      src={trackImageUrl}
                      alt={`${track.name} album art`}
                      className="w-full h-full rounded object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center';
                      }}
                    />
                  </div>
                  <div className="truncate flex flex-col">
                    <span className="font-medium truncate text-base sm:text-lg">{track.name}</span>
                    {/* Artist name - always below track name on mobile */}
                    <span className="text-xs sm:text-sm text-gray-400 truncate font-normal">
                      <ArtistNameWithBadge
                        artistId={track.artistId}
                        artistName={track.artistName}
                        className="hover:underline"
                        linkToProfile
                      />
                    </span>
                  </div>
                </div>
              </div>

              {/* Album - desktop only */}
              {showAlbum && (
                <div className="hidden sm:flex sm:col-span-3 items-center text-sm text-gray-400 truncate">
                  {track.albumName}
                </div>
              )}

              {/* Stats & Album - mobile (show below title/artist, not right of them) */}
              <div className="flex sm:hidden gap-3 items-center mt-1 ml-9 text-xs text-gray-400">
                {showAlbum && (
                  <span className="truncate">{track.albumName}</span>
                )}
                {/* divider */}
                {(showAlbum) && <span className="text-gray-500">·</span>}
                <div className="flex items-center gap-2">
                  <Heart 
                    size={15} 
                    className={`cursor-pointer transition-colors align-middle ${
                      isLiked ? 'text-red-500 fill-current' : 'hover:text-red-400'
                    } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={(e) => handleLikeClick(track, e)}
                  />
                  <span>{track.like_count || 0}</span>
                  <Headphones size={15} className="ml-2" />
                  <span>{track.play_count || 0}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto text-gray-400 hover:text-white"
                    onClick={(e) => handleShareClick(track, e)}
                  >
                    <MoreHorizontal size={14} />
                  </Button>
                </div>
                {/* Duration right-most for mobile */}
                <span className="ml-auto text-xs text-gray-400 min-w-[40px] text-right">{formatTime(track.duration)}</span>
              </div>

              {/* Row 2: Desktop only stats */}
              <div className="hidden sm:flex sm:col-span-2 items-center justify-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Heart 
                    size={14} 
                    className={`cursor-pointer transition-colors ${
                      isLiked ? 'text-red-500 fill-current' : 'hover:text-red-400'
                    } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={(e) => handleLikeClick(track, e)}
                  />
                  <span>{track.like_count || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Headphones size={14} />
                  <span>{track.play_count || 0}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-spotify-elevated border-gray-600">
                    <DropdownMenuItem
                      onClick={(e) => handleShareClick(track, e)}
                      className="cursor-pointer hover:bg-spotify-highlight text-white"
                    >
                      <Share size={14} className="mr-2" />
                      Share
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Row 3: Desktop only duration */}
              <div className="hidden sm:flex sm:col-span-2 items-center justify-end text-sm text-gray-400">
                {formatTime(track.duration)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Modal */}
      {selectedTrack && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedTrack(null);
          }}
          track={selectedTrack}
        />
      )}
    </div>
  );
};

export default TrackList;
