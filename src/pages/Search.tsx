
import React, { useState, useEffect } from 'react';
import { searchContent, Track, Artist, Album, Playlist, getImageUrl } from '@/services/api';
import { Search as SearchIcon } from 'lucide-react';
import TrackList from '@/components/TrackList';
import CardGrid from '@/components/CardGrid';

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    tracks: Track[];
    artists: Artist[];
    albums: Album[];
    playlists: Playlist[];
  }>({
    tracks: [],
    artists: [],
    albums: [],
    playlists: []
  });
  const [activeTab, setActiveTab] = useState<'all' | 'tracks' | 'artists' | 'albums' | 'playlists'>('all');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (query.length >= 2) {
        performSearch();
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [query]);

  const performSearch = async () => {
    if (query.length < 2) return;

    setIsSearching(true);

    try {
      const [tracks, artists, albums, playlists] = await Promise.all([
        searchContent(query, 'track', 20),
        searchContent(query, 'artist', 10),
        searchContent(query, 'album', 10),
        searchContent(query, 'playlist', 10)
      ]);

      setSearchResults({
        tracks,
        artists,
        albums,
        playlists
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  return (
    <div className="pb-20">
      <div className="sticky top-0 bg-spotify-base z-10 pt-2 pb-4">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="text-gray-400" size={20} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for songs, artists, albums..."
              className="bg-white bg-opacity-10 text-white rounded-full py-3 pl-10 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-spotify-green"
            />
          </div>
        </form>

        {query.length >= 2 && (
          <div className="flex space-x-4 border-b border-spotify-highlight">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-2 px-4 ${
                activeTab === 'all'
                  ? 'text-white border-b-2 border-spotify-green'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('tracks')}
              className={`pb-2 px-4 ${
                activeTab === 'tracks'
                  ? 'text-white border-b-2 border-spotify-green'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Tracks
            </button>
            <button
              onClick={() => setActiveTab('artists')}
              className={`pb-2 px-4 ${
                activeTab === 'artists'
                  ? 'text-white border-b-2 border-spotify-green'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Artists
            </button>
            <button
              onClick={() => setActiveTab('albums')}
              className={`pb-2 px-4 ${
                activeTab === 'albums'
                  ? 'text-white border-b-2 border-spotify-green'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Albums
            </button>
            <button
              onClick={() => setActiveTab('playlists')}
              className={`pb-2 px-4 ${
                activeTab === 'playlists'
                  ? 'text-white border-b-2 border-spotify-green'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Playlists
            </button>
          </div>
        )}
      </div>

      {isSearching ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-gray-400">Searching...</div>
        </div>
      ) : query.length < 2 ? (
        <div className="mt-10 text-center">
          <h2 className="text-2xl font-bold mb-2">Search for music</h2>
          <p className="text-gray-400">Find your favorite songs, artists, albums, and playlists</p>
        </div>
      ) : (
        <div className="mt-6">
          {(activeTab === 'all' || activeTab === 'tracks') && searchResults.tracks.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Tracks</h2>
              <TrackList tracks={searchResults.tracks.slice(0, activeTab === 'all' ? 5 : undefined)} />
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'artists') && searchResults.artists.length > 0 && (
            <CardGrid
              title="Artists"
              cards={searchResults.artists.map(artist => ({
                id: artist.id,
                name: artist.name,
                imageUrl: getImageUrl(artist, 'md'),
                type: 'artist' as const,
              }))}
              cols={activeTab === 'all' ? 5 : 6}
            />
          )}

          {(activeTab === 'all' || activeTab === 'albums') && searchResults.albums.length > 0 && (
            <CardGrid
              title="Albums"
              cards={searchResults.albums.map(album => ({
                id: album.id,
                name: album.name,
                description: album.artistName,
                imageUrl: getImageUrl(album, 'md'),
                type: 'album' as const,
              }))}
              cols={activeTab === 'all' ? 5 : 6}
            />
          )}

          {(activeTab === 'all' || activeTab === 'playlists') && searchResults.playlists.length > 0 && (
            <CardGrid
              title="Playlists"
              cards={searchResults.playlists.map(playlist => ({
                id: playlist.id,
                name: playlist.name,
                description: playlist.description,
                imageUrl: getImageUrl(playlist, 'md'),
                type: 'playlist' as const,
              }))}
              cols={activeTab === 'all' ? 5 : 6}
            />
          )}

          {((activeTab === 'tracks' && searchResults.tracks.length === 0) ||
            (activeTab === 'artists' && searchResults.artists.length === 0) ||
            (activeTab === 'albums' && searchResults.albums.length === 0) ||
            (activeTab === 'playlists' && searchResults.playlists.length === 0) ||
            (activeTab === 'all' &&
              searchResults.tracks.length === 0 &&
              searchResults.artists.length === 0 &&
              searchResults.albums.length === 0 &&
              searchResults.playlists.length === 0)) && (
            <div className="mt-10 text-center">
              <h2 className="text-xl font-medium mb-2">No results found for "{query}"</h2>
              <p className="text-gray-400">Please try different search terms</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
