
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Artist, createArtistProfile, publishTrack } from '@/services/localLibrary';
import { Track } from '@/services/api';

interface PublishSongFormProps {
  track?: Track;
  onSuccess?: () => void;
}

interface FormValues {
  songName: string;
  artistName: string;
  bio: string;
  albumName: string;
}

const PublishSongForm: React.FC<PublishSongFormProps> = ({ track, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [artistImage, setArtistImage] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
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
      const reader = new FileReader();
      reader.onload = (event) => {
        setArtistImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!track) {
      toast({
        title: "Error",
        description: "No track data available to publish.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // First create or get artist profile
      // We'd normally have user authentication here, for now use a fixed userId
      const userId = 'user-' + Date.now();
      
      // Create new artist profile
      const artistProfile = createArtistProfile({
        name: values.artistName,
        bio: values.bio,
        image: artistImage || 'https://cdn.jamendo.com/default/default-artist_200.jpg',
        userId
      });

      // Then publish the track
      publishTrack({
        id: track.id || `track-${Date.now()}`,
        name: values.songName,
        artistName: values.artistName,
        albumName: values.albumName,
        duration: track.duration || 0,
        previewURL: track.previewURL || '',
        albumId: track.albumId || `album-${Date.now()}`,
        image: track.image || 'https://cdn.jamendo.com/default/default-track_200.jpg',
        artistId: artistProfile.id
      });

      toast({
        title: "Success!",
        description: "Your song has been published.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error publishing song:', error);
      toast({
        title: "Error",
        description: "Failed to publish your song. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Publishing..." : "Publish Song"}
        </Button>
      </form>
    </Form>
  );
};

export default PublishSongForm;
