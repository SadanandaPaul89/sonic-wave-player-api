
import React from 'react';
import AppleMusicLyrics from './AppleMusicLyrics';

interface LyricLine {
  time: number;
  text: string;
}

interface DesktopLyricsPanelProps {
  lyrics: LyricLine[];
  currentTime: number;
  isLoading: boolean;
}

const DesktopLyricsPanel: React.FC<DesktopLyricsPanelProps> = ({
  lyrics,
  currentTime,
  isLoading,
}) => {
  return (
    <div
      className={`
        flex-1 min-w-[450px] max-w-[1000px] 
        h-full min-h-0
        flex flex-col items-center justify-center 
        rounded-xl bg-black/20 
        shadow-lg transition-all
        overflow-hidden
        [&::-webkit-scrollbar]:hidden
        [-ms-overflow-style:none]
        [scrollbar-width:none]
      `}
      style={{
        // Allow child to use entire height for scrolling
        height: '100%',
        minHeight: 0,
        maxHeight: '100vh',
      }}
    >
      {/* AppleMusicLyrics fills its parent with custom scrollbar hidden */}
      <div className="w-full h-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <AppleMusicLyrics
          lyrics={lyrics}
          currentTime={currentTime}
          isLoading={isLoading}
          isMobile={false}
        />
      </div>
    </div>
  );
};

export default DesktopLyricsPanel;
