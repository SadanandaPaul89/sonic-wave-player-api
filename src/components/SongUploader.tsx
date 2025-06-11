
import React, { useState, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Upload, Plus, Music, Image } from 'lucide-react';
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
  const [albumArt, setAlbumArt] = useState<File | null>(null);
  const [albumArtPreview, setAlbumArtPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const albumArtInputRef = useRef<HTMLInputElement>(null);

  // Validate album art format and dimensions
  const validateAlbumArt = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error("Album art must be JPEG or PNG format");
        resolve(false);
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Album art file size must be less than 10MB");
        resolve(false);
        return;
      }

      // Check dimensions
      const img = new Image();
      img.onload = () => {
        if (img.width < 500 || img.height < 500) {
          toast.error("Album art must be at least 500x500 pixels");
          resolve(false);
        } else {
          resolve(true);
        }
      };
      img.onerror = () => {
        toast.error("Invalid image file");
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAlbumArtSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isValid = await validateAlbumArt(file);
      if (isValid) {
        setAlbumArt(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          setAlbumArtPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
        toast.success("Album art added successfully");
      }
    }
  };

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

  const uploadAlbumArt = async (session: any): Promise<string | null> => {
    if (!albumArt) return null;

    try {
      const fileExt = albumArt.name.split('.').pop();
      const fileName = `album-art-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${session.user.id}/album-art/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(SONG_BUCKET_NAME)
        .upload(filePath, albumArt);

      if (uploadError) {
        console.error("Error uploading album art:", uploadError);
        toast.error("Failed to upload album art");
        return null;
      }

      return getPublicUrl(SONG_BUCKET_NAME, filePath);
    } catch (error) {
      console.error("Error processing album art:", error);
      toast.error("Error processing album art");
      return null;
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

      // Upload album art first if provided
      let albumArtUrl: string | null = null;
      if (albumArt) {
        albumArtUrl = await uploadAlbumArt(session);
      }

      for (const file of audioFiles) {
        try {
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
          
          console.log("File uploaded successfully:", filePath);
          
          // Get the public URL for the uploaded file
          const publicUrl = getPublicUrl(SONG_BUCKET_NAME, filePath);
          
          // Get metadata from the file
          const audio = new Audio();
          audio.src = publicUrl;
          
          await new Promise<void>((resolve, reject) => {
            audio.onloadedmetadata = () => {
              try {
                const uniqueId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                // Ensure duration is stored as an integer
                const durationInSeconds = Math.round(audio.duration);
                
                console.log(`Processing track: ${file.name}, duration: ${audio.duration}, rounded to: ${durationInSeconds}`);
                
                const newTrack: Track = {
                  id: uniqueId,
                  name: file.name.replace(/\.(mp3|wav|ogg)$/i, ''),
                  artistName: 'Local Artist',
                  albumName: 'My Uploads',
                  duration: durationInSeconds, // Store as integer
                  previewURL: publicUrl,
                  albumId: `local-album-${uniqueId}`,
                  // Prioritize album art, fallback to default placeholder (NOT artist image)
                  image: albumArtUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center',
                  artistId: `local-artist-${uniqueId}`
                };
                
                console.log(`Track processed: ${newTrack.name}, duration: ${durationInSeconds} seconds, image: ${newTrack.image}`);
                
                // Add track to local library for immediate use
                addLocalTrack(newTrack);
                
                // Call the onTrackUploaded callback if provided
                if (onTrackUploaded) {
                  onTrackUploaded(newTrack);
                }
                
                resolve();
              } catch (err) {
                console.error("Error processing audio metadata:", err);
                reject(err);
              }
            };
            
            audio.onerror = (e) => {
              console.error(`Error loading audio file: ${file.name}`, e);
              toast.error(`Could not process ${file.name}`);
              reject(new Error(`Audio load error for ${file.name}`));
            };
            
            // Set a timeout in case metadata loading hangs
            setTimeout(() => {
              reject(new Error(`Timeout loading metadata for ${file.name}`));
            }, 30000);
          });
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          toast.error(`Error processing ${file.name}`);
        }
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
      // Reset the file inputs
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (albumArtInputRef.current) {
        albumArtInputRef.current.value = '';
      }
      // Reset album art state
      setAlbumArt(null);
      setAlbumArtPreview(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Album Art Upload Section */}
      <div className="bg-spotify-elevated rounded-lg p-4 border border-gray-600">
        <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
          <Image size={20} />
          Album Art (Optional)
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Upload album art for your track. Must be JPEG or PNG, minimum 500x500px.
        </p>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => albumArtInputRef.current?.click()}
            disabled={isUploading}
          >
            Choose Album Art
          </Button>
          
          {albumArtPreview && (
            <div className="flex items-center gap-3">
              <img 
                src={albumArtPreview} 
                alt="Album art preview" 
                className="w-16 h-16 object-cover rounded border border-gray-500" 
              />
              <div className="text-sm">
                <p className="text-green-400">✓ Album art ready</p>
                <p className="text-gray-400">{albumArt?.name}</p>
              </div>
            </div>
          )}
        </div>
        
        <input
          ref={albumArtInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
          onChange={handleAlbumArtSelect}
          disabled={isUploading}
        />
      </div>

      {/* Audio Upload Section */}
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
