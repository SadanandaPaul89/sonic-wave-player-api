
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Album, Track, getAlbumById, getTracksByAlbumId } from '@/services/api';
import { ChevronLeft } from 'lucide-react';
import TrackList from '@/components/TrackList';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatTime } from '@/utils/formatTime';

const AlbumView = () => {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { playTrack } = usePlayer();

  useEffect(() => {
    const fetchAlbumData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const albumData = await getAlbumById(id);
        setAlbum(albumData);
        
        if (albumData) {
          const albumTracks = await getTracksByAlbumId(id);
          setTracks(albumTracks);
        }
      } catch (error) {
        console.error('Error fetching album:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAlbumData();
  }, [id]);

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0]);
    }
  };

  const calculateTotalDuration = (): string => {
    const totalSeconds = tracks.reduce((total, track) => total + track.duration, 0);
    return formatTime(totalSeconds);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="p-6">
        <Link 
          to="/"
          className="inline-flex items-center text-gray-400 hover:text-white mb-6"
        >
          <ChevronLeft size={20} />
          <span>Back to Home</span>
        </Link>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Album Not Found</h2>
          <p className="text-gray-400">The album you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <Link 
        to="/"
        className="inline-flex items-center text-gray-400 hover:text-white mb-6 ml-6"
      >
        <ChevronLeft size={20} />
        <span>Back to Home</span>
      </Link>
      
      <div className="flex flex-col md:flex-row p-6 gap-6">
        {/* Album Cover */}
        <div className="flex-shrink-0">
          <div className="w-48 h-48 bg-spotify-elevated shadow-xl">
            <img 
              src={album.image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop'} 
              alt={album.name} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Album Info */}
        <div className="flex flex-col justify-end">
          <div className="text-xs uppercase font-medium mb-2">Album</div>
          <h1 className="text-3xl font-bold mb-2">{album.name}</h1>
          <div className="flex items-center text-sm text-gray-300 mt-2">
            <span className="font-medium">{album.artistName}</span>
            <span className="mx-1">•</span>
            <span>{album.releaseDate ? new Date(album.releaseDate).getFullYear() : 'Unknown'}</span>
            <span className="mx-1">•</span>
            <span>{tracks.length} songs, {calculateTotalDuration()}</span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={handlePlayAll}
            className="bg-spotify-green text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
          >
            Play
          </button>
        </div>
        
        <TrackList tracks={tracks} showAlbum={false} />
      </div>
    </div>
  );
};

export default AlbumView;
