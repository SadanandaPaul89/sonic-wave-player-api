// Mock Nitro Lite Service - Replacement for removed Yellow SDK
import { PaymentChannel } from '@/types/yellowSDK';

class MockNitroLiteService {
  private isConnected = false;
  private listeners: { [event: string]: Function[] } = {};
  private channels: Map<string, PaymentChannel> = new Map();

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

  // Mock connection
  async connect(): Promise<void> {
    console.log('Mock Nitro Lite: Connecting...');
    this.isConnected = true;
    this.emit('connected');
  }

  // Mock disconnect
  async disconnect(): Promise<void> {
    console.log('Mock Nitro Lite: Disconnecting...');
    this.isConnected = false;
    this.channels.clear();
    this.emit('disconnected');
  }

  // Check service connection
  isServiceConnected(): boolean {
    return this.isConnected;
  }

  // Mock create payment channel
  async createChannel(depositAmount: number): Promise<PaymentChannel> {
    console.log('Mock Nitro Lite: Creating payment channel with deposit:', depositAmount);
    
    const channel: PaymentChannel = {
      id: `nitro_channel_${Date.now()}`,
      balance: depositAmount,
      isActive: true,
      walletAddress: 'mock_wallet_address'
    };

    this.channels.set(channel.id, channel);
    this.emit('channelCreated', channel);
    return channel;
  }

  // Mock process payment
  async processPayment(
    channelId: string,
    amount: number,
    contentId?: string
  ): Promise<{ success: boolean; transactionId: string }> {
    console.log('Mock Nitro Lite: Processing payment:', { channelId, amount, contentId });
    
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error('Payment channel not found');
    }

    if (channel.balance < amount) {
      throw new Error('Insufficient channel balance');
    }

    // Update channel balance
    channel.balance -= amount;
    this.channels.set(channelId, channel);

    const transactionId = `nitro_tx_${Date.now()}`;
    
    this.emit('paymentProcessed', {
      channelId,
      amount,
      transactionId,
      remainingBalance: channel.balance
    });

    return {
      success: true,
      transactionId
    };
  }

  // Get channel info
  getChannel(channelId: string): PaymentChannel | undefined {
    return this.channels.get(channelId);
  }

  // Get all channels for a wallet
  getChannelsForWallet(walletAddress: string): PaymentChannel[] {
    return Array.from(this.channels.values()).filter(
      channel => channel.walletAddress === walletAddress
    );
  }

  // Mock close channel
  async closeChannel(channelId: string): Promise<void> {
    console.log('Mock Nitro Lite: Closing channel:', channelId);
    
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.isActive = false;
      this.channels.set(channelId, channel);
      this.emit('channelClosed', channel);
    }
  }
}

export const nitroLiteService = new MockNitroLiteService();