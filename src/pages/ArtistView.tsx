import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getArtistById, getTracksByArtistId, Artist, Track } from '@/services/supabaseService';
import { Play, Pause } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import CardGrid from '@/components/CardGrid';
import TrackList from '@/components/TrackList';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState as useReactState } from 'react';
import LyricsEditor from '@/components/LyricsEditor';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/utils/formatTime';

const ArtistView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrackForLyrics, setSelectedTrackForLyrics] = useReactState<Track | null>(null);
  const [isLyricsDialogOpen, setIsLyricsDialogOpen] = useReactState(false);
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
          
          // Get all tracks by this artist directly from supabase
          const artistTracks = await getTracksByArtistId(id);
          setTracks(artistTracks);
        }
      } catch (error) {
        console.error('Error fetching artist data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchArtistData();
  }, [id]);

  const handlePlayTopTracks = () => {
    if (!tracks.length) return;
    
    const isCurrentArtistPlaying = 
      currentTrack && 
      tracks.some(track => track.id === currentTrack.id) && 
      isPlaying;
    
    if (isCurrentArtistPlaying) {
      togglePlayPause();
    } else {
      playTrack(tracks[0]);
    }
  };

  const openLyricsEditor = (track: Track) => {
    setSelectedTrackForLyrics(track);
    setIsLyricsDialogOpen(true);
  };

  const closeLyricsEditor = () => {
    setSelectedTrackForLyrics(null);
    setIsLyricsDialogOpen(false);
  };

  // Check if current user owns this artist profile
  const isOwner = artist?.verification_status === 'verified'; // Simplified check for demo

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

  const isCurrentArtistPlaying = 
    currentTrack && 
    tracks.some(track => track.id === currentTrack.id) && 
    isPlaying;

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
                <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-bold`}>{artist.name}</h1>
                {artist.bio && (
                  <p className="mt-4 text-gray-300 max-w-2xl">{artist.bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8 px-4 md:px-6">
        {tracks.length > 0 && (
          <button
            onClick={handlePlayTopTracks}
            className="bg-spotify-green hover:bg-opacity-80 text-black font-bold rounded-full p-3 mr-4"
          >
            {isCurrentArtistPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
        )}
      </div>
      
      <div className="mt-8 px-4 md:px-6">
        <h2 className="text-2xl font-bold mb-4">{tracks.length > 0 ? 'Songs' : 'No songs available'}</h2>
        {tracks.length > 0 ? (
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <div key={track.id} className="flex items-center justify-between p-3 hover:bg-spotify-highlight rounded-lg group">
                <div className="flex items-center space-x-4 flex-1">
                  <span className="text-gray-400 w-4">{index + 1}</span>
                  <div 
                    className="w-12 h-12 bg-gray-600 rounded cursor-pointer"
                    onClick={() => playTrack(track)}
                  >
                    <img
                      src={track.image || 'https://cdn.jamendo.com/default/default-track_200.jpg'}
                      alt={track.name}
                      className="w-full h-full rounded object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-sm font-medium truncate cursor-pointer hover:underline"
                      onClick={() => playTrack(track)}
                    >
                      {track.name}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {track.artistName}
                    </div>
                  </div>
                  {!isMobile && (
                    <div className="text-sm text-gray-400 truncate min-w-0 flex-1">
                      {track.albumName}
                    </div>
                  )}
                  <div className="text-sm text-gray-400">
                    {formatTime(track.duration)}
                  </div>
                </div>
                
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openLyricsEditor(track)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  >
                    <Edit size={16} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">This artist hasn't published any songs yet.</p>
        )}
      </div>

      {/* Lyrics Editor Dialog */}
      <Dialog open={isLyricsDialogOpen} onOpenChange={setIsLyricsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedTrackForLyrics && (
            <LyricsEditor
              songId={selectedTrackForLyrics.id}
              artistId={selectedTrackForLyrics.artistId || ''}
              onClose={closeLyricsEditor}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArtistView;
