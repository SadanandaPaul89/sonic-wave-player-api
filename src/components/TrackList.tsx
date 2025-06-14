
import React, { useState } from 'react';
import { Play, Pause, MoreHorizontal, Heart, Share } from 'lucide-react';
import { Track } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatTime } from '@/utils/formatTime';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ShareModal from '@/components/ShareModal';

interface TrackListProps {
  tracks: Track[];
  showArtist?: boolean;
  showAlbum?: boolean;
}

const TrackList: React.FC<TrackListProps> = ({ tracks, showArtist = true, showAlbum = true }) => {
  const { currentTrack, isPlaying, playTrack, togglePlayPause, addToQueue } = usePlayer();
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [shareTrack, setShareTrack] = useState<Track | null>(null);

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  const isCurrentTrackPlaying = (track: Track) => {
    return currentTrack?.id === track.id && isPlaying;
  };

  const isCurrentTrack = (track: Track) => {
    return currentTrack?.id === track.id;
  };

  return (
    <>
      <div className="space-y-1">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className={`group flex items-center space-x-4 p-2 rounded-md hover:bg-spotify-highlight transition-colors ${
              isCurrentTrack(track) ? 'bg-spotify-highlight/50' : ''
            }`}
            onMouseEnter={() => setHoveredTrack(track.id)}
            onMouseLeave={() => setHoveredTrack(null)}
          >
            {/* Track Number / Play Button */}
            <div className="w-8 flex items-center justify-center">
              {hoveredTrack === track.id || isCurrentTrack(track) ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePlayTrack(track)}
                  className="w-8 h-8 p-0 text-white hover:bg-white/10"
                >
                  {isCurrentTrackPlaying(track) ? (
                    <Pause size={16} />
                  ) : (
                    <Play size={16} />
                  )}
                </Button>
              ) : (
                <span className="text-sm text-gray-400">{index + 1}</span>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                {/* Album Art */}
                <img
                  src={track.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center'}
                  alt={track.name}
                  className="w-10 h-10 rounded object-cover"
                />
                
                {/* Track Details */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium truncate cursor-pointer hover:underline ${
                      isCurrentTrack(track) ? 'text-spotify-green' : 'text-white'
                    }`}
                    onClick={() => handlePlayTrack(track)}
                  >
                    {track.name}
                  </div>
                  {showArtist && (
                    <div className="text-xs text-gray-400 truncate">
                      {track.artistName}
                      {showAlbum && track.albumName && ` • ${track.albumName}`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
              >
                <Heart size={16} />
              </Button>
              
              <span className="text-xs text-gray-400 w-12 text-right">
                {formatTime(track.duration)}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
                  >
                    <MoreHorizontal size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-spotify-elevated border-gray-700">
                  <DropdownMenuItem
                    onClick={() => addToQueue(track)}
                    className="text-white hover:bg-spotify-highlight"
                  >
                    Add to queue
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShareTrack(track)}
                    className="text-white hover:bg-spotify-highlight"
                  >
                    <Share size={16} className="mr-2" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* Share Modal */}
      {shareTrack && (
        <ShareModal
          isOpen={!!shareTrack}
          onClose={() => setShareTrack(null)}
          track={shareTrack}
        />
      )}
    </>
  );
};

export default TrackList;
