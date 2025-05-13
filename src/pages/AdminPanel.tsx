
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVerificationRequests, approveArtist, rejectArtist, isUserAdmin, getTopArtists, getTracksByArtistId, getTopTracks } from '@/services/supabaseService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, RefreshCw, Pencil, Trash2, Plus, Music } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Artist, Track } from '@/services/supabaseService';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface VerificationRequest {
  id: string;
  artist_id: string;
  email: string;
  reason: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  artist_name: string;
  artist_image: string;
}

const AdminPanel: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTabId, setActiveTabId] = useState('pending');
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedImage, setEditedImage] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [artistTracks, setArtistTracks] = useState<Track[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/auth');
          return;
        }

        const adminStatus = await isUserAdmin(session.user.id);
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        loadVerificationRequests();
        loadArtists();
        loadTracks();
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      }
    };

    checkAdminStatus();
  }, [navigate]);

  const loadVerificationRequests = async () => {
    setIsLoading(true);
    try {
      const requests = await getVerificationRequests();
      setRequests(requests);
    } catch (error) {
      console.error('Error loading verification requests:', error);
      toast({
        title: "Error",
        description: "Failed to load verification requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadArtists = async () => {
    setIsLoading(true);
    try {
      const artists = await getTopArtists(100); // Load up to 100 artists
      setArtists(artists);
    } catch (error) {
      console.error('Error loading artists:', error);
      toast({
        title: "Error",
        description: "Failed to load artists",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTracks = async () => {
    setIsLoading(true);
    try {
      const tracks = await getTopTracks(100); // Load up to 100 tracks
      setTracks(tracks);
    } catch (error) {
      console.error('Error loading tracks:', error);
      toast({
        title: "Error",
        description: "Failed to load tracks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadArtistTracks = async (artistId: string) => {
    try {
      const tracks = await getTracksByArtistId(artistId);
      setArtistTracks(tracks);
      setSelectedArtist(artistId);
    } catch (error) {
      console.error('Error loading artist tracks:', error);
      toast({
        title: "Error",
        description: "Failed to load artist tracks",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (requestId: string, artistId: string) => {
    try {
      await approveArtist(requestId, artistId);
      toast({
        title: "Success",
        description: "Artist verified successfully",
      });
      loadVerificationRequests();
      loadArtists(); // Refresh artists list
    } catch (error) {
      console.error('Error approving artist:', error);
      toast({
        title: "Error",
        description: "Failed to verify artist",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: string, artistId: string) => {
    try {
      await rejectArtist(requestId, artistId);
      toast({
        title: "Success",
        description: "Artist verification rejected",
      });
      loadVerificationRequests();
    } catch (error) {
      console.error('Error rejecting artist:', error);
      toast({
        title: "Error",
        description: "Failed to reject verification",
        variant: "destructive",
      });
    }
  };

  const handleEditArtist = (artist: Artist) => {
    setEditingArtist(artist);
    setEditedName(artist.name);
    setEditedBio(artist.bio || '');
    setEditedImage(artist.image);
    setIsEditDialogOpen(true);
  };

  const handleSaveArtist = async () => {
    if (!editingArtist) return;
    
    try {
      const { error } = await supabase
        .from('artists')
        .update({
          name: editedName,
          bio: editedBio,
          image_url: editedImage
        })
        .eq('id', editingArtist.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Artist updated successfully",
      });
      
      setIsEditDialogOpen(false);
      loadArtists();
    } catch (error) {
      console.error('Error updating artist:', error);
      toast({
        title: "Error",
        description: "Failed to update artist",
        variant: "destructive",
      });
    }
  };

  const handleDeleteArtist = async (artistId: string) => {
    if (!confirm('Are you sure you want to delete this artist? This will delete all their songs and albums.')) {
      return;
    }
    
    try {
      // First, delete all songs by this artist
      const { error: songsError } = await supabase
        .from('songs')
        .delete()
        .eq('artist_id', artistId);
      
      if (songsError) throw songsError;
      
      // Then, delete all albums by this artist
      const { error: albumsError } = await supabase
        .from('albums')
        .delete()
        .eq('artist_id', artistId);
      
      if (albumsError) throw albumsError;
      
      // Finally, delete the artist
      const { error: artistError } = await supabase
        .from('artists')
        .delete()
        .eq('id', artistId);
      
      if (artistError) throw artistError;
      
      toast({
        title: "Success",
        description: "Artist and all related content deleted successfully",
      });
      
      loadArtists();
      loadTracks();
      if (selectedArtist === artistId) {
        setSelectedArtist(null);
        setArtistTracks([]);
      }
    } catch (error) {
      console.error('Error deleting artist:', error);
      toast({
        title: "Error",
        description: "Failed to delete artist",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm('Are you sure you want to delete this track?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', trackId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Track deleted successfully",
      });
      
      loadTracks();
      if (selectedArtist) {
        loadArtistTracks(selectedArtist);
      }
    } catch (error) {
      console.error('Error deleting track:', error);
      toast({
        title: "Error",
        description: "Failed to delete track",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <Button onClick={() => {
          loadVerificationRequests();
          loadArtists();
          loadTracks();
          if (selectedArtist) loadArtistTracks(selectedArtist);
        }} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="pending" onValueChange={setActiveTabId} value={activeTabId}>
        <TabsList className="grid w-full max-w-md grid-cols-5 mb-6">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
        </TabsList>
        
        {isLoading && activeTabId !== 'artists' && activeTabId !== 'tracks' ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-400">Loading verification requests...</div>
          </div>
        ) : (
          <>
            <TabsContent value="pending">
              {renderRequestsList(
                requests.filter(req => req.status === 'pending'),
                handleApprove,
                handleReject
              )}
            </TabsContent>
            
            <TabsContent value="approved">
              {renderRequestsList(
                requests.filter(req => req.status === 'approved'),
                handleApprove,
                handleReject,
                true
              )}
            </TabsContent>
            
            <TabsContent value="rejected">
              {renderRequestsList(
                requests.filter(req => req.status === 'rejected'),
                handleApprove,
                handleReject,
                true
              )}
            </TabsContent>

            <TabsContent value="artists">
              <div className="bg-spotify-elevated rounded-lg p-4 md:p-6">
                <h2 className="text-xl font-bold mb-4">Manage Artists</h2>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Tracks</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {artists.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">No artists found</TableCell>
                      </TableRow>
                    ) : (
                      artists.map((artist) => (
                        <TableRow key={artist.id}>
                          <TableCell>
                            <img 
                              src={artist.image} 
                              alt={artist.name} 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          </TableCell>
                          <TableCell>{artist.name}</TableCell>
                          <TableCell>
                            <Badge className={
                              artist.verification_status === 'verified' ? 'bg-green-600' : 
                              artist.verification_status === 'pending' ? 'bg-yellow-600' : 
                              'bg-red-600'
                            }>
                              {artist.verification_status?.toUpperCase() || 'UNVERIFIED'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => loadArtistTracks(artist.id)}
                            >
                              <Music className="w-4 h-4 mr-1" />
                              View Tracks
                            </Button>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditArtist(artist)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteArtist(artist.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {selectedArtist && (
                <div className="bg-spotify-elevated rounded-lg p-4 md:p-6 mt-6">
                  <h3 className="text-xl font-bold mb-4">
                    {artists.find(a => a.id === selectedArtist)?.name}'s Tracks
                  </h3>
                  
                  {artistTracks.length === 0 ? (
                    <p className="text-center py-4">No tracks found for this artist</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image</TableHead>
                          <TableHead>Track Name</TableHead>
                          <TableHead>Album</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {artistTracks.map((track) => (
                          <TableRow key={track.id}>
                            <TableCell>
                              <img 
                                src={track.image} 
                                alt={track.name} 
                                className="w-10 h-10 rounded object-cover"
                              />
                            </TableCell>
                            <TableCell>{track.name}</TableCell>
                            <TableCell>{track.albumName}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteTrack(track.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tracks">
              <div className="bg-spotify-elevated rounded-lg p-4 md:p-6">
                <h2 className="text-xl font-bold mb-4">All Tracks</h2>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Track Name</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead>Album</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tracks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">No tracks found</TableCell>
                      </TableRow>
                    ) : (
                      tracks.map((track) => (
                        <TableRow key={track.id}>
                          <TableCell>
                            <img 
                              src={track.image} 
                              alt={track.name} 
                              className="w-10 h-10 rounded object-cover"
                            />
                          </TableCell>
                          <TableCell>{track.name}</TableCell>
                          <TableCell>{track.artistName}</TableCell>
                          <TableCell>{track.albumName}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteTrack(track.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Artist</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Name</label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Bio</label>
              <Textarea
                id="bio"
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Image URL</label>
              <Input
                id="image"
                value={editedImage}
                onChange={(e) => setEditedImage(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveArtist}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const renderRequestsList = (
  requests: VerificationRequest[],
  handleApprove: (id: string, artistId: string) => void,
  handleReject: (id: string, artistId: string) => void,
  readOnly = false
) => {
  if (requests.length === 0) {
    return (
      <div className="bg-spotify-elevated rounded-lg p-6 text-center">
        <p className="text-gray-400">No verification requests found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map(request => (
        <div key={request.id} className="bg-spotify-elevated rounded-lg p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
              <img 
                src={request.artist_image || 'https://cdn.jamendo.com/default/default-artist_200.jpg'} 
                alt={request.artist_name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h3 className="text-xl font-semibold">{request.artist_name}</h3>
                <Badge className={
                  request.status === 'pending' ? 'bg-yellow-600' : 
                  request.status === 'approved' ? 'bg-green-600' : 
                  'bg-red-600'
                }>
                  {request.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-gray-400">Submitted on {new Date(request.created_at).toLocaleDateString()}</p>
              <p className="text-sm text-gray-400">Contact: {request.email}</p>
              <div className="mt-3 p-3 bg-spotify-base rounded">
                <p className="text-sm">{request.reason}</p>
              </div>
            </div>
          </div>
          
          {!readOnly && (
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                onClick={() => handleReject(request.id, request.artist_id)}
              >
                <X className="mr-1 h-4 w-4" />
                Reject
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                onClick={() => handleApprove(request.id, request.artist_id)}
              >
                <Check className="mr-1 h-4 w-4" />
                Approve
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminPanel;
