
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
        flex-1 min-w-[340px] max-w-[800px] 
        h-full min-h-0
        flex flex-col items-center justify-center 
        rounded-xl bg-black/20 
        shadow-lg transition-all
        overflow-hidden
      `}
      style={{
        // Allow child to use entire height for scrolling
        height: '100%',
        minHeight: 0,
        maxHeight: '100vh',
      }}
    >
      {/* AppleMusicLyrics fills its parent; ensure NO extra padding/wrappers */}
      <AppleMusicLyrics
        lyrics={lyrics}
        currentTime={currentTime}
        isLoading={isLoading}
        isMobile={false}
      />
    </div>
  );
};

export default DesktopLyricsPanel;
