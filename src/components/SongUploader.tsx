
import React, { useState, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Upload, Plus, Music } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Track } from '@/services/supabaseService';
import { addLocalTrack } from '@/services/localLibrary';
import { supabase, SONG_BUCKET_NAME, getPublicUrl } from '@/lib/supabase';
import { toast } from 'sonner';

interface SongUploaderProps {
  onUploadComplete?: () => void;
  onTrackUploaded?: (track: Track) => void;
}

const SongUploader: React.FC<SongUploaderProps> = ({ onUploadComplete, onTrackUploaded }) => {
  const { toast: uiToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    
    if (audioFiles.length === 0) {
      toast.error("Please upload files in MP3, WAV, or OGG format.");
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to upload songs.");
        setIsUploading(false);
        return;
      }

      for (const file of audioFiles) {
        // Create a unique file name to prevent conflicts
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(SONG_BUCKET_NAME)
          .upload(filePath, file);
          
        if (uploadError) {
          console.error("Error uploading file:", uploadError);
          toast.error(`Upload failed: ${uploadError.message}`);
          continue;
        }
        
        // Get the public URL for the uploaded file
        const publicUrl = getPublicUrl(SONG_BUCKET_NAME, filePath);
        
        // Get metadata from the file
        const audio = new Audio();
        audio.src = publicUrl;
        
        await new Promise<void>((resolve) => {
          audio.onloadedmetadata = () => {
            const uniqueId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            // Ensure duration is stored as an integer
            const durationInSeconds = Math.round(audio.duration);
            
            const newTrack: Track = {
              id: uniqueId,
              name: file.name.replace(/\.(mp3|wav|ogg)$/i, ''),
              artistName: 'Local Artist',
              albumName: 'My Uploads',
              duration: durationInSeconds, // Store as integer
              previewURL: publicUrl,
              albumId: `local-album-${uniqueId}`,
              image: 'https://cdn.jamendo.com/default/default-track_200.jpg',
              artistId: `local-artist-${uniqueId}`
            };
            
            console.log(`Track processed: ${newTrack.name}, duration: ${durationInSeconds} seconds`);
            
            // Add track to local library for immediate use
            addLocalTrack(newTrack);
            
            // Call the onTrackUploaded callback if provided
            if (onTrackUploaded) {
              onTrackUploaded(newTrack);
            }
            
            resolve();
          };
          
          audio.onerror = () => {
            console.error(`Error loading audio file: ${file.name}`);
            toast.error(`Could not process ${file.name}`);
            resolve();
          };
        });
      }
      
      toast.success(`Successfully added ${audioFiles.length} song${audioFiles.length > 1 ? 's' : ''} to publish.`);
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error("Error processing audio files:", error);
      toast.error("There was an error adding your songs. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-spotify-green bg-spotify-green bg-opacity-10' : 'border-gray-600 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Drag and drop your music files</h3>
        <p className="text-gray-400 mb-4">Support for MP3, WAV, and OGG formats</p>
        <Button 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="relative"
        >
          {isUploading ? 'Processing...' : 'Browse Files'}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            multiple
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </Button>
      </div>
    </div>
  );
};

export default SongUploader;
