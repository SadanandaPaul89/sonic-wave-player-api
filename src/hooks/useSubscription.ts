// React hook for subscription management

import { useState, useEffect, useCallback } from 'react';
import { 
  subscriptionService, 
  SubscriptionTier, 
  SubscriptionPlan, 
  SubscriptionTransaction 
} from '@/services/subscriptionService';
import { SubscriptionStatus } from '@/types/yellowSDK';
import { useYellowSDK } from './useYellowSDK';

interface SubscriptionState {
  availableTiers: SubscriptionTier[];
  currentSubscription: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;
  isExpiringSoon: boolean;
  daysUntilExpiration: number;
  recommendedTier: SubscriptionTier | null;
}

interface SubscriptionActions {
  subscribe: (tierId: string, billing?: 'monthly' | 'yearly') => Promise<SubscriptionTransaction>;
  cancelSubscription: () => Promise<void>;
  renewSubscription: () => Promise<SubscriptionTransaction>;
  upgradeSubscription: (newTierId: string) => Promise<SubscriptionTransaction>;
  getSubscriptionPlans: (tierId: string) => SubscriptionPlan[];
  hasAccessToTier: (requiredTier: string) => boolean;
  calculateYearlySavings: (tierId: string) => { amount: number; percentage: number };
  refreshSubscription: () => void;
  clearError: () => void;
}

export const useSubscription = (): SubscriptionState & SubscriptionActions => {
  const { isAuthenticated, session } = useYellowSDK();
  
  const [state, setState] = useState<SubscriptionState>({
    availableTiers: [],
    currentSubscription: null,
    isLoading: false,
    error: null,
    isExpiringSoon: false,
    daysUntilExpiration: 0,
    recommendedTier: null
  });

  // Load subscription data
  const loadSubscriptionData = useCallback(() => {
    try {
      const tiers = subscriptionService.getAvailableTiers();
      const currentSub = subscriptionService.getCurrentSubscription(session?.walletAddress);
      const expiringSoon = subscriptionService.isSubscriptionExpiringSoon(session?.walletAddress);
      const daysLeft = subscriptionService.getDaysUntilExpiration(session?.walletAddress);
      const recommended = subscriptionService.getRecommendedTier(session?.walletAddress);

      setState(prev => ({
        ...prev,
        availableTiers: tiers,
        currentSubscription: currentSub,
        isExpiringSoon: expiringSoon,
        daysUntilExpiration: daysLeft,
        recommendedTier: recommended,
        error: null
      }));
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to load subscription data'
      }));
    }
  }, [session?.walletAddress]);

  // Load data when authenticated or session changes
  useEffect(() => {
    if (isAuthenticated && session) {
      loadSubscriptionData();
    } else {
      setState(prev => ({
        ...prev,
        currentSubscription: null,
        isExpiringSoon: false,
        daysUntilExpiration: 0
      }));
    }
  }, [isAuthenticated, session, loadSubscriptionData]);

  // Subscribe to a tier
  const subscribe = useCallback(async (
    tierId: string, 
    billing: 'monthly' | 'yearly' = 'monthly'
  ): Promise<SubscriptionTransaction> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const transaction = await subscriptionService.subscribe(tierId, billing);
      
      // Refresh subscription data after successful subscription
      setTimeout(loadSubscriptionData, 1000);
      
      return transaction;
    } catch (error) {
      const errorMessage = error.message || 'Subscription failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [isAuthenticated, loadSubscriptionData]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await subscriptionService.cancelSubscription();
      
      // Refresh subscription data
      setTimeout(loadSubscriptionData, 1000);
    } catch (error) {
      const errorMessage = error.message || 'Cancellation failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [isAuthenticated, loadSubscriptionData]);

  // Renew subscription
  const renewSubscription = useCallback(async (): Promise<SubscriptionTransaction> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const transaction = await subscriptionService.renewSubscription();
      
      // Refresh subscription data
      setTimeout(loadSubscriptionData, 1000);
      
      return transaction;
    } catch (error) {
      const errorMessage = error.message || 'Renewal failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [isAuthenticated, loadSubscriptionData]);

  // Upgrade subscription
  const upgradeSubscription = useCallback(async (newTierId: string): Promise<SubscriptionTransaction> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const transaction = await subscriptionService.upgradeSubscription(newTierId);
      
      // Refresh subscription data
      setTimeout(loadSubscriptionData, 1000);
      
      return transaction;
    } catch (error) {
      const errorMessage = error.message || 'Upgrade failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [isAuthenticated, loadSubscriptionData]);

  // Get subscription plans for a tier
  const getSubscriptionPlans = useCallback((tierId: string): SubscriptionPlan[] => {
    return subscriptionService.getSubscriptionPlans(tierId);
  }, []);

  // Check access to tier
  const hasAccessToTier = useCallback((requiredTier: string): boolean => {
    return subscriptionService.hasAccessToTier(requiredTier, session?.walletAddress);
  }, [session?.walletAddress]);

  // Calculate yearly savings
  const calculateYearlySavings = useCallback((tierId: string) => {
    return subscriptionService.calculateYearlySavings(tierId);
  }, []);

  // Refresh subscription data
  const refreshSubscription = useCallback(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    subscribe,
    cancelSubscription,
    renewSubscription,
    upgradeSubscription,
    getSubscriptionPlans,
    hasAccessToTier,
    calculateYearlySavings,
    refreshSubscription,
    clearError
  };
};