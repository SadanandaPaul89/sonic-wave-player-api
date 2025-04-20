
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getAllLocalTracks, clearLocalLibrary } from '@/services/localLibrary';
import SongUploader from '@/components/SongUploader';
import TrackList from '@/components/TrackList';
import { Track } from '@/services/api';
import { Music, Plus, File } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Library: React.FC = () => {
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLocalTracks();
  }, []);

  const loadLocalTracks = () => {
    const tracks = getAllLocalTracks();
    setLocalTracks(tracks);
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
      <h1 className="text-3xl font-bold mb-6 px-6">Your Library</h1>
      
      <Tabs defaultValue="my-music" className="w-full">
        <TabsList className="mb-6 px-6">
          <TabsTrigger value="my-music">My Music</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="albums">Albums</TabsTrigger>
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
                loadLocalTracks();
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
        
        <TabsContent value="playlists" className="mt-0">
          <div className="bg-spotify-elevated rounded-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Create your first playlist</h2>
            <p className="text-gray-400 mb-6">It's easy, we'll help you</p>
            <button className="bg-white text-black font-medium py-3 px-8 rounded-full hover:scale-105 transition-transform">
              Create playlist
            </button>
          </div>
        </TabsContent>
        
        <TabsContent value="artists" className="mt-0">
          <div className="bg-spotify-elevated rounded-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Follow your first artist</h2>
            <p className="text-gray-400 mb-6">Follow artists you like by tapping the follow button</p>
            <Link to="/search" className="bg-white text-black font-medium py-3 px-8 rounded-full hover:scale-105 transition-transform inline-block">
              Find artists
            </Link>
          </div>
        </TabsContent>
        
        <TabsContent value="albums" className="mt-0">
          <div className="bg-spotify-elevated rounded-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Save your first album</h2>
            <p className="text-gray-400 mb-6">Save albums you like by tapping the heart icon</p>
            <Link to="/search" className="bg-white text-black font-medium py-3 px-8 rounded-full hover:scale-105 transition-transform inline-block">
              Find albums
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Library;
