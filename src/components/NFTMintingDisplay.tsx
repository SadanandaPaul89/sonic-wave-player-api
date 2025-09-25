// NFT Minting Display Component - Shows minting status and limits for normal users

import React from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Gift, Clock, Zap } from 'lucide-react';

interface NFTMintingDisplayProps {
  className?: string;
  compact?: boolean;
}

const NFTMintingDisplay: React.FC<NFTMintingDisplayProps> = ({ 
  className = '',
  compact = false 
}) => {
  const { 
    userRole, 
    nftMintingStatus, 
    walletAddress,
    refreshNFTMintingStatus 
  } = useWallet();

  // Don't show for artists or when not connected
  if (!walletAddress || userRole === 'artist') {
    return null;
  }

  const { remainingMints, weeklyLimit, resetDate, isLimited, canMint } = nftMintingStatus;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Gift className={`w-4 h-4 ${canMint ? 'text-green-500' : 'text-red-500'}`} />
        <span className="text-sm font-medium">
          {isLimited ? `${remainingMints}/${weeklyLimit}` : '∞'} NFTs
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-500" />
          NFT Rewards
        </h3>
        <button
          onClick={refreshNFTMintingStatus}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {isLimited ? (
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Weekly Progress</span>
              <span className="font-medium">
                {weeklyLimit - remainingMints}/{weeklyLimit} used
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  remainingMints > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ 
                  width: `${((weeklyLimit - remainingMints) / weeklyLimit) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Status */}
          <div className={`p-3 rounded-lg ${
            canMint 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {canMint ? (
                <>
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Ready to Mint!</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-800">Limit Reached</span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {canMint 
                ? `You can mint ${remainingMints} more NFT${remainingMints !== 1 ? 's' : ''} this week`
                : 'You\'ve reached your weekly minting limit'
              }
            </p>
          </div>

          {/* Reset Timer */}
          {resetDate && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>
                Resets {formatResetTime(resetDate)}
              </span>
            </div>
          )}

          {/* Upgrade Hint */}
          {!canMint && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Want more NFTs?</strong> Upgrade to Premium for 50 NFTs per week, 
                or VIP for unlimited minting!
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-full">
            <Zap className="w-4 h-4" />
            <span className="font-medium">Unlimited NFT Minting</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            You have unlimited NFT minting privileges
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function to format reset time
const formatResetTime = (resetDate: Date): string => {
  const now = new Date();
  const diffMs = resetDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'now';
  }
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  } else {
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  }
};

export default NFTMintingDisplay;