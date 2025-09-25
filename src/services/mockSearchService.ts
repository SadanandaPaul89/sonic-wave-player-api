// Mock search service for development/testing
export interface MockTrack {
  id: string;
  title: string;
  artistName: string;
  image?: string;
  duration: number;
  genre?: string;
  created_at: string;
  play_count?: number;
}

export interface MockArtist {
  id: string;
  name: string;
  image?: string;
  genre?: string;
  created_at: string;
}

export interface MockAlbum {
  id: string;
  name: string;
  artistName: string;
  image?: string;
  genre?: string;
  release_date: string;
}

// Mock data
const mockTracks: MockTrack[] = [
  {
    id: '1',
    title: 'Muskuharat complete',
    artistName: 'AVAX',
    duration: 251,
    genre: 'Remix',
    created_at: '2024-01-15T00:00:00Z',
    play_count: 1250,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
  },
  {
    id: '2',
    title: 'Electronic Dreams',
    artistName: 'SynthWave',
    duration: 195,
    genre: 'Electronic',
    created_at: '2024-02-01T00:00:00Z',
    play_count: 890,
    image: 'https://images.unsplash.com/photo-1571974599782-87624638275c?w=300&h=300&fit=crop'
  },
  {
    id: '3',
    title: 'Midnight Jazz',
    artistName: 'Blue Note Collective',
    duration: 320,
    genre: 'Jazz',
    created_at: '2023-12-10T00:00:00Z',
    play_count: 2100,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
  },
  {
    id: '4',
    title: 'Rock Anthem',
    artistName: 'Thunder Strike',
    duration: 240,
    genre: 'Rock',
    created_at: '2024-01-20T00:00:00Z',
    play_count: 1500,
    image: 'https://images.unsplash.com/photo-1571974599782-87624638275c?w=300&h=300&fit=crop'
  },
  {
    id: '5',
    title: 'Pop Sensation',
    artistName: 'Melody Star',
    duration: 180,
    genre: 'Pop',
    created_at: '2024-03-01T00:00:00Z',
    play_count: 3200,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
  },
  {
    id: '6',
    title: 'Hip Hop Flow',
    artistName: 'MC Rhythm',
    duration: 210,
    genre: 'Hip Hop',
    created_at: '2024-02-15T00:00:00Z',
    play_count: 1800,
    image: 'https://images.unsplash.com/photo-1571974599782-87624638275c?w=300&h=300&fit=crop'
  }
];

const mockArtists: MockArtist[] = [
  {
    id: '1',
    name: 'AVAX',
    genre: 'Electronic',
    created_at: '2023-01-01T00:00:00Z',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
  },
  {
    id: '2',
    name: 'SynthWave',
    genre: 'Electronic',
    created_at: '2023-02-01T00:00:00Z',
    image: 'https://images.unsplash.com/photo-1571974599782-87624638275c?w=300&h=300&fit=crop'
  },
  {
    id: '3',
    name: 'Blue Note Collective',
    genre: 'Jazz',
    created_at: '2022-12-01T00:00:00Z',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
  },
  {
    id: '4',
    name: 'Thunder Strike',
    genre: 'Rock',
    created_at: '2023-06-01T00:00:00Z',
    image: 'https://images.unsplash.com/photo-1571974599782-87624638275c?w=300&h=300&fit=crop'
  },
  {
    id: '5',
    name: 'Melody Star',
    genre: 'Pop',
    created_at: '2023-08-01T00:00:00Z',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
  }
];

const mockAlbums: MockAlbum[] = [
  {
    id: '1',
    name: 'Remix Collection',
    artistName: 'AVAX',
    genre: 'Electronic',
    release_date: '2024-01-01T00:00:00Z',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
  },
  {
    id: '2',
    name: 'Digital Waves',
    artistName: 'SynthWave',
    genre: 'Electronic',
    release_date: '2024-02-01T00:00:00Z',
    image: 'https://images.unsplash.com/photo-1571974599782-87624638275c?w=300&h=300&fit=crop'
  },
  {
    id: '3',
    name: 'Late Night Sessions',
    artistName: 'Blue Note Collective',
    genre: 'Jazz',
    release_date: '2023-12-01T00:00:00Z',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
  },
  {
    id: '4',
    name: 'Rock Revolution',
    artistName: 'Thunder Strike',
    genre: 'Rock',
    release_date: '2024-01-15T00:00:00Z',
    image: 'https://images.unsplash.com/photo-1571974599782-87624638275c?w=300&h=300&fit=crop'
  }
];

export const mockSearchContent = async (
  query: string,
  type: 'track' | 'artist' | 'album',
  limit: number = 10
): Promise<MockTrack[] | MockArtist[] | MockAlbum[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const searchTerm = query.toLowerCase();

  switch (type) {
    case 'track':
      return mockTracks
        .filter(track => 
          track.title.toLowerCase().includes(searchTerm) ||
          track.artistName.toLowerCase().includes(searchTerm) ||
          track.genre?.toLowerCase().includes(searchTerm)
        )
        .slice(0, limit);

    case 'artist':
      return mockArtists
        .filter(artist => 
          artist.name.toLowerCase().includes(searchTerm) ||
          artist.genre?.toLowerCase().includes(searchTerm)
        )
        .slice(0, limit);

    case 'album':
      return mockAlbums
        .filter(album => 
          album.name.toLowerCase().includes(searchTerm) ||
          album.artistName.toLowerCase().includes(searchTerm) ||
          album.genre?.toLowerCase().includes(searchTerm)
        )
        .slice(0, limit);

    default:
      return [];
  }
};