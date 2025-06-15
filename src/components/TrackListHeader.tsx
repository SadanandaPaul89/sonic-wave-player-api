
import React from 'react';

interface TrackListHeaderProps {
  showAlbum: boolean;
}

const TrackListHeader: React.FC<TrackListHeaderProps> = ({ showAlbum }) => {
  return (
    <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 border-b border-spotify-highlight text-gray-400 text-sm">
      <div className="col-span-1 text-center">#</div>
      <div className="col-span-4">TITLE</div>
      {showAlbum && <div className="col-span-3">ALBUM</div>}
      <div className="col-span-2 text-center">STATS</div>
      <div className="col-span-2 text-right">DURATION</div>
    </div>
  );
};

export default TrackListHeader;
