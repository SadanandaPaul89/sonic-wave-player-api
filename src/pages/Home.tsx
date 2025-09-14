import React, { useEffect, useState } from 'react';
import { getTopArtists, getTopTracks, Artist, Track } from '@/services/supabaseService';
import CardGrid from '@/components/CardGrid';
import HoverExpandGrid from '@/components/HoverExpandGrid';
import { BrandLoader } from '@/components/Brand';
import TrackList from '@/components/TrackList';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';

const Home: React.FC = () => {
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { playTrack } = usePlayer();

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

  const recentlyPlayedItems = [
    { 
      id: '1', 
      name: 'Indie Pop Vibes', 
      description: 'Fresh indie tracks for your daily dose of creativity',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center',
      type: 'playlist' as const
    },
    { 
      id: '2', 
      name: 'Chill Beats', 
      description: 'Relaxing electronic music for focus and calm',
      imageUrl: 'https://images.unsplash.com/photo-1571974599782-87624638275c?w=500&h=500&fit=crop&crop=center',
      type: 'playlist' as const
    },
    { 
      id: '3', 
      name: 'Electronic Dreams', 
      description: 'Futuristic sounds and synthesized melodies',
      imageUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=500&h=500&fit=crop&crop=center',
      type: 'playlist' as const
    },
    { 
      id: '4', 
      name: 'Acoustic Sessions', 
      description: 'Intimate acoustic performances and raw emotion',
      imageUrl: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=500&h=500&fit=crop&crop=center',
      type: 'playlist' as const
    },
    { 
      id: '5', 
      name: 'Late Night Jazz', 
      description: 'Smooth jazz for those midnight moments',
      imageUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=500&h=500&fit=crop&crop=center',
      type: 'playlist' as const
    },
    { 
      id: '6', 
      name: 'Morning Coffee', 
      description: 'Perfect tunes to start your day right',
      imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=500&h=500&fit=crop&crop=center',
      type: 'playlist' as const
    },
  ];

  const playlistButtons = [
    { id: '1', name: 'Made for You', color: 'bg-green-500' },
    { id: '2', name: 'Daily Mix', color: 'bg-green-500' },
    { id: '3', name: 'Top Hits', color: 'bg-green-500' },
    { id: '4', name: 'Mon Light', color: 'bg-green-500' },
  ];

  const handlePlayFeaturedTrack = () => {
    if (topTracks.length > 0) {
      playTrack(topTracks[0]);
    }
  };

  if (isLoading) {
    return (
      <BrandLoader 
        message="Loading your music..." 
        showTagline={true}
        size="lg"
      />
    );
  }

  return (
    <div className="pb-20">
      <h1 className={`${isMobile ? 'text-xl sm:text-2xl' : 'text-3xl'} font-bold mb-4 sm:mb-6 text-white`}>
        Home
      </h1>
      
      {/* Recently Played Section */}
      <div className="mb-8">
        <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold mb-6 text-white`}>New Release</h2>
        <p className="text-white/70 mb-8 text-center">Fresh beats, straight from the studio.</p>
        {isMobile ? (
          <div className="grid grid-cols-2 gap-4">
            {recentlyPlayedItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="music-card aspect-square rounded-figma-md p-4 flex items-end cursor-pointer"
              >
                <h3 className="text-white font-medium text-sm">{item.name}</h3>
              </div>
            ))}
          </div>
        ) : (
          <HoverExpandGrid cards={recentlyPlayedItems} className="mb-8" />
        )}
      </div>

      {/* Featured Track Section */}
      {topTracks.length > 0 && (
        <div className="mb-8">
          <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold mb-4 text-white`}>Featured Track</h2>
          <div className="flex items-center space-x-4 glass-card p-4">
            <div className="w-32 h-32 glass-card rounded-figma-md flex-shrink-0"></div>
            <div className="flex-1">
              <h3 className="text-white text-2xl font-bold mb-1">{topTracks[0].name}</h3>
              <p className="text-white/70 mb-4">{topTracks[0].artistName}</p>
              <Button 
                onClick={handlePlayFeaturedTrack}
                className="btn-purple px-6 py-2 rounded-full"
              >
                <Play size={16} className="mr-2" />
                Play
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Playlists Section */}
      <div className="mb-8">
        <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold mb-4 text-white`}>Playlists</h2>
        <div className="flex flex-wrap gap-3">
          {playlistButtons.map((playlist) => (
            <Button
              key={playlist.id}
              className="btn-purple px-6 py-3 rounded-full"
            >
              {playlist.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Popular Albums Section */}
      <div className="mb-8">
        <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold mb-4 text-white`}>Popular Albums</h2>
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
          <div className="music-card aspect-square rounded-figma-md p-4 flex items-end cursor-pointer">
            <h3 className="text-white font-medium">Album Title 1</h3>
          </div>
          <div className="music-card aspect-square rounded-figma-md p-4 flex items-end cursor-pointer">
            <h3 className="text-white font-medium">Album Title 2</h3>
          </div>
        </div>
      </div>
      
      {/* Keep existing Top Artists section */}
      {topArtists.length > 0 && (
        <CardGrid
          title="Top Artists"
          cards={topArtists.map(artist => ({
            id: artist.id,
            name: artist.name,
            imageUrl: artist.image,
            type: 'artist' as const,
          }))}
          cols={isMobile ? 2 : 5}
        />
      )}
      
      {/* Keep existing Top Tracks section */}
      <div className="mt-6 sm:mt-8">
        <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold mb-3 sm:mb-4 text-white`}>Top Tracks</h2>
        <TrackList tracks={topTracks} />
      </div>
    </div>
  );
};

export default Home;
