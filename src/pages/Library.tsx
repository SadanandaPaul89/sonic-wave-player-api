
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getAllLocalTracks, clearLocalLibrary, getAllPublishedTracks, getAllArtists } from '@/services/localLibrary';
import SongUploader from '@/components/SongUploader';
import TrackList from '@/components/TrackList';
import { Track, PublishedTrack } from '@/services/api';
import { Music, Plus, File, User, MusicIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Library: React.FC = () => {
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [publishedTracks, setPublishedTracks] = useState<PublishedTrack[]>([]);
  const [hasArtistProfile, setHasArtistProfile] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Get local tracks
    const tracks = getAllLocalTracks();
    setLocalTracks(tracks);
    
    // Get published tracks
    const published = getAllPublishedTracks();
    setPublishedTracks(published);
    
    // Check if user has any artist profiles
    const artists = getAllArtists();
    setHasArtistProfile(artists.length > 0);
  };

  const handleClearLibrary = () => {
    if (window.confirm('Are you sure you want to clear your entire music library? This cannot be undone.')) {
      clearLocalLibrary();
      setLocalTracks([]);
      toast({
        title: "Library cleared",
        description: "Your local music library has been cleared."
      });
    }
  };

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center px-6 py-4">
        <h1 className="text-3xl font-bold">Your Library</h1>
        <div className="flex gap-3">
          <Link to="/publish">
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Publish Music
            </Button>
          </Link>
          {!hasArtistProfile && (
            <Link to="/artist-registration">
              <Button variant="default" size="sm">
                <User className="mr-2 h-4 w-4" />
                Register as Artist
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="my-music" className="w-full">
        <TabsList className="mb-6 px-6">
          <TabsTrigger value="my-music">My Music</TabsTrigger>
          <TabsTrigger value="all-music">Music Catalog</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-music" className="mt-0 px-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Local Music ({localTracks.length})</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowUploader(!showUploader)}
                variant="outline"
                size="sm"
              >
                {showUploader ? 'Hide Uploader' : 'Add Songs'}
                <Plus className="ml-2 h-4 w-4" />
              </Button>
              {localTracks.length > 0 && (
                <Button
                  onClick={handleClearLibrary}
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  Clear Library
                </Button>
              )}
            </div>
          </div>

          {showUploader && (
            <div className="mb-8">
              <SongUploader onUploadComplete={() => {
                loadData();
                setShowUploader(false);
              }} />
            </div>
          )}

          {localTracks.length > 0 ? (
            <TrackList tracks={localTracks} />
          ) : (
            <div className="bg-spotify-elevated rounded-md p-8 text-center">
              <Music className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Your music library is empty</h2>
              <p className="text-gray-400 mb-6">Upload your own music files to start your collection</p>
              <Button onClick={() => setShowUploader(true)}>
                Add Music
                <Plus className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all-music" className="mt-0 px-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Music Catalog ({publishedTracks.length})</h2>
            
            {publishedTracks.length > 0 ? (
              <TrackList tracks={publishedTracks} showAlbum={true} />
            ) : (
              <div className="bg-spotify-elevated rounded-md p-8 text-center">
                <MusicIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">No published music yet</h2>
                <p className="text-gray-400 mb-6">Be the first to publish your music on the platform</p>
                <Link to="/publish">
                  <Button>
                    Publish Your Music
                    <Plus className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="playlists" className="mt-0">
          <div className="bg-spotify-elevated rounded-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Create your first playlist</h2>
            <p className="text-gray-400 mb-6">It's easy, we'll help you</p>
            <button className="bg-white text-black font-medium py-3 px-8 rounded-full hover:scale-105 transition-transform">
              Create playlist
            </button>
          </div>
        </TabsContent>
        
        <TabsContent value="artists" className="mt-0 px-6">
          {hasArtistProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {getAllArtists().map((artist) => (
                <Link to={`/artist-profile/${artist.id}`} key={artist.id}>
                  <div className="bg-spotify-elevated p-4 rounded-lg hover:bg-spotify-highlight transition-colors">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4">
                      <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-lg font-semibold text-center">{artist.name}</h3>
                    <p className="text-gray-400 text-center text-sm truncate mt-1">Artist</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-spotify-elevated rounded-md p-8 text-center">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Become an artist</h2>
              <p className="text-gray-400 mb-6">Register as an artist to publish your music and build your profile</p>
              <Link to="/artist-registration">
                <Button>
                  Register as Artist
                  <User className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Library;
