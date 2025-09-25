// Yellow SDK Service for Nitrolite WebSocket connection and payment channels

import {
  YellowSDKConfig,
  PaymentChannel,
  Transaction,
  UserSession,
  WebSocketMessage,
  YellowSDKEvents,
  AuthMessage,
  ChannelUpdateMessage,
  TransactionMessage,
  ErrorMessage
} from '@/types/yellowSDK';
import { YELLOW_SDK_CONFIG } from '@/config/environment';
import { nitroLiteService } from './nitroLiteService';
import { web3Service } from './web3Service';

type EventCallback<T = unknown> = (data: T) => void;

class YellowSDKService {
  private ws: WebSocket | null = null;
  private config: YellowSDKConfig;
  private isConnected: boolean = false;
  private isAuthenticated: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<keyof YellowSDKEvents, EventCallback[]> = new Map();
  private currentSession: UserSession | null = null;
  private messageQueue: WebSocketMessage[] = [];

  constructor(config?: Partial<YellowSDKConfig>) {
    this.config = {
      ...YELLOW_SDK_CONFIG,
      ...config
    };

    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    // Initialize event listener arrays
    const eventTypes: (keyof YellowSDKEvents)[] = [
      'connected', 'disconnected', 'authenticated', 'channelCreated',
      'channelUpdated', 'transactionProcessed', 'subscriptionUpdated', 'error'
    ];

    eventTypes.forEach(eventType => {
      this.eventListeners.set(eventType, []);
    });
  }

  // Event listener management
  on<K extends keyof YellowSDKEvents>(event: K, callback: YellowSDKEvents[K]) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback as EventCallback);
    this.eventListeners.set(event, listeners);
  }

  off<K extends keyof YellowSDKEvents>(event: K, callback: YellowSDKEvents[K]) {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback as EventCallback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  public emit<K extends keyof YellowSDKEvents>(event: K, data?: unknown) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} event listener:`, error);
      }
    });
  }

  // Initialize connection using Nitro Lite service
  async initializeConnection(): Promise<void> {
    if (this.isConnected) {
      console.log('Yellow SDK already connected');
      return;
    }

    try {
      console.log('Initializing Yellow SDK with Nitro Lite integration...');

      // Check if wallet is connected first
      if (!web3Service.isWalletConnected()) {
        throw new Error('Wallet must be connected before initializing Yellow SDK');
      }

      // Initialize Nitro Lite service
      await nitroLiteService.initialize();

      // Set up Nitro Lite event listeners
      nitroLiteService.on('connected', () => {
        this.isConnected = true;
        this.emit('connected');
      });

      nitroLiteService.on('disconnected', () => {
        this.isConnected = false;
        this.isAuthenticated = false;
        this.emit('disconnected');
      });

      nitroLiteService.on('channelCreated', (channel: any) => {
        this.handleNitroLiteChannelCreated(channel);
      });

      nitroLiteService.on('channelUpdated', (channel: any) => {
        this.handleNitroLiteChannelUpdated(channel);
      });

      nitroLiteService.on('transactionProcessed', (transaction: any) => {
        this.handleNitroLiteTransaction(transaction);
      });

      nitroLiteService.on('error', (error: any) => {
        this.handleError({
          type: 'error',
          payload: {
            code: 'NITROLITE_ERROR',
            message: error.message || 'Nitro Lite error',
            details: error
          },
          timestamp: Date.now(),
          id: `error_${Date.now()}`
        } as ErrorMessage);
      });

      console.log('Yellow SDK initialized with Nitro Lite successfully');

    } catch (error) {
      console.error('Failed to initialize Yellow SDK:', error);
      this.isConnected = false;
      this.isAuthenticated = false;
      throw error;
    }
  }

  private handleConnectionOpen(_event: Event) {
    console.log('Yellow SDK WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.processMessageQueue();
    this.emit('connected');
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.processMessage(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private processMessage(message: WebSocketMessage) {
    console.log('Received Yellow SDK message:', message.type);

    switch (message.type) {
      case 'auth':
        this.handleAuthMessage(message as AuthMessage);
        break;
      case 'channel_update':
        this.handleChannelUpdate(message as ChannelUpdateMessage);
        break;
      case 'transaction':
        this.handleTransaction(message as TransactionMessage);
        break;
      case 'subscription_update':
        this.handleSubscriptionUpdate(message);
        break;
      case 'error':
        this.handleError(message as ErrorMessage);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleAuthMessage(message: AuthMessage) {
    // Handle authentication response
    this.isAuthenticated = true;

    // Type guard for payload
    if (message.payload && typeof message.payload === 'object' && 'walletAddress' in message.payload) {
      const payload = message.payload as { walletAddress: string };
      console.log('Yellow SDK authenticated for:', payload.walletAddress);

      // Create or update user session
      this.currentSession = {
        walletAddress: payload.walletAddress,
        chainId: 1, // Will be updated from wallet
        subscriptionStatus: null,
        paymentChannel: null,
        nftHoldings: [],
        balance: 0,
        accessRights: [],
        sessionToken: `session_${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      this.emit('authenticated', this.currentSession);
    }
  }

  private handleChannelUpdate(message: ChannelUpdateMessage) {
    // Type guard for payload
    if (!message.payload || typeof message.payload !== 'object') return;

    const payload = message.payload as {
      channelId: string;
      balance: number;
      lockedBalance: number;
      lastTransaction?: any;
    };

    const { channelId, balance, lockedBalance, lastTransaction } = payload;

    if (this.currentSession) {
      // Update session balance
      this.currentSession.balance = balance;

      // Update or create payment channel
      if (!this.currentSession.paymentChannel || this.currentSession.paymentChannel.channelId !== channelId) {
        this.currentSession.paymentChannel = {
          channelId,
          userAddress: this.currentSession.walletAddress,
          balance,
          lockedBalance,
          transactions: lastTransaction ? [lastTransaction] : [],
          status: 'active',
          createdAt: new Date(),
          lastActivity: new Date()
        };
        this.emit('channelCreated', this.currentSession.paymentChannel);
      } else {
        this.currentSession.paymentChannel.balance = balance;
        this.currentSession.paymentChannel.lockedBalance = lockedBalance;
        this.currentSession.paymentChannel.lastActivity = new Date();
        if (lastTransaction) {
          this.currentSession.paymentChannel.transactions.unshift(lastTransaction);
        }
        this.emit('channelUpdated', this.currentSession.paymentChannel);
      }
    }
  }

  private handleTransaction(message: TransactionMessage) {
    // Type guard for payload
    if (!message.payload || typeof message.payload !== 'object') return;

    const payload = message.payload as {
      transaction: any;
      newBalance: number;
    };

    const { transaction, newBalance } = payload;

    if (this.currentSession) {
      this.currentSession.balance = newBalance;

      // Add access right if it's a content purchase
      if (transaction.type === 'payment' && transaction.contentId) {
        this.currentSession.accessRights.push({
          contentId: transaction.contentId,
          accessType: 'paid',
          grantedAt: new Date(),
          source: `transaction_${transaction.id}`
        });
      }
    }

    this.emit('transactionProcessed', transaction);
  }

  private handleSubscriptionUpdate(message: WebSocketMessage) {
    if (this.currentSession && message.payload && typeof message.payload === 'object' && 'subscription' in message.payload) {
      const payload = message.payload as { subscription: any };
      this.currentSession.subscriptionStatus = payload.subscription;
      this.emit('subscriptionUpdated', payload.subscription);
    }
  }

  private handleError(message: ErrorMessage) {
    console.error('Yellow SDK error:', message.payload);
    this.emit('error', message);
  }

  private handleConnectionClose(event: CloseEvent) {
    console.log('Yellow SDK WebSocket disconnected:', event.code, event.reason);
    this.isConnected = false;
    this.isAuthenticated = false;
    this.stopHeartbeat();
    this.emit('disconnected');

    // Attempt to reconnect if not a clean close
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  private handleConnectionError(event: Event) {
    console.error('Yellow SDK WebSocket error:', event);
    this.isConnected = false;
    this.emit('error', {
      type: 'error',
      payload: {
        code: 'CONNECTION_ERROR',
        message: 'WebSocket connection error',
        details: event
      },
      timestamp: Date.now(),
      id: `error_${Date.now()}`
    } as ErrorMessage);
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30 seconds

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.initializeConnection();
        console.log('Reconnection successful');
      } catch (error) {
        console.error(`Reconnection attempt ${this.reconnectAttempts} failed:`, error);

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          console.error('Max reconnection attempts reached. Giving up.');
          this.emit('error', {
            type: 'error',
            payload: {
              code: 'MAX_RECONNECT_ATTEMPTS',
              message: 'Failed to reconnect after maximum attempts'
            }
          } as ErrorMessage);
        }
      }
    }, delay);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.sendMessage({
          type: 'ping',
          payload: {},
          timestamp: Date.now(),
          id: `ping_${Date.now()}`
        });
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  private sendMessage(message: WebSocketMessage) {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for later
      this.messageQueue.push(message);
    }
  }

  // Nitro Lite event handlers
  private handleNitroLiteChannelCreated(nitroChannel: any) {
    const channel: PaymentChannel = {
      channelId: nitroChannel.channelId,
      userAddress: nitroChannel.userAddress,
      balance: nitroChannel.balance,
      lockedBalance: nitroChannel.lockedBalance || 0,
      transactions: [],
      status: 'active',
      createdAt: nitroChannel.createdAt,
      lastActivity: nitroChannel.lastActivity
    };

    if (this.currentSession) {
      this.currentSession.paymentChannel = channel;
      this.currentSession.balance = channel.balance;
    }

    this.emit('channelCreated', channel);
  }

  private handleNitroLiteChannelUpdated(nitroChannel: any) {
    const channel: PaymentChannel = {
      channelId: nitroChannel.channelId,
      userAddress: nitroChannel.userAddress,
      balance: nitroChannel.balance,
      lockedBalance: nitroChannel.lockedBalance || 0,
      transactions: [],
      status: nitroChannel.status === 'active' ? 'active' : 'settling',
      createdAt: nitroChannel.createdAt,
      lastActivity: nitroChannel.lastActivity
    };

    if (this.currentSession) {
      this.currentSession.paymentChannel = channel;
      this.currentSession.balance = channel.balance;
    }

    this.emit('channelUpdated', channel);
  }

  private handleNitroLiteTransaction(nitroTransaction: any) {
    const transaction: Transaction = {
      id: nitroTransaction.id,
      channelId: nitroTransaction.channelId,
      amount: nitroTransaction.amount,
      contentId: nitroTransaction.contentId,
      timestamp: nitroTransaction.timestamp,
      type: 'payment',
      status: nitroTransaction.status === 'confirmed' ? 'confirmed' : 'pending',
      metadata: {
        txHash: nitroTransaction.txHash,
        recipient: nitroTransaction.recipient
      }
    };

    // Update session balance
    if (this.currentSession) {
      this.currentSession.balance = nitroLiteService.getTotalBalance();
    }

    this.emit('transactionProcessed', transaction);
  }

  // Public API methods
  async authenticateUser(walletAddress: string, signature?: string): Promise<UserSession> {
    if (!this.isConnected) {
      throw new Error('Not connected to Yellow SDK');
    }

    // Validate wallet address
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    try {
      console.log('Authenticating user with Yellow SDK:', walletAddress);

      // Get the actual wallet balance for Yellow SDK
      const walletBalance = await this.getBalance();

      // For Nitro Lite integration, we create a session based on wallet connection
      // In production, this might involve additional signature verification
      this.currentSession = {
        walletAddress,
        chainId: web3Service.getCurrentChainId() || 1,
        subscriptionStatus: null,
        paymentChannel: null,
        nftHoldings: [],
        balance: walletBalance,
        accessRights: [],
        sessionToken: `session_${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      this.isAuthenticated = true;
      this.emit('authenticated', this.currentSession);

      console.log('User authenticated successfully');
      return this.currentSession;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  async createPaymentChannel(initialDeposit: number = 0.1): Promise<PaymentChannel> {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Creating payment channel via Nitro Lite...');

      // Create channel using Nitro Lite service
      const nitroChannel = await nitroLiteService.createChannel(initialDeposit);

      // Convert to Yellow SDK format
      const channel: PaymentChannel = {
        channelId: nitroChannel.channelId,
        userAddress: nitroChannel.userAddress,
        balance: nitroChannel.balance,
        lockedBalance: nitroChannel.lockedBalance,
        transactions: [],
        status: 'active',
        createdAt: nitroChannel.createdAt,
        lastActivity: nitroChannel.lastActivity
      };

      // Update session
      if (this.currentSession) {
        this.currentSession.paymentChannel = channel;
        this.currentSession.balance = channel.balance;
      }

      return channel;
    } catch (error) {
      console.error('Error creating payment channel:', error);
      throw error;
    }
  }

  async processTransaction(amount: number, contentId: string, type: Transaction['type'] = 'payment'): Promise<Transaction> {
    if (!this.isAuthenticated || !this.currentSession?.paymentChannel) {
      throw new Error('No active payment channel');
    }

    // Check if user has sufficient balance
    if (this.currentSession.balance < amount) {
      throw new Error(`Insufficient balance. Required: ${amount}, Available: ${this.currentSession.balance}`);
    }

    try {
      console.log(`Processing transaction via Nitro Lite: ${amount} ETH for content ${contentId}`);

      // Process payment through Nitro Lite
      const nitroTransaction = await nitroLiteService.processPayment(
        this.currentSession.paymentChannel.channelId,
        amount,
        'content_provider_address', // In production, this would be the actual recipient
        contentId
      );

      // Convert to Yellow SDK format
      const transaction: Transaction = {
        id: nitroTransaction.id,
        channelId: nitroTransaction.channelId,
        amount: nitroTransaction.amount,
        contentId: nitroTransaction.contentId,
        timestamp: nitroTransaction.timestamp,
        type,
        status: nitroTransaction.status === 'confirmed' ? 'confirmed' : 'pending',
        metadata: {
          txHash: nitroTransaction.txHash,
          recipient: nitroTransaction.recipient
        }
      };

      // Update session balance
      this.currentSession.balance = nitroLiteService.getTotalBalance();

      // Grant access if payment successful
      if (transaction.status === 'confirmed' && contentId) {
        this.currentSession.accessRights.push({
          contentId,
          accessType: 'paid',
          grantedAt: new Date(),
          source: `transaction_${transaction.id}`
        });
      }

      return transaction;
    } catch (error) {
      console.error('Error processing transaction:', error);
      throw error;
    }
  }

  async settleChannel(): Promise<void> {
    if (!this.currentSession?.paymentChannel) {
      throw new Error('No active payment channel');
    }

    try {
      console.log('Settling payment channel via Nitro Lite...');

      await nitroLiteService.settleChannel(this.currentSession.paymentChannel.channelId);

      // Update session
      if (this.currentSession.paymentChannel) {
        this.currentSession.paymentChannel.status = 'closed';
        this.currentSession.balance = 0;
      }

      console.log('Payment channel settled successfully');
    } catch (error) {
      console.error('Error settling channel:', error);
      throw error;
    }
  }

  // Getters
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getAuthenticationStatus(): boolean {
    return this.isAuthenticated;
  }

  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  async getBalance(): Promise<number> {
    // Return the actual wallet balance since Yellow SDK uses wallet funds for payments
    const walletAddress = web3Service.getCurrentAccount();
    if (!walletAddress) return 0;

    try {
      const balance = await web3Service.getBalance(walletAddress);
      return parseFloat(balance);
    } catch (error) {
      console.error('Error getting wallet balance for Yellow SDK:', error);
      return 0;
    }
  }

  // Synchronous version for backward compatibility
  getBalanceSync(): number {
    return this.currentSession?.balance || 0;
  }

  getSessionId(): string | null {
    return this.currentSession?.sessionToken || null;
  }

  // Manual retry connection
  async retryConnection(): Promise<void> {
    console.log('Manual connection retry requested');
    this.reconnectAttempts = 0; // Reset attempts
    this.disconnect();

    // Wait a moment before reconnecting
    await new Promise(resolve => setTimeout(resolve, 1000));

    return this.initializeConnection();
  }

  // Reset connection state
  resetConnectionState(): void {
    this.reconnectAttempts = 0;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.currentSession = null;
    this.messageQueue = [];
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      messageQueueLength: this.messageQueue.length,
      hasActiveSession: !!this.currentSession,
      hasPaymentChannel: !!this.currentSession?.paymentChannel
    };
  }

  // Clear session (for authentication recovery)
  clearSession(): void {
    this.isAuthenticated = false;
    this.currentSession = null;
    console.log('Yellow SDK session cleared');
  }

  // Cleanup
  disconnect(): void {
    nitroLiteService.disconnect();
    this.stopHeartbeat();
    this.isConnected = false;
    this.isAuthenticated = false;
    this.currentSession = null;
  }
}

// Export singleton instance
export const yellowSDKService = new YellowSDKService();
export default yellowSDKService;