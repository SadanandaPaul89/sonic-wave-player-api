import React from 'react';
import { motion } from 'framer-motion';
import { Logo, BRAND_TAGLINES } from './index';

interface BrandLoaderProps {
  message?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const BrandLoader: React.FC<BrandLoaderProps> = ({
  message = 'Loading...',
  showTagline = true,
  size = 'lg'
}) => {
  const containerVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const textVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        delay: 0.3,
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen p-8"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Animated Logo */}
      <motion.div
        variants={pulseVariants}
        animate="animate"
        className="mb-8"
      >
        <Logo
          variant="full"
          size={size}
          animated={true}
        />
      </motion.div>

      {/* Loading Message */}
      <motion.div
        variants={textVariants}
        initial="initial"
        animate="animate"
        className="text-center"
      >
        <p className="text-white/80 text-lg font-medium mb-2">
          {message}
        </p>
        
        {showTagline && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/60 text-sm"
          >
            {BRAND_TAGLINES.secondary}
          </motion.p>
        )}
      </motion.div>

      {/* Loading Animation */}
      <motion.div
        className="flex gap-2 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-figma-purple rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.2,
              ease: 'easeInOut'
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default BrandLoader;