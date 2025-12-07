import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Track } from '@/services/supabaseService';
import { publishSong, getUserArtistProfile } from '@/services/supabaseService';
import { supabase, SONG_BUCKET_NAME, getPublicUrl } from '@/lib/supabase';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Info, Image } from 'lucide-react';

interface PublishSongFormProps {
  track?: Track;
  onSuccess?: () => void;
}

const formSchema = z.object({
  songName: z.string().min(1, "Song name is required"),
  artistName: z.string().min(1, "Artist name is required"),
  bio: z.string().optional(),
  albumName: z.string().min(1, "Album name is required"),
});

type FormValues = z.infer<typeof formSchema>;

const PublishSongForm: React.FC<PublishSongFormProps> = ({ track, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [artistImage, setArtistImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingArtist, setExistingArtist] = useState<any | null>(null);
  const [userHasArtist, setUserHasArtist] = useState<boolean>(false);
  const [trackHasAlbumArt, setTrackHasAlbumArt] = useState<boolean>(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      songName: track?.name || '',
      artistName: '',
      bio: '',
      albumName: '',
    },
  });

  // Check if track has album art and if user has artist profile
  useEffect(() => {
    const checkUserArtist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const artistProfile = await getUserArtistProfile(user.id);
        if (artistProfile) {
          setExistingArtist(artistProfile);
          setUserHasArtist(true);
          
          // Pre-fill the form with the existing artist's data
          form.setValue('artistName', artistProfile.name);
          if (artistProfile.bio) {
            form.setValue('bio', artistProfile.bio);
          }
          
          // Use existing artist's image ONLY for artist profile
          if (artistProfile.image) {
            setArtistImage(artistProfile.image);
          }
        }
      }
    };
    
    // Check if track has album art (not default placeholder or artist image)
    if (track?.image && 
        !track.image.includes('default-artist') &&
        track.image !== 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f') {
      setTrackHasAlbumArt(true);
    }
    
    checkUserArtist();
  }, [form, track]);

  // Validate album art format and dimensions (same as SongUploader)
  const validateAlbumArt = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error("Album art must be JPEG or PNG format");
        resolve(false);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Album art file size must be less than 10MB");
        resolve(false);
        return;
      }

      const img = document.createElement('img') as HTMLImageElement;
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isValid = await validateAlbumArt(file);
      if (isValid) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
          setArtistImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
        toast.success("Album art updated successfully");
      }
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!track) {
      toast.error("No track data available to publish.");
      return;
    }
    
    // Reset previous errors
    setError(null);
    setIsLoading(true);
    setUploadProgress("Checking authentication...");
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        setError(`Authentication error: ${userError.message}`);
        toast.error("Authentication error: " + userError.message);
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        setError("You must be logged in to publish a song");
        toast.error("You must be logged in to publish a song. Please sign in first.");
        setIsLoading(false);
        return;
      }
      
      setUploadProgress("Processing album art...");
      
      // Determine final image URL priority:
      // 1. Track's existing album art (if exists)
      // 2. Newly uploaded album art (if provided)
      // 3. Default placeholder (NOT artist image)
      let imageUrl = track.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center';
      
      // If user uploaded new album art, use that instead
      if (imageFile) {
        try {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `album-art-${user.id}-${Date.now()}.${fileExt}`;
          const filePath = `${user.id}/album-art/${fileName}`;
          
          setUploadProgress("Uploading album art...");
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(SONG_BUCKET_NAME)
            .upload(filePath, imageFile);
            
          if (uploadError) {
            console.error("Error uploading album art:", uploadError);
            toast.warning("Failed to upload new album art. Using existing image.");
          } else {
            imageUrl = getPublicUrl(SONG_BUCKET_NAME, filePath);
            setUploadProgress("Album art uploaded successfully.");
          }
        } catch (imgError) {
          console.error("Error processing album art:", imgError);
          toast.warning("Error processing album art. Using existing image.");
        }
      }
      
      setUploadProgress("Publishing song to database...");
      
      // Ensure duration is an integer
      const durationInteger = Math.round(track.duration);
      console.log(`Using integer duration for publishing: ${durationInteger}`);
      console.log(`Using album art URL: ${imageUrl}`);
      
      // Log the values we're sending to the publishSong function
      console.log("Publishing song with values:", { 
        songName: values.songName,
        artistName: values.artistName, 
        albumName: values.albumName,
        duration: durationInteger,
        userId: user.id,
        bio: values.bio || null,
        albumArt: imageUrl
      });
      
      // Pass the bio to the publishSong function
      const result = await publishSong(
        values.songName,
        values.artistName,
        values.albumName,
        track.previewURL,
        durationInteger, // Use integer duration
        imageUrl, // Use album art URL (NOT artist image)
        user.id,
        values.bio || null // Pass the bio value
      );
      
      if (result) {
        setUploadProgress("Song published successfully!");
        toast.success("Your song has been published with album art.");
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError("Failed to publish your song. Please try again.");
        toast.error("Failed to publish your song. Please check the console for details.");
      }
    } catch (error) {
      console.error('Error publishing song:', error);
      setError("An unexpected error occurred");
      toast.error("Failed to publish your song. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        {userHasArtist && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                You already have an artist profile as <strong>{existingArtist?.name}</strong>. 
                Your song will be published under this artist name.
              </p>
            </div>
          </div>
        )}

        {trackHasAlbumArt && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-start gap-2">
            <Image className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ This track has album art that will be used as the main visual.
              </p>
            </div>
          </div>
        )}
        
        <FormField
          control={form.control}
          name="songName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Song Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter song name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="artistName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Artist Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter artist name" 
                  {...field} 
                  disabled={userHasArtist}
                />
              </FormControl>
              {userHasArtist && (
                <p className="text-xs text-gray-400">Your artist name cannot be changed once set</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Artist Bio</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about yourself as an artist" 
                  {...field} 
                  disabled={userHasArtist && existingArtist?.bio}
                />
              </FormControl>
              {userHasArtist && existingArtist?.bio && (
                <p className="text-xs text-gray-400">You already have a bio</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="albumName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Album Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter album name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Album Art Section - only show if user doesn't have artist or wants to override */}
        <div className="space-y-2">
          <FormLabel className="flex items-center gap-2">
            <Image size={16} />
            Album Art {trackHasAlbumArt ? "(Override existing)" : "(Optional)"}
          </FormLabel>
          
          {track?.image && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border">
              <img 
                src={track.image} 
                alt="Current album art" 
                className="w-16 h-16 object-cover rounded border border-gray-300" 
              />
              <div className="text-sm">
                <p className="font-medium">Current Album Art</p>
                <p className="text-gray-500">This will be used unless you upload a new one</p>
              </div>
            </div>
          )}
          
          <Input type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleImageUpload} />
          <p className="text-xs text-gray-400">
            Upload new album art (JPEG/PNG, min 500x500px) to override the current image
          </p>
          
          {artistImage && imageFile && (
            <div className="mt-2">
              <img 
                src={artistImage} 
                alt="New album art preview" 
                className="w-24 h-24 object-cover rounded border border-green-500" 
              />
              <p className="text-xs text-green-600 mt-1">✓ New album art ready</p>
            </div>
          )}
        </div>
        
        {uploadProgress && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">{uploadProgress}</p>
          </div>
        )}
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Publishing..." : "Publish Song"}
        </Button>
      </form>
    </Form>
  );
};

export default PublishSongForm;
