
import React, { useEffect, useState } from 'react';
import { getTopArtists, getTopTracks, Artist, Track } from '@/services/supabaseService';
import CardGrid from '@/components/CardGrid';
import TrackList from '@/components/TrackList';

const Home: React.FC = () => {
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const [artists, tracks] = await Promise.all([
          getTopArtists(10),
          getTopTracks(20),
        ]);
        
        setTopArtists(artists);
        setTopTracks(tracks);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setIsLoading(false);
      }
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
      
      {topArtists.length > 0 && (
        <CardGrid
          title="Top Artists"
          cards={topArtists.map(artist => ({
            id: artist.id,
            name: artist.name,
            imageUrl: artist.image,
            type: 'artist' as const,
          }))}
          cols={5}
        />
      )}
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Top Tracks</h2>
        <TrackList tracks={topTracks} />
      </div>
    </div>
  );
};

export default Home;
