import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { UserRound, Music } from 'lucide-react';
import { getAllPublishedTracks, getAllArtists } from '@/services/localLibrary';
import { supabase } from '@/lib/supabase';

interface PublishedTrack {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  coverUrl: string;
  audioUrl: string;
  userId: string;
  publishedAt: string;
}

interface Artist {
  id: string;
  name: string;
  photoUrl: string;
  verified: boolean;
}

const Library = () => {
  const [tracks, setTracks] = useState<PublishedTrack[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [activeTab, setActiveTab] = useState('tracks');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    fetchUserData();
    
    // Load local library data
    const loadedTracks = getAllPublishedTracks();
    const loadedArtists = getAllArtists();
    
    // Transform library tracks to match our interface
    const mappedTracks: PublishedTrack[] = loadedTracks.map(track => ({
      id: track.id,
      title: track.name || '', // Map name to title
      artist: track.artistName || '',
      artistId: track.artistId || '',
      coverUrl: track.image || '',
      audioUrl: track.previewURL || '',
      userId: 'mock-user-id', // Provide default values
      publishedAt: track.publishedDate || new Date().toISOString()
    }));
    
    // Transform artists to match our interface
    const mappedArtists: Artist[] = loadedArtists.map(artist => ({
      id: artist.id,
      name: artist.name,
      photoUrl: artist.image || '', // Map image to photoUrl
      verified: artist.verified || false
    }));
    
    setTracks(mappedTracks);
    setArtists(mappedArtists);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Library</h1>
        <Link to="/artist-registration">
          <Button variant="outline">Register as Artist</Button>
        </Link>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tracks">Your Tracks</TabsTrigger>
          <TabsTrigger value="artists">Following</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tracks" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tracks.length > 0 ? (
              tracks.map((track) => (
                <Card key={track.id} className="overflow-hidden bg-spotify-elevated hover:bg-spotify-highlight transition-colors">
                  <Link to={`/album/${track.id}`}>
                    <div className="aspect-square w-full bg-gray-800 overflow-hidden">
                      <img 
                        src={track.coverUrl || '/placeholder.svg'} 
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg truncate">{track.title}</CardTitle>
                      <CardDescription className="truncate">{track.artist}</CardDescription>
                    </CardHeader>
                  </Link>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-10 text-center">
                <Music className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium mb-2">No tracks yet</h3>
                <p className="text-gray-400 mb-4">You haven't published any tracks yet</p>
                <Link to="/publish">
                  <Button>Publish Your First Track</Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="artists" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artists.length > 0 ? (
              artists.map((artist) => (
                <Card key={artist.id} className="overflow-hidden bg-spotify-elevated hover:bg-spotify-highlight transition-colors">
                  <Link to={`/artist/${artist.id}`}>
                    <div className="aspect-square w-full bg-gray-800 overflow-hidden">
                      <img 
                        src={artist.photoUrl || '/placeholder.svg'} 
                        alt={artist.name}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg truncate flex items-center gap-2">
                        {artist.name}
                        {artist.verified && (
                          <span className="text-blue-500 text-sm bg-blue-500/10 px-2 py-0.5 rounded-full">Verified</span>
                        )}
                      </CardTitle>
                      <CardDescription>Artist</CardDescription>
                    </CardHeader>
                  </Link>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-10 text-center">
                <UserRound className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium mb-2">No followed artists</h3>
                <p className="text-gray-400 mb-4">You aren't following any artists yet</p>
                <Link to="/search">
                  <Button>Discover Artists</Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Library;
