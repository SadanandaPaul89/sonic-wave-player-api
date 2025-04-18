
// Napster API configuration
const API_KEY = 'YTkxZTRhNzAtODdlNy00ZjMzLTg0MWItOTc0NmZmNjU4Yzk4';
const BASE_URL = 'https://api.napster.com/v2.2';

// Types
export interface Artist {
  id: string;
  name: string;
  href: string;
  type: string;
  links?: {
    images?: {
      href: string;
    };
  };
}

export interface Album {
  id: string;
  name: string;
  artistName: string;
  href: string;
  released: string;
  links?: {
    images?: {
      href: string;
    };
  };
}

export interface Track {
  id: string;
  name: string;
  artistName: string;
  albumName: string;
  playbackSeconds: number;
  previewURL: string;
  href: string;
  albumId: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  href: string;
  links?: {
    images?: {
      href: string;
    };
  };
}

// Fetch top artists
export const getTopArtists = async (limit = 20): Promise<Artist[]> => {
  try {
    const response = await fetch(`${BASE_URL}/artists/top?apikey=${API_KEY}&limit=${limit}`);
    const data = await response.json();
    return data.artists || [];
  } catch (error) {
    console.error('Error fetching top artists:', error);
    return [];
  }
};

// Fetch top tracks
export const getTopTracks = async (limit = 20): Promise<Track[]> => {
  try {
    const response = await fetch(`${BASE_URL}/tracks/top?apikey=${API_KEY}&limit=${limit}`);
    const data = await response.json();
    return data.tracks || [];
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    return [];
  }
};

// Fetch featured playlists
export const getFeaturedPlaylists = async (limit = 10): Promise<Playlist[]> => {
  try {
    const response = await fetch(`${BASE_URL}/playlists/featured?apikey=${API_KEY}&limit=${limit}`);
    const data = await response.json();
    return data.playlists || [];
  } catch (error) {
    console.error('Error fetching featured playlists:', error);
    return [];
  }
};

// Fetch artist by ID
export const getArtistById = async (id: string): Promise<Artist | null> => {
  try {
    const response = await fetch(`${BASE_URL}/artists/${id}?apikey=${API_KEY}`);
    const data = await response.json();
    return data.artists ? data.artists[0] : null;
  } catch (error) {
    console.error(`Error fetching artist ${id}:`, error);
    return null;
  }
};

// Fetch album by ID
export const getAlbumById = async (id: string): Promise<Album | null> => {
  try {
    const response = await fetch(`${BASE_URL}/albums/${id}?apikey=${API_KEY}`);
    const data = await response.json();
    return data.albums ? data.albums[0] : null;
  } catch (error) {
    console.error(`Error fetching album ${id}:`, error);
    return null;
  }
};

// Fetch tracks by album ID
export const getTracksByAlbumId = async (albumId: string): Promise<Track[]> => {
  try {
    const response = await fetch(`${BASE_URL}/albums/${albumId}/tracks?apikey=${API_KEY}`);
    const data = await response.json();
    return data.tracks || [];
  } catch (error) {
    console.error(`Error fetching tracks for album ${albumId}:`, error);
    return [];
  }
};

// Search for content
export const searchContent = async (query: string, type = 'track', limit = 20): Promise<any[]> => {
  try {
    const response = await fetch(`${BASE_URL}/search?apikey=${API_KEY}&query=${encodeURIComponent(query)}&type=${type}&limit=${limit}`);
    const data = await response.json();
    
    // Return the appropriate data based on the search type
    switch (type) {
      case 'artist':
        return data.search.data.artists || [];
      case 'album':
        return data.search.data.albums || [];
      case 'track':
        return data.search.data.tracks || [];
      case 'playlist':
        return data.search.data.playlists || [];
      default:
        return data.search.data.tracks || [];
    }
  } catch (error) {
    console.error(`Error searching for ${type}:`, error);
    return [];
  }
};

// Get image URL for content
export const getImageUrl = (item: any, size = 'sm'): string => {
  const sizeMap: Record<string, string> = {
    sm: '170x170',
    md: '300x300',
    lg: '500x500',
    xl: '800x800'
  };
  
  const defaultImage = 'https://api.napster.com/imageserver/images/v2/default/artist/170x170.png';
  
  if (!item || !item.links || !item.links.images) {
    return defaultImage;
  }
  
  const imagesUrl = item.links.images.href;
  return `${imagesUrl}/${sizeMap[size]}`;
};
