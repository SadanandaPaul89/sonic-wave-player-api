// React hook for content management and access control

import { useState, useEffect, useCallback } from 'react';
import { 
  contentService, 
  ContentTierDefinition, 
  AccessValidationResult,
  ContentFilter 
} from '@/services/contentService';
import { ContentItem, AccessRight } from '@/types/yellowSDK';
import { useYellowSDK } from './useYellowSDK';
import { usePayment } from './usePayment';

interface ContentState {
  content: ContentItem[];
  totalContent: number;
  contentTiers: ContentTierDefinition[];
  userAccessRights: AccessRight[];
  recommendations: ContentItem[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  activeFilter: ContentFilter | null;
}

interface ContentActions {
  searchContent: (query?: string, filter?: ContentFilter, limit?: number, offset?: number) => Promise<void>;
  getContent: (contentId: string) => Promise<ContentItem | null>;
  validateAccess: (contentId: string) => Promise<AccessValidationResult>;
  requestAccess: (contentId: string, accessMethod: 'payment' | 'subscription' | 'nft') => Promise<boolean>;
  loadRecommendations: () => Promise<void>;
  refreshUserAccess: () => void;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: ContentFilter | null) => void;
  clearError: () => void;
}

export const useContent = (): ContentState & ContentActions => {
  const { isAuthenticated, session } = useYellowSDK();
  const { processPayment, getPaymentOptions } = usePayment();
  
  const [state, setState] = useState<ContentState>({
    content: [],
    totalContent: 0,
    contentTiers: [],
    userAccessRights: [],
    recommendations: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    activeFilter: null
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Refresh user access when authentication changes
  useEffect(() => {
    if (isAuthenticated && session) {
      refreshUserAccess();
      loadRecommendations();
    }
  }, [isAuthenticated, session]);

  const loadInitialData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Load content tiers
      const tiers = contentService.getContentTiers();
      
      // Load initial content
      const { content, total } = await contentService.searchContent();

      setState(prev => ({
        ...prev,
        contentTiers: tiers,
        content,
        totalContent: total,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading initial content data:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to load content',
        isLoading: false
      }));
    }
  }, []);

  const searchContent = useCallback(async (
    query?: string,
    filter?: ContentFilter,
    limit: number = 50,
    offset: number = 0
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { content, total } = await contentService.searchContent(query, filter, limit, offset);

      setState(prev => ({
        ...prev,
        content,
        totalContent: total,
        searchQuery: query || '',
        activeFilter: filter || null,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error searching content:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Search failed',
        isLoading: false
      }));
    }
  }, []);

  const getContent = useCallback(async (contentId: string): Promise<ContentItem | null> => {
    try {
      const content = await contentService.getContent(contentId);
      return content;
    } catch (error) {
      console.error('Error getting content:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to get content'
      }));
      return null;
    }
  }, []);

  const validateAccess = useCallback(async (contentId: string): Promise<AccessValidationResult> => {
    try {
      const result = await contentService.validateAccess(contentId, session?.walletAddress);
      return result;
    } catch (error) {
      console.error('Error validating access:', error);
      return {
        hasAccess: false,
        accessMethod: 'none',
        reason: error.message || 'Access validation failed'
      };
    }
  }, [session?.walletAddress]);

  const requestAccess = useCallback(async (
    contentId: string, 
    accessMethod: 'payment' | 'subscription' | 'nft'
  ): Promise<boolean> => {
    if (!isAuthenticated || !session) {
      setState(prev => ({
        ...prev,
        error: 'Please connect your wallet first'
      }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const content = await contentService.getContent(contentId);
      if (!content) {
        throw new Error('Content not found');
      }

      switch (accessMethod) {
        case 'payment': {
          if (!content.pricing.payPerUse) {
            throw new Error('Pay-per-use not available for this content');
          }

          const paymentResult = await processPayment(
            contentId,
            'pay_per_use',
            content.pricing.payPerUse
          );

          if (paymentResult.success) {
            // Grant access locally
            await contentService.grantAccess(contentId, session.walletAddress, 'payment');
            refreshUserAccess();
            return true;
          } else {
            throw new Error(paymentResult.error || 'Payment failed');
          }
        }

        case 'subscription':
          // This would typically redirect to subscription flow
          setState(prev => ({
            ...prev,
            error: 'Please subscribe to access this content'
          }));
          return false;

        case 'nft':
          // This would typically redirect to NFT marketplace
          setState(prev => ({
            ...prev,
            error: 'Please purchase the required NFT to access this content'
          }));
          return false;

        default:
          throw new Error('Invalid access method');
      }
    } catch (error) {
      console.error('Error requesting access:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Access request failed'
      }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [isAuthenticated, session, processPayment]);

  const loadRecommendations = useCallback(async () => {
    if (!session) return;

    try {
      const recommendations = await contentService.getRecommendations(session.walletAddress);
      setState(prev => ({
        ...prev,
        recommendations
      }));
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  }, [session]);

  const refreshUserAccess = useCallback(() => {
    if (!session) {
      setState(prev => ({ ...prev, userAccessRights: [] }));
      return;
    }

    try {
      const accessRights = contentService.getUserAccessRights(session.walletAddress);
      setState(prev => ({
        ...prev,
        userAccessRights: accessRights
      }));
    } catch (error) {
      console.error('Error refreshing user access:', error);
    }
  }, [session]);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setFilter = useCallback((filter: ContentFilter | null) => {
    setState(prev => ({ ...prev, activeFilter: filter }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    searchContent,
    getContent,
    validateAccess,
    requestAccess,
    loadRecommendations,
    refreshUserAccess,
    setSearchQuery,
    setFilter,
    clearError
  };
};