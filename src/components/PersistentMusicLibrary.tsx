// Persistent Music Library Component - Spotify-like music library interface

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Music, 
  Play, 
  Pause, 
  Search, 
  Heart, 
  Plus, 
  MoreHorizontal,
  Clock,
  Download,
  Shuffle,
  Repeat,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { usePersistentMusic } from '@/hooks/usePersistentMusic';
import { PersistentTrack } from '@/services/persistentMusicService';

interface PersistentMusicLibraryProps {
  className?: string;
}

const PersistentMusicLibrary: React.FC<PersistentMusicLibraryProps> = ({
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [filteredTracks, setFilteredTracks] = useState<PersistentTrack[]>([]);

  const {
    library,
    tracks,
    playlists,
    currentTrack,
    isPlaying,
    isLoading,
    error,
    initializeLibrary,
    playTrack,
    pauseTrack,
    searchTracks,
    addToPlaylist,
    getPlaylistTracks,
    clearError
  } = usePersistentMusic();

  // Initialize library on mount
  useEffect(() => {
    initializeLibrary();
  }, [initializeLibrary]);

  // Update filtered tracks when search or tab changes
  useEffect(() => {
    let filtered = tracks;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchTracks(searchQuery);
    }

    // Apply tab filter
    if (selectedTab !== 'all') {
      filtered = filtered.filter(track => {
        switch (selectedTab) {
          case 'purchased':
            return track.accessType === 'purchased';
          case 'subscription':
            return track.accessType === 'subscription';
          case 'nft':
            return track.accessType === 'nft_owned';
          case 'free':
            return track.accessType === 'free';
          default:
            return true;
        }
      });
    }

    setFilteredTracks(filtered);
  }, [tracks, searchQuery, selectedTab, searchTracks]);

  // Handle track play/pause
  const handleTrackPlayPause = async (track: PersistentTrack) => {
    if (currentTrack?.id === track.id && isPlaying) {
      pauseTrack();
    } else {
      await playTrack(track.id);
    }
  };

  // Add track to liked songs
  const handleLikeTrack = async (trackId: string) => {
    try {
      await addToPlaylist('liked_songs', trackId);
      toast.success('Added to Liked Songs');
    } catch (error) {
      toast.error('Failed to add to Liked Songs');
    }
  };

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get access type badge
  const getAccessTypeBadge = (accessType: PersistentTrack['accessType']) => {
    const badges = {
      purchased: { label: 'Owned', color: 'bg-green-500/20 text-green-400' },
      subscription: { label: 'Premium', color: 'bg-purple-500/20 text-purple-400' },
      nft_owned: { label: 'NFT', color: 'bg-blue-500/20 text-blue-400' },
      free: { label: 'Free', color: 'bg-gray-500/20 text-gray-400' }
    };
    
    const badge = badges[accessType];
    return (
      <Badge className={`${badge.color} text-xs`}>
        {badge.label}
      </Badge>
    );
  };

  if (!library) {
    return (
      <Card className={`glass-card border-figma-glass-border ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
            <Music size={24} className="text-white/40" />
          </div>
          <h3 className="text-white font-medium mb-2">Initializing Music Library</h3>
          <p className="text-white/60 text-sm">
            Setting up your persistent music collection...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Library Header */}
      <Card className="glass-card border-figma-glass-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-3">
                <Music size={24} className="text-figma-purple" />
                Your Music Library
              </CardTitle>
              <p className="text-white/60 text-sm mt-1">
                {library.totalTracks} tracks • {library.storageUsed} MB used
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-figma-purple">
                <Shuffle size={16} />
              </Button>
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-figma-purple">
                <Repeat size={16} />
              </Button>
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-figma-purple">
                <Volume2 size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search your music..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          {/* Filter Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-5 bg-white/10">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="purchased">Owned</TabsTrigger>
              <TabsTrigger value="subscription">Premium</TabsTrigger>
              <TabsTrigger value="nft">NFT</TabsTrigger>
              <TabsTrigger value="free">Free</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              {/* Track List */}
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredTracks.map((track, index) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-figma-md hover:bg-white/10 transition-colors group cursor-pointer ${
                        currentTrack?.id === track.id ? 'bg-figma-purple/20 border border-figma-purple/30' : 'bg-white/5'
                      }`}
                      onClick={() => handleTrackPlayPause(track)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Play Button */}
                        <div className="relative">
                          <div className="w-12 h-12 rounded-figma-sm overflow-hidden bg-white/10 flex items-center justify-center">
                            {track.artwork ? (
                              <img 
                                src={track.artwork} 
                                alt={track.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Music size={20} className="text-white/60" />
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            {currentTrack?.id === track.id && isPlaying ? (
                              <Pause size={16} className="text-white" />
                            ) : (
                              <Play size={16} className="text-white" />
                            )}
                          </div>
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-medium truncate">
                              {track.title}
                            </h4>
                            {getAccessTypeBadge(track.accessType)}
                          </div>
                          <p className="text-white/60 text-sm truncate">
                            {track.artist} {track.album && `• ${track.album}`}
                          </p>
                          {track.metadata?.genre && (
                            <p className="text-white/40 text-xs mt-1">
                              {track.metadata.genre} • {track.metadata.year}
                            </p>
                          )}
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-3 text-white/60">
                          <Clock size={14} />
                          <span className="text-sm font-mono">
                            {formatDuration(track.duration)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLikeTrack(track.id);
                            }}
                            className="h-8 w-8 p-0 text-white/60 hover:text-red-400"
                          >
                            <Heart size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 p-0 text-white/60 hover:text-figma-purple"
                          >
                            <Plus size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 p-0 text-white/60 hover:text-figma-purple"
                          >
                            <MoreHorizontal size={14} />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredTracks.length === 0 && (
                  <div className="text-center py-12">
                    <Music size={48} className="mx-auto mb-4 text-white/40" />
                    <h3 className="text-white font-medium mb-2">No tracks found</h3>
                    <p className="text-white/60 text-sm">
                      {searchQuery ? 'Try a different search term' : 'Your music library is empty'}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Current Playing */}
      {currentTrack && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 left-4 right-4 z-50"
        >
          <Card className="glass-card border-figma-glass-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-figma-sm overflow-hidden bg-white/10">
                  {currentTrack.artwork ? (
                    <img 
                      src={currentTrack.artwork} 
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music size={20} className="text-white/60 m-3" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">
                    {currentTrack.title}
                  </h4>
                  <p className="text-white/60 text-sm truncate">
                    {currentTrack.artist}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTrackPlayPause(currentTrack)}
                    disabled={isLoading}
                    className="h-10 w-10 p-0 text-white hover:text-figma-purple"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : isPlaying ? (
                      <Pause size={20} />
                    ) : (
                      <Play size={20} />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/20 border border-red-500/30 rounded-figma-md"
        >
          <p className="text-red-400 text-sm">{error}</p>
          <Button
            onClick={clearError}
            variant="ghost"
            size="sm"
            className="mt-2 text-red-300 hover:text-red-200"
          >
            Dismiss
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default PersistentMusicLibrary;