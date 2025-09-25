
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchContent, Artist, Album, Track } from '@/services/supabaseService';
import { mockSearchContent, MockTrack, MockArtist, MockAlbum } from '@/services/mockSearchService';
import { musicService } from '@/services/musicService';
import { Filter, Music, User, Disc, Search as SearchIcon, Globe, Zap } from 'lucide-react';
import TrackList from '@/components/TrackList';
import CardGrid from '@/components/CardGrid';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollAnimation } from '@/components/ScrollAnimation';

interface SearchFilters {
  genre: string;
  year: string;
  duration: string;
  sortBy: string;
}

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
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
  const [filters, setFilters] = useState<SearchFilters>({
    genre: 'all',
    year: 'all',
    duration: 'all',
    sortBy: 'relevance'
  });

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (query.length >= 2) {
      performSearch();
    } else {
      // Clear results if query is too short
      setSearchResults({ tracks: [], artists: [], albums: [] });
    }
  }, [query, filters]);



  const performSearch = async () => {
    if (query.length < 2) return;

    setIsSearching(true);

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

  return (
    <div className="pb-20 px-4 sm:px-6">
      <ScrollAnimation animation="fadeIn" delay={0.1}>
        <div className="sticky top-0 bg-gradient-to-br from-figma-bg-start to-figma-bg-end z-10 pt-2 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
          {/* Search Results Header */}
          {query && (
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-white mb-2">
                Search results for "{query}"
              </h1>
              <p className="text-white/60 text-sm">
                Found {searchResults.tracks.length + searchResults.artists.length + searchResults.albums.length} results
              </p>
            </div>
          )}

          {/* Filters */}
          {query.length >= 2 && (
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-figma-sm"
              >
                <Filter size={16} className="mr-2" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-figma-purple text-white">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
              
              {getActiveFilterCount() > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-white/60 hover:text-white hover:bg-white/10 rounded-figma-sm"
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && query.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-white/5 rounded-figma-md backdrop-blur-sm border border-white/10"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-white/70 text-sm mb-2 block">Genre</label>
                    <Select value={filters.genre} onValueChange={(value) => setFilters({...filters, genre: value})}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
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
                  </div>

                  <div>
                    <label className="text-white/70 text-sm mb-2 block">Year</label>
                    <Select value={filters.year} onValueChange={(value) => setFilters({...filters, year: value})}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
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
                  </div>

                  <div>
                    <label className="text-white/70 text-sm mb-2 block">Duration</label>
                    <Select value={filters.duration} onValueChange={(value) => setFilters({...filters, duration: value})}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Length</SelectItem>
                        <SelectItem value="short">Short (&lt; 3 min)</SelectItem>
                        <SelectItem value="medium">Medium (3-5 min)</SelectItem>
                        <SelectItem value="long">Long (&gt; 5 min)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-white/70 text-sm mb-2 block">Sort By</label>
                    <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="date">Date Added</SelectItem>
                        <SelectItem value="popularity">Popularity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          {query.length >= 2 && (
            <div className="flex space-x-1 border-b border-white/10">
              {[
                { key: 'all', label: 'All', icon: Music },
                { key: 'tracks', label: 'Tracks', icon: Music },
                { key: 'artists', label: 'Artists', icon: User },
                { key: 'albums', label: 'Albums', icon: Disc }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-2 pb-3 px-4 transition-all duration-300 ${
                    activeTab === key
                      ? 'text-white border-b-2 border-figma-purple'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollAnimation>

      {/* Search Results */}
      {isSearching ? (
        <ScrollAnimation animation="fadeIn" delay={0.2}>
          <div className="flex flex-col items-center justify-center h-40">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-figma-purple border-t-transparent rounded-full mb-4"
            />
            <div className="text-white/60">Searching...</div>
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
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Music size={20} className="text-figma-purple" />
                  <h2 className="text-xl font-bold text-white">Tracks</h2>
                  <Badge variant="secondary" className="bg-white/10 text-white/80">
                    {searchResults.tracks.length}
                  </Badge>
                </div>
                <TrackList tracks={searchResults.tracks.slice(0, activeTab === 'all' ? 5 : undefined)} />
                {activeTab === 'all' && searchResults.tracks.length > 5 && (
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('tracks')}
                    className="mt-4 text-figma-purple hover:text-figma-purple hover:bg-figma-purple/20"
                  >
                    Show all {searchResults.tracks.length} tracks
                  </Button>
                )}
              </div>
            </ScrollAnimation>
          )}

          {/* Artists Section */}
          {(activeTab === 'all' || activeTab === 'artists') && searchResults.artists.length > 0 && (
            <ScrollAnimation animation="slideUp" delay={0.3}>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <User size={20} className="text-figma-purple" />
                  <h2 className="text-xl font-bold text-white">Artists</h2>
                  <Badge variant="secondary" className="bg-white/10 text-white/80">
                    {searchResults.artists.length}
                  </Badge>
                </div>
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
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('artists')}
                    className="mt-4 text-figma-purple hover:text-figma-purple hover:bg-figma-purple/20"
                  >
                    Show all {searchResults.artists.length} artists
                  </Button>
                )}
              </div>
            </ScrollAnimation>
          )}

          {/* Albums Section */}
          {(activeTab === 'all' || activeTab === 'albums') && searchResults.albums.length > 0 && (
            <ScrollAnimation animation="slideUp" delay={0.4}>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Disc size={20} className="text-figma-purple" />
                  <h2 className="text-xl font-bold text-white">Albums</h2>
                  <Badge variant="secondary" className="bg-white/10 text-white/80">
                    {searchResults.albums.length}
                  </Badge>
                </div>
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
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('albums')}
                    className="mt-4 text-figma-purple hover:text-figma-purple hover:bg-figma-purple/20"
                  >
                    Show all {searchResults.albums.length} albums
                  </Button>
                )}
              </div>
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
                  <Button
                    variant="ghost"
                    onClick={resetFilters}
                    className="text-figma-purple hover:text-figma-purple hover:bg-figma-purple/20"
                  >
                    Clear filters
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setQuery('')}
                    className="text-white/60 hover:text-white hover:bg-white/10"
                  >
                    Clear search
                  </Button>
                </div>
              </div>
            </ScrollAnimation>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
