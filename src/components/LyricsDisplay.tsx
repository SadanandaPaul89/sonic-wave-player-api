import React, { useEffect, useRef, useState } from 'react';
import { getLyricsBySongId } from '@/services/supabaseService';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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
    // Auto-scroll to active lyric with improved positioning
    if (activeLyricRef.current && lyricsContainerRef.current && currentLineIndex >= 0) {
      const container = lyricsContainerRef.current;
      const activeLyric = activeLyricRef.current;
      
      const containerHeight = container.clientHeight;
      const lyricOffsetTop = activeLyric.offsetTop;
      
      // Keep the active lyric around 35% from the top on mobile, 25% on desktop
      const optimalPosition = containerHeight * (isMobile ? 0.35 : 0.25);
      const targetScroll = lyricOffsetTop - optimalPosition;
      
      const maxScroll = container.scrollHeight - containerHeight;
      const finalScroll = Math.max(0, Math.min(targetScroll, maxScroll));
      
      container.scrollTo({
        top: finalScroll,
        behavior: 'smooth'
      });
    }
  }, [currentLineIndex, isMobile]);

  if (!isVisible || lyrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="mb-2 text-2xl">🎵</div>
          <div>No lyrics available</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={lyricsContainerRef}
      className="h-full overflow-y-auto overflow-x-hidden w-full bg-transparent scroll-smooth
      [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      <div className="flex flex-col items-center w-full">
        {/* Top spacer for better initial scroll position */}
        <div className={isMobile ? 'h-24' : 'h-32'} />

        {lyrics.map((lyric, index) => {
          const distance = Math.abs(currentLineIndex - index);
          let opacity = 1, scale = 1, color = 'text-foreground', fontWeight = 'font-normal';

          if (index === currentLineIndex) {
            opacity = 1;
            scale = isMobile ? 1.05 : 1.1;
            color = 'text-foreground';
            fontWeight = 'font-bold';
          } else if (distance === 1) {
            opacity = 0.7;
            scale = 1;
            color = 'text-muted-foreground/80';
          } else if (distance === 2) {
            opacity = 0.5;
            scale = 0.98;
            color = 'text-muted-foreground/60';
          } else if (distance >= 3) {
            opacity = 0.3;
            scale = 0.95;
            color = 'text-muted-foreground/40';
          }

          return (
            <div
              key={index}
              ref={index === currentLineIndex ? activeLyricRef : null}
              className={`
                transition-all duration-700 ease-out
                ${color} ${fontWeight}
                w-full break-words whitespace-pre-line text-center
              `}
              style={{
                opacity,
                transform: `scale(${scale})`,
                lineHeight: isMobile ? 1.6 : 1.7,
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                marginBottom: isMobile ? '1rem' : '1.25rem',
                padding: '0 0.75rem',
              }}
            >
              {lyric.text}
            </div>
          );
        })}
        
        {/* Bottom spacer to allow scrolling past the last lyric */}
        <div className={isMobile ? 'h-24' : 'h-32'} />
      </div>
    </div>
  );
};

export default LyricsDisplay;
