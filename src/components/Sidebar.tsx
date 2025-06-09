
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import SidebarNav from './SidebarNav';

const Sidebar: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`${isMobile ? 'w-full h-full' : 'w-64 min-w-64'} bg-black border-r border-spotify-highlight flex flex-col`}>
      <div className="p-6">
        <div className="mb-8">
          <div className="text-white">
            <h1 className="text-2xl font-bold tracking-tight">Sonic Wave</h1>
          </div>
        </div>
        <SidebarNav />
      </div>
    </div>
  );
};

export default Sidebar;
