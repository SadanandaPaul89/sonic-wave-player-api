
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { createArtistProfile } from '@/services/localLibrary';

const ArtistRegistration: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [artistImage, setArtistImage] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const form = useForm({
    defaultValues: {
      artistName: '',
      bio: '',
      genre: '',
      location: ''
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

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      // Create new artist profile
      const artistProfile = createArtistProfile({
        name: values.artistName,
        bio: values.bio,
        image: artistImage || 'https://cdn.jamendo.com/default/default-artist_200.jpg',
        userId: `user-${Date.now()}`
      });

      toast({
        title: "Success!",
        description: "Your artist profile has been created.",
      });
      
      // Navigate to the artist profile page
      navigate(`/artist-profile/${artistProfile.id}`);
    } catch (error) {
      console.error('Error creating artist profile:', error);
      toast({
        title: "Error",
        description: "Failed to create your artist profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Register as an Artist</h1>
      
      <div className="bg-spotify-elevated rounded-lg p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="artistName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your artist name" {...field} required />
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
                    <Textarea placeholder="Tell us about yourself as an artist" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="genre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Genre</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Rock, Hip-Hop, Electronic, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. New York, Los Angeles, etc." {...field} />
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
            
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Creating Profile..." : "Create Artist Profile"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ArtistRegistration;
