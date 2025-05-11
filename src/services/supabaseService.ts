import { supabase, getPublicUrl, SONG_BUCKET_NAME } from '@/lib/supabase';
// Import types from the API service to maintain compatibility
import { Track as ApiTrack, Artist as ApiArtist, Album as ApiAlbum, Playlist } from '@/services/api';

// Export these types so they can be used by other components
export type Artist = ApiArtist & { bio?: string }; // Add bio field to Artist type
export type Track = ApiTrack;
export type Album = ApiAlbum;

// Interface for Supabase data models
interface SupabaseArtist {
  id: string;
  name: string;
  image_url: string;
  bio?: string; // Add bio field
  user_id?: string;
}

interface SupabaseAlbum {
  id: string;
  name: string;
  artist_id: string;
  image_url: string;
  release_date: string;
}

interface SupabaseSong {
  id: string;
  name: string;
  artist_id: string;
  album_id: string;
  duration: number;
  audio_url: string;
  image_url: string;
  user_id?: string;
}

// Helper functions to convert between Supabase and API types
const mapArtistFromSupabase = (artist: SupabaseArtist): Artist => ({
  id: artist.id,
  name: artist.name,
  image: artist.image_url || 'https://cdn.jamendo.com/default/default-artist_200.jpg',
  type: 'artist',
  bio: artist.bio // Include bio in mapped artist
});

const mapAlbumFromSupabase = async (album: SupabaseAlbum): Promise<Album> => {
  // Fetch artist name for this album
  const { data: artist } = await supabase
    .from('artists')
    .select('name')
    .eq('id', album.artist_id)
    .single();
    
  return {
    id: album.id,
    name: album.name,
    artistName: artist?.name || 'Unknown Artist',
    artistId: album.artist_id,
    releaseDate: album.release_date || new Date().toISOString(),
    image: album.image_url || 'https://cdn.jamendo.com/default/default-album_200.jpg'
  };
};

const mapSongFromSupabase = async (song: SupabaseSong): Promise<Track> => {
  // Get artist and album details
  const { data: artist } = await supabase
    .from('artists')
    .select('name')
    .eq('id', song.artist_id)
    .single();
    
  const { data: album } = await supabase
    .from('albums')
    .select('name')
    .eq('id', song.album_id)
    .single();
    
  return {
    id: song.id,
    name: song.name,
    artistName: artist?.name || 'Unknown Artist',
    artistId: song.artist_id,
    albumName: album?.name || 'Unknown Album',
    albumId: song.album_id || '',
    duration: song.duration,
    previewURL: song.audio_url,
    image: song.image_url || 'https://cdn.jamendo.com/default/default-track_200.jpg'
  };
};

// Main API functions
export const getTopArtists = async (limit = 20): Promise<Artist[]> => {
  const { data: artists, error } = await supabase
    .from('artists')
    .select('*')
    .limit(limit);
    
  if (error) {
    console.error('Error fetching artists:', error);
    return [];
  }
  
  return artists.map(mapArtistFromSupabase);
};

export const getTopTracks = async (limit = 20): Promise<Track[]> => {
  const { data: songs, error } = await supabase
    .from('songs')
    .select('*')
    .limit(limit);
    
  if (error) {
    console.error('Error fetching songs:', error);
    return [];
  }
  
  // Map each song to a Track
  const trackPromises = songs.map(mapSongFromSupabase);
  return await Promise.all(trackPromises);
};

export const getArtistById = async (id: string): Promise<Artist | null> => {
  const { data: artist, error } = await supabase
    .from('artists')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error || !artist) {
    console.error(`Error fetching artist ${id}:`, error);
    return null;
  }
  
  return mapArtistFromSupabase(artist);
};

export const getAlbumById = async (id: string): Promise<Album | null> => {
  const { data: album, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error || !album) {
    console.error(`Error fetching album ${id}:`, error);
    return null;
  }
  
  return await mapAlbumFromSupabase(album);
};

export const getTracksByAlbumId = async (albumId: string): Promise<Track[]> => {
  const { data: songs, error } = await supabase
    .from('songs')
    .select('*')
    .eq('album_id', albumId);
    
  if (error) {
    console.error(`Error fetching tracks for album ${albumId}:`, error);
    return [];
  }
  
  // Map each song to a Track
  const trackPromises = songs.map(mapSongFromSupabase);
  return await Promise.all(trackPromises);
};

export const searchContent = async (query: string, type = 'track', limit = 20): Promise<any[]> => {
  const searchQuery = `%${query}%`;
  
  switch (type) {
    case 'artist': {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .ilike('name', searchQuery)
        .limit(limit);
        
      if (error) {
        console.error(`Error searching for artists:`, error);
        return [];
      }
      
      return data.map(mapArtistFromSupabase);
    }
    
    case 'album': {
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .ilike('name', searchQuery)
        .limit(limit);
        
      if (error) {
        console.error(`Error searching for albums:`, error);
        return [];
      }
      
      const albumPromises = data.map(mapAlbumFromSupabase);
      return await Promise.all(albumPromises);
    }
    
    case 'track':
    default: {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .ilike('name', searchQuery)
        .limit(limit);
        
      if (error) {
        console.error(`Error searching for tracks:`, error);
        return [];
      }
      
      const trackPromises = data.map(mapSongFromSupabase);
      return await Promise.all(trackPromises);
    }
  }
};

export const publishSong = async (
  songName: string,
  artistName: string,
  albumName: string,
  audioUrl: string,
  duration: number,
  imageUrl: string,
  userId: string,
  bio?: string | null // Add optional bio parameter
): Promise<Track | null> => {
  try {
    console.log("Starting song publishing process...");
    console.log("Input parameters:", { songName, artistName, albumName, duration, bio });
    
    // First, check if the artist exists or create a new one
    let artistId: string;
    const { data: existingArtist, error: artistCheckError } = await supabase
      .from('artists')
      .select('id, bio')
      .eq('name', artistName)
      .maybeSingle();
    
    if (artistCheckError) {
      console.error('Error checking for existing artist:', artistCheckError);
      return null;
    }
      
    if (existingArtist) {
      console.log("Found existing artist:", existingArtist);
      artistId = existingArtist.id;
      
      // Update artist bio if provided and different from existing
      if (bio && (!existingArtist.bio || existingArtist.bio !== bio)) {
        console.log("Updating artist bio");
        const { error: updateError } = await supabase
          .from('artists')
          .update({ bio: bio })
          .eq('id', artistId);
          
        if (updateError) {
          console.error('Error updating artist bio:', updateError);
          // Continue anyway, not critical
        }
      }
    } else {
      console.log("Creating new artist...");
      // Build the artist data object
      const artistData: any = {
        name: artistName,
        image_url: imageUrl,
        user_id: userId
      };
      
      // Only add bio if it's not null or undefined
      if (bio) {
        artistData.bio = bio;
      }
      
      // Insert the artist with the user_id and bio if provided
      const { data: newArtist, error: artistError } = await supabase
        .from('artists')
        .insert(artistData)
        .select()
        .single();
        
      if (artistError || !newArtist) {
        console.error('Error creating artist:', artistError);
        return null;
      }
      
      console.log("Artist created successfully:", newArtist);
      artistId = newArtist.id;
    }
    
    // Create a new album
    console.log("Creating new album...");
    const { data: newAlbum, error: albumError } = await supabase
      .from('albums')
      .insert({
        name: albumName,
        artist_id: artistId,
        image_url: imageUrl,
        release_date: new Date().toISOString()
      })
      .select()
      .single();
      
    if (albumError) {
      console.error('Error creating album:', albumError);
      console.error('Error details:', albumError.details, albumError.hint, albumError.message);
      return null;
    }
    
    if (!newAlbum) {
      console.error('Album creation returned null without an error');
      return null;
    }
    
    console.log("Album created successfully:", newAlbum);
    const albumId = newAlbum.id;
    
    // Convert duration to integer before inserting
    const durationInteger = Math.round(duration);
    console.log(`Converting duration from ${duration} to integer: ${durationInteger}`);
    
    // Insert the song
    console.log("Creating new song...");
    const { data: song, error: songError } = await supabase
      .from('songs')
      .insert({
        name: songName,
        artist_id: artistId,
        album_id: albumId,
        duration: durationInteger, // Use the integer value
        audio_url: audioUrl,
        image_url: imageUrl,
        user_id: userId
      })
      .select()
      .single();
      
    if (songError) {
      console.error('Error creating song:', songError);
      console.error('Error details:', songError.details, songError.hint, songError.message);
      return null;
    }
    
    if (!song) {
      console.error('Song creation returned null without an error');
      return null;
    }
    
    console.log("Song created successfully:", song);
    
    // Return the newly created track
    return {
      id: song.id,
      name: song.name,
      artistName,
      artistId,
      albumName,
      albumId,
      duration: durationInteger, // Return the integer duration
      previewURL: audioUrl,
      image: imageUrl || 'https://cdn.jamendo.com/default/default-track_200.jpg'
    };
  } catch (error) {
    console.error('Unexpected error in publishSong:', error);
    return null;
  }
};

// Create a subscription to realtime changes
export const subscribeToSongs = (callback: (song: Track) => void) => {
  return supabase
    .channel('songs-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'songs' },
      async (payload) => {
        const song = payload.new as SupabaseSong;
        const track = await mapSongFromSupabase(song);
        callback(track);
      }
    )
    .subscribe();
};

// Helper function to add artist verification
export const verifyArtist = async (artistId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('artists')
    .update({ verified: true })
    .eq('id', artistId);
    
  return !error;
};

// Add functionality to send verification email
export const requestVerification = async (artistId: string, email: string): Promise<boolean> => {
  try {
    // Simply log this for now since we don't have a real email service
    console.log(`Verification request email sent to ${email} for artist: ${artistId}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};
