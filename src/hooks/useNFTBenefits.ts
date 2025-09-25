// React hook for NFT benefits management

import { useState, useEffect, useCallback } from 'react';
import { 
  nftBenefitsService, 
  NFTCollection, 
  UserNFTProfile, 
  BenefitUsage 
} from '@/services/nftBenefitsService';
import { NFTBenefit } from '@/types/yellowSDK';
import { useYellowSDK } from './useYellowSDK';

interface NFTBenefitsState {
  userProfile: UserNFTProfile | null;
  supportedCollections: NFTCollection[];
  isLoading: boolean;
  error: string | null;
  benefitUsageHistory: BenefitUsage[];
  discountPercentage: number;
  hasEarlyAccess: boolean;
  earlyAccessHours: number;
  exclusiveContentIds: string[];
}

interface NFTBenefitsActions {
  loadUserProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasBenefit: (benefitType: NFTBenefit['type']) => Promise<boolean>;
  applyBenefit: (benefitType: NFTBenefit['type'], context: string, value?: number) => Promise<boolean>;
  getDiscountPercentage: (context?: 'marketplace' | 'subscription' | 'merchandise') => Promise<number>;
  checkEarlyAccess: () => Promise<void>;
  loadExclusiveContent: () => Promise<void>;
  clearError: () => void;
}

export const useNFTBenefits = (): NFTBenefitsState & NFTBenefitsActions => {
  const { isAuthenticated, session } = useYellowSDK();
  
  const [state, setState] = useState<NFTBenefitsState>({
    userProfile: null,
    supportedCollections: [],
    isLoading: false,
    error: null,
    benefitUsageHistory: [],
    discountPercentage: 0,
    hasEarlyAccess: false,
    earlyAccessHours: 0,
    exclusiveContentIds: []
  });

  // Load supported collections on mount
  useEffect(() => {
    const collections = nftBenefitsService.getSupportedCollections();
    setState(prev => ({ ...prev, supportedCollections: collections }));
  }, []);

  // Load user profile when authenticated
  useEffect(() => {
    if (isAuthenticated && session) {
      loadUserProfile();
    } else {
      setState(prev => ({
        ...prev,
        userProfile: null,
        benefitUsageHistory: [],
        discountPercentage: 0,
        hasEarlyAccess: false,
        earlyAccessHours: 0,
        exclusiveContentIds: []
      }));
    }
  }, [isAuthenticated, session]);

  const loadUserProfile = useCallback(async () => {
    if (!session?.walletAddress) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const profile = await nftBenefitsService.getUserProfile(session.walletAddress);
      
      if (profile) {
        // Load additional data
        const usageHistory = nftBenefitsService.getBenefitUsageHistory(session.walletAddress);
        const discount = await nftBenefitsService.getDiscountPercentage(session.walletAddress);
        const earlyAccess = await nftBenefitsService.hasEarlyAccess(session.walletAddress);
        const exclusiveIds = await nftBenefitsService.getExclusiveContentIds(session.walletAddress);

        setState(prev => ({
          ...prev,
          userProfile: profile,
          benefitUsageHistory: usageHistory,
          discountPercentage: discount,
          hasEarlyAccess: earlyAccess.hasAccess,
          earlyAccessHours: earlyAccess.hoursEarly,
          exclusiveContentIds: exclusiveIds,
          isLoading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          userProfile: null,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error loading NFT profile:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to load NFT profile',
        isLoading: false
      }));
    }
  }, [session?.walletAddress]);

  const refreshProfile = useCallback(async () => {
    if (!session?.walletAddress) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const profile = await nftBenefitsService.refreshUserProfile(session.walletAddress);
      
      if (profile) {
        // Reload all related data
        const usageHistory = nftBenefitsService.getBenefitUsageHistory(session.walletAddress);
        const discount = await nftBenefitsService.getDiscountPercentage(session.walletAddress);
        const earlyAccess = await nftBenefitsService.hasEarlyAccess(session.walletAddress);
        const exclusiveIds = await nftBenefitsService.getExclusiveContentIds(session.walletAddress);

        setState(prev => ({
          ...prev,
          userProfile: profile,
          benefitUsageHistory: usageHistory,
          discountPercentage: discount,
          hasEarlyAccess: earlyAccess.hasAccess,
          earlyAccessHours: earlyAccess.hoursEarly,
          exclusiveContentIds: exclusiveIds,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error refreshing NFT profile:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to refresh NFT profile',
        isLoading: false
      }));
    }
  }, [session?.walletAddress]);

  const hasBenefit = useCallback(async (benefitType: NFTBenefit['type']): Promise<boolean> => {
    if (!session?.walletAddress) return false;

    try {
      return await nftBenefitsService.hasBenefit(session.walletAddress, benefitType);
    } catch (error) {
      console.error('Error checking benefit:', error);
      return false;
    }
  }, [session?.walletAddress]);

  const applyBenefit = useCallback(async (
    benefitType: NFTBenefit['type'], 
    context: string, 
    value: number = 0
  ): Promise<boolean> => {
    if (!session?.walletAddress) return false;

    try {
      const success = await nftBenefitsService.applyBenefit(
        session.walletAddress, 
        benefitType, 
        context, 
        value
      );

      if (success) {
        // Refresh usage history
        const usageHistory = nftBenefitsService.getBenefitUsageHistory(session.walletAddress);
        setState(prev => ({ ...prev, benefitUsageHistory: usageHistory }));
      }

      return success;
    } catch (error) {
      console.error('Error applying benefit:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to apply benefit'
      }));
      return false;
    }
  }, [session?.walletAddress]);

  const getDiscountPercentage = useCallback(async (
    context: 'marketplace' | 'subscription' | 'merchandise' = 'marketplace'
  ): Promise<number> => {
    if (!session?.walletAddress) return 0;

    try {
      const discount = await nftBenefitsService.getDiscountPercentage(session.walletAddress, context);
      
      // Update state if this is the current context
      if (context === 'marketplace') {
        setState(prev => ({ ...prev, discountPercentage: discount }));
      }
      
      return discount;
    } catch (error) {
      console.error('Error getting discount percentage:', error);
      return 0;
    }
  }, [session?.walletAddress]);

  const checkEarlyAccess = useCallback(async () => {
    if (!session?.walletAddress) return;

    try {
      const earlyAccess = await nftBenefitsService.hasEarlyAccess(session.walletAddress);
      setState(prev => ({
        ...prev,
        hasEarlyAccess: earlyAccess.hasAccess,
        earlyAccessHours: earlyAccess.hoursEarly
      }));
    } catch (error) {
      console.error('Error checking early access:', error);
    }
  }, [session?.walletAddress]);

  const loadExclusiveContent = useCallback(async () => {
    if (!session?.walletAddress) return;

    try {
      const exclusiveIds = await nftBenefitsService.getExclusiveContentIds(session.walletAddress);
      setState(prev => ({ ...prev, exclusiveContentIds: exclusiveIds }));
    } catch (error) {
      console.error('Error loading exclusive content:', error);
    }
  }, [session?.walletAddress]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    loadUserProfile,
    refreshProfile,
    hasBenefit,
    applyBenefit,
    getDiscountPercentage,
    checkEarlyAccess,
    loadExclusiveContent,
    clearError
  };
};