
import React from 'react';
import { Music } from 'lucide-react';

const TrackListEmptyState: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16 text-gray-400">
      <Music size={64} className="mb-4" />
      <h3 className="text-xl font-medium mb-2">No tracks available</h3>
      <p>Try searching for something else or check back later.</p>
    </div>
  );
};

export default TrackListEmptyState;
