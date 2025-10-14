
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchContent, Artist, Album, Track } from '@/services/supabaseService';
import { mockSearchContent, MockTrack, MockArtist, MockAlbum } from '@/services/mockSearchService';
import { musicService } from '@/services/musicService';
import { Filter, Music, User, Disc, Search as SearchIcon, Globe, Zap, X, TrendingUp } from 'lucide-react';
import TrackList from '@/components/TrackList';
import CardGrid from '@/components/CardGrid';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ScrollAnimation } from '@/components/ScrollAnimation';

interface SearchFilters {
  genre: string;
  year: string;
  duration: string;
  sortBy: string;
}

const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<{
    tracks: (Track | MockTrack)[];
    artists: (Artist | MockArtist)[];
    albums: (Album | MockAlbum)[];
  }>({
    tracks: [],
    artists: [],
    albums: []
  });
  
  const [activeTab, setActiveTab] = useState<'all' | 'tracks' | 'artists' | 'albums'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    genre: 'all',
    year: 'all',
    duration: 'all',
    sortBy: 'relevance'
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBarControls = useAnimation();
  const resultsControls = useAnimation();

  useEffect(() => {
    setQuery(initialQuery);
    setInputValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      performSearch();
      // Animate search bar when searching
      searchBarControls.start({
        scale: [1, 1.02, 1],
        transition: { duration: 0.3 }
      });
    } else {
      // Clear results if query is too short
      setSearchResults({ tracks: [], artists: [], albums: [] });
    }
  }, [query, filters]);

  // Debounced search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== query) {
        setQuery(inputValue);
        if (inputValue.length >= 2) {
          // Update URL
          setSearchParams({ q: inputValue });
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);



  const performSearch = async () => {
    if (query.length < 2) return;

    setIsSearching(true);
    
    // Animate results area
    resultsControls.start({
      opacity: [1, 0.5, 1],
      transition: { duration: 0.5 }
    });

    try {
      // Search IPFS tracks first
      let ipfsTracks: Track[] = [];
      try {
        ipfsTracks = await musicService.searchTracks(query);
        console.log('Found IPFS tracks:', ipfsTracks.length);
      } catch (error) {
        console.log('IPFS search failed:', error);
      }

      // Try real search, fallback to mock data
      let tracks, artists, albums;
      
      try {
        // Get more results for filtering
        [tracks, artists, albums] = await Promise.all([
          searchContent(query, 'track', 50),
          searchContent(query, 'artist', 20),
          searchContent(query, 'album', 20)
        ]);
      } catch (error) {
        console.log('Using mock data for search');
        // Fallback to mock data
        [tracks, artists, albums] = await Promise.all([
          mockSearchContent(query, 'track', 50),
          mockSearchContent(query, 'artist', 20),
          mockSearchContent(query, 'album', 20)
        ]);
      }

      // Combine IPFS tracks with traditional tracks
      const allTracks = [...ipfsTracks, ...tracks];

      // Apply filters
      const filteredResults = {
        tracks: applyFilters(allTracks, 'tracks'),
        artists: applyFilters(artists, 'artists'),
        albums: applyFilters(albums, 'albums')
      };

      setSearchResults(filteredResults);
      
      // Save to recent searches
      if (query.trim()) {
        const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Search error:', error);
      // Set empty results on error
      setSearchResults({ tracks: [], artists: [], albums: [] });
    } finally {
      setIsSearching(false);
    }
  };

  const applyFilters = (items: any[], type: string) => {
    let filtered = [...items];

    // Apply genre filter
    if (filters.genre !== 'all') {
      filtered = filtered.filter(item => 
        item.genre?.toLowerCase().includes(filters.genre.toLowerCase())
      );
    }

    // Apply year filter
    if (filters.year !== 'all') {
      filtered = filtered.filter(item => {
        const itemYear = new Date(item.created_at || item.release_date).getFullYear();
        if (filters.year === '2024') return itemYear === 2024;
        if (filters.year === '2023') return itemYear === 2023;
        if (filters.year === '2020s') return itemYear >= 2020;
        if (filters.year === '2010s') return itemYear >= 2010 && itemYear < 2020;
        return true;
      });
    }

    // Apply duration filter for tracks
    if (type === 'tracks' && filters.duration !== 'all') {
      filtered = filtered.filter(item => {
        const duration = item.duration || 0;
        if (filters.duration === 'short') return duration < 180; // < 3 minutes
        if (filters.duration === 'medium') return duration >= 180 && duration < 300; // 3-5 minutes
        if (filters.duration === 'long') return duration >= 300; // > 5 minutes
        return true;
      });
    }

    // Apply sorting
    if (filters.sortBy === 'name') {
      filtered.sort((a, b) => (a.name || a.title || '').localeCompare(b.name || b.title || ''));
    } else if (filters.sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.created_at || b.release_date || 0).getTime() - new Date(a.created_at || a.release_date || 0).getTime());
    } else if (filters.sortBy === 'popularity') {
      filtered.sort((a, b) => (b.play_count || 0) - (a.play_count || 0));
    }

    return filtered;
  };

  const resetFilters = () => {
    setFilters({
      genre: 'all',
      year: 'all',
      duration: 'all',
      sortBy: 'relevance'
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== 'all' && value !== 'relevance').length;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setQuery(inputValue.trim());
      setSearchParams({ q: inputValue.trim() });
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setQuery(suggestion);
    setSearchParams({ q: suggestion });
    setShowSuggestions(false);
    searchInputRef.current?.blur();
  };

  const clearSearch = () => {
    setInputValue('');
    setQuery('');
    setSearchParams({});
    setSearchResults({ tracks: [], artists: [], albums: [] });
    searchInputRef.current?.focus();
  };

  const handleTabChange = (newTab: 'all' | 'tracks' | 'artists' | 'albums') => {
    setActiveTab(newTab);
    // Animate tab transition
    resultsControls.start({
      y: [10, 0],
      opacity: [0, 1],
      transition: { duration: 0.3 }
    });
  };

  return (
    <div className="pb-20 px-4 sm:px-6">
      <ScrollAnimation animation="fadeIn" delay={0.1}>
        <div className="sticky top-0 bg-gradient-to-br from-figma-bg-start to-figma-bg-end z-10 pt-2 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
          {/* Enhanced Search Input */}
          <motion.div 
            className="mb-6 relative"
            animate={searchBarControls}
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <motion.div
                className="relative"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <SearchIcon 
                  size={20} 
                  className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                    searchFocused ? 'text-figma-purple' : 'text-white/40'
                  }`} 
                />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for songs, artists, albums..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => {
                    setSearchFocused(true);
                    setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    setSearchFocused(false);
                    // Delay hiding suggestions to allow clicks
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  className={`w-full pl-12 pr-12 py-4 bg-white/10 border-2 rounded-figma-lg text-white placeholder-white/40 transition-all duration-300 ${
                    searchFocused 
                      ? 'border-figma-purple bg-white/15 shadow-lg shadow-figma-purple/20' 
                      : 'border-white/20 hover:border-white/30'
                  }`}
                />
                {inputValue && (
                  <motion.button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors duration-200"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={18} />
                  </motion.button>
                )}
              </motion.div>
            </form>

            {/* Search Suggestions */}
            <AnimatePresence>
              {showSuggestions && (searchFocused || inputValue.length === 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-figma-card backdrop-blur-xl border border-white/10 rounded-figma-lg shadow-xl z-50"
                >
                  {recentSearches.length > 0 && (
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={16} className="text-white/60" />
                        <span className="text-white/60 text-sm font-medium">Recent searches</span>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <motion.button
                            key={search}
                            onClick={() => handleSuggestionClick(search)}
                            className="w-full text-left px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-figma-sm transition-all duration-200"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ x: 4 }}
                          >
                            {search}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Popular searches when no recent searches */}
                  {recentSearches.length === 0 && (
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={16} className="text-white/60" />
                        <span className="text-white/60 text-sm font-medium">Popular searches</span>
                      </div>
                      <div className="space-y-1">
                        {['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical'].map((genre, index) => (
                          <motion.button
                            key={genre}
                            onClick={() => handleSuggestionClick(genre)}
                            className="w-full text-left px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-figma-sm transition-all duration-200"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ x: 4 }}
                          >
                            {genre}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Search Results Header */}
          {query && (
            <motion.div 
              className="mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-2xl font-bold text-white mb-2">
                Search results for "{query}"
              </h1>
              <p className="text-white/60 text-sm">
                Found {searchResults.tracks.length + searchResults.artists.length + searchResults.albums.length} results
              </p>
            </motion.div>
          )}

          {/* Filters */}
          {query.length >= 2 && (
            <motion.div 
              className="flex items-center gap-4 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-figma-sm transition-all duration-200"
                >
                  <motion.div
                    animate={{ rotate: showFilters ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Filter size={16} className="mr-2" />
                  </motion.div>
                  Filters
                  {getActiveFilterCount() > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-2"
                    >
                      <Badge variant="secondary" className="bg-figma-purple text-white">
                        {getActiveFilterCount()}
                      </Badge>
                    </motion.div>
                  )}
                </Button>
              </motion.div>
              
              {getActiveFilterCount() > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-white/60 hover:text-white hover:bg-white/10 rounded-figma-sm transition-all duration-200"
                  >
                    Clear filters
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && query.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="mb-4 p-4 bg-white/5 rounded-figma-md backdrop-blur-sm border border-white/10 overflow-hidden"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="text-white/70 text-sm mb-2 block">Genre</label>
                    <Select value={filters.genre} onValueChange={(value) => setFilters({...filters, genre: value})}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-all duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Genres</SelectItem>
                        <SelectItem value="pop">Pop</SelectItem>
                        <SelectItem value="rock">Rock</SelectItem>
                        <SelectItem value="hip-hop">Hip Hop</SelectItem>
                        <SelectItem value="electronic">Electronic</SelectItem>
                        <SelectItem value="jazz">Jazz</SelectItem>
                        <SelectItem value="classical">Classical</SelectItem>
                        <SelectItem value="country">Country</SelectItem>
                        <SelectItem value="r&b">R&B</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="text-white/70 text-sm mb-2 block">Year</label>
                    <Select value={filters.year} onValueChange={(value) => setFilters({...filters, year: value})}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-all duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2020s">2020s</SelectItem>
                        <SelectItem value="2010s">2010s</SelectItem>
                        <SelectItem value="2000s">2000s</SelectItem>
                        <SelectItem value="90s">90s</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="text-white/70 text-sm mb-2 block">Duration</label>
                    <Select value={filters.duration} onValueChange={(value) => setFilters({...filters, duration: value})}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-all duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Length</SelectItem>
                        <SelectItem value="short">Short (&lt; 3 min)</SelectItem>
                        <SelectItem value="medium">Medium (3-5 min)</SelectItem>
                        <SelectItem value="long">Long (&gt; 5 min)</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="text-white/70 text-sm mb-2 block">Sort By</label>
                    <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-all duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="date">Date Added</SelectItem>
                        <SelectItem value="popularity">Popularity</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          {query.length >= 2 && (
            <motion.div 
              className="flex space-x-1 border-b border-white/10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {[
                { key: 'all', label: 'All', icon: Music },
                { key: 'tracks', label: 'Tracks', icon: Music },
                { key: 'artists', label: 'Artists', icon: User },
                { key: 'albums', label: 'Albums', icon: Disc }
              ].map(({ key, label, icon: Icon }, index) => (
                <motion.button
                  key={key}
                  onClick={() => handleTabChange(key as any)}
                  className={`flex items-center gap-2 pb-3 px-4 relative transition-all duration-300 ${
                    activeTab === key
                      ? 'text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <Icon size={16} />
                  {label}
                  {activeTab === key && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-figma-purple"
                      layoutId="activeTab"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      </ScrollAnimation>

      {/* Search Results */}
      <motion.div animate={resultsControls}>
        {isSearching ? (
          <ScrollAnimation animation="fadeIn" delay={0.2}>
            <div className="flex flex-col items-center justify-center h-40">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-figma-purple border-t-transparent rounded-full mb-4"
              />
              <motion.div 
                className="text-white/60"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Searching...
              </motion.div>
            </div>
          </ScrollAnimation>
      ) : query.length < 2 ? (
        <ScrollAnimation animation="slideUp" delay={0.3}>
          <div className="mt-16 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-24 h-24 mx-auto mb-6 bg-figma-purple/20 rounded-full flex items-center justify-center"
            >
              <SearchIcon size={32} className="text-figma-purple" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Search for music</h2>
            <p className="text-white/60">Find your favorite songs, artists, albums, and playlists</p>
            
            {/* Popular searches */}
            <div className="mt-8">
              <p className="text-white/40 text-sm mb-4">Popular searches</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz'].map((genre) => (
                  <Button
                    key={genre}
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuery(genre)}
                    className="bg-white/10 text-white/80 hover:bg-white/20 hover:text-white rounded-full"
                  >
                    {genre}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollAnimation>
      ) : (
        <div className="mt-6 space-y-8">
          {/* Tracks Section */}
          {(activeTab === 'all' || activeTab === 'tracks') && searchResults.tracks.length > 0 && (
            <ScrollAnimation animation="slideUp" delay={0.2}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div 
                  className="flex items-center gap-3 mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Music size={20} className="text-figma-purple" />
                  <h2 className="text-xl font-bold text-white">Tracks</h2>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <Badge variant="secondary" className="bg-white/10 text-white/80">
                      {searchResults.tracks.length}
                    </Badge>
                  </motion.div>
                </motion.div>
                <TrackList tracks={searchResults.tracks.slice(0, activeTab === 'all' ? 5 : undefined) as Track[]} />
                {activeTab === 'all' && searchResults.tracks.length > 5 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => handleTabChange('tracks')}
                      className="mt-4 text-figma-purple hover:text-figma-purple hover:bg-figma-purple/20 transition-all duration-200"
                    >
                      Show all {searchResults.tracks.length} tracks
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </ScrollAnimation>
          )}

          {/* Artists Section */}
          {(activeTab === 'all' || activeTab === 'artists') && searchResults.artists.length > 0 && (
            <ScrollAnimation animation="slideUp" delay={0.3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <motion.div 
                  className="flex items-center gap-3 mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <User size={20} className="text-figma-purple" />
                  <h2 className="text-xl font-bold text-white">Artists</h2>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <Badge variant="secondary" className="bg-white/10 text-white/80">
                      {searchResults.artists.length}
                    </Badge>
                  </motion.div>
                </motion.div>
                <CardGrid
                  title=""
                  cards={searchResults.artists.slice(0, activeTab === 'all' ? 5 : undefined).map(artist => ({
                    id: artist.id,
                    name: artist.name,
                    imageUrl: artist.image,
                    type: 'artist' as const,
                  }))}
                  cols={activeTab === 'all' ? 5 : 6}
                />
                {activeTab === 'all' && searchResults.artists.length > 5 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => handleTabChange('artists')}
                      className="mt-4 text-figma-purple hover:text-figma-purple hover:bg-figma-purple/20 transition-all duration-200"
                    >
                      Show all {searchResults.artists.length} artists
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </ScrollAnimation>
          )}

          {/* Albums Section */}
          {(activeTab === 'all' || activeTab === 'albums') && searchResults.albums.length > 0 && (
            <ScrollAnimation animation="slideUp" delay={0.4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <motion.div 
                  className="flex items-center gap-3 mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Disc size={20} className="text-figma-purple" />
                  <h2 className="text-xl font-bold text-white">Albums</h2>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <Badge variant="secondary" className="bg-white/10 text-white/80">
                      {searchResults.albums.length}
                    </Badge>
                  </motion.div>
                </motion.div>
                <CardGrid
                  title=""
                  cards={searchResults.albums.slice(0, activeTab === 'all' ? 5 : undefined).map(album => ({
                    id: album.id,
                    name: album.name,
                    description: album.artistName,
                    imageUrl: album.image,
                    type: 'album' as const,
                  }))}
                  cols={activeTab === 'all' ? 5 : 6}
                />
                {activeTab === 'all' && searchResults.albums.length > 5 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => handleTabChange('albums')}
                      className="mt-4 text-figma-purple hover:text-figma-purple hover:bg-figma-purple/20 transition-all duration-200"
                    >
                      Show all {searchResults.albums.length} albums
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </ScrollAnimation>
          )}

          {/* No Results */}
          {((activeTab === 'tracks' && searchResults.tracks.length === 0) ||
            (activeTab === 'artists' && searchResults.artists.length === 0) ||
            (activeTab === 'albums' && searchResults.albums.length === 0) ||
            (activeTab === 'all' &&
              searchResults.tracks.length === 0 &&
              searchResults.artists.length === 0 &&
              searchResults.albums.length === 0)) && (
            <ScrollAnimation animation="fadeIn" delay={0.2}>
              <div className="mt-16 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center"
                >
                  <SearchIcon size={28} className="text-white/40" />
                </motion.div>
                <h2 className="text-xl font-medium text-white mb-2">No results found for "{query}"</h2>
                <p className="text-white/60 mb-6">Try adjusting your search or filters</p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      onClick={resetFilters}
                      className="text-figma-purple hover:text-figma-purple hover:bg-figma-purple/20 transition-all duration-200"
                    >
                      Clear filters
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      onClick={clearSearch}
                      className="text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                      Clear search
                    </Button>
                  </motion.div>
                </div>
              </div>
            </ScrollAnimation>
          )}
        </div>
      )}
      </motion.div>
    </div>
  );
};

export default Search;
