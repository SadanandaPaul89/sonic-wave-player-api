import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Track } from '@/services/supabaseService';
import { usePlayer } from '@/contexts/PlayerContext';
import { Button } from '@/components/ui/button';
import { Play, Pause, Home, Download } from 'lucide-react';
import { formatTime } from '@/utils/formatTime';
import { supabase } from '@/integrations/supabase/client';

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
        const { data: songData, error } = await supabase
          .from('songs')
          .select(`
            *,
            artists!inner(name),
            albums(name)
          `)
          .eq('id', trackId)
          .single();

        if (error) {
          throw error;
        }

        if (songData) {
          const foundTrack: Track = {
            id: songData.id,
            name: songData.name,
            artistId: songData.artist_id,
            artistName: songData.artists.name,
            albumId: songData.album_id,
            albumName: songData.albums ? songData.albums.name : null,
            duration: songData.duration,
            previewURL: songData.audio_url,
            image: songData.image_url,
          };
          setTrack(foundTrack);
        } else {
          setTrack(null);
        }
      } catch (error) {
        console.error('Error loading track:', error);
        setTrack(null);
      } finally {
        setLoading(false);
      }
    };

    loadTrack();
  }, [trackId]);

  const handlePlayClick = () => {
    if (!track) return;
    
    if (currentTrack && currentTrack.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Track not found</h1>
          <Button onClick={handleGoHome} variant="outline" className="text-white border-white hover:bg-white hover:text-black">
            <Home size={16} className="mr-2" />
            Go to Sonic Wave
          </Button>
        </div>
      </div>
    );
  }

  const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="p-6">
        <Button 
          onClick={handleGoHome}
          variant="ghost" 
          className="text-white hover:bg-white/10"
        >
          <Home size={20} className="mr-2" />
          Sonic Wave
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center px-6 pb-20">
        <div className="max-w-md w-full text-center">
          {/* Album art */}
          <div className="w-80 h-80 max-w-full mx-auto mb-8 rounded-2xl overflow-hidden shadow-2xl bg-gray-800">
            <img
              src={track.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center'}
              alt={track.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Track info */}
          <div className="text-white mb-8">
            <h1 className="text-3xl font-bold mb-2">{track.name}</h1>
            <p className="text-xl text-gray-300 mb-4">{track.artistName}</p>
            {track.albumName && (
              <p className="text-lg text-gray-400">{track.albumName}</p>
            )}
            <p className="text-sm text-gray-400 mt-2">
              Duration: {formatTime(track.duration)}
            </p>
          </div>

          {/* Play button */}
          <div className="flex flex-col items-center space-y-4">
            <Button
              onClick={handlePlayClick}
              size="lg"
              className="w-16 h-16 rounded-full bg-white text-black hover:bg-gray-200 flex items-center justify-center"
            >
              {isCurrentPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </Button>
            
            <p className="text-gray-300 text-sm">
              {isCurrentPlaying ? 'Now playing' : 'Tap to play'}
            </p>
          </div>

          {/* CTA */}
          <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
            <h2 className="text-white text-xl font-semibold mb-3">
              Discover more music
            </h2>
            <p className="text-gray-300 text-sm mb-4">
              Join Sonic Wave to explore millions of tracks and create your own playlists
            </p>
            <Button 
              onClick={handleGoHome}
              className="w-full bg-spotify-green hover:bg-spotify-green/90 text-black font-medium"
            >
              <Download size={16} className="mr-2" />
              Open Sonic Wave
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareTrack;
