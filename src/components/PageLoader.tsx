import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useAnimations';

interface PageLoaderProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({
  isLoading,
  message = 'Loading...',
  className = '',
}) => {
  const reducedMotion = useReducedMotion();

  if (!isLoading) return null;

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: reducedMotion ? 0 : 1,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: reducedMotion ? 0 : 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: reducedMotion ? 0 : 0.2 }
    },
  };

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center glass-card ${className}`}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="flex flex-col items-center space-y-4">
        <motion.div
          variants={spinnerVariants}
          animate="animate"
        >
          <Loader2 className="h-8 w-8 text-figma-purple" />
        </motion.div>
        <p className="text-white/80 font-medium">{message}</p>
      </div>
    </motion.div>
  );
};

export default PageLoader;