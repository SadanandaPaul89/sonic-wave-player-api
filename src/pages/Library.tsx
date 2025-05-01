
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { UserRound, Music } from 'lucide-react';
import { getTopTracks, getTopArtists, Track, Artist } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';

const Library = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [activeTab, setActiveTab] = useState('tracks');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
          
          // Get user's tracks
          const { data: userTracks, error: tracksError } = await supabase
            .from('songs')
            .select('*')
            .eq('user_id', user.id);
            
          if (tracksError) throw tracksError;
          
          // We need to transform these tracks
          const transformedTracks: Track[] = await Promise.all(userTracks.map(async (track) => {
            const { data: artist } = await supabase
              .from('artists')
              .select('name')
              .eq('id', track.artist_id)
              .single();
              
            const { data: album } = await supabase
              .from('albums')
              .select('name')
              .eq('id', track.album_id)
              .single();
              
            return {
              id: track.id,
              name: track.name,
              artistName: artist?.name || 'Unknown Artist',
              artistId: track.artist_id,
              albumName: album?.name || 'Unknown Album',
              albumId: track.album_id,
              duration: track.duration,
              previewURL: track.audio_url,
              image: track.image_url || 'https://cdn.jamendo.com/default/default-track_200.jpg'
            };
          }));
          
          setTracks(transformedTracks);
          
          // Get followed artists (for now, just get top artists as placeholder)
          const followedArtists = await getTopArtists(10);
          setArtists(followedArtists);
        }
      } catch (error) {
        console.error('Error fetching library data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
    
    // Subscribe to realtime changes in the songs table
    const channel = supabase
      .channel('songs-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'songs' },
        async (payload) => {
          // Check if this song belongs to the current user
          const song = payload.new as any;
          if (song.user_id === userId) {
            // Fetch related data and add to tracks list
            const { data: artist } = await supabase
              .from('artists')
              .select('name')
              .eq('id', song.artist_id)
              .single();
              
            const { data: album } = await supabase
              .from('albums')
              .select('name')
              .eq('id', song.album_id)
              .single();
              
            const newTrack: Track = {
              id: song.id,
              name: song.name,
              artistName: artist?.name || 'Unknown Artist',
              artistId: song.artist_id,
              albumName: album?.name || 'Unknown Album',
              albumId: song.album_id,
              duration: song.duration,
              previewURL: song.audio_url,
              image: song.image_url || 'https://cdn.jamendo.com/default/default-track_200.jpg'
            };
            
            setTracks(prevTracks => [...prevTracks, newTrack]);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

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
                  <Link to={`/album/${track.albumId}`}>
                    <div className="aspect-square w-full bg-gray-800 overflow-hidden">
                      <img 
                        src={track.image} 
                        alt={track.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg truncate">{track.name}</CardTitle>
                      <CardDescription className="truncate">{track.artistName}</CardDescription>
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
                        src={artist.image} 
                        alt={artist.name}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg truncate">{artist.name}</CardTitle>
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
