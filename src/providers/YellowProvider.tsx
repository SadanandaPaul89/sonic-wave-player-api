// Yellow SDK Provider - App-wide state management for Yellow SDK

import React, { createContext, useContext, useEffect, useState } from 'react';
import { yellowSDKService } from '@/services/yellowSDKService';
import { paymentService } from '@/services/paymentService';
import { subscriptionService } from '@/services/subscriptionService';
import { contentService } from '@/services/contentService';
import { nftBenefitsService } from '@/services/nftBenefitsService';
import { 
  UserSession, 
  PaymentChannel, 
  Transaction, 
  SubscriptionStatus,
  ErrorMessage 
} from '@/types/yellowSDK';
import { toast } from 'sonner';

interface YellowProviderState {
  isInitialized: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
  session: UserSession | null;
  balance: number;
  paymentChannel: PaymentChannel | null;
  subscriptionStatus: SubscriptionStatus | null;
  error: string | null;
  isLoading: boolean;
}

interface YellowProviderActions {
  initialize: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => void;
  authenticate: (walletAddress: string, signature: string) => Promise<UserSession>;
  clearError: () => void;
  retry: () => Promise<void>;
}

interface YellowProviderValue extends YellowProviderState, YellowProviderActions {}

const YellowContext = createContext<YellowProviderValue | null>(null);

interface YellowProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
  enableToasts?: boolean;
}

export const YellowProvider: React.FC<YellowProviderProps> = ({
  children,
  autoConnect = true,
  enableToasts = true
}) => {
  const [state, setState] = useState<YellowProviderState>({
    isInitialized: false,
    isConnected: false,
    isAuthenticated: false,
    session: null,
    balance: 0,
    paymentChannel: null,
    subscriptionStatus: null,
    error: null,
    isLoading: false
  });

  // Event handlers
  const handleConnected = () => {
    console.log('Yellow SDK connected');
    setState(prev => ({
      ...prev,
      isConnected: true,
      isLoading: false,
      error: null
    }));
    
    if (enableToasts) {
      toast.success('Connected to Yellow SDK');
    }
  };

  const handleDisconnected = () => {
    console.log('Yellow SDK disconnected');
    setState(prev => ({
      ...prev,
      isConnected: false,
      isAuthenticated: false,
      session: null,
      balance: 0,
      paymentChannel: null,
      subscriptionStatus: null,
      isLoading: false
    }));
    
    if (enableToasts) {
      toast.info('Disconnected from Yellow SDK');
    }
  };

  const handleAuthenticated = (session: UserSession) => {
    console.log('Yellow SDK authenticated:', session.walletAddress);
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      session,
      balance: session.balance,
      paymentChannel: session.paymentChannel || null,
      subscriptionStatus: session.subscriptionStatus || null,
      error: null
    }));
    
    if (enableToasts) {
      toast.success(`Authenticated as ${session.walletAddress.slice(0, 6)}...${session.walletAddress.slice(-4)}`);
    }
  };

  const handleChannelCreated = (channel: PaymentChannel) => {
    console.log('Payment channel created:', channel.channelId);
    setState(prev => ({
      ...prev,
      paymentChannel: channel,
      balance: channel.balance
    }));
    
    if (enableToasts) {
      toast.success('Payment channel created');
    }
  };

  const handleChannelUpdated = (channel: PaymentChannel) => {
    console.log('Payment channel updated:', channel.channelId);
    setState(prev => ({
      ...prev,
      paymentChannel: channel,
      balance: channel.balance
    }));
  };

  const handleTransactionProcessed = (transaction: Transaction) => {
    console.log('Transaction processed:', transaction.id);
    
    // Update balance from session
    const currentSession = yellowSDKService.getCurrentSession();
    if (currentSession) {
      setState(prev => ({
        ...prev,
        balance: currentSession.balance
      }));
    }
    
    if (enableToasts) {
      const amount = transaction.amount.toFixed(4);
      const type = transaction.type === 'payment' ? 'Payment' : 'Transaction';
      toast.success(`${type} of ${amount} ETH processed successfully`);
    }
  };

  const handleSubscriptionUpdated = (subscription: SubscriptionStatus) => {
    console.log('Subscription updated:', subscription);
    setState(prev => ({
      ...prev,
      subscriptionStatus: subscription,
      session: prev.session ? {
        ...prev.session,
        subscriptionStatus: subscription
      } : null
    }));
    
    if (enableToasts) {
      const status = subscription.isActive ? 'activated' : 'deactivated';
      toast.success(`Subscription ${status}`);
    }
  };

  const handleError = (error: ErrorMessage) => {
    console.error('Yellow SDK error:', error);
    setState(prev => ({
      ...prev,
      error: error.payload.message,
      isLoading: false
    }));
    
    if (enableToasts) {
      toast.error(`Yellow SDK Error: ${error.payload.message}`);
    }
  };

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
  }, [enableToasts]);

  // Initialize on mount
  useEffect(() => {
    if (autoConnect) {
      initialize();
    }
  }, [autoConnect]);

  // Actions
  const initialize = async () => {
    if (state.isInitialized) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Initialize all services
      console.log('Initializing Yellow SDK services...');
      
      // Services are already initialized in their constructors
      // Just mark as initialized
      setState(prev => ({ 
        ...prev, 
        isInitialized: true,
        isLoading: false 
      }));

      console.log('Yellow SDK services initialized successfully');
    } catch (error) {
      console.error('Error initializing Yellow SDK:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to initialize Yellow SDK',
        isLoading: false
      }));
      
      if (enableToasts) {
        toast.error('Failed to initialize Yellow SDK');
      }
    }
  };

  const connect = async () => {
    if (state.isConnected || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await yellowSDKService.initializeConnection();
    } catch (error) {
      console.error('Error connecting to Yellow SDK:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to connect to Yellow SDK',
        isLoading: false
      }));
      
      if (enableToasts) {
        toast.error('Failed to connect to Yellow SDK');
      }
      throw error;
    }
  };

  const disconnect = () => {
    yellowSDKService.disconnect();
  };

  const authenticate = async (walletAddress: string, signature: string) => {
    if (!state.isConnected) {
      throw new Error('Not connected to Yellow SDK');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const session = await yellowSDKService.authenticateUser(walletAddress, signature);
      return session;
    } catch (error) {
      console.error('Error authenticating user:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Authentication failed',
        isLoading: false
      }));
      
      if (enableToasts) {
        toast.error('Authentication failed');
      }
      throw error;
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const retry = async () => {
    if (state.isConnected) return;
    
    setState(prev => ({ ...prev, error: null }));
    await connect();
  };

  const value: YellowProviderValue = {
    ...state,
    initialize,
    connect,
    disconnect,
    authenticate,
    clearError,
    retry
  };

  return (
    <YellowContext.Provider value={value}>
      {children}
    </YellowContext.Provider>
  );
};

// Hook to use Yellow SDK context
export const useYellowProvider = (): YellowProviderValue => {
  const context = useContext(YellowContext);
  if (!context) {
    throw new Error('useYellowProvider must be used within a YellowProvider');
  }
  return context;
};

// Error boundary for Yellow SDK errors
interface YellowErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class YellowErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; retry: () => void }> },
  YellowErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): YellowErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Yellow SDK Error Boundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-figma-dark">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl">⚠️</span>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-white/60 text-sm mb-4">
              There was an error with the Yellow SDK integration.
            </p>
            <button
              onClick={this.retry}
              className="px-4 py-2 bg-figma-purple hover:bg-figma-purple/80 text-white rounded-figma-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default YellowProvider;