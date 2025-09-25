// React hook for microtransaction management

import { useState, useEffect, useCallback } from 'react';
import { 
  microtransactionService, 
  ContentAccess, 
  BalanceUpdate,
  MicrotransactionConfig 
} from '@/services/microtransactionService';
import { Transaction } from '@/types/yellowSDK';
import { useYellowSDK } from './useYellowSDK';

interface MicrotransactionState {
  isProcessing: boolean;
  error: string | null;
  contentAccess: ContentAccess[];
  pendingTransactions: Transaction[];
  balanceHistory: BalanceUpdate[];
  spendingAnalytics: {
    totalSpent: number;
    transactionCount: number;
    averageTransaction: number;
    contentAccessed: number;
    dailySpending: Array<{ date: string; amount: number; count: number }>;
  };
  config: MicrotransactionConfig;
}

interface MicrotransactionActions {
  processMicrotransaction: (
    contentId: string,
    amount: number,
    accessType?: 'single' | 'timed',
    duration?: number
  ) => Promise<Transaction>;
  batchMicrotransactions: (
    transactions: Array<{
      contentId: string;
      amount: number;
      accessType?: 'single' | 'timed';
      duration?: number;
    }>
  ) => Promise<Transaction[]>;
  hasContentAccess: (contentId: string) => boolean;
  triggerSettlement: () => Promise<void>;
  refreshData: () => void;
  clearError: () => void;
  updateConfig: (config: Partial<MicrotransactionConfig>) => void;
}

export const useMicrotransactions = (): MicrotransactionState & MicrotransactionActions => {
  const { isAuthenticated, session, balance } = useYellowSDK();
  
  const [state, setState] = useState<MicrotransactionState>({
    isProcessing: false,
    error: null,
    contentAccess: [],
    pendingTransactions: [],
    balanceHistory: [],
    spendingAnalytics: {
      totalSpent: 0,
      transactionCount: 0,
      averageTransaction: 0,
      contentAccessed: 0,
      dailySpending: []
    },
    config: microtransactionService.getConfig()
  });

  // Refresh data from service
  const refreshData = useCallback(() => {
    if (!isAuthenticated || !session) {
      setState(prev => ({
        ...prev,
        contentAccess: [],
        pendingTransactions: [],
        balanceHistory: [],
        spendingAnalytics: {
          totalSpent: 0,
          transactionCount: 0,
          averageTransaction: 0,
          contentAccessed: 0,
          dailySpending: []
        }
      }));
      return;
    }

    try {
      const contentAccess = microtransactionService.getContentAccessHistory();
      const pendingTransactions = microtransactionService.getPendingTransactions();
      const balanceHistory = microtransactionService.getBalanceHistory();
      const spendingAnalytics = microtransactionService.getSpendingAnalytics();
      const config = microtransactionService.getConfig();

      setState(prev => ({
        ...prev,
        contentAccess,
        pendingTransactions,
        balanceHistory,
        spendingAnalytics,
        config,
        error: null
      }));
    } catch (error) {
      console.error('Error refreshing microtransaction data:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to refresh data'
      }));
    }
  }, [isAuthenticated, session]);

  // Refresh data when authentication state changes
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Refresh data periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(refreshData, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshData]);

  // Process a single microtransaction
  const processMicrotransaction = useCallback(async (
    contentId: string,
    amount: number,
    accessType: 'single' | 'timed' = 'single',
    duration?: number
  ): Promise<Transaction> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const transaction = await microtransactionService.processMicrotransaction(
        contentId,
        amount,
        accessType,
        duration
      );

      // Refresh data after successful transaction
      setTimeout(refreshData, 1000);

      return transaction;
    } catch (error) {
      const errorMessage = error.message || 'Microtransaction failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [isAuthenticated, refreshData]);

  // Process multiple microtransactions in batch
  const batchMicrotransactions = useCallback(async (
    transactions: Array<{
      contentId: string;
      amount: number;
      accessType?: 'single' | 'timed';
      duration?: number;
    }>
  ): Promise<Transaction[]> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const processedTransactions = await microtransactionService.batchMicrotransactions(transactions);

      // Refresh data after successful batch
      setTimeout(refreshData, 1000);

      return processedTransactions;
    } catch (error) {
      const errorMessage = error.message || 'Batch processing failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [isAuthenticated, refreshData]);

  // Check if user has access to content
  const hasContentAccess = useCallback((contentId: string): boolean => {
    return microtransactionService.hasContentAccess(contentId);
  }, []);

  // Trigger manual settlement
  const triggerSettlement = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      await microtransactionService.triggerSettlement();
      
      // Refresh data after settlement
      setTimeout(refreshData, 1000);
    } catch (error) {
      const errorMessage = error.message || 'Settlement failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [isAuthenticated, refreshData]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<MicrotransactionConfig>) => {
    try {
      microtransactionService.updateConfig(newConfig);
      setState(prev => ({
        ...prev,
        config: microtransactionService.getConfig(),
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to update configuration'
      }));
    }
  }, []);

  return {
    ...state,
    processMicrotransaction,
    batchMicrotransactions,
    hasContentAccess,
    triggerSettlement,
    refreshData,
    clearError,
    updateConfig
  };
};