
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Upload, Music, Globe, RefreshCw, Bug, Search, Filter, SortAsc, SortDesc, Grid, List } from 'lucide-react';
import SonicWaveLibrary from '@/components/SonicWaveLibrary';
import TrackList from '@/components/TrackList';
import { sonicWaveMusicLibrary } from '@/services/sonicWaveMusicLibrary';
import { musicService } from '@/services/musicService';
import { pinataLibraryService } from '@/services/pinataLibraryService';
import { Track } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import PinataDebugger from '@/components/PinataDebugger';
import AnimationWrapper from '@/components/AnimationWrapper';
import LoadingSkeleton, { ListItemSkeleton } from '@/components/LoadingSkeleton';

type SortOption = 'name' | 'artist' | 'date' | 'plays' | 'likes';
type ViewMode = 'list' | 'grid';

const Library = () => {
  const [libraryStats, setLibraryStats] = useState<any>(null);
  const [pinataTracks, setPinataTracks] = useState<Track[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pinata' | 'uploads' | 'debug'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const initializeLibrary = async () => {
      setIsLoading(true);
      try {
        // Initialize all libraries
        await Promise.all([
          sonicWaveMusicLibrary.initializeLibrary(),
          pinataLibraryService.getAllTracks()
        ]);
        
        // Get stats and tracks
        const stats = sonicWaveMusicLibrary.getLibraryStats();
        const pinataMusic = await pinataLibraryService.getAllTracks();
        const allMusic = await musicService.getAllTracks();
        
        setLibraryStats(stats);
        setPinataTracks(pinataMusic);
        setAllTracks(allMusic);
      } catch (error) {
        console.error('Error initializing library:', error);
        toast({
          title: "Error",
          description: "Failed to load music library",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeLibrary();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await musicService.refreshPinataLibrary();
      const pinataMusic = await pinataLibraryService.getAllTracks();
      const allMusic = await musicService.getAllTracks();
      
      setPinataTracks(pinataMusic);
      setAllTracks(allMusic);
      
      toast({
        title: "Success",
        description: "Music library refreshed successfully"
      });
    } catch (error) {
      console.error('Error refreshing library:', error);
      toast({
        title: "Error",
        description: "Failed to refresh music library",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getDisplayTracks = () => {
    let tracks: Track[] = [];
    
    switch (activeTab) {
      case 'pinata':
        tracks = pinataTracks;
        break;
      case 'uploads':
        tracks = allTracks.filter(track => track.artistName === 'You' || track.id.includes('user-'));
        break;
      case 'debug':
        return [];
      default:
        tracks = allTracks;
    }

    // Apply search filter
    if (searchQuery) {
      tracks = tracks.filter(track => 
        track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (track.albumName && track.albumName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply sorting
    tracks = [...tracks].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'artist':
          aValue = a.artistName.toLowerCase();
          bValue = b.artistName.toLowerCase();
          break;
        case 'date':
          aValue = new Date((a as any).created_at || 0).getTime();
          bValue = new Date((b as any).created_at || 0).getTime();
          break;
        case 'plays':
          aValue = (a as any).play_count || 0;
          bValue = (b as any).play_count || 0;
          break;
        case 'likes':
          aValue = (a as any).like_count || 0;
          bValue = (b as any).like_count || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      }
    });

    return tracks;
  };

  if (isLoading) {
    return (
      <AnimationWrapper animation="fadeIn" className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <LoadingSkeleton variant="text" className="w-64 h-8" />
              <LoadingSkeleton variant="text" className="w-48 h-4" />
            </div>
            <LoadingSkeleton variant="rounded" className="w-32 h-10" />
          </div>
          <LoadingSkeleton variant="rounded" className="w-full h-16" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </AnimationWrapper>
    );
  }

  return (
    <AnimationWrapper animation="fadeIn" className="space-y-6">
      {/* Header Section */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold text-white">Your Music Library</h1>
          <div className="flex items-center gap-4 text-sm">
            <motion.p 
              className="text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {allTracks.length} total tracks • {pinataTracks.length} from Pinata
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white transition-all duration-300 hover:bg-white/10"
              >
                <RefreshCw size={14} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </motion.div>
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/publish">
            <Button className="bg-figma-purple hover:bg-figma-purple/80 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-figma-purple/25">
              <Upload className="h-4 w-4 mr-2" />
              Upload Music
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Library Tabs */}
      <motion.div 
        className="glass-card p-1 rounded-figma-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex flex-wrap gap-1">
          {[
            { key: 'all', label: 'All Music', count: allTracks.length, icon: Music },
            { key: 'pinata', label: 'Pinata IPFS', count: pinataTracks.length, icon: Globe },
            { key: 'uploads', label: 'Your Uploads', count: allTracks.filter(t => t.artistName === 'You' || t.id.includes('user-')).length, icon: Upload },
            { key: 'debug', label: 'Debug', count: null, icon: Bug }
          ].map(({ key, label, count, icon: Icon }, index) => (
            <motion.button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 py-2 px-4 rounded-figma-md relative transition-all duration-300 ${
                activeTab === key
                  ? 'bg-figma-purple text-white shadow-lg shadow-figma-purple/25'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon size={16} />
              <span className="font-medium">{label}</span>
              {count !== null && count > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <Badge variant="secondary" className={`${
                    activeTab === key 
                      ? 'bg-white/20 text-white' 
                      : 'bg-white/10 text-white/80'
                  } transition-all duration-300`}>
                    {count}
                  </Badge>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Search and Filter Controls */}
      <motion.div 
        className="glass-card p-4 rounded-figma-lg space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search tracks, artists, albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-figma-md text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-figma-purple focus:border-transparent transition-all duration-300"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Sort Controls */}
            <div className="flex items-center gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-white/10 border border-white/20 rounded-figma-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-figma-purple transition-all duration-300"
              >
                <option value="name" className="bg-gray-800">Name</option>
                <option value="artist" className="bg-gray-800">Artist</option>
                <option value="date" className="bg-gray-800">Date Added</option>
                <option value="plays" className="bg-gray-800">Plays</option>
                <option value="likes" className="bg-gray-800">Likes</option>
              </select>
              
              <Button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300"
              >
                {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              </Button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/10 rounded-figma-md p-1">
              <Button
                onClick={() => setViewMode('list')}
                variant="ghost"
                size="sm"
                className={`p-2 transition-all duration-300 ${
                  viewMode === 'list' 
                    ? 'bg-figma-purple text-white shadow-sm' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <List size={16} />
              </Button>
              <Button
                onClick={() => setViewMode('grid')}
                variant="ghost"
                size="sm"
                className={`p-2 transition-all duration-300 ${
                  viewMode === 'grid' 
                    ? 'bg-figma-purple text-white shadow-sm' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Grid size={16} />
              </Button>
            </div>

            {/* Filter Toggle */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="ghost"
              size="sm"
              className={`text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 ${
                showFilters ? 'bg-white/10 text-white' : ''
              }`}
            >
              <Filter size={16} />
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-white/10 pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Genre</label>
                  <select className="w-full bg-white/10 border border-white/20 rounded-figma-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-figma-purple">
                    <option value="" className="bg-gray-800">All Genres</option>
                    <option value="electronic" className="bg-gray-800">Electronic</option>
                    <option value="rock" className="bg-gray-800">Rock</option>
                    <option value="pop" className="bg-gray-800">Pop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Duration</label>
                  <select className="w-full bg-white/10 border border-white/20 rounded-figma-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-figma-purple">
                    <option value="" className="bg-gray-800">Any Duration</option>
                    <option value="short" className="bg-gray-800">Under 3 min</option>
                    <option value="medium" className="bg-gray-800">3-5 min</option>
                    <option value="long" className="bg-gray-800">Over 5 min</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Date Range</label>
                  <select className="w-full bg-white/10 border border-white/20 rounded-figma-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-figma-purple">
                    <option value="" className="bg-gray-800">All Time</option>
                    <option value="today" className="bg-gray-800">Today</option>
                    <option value="week" className="bg-gray-800">This Week</option>
                    <option value="month" className="bg-gray-800">This Month</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Pinata Gateway Info */}
      {activeTab === 'pinata' && pinataTracks.length > 0 && (
        <motion.div 
          className="bg-green-500/10 border border-green-500/20 rounded-figma-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Globe size={16} className="text-green-400" />
            <span className="text-green-400 font-medium">Pinata IPFS Gateway</span>
          </div>
          <p className="text-white/70 text-sm">
            Music files are served from: <code className="bg-white/10 px-2 py-1 rounded text-green-400">silver-changing-rook-174.mypinata.cloud</code>
          </p>
        </motion.div>
      )}

      {/* Track List or Debug Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${searchQuery}-${sortBy}-${sortOrder}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="glass-card rounded-figma-lg overflow-hidden"
        >
          {activeTab === 'debug' ? (
            <div className="p-6">
              <PinataDebugger />
            </div>
          ) : getDisplayTracks().length > 0 ? (
            <div className="p-6">
              {/* Results Header */}
              <motion.div 
                className="flex items-center justify-between mb-6 pb-4 border-b border-white/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-white">
                    {getDisplayTracks().length} track{getDisplayTracks().length !== 1 ? 's' : ''}
                  </h3>
                  {searchQuery && (
                    <Badge variant="secondary" className="bg-figma-purple/20 text-figma-purple">
                      Filtered by: "{searchQuery}"
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-white/60">
                  Sorted by {sortBy} ({sortOrder === 'asc' ? 'ascending' : 'descending'})
                </div>
              </motion.div>

              {/* Track List with Staggered Animation */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05
                    }
                  }
                }}
              >
                <TrackList tracks={getDisplayTracks()} showHeader={false} />
              </motion.div>
            </div>
          ) : (
            <motion.div 
              className="text-center py-16 px-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <Music size={64} className="text-white/20 mx-auto mb-6" />
              </motion.div>
              
              <motion.h3 
                className="text-white/60 text-xl mb-3 font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {searchQuery ? 'No matching tracks found' : 'No tracks found'}
              </motion.h3>
              
              <motion.p 
                className="text-white/40 text-sm mb-8 max-w-md mx-auto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {searchQuery 
                  ? `No tracks match your search for "${searchQuery}". Try adjusting your search terms or filters.`
                  : activeTab === 'pinata' 
                  ? 'No tracks found in your Pinata IPFS storage'
                  : activeTab === 'uploads'
                  ? 'You haven\'t uploaded any tracks yet'
                  : 'Your music library is empty'
                }
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {searchQuery ? (
                  <Button 
                    onClick={() => setSearchQuery('')}
                    className="bg-figma-purple hover:bg-figma-purple/80 transition-all duration-300 hover:scale-105"
                  >
                    Clear Search
                  </Button>
                ) : (
                  <Link to="/publish">
                    <Button className="bg-figma-purple hover:bg-figma-purple/80 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-figma-purple/25">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Your First Track
                    </Button>
                  </Link>
                )}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Sonic Wave Library Component (for additional functionality) */}
      {activeTab === 'uploads' && (
        <motion.div 
          className="glass-card p-6 rounded-figma-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <motion.h3 
            className="text-xl font-bold text-white mb-6 flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1 }}
          >
            <Upload size={20} className="text-figma-purple" />
            Sonic Wave Uploads
          </motion.h3>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <SonicWaveLibrary />
          </motion.div>
        </motion.div>
      )}
    </AnimationWrapper>
  );
};

export default Library;
