import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  animated = false,
  className = '',
  onClick
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  const logoVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 300
      }
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 }
    }
  };

  const waveVariants = {
    animate: {
      pathLength: [0, 1, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const LogoIcon = () => (
    <motion.svg
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      variants={animated ? logoVariants : undefined}
      initial={animated ? "initial" : undefined}
      animate={animated ? "animate" : undefined}
      whileHover={onClick ? "hover" : undefined}
    >
      {/* Green circular background */}
      <circle
        cx="20"
        cy="20"
        r="18"
        fill="#10B981"
      />
      
      {/* Sound wave lines (left side) */}
      <motion.path
        d="M8 16 Q10 14 12 16 Q10 18 8 16"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        variants={animated ? waveVariants : undefined}
        animate={animated ? "animate" : undefined}
      />
      
      <motion.path
        d="M6 20 Q8 18 10 20 Q8 22 6 20"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        variants={animated ? waveVariants : undefined}
        animate={animated ? "animate" : undefined}
        style={{ animationDelay: '0.2s' }}
      />
      
      <motion.path
        d="M8 24 Q10 22 12 24 Q10 26 8 24"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        variants={animated ? waveVariants : undefined}
        animate={animated ? "animate" : undefined}
        style={{ animationDelay: '0.4s' }}
      />
      
      {/* Musical note */}
      <g fill="white">
        {/* Note stem */}
        <rect x="16" y="12" width="1.5" height="12" rx="0.75" />
        
        {/* Note head */}
        <ellipse cx="15" cy="23" rx="2.5" ry="1.8" />
        
        {/* Eighth note flag */}
        <path d="M17.5 12 Q22 10 24 14 Q22 12 20 13 L17.5 15 Z" />
        
        {/* Second note */}
        <rect x="22" y="16" width="1.5" height="10" rx="0.75" />
        <ellipse cx="21" cy="25" rx="2.2" ry="1.6" />
        
        {/* Connecting beam */}
        <path d="M17.5 15 L23.5 17 L23.5 19 L17.5 17 Z" />
      </g>
    </motion.svg>
  );

  const BrandText = () => (
    <motion.span
      className={`${textSizes[size]} font-bold text-white tracking-tight`}
      variants={animated ? logoVariants : undefined}
      initial={animated ? "initial" : undefined}
      animate={animated ? "animate" : undefined}
    >
      SonicWave
    </motion.span>
  );

  const handleClick = () => {
    if (onClick) onClick();
  };

  if (variant === 'icon') {
    return (
      <div onClick={handleClick} className={onClick ? 'cursor-pointer' : ''}>
        <LogoIcon />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div onClick={handleClick} className={onClick ? 'cursor-pointer' : ''}>
        <BrandText />
      </div>
    );
  }

  return (
    <motion.div
      className={`flex items-center gap-3 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleClick}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <LogoIcon />
      <BrandText />
    </motion.div>
  );
};

export default Logo;