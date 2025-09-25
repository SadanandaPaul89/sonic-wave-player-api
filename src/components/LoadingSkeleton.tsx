import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = true,
}) => {
  const baseClasses = 'bg-white/10 animate-pulse';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-figma-md',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const shimmerVariants = {
    initial: { x: '-100%' },
    animate: {
      x: '100%',
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear',
      },
    },
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    >
      {animation && (
        <motion.div
          className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
        />
      )}
    </div>
  );
};

// Card skeleton for album/playlist cards
interface CardSkeletonProps {
  className?: string;
  showText?: boolean;
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({ className, showText = true }) => (
  <div className={cn('space-y-3', className)}>
    <Skeleton variant="rounded" className="aspect-square w-full" />
    {showText && (
      <div className="space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2 h-3" />
      </div>
    )}
  </div>
);

// List item skeleton for track lists
interface ListItemSkeletonProps {
  className?: string;
  showAvatar?: boolean;
}

const ListItemSkeleton: React.FC<ListItemSkeletonProps> = ({ 
  className, 
  showAvatar = true 
}) => (
  <div className={cn('flex items-center space-x-3 p-3', className)}>
    {showAvatar && (
      <Skeleton variant="rounded" width={48} height={48} />
    )}
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2 h-3" />
    </div>
    <Skeleton variant="text" width={40} height={16} />
  </div>
);

// Player skeleton for the bottom player bar
const PlayerSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn(
    'flex items-center justify-between p-4 bg-black/20 backdrop-blur-md border-t border-white/10',
    className
  )}>
    <div className="flex items-center space-x-3">
      <Skeleton variant="rounded" width={56} height={56} />
      <div className="space-y-2">
        <Skeleton variant="text" width={120} />
        <Skeleton variant="text" width={80} height={12} />
      </div>
    </div>
    
    <div className="flex items-center space-x-4">
      <Skeleton variant="circular" width={32} height={32} />
      <Skeleton variant="circular" width={40} height={40} />
      <Skeleton variant="circular" width={32} height={32} />
    </div>
    
    <div className="flex items-center space-x-3">
      <Skeleton variant="circular" width={24} height={24} />
      <Skeleton variant="text" width={60} height={12} />
    </div>
  </div>
);

// Grid skeleton for home page sections
interface GridSkeletonProps {
  items?: number;
  columns?: number;
  className?: string;
}

const GridSkeleton: React.FC<GridSkeletonProps> = ({ 
  items = 6, 
  columns = 3, 
  className 
}) => (
  <div className={cn(
    'grid gap-4',
    {
      'grid-cols-2 md:grid-cols-3': columns === 3,
      'grid-cols-2 md:grid-cols-4': columns === 4,
      'grid-cols-1 md:grid-cols-2': columns === 2,
    },
    className
  )}>
    {Array.from({ length: items }).map((_, index) => (
      <CardSkeleton key={index} />
    ))}
  </div>
);

// Section skeleton with title and content
interface SectionSkeletonProps {
  title?: boolean;
  subtitle?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const SectionSkeleton: React.FC<SectionSkeletonProps> = ({
  title = true,
  subtitle = false,
  children,
  className,
}) => (
  <div className={cn('space-y-4', className)}>
    {title && <Skeleton variant="text" className="w-48 h-6" />}
    {subtitle && <Skeleton variant="text" className="w-32 h-4" />}
    {children}
  </div>
);

export {
  Skeleton,
  CardSkeleton,
  ListItemSkeleton,
  PlayerSkeleton,
  GridSkeleton,
  SectionSkeleton,
};

export default Skeleton;