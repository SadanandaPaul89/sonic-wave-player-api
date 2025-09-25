// React hook for payment management

import { useState, useEffect, useCallback } from 'react';
import { paymentService, PaymentOption, PaymentResult } from '@/services/paymentService';
import { Transaction, PaymentChannel } from '@/types/yellowSDK';
import { useYellowSDK } from './useYellowSDK';

interface PaymentState {
  isProcessing: boolean;
  error: string | null;
  lastTransaction: Transaction | null;
  transactionHistory: Transaction[];
  activeChannels: PaymentChannel[];
  balance: number;
}

interface PaymentActions {
  getPaymentOptions: (contentId: string, userAddress?: string) => Promise<PaymentOption[]>;
  processPayment: (contentId: string, paymentType: PaymentOption['type'], amount?: number) => Promise<PaymentResult>;
  settleChannel: (channelId?: string) => Promise<void>;
  clearError: () => void;
  refreshBalance: () => void;
  isPaymentRequired: (contentId: string, userAddress?: string) => Promise<boolean>;
  getRecommendedPayment: (contentId: string, userAddress?: string) => Promise<PaymentOption | null>;
}

export const usePayment = (): PaymentState & PaymentActions => {
  const { isAuthenticated, session, balance: sdkBalance, lastTransaction: sdkLastTransaction } = useYellowSDK();
  
  const [state, setState] = useState<PaymentState>({
    isProcessing: false,
    error: null,
    lastTransaction: null,
    transactionHistory: [],
    activeChannels: [],
    balance: 0
  });

  // Update state when SDK state changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      balance: sdkBalance,
      lastTransaction: sdkLastTransaction || prev.lastTransaction
    }));
  }, [sdkBalance, sdkLastTransaction]);

  // Refresh data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  const refreshData = useCallback(() => {
    try {
      const history = paymentService.getTransactionHistory();
      const channels = paymentService.getActiveChannels();
      const balance = paymentService.getCurrentBalance();

      setState(prev => ({
        ...prev,
        transactionHistory: history,
        activeChannels: channels,
        balance,
        error: null
      }));
    } catch (error) {
      console.error('Error refreshing payment data:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to refresh payment data'
      }));
    }
  }, []);

  const getPaymentOptions = useCallback(async (contentId: string, userAddress?: string): Promise<PaymentOption[]> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const options = await paymentService.getPaymentOptions(
        contentId, 
        userAddress || session?.walletAddress
      );
      
      return options;
    } catch (error) {
      const errorMessage = error.message || 'Failed to get payment options';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [session?.walletAddress]);

  const processPayment = useCallback(async (
    contentId: string, 
    paymentType: PaymentOption['type'], 
    amount?: number
  ): Promise<PaymentResult> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await paymentService.processPayment(contentId, paymentType, amount);
      
      if (result.success && result.transaction) {
        setState(prev => ({
          ...prev,
          lastTransaction: result.transaction!,
          transactionHistory: [result.transaction!, ...prev.transactionHistory]
        }));
      }

      // Refresh data after successful payment
      if (result.success) {
        setTimeout(refreshData, 1000);
      }

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Payment processing failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      
      return {
        success: false,
        accessGranted: false,
        error: errorMessage
      };
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [isAuthenticated, refreshData]);

  const settleChannel = useCallback(async (channelId?: string): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      await paymentService.settleChannel(channelId);
      
      // Refresh data after settlement
      setTimeout(refreshData, 1000);
    } catch (error) {
      const errorMessage = error.message || 'Channel settlement failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [isAuthenticated, refreshData]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refreshBalance = useCallback(() => {
    refreshData();
  }, [refreshData]);

  const isPaymentRequired = useCallback(async (contentId: string, userAddress?: string): Promise<boolean> => {
    try {
      return await paymentService.isPaymentRequired(
        contentId, 
        userAddress || session?.walletAddress
      );
    } catch (error) {
      console.error('Error checking payment requirement:', error);
      return true; // Assume payment required on error
    }
  }, [session?.walletAddress]);

  const getRecommendedPayment = useCallback(async (contentId: string, userAddress?: string): Promise<PaymentOption | null> => {
    try {
      return await paymentService.getRecommendedPaymentOption(
        contentId, 
        userAddress || session?.walletAddress
      );
    } catch (error) {
      console.error('Error getting recommended payment:', error);
      return null;
    }
  }, [session?.walletAddress]);

  return {
    ...state,
    getPaymentOptions,
    processPayment,
    settleChannel,
    clearError,
    refreshBalance,
    isPaymentRequired,
    getRecommendedPayment
  };
};