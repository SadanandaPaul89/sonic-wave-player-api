
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Track } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatTime } from '@/utils/formatTime';
import { getAllLocalTracks, getAllPublishedTracks } from '@/services/localLibrary';

const ShareTrack: React.FC = () => {
  const { trackId } = useParams<{ trackId: string }>();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayer();
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrack = async () => {
      if (!trackId) {
        setLoading(false);
        return;
      }

      try {
        // Get tracks from both local and published libraries
        const localTracks = getAllLocalTracks();
        const publishedTracks = getAllPublishedTracks();
        const allTracks = [...localTracks, ...publishedTracks];
        
        const foundTrack = allTracks.find(t => t.id === trackId);
        setTrack(foundTrack || null);
      } catch (error) {
        console.error('Error loading track:', error);
        setTrack(null);
      } finally {
        setLoading(false);
      }
    };

    loadTrack();
  }, [trackId]);

  const handlePlayTrack = () => {
    if (!track) return;

    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  const isCurrentTrackPlaying = currentTrack?.id === track?.id && isPlaying;

  if (loading) {
    return (
      <div className="min-h-screen bg-spotify-base text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spotify-green mx-auto mb-4"></div>
          <p className="text-gray-400">Loading track...</p>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-spotify-base text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Track Not Found</h1>
          <p className="text-gray-400 mb-6">
            The track you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')} className="bg-spotify-green hover:bg-spotify-green/80">
            <ArrowLeft size={16} className="mr-2" />
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-spotify-base">
      {/* Header */}
      <div className="p-4 flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft size={24} />
        </Button>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Shared track</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-spotify-green hover:bg-spotify-green/10"
          >
            <ExternalLink size={16} className="mr-1" />
            Open Sonic Wave
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
          {/* Album Art */}
          <div className="w-80 h-80 max-w-[80vw] max-h-[80vw] bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <img
              src={track.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center'}
              alt={track.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Track Info and Controls */}
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-2">
              <span className="text-sm text-gray-400 uppercase tracking-wide">Song</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-4 text-white">
              {track.name}
            </h1>
            
            <div className="flex items-center justify-center lg:justify-start space-x-2 mb-6">
              <span className="text-xl text-gray-300">{track.artistName}</span>
              {track.albumName && (
                <>
                  <span className="text-gray-500">•</span>
                  <span className="text-xl text-gray-300">{track.albumName}</span>
                </>
              )}
              <span className="text-gray-500">•</span>
              <span className="text-gray-400">{formatTime(track.duration)}</span>
            </div>

            {/* Play Button */}
            <div className="flex items-center justify-center lg:justify-start space-x-4 mb-8">
              <button
                onClick={handlePlayTrack}
                className="w-16 h-16 bg-spotify-green text-black rounded-full hover:scale-105 transition-transform flex items-center justify-center shadow-lg"
              >
                {isCurrentTrackPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
              </button>
            </div>

            {/* Description */}
            <div className="text-gray-400 max-w-md">
              <p className="mb-4">
                Shared from Sonic Wave - Discover and enjoy music like never before.
              </p>
              <Button
                onClick={() => navigate('/')}
                className="bg-white text-black hover:bg-gray-200 font-semibold"
              >
                Explore More Music
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareTrack;
