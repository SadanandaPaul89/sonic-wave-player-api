
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PublishSongForm from '@/components/PublishSongForm';
import SongUploader from '@/components/SongUploader';
import { Track } from '@/services/api';

const PublishSong: React.FC = () => {
  const [uploadedTrack, setUploadedTrack] = useState<Track | null>(null);
  const navigate = useNavigate();

  const handleTrackUploaded = (track: Track) => {
    setUploadedTrack(track);
  };

  const handlePublishSuccess = () => {
    navigate('/library');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Publish Your Music</h1>
      
      <Tabs defaultValue="upload">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">1. Upload Song</TabsTrigger>
          <TabsTrigger value="publish" disabled={!uploadedTrack}>2. Publish</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-6">
          <div className="bg-spotify-elevated rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Your Song</h2>
            <p className="text-gray-400 mb-6">
              Upload your song file (MP3, WAV) to get started. Your song will be stored locally in your browser.
            </p>
            
            <SongUploader onTrackUploaded={handleTrackUploaded} />
            
            {uploadedTrack && (
              <div className="mt-6 p-4 border border-green-500 rounded bg-green-500/10">
                <p className="font-medium text-green-500">Song uploaded successfully!</p>
                <p className="text-sm mt-1">{uploadedTrack.name}</p>
                <Button 
                  className="mt-4"
                  variant="outline" 
                  onClick={() => document.querySelector('[data-value="publish"]')?.dispatchEvent(
                    new MouseEvent('click', { bubbles: true })
                  )}
                >
                  Continue to Publishing
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="publish" className="mt-6">
          <div className="bg-spotify-elevated rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Publish Your Song</h2>
            <p className="text-gray-400 mb-6">
              Add information about your song and artist profile to publish it to your library.
            </p>
            
            {uploadedTrack ? (
              <PublishSongForm track={uploadedTrack} onSuccess={handlePublishSuccess} />
            ) : (
              <p className="text-amber-500">Please upload a song first</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PublishSong;
