import { supabase, getPublicUrl, SONG_BUCKET_NAME } from '@/lib/supabase';
// Import types from the API service to maintain compatibility
import { Track as ApiTrack, Artist as ApiArtist, Album as ApiAlbum, Playlist } from '@/services/api';

// Export these types so they can be used by other components
export type Artist = ApiArtist & { bio?: string, verification_status?: string }; // Add verification_status field to Artist type
export type Track = ApiTrack & { like_count?: number, play_count?: number, is_liked?: boolean };
export type Album = ApiAlbum;

// Interface for Supabase data models
interface SupabaseArtist {
  id: string;
  name: string;
  image_url: string;
  bio?: string;
  user_id?: string;
  verification_status?: string;
  is_admin?: boolean;
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
  like_count?: number;
  play_count?: number;
}

// Helper functions to convert between Supabase and API types
const mapArtistFromSupabase = (artist: SupabaseArtist): Artist => ({
  id: artist.id,
  name: artist.name,
  image: artist.image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',
  type: 'artist',
  bio: artist.bio,
  verification_status: artist.verification_status
});

const mapAlbumFromSupabase = async (album: SupabaseAlbum): Promise<Album> => {
  // Fetch artist name for this album
  const { data: artist } = await supabase
    .from('artists')
    .select('name')
    .eq('id', album.artist_id)
    .maybeSingle();
    
  return {
    id: album.id,
    name: album.name,
    artistName: artist?.name || 'Unknown Artist',
    artistId: album.artist_id,
    releaseDate: album.release_date || new Date().toISOString(),
    image: album.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop'
  };
};

const mapSongFromSupabase = async (song: SupabaseSong): Promise<Track> => {
  // Get artist and album details
  const { data: artist } = await supabase
    .from('artists')
    .select('name')
    .eq('id', song.artist_id)
    .maybeSingle();
    
  const { data: album } = await supabase
    .from('albums')
    .select('name')
    .eq('id', song.album_id)
    .maybeSingle();
    
  return {
    id: song.id,
    name: song.name,
    artistName: artist?.name || 'Unknown Artist',
    artistId: song.artist_id,
    albumName: album?.name || 'Unknown Album',
    albumId: song.album_id || '',
    duration: song.duration,
    previewURL: song.audio_url,
    image: song.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop',
    like_count: song.like_count || 0,
    play_count: song.play_count || 0
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
  
  // Map each song to a Track and check if user has liked it
  const trackPromises = songs.map(async (song) => {
    const track = await mapSongFromSupabase(song);
    
    // Check if current user has liked this song
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: like } = await supabase
        .from('song_likes')
        .select('id')
        .eq('song_id', song.id)
        .eq('user_id', session.user.id)
        .maybeSingle();
      
      track.is_liked = !!like;
    }
    
    return track;
  });
  
  return await Promise.all(trackPromises);
};

export const getArtistById = async (id: string): Promise<Artist | null> => {
  const { data: artist, error } = await supabase
    .from('artists')
    .select('*')
    .eq('id', id)
    .maybeSingle();
    
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
    .maybeSingle();
    
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

// Function to get tracks by artist ID
export const getTracksByArtistId = async (artistId: string): Promise<Track[]> => {
  const { data: songs, error } = await supabase
    .from('songs')
    .select('*')
    .eq('artist_id', artistId);
    
  if (error) {
    console.error(`Error fetching tracks for artist ${artistId}:`, error);
    return [];
  }
  
  // Map each song to a Track
  const trackPromises = songs.map(mapSongFromSupabase);
  return await Promise.all(trackPromises);
};

// Function to get user's artist profile
export const getUserArtistProfile = async (userId: string): Promise<Artist | null> => {
  const { data: artist, error } = await supabase
    .from('artists')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
    
  if (error) {
    console.error(`Error fetching artist profile for user ${userId}:`, error);
    return null;
  }
  
  if (!artist) {
    return null;
  }
  
  return mapArtistFromSupabase(artist);
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
  bio?: string | null
): Promise<Track | null> => {
  try {
    console.log("Starting song publishing process...");
    console.log("Input parameters:", { songName, artistName, albumName, duration, bio });
    
    // First, check if the user already has an artist profile
    const { data: existingUserArtist, error: userArtistError } = await supabase
      .from('artists')
      .select('id, name, bio, image_url, verification_status')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (userArtistError) {
      console.error('Error checking for existing user artist:', userArtistError);
      return null;
    }
    
    let artistId: string;
    
    if (existingUserArtist) {
      console.log("User already has an artist profile:", existingUserArtist);
      artistId = existingUserArtist.id;
      
      // Update the artist profile if needed
      const updates: any = {};
      let needsUpdate = false;
      
      // Only update if values are different
      if (artistName !== existingUserArtist.name) {
        updates.name = artistName;
        needsUpdate = true;
      }
      
      if (bio && bio !== existingUserArtist.bio) {
        updates.bio = bio;
        needsUpdate = true;
      }
      
      if (imageUrl && imageUrl !== existingUserArtist.image_url) {
        updates.image_url = imageUrl;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log("Updating artist profile with:", updates);
        const { error: updateError } = await supabase
          .from('artists')
          .update(updates)
          .eq('id', artistId);
          
        if (updateError) {
          console.error('Error updating artist profile:', updateError);
          // Continue anyway, not critical
        }
      }
    } else {
      console.log("Creating new artist profile...");
      // Build the artist data object with proper structure
      const artistData: any = {
        name: artistName,
        image_url: imageUrl,
        user_id: userId,
        verification_status: 'unverified'
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
    
    // Check if an album with this name already exists for this artist
    const { data: existingAlbum, error: albumCheckError } = await supabase
      .from('albums')
      .select('id')
      .eq('artist_id', artistId)
      .eq('name', albumName)
      .maybeSingle();
      
    if (albumCheckError) {
      console.error('Error checking for existing album:', albumCheckError);
      // Continue anyway, we'll create a new album
    }
    
    let albumId: string;
    
    if (existingAlbum) {
      console.log("Using existing album:", existingAlbum);
      albumId = existingAlbum.id;
    } else {
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
      albumId = newAlbum.id;
    }
    
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
      image: imageUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop'
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

// Function to add artist verification request
export const requestVerification = async (artistId: string, email: string, reason?: string): Promise<boolean> => {
  try {
    // First, check if the artist already has a pending request
    const { data: existingRequests, error: checkError } = await supabase
      .from('verification_requests')
      .select('id')
      .eq('artist_id', artistId)
      .eq('status', 'pending');
      
    if (checkError) {
      console.error('Error checking for existing requests:', checkError);
      return false;
    }
    
    if (existingRequests && existingRequests.length > 0) {
      console.log('Artist already has a pending verification request');
      return true; // Return true to simulate success and not confuse the user
    }
    
    // Update artist verification status to pending
    const { error: artistUpdateError } = await supabase
      .from('artists')
      .update({ verification_status: 'pending' })
      .eq('id', artistId);
      
    if (artistUpdateError) {
      console.error('Error updating artist verification status:', artistUpdateError);
      // Continue anyway
    }
    
    // Insert verification request
    const { error: insertError } = await supabase
      .from('verification_requests')
      .insert({
        artist_id: artistId,
        email: email,
        reason: reason || '',
        status: 'pending'
      });
      
    if (insertError) {
      console.error('Error creating verification request:', insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error submitting verification request:', error);
    return false;
  }
};

// Function to get artist verification status
export const getArtistVerificationStatus = async (artistId: string): Promise<{ status: string, hasPendingRequest: boolean }> => {
  try {
    // Get artist verification status
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('verification_status')
      .eq('id', artistId)
      .maybeSingle();
      
    if (artistError || !artist) {
      console.error('Error fetching artist verification status:', artistError);
      return { status: 'unverified', hasPendingRequest: false };
    }
    
    // Check if there's a pending request
    const { data: requests, error: requestError } = await supabase
      .from('verification_requests')
      .select('id')
      .eq('artist_id', artistId)
      .eq('status', 'pending');
      
    if (requestError) {
      console.error('Error checking for pending requests:', requestError);
      return { status: artist.verification_status || 'unverified', hasPendingRequest: false };
    }
    
    return { 
      status: artist.verification_status || 'unverified', 
      hasPendingRequest: requests && requests.length > 0 
    };
  } catch (error) {
    console.error('Error getting verification status:', error);
    return { status: 'unverified', hasPendingRequest: false };
  }
};

// Add functionality to get all verification requests
export const getVerificationRequests = async (): Promise<any[]> => {
  try {
    const { data: requests, error } = await supabase
      .from('verification_requests')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching verification requests:', error);
      return [];
    }
    
    if (!requests || requests.length === 0) {
      return [];
    }
    
    // Fetch artists info for each request
    const requestsWithArtistInfo = await Promise.all(
      requests.map(async (request) => {
        const { data: artist } = await supabase
          .from('artists')
          .select('name, image_url')
          .eq('id', request.artist_id)
          .maybeSingle();
          
        return {
          ...request,
          artist_name: artist?.name || 'Unknown Artist',
          artist_image: artist?.image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop'
        };
      })
    );
    
    return requestsWithArtistInfo;
  } catch (error) {
    console.error('Error in getVerificationRequests:', error);
    return [];
  }
};

// Function to approve artist verification
export const approveArtist = async (requestId: string, artistId: string): Promise<boolean> => {
  try {
    console.log('Starting artist approval process:', { requestId, artistId });
    
    // Check current user session and verify admin status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('No valid session for artist approval:', sessionError);
      return false;
    }
    
    // Verify user is admin
    const adminStatus = await isUserAdmin(session.user.id);
    if (!adminStatus) {
      console.error('User is not admin, cannot approve artist');
      return false;
    }
    
    // First, update the artist's verification status
    const { error: artistError } = await supabase
      .from('artists')
      .update({ verification_status: 'verified' })
      .eq('id', artistId);
      
    if (artistError) {
      console.error('Error updating artist verification status:', artistError);
      return false;
    }
    
    console.log('Artist verification status updated successfully');
    
    // Then, update the request status
    const { error: requestError } = await supabase
      .from('verification_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);
      
    if (requestError) {
      console.error('Error updating verification request:', requestError);
      return false;
    }
    
    console.log('Verification request updated successfully');
    return true;
  } catch (error) {
    console.error('Error approving artist:', error);
    return false;
  }
};

// Function to reject artist verification
export const rejectArtist = async (requestId: string, artistId: string): Promise<boolean> => {
  try {
    console.log('Starting artist rejection process:', { requestId, artistId });
    
    // Check current user session and verify admin status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('No valid session for artist rejection:', sessionError);
      return false;
    }
    
    // Verify user is admin
    const adminStatus = await isUserAdmin(session.user.id);
    if (!adminStatus) {
      console.error('User is not admin, cannot reject artist');
      return false;
    }
    
    // First, update the artist's verification status
    const { error: artistError } = await supabase
      .from('artists')
      .update({ verification_status: 'rejected' })
      .eq('id', artistId);
      
    if (artistError) {
      console.error('Error updating artist verification status:', artistError);
      return false;
    }
    
    console.log('Artist verification status updated to rejected');
    
    // Then, update the request status
    const { error: requestError } = await supabase
      .from('verification_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
      
    if (requestError) {
      console.error('Error updating verification request:', requestError);
      return false;
    }
    
    console.log('Verification request status updated to rejected');
    return true;
  } catch (error) {
    console.error('Error rejecting artist:', error);
    return false;
  }
};

// Check if a user is an admin
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data: artist, error } = await supabase
      .from('artists')
      .select('is_admin')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return artist?.is_admin || false;
  } catch (error) {
    console.error('Error in isUserAdmin:', error);
    return false;
  }
};

// Set a user as admin (for development purposes)
export const setUserAsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('artists')
      .update({ is_admin: true })
      .eq('user_id', userId);
      
    return !error;
  } catch (error) {
    console.error('Error setting user as admin:', error);
    return false;
  }
};

// Function to delete an artist and all related content - UPDATED with better RLS handling
export const deleteArtist = async (artistId: string): Promise<boolean> => {
  try {
    console.log('Starting artist deletion process for ID:', artistId);
    
    // Check current user session and verify admin status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('No valid session for artist deletion:', sessionError);
      return false;
    }
    
    // Verify user is admin
    const adminStatus = await isUserAdmin(session.user.id);
    if (!adminStatus) {
      console.error('User is not admin, cannot delete artist');
      return false;
    }
    
    console.log('Admin status verified, proceeding with deletion');
    
    // First, delete all songs by this artist
    const { error: songsError } = await supabase
      .from('songs')
      .delete()
      .eq('artist_id', artistId);
    
    if (songsError) {
      console.error('Error deleting songs:', songsError);
      return false;
    }
    
    console.log('Songs deleted successfully');
    
    // Then, delete all albums by this artist
    const { error: albumsError } = await supabase
      .from('albums')
      .delete()
      .eq('artist_id', artistId);
    
    if (albumsError) {
      console.error('Error deleting albums:', albumsError);
      return false;
    }
    
    console.log('Albums deleted successfully');
    
    // Delete any verification requests
    const { error: requestsError } = await supabase
      .from('verification_requests')
      .delete()
      .eq('artist_id', artistId);
    
    if (requestsError) {
      console.error('Error deleting verification requests:', requestsError);
      // Continue anyway, not critical
    }
    
    console.log('Verification requests deleted');
    
    // Finally, delete the artist
    const { error: artistError } = await supabase
      .from('artists')
      .delete()
      .eq('id', artistId);
    
    if (artistError) {
      console.error('Error deleting artist:', artistError);
      return false;
    }
    
    console.log('Artist deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteArtist:', error);
    return false;
  }
};

// Function to delete a track - UPDATED with better RLS handling
export const deleteTrack = async (trackId: string): Promise<boolean> => {
  try {
    console.log('Starting track deletion process for ID:', trackId);
    
    // Check current user session and verify admin status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('No valid session for track deletion:', sessionError);
      return false;
    }
    
    // Verify user is admin
    const adminStatus = await isUserAdmin(session.user.id);
    if (!adminStatus) {
      console.error('User is not admin, cannot delete track');
      return false;
    }
    
    console.log('Admin status verified, proceeding with track deletion');
    
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', trackId);
    
    if (error) {
      console.error('Error deleting track:', error);
      return false;
    }
    
    console.log('Track deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteTrack:', error);
    return false;
  }
};

// Function to update an artist - UPDATED with better RLS handling
export const updateArtist = async (artistId: string, data: { name?: string, bio?: string, image_url?: string }): Promise<boolean> => {
  try {
    console.log('Starting artist update process:', { artistId, data });
    
    // Check current user session and verify admin status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('No valid session for artist update:', sessionError);
      return false;
    }
    
    // Verify user is admin
    const adminStatus = await isUserAdmin(session.user.id);
    if (!adminStatus) {
      console.error('User is not admin, cannot update artist');
      return false;
    }
    
    console.log('Admin status verified, proceeding with artist update');
    
    const { error } = await supabase
      .from('artists')
      .update(data)
      .eq('id', artistId);
    
    if (error) {
      console.error('Error updating artist:', error);
      return false;
    }
    
    console.log('Artist updated successfully');
    return true;
  } catch (error) {
    console.error('Error in updateArtist:', error);
    return false;
  }
};

// Add lyrics management functions
export const getLyricsBySongId = async (songId: string): Promise<any[]> => {
  try {
    const { data: lyrics, error } = await supabase
      .from('lyrics')
      .select('lyrics_data')
      .eq('song_id', songId)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching lyrics:', error);
      return [];
    }
    
    return lyrics?.lyrics_data || [];
  } catch (error) {
    console.error('Error in getLyricsBySongId:', error);
    return [];
  }
};

export const saveLyrics = async (songId: string, artistId: string, lyricsData: any[]): Promise<boolean> => {
  try {
    // Check if lyrics already exist for this song
    const { data: existingLyrics, error: checkError } = await supabase
      .from('lyrics')
      .select('id')
      .eq('song_id', songId)
      .maybeSingle();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing lyrics:', checkError);
      return false;
    }
    
    if (existingLyrics) {
      // Update existing lyrics
      const { error: updateError } = await supabase
        .from('lyrics')
        .update({ 
          lyrics_data: lyricsData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLyrics.id);
        
      if (updateError) {
        console.error('Error updating lyrics:', updateError);
        return false;
      }
    } else {
      // Create new lyrics
      const { error: insertError } = await supabase
        .from('lyrics')
        .insert({
          song_id: songId,
          artist_id: artistId,
          lyrics_data: lyricsData
        });
        
      if (insertError) {
        console.error('Error creating lyrics:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in saveLyrics:', error);
    return false;
  }
};

// Function to check if an artist is verified
export const isArtistVerified = async (artistId: string): Promise<boolean> => {
  try {
    const { data: artist, error } = await supabase
      .from('artists')
      .select('verification_status')
      .eq('id', artistId)
      .maybeSingle();
      
    if (error || !artist) {
      console.error('Error checking artist verification:', error);
      return false;
    }
    
    return artist.verification_status === 'verified';
  } catch (error) {
    console.error('Error in isArtistVerified:', error);
    return false;
  }
};

// Add like/unlike functionality
export const toggleSongLike = async (songId: string): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('User must be logged in to like songs');
      return false;
    }
    
    // Check if user has already liked this song
    const { data: existingLike } = await supabase
      .from('song_likes')
      .select('id')
      .eq('song_id', songId)
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    if (existingLike) {
      // Unlike the song
      const { error } = await supabase
        .from('song_likes')
        .delete()
        .eq('id', existingLike.id);
      
      if (error) {
        console.error('Error unliking song:', error);
        return false;
      }
      return false; // Song is now unliked
    } else {
      // Like the song
      const { error } = await supabase
        .from('song_likes')
        .insert({
          song_id: songId,
          user_id: session.user.id
        });
      
      if (error) {
        console.error('Error liking song:', error);
        return false;
      }
      return true; // Song is now liked
    }
  } catch (error) {
    console.error('Error toggling song like:', error);
    return false;
  }
};

// Add play tracking
export const recordSongPlay = async (songId: string): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase
      .from('song_plays')
      .insert({
        song_id: songId,
        user_id: session?.user.id || null
      });
    
    if (error) {
      console.error('Error recording song play:', error);
    }
  } catch (error) {
    console.error('Error recording song play:', error);
  }
};

// Get song like status for current user
export const getSongLikeStatus = async (songId: string): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    
    const { data: like } = await supabase
      .from('song_likes')
      .select('id')
      .eq('song_id', songId)
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    return !!like;
  } catch (error) {
    console.error('Error checking song like status:', error);
    return false;
  }
};

// Get all artists (no limit)
export const getAllArtists = async (): Promise<Artist[]> => {
  const { data: artists, error } = await supabase
    .from('artists')
    .select('*');

  if (error) {
    console.error('Error fetching all artists:', error);
    return [];
  }
  
  return artists.map(mapArtistFromSupabase);
};
