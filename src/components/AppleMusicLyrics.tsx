import React, { useRef, useEffect, useState } from 'react';

interface LyricLine {
  time: number;
  text: string;
}

interface AppleMusicLyricsProps {
  lyrics: LyricLine[];
  currentTime: number;
  isLoading: boolean;
  isMobile?: boolean;
}

const AppleMusicLyrics: React.FC<AppleMusicLyricsProps> = ({ lyrics, currentTime, isLoading, isMobile }) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Find which line is currently active
  useEffect(() => {
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    setActiveIndex(idx);
  }, [currentTime, lyrics]);

  // Smooth scroll to keep active line in optimal reading position
  useEffect(() => {
    if (activeLineRef.current && containerRef.current && activeIndex >= 0) {
      const container = containerRef.current;
      const lyricElement = activeLineRef.current;
      
      const containerHeight = container.clientHeight;
      const lyricTop = lyricElement.offsetTop;
      const lyricHeight = lyricElement.clientHeight;
      
      // Calculate optimal scroll position - keep highlighted lyric in upper third for better readability
      const optimalPosition = containerHeight * 0.3; // 30% from top
      let targetScroll = lyricTop - optimalPosition;
      
      // Ensure we don't scroll too far up or down
      const maxScroll = container.scrollHeight - containerHeight;
      targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));
      
      // Only scroll if the difference is significant to avoid constant micro-adjustments
      const currentScroll = container.scrollTop;
      const scrollDifference = Math.abs(targetScroll - currentScroll);
      
      if (scrollDifference > 20) { // 20px threshold to prevent jitter
        container.scrollTo({
          top: targetScroll,
          behavior: "smooth"
        });
      }
    }
  }, [activeIndex]);

  // Render
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-24 sm:h-28 text-gray-200 ${isMobile ? 'text-base' : 'text-lg'}`}>
        Loading lyrics...
      </div>
    );
  }
  if (!lyrics.length) {
    return (
      <div className={`flex items-center justify-center h-24 sm:h-28 text-gray-400 ${isMobile ? 'text-base' : 'text-lg'}`}>
        ♪ No lyrics available ♪
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`
        overflow-y-auto overflow-x-hidden
        px-1 py-4 sm:px-3 sm:py-6
        w-full max-w-full
        ${isMobile ? 'h-28 min-h-[60px]' : 'h-36 md:h-44 lg:h-52'}
        bg-transparent
      `}
      style={{
        scrollBehavior: "smooth",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div className="flex flex-col items-center space-y-3 sm:space-y-4 w-full max-w-full">
        {/* Add some top padding for better scroll positioning */}
        <div className="h-8 sm:h-12" />
        
        {lyrics.map((line, i) => {
          const distance = Math.abs(activeIndex - i);
          let opacity = 1, scale = 1, color = 'text-white', fontWeight = 'font-normal';

          if (i === activeIndex) {
            opacity = 1;
            scale = isMobile ? 1.15 : 1.3;
            color = 'text-white font-bold drop-shadow-lg';
            fontWeight = 'font-bold';
          } else if (distance === 1) {
            opacity = 0.8;
            scale = isMobile ? 1.05 : 1.1;
            color = 'text-gray-200';
          } else if (distance === 2) {
            opacity = 0.6;
            scale = 1.0;
            color = 'text-gray-300';
          } else if (distance === 3) {
            opacity = 0.4;
            scale = 0.98;
            color = 'text-gray-400';
          } else {
            opacity = 0.25;
            scale = 0.95;
            color = 'text-gray-500';
          }

          return (
            <div
              key={i}
              ref={i === activeIndex ? activeLineRef : undefined}
              className={`
                transition-all duration-1000 ease-out
                ${color} ${fontWeight}
                ${isMobile ? 'px-2' : 'px-4'}
                w-full max-w-full break-words whitespace-pre-line text-center
              `}
              style={{
                opacity,
                transform: `scale(${scale})`,
                minHeight: isMobile ? 20 : 28,
                lineHeight: isMobile ? 1.7 : 1.8,
                fontSize: isMobile ? 16 : 22,
                marginBottom: isMobile ? 8 : 12,
              }}
            >
              {line.text}
            </div>
          );
        })}
        
        {/* Add some bottom padding for better scroll positioning */}
        <div className="h-16 sm:h-24" />
      </div>
    </div>
  );
};

export default AppleMusicLyrics;
