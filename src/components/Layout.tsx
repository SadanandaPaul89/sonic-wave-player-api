
import React from 'react';
import Sidebar from './Sidebar';
import Player from './Player';
import { PlayerProvider } from '@/contexts/PlayerContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <PlayerProvider>
      <div className="flex flex-col h-screen bg-spotify-base text-white">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
        <Player />
      </div>
    </PlayerProvider>
  );
};

export default Layout;
