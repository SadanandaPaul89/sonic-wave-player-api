// Content Access Gate Component - Controls access to content based on user permissions

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Unlock,
  CreditCard,
  Star,
  Palette,
  Wallet,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useContent } from '@/hooks/useContent';
import { useYellowSDK } from '@/hooks/useYellowSDK';
import { useSubscription } from '@/hooks/useSubscription';
import { ContentItem } from '@/types/yellowSDK';
import { AccessValidationResult } from '@/services/contentService';
import { toast } from 'sonner';

interface ContentAccessGateProps {
  content: ContentItem;
  children: React.ReactNode;
  onAccessGranted?: () => void;
  onAccessDenied?: (reason: string) => void;
  className?: string;
}

const ContentAccessGate: React.FC<ContentAccessGateProps> = ({
  content,
  children,
  onAccessGranted,
  onAccessDenied,
  className = ''
}) => {
  const { isAuthenticated, connect } = useYellowSDK();
  const { validateAccess, requestAccess } = useContent();
  const { subscribe, availableTiers } = useSubscription();

  const [accessResult, setAccessResult] = useState<AccessValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Validate access when component mounts or authentication changes
  useEffect(() => {
    checkAccess();
  }, [content.id, isAuthenticated]);

  const checkAccess = async () => {
    setIsValidating(true);
    try {
      const result = await validateAccess(content.id);
      setAccessResult(result);

      if (result.hasAccess) {
        onAccessGranted?.();
      } else {
        onAccessDenied?.(result.reason || 'Access denied');
      }
    } catch (error) {
      console.error('Error validating access:', error);
      setAccessResult({
        hasAccess: false,
        accessMethod: 'none',
        reason: 'Access validation failed'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connect();
      toast.success('Wallet connected successfully');
    } catch (error) {
      toast.error('Failed to connect wallet');
    }
  };

  const handlePayment = async () => {
    if (!content.pricing.payPerUse) return;

    setIsProcessing(true);
    try {
      const success = await requestAccess(content.id, 'payment');
      if (success) {
        toast.success('Payment successful! Access granted.');
        await checkAccess(); // Refresh access status
      }
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscribe = async (tierId: string) => {
    setIsProcessing(true);
    try {
      await subscribe(tierId);
      toast.success('Subscription successful! Access granted.');
      await checkAccess(); // Refresh access status
    } catch (error) {
      toast.error('Subscription failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <Unlock className="text-green-400" size={20} />;
      case 'pay_per_use': return <CreditCard className="text-blue-400" size={20} />;
      case 'subscription': return <Star className="text-purple-400" size={20} />;
      case 'nft_gated': return <Palette className="text-amber-400" size={20} />;
      case 'premium': return <Lock className="text-red-400" size={20} />;
      default: return <Lock className="text-gray-400" size={20} />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pay_per_use': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'subscription': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'nft_gated': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'premium': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Show loading state
  if (isValidating) {
    return (
      <Card className={`glass-card border-figma-glass-border ${className}`}>
        <CardContent className="p-8 text-center">
          <Loader2 size={32} className="text-figma-purple animate-spin mx-auto mb-4" />
          <p className="text-white/60">Validating access...</p>
        </CardContent>
      </Card>
    );
  }

  // Show content if access is granted
  if (accessResult?.hasAccess) {
    return (
      <div className={className}>
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle size={16} className="text-green-400" />
          <span className="text-green-400 text-sm">
            Access granted via {accessResult.accessMethod}
          </span>
          <Badge className={getTierColor(content.accessTier)}>
            {getTierIcon(content.accessTier)}
            <span className="ml-1 capitalize">{content.accessTier.replace('_', ' ')}</span>
          </Badge>
        </div>
        {children}
      </div>
    );
  }

  // Show access denied UI
  return (
    <Card className={`glass-card border-figma-glass-border ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-white">
          {getTierIcon(content.accessTier)}
          Access Required
          <Badge className={getTierColor(content.accessTier)}>
            {content.accessTier.replace('_', ' ').toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Content Preview */}
        <div className="p-4 bg-white/5 rounded-figma-md">
          <h3 className="text-white font-medium mb-2">{content.title}</h3>
          <p className="text-white/60 text-sm mb-3">by {content.artist}</p>
          {/* Show description if available (from extended metadata) */}
          {content.metadata.properties?.description && (
            <p className="text-white/70 text-sm mb-3">{content.metadata.properties.description as string}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-white/50">
            {content.metadata.genre && (
              <span className="px-2 py-1 bg-white/10 rounded-full">{content.metadata.genre}</span>
            )}
            {content.metadata.year && (
              <span>{content.metadata.year}</span>
            )}
            <span>{Math.floor(content.metadata.duration / 60)}:{(content.metadata.duration % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Access Reason */}
        <div className="flex items-start gap-3 p-3 bg-amber-500/20 border border-amber-500/30 rounded-figma-sm">
          <AlertCircle size={16} className="text-amber-400 mt-0.5" />
          <div>
            <p className="text-amber-400 text-sm font-medium">Access Required</p>
            <p className="text-amber-400/80 text-xs mt-1">
              {accessResult?.reason || 'You need permission to access this content'}
            </p>
          </div>
        </div>

        {/* Access Options */}
        <div className="space-y-4">
          <h4 className="text-white font-medium">Choose an access method:</h4>

          {/* Wallet Connection Required */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                onClick={handleConnectWallet}
                className="w-full bg-figma-purple hover:bg-figma-purple/80"
                disabled={isProcessing}
              >
                <Wallet size={16} className="mr-2" />
                Connect Wallet
              </Button>
              <p className="text-white/60 text-xs mt-2 text-center">
                Connect your wallet to access payment and subscription options
              </p>
            </motion.div>
          )}

          {/* Payment Option */}
          {isAuthenticated && content.pricing.payPerUse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <CreditCard size={16} className="mr-2" />
                )}
                Pay {content.pricing.payPerUse} {content.pricing.currency}
              </Button>
              <p className="text-white/60 text-xs mt-2 text-center">
                One-time payment for instant access
              </p>
            </motion.div>
          )}

          {/* Subscription Options */}
          {isAuthenticated && content.pricing.subscriptionTiers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <p className="text-white/80 text-sm">Or subscribe for unlimited access:</p>
              {availableTiers
                .filter(tier => content.pricing.subscriptionTiers.includes(tier.id))
                .map((tier) => (
                  <Button
                    key={tier.id}
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={isProcessing}
                    variant="outline"
                    className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                  >
                    {isProcessing ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Star size={16} className="mr-2" />
                    )}
                    {tier.name} - {tier.price} {tier.currency}/month
                  </Button>
                ))}
            </motion.div>
          )}

          {/* NFT Requirement */}
          {content.nftRequirements && content.nftRequirements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 bg-amber-500/20 border border-amber-500/30 rounded-figma-md"
            >
              <div className="flex items-center gap-2 mb-2">
                <Palette size={16} className="text-amber-400" />
                <span className="text-amber-400 font-medium text-sm">NFT Required</span>
              </div>
              <p className="text-amber-400/80 text-xs mb-3">
                This content requires ownership of specific NFTs
              </p>
              {content.nftRequirements.map((req, index) => (
                <div key={index} className="text-xs text-amber-400/60 font-mono">
                  Contract: {req.contractAddress.slice(0, 10)}...
                  {req.tokenIds && (
                    <span className="ml-2">
                      Tokens: {req.tokenIds.slice(0, 3).join(', ')}
                      {req.tokenIds.length > 3 && '...'}
                    </span>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Content Tier Info */}
        <div className="pt-4 border-t border-white/10">
          <p className="text-white/60 text-xs text-center">
            This is {content.accessTier.replace('_', ' ')} content.
            {content.accessTier === 'premium' && ' Multiple access methods available.'}
            {content.accessTier === 'nft_gated' && ' Exclusive to NFT holders.'}
            {content.accessTier === 'subscription' && ' Included in subscription plans.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentAccessGate;