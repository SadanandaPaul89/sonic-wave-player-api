export interface Song {
  id: string;
  title: string;
  artist: string;
  playCount: number;
  imageUrl: string;
}

export interface Artist {
  id: string;
  name: string;
  followers: number;
  imageUrl: string;
}

export interface Listener {
  id: string;
  name: string;
  totalPlays: number;
  avatarUrl: string;
}

const topSongs: Song[] = [
  {
    id: '1',
    title: 'Electric Dreams',
    artist: 'Synthwave Collective',
    playCount: 12450,
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: '2',
    title: 'Midnight City',
    artist: 'The Night Riders',
    playCount: 11230,
    imageUrl: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: '3',
    title: 'Ocean Breeze',
    artist: 'Calm Waves',
    playCount: 9870,
    imageUrl: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=80&q=80',
  },
];

const topArtists: Artist[] = [
  {
    id: '1',
    name: 'Synthwave Collective',
    followers: 54000,
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: '2',
    name: 'The Night Riders',
    followers: 48000,
    imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: '3',
    name: 'Calm Waves',
    followers: 42000,
    imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=80&q=80',
  },
];

const topListeners: Listener[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    totalPlays: 3500,
    avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  {
    id: '2',
    name: 'Bob Smith',
    totalPlays: 3200,
    avatarUrl: 'https://randomuser.me/api/portraits/men/45.jpg',
  },
  {
    id: '3',
    name: 'Carol Lee',
    totalPlays: 2900,
    avatarUrl: 'https://randomuser.me/api/portraits/women/12.jpg',
  },
];

export const leaderboardService = {
  getTopSongs: async (): Promise<Song[]> => {
    // Simulate API delay
    return new Promise(resolve => setTimeout(() => resolve(topSongs), 500));
  },
  getTopArtists: async (): Promise<Artist[]> => {
    return new Promise(resolve => setTimeout(() => resolve(topArtists), 500));
  },
  getTopListeners: async (): Promise<Listener[]> => {
    return new Promise(resolve => setTimeout(() => resolve(topListeners), 500));
  },
};
