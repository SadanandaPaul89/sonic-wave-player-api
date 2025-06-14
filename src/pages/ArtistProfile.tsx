
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getArtistById, 
  getTracksByArtistId,
  getArtistVerificationStatus, 
  Artist, 
  Track
} from '@/services/supabaseService';
import TrackList from '@/components/TrackList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlayer } from '@/contexts/PlayerContext';
import VerificationRequestForm from '@/components/VerificationRequestForm';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BadgeCheck, Clock, XCircle } from 'lucide-react';

const ArtistProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<string>('unverified');
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayer();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchArtistData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Get artist details
        const artistData = await getArtistById(id);
        if (artistData) {
          setArtist(artistData);
          
          // Get all tracks by this artist
          const artistTracks = await getTracksByArtistId(id);
          setTracks(artistTracks);
          
          // Get verification status
          const status = await getArtistVerificationStatus(id);
          setVerificationStatus(status.status);
          setHasPendingRequest(status.hasPendingRequest);

          // Debugging output
          console.log('--- DEBUG: ArtistProfile ---');
          console.log('artist:', artistData);
          console.log('verificationStatus:', status.status);
          console.log('hasPendingRequest:', status.hasPendingRequest);
        } else {
          // Debug: artist not found
          console.log('DEBUG: Artist NOT FOUND for id:', id);
        }
      } catch (error) {
        console.error('Error fetching artist profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArtistData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Artist not found</h2>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="relative mb-8">
        <div className={`${isMobile ? 'h-auto py-8' : 'h-80'} bg-gradient-to-b from-spotify-elevated to-spotify-base flex items-end`}>
          <div className="container px-4 md:px-6 pb-6">
            <div className={`flex ${isMobile ? 'flex-col items-start space-y-4' : 'items-center'} gap-6`}>
              <div className={`${isMobile ? 'w-24 h-24' : 'w-40 h-40'} rounded-full overflow-hidden shadow-xl`}>
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-xs uppercase font-bold mb-2">Artist</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-bold`}>{artist.name}</h1>
                  
                  {verificationStatus === 'verified' && (
                    <Badge className="bg-blue-500 text-white flex items-center gap-1">
                      <BadgeCheck className="h-4 w-4" />
                      Verified
                    </Badge>
                  )}
                  
                  {verificationStatus === 'pending' && (
                    <Badge className="bg-yellow-600 text-white flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Pending Verification
                    </Badge>
                  )}
                  
                  {verificationStatus === 'rejected' && (
                    <Badge className="bg-red-500 text-white flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Verification Declined
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-gray-300 max-w-2xl">{artist.bio || 'No biography available'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {(verificationStatus === 'unverified' && !hasPendingRequest) && (
        <div className="mb-8 px-4 md:px-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                Request Verification
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Request Artist Verification</AlertDialogTitle>
                <AlertDialogDescription>
                  Get verified to show your fans that this is your official profile.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <VerificationRequestForm artistId={artist.id} />
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      
      <div className="mt-8 px-4 md:px-6">
        <h2 className="text-2xl font-bold mb-4">Songs</h2>
        {tracks.length > 0 ? (
          <TrackList tracks={tracks} showAlbum={!isMobile} />
        ) : (
          <p className="text-gray-400">No songs published yet</p>
        )}
      </div>
    </div>
  );
};

export default ArtistProfile;
