// Role Indicator Component - Shows user account type and status

import React from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { UserRole } from '@/types/userRole';

interface RoleIndicatorProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const RoleIndicator: React.FC<RoleIndicatorProps> = ({ 
  className = '', 
  showLabel = true,
  size = 'md' 
}) => {
  const { userRole, isRoleLoading, walletAddress } = useWallet();

  if (!walletAddress) {
    return null;
  }

  if (isRoleLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`animate-pulse rounded-full bg-gray-300 ${getSizeClasses(size).dot}`} />
        {showLabel && (
          <span className={`text-gray-500 ${getSizeClasses(size).text}`}>
            Loading...
          </span>
        )}
      </div>
    );
  }

  const roleConfig = getRoleConfig(userRole);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`rounded-full ${roleConfig.bgColor} ${getSizeClasses(size).dot}`}
        title={roleConfig.description}
      />
      {showLabel && (
        <span className={`font-medium ${roleConfig.textColor} ${getSizeClasses(size).text}`}>
          {roleConfig.label}
        </span>
      )}
    </div>
  );
};

// Role configuration
const getRoleConfig = (role: UserRole | null) => {
  switch (role) {
    case 'artist':
      return {
        label: 'Artist',
        bgColor: 'bg-purple-500',
        textColor: 'text-purple-600',
        description: 'Artist account - Can upload music'
      };
    case 'normal':
      return {
        label: 'Listener',
        bgColor: 'bg-blue-500',
        textColor: 'text-blue-600',
        description: 'Listener account - Can stream music and collect NFTs'
      };
    default:
      return {
        label: 'Unknown',
        bgColor: 'bg-gray-400',
        textColor: 'text-gray-600',
        description: 'Account type not determined'
      };
  }
};

// Size configuration
const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        dot: 'w-2 h-2',
        text: 'text-xs'
      };
    case 'lg':
      return {
        dot: 'w-4 h-4',
        text: 'text-lg'
      };
    default: // md
      return {
        dot: 'w-3 h-3',
        text: 'text-sm'
      };
  }
};

export default RoleIndicator;