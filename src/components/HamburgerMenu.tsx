import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { X, Home, Search, Library, Info, User, LogOut, Wallet, Disc, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAuthService } from '@/config/auth';
import { Logo, BRAND_TAGLINES } from '@/components/Brand';

interface HamburgerMenuProps {
  onClose: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onClose }) => {
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Library, label: 'Your Library', path: '/library' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Wallet, label: 'Wallet', path: '/wallet', isWeb3: true },
    { icon: Disc, label: 'IPFS Demo', path: '/ipfs-demo', isWeb3: true },
    { icon: Info, label: 'About Us', path: '/about' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const handleSignOut = async () => {
    try {
      const authService = await getAuthService();
      await authService.signOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        damping: 20,
        stiffness: 300,
      },
    },
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex flex-col">
          <Logo
            variant="full"
            size="lg"
            animated={true}
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/60 text-sm mt-2 ml-1"
          >
            {BRAND_TAGLINES.primary}
          </motion.p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/10 rounded-figma-md p-2"
        >
          <X size={20} />
        </Button>
      </motion.div>

      {/* Profile Section */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="profile-section flex items-center gap-3 mb-8 p-3 rounded-figma-md bg-white/5 cursor-pointer"
      >
        <div className="w-12 h-12 rounded-full bg-figma-purple flex items-center justify-center">
          <User size={20} className="text-white" />
        </div>
        <div>
          <p className="text-white font-medium">Profile</p>
          <p className="text-white/60 text-sm">No name set</p>
        </div>
      </motion.div>

      {/* Navigation Items */}
      <motion.nav
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1"
      >
        <div className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isWeb3 = 'isWeb3' in item && item.isWeb3;
            
            return (
              <motion.div key={item.path} variants={itemVariants}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`menu-item flex items-center gap-4 p-3 rounded-figma-md group ${
                    isActive 
                      ? 'active text-white' 
                      : isWeb3
                      ? 'text-white/80 hover:text-white hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <Icon 
                    size={20} 
                    className={`transition-transform duration-300 group-hover:scale-110 ${
                      isActive 
                        ? 'text-white' 
                        : isWeb3 
                        ? 'text-green-400 group-hover:text-green-300' 
                        : 'text-white/70'
                    }`} 
                  />
                  <span className="font-medium flex items-center gap-2">
                    {item.label}
                    {isWeb3 && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
                        Web3
                      </span>
                    )}
                  </span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 bg-white rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.nav>

      {/* Sign Out Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-auto pt-6 border-t border-white/10"
      >
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full flex items-center gap-4 p-3 text-white/80 hover:bg-red-500/20 hover:text-red-400 rounded-figma-md transition-all duration-300 group"
        >
          <LogOut 
            size={20} 
            className="transition-transform duration-300 group-hover:scale-110" 
          />
          <span className="font-medium">Sign Out</span>
        </Button>
      </motion.div>
    </div>
  );
};

export default HamburgerMenu;