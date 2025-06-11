
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Player from './Player';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <PlayerProvider>
      <div className="flex flex-col h-screen bg-spotify-base text-white">
        <div className="flex flex-1 overflow-hidden">
          {isMobile ? (
            // Mobile drawer navigation
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <button className="p-3 m-2 text-white absolute top-0 left-0 z-20 bg-black/50 rounded-lg backdrop-blur-sm">
                  <Menu size={24} />
                </button>
              </DrawerTrigger>
              <DrawerContent className="h-[85vh] bg-black border-t border-spotify-highlight">
                <div className="h-full overflow-y-auto">
                  <Sidebar />
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            // Desktop sidebar
            <Sidebar />
          )}
          <main className={`flex-1 overflow-auto ${isMobile ? 'pt-16' : ''}`}>
            {children}
          </main>
        </div>
        <Player />
      </div>
    </PlayerProvider>
  );
};

export default Layout;
