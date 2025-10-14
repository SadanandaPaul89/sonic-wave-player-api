/**
 * Sonic Wave Music Library Browser
 * Browse, search, and manage the complete music library
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Music, 
  Play, 
  Pause,
  Heart,
  Clock,
  TrendingUp,
  Upload,
  Filter,
  Grid,
  List,
  User,
  Disc,
  Tag,
  Calendar
} from 'lucide-react';

import { SonicWaveTrack, sonicWaveMusicLibrary } from '@/services/sonicWaveMusicLibrary';
import SonicWavePlayer from './SonicWavePlayer';

interface SonicWaveLibraryProps {
  onTrackSelect?: (track: SonicWaveTrack) => void;
  className?: string;
}

const SonicWaveLibrary: React.FC<SonicWaveLibraryProps> = ({
  onTrackSelect,
  className = ''
}) => {
  // Library state
  const [allTracks, setAllTracks] = useState<SonicWaveTrack[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<SonicWaveTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<SonicWaveTrack | undefined>();
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter state
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedArtist, setSelectedArtist] = useState<string>('');

  // Load library on mount
  useEffect(() => {
    loadLibrary();
  }, []);

  // Filter tracks when search or filters change
  useEffect(() => {
    filterTracks();
  }, [searchQuery, selectedGenre, selectedArtist, allTracks, activeTab]);

  const loadLibrary = async () => {
    setIsLoading(true);
    try {
      await sonicWaveMusicLibrary.initializeLibrary();
      const tracks = sonicWaveMusicLibrary.getAllTracks();
      setAllTracks(tracks);
      setFilteredTracks(tracks);
    } catch (error) {
      console.error('Error loading library:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTracks = () => {
    let tracks = allTracks;

    // Filter by tab
    switch (activeTab) {
      case 'recent':
        tracks = sonicWaveMusicLibrary.getRecentlyUploadedTracks();
        break;
      case 'popular':
        tracks = sonicWaveMusicLibrary.getMostPlayedTracks();
        break;
      case 'played':
        tracks = sonicWaveMusicLibrary.getRecentlyPlayedTracks();
        break;
      default:
        tracks = allTracks;
    }

    // Apply search filter
    if (searchQuery) {
      tracks = sonicWaveMusicLibrary.searchTracks(searchQuery);
    }

    // Apply genre filter
    if (selectedGenre) {
      tracks = tracks.filter(track => track.genre === selectedGenre);
    }

    // Apply artist filter
    if (selectedArtist) {
      tracks = tracks.filter(track => track.artist === selectedArtist);
    }

    setFilteredTracks(tracks);
  };

  const handleTrackSelect = (track: SonicWaveTrack) => {
    setSelectedTrack(track);
    onTrackSelect?.(track);
  };

  const getUniqueGenres = (): string[] => {
    const genres = allTracks
      .filter(track => track.genre)
      .map(track => track.genre!)
      .filter((genre, index, array) => array.indexOf(genre) === index);
    return genres.sort();
  };

  const getUniqueArtists = (): string[] => {
    const artists = allTracks
      .map(track => track.artist)
      .filter((artist, index, array) => array.indexOf(artist) === index);
    return artists.sort();
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const libraryStats = sonicWaveMusicLibrary.getLibraryStats();

  if (isLoading) {
    return (
      <Card className={`glass-card border-figma-glass-border ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="w-8 h-8 bg-white/20 rounded-full mx-auto mb-4" />
          <p className="text-white/60">Loading music library...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Library Stats */}
      <Card className="glass-card border-figma-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Music className="h-5 w-5" />
            Sonic Wave Music Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{libraryStats.totalTracks}</div>
              <div className="text-sm text-white/60">Tracks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{libraryStats.uniqueArtists}</div>
              <div className="text-sm text-white/60">Artists</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{libraryStats.uniqueAlbums}</div>
              <div className="text-sm text-white/60">Albums</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {(libraryStats.totalSize / (1024 * 1024)).toFixed(1)}
              </div>
              <div className="text-sm text-white/60">MB Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="glass-card border-figma-glass-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search tracks, artists, albums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
              >
                <option value="">All Genres</option>
                {getUniqueGenres().map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>

              <select
                value={selectedArtist}
                onChange={(e) => setSelectedArtist(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
              >
                <option value="">All Artists</option>
                {getUniqueArtists().map(artist => (
                  <option key={artist} value={artist}>{artist}</option>
                ))}
              </select>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Library Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-white/10">
          <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <Music className="h-4 w-4 mr-2" />
            All Tracks
          </TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <Clock className="h-4 w-4 mr-2" />
            Recent
          </TabsTrigger>
          <TabsTrigger value="popular" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <TrendingUp className="h-4 w-4 mr-2" />
            Popular
          </TabsTrigger>
          <TabsTrigger value="played" className="data-[state=active]:bg-white data-[state=active]:text-black">
            <Heart className="h-4 w-4 mr-2" />
            Recently Played
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredTracks.length === 0 ? (
            <Card className="glass-card border-figma-glass-border">
              <CardContent className="p-12 text-center">
                <Music className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No tracks found</h3>
                <p className="text-white/60 mb-4">
                  {searchQuery ? 'Try adjusting your search terms' : 'Upload some music to get started'}
                </p>
                <Button className="bg-white text-black">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Music
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
                {filteredTracks.map((track, index) => (
                  <div key={track.id}>
                    {viewMode === 'grid' ? (
                      <Card 
                        className="glass-card border-figma-glass-border cursor-pointer"
                        onClick={() => handleTrackSelect(track)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Artwork */}
                            {track.artworkFile ? (
                              <img
                                src={track.artworkFile.url}
                                alt={`${track.title} artwork`}
                                className="w-12 h-12 object-cover rounded border border-white/20"
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik0xNiAxNkgzMlYzMkgxNlYxNloiIGZpbGw9IiM2NjYiLz4KPC9zdmc+';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-white/10 rounded border border-white/20 flex items-center justify-center">
                                <Music className="h-5 w-5 text-white/40" />
                              </div>
                            )}

                            {/* Track Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium text-sm truncate">{track.title}</h4>
                              <p className="text-white/60 text-xs truncate">{track.artist}</p>
                              {track.album && (
                                <p className="text-white/40 text-xs truncate">{track.album}</p>
                              )}
                              
                              {/* Metadata */}
                              <div className="flex items-center gap-2 mt-2">
                                {track.genre && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {track.genre}
                                  </Badge>
                                )}
                                {track.playCount > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Play className="h-3 w-3 mr-1" />
                                    {track.playCount}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Play Button */}
                            <Button
                              size="sm"
                              className="bg-white text-black"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrackSelect(track);
                              }}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card 
                        className="glass-card border-figma-glass-border cursor-pointer"
                        onClick={() => handleTrackSelect(track)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            {/* Artwork */}
                            {track.artworkFile ? (
                              <img
                                src={track.artworkFile.url}
                                alt={`${track.title} artwork`}
                                className="w-10 h-10 object-cover rounded border border-white/20"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-white/10 rounded border border-white/20 flex items-center justify-center">
                                <Music className="h-4 w-4 text-white/40" />
                              </div>
                            )}

                            {/* Track Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-white font-medium text-sm truncate">{track.title}</h4>
                                  <p className="text-white/60 text-xs truncate">{track.artist}</p>
                                </div>
                                
                                <div className="flex items-center gap-4 text-xs text-white/40">
                                  {track.album && <span className="truncate max-w-24">{track.album}</span>}
                                  {track.genre && <span>{track.genre}</span>}
                                  <span>{formatFileSize(track.audioFile.size)}</span>
                                  {track.playCount > 0 && <span>{track.playCount} plays</span>}
                                </div>

                                <Button
                                  size="sm"
                                  className="bg-white text-black ml-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTrackSelect(track);
                                  }}
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Current Player */}
      {selectedTrack && (
        <SonicWavePlayer
          track={selectedTrack}
          playlist={filteredTracks}
          autoPlay={true}
          onTrackChange={(track) => setSelectedTrack(track)}
        />
      )}
    </div>
  );
};

export default SonicWaveLibrary;