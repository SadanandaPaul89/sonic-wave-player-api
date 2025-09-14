
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from './ThemeToggle';
import SidebarNav from './SidebarNav';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`${isMobile ? 'w-full h-full px-4 py-6' : 'w-64 min-w-64'} sidebar-glass flex flex-col`}>
      <div className={`${isMobile ? '' : 'p-6'} flex-1`}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className={`${isMobile ? 'text-3xl' : 'text-2xl'} font-bold tracking-tight text-white`}>
              Sonic Wave
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isMobile && onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/10 rounded-figma-md p-2"
              >
                <X size={20} />
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
        <SidebarNav />
      </div>
    </div>
  );
};

export default Sidebar;
