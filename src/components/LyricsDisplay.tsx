
import React, { useEffect, useRef, useState } from 'react';
import { getLyricsBySongId } from '@/services/supabaseService';

interface LyricLine {
  time: number;
  text: string;
}

interface LyricsDisplayProps {
  songId: string;
  currentTime: number;
  isVisible: boolean;
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({ songId, currentTime, isVisible }) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLyrics = async () => {
      try {
        const lyricsData = await getLyricsBySongId(songId);
        setLyrics(lyricsData.sort((a, b) => a.time - b.time));
      } catch (error) {
        console.error('Error loading lyrics:', error);
        setLyrics([]);
      }
    };

    if (songId) {
      loadLyrics();
    }
  }, [songId]);

  useEffect(() => {
    // Find current lyric line based on time
    let activeIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
    setCurrentLineIndex(activeIndex);
  }, [currentTime, lyrics]);

  useEffect(() => {
    // Auto-scroll to active lyric
    if (activeLyricRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const activeLyric = activeLyricRef.current;
      
      const containerHeight = container.clientHeight;
      const lyricOffsetTop = activeLyric.offsetTop;
      const lyricHeight = activeLyric.clientHeight;
      
      const scrollTop = lyricOffsetTop - (containerHeight / 2) + (lyricHeight / 2);
      
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  }, [currentLineIndex]);

  if (!isVisible || lyrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="mb-2">🎵</div>
          <div>No lyrics available</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={lyricsContainerRef}
      className="h-full overflow-y-auto px-4 py-6 scroll-smooth"
    >
      <div className="space-y-4">
        {lyrics.map((lyric, index) => {
          const isActive = index === currentLineIndex;
          const isPassed = index < currentLineIndex;
          const isComing = index > currentLineIndex;
          
          return (
            <div
              key={index}
              ref={isActive ? activeLyricRef : null}
              className={`text-center transition-all duration-300 ${
                isActive 
                  ? 'text-white text-xl font-semibold transform scale-105' 
                  : isPassed
                  ? 'text-gray-500 text-lg'
                  : 'text-gray-400 text-lg'
              }`}
            >
              {lyric.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LyricsDisplay;
