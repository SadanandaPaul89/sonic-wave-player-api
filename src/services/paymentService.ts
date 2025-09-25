// Payment Service for managing Yellow SDK payment channels and transactions

import { yellowSDKService } from './yellowSDKService';
import { web3Service } from './web3Service';
import { persistentMusicService, PersistentTrack } from './persistentMusicService';
import { 
  PaymentChannel, 
  Transaction, 
  UserSession,
  ContentItem,
  AccessTier 
} from '@/types/yellowSDK';

export interface PaymentOption {
  type: 'free' | 'pay_per_use' | 'subscription' | 'nft_access';
  price?: number;
  currency: 'ETH' | 'MATIC' | 'USD';
  description: string;
  available: boolean;
  reason?: string; // Why not available
}

export interface PaymentResult {
  success: boolean;
  transaction?: Transaction;
  accessGranted: boolean;
  error?: string;
}

class PaymentService {
  private activeChannels: Map<string, PaymentChannel> = new Map();
  private transactionHistory: Transaction[] = [];
  private balanceThreshold = 0.001; // Minimum balance for transactions

  constructor() {
    this.initializeService();
  }

  private initializeService() {
    // Listen for channel updates
    yellowSDKService.on('channelCreated', this.handleChannelCreated.bind(this));
    yellowSDKService.on('channelUpdated', this.handleChannelUpdated.bind(this));
    yellowSDKService.on('transactionProcessed', this.handleTransactionProcessed.bind(this));
  }

  private handleChannelCreated(channel: PaymentChannel) {
    this.activeChannels.set(channel.channelId, channel);
    console.log('Payment channel created and cached:', channel.channelId);
  }

  private handleChannelUpdated(channel: PaymentChannel) {
    this.activeChannels.set(channel.channelId, channel);
    console.log('Payment channel updated:', channel.channelId);
  }

  private handleTransactionProcessed(transaction: Transaction) {
    this.transactionHistory.unshift(transaction);
    // Keep only last 100 transactions
    if (this.transactionHistory.length > 100) {
      this.transactionHistory = this.transactionHistory.slice(0, 100);
    }
    console.log('Transaction processed and cached:', transaction.id);
  }

  // Get available payment options for content
  async getPaymentOptions(contentId: string, userAddress?: string): Promise<PaymentOption[]> {
    const options: PaymentOption[] = [];
    
    try {
      // Mock content data - in production this would come from your content service
      const content = await this.getContentDetails(contentId);
      
      if (!content) {
        return [{
          type: 'free',
          currency: 'ETH',
          description: 'Content not found',
          available: false,
          reason: 'Content not found'
        }];
      }

      // Free access
      if (content.accessTier === 'free') {
        options.push({
          type: 'free',
          currency: 'ETH',
          description: 'Free access',
          available: true
        });
      }

      // Pay-per-use
      if (content.pricing.payPerUse) {
        const hasBalance = await this.checkSufficientBalance(content.pricing.payPerUse);
        options.push({
          type: 'pay_per_use',
          price: content.pricing.payPerUse,
          currency: content.pricing.currency,
          description: `Pay ${content.pricing.payPerUse} ${content.pricing.currency} for single access`,
          available: hasBalance,
          reason: hasBalance ? undefined : 'Insufficient balance'
        });
      }

      // Subscription access
      if (content.pricing.subscriptionTiers.length > 0) {
        const hasSubscription = await this.checkSubscriptionAccess(content.pricing.subscriptionTiers);
        options.push({
          type: 'subscription',
          currency: content.pricing.currency,
          description: hasSubscription 
            ? 'Access included in your subscription' 
            : 'Requires active subscription',
          available: hasSubscription,
          reason: hasSubscription ? undefined : 'No active subscription'
        });
      }

      // NFT access
      if (content.nftRequirements && userAddress) {
        const hasNFT = await this.checkNFTAccess(content.nftRequirements, userAddress);
        options.push({
          type: 'nft_access',
          currency: content.pricing.currency,
          description: hasNFT 
            ? 'Access granted by NFT ownership' 
            : 'Requires specific NFT ownership',
          available: hasNFT,
          reason: hasNFT ? undefined : 'Required NFT not owned'
        });
      }

      return options;

    } catch (error) {
      console.error('Error getting payment options:', error);
      return [{
        type: 'free',
        currency: 'ETH',
        description: 'Error loading payment options',
        available: false,
        reason: error.message
      }];
    }
  }

  // Process payment for content access
  async processPayment(
    contentId: string, 
    paymentType: PaymentOption['type'],
    amount?: number
  ): Promise<PaymentResult> {
    try {
      // Check if user is authenticated
      if (!yellowSDKService.getAuthenticationStatus()) {
        throw new Error('User not authenticated');
      }

      const session = yellowSDKService.getCurrentSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Handle different payment types
      switch (paymentType) {
        case 'free':
          return {
            success: true,
            accessGranted: true
          };

        case 'pay_per_use':
          if (!amount) {
            throw new Error('Amount required for pay-per-use');
          }
          return await this.processPayPerUsePayment(contentId, amount);

        case 'subscription':
          return await this.processSubscriptionAccess(contentId);

        case 'nft_access':
          return await this.processNFTAccess(contentId, session.walletAddress);

        default:
          throw new Error(`Unsupported payment type: ${paymentType}`);
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        accessGranted: false,
        error: error.message
      };
    }
  }

  private async processPayPerUsePayment(contentId: string, amount: number): Promise<PaymentResult> {
    try {
      // Get recipient address (in production, this would be the content creator's address)
      const recipientAddress = await this.getContentRecipientAddress(contentId);

      // Send real transaction via MetaMask
      console.log(`Sending ${amount} ETH payment to ${recipientAddress} for content ${contentId}`);

      const txHash = await web3Service.sendTransaction(recipientAddress, amount.toString());

      // Create transaction record
      const transaction: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        channelId: 'direct_payment',
        amount,
        contentId,
        timestamp: Date.now(),
        type: 'payment',
        status: 'confirmed',
        metadata: {
          txHash,
          recipient: recipientAddress
        }
      };

      // Add to transaction history
      this.handleTransactionProcessed(transaction);

      // If payment successful, add to persistent library
      try {
        const content = await this.getContentDetails(contentId);
        if (content) {
          const persistentTrack: PersistentTrack = {
            id: contentId,
            title: content.title || 'Unknown Track',
            artist: content.artist || 'Unknown Artist',
          album: content.metadata.album || 'Unknown Album',
            artwork: content.metadata.artwork || '',
            duration: content.metadata.duration || 0,
            audioFiles: typeof content.metadata.ipfs_hashes === 'object' && !Array.isArray(content.metadata.ipfs_hashes)
              ? content.metadata.ipfs_hashes
              : {
                  high_quality: { uri: content.ipfsHash, format: 'MP3', bitrate: '320kbps', size: 5000000 },
                  streaming: { uri: content.ipfsHash, format: 'MP3', bitrate: '192kbps', size: 3000000 },
                  mobile: { uri: content.ipfsHash, format: 'MP3', bitrate: '128kbps', size: 1500000 }
                },
            accessType: 'purchased',
            purchaseDate: new Date(),
            transactionHash: txHash,
            metadata: {
              genre: content.metadata.genre || 'Unknown',
              year: content.metadata.year || new Date().getFullYear(),
              description: content.metadata.title || 'No description'
            }
          };

          await persistentMusicService.addTrackToLibrary(persistentTrack);
          console.log('Added purchased track to library:', persistentTrack.title);
        }
      } catch (error) {
        console.error('Error adding track to library:', error);
        // Don't fail the payment if library addition fails
      }

      return {
        success: true,
        transaction,
        accessGranted: true
      };

    } catch (error) {
      throw new Error(`Pay-per-use payment failed: ${error.message}`);
    }
  }

  private async processSubscriptionAccess(contentId: string): Promise<PaymentResult> {
    const session = yellowSDKService.getCurrentSession();
    
    if (!session?.subscriptionStatus?.isActive) {
      throw new Error('No active subscription');
    }

    // Create a transaction record for subscription access
    const transaction: Transaction = {
      id: `sub_${Date.now()}`,
      channelId: session.paymentChannel?.channelId || 'subscription',
      amount: 0,
      contentId,
      timestamp: Date.now(),
      type: 'subscription',
      status: 'confirmed',
      metadata: {
        subscriptionTier: session.subscriptionStatus.tier
      }
    };

    this.handleTransactionProcessed(transaction);

    return {
      success: true,
      transaction,
      accessGranted: true
    };
  }

  private async processNFTAccess(contentId: string, userAddress: string): Promise<PaymentResult> {
    try {
      const content = await this.getContentDetails(contentId);
      
      if (!content?.nftRequirements) {
        throw new Error('No NFT requirements defined for this content');
      }

      // Check NFT ownership
      const hasAccess = await this.checkNFTAccess(content.nftRequirements, userAddress);
      
      if (!hasAccess) {
        throw new Error('Required NFT not owned');
      }

      // Create a transaction record for NFT access
      const transaction: Transaction = {
        id: `nft_${Date.now()}`,
        channelId: 'nft_access',
        amount: 0,
        contentId,
        timestamp: Date.now(),
        type: 'nft_access',
        status: 'confirmed',
        metadata: {
          contentTitle: content.title,
          contentArtist: content.artist
        }
      };

      this.handleTransactionProcessed(transaction);

      return {
        success: true,
        transaction,
        accessGranted: true
      };

    } catch (error) {
      throw new Error(`NFT access verification failed: ${error.message}`);
    }
  }

  // Get or create payment channel
  async getOrCreatePaymentChannel(): Promise<PaymentChannel> {
    const session = yellowSDKService.getCurrentSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    // Return existing channel if available
    if (session.paymentChannel) {
      return session.paymentChannel;
    }

    // Create new channel
    console.log('Creating new payment channel...');
    const channel = await yellowSDKService.createPaymentChannel();
    
    return channel;
  }

  // Check if user has sufficient balance
  private async checkSufficientBalance(requiredAmount: number): Promise<boolean> {
    try {
      const balance = await web3Service.getBalance();
      const balanceNum = parseFloat(balance);
      return balanceNum >= requiredAmount + this.balanceThreshold;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }

  // Check subscription access
  private async checkSubscriptionAccess(requiredTiers: string[]): Promise<boolean> {
    const session = yellowSDKService.getCurrentSession();
    
    if (!session?.subscriptionStatus?.isActive) {
      return false;
    }

    return requiredTiers.includes(session.subscriptionStatus.tier);
  }

  // Check NFT access
  private async checkNFTAccess(nftRequirements: any[], userAddress: string): Promise<boolean> {
    try {
      for (const requirement of nftRequirements) {
        const hasNFT = await web3Service.checkNFTOwnership(
          requirement.contractAddress,
          requirement.tokenIds?.[0] || '1',
          userAddress
        );
        
        if (hasNFT) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking NFT access:', error);
      return false;
    }
  }

  // Get recipient address for content payments
  private async getContentRecipientAddress(contentId: string): Promise<string> {
    // In production, this would fetch the content creator's wallet address
    // For now, return a mock address
    const mockRecipients: { [key: string]: string } = {
      'track_1': '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
      'track_2': '0x1234567890123456789012345678901234567890',
      'default': '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4'
    };

    return mockRecipients[contentId] || mockRecipients.default;
  }

  // Mock content details - replace with real content service
  private async getContentDetails(contentId: string): Promise<ContentItem | null> {
    // Mock implementation
    return {
      id: contentId,
      title: 'Sample Track',
      artist: 'Sample Artist',
      accessTier: 'pay_per_use',
      ipfsHash: 'QmSampleHash',
      metadata: {
        title: 'Sample Track',
        artist: 'Sample Artist',
        album: 'Sample Album',
        duration: 180,
        genre: 'Electronic',
        year: 2024,
        ipfs_hashes: {
          high_quality: { uri: 'QmSampleHash', format: 'MP3', bitrate: '320kbps', size: 5000000 },
          streaming: { uri: 'QmSampleHash', format: 'MP3', bitrate: '192kbps', size: 3000000 },
          mobile: { uri: 'QmSampleHash', format: 'MP3', bitrate: '128kbps', size: 1500000 }
        },
        artwork: 'https://via.placeholder.com/300x300',
        created_at: new Date().toISOString(),
        file_size: {
          original: 5000000,
          high_quality: 5000000,
          streaming: 3000000,
          mobile: 1500000
        }
      },
      pricing: {
        payPerUse: 0.01,
        subscriptionTiers: ['basic', 'premium'],
        currency: 'ETH'
      },
      nftRequirements: [
        {
          contractAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
          tokenIds: ['1']
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Settle payment channel
  async settleChannel(channelId?: string): Promise<void> {
    try {
      await yellowSDKService.settleChannel();
      
      if (channelId) {
        this.activeChannels.delete(channelId);
      }
      
      console.log('Payment channel settled successfully');
    } catch (error) {
      console.error('Error settling channel:', error);
      throw error;
    }
  }

  // Get transaction history
  getTransactionHistory(): Transaction[] {
    return [...this.transactionHistory];
  }

  // Get active channels
  getActiveChannels(): PaymentChannel[] {
    return Array.from(this.activeChannels.values());
  }

  // Get current balance
  async getCurrentBalance(): Promise<number> {
    return await yellowSDKService.getBalance();
  }

  // Check if payment is required for content
  async isPaymentRequired(contentId: string, userAddress?: string): Promise<boolean> {
    const options = await this.getPaymentOptions(contentId, userAddress);
    const freeOption = options.find(opt => opt.type === 'free' && opt.available);
    const availableOptions = options.filter(opt => opt.available);
    
    return !freeOption && availableOptions.length === 0;
  }

  // Get recommended payment option
  async getRecommendedPaymentOption(contentId: string, userAddress?: string): Promise<PaymentOption | null> {
    const options = await this.getPaymentOptions(contentId, userAddress);
    const availableOptions = options.filter(opt => opt.available);
    
    if (availableOptions.length === 0) {
      return null;
    }

    // Priority: free > subscription > nft > pay-per-use
    const priority = ['free', 'subscription', 'nft_access', 'pay_per_use'];
    
    for (const type of priority) {
      const option = availableOptions.find(opt => opt.type === type);
      if (option) {
        return option;
      }
    }

    return availableOptions[0];
  }
}

export const paymentService = new PaymentService();
export default paymentService;