// NFT Minting Limits Types

export interface NFTMintingLimits {
  walletAddress: string;
  weeklyLimit: number;
  currentWeekMints: number;
  weekStartDate: Date;
  subscriptionTier: string | null;
  lastMintDate: Date | null;
  totalMints: number;
  isUnlimited: boolean; // For artists and VIP subscribers
}

export interface MintingEligibility {
  canMint: boolean;
  remainingMints: number;
  reason?: string;
  resetDate?: Date;
  upgradeOptions?: {
    tier: string;
    weeklyLimit: number;
    price: number;
  }[];
}

export interface NFTMintingConfig {
  // Default limits for different user types
  defaultLimits: {
    normal: number;
    artist: number; // -1 for unlimited
  };
  // Subscription tier limits
  subscriptionLimits: {
    [tier: string]: number; // -1 for unlimited
  };
  // Week duration in milliseconds
  weekDuration: number;
}

export interface MintingEvent {
  walletAddress: string;
  timestamp: Date;
  nftContract?: string;
  tokenId?: string;
  transactionHash?: string;
}