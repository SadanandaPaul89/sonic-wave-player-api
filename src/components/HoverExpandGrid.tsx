import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Card {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  type: 'artist' | 'album' | 'playlist';
}

interface HoverExpandGridProps {
  cards: Card[];
  className?: string;
}

const HoverExpandGrid: React.FC<HoverExpandGridProps> = ({ cards, className }) => {
  const [activeCard, setActiveCard] = useState<number | null>(0);

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

  // Limit to first 6 cards for the expanding effect
  const displayCards = cards.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        duration: 0.3,
        delay: 0.2,
      }}
      className={cn("relative w-full", className)}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <div className="flex w-full items-center justify-center gap-2">
          {displayCards.map((card, index) => (
            <Link
              key={card.id}
              to={getLink(card)}
              className="block"
            >
              <motion.div
                className="relative cursor-pointer overflow-hidden rounded-figma-lg group"
                initial={{ width: "4rem", height: "20rem" }}
                animate={{
                  width: activeCard === index ? "20rem" : "6rem",
                  height: "20rem",
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                onClick={() => setActiveCard(index)}
                onHoverStart={() => setActiveCard(index)}
              >
                {/* Gradient overlay for active card */}
                <AnimatePresence>
                  {activeCard === index && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute h-full w-full bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"
                    />
                  )}
                </AnimatePresence>

                {/* Card content overlay */}
                <AnimatePresence>
                  {activeCard === index && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ delay: 0.1 }}
                      className="absolute flex h-full w-full flex-col items-start justify-end p-6 z-20"
                    >
                      <motion.h3 
                        className="text-white font-bold text-xl mb-2 line-clamp-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        {card.name}
                      </motion.h3>
                      {card.description && (
                        <motion.p 
                          className="text-white/80 text-sm line-clamp-3"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          {card.description}
                        </motion.p>
                      )}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-3 px-3 py-1 bg-figma-purple/80 backdrop-blur-sm rounded-full"
                      >
                        <span className="text-white text-xs font-medium capitalize">
                          {card.type}
                        </span>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Album art image */}
                <motion.img
                  src={card.imageUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center'}
                  className="size-full object-cover transition-all duration-500"
                  alt={card.name}
                  style={{
                    filter: activeCard === index ? 'grayscale(0%) brightness(1)' : 'grayscale(70%) brightness(0.8)',
                  }}
                />

                {/* Inactive card title overlay */}
                <AnimatePresence>
                  {activeCard !== index && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent"
                    >
                      <h4 className="text-white text-sm font-medium truncate transform -rotate-90 origin-bottom-left absolute bottom-3 left-3 w-16">
                        {card.name}
                      </h4>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HoverExpandGrid;