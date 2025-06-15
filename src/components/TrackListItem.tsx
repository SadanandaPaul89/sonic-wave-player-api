
import React from 'react';
import { Track } from '@/services/supabaseService';
import { formatTime } from '@/utils/formatTime';
import { Play, Pause, Heart, Headphones, MoreHorizontal, Share } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import ArtistNameWithBadge from "./ArtistNameWithBadge";

interface TrackListItemProps {
  track: Track;
  index: number;
  isCurrentTrack: boolean;
  isCurrentPlaying: boolean;
  isLiked: boolean;
  isAuthenticated: boolean;
  showAlbum: boolean;
  onPlayClick: (track: Track) => void;
  onLikeClick: (track: Track, e: React.MouseEvent) => void;
  onShareClick: (track: Track, e: React.MouseEvent) => void;
}

const TrackListItem: React.FC<TrackListItemProps> = ({
  track,
  index,
  isCurrentTrack,
  isCurrentPlaying,
  isLiked,
  isAuthenticated,
  showAlbum,
  onPlayClick,
  onLikeClick,
  onShareClick
}) => {
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

  const trackImageUrl = getTrackImage(track);

  return (
    <div 
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
            onClick={() => onPlayClick(track)}
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
            onClick={(e) => onLikeClick(track, e)}
          />
          <span>{track.like_count || 0}</span>
          <Headphones size={15} className="ml-2" />
          <span>{track.play_count || 0}</span>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto text-gray-400 hover:text-white"
            onClick={(e) => onShareClick(track, e)}
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
            onClick={(e) => onLikeClick(track, e)}
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
              onClick={(e) => onShareClick(track, e)}
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
};

export default TrackListItem;
