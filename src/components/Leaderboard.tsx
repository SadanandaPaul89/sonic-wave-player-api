import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Music, User, Headphones, TrendingUp, Award } from 'lucide-react';
import { leaderboardService, Song, Artist, Listener } from '@/services/leaderboardService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('songs');
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [songsData, artistsData, listenersData] = await Promise.all([
          leaderboardService.getTopSongs(),
          leaderboardService.getTopArtists(),
          leaderboardService.getTopListeners(),
        ]);
        setSongs(songsData);
        setArtists(artistsData);
        setListeners(listenersData);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Award className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-2xl font-bold text-white/60">#{rank}</span>;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const SongItem: React.FC<{ song: Song; rank: number }> = ({ song, rank }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
    >
      <div className="flex items-center justify-center w-12 h-12">
        {getRankIcon(rank)}
      </div>
      <div className="w-12 h-12 rounded-md overflow-hidden bg-white/10 flex-shrink-0">
        <img
          src={song.imageUrl}
          alt={song.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium truncate group-hover:text-figma-purple transition-colors">
          {song.title}
        </h3>
        <p className="text-white/60 text-sm truncate">{song.artist}</p>
      </div>
      <div className="text-right">
        <Badge variant="secondary" className="bg-figma-purple/20 text-figma-purple">
          <TrendingUp className="w-3 h-3 mr-1" />
          {formatNumber(song.playCount)}
        </Badge>
      </div>
    </motion.div>
  );

  const ArtistItem: React.FC<{ artist: Artist; rank: number }> = ({ artist, rank }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
    >
      <div className="flex items-center justify-center w-12 h-12">
        {getRankIcon(rank)}
      </div>
      <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
        <img
          src={artist.imageUrl}
          alt={artist.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium truncate group-hover:text-figma-purple transition-colors">
          {artist.name}
        </h3>
        <p className="text-white/60 text-sm">Artist</p>
      </div>
      <div className="text-right">
        <Badge variant="secondary" className="bg-green-500/20 text-green-400">
          <User className="w-3 h-3 mr-1" />
          {formatNumber(artist.followers)}
        </Badge>
      </div>
    </motion.div>
  );

  const ListenerItem: React.FC<{ listener: Listener; rank: number }> = ({ listener, rank }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
    >
      <div className="flex items-center justify-center w-12 h-12">
        {getRankIcon(rank)}
      </div>
      <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
        <img
          src={listener.avatarUrl}
          alt={listener.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium truncate group-hover:text-figma-purple transition-colors">
          {listener.name}
        </h3>
        <p className="text-white/60 text-sm">Music Lover</p>
      </div>
      <div className="text-right">
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
          <Headphones className="w-3 h-3 mr-1" />
          {formatNumber(listener.totalPlays)}
        </Badge>
      </div>
    </motion.div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-white/5">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-16 h-6" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Music Leaderboard
        </h1>
        <p className="text-white/70 text-lg">
          Discover the most popular songs, artists, and listeners on Sonic Wave Player
        </p>
      </motion.div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Charts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/10">
              <TabsTrigger
                value="songs"
                className="data-[state=active]:bg-figma-purple data-[state=active]:text-white"
              >
                <Music className="w-4 h-4 mr-2" />
                Songs
              </TabsTrigger>
              <TabsTrigger
                value="artists"
                className="data-[state=active]:bg-figma-purple data-[state=active]:text-white"
              >
                <User className="w-4 h-4 mr-2" />
                Artists
              </TabsTrigger>
              <TabsTrigger
                value="listeners"
                className="data-[state=active]:bg-figma-purple data-[state=active]:text-white"
              >
                <Headphones className="w-4 h-4 mr-2" />
                Listeners
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="songs" className="mt-6">
                <motion.div
                  key="songs"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {loading ? (
                    <LoadingSkeleton />
                  ) : (
                    <div className="space-y-2">
                      {songs.map((song, index) => (
                        <SongItem key={song.id} song={song} rank={index + 1} />
                      ))}
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="artists" className="mt-6">
                <motion.div
                  key="artists"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {loading ? (
                    <LoadingSkeleton />
                  ) : (
                    <div className="space-y-2">
                      {artists.map((artist, index) => (
                        <ArtistItem key={artist.id} artist={artist} rank={index + 1} />
                      ))}
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="listeners" className="mt-6">
                <motion.div
                  key="listeners"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {loading ? (
                    <LoadingSkeleton />
                  ) : (
                    <div className="space-y-2">
                      {listeners.map((listener, index) => (
                        <ListenerItem key={listener.id} listener={listener} rank={index + 1} />
                      ))}
                    </div>
                  )}
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
