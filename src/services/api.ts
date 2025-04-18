// Jamendo API configuration
const API_KEY = 'af567a60';
const CLIENT_SECRET = '931d7d5868340508620990e3ba2510d6';
const BASE_URL = 'https://api.jamendo.com/v3.0';

// Types
export interface Artist {
  id: string;
  name: string;
  image: string;
  type: string;
}

export interface Album {
  id: string;
  name: string;
  artistName: string;
  releaseDate: string;
  image: string;
  artistId?: string;
}

export interface Track {
  id: string;
  name: string;
  artistName: string;
  albumName: string;
  duration: number;
  previewURL: string;
  albumId: string;
  image: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  image: string;
}

// Mock data for when API fails
export const mockArtists: Artist[] = [
  {
    id: 'art.1',
    name: 'The Weeknd',
    image: 'https://cdn.jamendo.com/default/default-artist_200.jpg',
    type: 'artist'
  },
  {
    id: 'art.2',
    name: 'Billie Eilish',
    image: 'https://cdn.jamendo.com/default/default-artist_200.jpg',
    type: 'artist'
  },
  {
    id: 'art.3',
    name: 'Drake',
    image: 'https://cdn.jamendo.com/default/default-artist_200.jpg',
    type: 'artist'
  },
  {
    id: 'art.4',
    name: 'Taylor Swift',
    image: 'https://cdn.jamendo.com/default/default-artist_200.jpg',
    type: 'artist'
  },
  {
    id: 'art.5',
    name: 'Ed Sheeran',
    image: 'https://cdn.jamendo.com/default/default-artist_200.jpg',
    type: 'artist'
  }
];

export const mockAlbums: Album[] = [
  {
    id: 'alb.1',
    name: 'After Hours',
    artistName: 'The Weeknd',
    releaseDate: '2020-03-20',
    image: 'https://cdn.jamendo.com/default/default-album_200.jpg'
  },
  {
    id: 'alb.2',
    name: 'Happier Than Ever',
    artistName: 'Billie Eilish',
    releaseDate: '2021-07-30',
    image: 'https://cdn.jamendo.com/default/default-album_200.jpg'
  },
  {
    id: 'alb.3',
    name: 'Certified Lover Boy',
    artistName: 'Drake',
    releaseDate: '2021-09-03',
    image: 'https://cdn.jamendo.com/default/default-album_200.jpg'
  }
];

export const mockTracks: Track[] = [
  {
    id: 'tra.1',
    name: 'Blinding Lights',
    artistName: 'The Weeknd',
    albumName: 'After Hours',
    duration: 201,
    previewURL: 'https://listen.hs.llnwd.net/g2/prvw/4/9/2/4/1/911214294.mp3',
    albumId: 'alb.1',
    image: 'https://cdn.jamendo.com/default/default-track_200.jpg'
  },
  {
    id: 'tra.2',
    name: 'Save Your Tears',
    artistName: 'The Weeknd',
    albumName: 'After Hours',
    duration: 215,
    previewURL: 'https://listen.hs.llnwd.net/g2/prvw/4/9/2/4/1/911214294.mp3',
    albumId: 'alb.1',
    image: 'https://cdn.jamendo.com/default/default-track_200.jpg'
  },
  {
    id: 'tra.3',
    name: 'Happier Than Ever',
    artistName: 'Billie Eilish',
    albumName: 'Happier Than Ever',
    duration: 298,
    previewURL: 'https://listen.hs.llnwd.net/g2/prvw/4/9/2/4/1/911214294.mp3',
    albumId: 'alb.2',
    image: 'https://cdn.jamendo.com/default/default-track_200.jpg'
  },
  {
    id: 'tra.4',
    name: 'NDA',
    artistName: 'Billie Eilish',
    albumName: 'Happier Than Ever',
    duration: 196,
    previewURL: 'https://listen.hs.llnwd.net/g2/prvw/4/9/2/4/1/911214294.mp3',
    albumId: 'alb.2',
    image: 'https://cdn.jamendo.com/default/default-track_200.jpg'
  },
  {
    id: 'tra.5',
    name: 'Way 2 Sexy',
    artistName: 'Drake',
    albumName: 'Certified Lover Boy',
    duration: 254,
    previewURL: 'https://listen.hs.llnwd.net/g2/prvw/4/9/2/4/1/911214294.mp3',
    albumId: 'alb.3',
    image: 'https://cdn.jamendo.com/default/default-track_200.jpg'
  }
];

export const mockPlaylists: Playlist[] = [
  {
    id: 'pla.1',
    name: 'Today\'s Top Hits',
    description: 'The most popular songs right now',
    image: 'https://cdn.jamendo.com/default/default-playlist_200.jpg'
  },
  {
    id: 'pla.2',
    name: 'RapCaviar',
    description: 'New music from Drake, Lil Baby and more',
    image: 'https://cdn.jamendo.com/default/default-playlist_200.jpg'
  },
  {
    id: 'pla.3',
    name: 'chill hits',
    description: 'Kick back to the best new and recent chill hits',
    image: 'https://cdn.jamendo.com/default/default-playlist_200.jpg'
  }
];

// Fetch top artists
export const getTopArtists = async (limit = 20): Promise<Artist[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/artists/popular?client_id=${API_KEY}&client_secret=${CLIENT_SECRET}&format=json&limit=${limit}&imagesize=200`
    );
    
    if (!response.ok) {
      console.error('Error fetching top artists:', response.status, response.statusText);
      return mockArtists;
    }
    
    const data = await response.json();
    return data.results.map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      image: artist.image,
      type: 'artist'
    })) || mockArtists;
  } catch (error) {
    console.error('Error fetching top artists:', error);
    return mockArtists;
  }
};

// Fetch top tracks
export const getTopTracks = async (limit = 20): Promise<Track[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/tracks/popular?client_id=${API_KEY}&client_secret=${CLIENT_SECRET}&format=json&limit=${limit}&imagesize=200&include=stats,audio&boost=popularity_total`
    );
    
    if (!response.ok) {
      console.error('Error fetching top tracks:', response.status, response.statusText);
      return mockTracks;
    }
    
    const data = await response.json();
    return data.results.map((track: any) => ({
      id: track.id,
      name: track.name,
      artistName: track.artist_name,
      albumName: track.album_name,
      duration: track.duration,
      previewURL: track.audio,
      albumId: track.album_id,
      image: track.image
    })) || mockTracks;
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    return mockTracks;
  }
};

// Fetch featured playlists (using Jamendo's featured tracks as playlists)
export const getFeaturedPlaylists = async (limit = 10): Promise<Playlist[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/playlists/featured?client_id=${API_KEY}&client_secret=${CLIENT_SECRET}&format=json&limit=${limit}&imagesize=200`
    );
    
    if (!response.ok) {
      console.error('Error fetching featured playlists:', response.status, response.statusText);
      return mockPlaylists;
    }
    
    const data = await response.json();
    return data.results.map((playlist: any) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || 'Featured playlist',
      image: playlist.image
    })) || mockPlaylists;
  } catch (error) {
    console.error('Error fetching featured playlists:', error);
    return mockPlaylists;
  }
};

// Fetch artist by ID
export const getArtistById = async (id: string): Promise<Artist | null> => {
  try {
    if (id.startsWith('art.')) {
      return mockArtists.find(artist => artist.id === id) || null;
    }
    
    const response = await fetch(
      `${BASE_URL}/artists/tracks/?client_id=${API_KEY}&client_secret=${CLIENT_SECRET}&format=json&id=${id}&imagesize=200`
    );
    
    if (!response.ok) {
      console.error(`Error fetching artist ${id}:`, response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    if (!data.results.length) return null;
    
    const artist = data.results[0];
    return {
      id: artist.id,
      name: artist.artist_name,
      image: artist.artist_image,
      type: 'artist'
    };
  } catch (error) {
    console.error(`Error fetching artist ${id}:`, error);
    return null;
  }
};

// Fetch album by ID
export const getAlbumById = async (id: string): Promise<Album | null> => {
  try {
    if (id.startsWith('alb.')) {
      return mockAlbums.find(album => album.id === id) || null;
    }
    
    const response = await fetch(
      `${BASE_URL}/albums/tracks/?client_id=${API_KEY}&client_secret=${CLIENT_SECRET}&format=json&id=${id}&imagesize=200`
    );
    
    if (!response.ok) {
      console.error(`Error fetching album ${id}:`, response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    if (!data.results.length) return null;
    
    const album = data.results[0];
    return {
      id: album.album_id,
      name: album.album_name,
      artistName: album.artist_name,
      releaseDate: album.releasedate,
      image: album.album_image
    };
  } catch (error) {
    console.error(`Error fetching album ${id}:`, error);
    return null;
  }
};

// Fetch tracks by album ID
export const getTracksByAlbumId = async (albumId: string): Promise<Track[]> => {
  try {
    if (albumId.startsWith('alb.')) {
      return mockTracks.filter(track => track.albumId === albumId);
    }
    
    const response = await fetch(
      `${BASE_URL}/albums/tracks/?client_id=${API_KEY}&client_secret=${CLIENT_SECRET}&format=json&id=${albumId}&imagesize=200`
    );
    
    if (!response.ok) {
      console.error(`Error fetching tracks for album ${albumId}:`, response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    return data.results.map((track: any) => ({
      id: track.id,
      name: track.name,
      artistName: track.artist_name,
      albumName: track.album_name,
      duration: track.duration,
      previewURL: track.audio,
      albumId: track.album_id,
      image: track.image
    }));
  } catch (error) {
    console.error(`Error fetching tracks for album ${albumId}:`, error);
    return [];
  }
};

// Search for content
export const searchContent = async (query: string, type = 'track', limit = 20): Promise<any[]> => {
  try {
    const searchType = type === 'track' ? 'tracks' : 
                      type === 'artist' ? 'artists' :
                      type === 'album' ? 'albums' : 'tracks';
                      
    const response = await fetch(
      `${BASE_URL}/${searchType}/search?client_id=${API_KEY}&client_secret=${CLIENT_SECRET}&format=json&limit=${limit}&namesearch=${encodeURIComponent(query)}&imagesize=200`
    );
    
    if (!response.ok) {
      console.error(`Error searching for ${type}:`, response.status, response.statusText);
      return type === 'artist' ? mockArtists :
             type === 'album' ? mockAlbums :
             type === 'playlist' ? mockPlaylists : mockTracks;
    }
    
    const data = await response.json();
    
    switch (type) {
      case 'artist':
        return data.results.map((artist: any) => ({
          id: artist.id,
          name: artist.name,
          image: artist.image,
          type: 'artist'
        })) || mockArtists;
      case 'album':
        return data.results.map((album: any) => ({
          id: album.id,
          name: album.name,
          artistName: album.artist_name,
          releaseDate: album.releasedate,
          image: album.image
        })) || mockAlbums;
      case 'track':
      default:
        return data.results.map((track: any) => ({
          id: track.id,
          name: track.name,
          artistName: track.artist_name,
          albumName: track.album_name,
          duration: track.duration,
          previewURL: track.audio,
          albumId: track.album_id,
          image: track.image
        })) || mockTracks;
    }
  } catch (error) {
    console.error(`Error searching for ${type}:`, error);
    return type === 'artist' ? mockArtists :
           type === 'album' ? mockAlbums :
           type === 'playlist' ? mockPlaylists : mockTracks;
  }
};

// Get image URL for content
export const getImageUrl = (item: any, size = 'sm'): string => {
  if (!item) {
    return 'https://cdn.jamendo.com/default/default-artist_200.jpg';
  }

  if (item.image) {
    return item.image;
  }

  return 'https://cdn.jamendo.com/default/default-artist_200.jpg';
};
