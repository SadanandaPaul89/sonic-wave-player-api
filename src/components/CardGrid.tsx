
import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Disc, ListMusic } from 'lucide-react';

interface Card {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  type: 'artist' | 'album' | 'playlist';
}

interface CardGridProps {
  title: string;
  cards: Card[];
  cols?: 2 | 3 | 4 | 5 | 6;
}

const CardGrid: React.FC<CardGridProps> = ({ title, cards, cols = 5 }) => {
  const getLink = (card: Card) => {
    switch (card.type) {
      case 'artist':
        return `/artist/${card.id}`;
      case 'album':
        return `/album/${card.id}`;
      case 'playlist':
        return `/playlist/${card.id}`;
      default:
        return '#';
    }
  };

  const getGridCols = () => {
    switch (cols) {
      case 2: return 'grid-cols-1 sm:grid-cols-2';
      case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      case 5: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
      case 6: return 'grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
    }
  };

  const getEmptyStateIcon = (type = cards[0]?.type || 'album') => {
    switch (type) {
      case 'artist': return <Music size={64} className="text-gray-600" />;
      case 'album': return <Disc size={64} className="text-gray-600" />;
      case 'playlist': return <ListMusic size={64} className="text-gray-600" />;
      default: return <Music size={64} className="text-gray-600" />;
    }
  };

  // Helper: map title to a "See all" destination
  const getSeeAllLink = () => {
    // Normalize title for mapping
    const normalized = title.trim().toLowerCase();
    if (normalized.includes('artist')) return '/artists';
    if (normalized.includes('album')) return '/albums';
    if (normalized.includes('playlist')) return '/playlists';
    // Can extend as needed for other types
    return '/';
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {cards.length > 0 && (
          <Link
            to={getSeeAllLink()}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            See all
          </Link>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-spotify-elevated rounded-md">
          {getEmptyStateIcon()}
          <h3 className="mt-4 text-xl font-medium text-gray-300">No {title.toLowerCase()} available</h3>
          <p className="mt-2 text-gray-400">Check back later for new content</p>
        </div>
      ) : (
        <div className={`card-grid ${getGridCols()}`}>
          {cards.map((card) => (
            <Link
              key={card.id}
              to={getLink(card)}
              className="card-hover-container music-card p-2 sm:p-4 rounded-figma-md group cursor-pointer"
            >
              <div className={`mb-3 sm:mb-4 relative ${card.type === 'artist' ? 'rounded-full overflow-hidden' : 'rounded-figma-md overflow-hidden'}`}>
                <img
                  src={card.imageUrl || 'https://api.napster.com/imageserver/images/v2/default/artist/170x170.png'}
                  alt={card.name}
                  className={`
                    album-art w-full aspect-square object-cover 
                    ${card.type === 'artist' ? 'rounded-full' : 'rounded-figma-md'}
                  `}
                />
              </div>
              <h3 className="font-medium truncate text-base sm:text-lg text-white group-hover:text-white transition-colors duration-300">{card.name}</h3>
              {card.description && (
                <p className="text-[13px] sm:text-sm text-white/60 mt-1 line-clamp-2 group-hover:text-white/80 transition-colors duration-300">{card.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CardGrid;

