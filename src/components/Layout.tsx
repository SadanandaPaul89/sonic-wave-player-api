
import React from 'react';
import Sidebar from './Sidebar';
import Player from './Player';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <PlayerProvider>
      <div className="flex flex-col h-screen bg-spotify-base text-white">
        <div className="flex flex-1 overflow-hidden">
          {isMobile ? (
            // Mobile sidebar as a sheet
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-4 text-white absolute top-0 left-0 z-10">
                  <Menu size={24} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-black border-r border-spotify-highlight">
                <Sidebar />
              </SheetContent>
            </Sheet>
          ) : (
            // Desktop sidebar
            <Sidebar />
          )}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        <Player />
      </div>
    </PlayerProvider>
  );
};

export default Layout;
