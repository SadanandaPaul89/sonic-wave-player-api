import React from 'react';
import { Track } from '@/services/supabaseService';
import { formatTime } from '@/utils/formatTime';
import { Play, Pause, Heart, Headphones, MoreHorizontal, Share, Globe, Zap } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ArtistNameWithBadge from "./ArtistNameWithBadge";
import { motion } from 'framer-motion';

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
    <motion.div 
      className={`group card-hover-container ${
        isCurrentTrack ? 'text-figma-purple' : 'text-white/80'
      } sm:grid sm:grid-cols-12 sm:gap-4 
        px-2 py-[10px] sm:px-4 sm:py-2 
        hover:bg-white/10 rounded-figma-md 
        flex flex-col mb-2 sm:mb-0 cursor-pointer transition-all duration-300`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.02, 
        x: 4,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Row 1: Index/Play, Title/Artist */}
      <div className="flex items-center gap-3 sm:col-span-5">
        <div className="w-6 flex-shrink-0 flex items-center justify-center relative">
          <motion.span 
            className={`group-hover:hidden ${isCurrentTrack ? 'text-figma-purple' : 'text-white/60'} text-sm sm:text-base`}
            initial={{ opacity: 1 }}
            whileHover={{ opacity: 0 }}
          >
            {index + 1}
          </motion.span>
          <motion.button 
            className="hidden group-hover:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            onClick={() => onPlayClick(track)}
            initial={{ opacity: 0, scale: 0 }}
            whileHover={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            {isCurrentPlaying ? 
              <Pause size={16} className="text-white" /> : 
              <Play size={16} className="text-white" />
            }
          </motion.button>
        </div>
        <div className="flex items-center gap-2 truncate sm:w-auto w-full">
          <motion.div 
            className="w-10 h-10 bg-white/10 rounded flex-shrink-0 overflow-hidden"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={trackImageUrl}
              alt={`${track.name} album art`}
              className="album-art w-full h-full rounded object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center';
              }}
            />
          </motion.div>
          <div className="truncate flex flex-col">
            <div className="flex items-center gap-2">
              <motion.span 
                className="font-medium truncate text-base sm:text-lg cursor-pointer hover:underline text-white group-hover:text-white"
                onClick={() => onPlayClick(track)}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                {track.name}
              </motion.span>
              {/* IPFS Indicator - Show for ALL tracks */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Badge variant="secondary" className="bg-figma-purple/20 text-figma-purple text-xs px-1.5 py-0.5">
                  <Globe size={8} className="mr-1" />
                  IPFS
                </Badge>
              </motion.div>
              {/* NFT Indicator */}
              {(track as any).nft && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 text-xs px-1.5 py-0.5">
                    <Zap size={8} className="mr-1" />
                    NFT
                  </Badge>
                </motion.div>
              )}
            </div>
            {/* Artist name - always below track name on mobile */}
            <span className="text-xs sm:text-sm text-white/60 truncate font-normal group-hover:text-white/80">
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
        <div className="hidden sm:flex sm:col-span-3 items-center text-sm text-muted-foreground truncate">
          {track.albumName}
        </div>
      )}

      {/* Stats & Album - mobile (show below title/artist, not right of them) */}
      <div className="flex sm:hidden gap-3 items-center mt-1 ml-9 text-xs text-muted-foreground">
        {showAlbum && (
          <span className="truncate">{track.albumName}</span>
        )}
        {/* divider */}
        {(showAlbum) && <span className="text-muted-foreground/50">·</span>}
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart 
              size={15} 
              className={`cursor-pointer transition-colors align-middle ${
                isLiked ? 'text-red-500 fill-current' : 'hover:text-red-400'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => onLikeClick(track, e)}
            />
          </motion.div>
          <span>{track.like_count || 0}</span>
          <Headphones size={15} className="ml-2" />
          <span>{track.play_count || 0}</span>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto text-muted-foreground hover:text-foreground"
              onClick={(e) => onShareClick(track, e)}
            >
              <MoreHorizontal size={14} />
            </Button>
          </motion.div>
        </div>
        {/* Duration right-most for mobile */}
        <span className="ml-auto text-xs text-muted-foreground min-w-[40px] text-right">{formatTime(track.duration)}</span>
      </div>

      {/* Row 2: Desktop only stats */}
      <div className="hidden sm:flex sm:col-span-2 items-center justify-center gap-4 text-xs text-muted-foreground">
        <motion.div 
          className="flex items-center gap-1"
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart 
              size={14} 
              className={`cursor-pointer transition-colors ${
                isLiked ? 'text-red-500 fill-current' : 'hover:text-red-400'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => onLikeClick(track, e)}
            />
          </motion.div>
          <span>{(track as any).like_count || 0}</span>
        </motion.div>
        <motion.div 
          className="flex items-center gap-1"
          whileHover={{ scale: 1.05 }}
        >
          <Headphones size={14} />
          <span>{(track as any).play_count || 0}</span>
        </motion.div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover border-border">
            <DropdownMenuItem
              onClick={(e) => onShareClick(track, e)}
              className="cursor-pointer hover:bg-muted"
            >
              <Share size={14} className="mr-2" />
              Share
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Row 3: Desktop only duration */}
      <div className="hidden sm:flex sm:col-span-2 items-center justify-end text-sm text-muted-foreground">
        {formatTime(track.duration)}
      </div>
    </motion.div>
  );
};

export default TrackListItem;
