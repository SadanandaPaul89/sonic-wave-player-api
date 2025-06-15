
import React, { useRef, useEffect, useState } from 'react';

interface LyricLine {
  time: number;
  text: string;
}

interface AppleMusicLyricsProps {
  lyrics: LyricLine[];
  currentTime: number;
  isLoading: boolean;
}

const AppleMusicLyrics: React.FC<AppleMusicLyricsProps> = ({ lyrics, currentTime, isLoading }) => {
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
      <div className="flex items-center justify-center h-28 text-gray-200 text-lg">
        Loading lyrics...
      </div>
    );
  }
  if (!lyrics.length) {
    return (
      <div className="flex items-center justify-center h-28 text-gray-400 text-lg">
        ♪ No lyrics available ♪
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-36 md:h-44 lg:h-52 overflow-y-auto px-3 py-4"
      style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
    >
      <div className="flex flex-col items-center space-y-2">
        {lyrics.map((line, i) => {
          // How far away from current line? We'll use this for fade and scale.
          const distance = Math.abs(activeIndex - i);
          let opacity = 1, scale = 1, color = 'text-white';

          if (i === activeIndex) {
            opacity = 1;
            scale = 1.25; // highlight the current
            color = 'text-white font-bold drop-shadow-lg';
          } else if (distance === 1) {
            opacity = 0.72;
            scale = 1.07;
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
              className={`transition-all duration-300 ease-out ${color}`}
              style={{
                opacity,
                transform: `scale(${scale})`,
                minHeight: 24,
                lineHeight: 1.8,
                textAlign: 'center',
                whiteSpace: 'pre-wrap',
                maxWidth: "90vw",
                wordBreak: "break-word",
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

