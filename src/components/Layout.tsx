
import React, { useState } from 'react';
import Player from './Player';
import Header from './Header';
import HamburgerMenu from './HamburgerMenu';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <PlayerProvider>
      <div className="flex flex-col h-screen text-white relative">
        {/* Figma Dark Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-figma-bg-start to-figma-bg-end"></div>
        <div className="flex flex-1 overflow-hidden relative z-10">
          {/* Animated hamburger menu overlay */}
          <AnimatePresence>
            {isDrawerOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                  onClick={() => setIsDrawerOpen(false)}
                />
                
                {/* Sliding hamburger menu */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ 
                    type: 'spring',
                    damping: 25,
                    stiffness: 200,
                    duration: 0.4
                  }}
                  className="fixed left-0 top-0 h-full w-80 sidebar-glass border-r border-figma-glass-border z-50"
                >
                  <HamburgerMenu onClose={() => setIsDrawerOpen(false)} />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Main content area - full width */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Header with hamburger menu and search */}
            <Header 
              onMenuClick={() => setIsDrawerOpen(true)} 
              showSearch={true}
            />
            
            {/* Page content */}
            <div className="flex-1 overflow-auto px-4 sm:px-6">
              {children}
            </div>
          </main>
        </div>
        <div className="relative z-10">
          <Player />
        </div>
      </div>
    </PlayerProvider>
  );
};

export default Layout;
