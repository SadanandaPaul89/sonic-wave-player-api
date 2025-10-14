// Mock Yellow SDK Service - Replacement for removed Yellow SDK
import { UserSession, Transaction, PaymentChannel, SubscriptionStatus } from '@/types/yellowSDK';

class MockYellowSDKService {
  private session: UserSession | null = null;
  private listeners: { [event: string]: Function[] } = {};
  private isConnected = false;
  private isAuthenticated = false;
  private balance = 0;

  // Event emitter methods
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Mock initialization
  async initializeConnection(): Promise<void> {
    console.log('Mock Yellow SDK: Initializing connection...');
    this.isConnected = true;
    this.emit('connected');
  }

  // Mock authentication
  async authenticateUser(walletAddress: string): Promise<UserSession> {
    console.log('Mock Yellow SDK: Authenticating user:', walletAddress);
    
    this.session = {
      walletAddress,
      sessionId: `mock_session_${Date.now()}`,
      isAuthenticated: true,
      createdAt: new Date(),
      paymentChannel: null
    };
    
    this.isAuthenticated = true;
    this.emit('authenticated', this.session);
    return this.session;
  }

  // Mock transaction processing
  async processTransaction(
    amount: number,
    contentId: string,
    metadata?: any
  ): Promise<Transaction> {
    console.log('Mock Yellow SDK: Processing transaction:', { amount, contentId });
    
    const transaction: Transaction = {
      id: `mock_tx_${Date.now()}`,
      amount,
      currency: 'ETH',
      status: 'completed',
      contentId,
      timestamp: new Date()
    };

    // Simulate async processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.emit('transactionCompleted', transaction);
    return transaction;
  }

  // Get current session
  getCurrentSession(): UserSession | null {
    return this.session;
  }

  // Connection status
  isConnectionActive(): boolean {
    return this.isConnected;
  }

  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  // Additional methods expected by WalletContext
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getAuthenticationStatus(): boolean {
    return this.isAuthenticated;
  }

  async getBalance(): Promise<number> {
    return this.balance;
  }

  async createPaymentChannel(initialDeposit: number = 0.1): Promise<PaymentChannel> {
    console.log('Mock Yellow SDK: Creating payment channel with deposit:', initialDeposit);
    
    const channel: PaymentChannel = {
      id: `mock_channel_${Date.now()}`,
      balance: initialDeposit,
      isActive: true,
      walletAddress: this.session?.walletAddress || ''
    };

    this.balance = initialDeposit;
    this.emit('channelCreated', channel);
    return channel;
  }

  // Mock disconnect
  async disconnect(): Promise<void> {
    console.log('Mock Yellow SDK: Disconnecting...');
    this.isConnected = false;
    this.isAuthenticated = false;
    this.session = null;
    this.balance = 0;
    
    // Clear any cached data
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove = Object.keys(window.localStorage).filter(key => 
        key.includes('yellow') || key.includes('sdk') || key.includes('session')
      );
      keysToRemove.forEach(key => window.localStorage.removeItem(key));
    }
    
    this.emit('disconnected');
  }

  // Mock payment channel methods (legacy - kept for compatibility)
  async createPaymentChannelLegacy(walletAddress: string): Promise<PaymentChannel> {
    console.log('Mock Yellow SDK: Creating payment channel for:', walletAddress);
    
    const channel: PaymentChannel = {
      id: `mock_channel_${Date.now()}`,
      balance: 0,
      isActive: true,
      walletAddress
    };

    this.emit('channelCreated', channel);
    return channel;
  }

  async updatePaymentChannel(channelId: string, balance: number): Promise<PaymentChannel> {
    console.log('Mock Yellow SDK: Updating payment channel:', channelId, balance);
    
    const channel: PaymentChannel = {
      id: channelId,
      balance,
      isActive: true,
      walletAddress: this.session?.walletAddress || ''
    };

    this.emit('channelUpdated', channel);
    return channel;
  }
}

export const yellowSDKService = new MockYellowSDKService();