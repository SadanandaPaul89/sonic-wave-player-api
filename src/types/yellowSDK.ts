// Yellow SDK TypeScript definitions

export interface YellowSDKConfig {
  websocketUrl: string;
  apiKey: string;
  network: 'mainnet' | 'testnet';
}

export interface PaymentChannel {
  channelId: string;
  userAddress: string;
  balance: number;
  lockedBalance: number;
  transactions: Transaction[];
  status: 'active' | 'settling' | 'closed';
  createdAt: Date;
  lastActivity: Date;
}

export interface Transaction {
  id: string;
  channelId: string;
  amount: number;
  contentId: string;
  timestamp: number;
  type: 'payment' | 'subscription' | 'nft_access' | 'refund';
  status: 'pending' | 'confirmed' | 'failed';
  metadata?: {
    contentTitle?: string;
    contentArtist?: string;
    accessDuration?: number;
    subscriptionTier?: string;
    txHash?: string;
    recipient?: string;
  };
}

export interface SubscriptionStatus {
  isActive: boolean;
  tier: 'basic' | 'premium' | 'vip';
  expiresAt: Date;
  autoRenew: boolean;
  paymentMethod: string;
  nextBillingDate?: Date;
  benefits: SubscriptionBenefit[];
}

export interface SubscriptionBenefit {
  type: 'unlimited_access' | 'exclusive_content' | 'early_access' | 'discount';
  value: string | number;
  description: string;
}

export interface NFTHolding {
  contractAddress: string;
  tokenId: string;
  metadata: NFTMetadata;
  benefits: NFTBenefit[];
  verifiedAt: Date;
}

export interface NFTBenefit {
  type: 'exclusive_access' | 'discount' | 'priority_access' | 'special_features';
  value: string | number;
  description: string;
  contentIds?: string[];
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface UserSession {
  walletAddress: string;
  chainId: number;
  subscriptionStatus: SubscriptionStatus | null;
  paymentChannel: PaymentChannel | null;
  nftHoldings: NFTHolding[];
  balance: number;
  accessRights: AccessRight[];
  sessionToken: string;
  expiresAt: Date;
}

export interface AccessRight {
  contentId: string;
  accessType: 'free' | 'paid' | 'subscription' | 'nft';
  expiresAt?: Date;
  grantedAt: Date;
  source: string; // subscription tier, NFT contract, payment transaction
}

export interface ContentItem {
  id: string;
  title: string;
  artist: string;
  accessTier: AccessTier;
  ipfsHash: string;
  metadata: AudioMetadata;
  pricing: ContentPricing;
  nftRequirements?: NFTRequirement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentPricing {
  payPerUse?: number;
  subscriptionTiers: string[];
  nftDiscount?: number;
  currency: 'ETH' | 'MATIC' | 'USD';
}

export interface NFTRequirement {
  contractAddress: string;
  tokenIds?: string[];
  minimumBalance?: number;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface AudioMetadata {
  title: string;
  artist: string;
  album?: string;
  duration: number;
  genre?: string;
  year?: number;
  ipfs_hashes: AudioFileStructure;
  artwork?: string;
  created_at: string;
  file_size: {
    original?: number;
    high_quality: number;
    streaming: number;
    mobile: number;
  };
  properties?: Record<string, unknown>;
}

export interface AudioFileStructure {
  original?: {
    uri: string;
    format: 'FLAC' | 'WAV';
    bitrate: 'lossless';
    size: number;
  };
  high_quality: {
    uri: string;
    format: 'MP3' | 'AAC';
    bitrate: '320kbps';
    size: number;
  };
  streaming: {
    uri: string;
    format: 'MP3' | 'AAC';
    bitrate: '192kbps';
    size: number;
  };
  mobile: {
    uri: string;
    format: 'MP3';
    bitrate: '128kbps';
    size: number;
  };
}

export type AccessTier = 'free' | 'pay_per_use' | 'nft_gated' | 'subscription' | 'premium';

export interface WebSocketMessage {
  type: 'auth' | 'channel_update' | 'transaction' | 'subscription_update' | 'error' | 'ping' | 'create_channel' | 'settle_channel';
  payload: unknown;
  timestamp: number;
  id: string;
}

export interface ChannelUpdateMessage {
  type: 'channel_update';
  payload: {
    channelId: string;
    balance: number;
    lockedBalance: number;
    lastTransaction: Transaction;
  };
}

export interface TransactionMessage {
  type: 'transaction';
  payload: {
    transaction: Transaction;
    newBalance: number;
  };
}

export interface AuthMessage {
  type: 'auth';
  payload: {
    walletAddress: string;
    signature: string;
    timestamp: number;
  };
}

export interface ErrorMessage {
  type: 'error';
  payload: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Yellow SDK Service Events
export interface YellowSDKEvents {
  connected: () => void;
  disconnected: () => void;
  authenticated: (session: UserSession) => void;
  channelCreated: (channel: PaymentChannel) => void;
  channelUpdated: (channel: PaymentChannel) => void;
  transactionProcessed: (transaction: Transaction) => void;
  subscriptionUpdated: (subscription: SubscriptionStatus) => void;
  error: (error: ErrorMessage) => void;
}

// Configuration for different environments
export const YELLOW_SDK_CONFIGS = {
  testnet: {
    websocketUrl: 'wss://nitrolite-testnet.yellow.org/ws',
    network: 'testnet' as const,
    chainIds: [11155111, 80001], // Sepolia, Mumbai
  },
  mainnet: {
    websocketUrl: 'wss://nitrolite.yellow.org/ws',
    network: 'mainnet' as const,
    chainIds: [1, 137], // Ethereum, Polygon
  }
} as const;