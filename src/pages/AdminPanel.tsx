import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getVerificationRequests, 
  approveArtist, 
  rejectArtist, 
  isUserAdmin, 
  getTopArtists, 
  getTracksByArtistId, 
  getTopTracks,
  deleteArtist,
  deleteTrack,
  updateArtist
} from '@/services/supabaseService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, RefreshCw, Pencil, Trash2, Plus, Music } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Artist, Track } from '@/services/supabaseService';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const navigate = useNavigate();

  // Use a strict admin check on component mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsLoading(true);
      setAdminChecked(false);
      
      try {
        // First check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: "Authentication Required",
            description: "Please log in to access this page",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        // Then check if user has admin privileges
        const adminStatus = await isUserAdmin(session.user.id);
        setIsAdmin(adminStatus);
        setAdminChecked(true);
        
        if (!adminStatus) {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        // If admin, load data
        await loadVerificationRequests();
        await loadArtists();
        await loadTracks();
      } catch (error) {
        console.error('Error checking admin status:', error);
        toast({
          title: "Error",
          description: "Failed to verify admin status",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
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
      await loadVerificationRequests();
      await loadArtists(); // Refresh artists list
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
      await loadVerificationRequests();
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
    setEditedImage(artist.image || '');
    setIsEditDialogOpen(true);
  };

  const handleSaveArtist = async () => {
    if (!editingArtist) return;
    
    try {
      // Create an update object with the edited fields
      const updateData: { 
        name?: string; 
        bio?: string; 
        image_url?: string;
      } = {};
      
      if (editedName !== editingArtist.name) {
        updateData.name = editedName;
      }
      
      if (editedBio !== editingArtist.bio) {
        updateData.bio = editedBio;
      }
      
      if (editedImage !== editingArtist.image) {
        updateData.image_url = editedImage;
      }
      
      // Only proceed with update if there are changes
      if (Object.keys(updateData).length > 0) {
        const success = await updateArtist(editingArtist.id, updateData);
        
        if (!success) throw new Error("Failed to update artist");
        
        toast({
          title: "Success",
          description: "Artist updated successfully",
        });
        
        // Update the local artists state to reflect changes
        setArtists(prevArtists => 
          prevArtists.map(artist => 
            artist.id === editingArtist.id 
              ? { 
                  ...artist, 
                  name: editedName,
                  bio: editedBio,
                  image: editedImage
                }
              : artist
          )
        );
      }
      
      setIsEditDialogOpen(false);
      await loadArtists(); // Refresh all artists to ensure data consistency
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
    try {
      setIsDeleting(true);
      const success = await deleteArtist(artistId);
      
      if (!success) {
        throw new Error("Failed to delete artist");
      }
      
      toast({
        title: "Success",
        description: "Artist and all related content deleted successfully",
      });
      
      // Update local state by removing the deleted artist
      setArtists(prevArtists => prevArtists.filter(artist => artist.id !== artistId));
      
      // Remove tracks by this artist from the tracks list
      setTracks(prevTracks => prevTracks.filter(track => track.artistId !== artistId));
      
      // Clear selected artist if it was the deleted one
      if (selectedArtist === artistId) {
        setSelectedArtist(null);
        setArtistTracks([]);
      }
    } catch (error) {
      console.error('Error deleting artist:', error);
      toast({
        title: "Error",
        description: "Failed to delete artist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    try {
      setIsDeleting(true);
      const success = await deleteTrack(trackId);
      
      if (!success) {
        throw new Error("Failed to delete track");
      }
      
      toast({
        title: "Success",
        description: "Track deleted successfully",
      });
      
      // Update local state by removing the deleted track
      setTracks(prevTracks => prevTracks.filter(track => track.id !== trackId));
      
      // Also update artistTracks if applicable
      if (selectedArtist) {
        setArtistTracks(prevTracks => prevTracks.filter(track => track.id !== trackId));
      }
    } catch (error) {
      console.error('Error deleting track:', error);
      toast({
        title: "Error",
        description: "Failed to delete track. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // If admin status is still being checked, show a loading indicator
  if (isLoading && !adminChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg mb-4">Checking admin status...</div>
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
        </div>
      </div>
    );
  }

  // If not admin, show access denied
  if (!isAdmin && adminChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 bg-spotify-elevated rounded-lg">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  // Render admin panel if user is admin
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <Button 
          onClick={async () => {
            await loadVerificationRequests();
            await loadArtists();
            await loadTracks();
            if (selectedArtist) await loadArtistTracks(selectedArtist);
          }} 
          variant="outline" 
          size="icon"
          disabled={isLoading || isDeleting}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
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
                              src={artist.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop'}
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
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-red-500 hover:text-red-700"
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Artist</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the artist "{artist.name}" and all their songs and albums. 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteArtist(artist.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
                                src={track.image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop'}
                                alt={track.name} 
                                className="w-10 h-10 rounded object-cover"
                              />
                            </TableCell>
                            <TableCell>{track.name}</TableCell>
                            <TableCell>{track.albumName}</TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-red-500 hover:text-red-700"
                                    disabled={isDeleting}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Track</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the track "{track.name}". 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteTrack(track.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
                              src={track.image || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop'}
                              alt={track.name} 
                              className="w-10 h-10 rounded object-cover"
                            />
                          </TableCell>
                          <TableCell>{track.name}</TableCell>
                          <TableCell>{track.artistName}</TableCell>
                          <TableCell>{track.albumName}</TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-red-500 hover:text-red-700"
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Track</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the track "{track.name}". 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteTrack(track.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
            <DialogTitle className="text-foreground">Edit Artist</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm text-foreground">Name</label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm text-foreground">Bio</label>
              <Textarea
                id="bio"
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm text-foreground">Image URL</label>
              <Input
                id="image"
                value={editedImage}
                onChange={(e) => setEditedImage(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveArtist}
              className="text-foreground"
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Extract the requestsList rendering to a separate function for readability
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
                src={request.artist_image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop'} 
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
