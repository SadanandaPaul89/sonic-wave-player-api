
// Napster API configuration
const API_KEY = 'ZTkxZTRhNzAtODdlNy00ZjMzLTg0MWItOTc0NmZmNjU4Yzk4'; // Updated API key
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

// Mock data for when API fails
export const mockArtists: Artist[] = [
  {
    id: 'art.1',
    name: 'The Weeknd',
    href: '#',
    type: 'artist',
    links: {
      images: {
        href: 'https://api.napster.com/imageserver/v2/artists/art.1/images'
      }
    }
  },
  {
    id: 'art.2',
    name: 'Billie Eilish',
    href: '#',
    type: 'artist',
    links: {
      images: {
        href: 'https://api.napster.com/imageserver/v2/artists/art.2/images'
      }
    }
  },
  {
    id: 'art.3',
    name: 'Drake',
    href: '#',
    type: 'artist',
    links: {
      images: {
        href: 'https://api.napster.com/imageserver/v2/artists/art.3/images'
      }
    }
  },
  {
    id: 'art.4',
    name: 'Taylor Swift',
    href: '#',
    type: 'artist',
    links: {
      images: {
        href: 'https://api.napster.com/imageserver/v2/artists/art.4/images'
      }
    }
  },
  {
    id: 'art.5',
    name: 'Ed Sheeran',
    href: '#',
    type: 'artist',
    links: {
      images: {
        href: 'https://api.napster.com/imageserver/v2/artists/art.5/images'
      }
    }
  }
];

export const mockAlbums: Album[] = [
  {
    id: 'alb.1',
    name: 'After Hours',
    artistName: 'The Weeknd',
    href: '#',
    released: '2020-03-20',
    links: {
      images: {
        href: 'https://api.napster.com/imageserver/v2/albums/alb.1/images'
      }
    }
  },
  {
    id: 'alb.2',
    name: 'Happier Than Ever',
    artistName: 'Billie Eilish',
    href: '#',
    released: '2021-07-30',
    links: {
      images: {
        href: 'https://api.napster.com/imageserver/v2/albums/alb.2/images'
      }
    }
  },
  {
    id: 'alb.3',
    name: 'Certified Lover Boy',
    artistName: 'Drake',
    href: '#',
    released: '2021-09-03',
    links: {
      images: {
        href: 'https://api.napster.com/imageserver/v2/albums/alb.3/images'
      }
    }
  }
];

export const mockTracks: Track[] = [
  {
    id: 'tra.1',
    name: 'Blinding Lights',
    artistName: 'The Weeknd',
    albumName: 'After Hours',
    playbackSeconds: 201,
    previewURL: 'https://listen.hs.llnwd.net/g2/prvw/4/9/2/4/1/911214294.mp3',
    href: '#',
    albumId: 'alb.1'
  },
  {
    id: 'tra.2',
    name: 'Save Your Tears',
    artistName: 'The Weeknd',
    albumName: 'After Hours',
    playbackSeconds: 215,
    previewURL: 'https://listen.hs.llnwd.net/g2/prvw/4/9/2/4/1/911214294.mp3',
    href: '#',
    albumId: 'alb.1'
  },
  {
    id: 'tra.3',
    name: 'Happier Than Ever',
    artistName: 'Billie Eilish',
    albumName: 'Happier Than Ever',
    playbackSeconds: 298,
    previewURL: 'https://listen.hs.llnwd.net/g2/prvw/4/9/2/4/1/911214294.mp3',
    href: '#',
    albumId: 'alb.2'
  },
  {
    id: 'tra.4',
    name: 'NDA',
    artistName: 'Billie Eilish',
    albumName: 'Happier Than Ever',
    playbackSeconds: 196,
    previewURL: 'https://listen.hs.llnwd.net/g2/prvw/4/9/2/4/1/911214294.mp3',
    href: '#',
    albumId: 'alb.2'
  },
  {
    id: 'tra.5',
    name: 'Way 2 Sexy',
    artistName: 'Drake',
    albumName: 'Certified Lover Boy',
    playbackSeconds: 254,
    previewURL: 'https://listen.hs.llnwd.net/g2/prvw/4/9/2/4/1/911214294.mp3',
    href: '#',
    albumId: 'alb.3'
  }
];

export const mockPlaylists: Playlist[] = [
  {
    id: 'pla.1',
    name: 'Today\'s Top Hits',
    description: 'The most popular songs right now',
    href: '#',
    links: {
      images: {
        href: 'https://api.napster.com/imageserver/v2/playlists/pla.1/images'
      }
    }
  },
  {
    id: 'pla.2',
    name: 'RapCaviar',
    description: 'New music from Drake, Lil Baby and more',
    href: '#',
    links: {
      images: {
        href: 'https://api.napster.com/imageserver/v2/playlists/pla.2/images'
      }
    }
  },
  {
    id: 'pla.3',
    name: 'chill hits',
    description: 'Kick back to the best new and recent chill hits',
    href: '#',
    links: {
      images: {
        href: 'https://api.napster.com/imageserver/v2/playlists/pla.3/images'
      }
    }
  }
];

// Fetch top artists
export const getTopArtists = async (limit = 20): Promise<Artist[]> => {
  try {
    const response = await fetch(`${BASE_URL}/artists/top?apikey=${API_KEY}&limit=${limit}`);
    
    if (!response.ok) {
      console.error('Error fetching top artists:', response.status, response.statusText);
      return mockArtists;
    }
    
    const data = await response.json();
    return data.artists && data.artists.length > 0 ? data.artists : mockArtists;
  } catch (error) {
    console.error('Error fetching top artists:', error);
    return mockArtists;
  }
};

// Fetch top tracks
export const getTopTracks = async (limit = 20): Promise<Track[]> => {
  try {
    const response = await fetch(`${BASE_URL}/tracks/top?apikey=${API_KEY}&limit=${limit}`);
    
    if (!response.ok) {
      console.error('Error fetching top tracks:', response.status, response.statusText);
      return mockTracks;
    }
    
    const data = await response.json();
    return data.tracks && data.tracks.length > 0 ? data.tracks : mockTracks;
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    return mockTracks;
  }
};

// Fetch featured playlists
export const getFeaturedPlaylists = async (limit = 10): Promise<Playlist[]> => {
  try {
    const response = await fetch(`${BASE_URL}/playlists/featured?apikey=${API_KEY}&limit=${limit}`);
    
    if (!response.ok) {
      console.error('Error fetching featured playlists:', response.status, response.statusText);
      return mockPlaylists;
    }
    
    const data = await response.json();
    return data.playlists && data.playlists.length > 0 ? data.playlists : mockPlaylists;
  } catch (error) {
    console.error('Error fetching featured playlists:', error);
    return mockPlaylists;
  }
};

// Fetch artist by ID
export const getArtistById = async (id: string): Promise<Artist | null> => {
  try {
    // Check if it's a mock artist
    if (id.startsWith('art.')) {
      return mockArtists.find(artist => artist.id === id) || null;
    }
    
    const response = await fetch(`${BASE_URL}/artists/${id}?apikey=${API_KEY}`);
    
    if (!response.ok) {
      console.error(`Error fetching artist ${id}:`, response.status, response.statusText);
      return null;
    }
    
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
    // Check if it's a mock album
    if (id.startsWith('alb.')) {
      return mockAlbums.find(album => album.id === id) || null;
    }
    
    const response = await fetch(`${BASE_URL}/albums/${id}?apikey=${API_KEY}`);
    
    if (!response.ok) {
      console.error(`Error fetching album ${id}:`, response.status, response.statusText);
      return null;
    }
    
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
    // Check if it's a mock album
    if (albumId.startsWith('alb.')) {
      return mockTracks.filter(track => track.albumId === albumId);
    }
    
    const response = await fetch(`${BASE_URL}/albums/${albumId}/tracks?apikey=${API_KEY}`);
    
    if (!response.ok) {
      console.error(`Error fetching tracks for album ${albumId}:`, response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    return data.tracks && data.tracks.length > 0 ? data.tracks : [];
  } catch (error) {
    console.error(`Error fetching tracks for album ${albumId}:`, error);
    return [];
  }
};

// Search for content
export const searchContent = async (query: string, type = 'track', limit = 20): Promise<any[]> => {
  try {
    const response = await fetch(`${BASE_URL}/search?apikey=${API_KEY}&query=${encodeURIComponent(query)}&type=${type}&limit=${limit}`);
    
    if (!response.ok) {
      console.error(`Error searching for ${type}:`, response.status, response.statusText);
      
      // Return appropriate mock data based on type
      switch (type) {
        case 'artist':
          return mockArtists;
        case 'album':
          return mockAlbums;
        case 'track':
          return mockTracks;
        case 'playlist':
          return mockPlaylists;
        default:
          return mockTracks;
      }
    }
    
    const data = await response.json();
    
    // Return the appropriate data based on the search type
    switch (type) {
      case 'artist':
        return (data.search?.data?.artists && data.search.data.artists.length > 0) 
          ? data.search.data.artists 
          : mockArtists;
      case 'album':
        return (data.search?.data?.albums && data.search.data.albums.length > 0) 
          ? data.search.data.albums 
          : mockAlbums;
      case 'track':
        return (data.search?.data?.tracks && data.search.data.tracks.length > 0) 
          ? data.search.data.tracks 
          : mockTracks;
      case 'playlist':
        return (data.search?.data?.playlists && data.search.data.playlists.length > 0) 
          ? data.search.data.playlists 
          : mockPlaylists;
      default:
        return (data.search?.data?.tracks && data.search.data.tracks.length > 0) 
          ? data.search.data.tracks 
          : mockTracks;
    }
  } catch (error) {
    console.error(`Error searching for ${type}:`, error);
    
    // Return appropriate mock data based on type
    switch (type) {
      case 'artist':
        return mockArtists;
      case 'album':
        return mockAlbums;
      case 'track':
        return mockTracks;
      case 'playlist':
        return mockPlaylists;
      default:
        return mockTracks;
    }
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
