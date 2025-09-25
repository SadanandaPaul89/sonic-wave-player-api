// Subscription Manager Component

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, 
  Star, 
  Check, 
  X, 
  Loader2, 
  AlertCircle, 
  Calendar,
  CreditCard,
  Gift,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useSubscription } from '@/hooks/useSubscription';
import { useYellowSDK } from '@/hooks/useYellowSDK';
import { SubscriptionTier } from '@/services/subscriptionService';
import { toast } from 'sonner';

interface SubscriptionManagerProps {
  className?: string;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ className = '' }) => {
  const { isAuthenticated, session, isConnected, connect, isConnecting } = useYellowSDK();
  const {
    availableTiers,
    currentSubscription,
    isLoading,
    error,
    isExpiringSoon,
    daysUntilExpiration,
    recommendedTier,
    subscribe,
    cancelSubscription,
    renewSubscription,
    upgradeSubscription,
    getSubscriptionPlans,
    calculateYearlySavings,
    clearError
  } = useSubscription();

  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [processingTier, setProcessingTier] = useState<string | null>(null);

  const handleSubscribe = async (tierId: string) => {
    // First check if wallet is connected
    if (!isConnected) {
      try {
        toast.info('Connecting to wallet...');
        await connect();
        // Wait a moment for authentication to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        toast.error('Failed to connect wallet. Please try again.');
        return;
      }
    }

    // Check if authenticated after connection attempt
    if (!isAuthenticated) {
      toast.error('Wallet authentication required. Please sign the authentication message in your wallet.');
      return;
    }

    setProcessingTier(tierId);
    try {
      const billing = isYearly ? 'yearly' : 'monthly';
      await subscribe(tierId, billing);
      toast.success(`Successfully subscribed to ${tierId} plan!`);
    } catch (error) {
      toast.error(error.message || 'Subscription failed');
    } finally {
      setProcessingTier(null);
    }
  };

  const handleUpgrade = async (tierId: string) => {
    if (!currentSubscription) return;

    // First check if wallet is connected
    if (!isConnected) {
      try {
        toast.info('Connecting to wallet...');
        await connect();
        // Wait a moment for authentication to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        toast.error('Failed to connect wallet. Please try again.');
        return;
      }
    }

    // Check if authenticated after connection attempt
    if (!isAuthenticated) {
      toast.error('Wallet authentication required. Please sign the authentication message in your wallet.');
      return;
    }

    setProcessingTier(tierId);
    try {
      await upgradeSubscription(tierId);
      toast.success(`Successfully upgraded to ${tierId} plan!`);
    } catch (error) {
      toast.error(error.message || 'Upgrade failed');
    } finally {
      setProcessingTier(null);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSubscription();
      toast.success('Subscription cancelled successfully');
    } catch (error) {
      toast.error(error.message || 'Cancellation failed');
    }
  };

  const handleRenew = async () => {
    try {
      await renewSubscription();
      toast.success('Subscription renewed successfully');
    } catch (error) {
      toast.error(error.message || 'Renewal failed');
    }
  };

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'basic':
        return <Zap className="text-blue-400" size={24} />;
      case 'premium':
        return <Star className="text-purple-400" size={24} />;
      case 'vip':
        return <Crown className="text-yellow-400" size={24} />;
      default:
        return <Gift className="text-green-400" size={24} />;
    }
  };

  const getTierColor = (tierId: string) => {
    switch (tierId) {
      case 'basic':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'premium':
        return 'border-purple-500/30 bg-purple-500/10';
      case 'vip':
        return 'border-yellow-500/30 bg-yellow-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const isCurrentTier = (tierId: string) => {
    return currentSubscription?.tier === tierId && currentSubscription?.isActive;
  };

  const canUpgradeTo = (tierId: string) => {
    if (!currentSubscription?.isActive) return true;
    
    const tierHierarchy = ['basic', 'premium', 'vip'];
    const currentIndex = tierHierarchy.indexOf(currentSubscription.tier);
    const targetIndex = tierHierarchy.indexOf(tierId);
    
    return targetIndex > currentIndex;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Subscription Status */}
      {isAuthenticated && currentSubscription && (
        <Card className="glass-card border-figma-glass-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="text-figma-purple" size={20} />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getTierIcon(currentSubscription.tier)}
                <div>
                  <p className="text-white font-medium capitalize">
                    {currentSubscription.tier} Plan
                  </p>
                  <p className="text-white/60 text-sm">
                    {currentSubscription.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-white text-sm">
                  {currentSubscription.isActive ? 'Expires' : 'Expired'}
                </p>
                <p className="text-white/60 text-sm">
                  {currentSubscription.expiresAt.toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Expiration Warning */}
            {isExpiringSoon && currentSubscription.isActive && (
              <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-figma-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-yellow-400" />
                  <p className="text-yellow-400 text-sm">
                    Your subscription expires in {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  onClick={handleRenew}
                  size="sm"
                  className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-black"
                  disabled={isLoading}
                >
                  Renew Now
                </Button>
              </div>
            )}

            {/* Subscription Actions */}
            <div className="flex gap-2">
              {currentSubscription.autoRenew ? (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  disabled={isLoading}
                >
                  Cancel Auto-Renewal
                </Button>
              ) : (
                <Button
                  onClick={handleRenew}
                  size="sm"
                  className="bg-figma-purple hover:bg-figma-purple/80"
                  disabled={isLoading}
                >
                  Renew Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-red-500/20 border border-red-500/30 rounded-figma-sm"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
              <Button
                onClick={clearError}
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300 p-1"
              >
                <X size={14} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 p-4 bg-white/5 rounded-figma-md">
        <span className={`text-sm ${!isYearly ? 'text-white' : 'text-white/60'}`}>
          Monthly
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={setIsYearly}
          className="data-[state=checked]:bg-figma-purple"
        />
        <span className={`text-sm ${isYearly ? 'text-white' : 'text-white/60'}`}>
          Yearly
        </span>
        {isYearly && (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Save up to 17%
          </Badge>
        )}
      </div>

      {/* Subscription Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availableTiers.map((tier) => {
          const plans = getSubscriptionPlans(tier.id);
          const selectedPlan = plans.find(p => p.billing === (isYearly ? 'yearly' : 'monthly'));
          const savings = isYearly ? calculateYearlySavings(tier.id) : null;
          const isProcessing = processingTier === tier.id;
          const isCurrent = isCurrentTier(tier.id);
          const canUpgrade = canUpgradeTo(tier.id);

          return (
            <motion.div
              key={tier.id}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`relative h-full ${getTierColor(tier.id)} ${
                tier.popular ? 'ring-2 ring-figma-purple' : ''
              }`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-figma-purple text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    {getTierIcon(tier.id)}
                  </div>
                  <CardTitle className="text-white">{tier.name}</CardTitle>
                  <p className="text-white/60 text-sm">{tier.description}</p>
                  
                  <div className="py-4">
                    <div className="text-3xl font-bold text-white">
                      {selectedPlan?.tier.price.toFixed(4)} {tier.currency}
                    </div>
                    <div className="text-white/60 text-sm">
                      per {isYearly ? 'year' : 'month'}
                    </div>
                    {savings && savings.percentage > 0 && (
                      <div className="text-green-400 text-sm mt-1">
                        Save {savings.amount.toFixed(4)} {tier.currency} ({savings.percentage}%)
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <div className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-white/80 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    {isCurrent ? (
                      <Button
                        disabled
                        className="w-full bg-green-500/20 text-green-400 border border-green-500/30"
                      >
                        <Check size={16} className="mr-2" />
                        Current Plan
                      </Button>
                    ) : canUpgrade && currentSubscription?.isActive ? (
                      <Button
                        onClick={() => handleUpgrade(tier.id)}
                        disabled={isProcessing || !isAuthenticated}
                        className="w-full bg-figma-purple hover:bg-figma-purple/80"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Upgrading...
                          </>
                        ) : (
                          <>
                            <TrendingUp size={16} className="mr-2" />
                            Upgrade
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSubscribe(tier.id)}
                        disabled={isProcessing || !isAuthenticated}
                        className="w-full bg-figma-purple hover:bg-figma-purple/80"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard size={16} className="mr-2" />
                            Subscribe
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Authentication Required */}
      {!isAuthenticated && (
        <div className="text-center p-6 bg-white/5 rounded-figma-md">
          <p className="text-white/60 mb-4">
            Connect your wallet to manage subscriptions
          </p>
          <Button className="bg-figma-purple hover:bg-figma-purple/80">
            Connect Wallet
          </Button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;