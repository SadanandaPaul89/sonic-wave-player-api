// React hook for Yellow SDK integration

import { useState, useEffect, useCallback } from 'react';
import { yellowSDKService } from '@/services/yellowSDKService';
import { 
  UserSession, 
  PaymentChannel, 
  Transaction, 
  SubscriptionStatus,
  ErrorMessage 
} from '@/types/yellowSDK';

interface YellowSDKState {
  isConnected: boolean;
  isAuthenticated: boolean;
  isConnecting: boolean;
  session: UserSession | null;
  balance: number;
  paymentChannel: PaymentChannel | null;
  error: string | null;
  lastTransaction: Transaction | null;
}

interface YellowSDKActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  authenticate: (walletAddress: string, signature: string) => Promise<UserSession>;
  createPaymentChannel: () => Promise<PaymentChannel>;
  processTransaction: (amount: number, contentId: string, type?: Transaction['type']) => Promise<Transaction>;
  settleChannel: () => Promise<void>;
  clearError: () => void;
}

export const useYellowSDK = (): YellowSDKState & YellowSDKActions => {
  const [state, setState] = useState<YellowSDKState>({
    isConnected: false,
    isAuthenticated: false,
    isConnecting: false,
    session: null,
    balance: 0,
    paymentChannel: null,
    error: null,
    lastTransaction: null
  });

  // Update state from service
  const updateStateFromService = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: yellowSDKService.getConnectionStatus(),
      isAuthenticated: yellowSDKService.getAuthenticationStatus(),
      session: yellowSDKService.getCurrentSession(),
      balance: yellowSDKService.getBalance(),
      paymentChannel: yellowSDKService.getCurrentSession()?.paymentChannel || null
    }));
  }, []);

  // Event handlers
  const handleConnected = useCallback(() => {
    console.log('Yellow SDK connected');
    setState(prev => ({
      ...prev,
      isConnected: true,
      isConnecting: false,
      error: null
    }));
  }, []);

  const handleDisconnected = useCallback(() => {
    console.log('Yellow SDK disconnected');
    setState(prev => ({
      ...prev,
      isConnected: false,
      isAuthenticated: false,
      isConnecting: false,
      session: null,
      balance: 0,
      paymentChannel: null
    }));
  }, []);

  const handleAuthenticated = useCallback((session: UserSession) => {
    console.log('Yellow SDK authenticated:', session.walletAddress);
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      session,
      balance: session.balance,
      error: null
    }));
  }, []);

  const handleChannelCreated = useCallback((channel: PaymentChannel) => {
    console.log('Payment channel created:', channel.channelId);
    setState(prev => ({
      ...prev,
      paymentChannel: channel,
      balance: channel.balance
    }));
  }, []);

  const handleChannelUpdated = useCallback((channel: PaymentChannel) => {
    console.log('Payment channel updated:', channel.channelId);
    setState(prev => ({
      ...prev,
      paymentChannel: channel,
      balance: channel.balance
    }));
  }, []);

  const handleTransactionProcessed = useCallback((transaction: Transaction) => {
    console.log('Transaction processed:', transaction.id);
    setState(prev => ({
      ...prev,
      lastTransaction: transaction,
      balance: prev.session ? prev.session.balance : prev.balance
    }));
  }, []);

  const handleSubscriptionUpdated = useCallback((subscription: SubscriptionStatus) => {
    console.log('Subscription updated:', subscription);
    setState(prev => ({
      ...prev,
      session: prev.session ? {
        ...prev.session,
        subscriptionStatus: subscription
      } : null
    }));
  }, []);

  const handleError = useCallback((error: ErrorMessage) => {
    console.error('Yellow SDK error:', error);
    setState(prev => ({
      ...prev,
      error: error.payload.message,
      isConnecting: false
    }));
  }, []);

  // Setup event listeners
  useEffect(() => {
    yellowSDKService.on('connected', handleConnected);
    yellowSDKService.on('disconnected', handleDisconnected);
    yellowSDKService.on('authenticated', handleAuthenticated);
    yellowSDKService.on('channelCreated', handleChannelCreated);
    yellowSDKService.on('channelUpdated', handleChannelUpdated);
    yellowSDKService.on('transactionProcessed', handleTransactionProcessed);
    yellowSDKService.on('subscriptionUpdated', handleSubscriptionUpdated);
    yellowSDKService.on('error', handleError);

    // Initial state sync
    updateStateFromService();

    return () => {
      yellowSDKService.off('connected', handleConnected);
      yellowSDKService.off('disconnected', handleDisconnected);
      yellowSDKService.off('authenticated', handleAuthenticated);
      yellowSDKService.off('channelCreated', handleChannelCreated);
      yellowSDKService.off('channelUpdated', handleChannelUpdated);
      yellowSDKService.off('transactionProcessed', handleTransactionProcessed);
      yellowSDKService.off('subscriptionUpdated', handleSubscriptionUpdated);
      yellowSDKService.off('error', handleError);
    };
  }, [
    handleConnected,
    handleDisconnected,
    handleAuthenticated,
    handleChannelCreated,
    handleChannelUpdated,
    handleTransactionProcessed,
    handleSubscriptionUpdated,
    handleError,
    updateStateFromService
  ]);

  // Actions
  const connect = useCallback(async () => {
    if (state.isConnected || state.isConnecting) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      await yellowSDKService.initializeConnection();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect to Yellow SDK'
      }));
      throw error;
    }
  }, [state.isConnected, state.isConnecting]);

  const disconnect = useCallback(() => {
    yellowSDKService.disconnect();
  }, []);

  const authenticate = useCallback(async (walletAddress: string, signature: string) => {
    if (!state.isConnected) {
      throw new Error('Not connected to Yellow SDK');
    }

    try {
      const session = await yellowSDKService.authenticateUser(walletAddress, signature);
      return session;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Authentication failed'
      }));
      throw error;
    }
  }, [state.isConnected]);

  const createPaymentChannel = useCallback(async () => {
    if (!state.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      const channel = await yellowSDKService.createPaymentChannel();
      return channel;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to create payment channel'
      }));
      throw error;
    }
  }, [state.isAuthenticated]);

  const processTransaction = useCallback(async (
    amount: number, 
    contentId: string, 
    type: Transaction['type'] = 'payment'
  ) => {
    if (!state.paymentChannel) {
      throw new Error('No active payment channel');
    }

    try {
      const transaction = await yellowSDKService.processTransaction(amount, contentId, type);
      return transaction;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Transaction failed'
      }));
      throw error;
    }
  }, [state.paymentChannel]);

  const settleChannel = useCallback(async () => {
    if (!state.paymentChannel) {
      throw new Error('No active payment channel');
    }

    try {
      await yellowSDKService.settleChannel();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Channel settlement failed'
      }));
      throw error;
    }
  }, [state.paymentChannel]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    authenticate,
    createPaymentChannel,
    processTransaction,
    settleChannel,
    clearError
  };
};