import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, X, Music, User, Disc, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/Brand';
import { useSearchSuggestions, POPULAR_SEARCHES } from '@/hooks/useSearchSuggestions';
import UnifiedWalletStatus from '@/components/UnifiedWalletStatus';
import RoleIndicator from '@/components/RoleIndicator';
import { useWallet } from '@/contexts/WalletContext';

interface HeaderProps {
  onMenuClick?: () => void;
  showSearch?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, showSearch = true }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { suggestions, isLoading } = useSearchSuggestions(searchQuery, showSuggestions);
  const { walletAddress, isArtist } = useWallet();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search query from URL when on search page
  useEffect(() => {
    if (location.pathname === '/search') {
      const urlParams = new URLSearchParams(location.search);
      const query = urlParams.get('q') || '';
      setSearchQuery(query);
    }
  }, [location]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileSearch(false);
      setShowSuggestions(false);
      setIsSearchFocused(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setSearchQuery(suggestion.title);
    navigate(`/search?q=${encodeURIComponent(suggestion.title)}`);
    setShowSuggestions(false);
    setIsSearchFocused(false);
  };

  const handlePopularSearchClick = (term: string) => {
    setSearchQuery(term);
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setShowSuggestions(false);
    setIsSearchFocused(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
    setShowSuggestions(false);
    if (location.pathname === '/search') {
      navigate('/search');
    }
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    setShowSuggestions(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'track': return Music;
      case 'artist': return User;
      case 'album': return Disc;
      default: return Music;
    }
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
            ref={searchRef}
            className="flex-1 max-w-2xl mx-8 relative"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5 z-10" />
              <Input
                type="text"
                placeholder="What do you wanna play?"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
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
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white h-8 w-8 z-10"
                >
                  <X size={16} />
                </Button>
              )}
            </form>

            {/* Search Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && (isSearchFocused || searchQuery) && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-figma-md shadow-2xl z-50 max-h-96 overflow-y-auto"
                >
                  {isLoading ? (
                    <div className="p-4 text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-figma-purple border-t-transparent rounded-full mx-auto mb-2"
                      />
                      <p className="text-white/60 text-sm">Searching...</p>
                    </div>
                  ) : searchQuery && suggestions.length > 0 ? (
                    <div className="py-2">
                      <div className="px-4 py-2 text-white/40 text-xs uppercase tracking-wide">
                        Suggestions
                      </div>
                      {suggestions.map((suggestion, index) => {
                        const Icon = getSuggestionIcon(suggestion.type);
                        return (
                          <motion.button
                            key={`${suggestion.type}-${suggestion.id}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 bg-figma-purple/20 rounded-full flex items-center justify-center group-hover:bg-figma-purple/30 transition-colors">
                              <Icon size={14} className="text-figma-purple" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">
                                {suggestion.title}
                              </p>
                              {suggestion.subtitle && (
                                <p className="text-white/60 text-xs truncate">
                                  {suggestion.subtitle}
                                </p>
                              )}
                            </div>
                            <div className="text-white/40 text-xs capitalize">
                              {suggestion.type}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : !searchQuery ? (
                    <div className="py-2">
                      <div className="px-4 py-2 text-white/40 text-xs uppercase tracking-wide flex items-center gap-2">
                        <TrendingUp size={12} />
                        Popular Searches
                      </div>
                      {POPULAR_SEARCHES.slice(0, 6).map((term, index) => (
                        <motion.button
                          key={term}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handlePopularSearchClick(term)}
                          className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center gap-3 group"
                        >
                          <Search size={14} className="text-white/40 group-hover:text-figma-purple transition-colors" />
                          <span className="text-white/80 text-sm group-hover:text-white transition-colors">
                            {term}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-white/60 text-sm">No suggestions found</p>
                      <p className="text-white/40 text-xs mt-1">Try a different search term</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Right side - Role, Wallet Status & Search */}
        <div className="flex items-center gap-3">
          {/* Role Indicator */}
          {walletAddress && (
            <div className="hidden sm:block">
              <RoleIndicator size="sm" showLabel={!isMobile} />
            </div>
          )}
          
          {/* Artist Upload Button */}
          {walletAddress && isArtist() && (
            <Button
              onClick={() => navigate('/upload')}
              className="hidden sm:flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <Music size={16} />
              {!isMobile && 'Upload'}
            </Button>
          )}
          
          {/* Unified Wallet Status */}
          <UnifiedWalletStatus variant="compact" showActions={false} />
          
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
        </div>
      </header>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isMobile && showMobileSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col pt-16"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="w-full max-w-md mx-auto px-4 mb-6"
            >
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="What do you wanna play?"
                  value={searchQuery}
                  onChange={handleSearchChange}
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

            {/* Mobile Suggestions */}
            <div className="flex-1 overflow-y-auto px-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-figma-purple border-t-transparent rounded-full mx-auto mb-3"
                  />
                  <p className="text-white/60">Searching...</p>
                </div>
              ) : searchQuery && suggestions.length > 0 ? (
                <div>
                  <h3 className="text-white/40 text-sm uppercase tracking-wide mb-4 px-2">
                    Suggestions
                  </h3>
                  {suggestions.map((suggestion, index) => {
                    const Icon = getSuggestionIcon(suggestion.type);
                    return (
                      <motion.button
                        key={`mobile-${suggestion.type}-${suggestion.id}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => {
                          handleSuggestionClick(suggestion);
                          setShowMobileSearch(false);
                        }}
                        className="w-full p-4 text-left hover:bg-white/10 transition-colors flex items-center gap-4 rounded-figma-md mb-2"
                      >
                        <div className="w-10 h-10 bg-figma-purple/20 rounded-full flex items-center justify-center">
                          <Icon size={16} className="text-figma-purple" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">
                            {suggestion.title}
                          </p>
                          {suggestion.subtitle && (
                            <p className="text-white/60 text-sm truncate">
                              {suggestion.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="text-white/40 text-xs capitalize">
                          {suggestion.type}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              ) : !searchQuery ? (
                <div>
                  <h3 className="text-white/40 text-sm uppercase tracking-wide mb-4 px-2 flex items-center gap-2">
                    <TrendingUp size={14} />
                    Popular Searches
                  </h3>
                  {POPULAR_SEARCHES.map((term, index) => (
                    <motion.button
                      key={`mobile-popular-${term}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => {
                        handlePopularSearchClick(term);
                        setShowMobileSearch(false);
                      }}
                      className="w-full p-4 text-left hover:bg-white/10 transition-colors flex items-center gap-4 rounded-figma-md mb-2"
                    >
                      <Search size={16} className="text-white/40" />
                      <span className="text-white/80 flex-1">
                        {term}
                      </span>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/60">No suggestions found</p>
                  <p className="text-white/40 text-sm mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;