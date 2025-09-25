// IPFS Badge Component - Shows IPFS indicator for all music

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Globe, Disc } from 'lucide-react';

interface IPFSBadgeProps {
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
}

const IPFSBadge: React.FC<IPFSBadgeProps> = ({ 
  variant = 'default',
  className = '',
  showIcon = true,
  showText = true
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return 'bg-figma-purple/20 text-figma-purple text-xs px-1.5 py-0.5';
      case 'minimal':
        return 'bg-figma-purple/10 text-figma-purple/80 text-xs px-2 py-1';
      default:
        return 'bg-figma-purple/20 text-figma-purple border-figma-purple/30';
    }
  };

  const getIconSize = () => {
    switch (variant) {
      case 'compact':
        return 8;
      case 'minimal':
        return 10;
      default:
        return 12;
    }
  };

  return (
    <Badge className={`${getVariantStyles()} ${className}`}>
      {showIcon && <Globe size={getIconSize()} className={showText ? "mr-1" : ""} />}
      {showText && "IPFS"}
    </Badge>
  );
};

export default IPFSBadge;