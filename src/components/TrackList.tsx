
import React from 'react';
import { Track } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatTime } from '@/utils/formatTime';
import { Play, Pause, Music } from 'lucide-react';

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

  const handlePlayClick = (track: Track) => {
    if (currentTrack && currentTrack.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  // Display a message when there are no tracks
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
        <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-spotify-highlight text-gray-400 text-sm">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5">TITLE</div>
          {showAlbum && <div className="col-span-4">ALBUM</div>}
          <div className="col-span-2 text-right">DURATION</div>
        </div>
      )}
      <div className="mt-2">
        {tracks.map((track, index) => {
          const isCurrentTrack = currentTrack && currentTrack.id === track.id;
          const isCurrentPlaying = isCurrentTrack && isPlaying;

          return (
            <div 
              key={track.id}
              className={`grid grid-cols-12 gap-4 px-4 py-2 hover:bg-spotify-highlight rounded-md group ${
                isCurrentTrack ? 'text-spotify-green' : 'text-gray-300'
              }`}
            >
              <div className="col-span-1 flex items-center justify-center">
                <div className="relative">
                  <span className={`group-hover:hidden ${isCurrentTrack ? 'text-spotify-green' : 'text-gray-400'}`}>
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
              </div>
              <div className="col-span-5 flex items-center truncate">
                <div className="truncate">
                  <div className="font-medium truncate">{track.name}</div>
                  <div className="text-sm text-gray-400 truncate">{track.artistName}</div>
                </div>
              </div>
              {showAlbum && (
                <div className="col-span-4 flex items-center text-sm text-gray-400 truncate">
                  {track.albumName}
                </div>
              )}
              <div className="col-span-2 flex items-center justify-end text-sm text-gray-400">
                {formatTime(track.playbackSeconds)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrackList;
