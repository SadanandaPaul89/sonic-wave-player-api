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

  // Improved scroll positioning to keep active line in optimal reading position
  useEffect(() => {
    if (activeLineRef.current && containerRef.current && activeIndex >= 0) {
      const container = containerRef.current;
      const lyricElement = activeLineRef.current;
      
      const containerHeight = container.clientHeight;
      const lyricTop = lyricElement.offsetTop;
      
      // Keep the active lyric at 25% from the top for better readability
      const optimalPosition = containerHeight * 0.25;
      const targetScroll = lyricTop - optimalPosition;
      
      // Ensure we don't scroll beyond boundaries
      const maxScroll = container.scrollHeight - containerHeight;
      const finalScroll = Math.max(0, Math.min(targetScroll, maxScroll));
      
      // Always scroll to the calculated position for active lyric
      container.scrollTo({
        top: finalScroll,
        behavior: "smooth"
      });
    }
  }, [activeIndex]);

  // Render
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full text-gray-200 ${isMobile ? 'text-base' : 'text-lg'}`}>
        Loading lyrics...
      </div>
    );
  }
  if (!lyrics.length) {
    return (
      <div className={`flex items-center justify-center h-full text-gray-400 ${isMobile ? 'text-base' : 'text-lg'}`}>
        ♪ No lyrics available ♪
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`
        overflow-y-auto overflow-x-hidden w-full h-full bg-transparent
        [&::-webkit-scrollbar]:hidden
        [-ms-overflow-style:none]
        [scrollbar-width:none]
      `}
      style={{
        scrollBehavior: "smooth",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div className="flex flex-col items-center w-full">
        {/* Add larger top spacer to ensure first lyrics don't appear at the very top */}
        <div className={`${isMobile ? 'h-20' : 'h-32'}`} />
        
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
                w-full break-words whitespace-pre-line text-center
              `}
              style={{
                opacity,
                transform: `scale(${scale})`,
                lineHeight: isMobile ? 1.7 : 1.8,
                fontSize: isMobile ? 16 : 22,
                marginBottom: isMobile ? 16 : 20,
                padding: isMobile ? '0 16px' : '0 12px', // Reduced padding significantly for desktop
              }}
            >
              {line.text}
            </div>
          );
        })}
        
        {/* Add larger bottom spacer to allow scrolling past the last lyric */}
        <div className={`${isMobile ? 'h-20' : 'h-32'}`} />
      </div>
    </div>
  );
};

export default AppleMusicLyrics;
