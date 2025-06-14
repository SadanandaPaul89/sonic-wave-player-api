
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from './ThemeToggle';
import SidebarNav from './SidebarNav';

const Sidebar: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`${isMobile ? 'w-full h-full px-4 py-6' : 'w-64 min-w-64'} bg-spotify-elevated border-r border-spotify-highlight flex flex-col`}>
      <div className={`${isMobile ? '' : 'p-6'} flex-1`}>
        <div className="mb-8 flex items-center justify-between">
          <div className="text-black">
            <h1 className={`${isMobile ? 'text-3xl' : 'text-2xl'} font-bold tracking-tight text-black`}>Sonic Wave</h1>
          </div>
          <ThemeToggle />
        </div>
        <SidebarNav />
      </div>
    </div>
  );
};

export default Sidebar;
