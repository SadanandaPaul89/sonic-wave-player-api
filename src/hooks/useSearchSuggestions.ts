import { useState, useEffect, useCallback } from 'react';
import { searchContent } from '@/services/supabaseService';
import { mockSearchContent } from '@/services/mockSearchService';

interface SearchSuggestion {
  id: string;
  title: string;
  type: 'track' | 'artist' | 'album';
  subtitle?: string;
  image?: string;
}

export const useSearchSuggestions = (query: string, enabled: boolean = true) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2 || !enabled) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Try real search first, fallback to mock data
      let tracks, artists, albums;
      
      try {
        // Fetch suggestions from multiple sources
        [tracks, artists, albums] = await Promise.all([
          searchContent(searchQuery, 'track', 3),
          searchContent(searchQuery, 'artist', 3),
          searchContent(searchQuery, 'album', 3)
        ]);
      } catch (error) {
        // Fallback to mock data
        [tracks, artists, albums] = await Promise.all([
          mockSearchContent(searchQuery, 'track', 3),
          mockSearchContent(searchQuery, 'artist', 3),
          mockSearchContent(searchQuery, 'album', 3)
        ]);
      }

      const trackSuggestions: SearchSuggestion[] = tracks.map(track => ({
        id: track.id,
        title: track.title,
        type: 'track' as const,
        subtitle: track.artistName,
        image: track.image
      }));

      const artistSuggestions: SearchSuggestion[] = artists.map(artist => ({
        id: artist.id,
        title: artist.name,
        type: 'artist' as const,
        image: artist.image
      }));

      const albumSuggestions: SearchSuggestion[] = albums.map(album => ({
        id: album.id,
        title: album.name,
        type: 'album' as const,
        subtitle: album.artistName,
        image: album.image
      }));

      // Combine and limit suggestions
      const allSuggestions = [
        ...trackSuggestions,
        ...artistSuggestions,
        ...albumSuggestions
      ].slice(0, 8);

      setSuggestions(allSuggestions);
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(query);
    }, 300); // Debounce suggestions

    return () => clearTimeout(timeoutId);
  }, [query, fetchSuggestions]);

  return { suggestions, isLoading };
};

// Popular search terms (fallback when no query)
export const POPULAR_SEARCHES = [
  'Pop hits',
  'Rock classics',
  'Hip hop',
  'Electronic',
  'Jazz',
  'Indie',
  'Classical',
  'Country',
  'R&B',
  'Alternative'
];