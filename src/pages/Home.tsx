import React, { useEffect, useState } from 'react';
import { getTopArtists, getTopTracks, Artist, Track } from '@/services/supabaseService';
import { musicService } from '@/services/musicService';
import CardGrid from '@/components/CardGrid';
import HoverExpandGrid from '@/components/HoverExpandGrid';
import { BrandLoader } from '@/components/Brand';
import TrackList from '@/components/TrackList';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Disc, Globe, Music } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
// Removed excessive animations
import { Link } from 'react-router-dom';
import { sonicWaveMusicLibrary, SonicWaveTrack } from '@/services/sonicWaveMusicLibrary';
import { 
  SectionSkeleton, 
  GridSkeleton, 
  ListItemSkeleton, 
  CardSkeleton 
} from '@/components/LoadingSkeleton';

const Home: React.FC = () => {
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [ipfsTracks, setIpfsTracks] = useState<Track[]>([]);
  const [pinataTracks, setPinataTracks] = useState<Track[]>([]);

  const [recentUploads, setRecentUploads] = useState<SonicWaveTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { playTrack } = usePlayer();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const [artists, tracks, featuredIPFS, pinataMusic] = await Promise.all([
          getTopArtists(10),
          getTopTracks(20),
          musicService.getFeaturedIPFSTracks(),
          musicService.getAllTracks() // This now includes Pinata tracks first
        ]);
        
        // Initialize Sonic Wave library and get recent uploads
        await sonicWaveMusicLibrary.initializeLibrary();
        const recentSonicWaveTracks = sonicWaveMusicLibrary.getRecentlyUploadedTracks(6);
        
        // Filter Pinata tracks (they start with 'pinata-')
        const pinataOnly = pinataMusic.filter(track => track.id.startsWith('pinata-')).slice(0, 10);
        
        setTopArtists(artists);
        setTopTracks(tracks);
        setIpfsTracks(featuredIPFS);
        setPinataTracks(pinataOnly);
        setRecentUploads(recentSonicWaveTracks);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();

    // Listen for custom events when new tracks are uploaded
    const handleNewTrackUploaded = () => {
      console.log('New IPFS track uploaded, refreshing...');
      musicService.getFeaturedIPFSTracks().then(tracks => {
        setIpfsTracks(tracks);
      });
    };

    // Listen for storage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('ipfs_file_')) {
        handleNewTrackUploaded();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ipfs-track-uploaded', handleNewTrackUploaded);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ipfs-track-uploaded', handleNewTrackUploaded);
    };
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
      <div className="pb-20 space-y-8">
        <BrandLoader 
          message="Loading your music..." 
          showTagline={true}
          size="lg"
        />
        
        {/* Loading Skeletons */}
        <div className="space-y-8">
          <SectionSkeleton title={true}>
            <GridSkeleton items={6} columns={3} />
          </SectionSkeleton>
          
          <SectionSkeleton title={true}>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <ListItemSkeleton key={i} />
              ))}
            </div>
          </SectionSkeleton>
          
          <SectionSkeleton title={true}>
            <GridSkeleton items={4} columns={2} />
          </SectionSkeleton>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 space-y-8">
      <h1 className={`${isMobile ? 'text-xl sm:text-2xl' : 'text-3xl'} font-bold mb-4 sm:mb-6 text-white`}>
        Home
      </h1>
      
      {/* Recently Played Section */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold text-white`}>
            New Release
          </h2>
          <p className="text-white/70 text-center">
            Fresh beats, straight from the studio.
          </p>
        </div>
        
        {isMobile ? (
          <div className="grid grid-cols-2 gap-4">
            {recentlyPlayedItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="music-card aspect-square rounded-figma-md p-4 flex items-end cursor-pointer group hover:scale-105 transition-transform duration-300"
              >
                <h3 className="text-white font-medium text-sm group-hover:text-figma-purple transition-colors">
                  {item.name}
                </h3>
              </div>
            ))}
          </div>
        ) : (
          <HoverExpandGrid cards={recentlyPlayedItems} className="mb-8" />
        )}
      </div>

      {/* Featured Track Section */}
      {topTracks.length > 0 && (
        <div className="space-y-4">
          <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold text-white`}>
            Featured Track
          </h2>
          <div 
            className="flex items-center space-x-6 glass-card p-6 rounded-figma-lg hover:bg-white/10 transition-all duration-300 group cursor-pointer"
            onClick={handlePlayFeaturedTrack}
          >
            <div className="w-32 h-32 glass-card rounded-figma-md flex-shrink-0 overflow-hidden">
              <img
                src={topTracks[0].image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center'}
                alt={topTracks[0].name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-white text-2xl font-bold group-hover:text-figma-purple transition-colors">
                {topTracks[0].name}
              </h3>
              <p className="text-white/70 text-lg">
                {topTracks[0].artistName}
              </p>
              <div>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayFeaturedTrack();
                  }}
                  className="bg-figma-purple hover:bg-figma-purple/80 px-8 py-3 rounded-full text-white font-medium shadow-lg shadow-figma-purple/25 transition-all duration-300"
                >
                  <Play size={18} className="mr-2" />
                  Play Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pinata Music Library Section */}
      {pinataTracks.length > 0 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold text-white`}>
                🎵 Your Music Library
              </h2>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Globe size={12} className="mr-1" />
                Pinata IPFS
              </Badge>
              <Badge className="bg-figma-purple/20 text-figma-purple border-figma-purple/30">
                {pinataTracks.length} tracks
              </Badge>
            </div>
            <p className="text-white/70">
              Music uploaded to your Pinata IPFS gateway - accessible from anywhere in the world
            </p>
          </div>
          <TrackList tracks={pinataTracks} showHeader={false} />
        </div>
      )}

      {/* Playlists Section */}
      <div className="space-y-4">
        <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold text-white`}>
          Quick Playlists
        </h2>
        <div className="flex flex-wrap gap-3">
          {playlistButtons.map((playlist) => (
            <Button
              key={playlist.id}
              className="bg-figma-purple/20 hover:bg-figma-purple/30 text-figma-purple border border-figma-purple/30 px-6 py-3 rounded-full transition-all duration-300"
            >
              {playlist.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Popular Albums Section */}
      <div className="space-y-4">
        <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold text-white`}>
          Popular Albums
        </h2>
        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}>
          {['Album Title 1', 'Album Title 2'].map((title) => (
            <div
              key={title}
              className="music-card aspect-square rounded-figma-md p-4 flex items-end cursor-pointer group hover:scale-105 transition-all duration-300"
            >
              <h3 className="text-white font-medium group-hover:text-figma-purple transition-colors">
                {title}
              </h3>
            </div>
          ))}
        </div>
      </div>
      
      {/* All Music Section - Now ALL music is IPFS-tagged */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold text-white`}>
              IPFS Music Collection
            </h2>
            <Badge className="bg-figma-purple/20 text-figma-purple border-figma-purple/30">
              <Disc size={12} className="mr-1" />
              All IPFS
            </Badge>
            {ipfsTracks.some(track => track.artistName === 'You') && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Globe size={12} className="mr-1" />
                Your Uploads
              </Badge>
            )}
          </div>
          <p className="text-white/70">
            All music on our platform is stored on IPFS - the decentralized web
            {ipfsTracks.some(track => track.artistName === 'You') && (
              <span className="text-green-400"> • Including your uploaded tracks</span>
            )}
          </p>
        </div>
        <TrackList tracks={ipfsTracks.length > 0 ? ipfsTracks : topTracks} />
      </div>



      {/* Top Artists section */}
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
      
      {/* Top IPFS Tracks section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold text-white`}>
            Top IPFS Tracks
          </h2>
          <Badge className="bg-figma-purple/20 text-figma-purple border-figma-purple/30">
            <Globe size={12} className="mr-1" />
            Decentralized
          </Badge>
        </div>
        <TrackList tracks={topTracks} />
      </div>
    </div>
  );
};

export default Home;
