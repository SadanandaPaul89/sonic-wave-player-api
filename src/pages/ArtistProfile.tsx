
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  getArtistById, 
  getPublishedTracksByArtistId, 
  Artist, 
  PublishedTrack
} from '@/services/localLibrary';
import TrackList from '@/components/TrackList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlayer } from '@/contexts/PlayerContext';
import VerificationRequestForm from '@/components/VerificationRequestForm';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ArtistProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<PublishedTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = usePlayer();

  useEffect(() => {
    const fetchArtistData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      const artistData = getArtistById(id);
      if (artistData) {
        setArtist(artistData);
        const artistTracks = getPublishedTracksByArtistId(id);
        setTracks(artistTracks);
      }
      setIsLoading(false);
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
        <div className="h-80 bg-gradient-to-b from-spotify-elevated to-spotify-base flex items-end">
          <div className="container px-6 pb-6">
            <div className="flex items-center gap-6">
              <div className="w-40 h-40 rounded-full overflow-hidden shadow-xl">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-xs uppercase font-bold mb-2">Artist</div>
                <div className="flex items-center gap-2">
                  <h1 className="text-5xl font-bold">{artist.name}</h1>
                  {artist.isVerified && (
                    <Badge className="bg-blue-500 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-gray-300 max-w-2xl">{artist.bio}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {!artist.isVerified && (
        <div className="mb-8 px-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                Request Verification
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
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
      
      <div className="mt-8 px-6">
        <h2 className="text-2xl font-bold mb-4">Songs</h2>
        {tracks.length > 0 ? (
          <TrackList tracks={tracks} />
        ) : (
          <p className="text-gray-400">No songs published yet</p>
        )}
      </div>
    </div>
  );
};

export default ArtistProfile;
