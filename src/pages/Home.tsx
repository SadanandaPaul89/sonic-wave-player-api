import React, { useEffect, useState } from 'react';
import { getTopArtists, getTopTracks, Artist, Track } from '@/services/supabaseService';
import CardGrid from '@/components/CardGrid';
import TrackList from '@/components/TrackList';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Play, House, Search, Library, Radio, Music, TrendingUp } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { ExpandedTabs } from '@/components/ui/expanded-tabs';
import { DefaultDemo } from '@/components/ExpandedTabsDemo';

const Home: React.FC = () => {
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { playTrack } = usePlayer();

  const quickNavTabs = [
    { title: "Discover", icon: Search },
    { title: "Your Library", icon: Library },
    { type: "separator" as const },
    { title: "Recently Played", icon: Music },
    { title: "Trending", icon: TrendingUp },
  ];

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
    { id: '1', name: 'Indie Pop', color: 'from-orange-300 to-gray-800' },
    { id: '2', name: 'Chill Vibes', color: 'from-orange-600 to-teal-700' },
    { id: '3', name: 'Electronic Beats', color: 'from-teal-500 to-orange-500' },
    { id: '4', name: 'Acoustic Sessions', color: 'from-teal-600 to-yellow-500' },
    { id: '5', name: 'Late Night Jazz', color: 'from-gray-800 to-yellow-400' },
    { id: '6', name: 'Morning Coffee', color: 'from-yellow-600 to-teal-700' },
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
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`pb-20 ${isMobile ? 'px-3 sm:px-4' : 'px-6'}`}>
      <div className="flex items-start justify-between mb-6">
        <h1 className={`${isMobile ? 'text-xl sm:text-2xl' : 'text-3xl'} font-bold`}>
          Welcome to Sonic Wave
        </h1>
        {!isMobile && (
          <div className="flex gap-4">
            <ExpandedTabs tabs={quickNavTabs} />
            <DefaultDemo />
          </div>
        )}
      </div>
      
      {/* Recently Played Section */}
      <div className="mb-8">
        <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold mb-4`}>Recently Played</h2>
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3 lg:grid-cols-6'} gap-4`}>
          {recentlyPlayedItems.map((item) => (
            <div
              key={item.id}
              className={`bg-gradient-to-br ${item.color} aspect-square rounded-md p-4 flex items-end cursor-pointer hover:scale-105 transition-transform`}
            >
              <h3 className="text-white font-medium text-sm">{item.name}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Track Section */}
      {topTracks.length > 0 && (
        <div className="mb-8">
          <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold mb-4`}>Featured Track</h2>
          <div className="flex items-center space-x-4 bg-gradient-to-r from-teal-600 to-yellow-500 rounded-lg p-4">
            <div className="w-32 h-32 bg-gradient-to-br from-teal-600 to-yellow-400 rounded-md flex-shrink-0"></div>
            <div className="flex-1">
              <h3 className="text-white text-2xl font-bold mb-1">{topTracks[0].name}</h3>
              <p className="text-green-300 mb-4">{topTracks[0].artistName}</p>
              <Button 
                onClick={handlePlayFeaturedTrack}
                className="bg-green-500 hover:bg-green-600 text-black font-semibold px-6 py-2 rounded-full"
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
        <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold mb-4`}>Playlists</h2>
        <div className="flex flex-wrap gap-3">
          {playlistButtons.map((playlist) => (
            <Button
              key={playlist.id}
              className={`${playlist.color} hover:bg-green-600 text-black font-semibold px-6 py-3 rounded-full`}
            >
              {playlist.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Popular Albums Section */}
      <div className="mb-8">
        <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold mb-4`}>Popular Albums</h2>
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 aspect-square rounded-md p-4 flex items-end cursor-pointer hover:scale-105 transition-transform">
            <h3 className="text-white font-medium">Album Title 1</h3>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-700 aspect-square rounded-md p-4 flex items-end cursor-pointer hover:scale-105 transition-transform">
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
        <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold mb-3 sm:mb-4`}>Top Tracks</h2>
        <TrackList tracks={topTracks} />
      </div>
    </div>
  );
};

export default Home;
