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
import { Play, Disc, Zap, Globe } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { motion, AnimatePresence } from 'framer-motion';
import AnimationWrapper from '@/components/AnimationWrapper';
import ScrollAnimation from '@/components/ScrollAnimation';
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
  const [nftTracks, setNftTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { playTrack } = usePlayer();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const [artists, tracks, featuredIPFS, nftMusic] = await Promise.all([
          getTopArtists(10),
          getTopTracks(20),
          musicService.getFeaturedIPFSTracks(),
          musicService.getNFTTracks()
        ]);
        
        setTopArtists(artists);
        setTopTracks(tracks);
        setIpfsTracks(featuredIPFS);
        setNftTracks(nftMusic);
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
        <AnimationWrapper animation="fadeIn">
          <BrandLoader 
            message="Loading your music..." 
            showTagline={true}
            size="lg"
          />
        </AnimationWrapper>
        
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
      <AnimationWrapper animation="slideUp">
        <h1 className={`${isMobile ? 'text-xl sm:text-2xl' : 'text-3xl'} font-bold mb-4 sm:mb-6 text-white`}>
          Home
        </h1>
      </AnimationWrapper>
      
      {/* Recently Played Section */}
      <ScrollAnimation animation="slideUp" className="space-y-6">
        <div className="space-y-4">
          <motion.h2 
            className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold text-white`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            New Release
          </motion.h2>
          <motion.p 
            className="text-white/70 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Fresh beats, straight from the studio.
          </motion.p>
        </div>
        
        {isMobile ? (
          <motion.div 
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, staggerChildren: 0.1 }}
          >
            {recentlyPlayedItems.slice(0, 4).map((item, index) => (
              <motion.div
                key={item.id}
                className="music-card aspect-square rounded-figma-md p-4 flex items-end cursor-pointer group hover:scale-105 transition-transform duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <h3 className="text-white font-medium text-sm group-hover:text-figma-purple transition-colors">
                  {item.name}
                </h3>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <HoverExpandGrid cards={recentlyPlayedItems} className="mb-8" />
          </motion.div>
        )}
      </ScrollAnimation>

      {/* Featured Track Section */}
      <AnimatePresence>
        {topTracks.length > 0 && (
          <ScrollAnimation animation="slideUp" className="space-y-4">
            <motion.h2 
              className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold text-white`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Featured Track
            </motion.h2>
            <motion.div 
              className="flex items-center space-x-6 glass-card p-6 rounded-figma-lg hover:bg-white/10 transition-all duration-300 group cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              onClick={handlePlayFeaturedTrack}
            >
              <motion.div 
                className="w-32 h-32 glass-card rounded-figma-md flex-shrink-0 overflow-hidden"
                whileHover={{ scale: 1.05 }}
              >
                <img
                  src={topTracks[0].image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center'}
                  alt={topTracks[0].name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </motion.div>
              <div className="flex-1 space-y-3">
                <motion.h3 
                  className="text-white text-2xl font-bold group-hover:text-figma-purple transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {topTracks[0].name}
                </motion.h3>
                <motion.p 
                  className="text-white/70 text-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {topTracks[0].artistName}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayFeaturedTrack();
                    }}
                    className="bg-figma-purple hover:bg-figma-purple/80 px-8 py-3 rounded-full text-white font-medium shadow-lg shadow-figma-purple/25 transition-all duration-300 hover:scale-105"
                  >
                    <Play size={18} className="mr-2" />
                    Play Now
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </ScrollAnimation>
        )}
      </AnimatePresence>

      {/* Playlists Section */}
      <ScrollAnimation animation="slideUp" className="space-y-4">
        <motion.h2 
          className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold text-white`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Quick Playlists
        </motion.h2>
        <motion.div 
          className="flex flex-wrap gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
        >
          {playlistButtons.map((playlist, index) => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                className="bg-figma-purple/20 hover:bg-figma-purple/30 text-figma-purple border border-figma-purple/30 px-6 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-figma-purple/25"
              >
                {playlist.name}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </ScrollAnimation>

      {/* Popular Albums Section */}
      <ScrollAnimation animation="slideUp" className="space-y-4">
        <motion.h2 
          className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold text-white`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Popular Albums
        </motion.h2>
        <motion.div 
          className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'} gap-4`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
        >
          {['Album Title 1', 'Album Title 2'].map((title, index) => (
            <motion.div
              key={title}
              className="music-card aspect-square rounded-figma-md p-4 flex items-end cursor-pointer group hover:scale-105 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <h3 className="text-white font-medium group-hover:text-figma-purple transition-colors">
                {title}
              </h3>
            </motion.div>
          ))}
        </motion.div>
      </ScrollAnimation>
      
      {/* All Music Section - Now ALL music is IPFS-tagged */}
      <ScrollAnimation animation="slideUp" className="space-y-6">
        <div className="space-y-4">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold text-white`}>
              IPFS Music Collection
            </h2>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Badge className="bg-figma-purple/20 text-figma-purple border-figma-purple/30">
                <Disc size={12} className="mr-1" />
                All IPFS
              </Badge>
            </motion.div>
            {ipfsTracks.some(track => track.artistName === 'You') && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <Globe size={12} className="mr-1" />
                  Your Uploads
                </Badge>
              </motion.div>
            )}
          </motion.div>
          <motion.p 
            className="text-white/70"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            All music on our platform is stored on IPFS - the decentralized web
            {ipfsTracks.some(track => track.artistName === 'You') && (
              <span className="text-green-400"> • Including your uploaded tracks</span>
            )}
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TrackList tracks={ipfsTracks.length > 0 ? ipfsTracks : topTracks} />
        </motion.div>
      </ScrollAnimation>

      {/* NFT Music Section */}
      {nftTracks.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold text-white`}>
              Exclusive NFT Music
            </h2>
            <Badge className="bg-gradient-to-r from-yellow-500/20 to-purple-500/20 text-yellow-400 border-yellow-500/30">
              <Zap size={12} className="mr-1" />
              NFT
            </Badge>
          </div>
          <p className="text-white/70 mb-6">Premium tracks available exclusively to NFT holders</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nftTracks.map((track) => (
              <motion.div
                key={track.id}
                className="glass-card p-4 rounded-figma-md hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                whileHover={{ scale: 1.02 }}
                onClick={() => playTrack(track)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-figma-sm overflow-hidden bg-white/10 flex-shrink-0">
                    {track.image && (
                      <img
                        src={track.image}
                        alt={track.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{track.name}</h3>
                    <p className="text-white/60 text-sm truncate">{track.artistName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
                        NFT #{track.nft?.tokenId}
                      </Badge>
                      <Globe size={10} className="text-figma-purple" />
                      <span className="text-xs text-white/40">IPFS</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-figma-purple hover:bg-figma-purple/20"
                  >
                    <Play size={16} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Top Artists section */}
      <AnimatePresence>
        {topArtists.length > 0 && (
          <ScrollAnimation animation="slideUp">
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
          </ScrollAnimation>
        )}
      </AnimatePresence>
      
      {/* Top IPFS Tracks section */}
      <ScrollAnimation animation="slideUp" className="space-y-4">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className={`${isMobile ? 'text-lg sm:text-xl' : 'text-2xl'} font-bold text-white`}>
            Top IPFS Tracks
          </h2>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Badge className="bg-figma-purple/20 text-figma-purple border-figma-purple/30">
              <Globe size={12} className="mr-1" />
              Decentralized
            </Badge>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TrackList tracks={topTracks} />
        </motion.div>
      </ScrollAnimation>
    </div>
  );
};

export default Home;
