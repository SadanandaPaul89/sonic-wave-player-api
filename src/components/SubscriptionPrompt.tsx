// Subscription Prompt Component - Shows upgrade options when limits are reached

import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { subscriptionService } from '@/services/subscriptionService';
import { Crown, Zap, Star, X, ArrowRight } from 'lucide-react';

interface SubscriptionPromptProps {
  className?: string;
  trigger?: 'limit_reached' | 'upgrade_suggestion' | 'manual';
  onClose?: () => void;
  compact?: boolean;
}

const SubscriptionPrompt: React.FC<SubscriptionPromptProps> = ({ 
  className = '',
  trigger = 'manual',
  onClose,
  compact = false
}) => {
  const { userRole, nftMintingStatus, walletAddress } = useWallet();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Don't show for artists or when not connected
  if (!walletAddress || userRole === 'artist') {
    return null;
  }

  // Get available subscription tiers
  const tiers = subscriptionService.getAvailableTiers();
  const currentSubscription = subscriptionService.getCurrentSubscription(walletAddress);

  const handleUpgrade = async (tierId: string) => {
    if (!walletAddress) return;

    setIsUpgrading(true);
    setSelectedTier(tierId);

    try {
      await subscriptionService.subscribe(tierId);
      // The wallet context will automatically refresh NFT minting status
      onClose?.();
    } catch (error) {
      console.error('Upgrade failed:', error);
      // Error handling is done in the subscription service
    } finally {
      setIsUpgrading(false);
      setSelectedTier(null);
    }
  };

  if (compact) {
    return (
      <div className={`bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            <span className="text-sm font-medium">
              {trigger === 'limit_reached' ? 'Limit Reached!' : 'Upgrade Available'}
            </span>
          </div>
          <button
            onClick={() => handleUpgrade('premium')}
            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            {trigger === 'limit_reached' ? 'Upgrade to Continue' : 'Unlock More NFTs'}
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Message */}
      <div className="p-4 border-b border-gray-100">
        {trigger === 'limit_reached' ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">
              <strong>You've reached your weekly limit!</strong> Upgrade your plan to continue 
              minting NFTs and unlock exclusive benefits.
            </p>
          </div>
        ) : (
          <p className="text-gray-600 text-sm">
            Upgrade your account to mint more NFTs, access exclusive content, and enjoy premium features.
          </p>
        )}
      </div>

      {/* Subscription Tiers */}
      <div className="p-4 space-y-3">
        {tiers.filter(tier => tier.id !== 'basic').map((tier) => {
          const isCurrentTier = currentSubscription?.tier === tier.id;
          const isSelected = selectedTier === tier.id;
          const isLoading = isUpgrading && isSelected;

          return (
            <div
              key={tier.id}
              className={`border rounded-lg p-4 transition-all ${
                isCurrentTier 
                  ? 'border-green-300 bg-green-50' 
                  : tier.popular
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {tier.id === 'premium' && <Star className="w-4 h-4 text-purple-500" />}
                    {tier.id === 'vip' && <Crown className="w-4 h-4 text-yellow-500" />}
                    <h4 className="font-semibold text-gray-900">{tier.name}</h4>
                    {tier.popular && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{tier.description}</p>
                  
                  {/* Key Features */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="w-3 h-3 text-green-500" />
                      <span>
                        {tier.downloadLimit === -1 
                          ? 'Unlimited NFT minting' 
                          : `${tier.maxConcurrentStreams || 25} NFTs per week`
                        }
                      </span>
                    </div>
                    {tier.exclusiveContent && (
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-3 h-3 text-purple-500" />
                        <span>Exclusive content access</span>
                      </div>
                    )}
                    {tier.adFree && (
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-3 h-3 text-blue-500" />
                        <span>Ad-free experience</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-gray-900">
                    {tier.price} {tier.currency}
                  </div>
                  <div className="text-xs text-gray-500 mb-3">per month</div>
                  
                  {isCurrentTier ? (
                    <div className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(tier.id)}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                        tier.popular
                          ? 'bg-purple-500 hover:bg-purple-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          Upgrade
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 rounded-b-xl">
        <p className="text-xs text-gray-500 text-center">
          All plans include secure payments via blockchain. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPrompt;