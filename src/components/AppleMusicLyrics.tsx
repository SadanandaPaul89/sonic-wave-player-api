
import React, { useEffect, useRef, useState } from "react";
import { getLyricsBySongId } from "@/services/supabaseService";

// Use the same LyricLine type as other components
interface LyricLine {
  time: number;
  text: string;
}

interface AppleMusicLyricsProps {
  songId: string;
  currentTime: number;
}

const AppleMusicLyrics: React.FC<AppleMusicLyricsProps> = ({ songId, currentTime }) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);

  // Load lyrics for the songId
  useEffect(() => {
    const fetchLyrics = async () => {
      if (songId) {
        try {
          const lyricsData = await getLyricsBySongId(songId);
          setLyrics((lyricsData || []).sort((a, b) => a.time - b.time));
        } catch (err) {
          setLyrics([]);
        }
      }
    };
    fetchLyrics();
  }, [songId]);

  // Set the current active lyric index using currentTime
  useEffect(() => {
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    setCurrentIndex(idx);
  }, [lyrics, currentTime]);

  // Scroll the active lyric into center smoothly
  useEffect(() => {
    if (activeLyricRef.current && containerRef.current) {
      const c = containerRef.current;
      const l = activeLyricRef.current;
      // Scroll so active lyric is vertically centered
      const scrollTo = l.offsetTop - c.offsetHeight / 2 + l.offsetHeight / 2;
      c.scrollTo({ top: scrollTo, behavior: "smooth" });
    }
  }, [currentIndex]);

  if (!lyrics.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-300">
        <div className="text-center">
          <span className="text-xl">♪ No lyrics available ♪</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-80 max-h-full overflow-y-auto px-6 py-6 bg-black/30 rounded-lg shadow"
      style={{
        scrollBehavior: "smooth",
        minHeight: "15rem",
        maxHeight: "25rem"
      }}
    >
      <div className="flex flex-col items-center justify-center select-none">
        {lyrics.map((line, idx) => {
          const isActive = idx === currentIndex;
          const isPrevious = idx < currentIndex;
          const isNext = idx > currentIndex;
          // For fading effect, calculate distance to current line
          const dist = Math.abs(idx - currentIndex);

          return (
            <div
              key={idx}
              ref={isActive ? activeLyricRef : null}
              className={
                "w-full text-center my-2 transition-all duration-300 " +
                (isActive
                  ? "text-white font-bold text-2xl scale-110 drop-shadow-lg"
                  : dist === 1
                  ? "text-gray-200 text-lg opacity-70"
                  : dist === 2
                  ? "text-gray-400 text-md opacity-60"
                  : "text-gray-600 text-base opacity-40")
              }
              style={{
                // Animate scale and opacity more for current and adjacent lines
                lineHeight: "2.1rem",
                letterSpacing: isActive ? "0.02em" : "0",
                transition: "all 0.25s cubic-bezier(.4,2,.6,1)",
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
