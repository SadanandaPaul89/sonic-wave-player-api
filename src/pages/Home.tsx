
import React, { useEffect, useState } from 'react';
import { getTopArtists, getTopTracks, getFeaturedPlaylists, getImageUrl, Artist, Track, Playlist } from '@/services/api';
import CardGrid from '@/components/CardGrid';
import TrackList from '@/components/TrackList';

const Home: React.FC = () => {
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const [artists, tracks, playlists] = await Promise.all([
        getTopArtists(10),
        getTopTracks(20),
        getFeaturedPlaylists(10)
      ]);
      
      setTopArtists(artists);
      setTopTracks(tracks);
      setFeaturedPlaylists(playlists);
      setIsLoading(false);
    };
    
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <h1 className="text-3xl font-bold mb-6">Welcome to Sonic Wave</h1>
      
      <CardGrid
        title="Top Artists"
        cards={topArtists.map(artist => ({
          id: artist.id,
          name: artist.name,
          imageUrl: getImageUrl(artist, 'md'),
          type: 'artist' as const,
        }))}
        cols={5}
      />
      
      <CardGrid
        title="Featured Playlists"
        cards={featuredPlaylists.map(playlist => ({
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          imageUrl: getImageUrl(playlist, 'md'),
          type: 'playlist' as const,
        }))}
        cols={5}
      />
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Top Tracks</h2>
        <TrackList tracks={topTracks} />
      </div>
    </div>
  );
};

export default Home;
