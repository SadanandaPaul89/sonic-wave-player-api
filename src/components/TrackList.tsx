import React, { useState, useEffect } from 'react';
import { Track } from '@/services/supabaseService';
import { usePlayer } from '@/contexts/PlayerContext';
import { toggleSongLike, getSongLikeStatus } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import ShareModal from './ShareModal';
import TrackListHeader from './TrackListHeader';
import TrackListItem from './TrackListItem';
import TrackListEmptyState from './TrackListEmptyState';

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

  if (!tracks || tracks.length === 0) {
    return <TrackListEmptyState />;
  }

  return (
    <div className="w-full">
      {showHeader && <TrackListHeader showAlbum={showAlbum} />}
      
      {/* Add bottom padding to prevent mini player from covering last track */}
      <div className="mt-2 pb-24 sm:pb-28 px-4 sm:px-0">
        {tracks.map((track, index) => {
          const isCurrentTrack = currentTrack && currentTrack.id === track.id;
          const isCurrentPlaying = isCurrentTrack && isPlaying;
          const isLiked = likedTracks.has(track.id);

          return (
            <TrackListItem
              key={track.id}
              track={track}
              index={index}
              isCurrentTrack={!!isCurrentTrack}
              isCurrentPlaying={isCurrentPlaying}
              isLiked={isLiked}
              isAuthenticated={isAuthenticated}
              showAlbum={showAlbum}
              onPlayClick={handlePlayClick}
              onLikeClick={handleLikeClick}
              onShareClick={handleShareClick}
            />
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
