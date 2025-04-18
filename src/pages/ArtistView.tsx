
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getArtistById, searchContent, Artist, Album, Track, getImageUrl } from '@/services/api';
import { Play, Pause } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import CardGrid from '@/components/CardGrid';
import TrackList from '@/components/TrackList';

const ArtistView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayer();

  useEffect(() => {
    const fetchArtistData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      
      try {
        const artistData = await getArtistById(id);
        
        if (artistData) {
          setArtist(artistData);
          
          // Get top tracks by searching for the artist name
          const artistName = artistData.name;
          const tracksResults = await searchContent(artistName, 'track', 10);
          const filteredTracks = tracksResults.filter(track => 
            track.artistName.toLowerCase().includes(artistName.toLowerCase())
          );
          setTopTracks(filteredTracks);
          
          // Get albums by searching for the artist name
          const albumsResults = await searchContent(artistName, 'album', 10);
          const filteredAlbums = albumsResults.filter(album => 
            album.artistName.toLowerCase().includes(artistName.toLowerCase())
          );
          setAlbums(filteredAlbums);
        }
      } catch (error) {
        console.error('Error fetching artist data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArtistData();
  }, [id]);

  const handlePlayTopTracks = () => {
    if (!topTracks.length) return;
    
    const isCurrentArtistPlaying = 
      currentTrack && 
      topTracks.some(track => track.id === currentTrack.id) && 
      isPlaying;
    
    if (isCurrentArtistPlaying) {
      togglePlayPause();
    } else {
      playTrack(topTracks[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Artist not found</h2>
      </div>
    );
  }

  const isCurrentArtistPlaying = 
    currentTrack && 
    topTracks.some(track => track.id === currentTrack.id) && 
    isPlaying;

  const getArtistImage = () => {
    if (artist.links?.images?.href) {
      return `${artist.links.images.href}/500x500`;
    }
    return 'https://api.napster.com/imageserver/images/v2/default/artist/500x500.png';
  };

  return (
    <div className="pb-20">
      <div className="relative mb-8">
        <div className="h-80 bg-gradient-to-b from-spotify-elevated to-spotify-base flex items-end">
          <div className="container px-6 pb-6">
            <div className="flex items-center gap-6">
              <div className="w-40 h-40 rounded-full overflow-hidden shadow-xl">
                <img
                  src={getArtistImage()}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-xs uppercase font-bold mb-2">Artist</div>
                <h1 className="text-5xl font-bold">{artist.name}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <button
          onClick={handlePlayTopTracks}
          className="bg-spotify-green hover:bg-opacity-80 text-black font-bold rounded-full p-3 mr-4"
        >
          {isCurrentArtistPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Popular</h2>
        <TrackList tracks={topTracks} showAlbum={true} />
      </div>
      
      {albums.length > 0 && (
        <CardGrid
          title="Albums"
          cards={albums.map(album => ({
            id: album.id,
            name: album.name,
            description: `${new Date(album.released).getFullYear()}`,
            imageUrl: getImageUrl(album, 'md'),
            type: 'album' as const,
          }))}
          cols={6}
        />
      )}
    </div>
  );
};

export default ArtistView;
