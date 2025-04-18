
import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Player from './Player';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { toast } from "sonner";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [apiNotified, setApiNotified] = useState(false);

  useEffect(() => {
    // Only show the toast once
    if (!apiNotified) {
      toast.info(
        "Using mock data due to API limitations",
        {
          description: "The app is currently using mock data for demonstration purposes.",
          duration: 5000,
        }
      );
      setApiNotified(true);
    }
  }, [apiNotified]);

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
