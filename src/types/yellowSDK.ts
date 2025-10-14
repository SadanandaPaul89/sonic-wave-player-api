// Mock Yellow SDK Types - Replacement for removed Yellow SDK
export interface AudioFileStructure {
  high_quality: {
    url: string;
    format: string;
    bitrate: number;
  };
  medium_quality: {
    url: string;
    format: string;
    bitrate: number;
  };
  low_quality: {
    url: string;
    format: string;
    bitrate: number;
  };
}

export interface AudioMetadata {
  title: string;
  artist: string;
  album?: string;
  duration: number;
  genre?: string;
  year?: number;
  artwork?: string;
}

export interface UserSession {
  walletAddress: string;
  sessionId: string;
  isAuthenticated: boolean;
  createdAt: Date;
  paymentChannel?: PaymentChannel | null;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  contentId?: string;
  timestamp: Date;
}

export interface PaymentChannel {
  id: string;
  balance: number;
  isActive: boolean;
  walletAddress: string;
}

export interface SubscriptionStatus {
  tier: string;
  isActive: boolean;
  expiresAt: Date;
  benefits: string[];
}

export interface SubscriptionBenefit {
  id: string;
  name: string;
  description: string;
  tier: string;
}

export interface ContentItem {
  id: string;
  title: string;
  artist: string;
  type: 'audio' | 'video' | 'image';
  accessTier: AccessTier;
  price?: number;
  metadata: AudioMetadata;
  audioFiles?: AudioFileStructure;
}

export interface AccessRight {
  contentId: string;
  accessLevel: 'free' | 'premium' | 'exclusive';
  expiresAt?: Date;
}

export interface AccessTier {
  level: 'free' | 'premium' | 'exclusive';
  price?: number;
  requirements?: string[];
}

export interface NFTHolding {
  tokenId: string;
  contractAddress: string;
  metadata: NFTMetadata;
}

export interface NFTBenefit {
  id: string;
  name: string;
  description: string;
  nftContract: string;
  benefitType: 'discount' | 'access' | 'exclusive_content';
  value: number;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}