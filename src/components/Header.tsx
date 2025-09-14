import React, { useState } from 'react';
import { Menu, Search, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/Brand';

interface HeaderProps {
  onMenuClick?: () => void;
  showSearch?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, showSearch = true }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileSearch(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  return (
    <>
      <header className="flex items-center justify-between p-4 sm:p-6 relative z-20">
        {/* Left side - Menu button & Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="hamburger-menu text-white hover:bg-white/10 rounded-figma-md p-3"
          >
            <Menu size={24} />
          </Button>
          
          {/* Brand Logo */}
          <Logo
            variant={isMobile ? 'icon' : 'full'}
            size={isMobile ? 'md' : 'lg'}
            animated={true}
            onClick={() => navigate('/')}
          />
        </div>

        {/* Center - Search bar (Desktop) */}
        {showSearch && !isMobile && (
          <motion.div 
            className="flex-1 max-w-2xl mx-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
              <Input
                type="text"
                placeholder="What do you wanna play?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`search-input pl-12 pr-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-full backdrop-blur-sm transition-all duration-300 ${
                  isSearchFocused ? 'bg-white/20 ring-2 ring-figma-purple/50 scale-105' : 'hover:bg-white/15'
                }`}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white h-8 w-8"
                >
                  <X size={16} />
                </Button>
              )}
            </form>
          </motion.div>
        )}

        {/* Right side - Search & Profile (Mobile) */}
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobileSearch(true)}
              className="header-button text-white hover:bg-white/10 rounded-full p-3"
            >
              <Search size={24} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="header-button text-white hover:bg-white/10 rounded-full p-3"
          >
            <User size={24} />
          </Button>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isMobile && showMobileSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="w-full max-w-md mx-4"
            >
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="What do you wanna play?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="pl-12 pr-12 h-14 bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-full backdrop-blur-sm text-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileSearch(false)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white h-10 w-10"
                >
                  <X size={20} />
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;