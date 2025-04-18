
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAlbumById, getTracksByAlbumId, Album, Track } from '@/services/api';
import TrackList from '@/components/TrackList';
import { Play, Pause, Clock3 } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';

const AlbumView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayer();

  useEffect(() => {
    const fetchAlbumData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      
      try {
        const [albumData, tracksData] = await Promise.all([
          getAlbumById(id),
          getTracksByAlbumId(id)
        ]);
        
        setAlbum(albumData);
        setTracks(tracksData);
      } catch (error) {
        console.error('Error fetching album data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAlbumData();
  }, [id]);

  const handlePlayAlbum = () => {
    if (!tracks.length) return;
    
    const isCurrentAlbumPlaying = 
      currentTrack && 
      tracks.some(track => track.id === currentTrack.id) && 
      isPlaying;
    
    if (isCurrentAlbumPlaying) {
      togglePlayPause();
    } else {
      playTrack(tracks[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Album not found</h2>
      </div>
    );
  }

  const isCurrentAlbumPlaying = 
    currentTrack && 
    tracks.some(track => track.id === currentTrack.id) && 
    isPlaying;

  const getAlbumImage = () => {
    if (album.links?.images?.href) {
      return `${album.links.images.href}/500x500`;
    }
    return 'https://api.napster.com/imageserver/images/v2/default/album/500x500.png';
  };

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-8">
        <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 flex-shrink-0 shadow-lg">
          <img
            src={getAlbumImage()}
            alt={album.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="text-xs uppercase font-bold mb-2">Album</div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4">{album.name}</h1>
          <div className="flex items-center text-sm text-gray-300">
            <span className="font-medium">{album.artistName}</span>
            <span className="mx-1">•</span>
            <span>{new Date(album.released).getFullYear()}</span>
            <span className="mx-1">•</span>
            <span>{tracks.length} songs</span>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <button
          onClick={handlePlayAlbum}
          className="bg-spotify-green hover:bg-opacity-80 text-black font-bold rounded-full p-3 mr-4"
        >
          {isCurrentAlbumPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
      </div>
      
      <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-spotify-highlight text-gray-400 text-sm">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-8">TITLE</div>
        <div className="col-span-3 flex justify-end items-center">
          <Clock3 size={16} />
        </div>
      </div>
      
      <div className="mt-2">
        {tracks.map((track, index) => {
          const isCurrentTrack = currentTrack && currentTrack.id === track.id;
          const isCurrentPlaying = isCurrentTrack && isPlaying;

          return (
            <div 
              key={track.id}
              className={`grid grid-cols-12 gap-4 px-4 py-3 hover:bg-spotify-highlight rounded-md group ${
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
                    onClick={() => isCurrentTrack ? togglePlayPause() : playTrack(track)}
                  >
                    {isCurrentPlaying ? 
                      <Pause size={16} className="text-white" /> : 
                      <Play size={16} className="text-white" />
                    }
                  </button>
                </div>
              </div>
              <div className="col-span-8 flex items-center">
                <div>
                  <div className="font-medium">{track.name}</div>
                  <div className="text-sm text-gray-400">{track.artistName}</div>
                </div>
              </div>
              <div className="col-span-3 flex items-center justify-end text-sm text-gray-400">
                {Math.floor(track.playbackSeconds / 60)}:{(track.playbackSeconds % 60).toString().padStart(2, '0')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlbumView;
