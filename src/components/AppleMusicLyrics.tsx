
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

  // Scroll to center active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const lyric = activeLineRef.current;
      const cHeight = container.clientHeight;
      const lOffset = lyric.offsetTop;
      const lHeight = lyric.clientHeight;

      container.scrollTo({
        top: lOffset - cHeight / 2 + lHeight / 2,
        behavior: "smooth"
      });
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
      className={`overflow-y-auto px-1 py-2 sm:px-3 sm:py-4 ${isMobile ? 'h-32 min-h-[80px]' : 'h-36 md:h-44 lg:h-52'} w-full`}
      style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
    >
      <div className="flex flex-col items-center space-y-1 sm:space-y-2">
        {lyrics.map((line, i) => {
          // How far away from current line? We'll use this for fade and scale.
          const distance = Math.abs(activeIndex - i);
          let opacity = 1, scale = 1, color = 'text-white', fontWeight = 'font-normal';

          if (i === activeIndex) {
            opacity = 1;
            scale = isMobile ? 1.18 : 1.25; // highlight the current
            color = 'text-white font-bold drop-shadow-lg';
            fontWeight = 'font-bold';
          } else if (distance === 1) {
            opacity = 0.75;
            scale = isMobile ? 1.03 : 1.07;
            color = 'text-gray-200';
          } else if (distance === 2) {
            opacity = 0.52;
            scale = 1.00;
            color = 'text-gray-400';
          } else {
            opacity = 0.22;
            scale = 0.96;
            color = 'text-gray-500';
          }

          return (
            <div
              key={i}
              ref={i === activeIndex ? activeLineRef : undefined}
              className={`transition-all duration-1000 sm:duration-1000 ease-out ${color} ${fontWeight}`}
              style={{
                opacity,
                transform: `scale(${scale})`,
                minHeight: isMobile ? 20 : 24,
                lineHeight: 1.7,
                textAlign: 'center',
                whiteSpace: 'pre-wrap',
                maxWidth: "90vw",
                wordBreak: "break-word",
                fontSize: isMobile ? 16 : 20
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AppleMusicLyrics;
