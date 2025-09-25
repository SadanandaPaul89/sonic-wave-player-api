// User Role Status Component - Comprehensive role and status display

import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import RoleIndicator from './RoleIndicator';
import NFTMintingDisplay from './NFTMintingDisplay';
import SubscriptionPrompt from './SubscriptionPrompt';
import { Settings, RefreshCw, Upload, Music } from 'lucide-react';

interface UserRoleStatusProps {
  className?: string;
  showDetails?: boolean;
  showUpgradePrompt?: boolean;
}

const UserRoleStatus: React.FC<UserRoleStatusProps> = ({ 
  className = '',
  showDetails = true,
  showUpgradePrompt = true
}) => {
  const { 
    userRole, 
    isRoleLoading, 
    walletAddress, 
    nftMintingStatus,
    refreshUserRole,
    refreshNFTMintingStatus,
    isArtist,
    canUploadMusic,
    canMintNFT
  } = useWallet();

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!walletAddress) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Connect your wallet to see your account status</p>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshUserRole(),
        refreshNFTMintingStatus()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const shouldShowUpgradePrompt = showUpgradePrompt && 
    userRole === 'normal' && 
    !nftMintingStatus.canMint && 
    nftMintingStatus.isLimited;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Role and Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RoleIndicator size="lg" />
          {isRoleLoading && (
            <div className="text-sm text-gray-500">Verifying account...</div>
          )}
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Role-specific Information */}
      {showDetails && (
        <div className="space-y-4">
          {userRole === 'artist' ? (
            <ArtistStatusCard 
              canUpload={canUploadMusic()} 
              walletAddress={walletAddress}
            />
          ) : userRole === 'normal' ? (
            <div className="space-y-4">
              <NFTMintingDisplay />
              {shouldShowUpgradePrompt && (
                <SubscriptionPrompt 
                  trigger="limit_reached"
                  onClose={() => setShowUpgrade(false)}
                />
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Account verification in progress...</strong> 
                Your account type is being determined. This may take a few moments.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        {userRole === 'artist' && (
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
            <Upload className="w-4 h-4" />
            Upload Music
          </button>
        )}
        
        {userRole === 'normal' && !shouldShowUpgradePrompt && (
          <button 
            onClick={() => setShowUpgrade(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Upgrade Plan
          </button>
        )}
      </div>

      {/* Manual Upgrade Prompt */}
      {showUpgrade && userRole === 'normal' && (
        <SubscriptionPrompt 
          trigger="upgrade_suggestion"
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
};

// Artist Status Card Component
interface ArtistStatusCardProps {
  canUpload: boolean;
  walletAddress: string;
}

const ArtistStatusCard: React.FC<ArtistStatusCardProps> = ({ canUpload, walletAddress }) => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Music className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Artist Account</h3>
          <p className="text-sm text-gray-600">Verified music creator</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Unlimited NFT minting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Music upload privileges</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Artist verification badge</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Priority support</span>
        </div>
      </div>

      {!canUpload && (
        <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
          <strong>Note:</strong> Some upload features may be temporarily unavailable.
        </div>
      )}
    </div>
  );
};

export default UserRoleStatus;