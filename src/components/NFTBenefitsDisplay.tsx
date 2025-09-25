// NFT Benefits Display Component - Shows user's NFT holdings and benefits

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Star, 
  Gift, 
  Clock, 
  Percent, 
  Crown, 
  Music, 
  Calendar,
  ExternalLink,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNFTBenefits } from '@/hooks/useNFTBenefits';
import { useYellowSDK } from '@/hooks/useYellowSDK';
import { NFTBenefit } from '@/types/yellowSDK';
import UnifiedWalletStatus from '@/components/UnifiedWalletStatus';

interface NFTBenefitsDisplayProps {
  className?: string;
  compact?: boolean;
}

const NFTBenefitsDisplay: React.FC<NFTBenefitsDisplayProps> = ({
  className = '',
  compact = false
}) => {
  const { isAuthenticated, connect } = useYellowSDK();
  const {
    userProfile,
    supportedCollections,
    isLoading,
    error,
    benefitUsageHistory,
    discountPercentage,
    hasEarlyAccess,
    earlyAccessHours,
    exclusiveContentIds,
    refreshProfile,
    clearError
  } = useNFTBenefits();

  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('overview');

  const toggleCollectionExpanded = (contractAddress: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(contractAddress)) {
      newExpanded.delete(contractAddress);
    } else {
      newExpanded.add(contractAddress);
    }
    setExpandedCollections(newExpanded);
  };

  const getBenefitIcon = (type: NFTBenefit['type']) => {
    switch (type) {
      case 'exclusive_access': return <Crown className="text-amber-400" size={16} />;
      case 'discount': return <Percent className="text-green-400" size={16} />;
      case 'priority_access': return <Clock className="text-blue-400" size={16} />;
      case 'special_features': return <Star className="text-purple-400" size={16} />;
      default: return <Gift className="text-figma-purple" size={16} />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'diamond': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'platinum': return 'bg-gray-300/20 text-gray-300 border-gray-300/30';
      case 'gold': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'silver': return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
      case 'bronze': return 'bg-orange-600/20 text-orange-400 border-orange-600/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isAuthenticated) {
    return (
      <Card className={`glass-card border-figma-glass-border ${className}`}>
        <CardContent className="p-6">
          <UnifiedWalletStatus variant="compact" showActions={true} />
          <div className="text-center mt-4">
            <Palette size={48} className="text-figma-purple mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">NFT Benefits</h3>
            <p className="text-white/60 text-sm">
              Connect your wallet to view your NFT holdings and unlock exclusive benefits
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={`glass-card border-figma-glass-border ${className}`}>
        <CardContent className="p-6 text-center">
          <Loader2 size={32} className="text-figma-purple animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading NFT benefits...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`glass-card border-figma-glass-border ${className}`}>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Palette size={24} className="text-red-400" />
            </div>
            <h3 className="text-white font-medium mb-2">Error Loading NFT Data</h3>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={clearError} variant="outline" size="sm">
                Dismiss
              </Button>
              <Button onClick={refreshProfile} size="sm" className="bg-figma-purple hover:bg-figma-purple/80">
                <RefreshCw size={16} className="mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userProfile || userProfile.totalNFTs === 0) {
    return (
      <Card className={`glass-card border-figma-glass-border ${className}`}>
        <CardContent className="p-6 text-center">
          <Palette size={48} className="text-white/40 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No NFTs Found</h3>
          <p className="text-white/60 text-sm mb-4">
            You don't own any NFTs from our supported collections yet.
          </p>
          <div className="space-y-2">
            <p className="text-white/50 text-xs">Supported Collections:</p>
            {supportedCollections.slice(0, 3).map(collection => (
              <div key={collection.contractAddress} className="text-white/40 text-xs">
                {collection.name} ({collection.symbol})
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={`glass-card border-figma-glass-border ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown size={20} className="text-figma-purple" />
              <div>
                <p className="text-white font-medium text-sm">NFT Holder</p>
                <p className="text-white/60 text-xs">
                  {userProfile.totalNFTs} NFTs • {userProfile.tier.toUpperCase()} Tier
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {discountPercentage > 0 && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  {discountPercentage}% OFF
                </Badge>
              )}
              <Badge className={getTierColor(userProfile.tier)}>
                {userProfile.tier.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-card border-figma-glass-border ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-white">
            <Crown className="text-figma-purple" size={24} />
            NFT Benefits
            <Badge className={getTierColor(userProfile.tier)}>
              {userProfile.tier.toUpperCase()}
            </Badge>
          </CardTitle>
          <Button
            onClick={refreshProfile}
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white"
          >
            <RefreshCw size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-white/10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Profile Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-figma-sm">
                <p className="text-2xl font-bold text-figma-purple">{userProfile.totalNFTs}</p>
                <p className="text-white/60 text-xs">Total NFTs</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-figma-sm">
                <p className="text-2xl font-bold text-green-400">{userProfile.totalValue.toFixed(2)}</p>
                <p className="text-white/60 text-xs">Total Value (ETH)</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-figma-sm">
                <p className="text-2xl font-bold text-blue-400">{userProfile.activeBenefits.length}</p>
                <p className="text-white/60 text-xs">Active Benefits</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-figma-sm">
                <p className="text-2xl font-bold text-purple-400">{exclusiveContentIds.length}</p>
                <p className="text-white/60 text-xs">Exclusive Tracks</p>
              </div>
            </div>

            {/* Quick Benefits */}
            <div className="space-y-3">
              <h4 className="text-white font-medium">Active Benefits</h4>
              
              {discountPercentage > 0 && (
                <div className="flex items-center gap-3 p-3 bg-green-500/20 border border-green-500/30 rounded-figma-sm">
                  <Percent size={16} className="text-green-400" />
                  <div>
                    <p className="text-green-400 font-medium text-sm">Marketplace Discount</p>
                    <p className="text-green-400/80 text-xs">Get {discountPercentage}% off all purchases</p>
                  </div>
                </div>
              )}

              {hasEarlyAccess && (
                <div className="flex items-center gap-3 p-3 bg-blue-500/20 border border-blue-500/30 rounded-figma-sm">
                  <Clock size={16} className="text-blue-400" />
                  <div>
                    <p className="text-blue-400 font-medium text-sm">Early Access</p>
                    <p className="text-blue-400/80 text-xs">Get releases {earlyAccessHours}h early</p>
                  </div>
                </div>
              )}

              {exclusiveContentIds.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-amber-500/20 border border-amber-500/30 rounded-figma-sm">
                  <Music size={16} className="text-amber-400" />
                  <div>
                    <p className="text-amber-400 font-medium text-sm">Exclusive Content</p>
                    <p className="text-amber-400/80 text-xs">Access to {exclusiveContentIds.length} exclusive tracks</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="collections" className="space-y-4 mt-4">
            {userProfile.collections.map((holding) => {
              const collection = supportedCollections.find(c => c.contractAddress === holding.contractAddress);
              const isExpanded = expandedCollections.has(holding.contractAddress);

              return (
                <div key={`${holding.contractAddress}-${holding.tokenId}`} className="border border-white/10 rounded-figma-md overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => toggleCollectionExpanded(holding.contractAddress)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {holding.metadata.image && (
                          <img 
                            src={holding.metadata.image} 
                            alt={holding.metadata.name}
                            className="w-12 h-12 rounded-figma-sm object-cover"
                          />
                        )}
                        <div>
                          <p className="text-white font-medium">{holding.metadata.name}</p>
                          <p className="text-white/60 text-sm">{collection?.name || 'Unknown Collection'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-figma-purple/20 text-figma-purple border-figma-purple/30">
                          #{holding.tokenId}
                        </Badge>
                        {isExpanded ? <ChevronUp size={16} className="text-white/60" /> : <ChevronDown size={16} className="text-white/60" />}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-4 space-y-3">
                          {/* NFT Details */}
                          <div>
                            <p className="text-white/80 text-sm mb-2">{holding.metadata.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {holding.metadata.attributes.map((attr, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {attr.trait_type}: {attr.value}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Benefits */}
                          <div>
                            <p className="text-white font-medium text-sm mb-2">Benefits:</p>
                            <div className="space-y-2">
                              {holding.benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  {getBenefitIcon(benefit.type)}
                                  <span className="text-white/80">{benefit.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* External Links */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => window.open(`https://opensea.io/assets/ethereum/${holding.contractAddress}/${holding.tokenId}`, '_blank')}
                            >
                              <ExternalLink size={12} className="mr-1" />
                              OpenSea
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="benefits" className="space-y-4 mt-4">
            {/* Recent Benefit Usage */}
            <div>
              <h4 className="text-white font-medium mb-3">Recent Benefit Usage</h4>
              {benefitUsageHistory.length > 0 ? (
                <div className="space-y-2">
                  {benefitUsageHistory.slice(0, 5).map((usage, index) => (
                    <div key={usage.benefitId} className="flex items-center justify-between p-3 bg-white/5 rounded-figma-sm">
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-figma-purple" />
                        <div>
                          <p className="text-white text-sm">{usage.context}</p>
                          <p className="text-white/60 text-xs">{usage.usedAt.toLocaleDateString()}</p>
                        </div>
                      </div>
                      {usage.value > 0 && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          -{usage.value}%
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60 text-sm">No benefit usage history yet</p>
              )}
            </div>

            {/* All Available Benefits */}
            <div>
              <h4 className="text-white font-medium mb-3">All Available Benefits</h4>
              <div className="grid gap-3">
                {userProfile.activeBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-figma-sm">
                    {getBenefitIcon(benefit.type)}
                    <div className="flex-1">
                      <p className="text-white text-sm">{benefit.description}</p>
                      <p className="text-white/60 text-xs capitalize">{benefit.type.replace('_', ' ')}</p>
                    </div>
                    {typeof benefit.value === 'number' && (
                      <Badge className="bg-figma-purple/20 text-figma-purple border-figma-purple/30">
                        {benefit.value}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NFTBenefitsDisplay;