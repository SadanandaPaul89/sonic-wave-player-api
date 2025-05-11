
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Track } from '@/services/supabaseService';
import { publishSong } from '@/services/supabaseService';
import { supabase, ARTIST_IMAGE_BUCKET_NAME, getPublicUrl } from '@/lib/supabase';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

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
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      songName: track?.name || '',
      artistName: track?.artistName || '',
      bio: '',
      albumName: track?.albumName || '',
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setArtistImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!track) {
      toast.error("No track data available to publish.");
      return;
    }
    
    setIsLoading(true);
    setUploadProgress("Checking authentication...");
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        toast.error("Authentication error: " + userError.message);
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        toast.error("You must be logged in to publish a song. Please sign in first.");
        setIsLoading(false);
        return;
      }
      
      setUploadProgress("Processing artist image...");
      
      // Upload artist image if provided
      let imageUrl = track.image || 'https://cdn.jamendo.com/default/default-track_200.jpg';
      
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        setUploadProgress("Uploading artist image...");
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(ARTIST_IMAGE_BUCKET_NAME)
          .upload(filePath, imageFile);
          
        if (uploadError) {
          console.error("Error uploading artist image:", uploadError);
          toast.error("Failed to upload artist image. Using default image instead.");
        } else {
          imageUrl = getPublicUrl(ARTIST_IMAGE_BUCKET_NAME, filePath);
          setUploadProgress("Image uploaded successfully.");
        }
      }
      
      setUploadProgress("Publishing song to database...");
      
      // Pass the bio to the publishSong function
      const result = await publishSong(
        values.songName,
        values.artistName,
        values.albumName,
        track.previewURL,
        track.duration,
        imageUrl,
        user.id,
        values.bio // Pass the bio value
      );
      
      if (result) {
        setUploadProgress("Song published successfully!");
        toast.success("Your song has been published.");
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error("Failed to publish your song. Please check the console for details.");
      }
    } catch (error) {
      console.error('Error publishing song:', error);
      toast.error("Failed to publish your song. Please try again.");
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Input placeholder="Enter artist name" {...field} />
              </FormControl>
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
                <Textarea placeholder="Tell us about yourself as an artist" {...field} />
              </FormControl>
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
        
        <div className="space-y-2">
          <FormLabel>Artist Image</FormLabel>
          <Input type="file" accept="image/*" onChange={handleImageUpload} />
          {artistImage && (
            <div className="mt-2">
              <img 
                src={artistImage} 
                alt="Artist preview" 
                className="w-24 h-24 object-cover rounded-full" 
              />
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
