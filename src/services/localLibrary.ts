
import { Track } from './api';

const LOCAL_TRACKS_KEY = 'local_music_library';
const PUBLISHED_TRACKS_KEY = 'published_music_library';
const ARTISTS_KEY = 'music_artists';
const VERIFICATION_REQUESTS_KEY = 'verification_requests';
const VERIFIED_ARTISTS_KEY = 'verified_artists';

export interface Artist {
  id: string;
  name: string;
  bio: string;
  image: string;
  userId: string;
  isVerified: boolean;
}

export interface PublishedTrack extends Track {
  artistId: string;
  publishedDate: string;
}

export interface VerificationRequest {
  id: string;
  artistId: string;
  artistName: string;
  email: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Add a new track to the local library
export const addLocalTrack = (track: Track) => {
  const existingTracks = getAllLocalTracks();
  const updatedTracks = [...existingTracks, track];
  localStorage.setItem(LOCAL_TRACKS_KEY, JSON.stringify(updatedTracks));
  return track;
};

// Get all tracks from the local library
export const getAllLocalTracks = (): Track[] => {
  const tracksJson = localStorage.getItem(LOCAL_TRACKS_KEY);
  if (!tracksJson) return [];
  
  try {
    return JSON.parse(tracksJson);
  } catch (error) {
    console.error('Error parsing local tracks:', error);
    return [];
  }
};

// Remove a track from the local library
export const removeLocalTrack = (trackId: string) => {
  const existingTracks = getAllLocalTracks();
  const updatedTracks = existingTracks.filter(track => track.id !== trackId);
  localStorage.setItem(LOCAL_TRACKS_KEY, JSON.stringify(updatedTracks));
};

// Clear all local tracks
export const clearLocalLibrary = () => {
  localStorage.removeItem(LOCAL_TRACKS_KEY);
};

// Artist Profile functions
export const createArtistProfile = (artist: Omit<Artist, 'id' | 'isVerified'>): Artist => {
  const existingArtists = getAllArtists();
  const newArtist: Artist = {
    ...artist,
    id: `artist-${Date.now()}`,
    isVerified: false
  };
  
  localStorage.setItem(ARTISTS_KEY, JSON.stringify([...existingArtists, newArtist]));
  return newArtist;
};

export const getAllArtists = (): Artist[] => {
  const artistsJson = localStorage.getItem(ARTISTS_KEY);
  if (!artistsJson) return [];
  
  try {
    return JSON.parse(artistsJson);
  } catch (error) {
    console.error('Error parsing artists:', error);
    return [];
  }
};

export const getArtistById = (artistId: string): Artist | undefined => {
  const artists = getAllArtists();
  return artists.find(artist => artist.id === artistId);
};

export const updateArtistProfile = (updatedArtist: Artist): Artist => {
  const artists = getAllArtists();
  const updatedArtists = artists.map(artist => 
    artist.id === updatedArtist.id ? updatedArtist : artist
  );
  
  localStorage.setItem(ARTISTS_KEY, JSON.stringify(updatedArtists));
  return updatedArtist;
};

// Published Tracks functions
export const publishTrack = (track: Omit<PublishedTrack, 'publishedDate'>): PublishedTrack => {
  const existingTracks = getAllPublishedTracks();
  const publishedTrack: PublishedTrack = {
    ...track,
    publishedDate: new Date().toISOString()
  };
  
  localStorage.setItem(PUBLISHED_TRACKS_KEY, JSON.stringify([...existingTracks, publishedTrack]));
  return publishedTrack;
};

export const getAllPublishedTracks = (): PublishedTrack[] => {
  const tracksJson = localStorage.getItem(PUBLISHED_TRACKS_KEY);
  if (!tracksJson) return [];
  
  try {
    return JSON.parse(tracksJson);
  } catch (error) {
    console.error('Error parsing published tracks:', error);
    return [];
  }
};

export const getPublishedTracksByArtistId = (artistId: string): PublishedTrack[] => {
  const tracks = getAllPublishedTracks();
  return tracks.filter(track => track.artistId === artistId);
};

export const removePublishedTrack = (trackId: string) => {
  const existingTracks = getAllPublishedTracks();
  const updatedTracks = existingTracks.filter(track => track.id !== trackId);
  localStorage.setItem(PUBLISHED_TRACKS_KEY, JSON.stringify(updatedTracks));
};

// Verification functions
export const requestVerification = (artistId: string, email: string): VerificationRequest => {
  const artist = getArtistById(artistId);
  if (!artist) {
    throw new Error("Artist not found");
  }
  
  const existingRequests = getAllVerificationRequests();
  const newRequest: VerificationRequest = {
    id: `verification-${Date.now()}`,
    artistId,
    artistName: artist.name,
    email,
    requestDate: new Date().toISOString(),
    status: 'pending'
  };
  
  localStorage.setItem(VERIFICATION_REQUESTS_KEY, JSON.stringify([...existingRequests, newRequest]));
  
  // Send email notification (simulated)
  console.log(`Verification request email sent to dynoaryan@gmail.com for artist: ${artist.name}`);
  
  return newRequest;
};

export const getAllVerificationRequests = (): VerificationRequest[] => {
  const requestsJson = localStorage.getItem(VERIFICATION_REQUESTS_KEY);
  if (!requestsJson) return [];
  
  try {
    return JSON.parse(requestsJson);
  } catch (error) {
    console.error('Error parsing verification requests:', error);
    return [];
  }
};

export const updateVerificationRequest = (requestId: string, status: 'approved' | 'rejected'): VerificationRequest | undefined => {
  const requests = getAllVerificationRequests();
  let updatedRequest: VerificationRequest | undefined;
  
  const updatedRequests = requests.map(request => {
    if (request.id === requestId) {
      updatedRequest = { ...request, status };
      return updatedRequest;
    }
    return request;
  });
  
  if (updatedRequest) {
    localStorage.setItem(VERIFICATION_REQUESTS_KEY, JSON.stringify(updatedRequests));
    
    // If approved, update artist verification status
    if (status === 'approved') {
      const artist = getArtistById(updatedRequest.artistId);
      if (artist) {
        updateArtistProfile({
          ...artist,
          isVerified: true
        });
      }
    }
  }
  
  return updatedRequest;
};

export const isArtistVerified = (artistId: string): boolean => {
  const artist = getArtistById(artistId);
  return !!artist?.isVerified;
};
