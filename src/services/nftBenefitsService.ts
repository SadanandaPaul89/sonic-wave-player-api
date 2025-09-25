// NFT Benefits Service for managing NFT-based perks and exclusive access

import { web3Service } from './web3Service';
import { yellowSDKService } from './yellowSDKService';
import { NFTHolding, NFTBenefit, NFTMetadata } from '@/types/yellowSDK';

export interface NFTCollection {
  contractAddress: string;
  name: string;
  symbol: string;
  description: string;
  totalSupply: number;
  floorPrice: number;
  currency: 'ETH' | 'MATIC';
  benefits: NFTCollectionBenefit[];
  verified: boolean;
  artistAddress?: string;
  royaltyPercentage?: number;
}

export interface NFTCollectionBenefit {
  type: 'exclusive_content' | 'discount' | 'early_access' | 'vip_access' | 'merchandise' | 'events';
  title: string;
  description: string;
  value: string | number;
  requirements?: {
    minimumTokens?: number;
    specificTokens?: string[];
    rarityLevel?: string;
    holdingPeriod?: number; // days
  };
  active: boolean;
  expiresAt?: Date;
}

export interface UserNFTProfile {
  userAddress: string;
  totalNFTs: number;
  collections: NFTHolding[];
  activeBenefits: NFTBenefit[];
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  totalValue: number; // in ETH
  joinedAt: Date;
  lastUpdated: Date;
}

export interface BenefitUsage {
  benefitId: string;
  userAddress: string;
  usedAt: Date;
  context: string; // what the benefit was used for
  value: number; // discount amount, etc.
}

class NFTBenefitsService {
  private supportedCollections: Map<string, NFTCollection> = new Map();
  private userProfiles: Map<string, UserNFTProfile> = new Map();
  private benefitUsageHistory: BenefitUsage[] = [];

  constructor() {
    this.initializeService();
  }

  private initializeService() {
    this.setupSupportedCollections();
    console.log('NFT Benefits service initialized');
  }

  private setupSupportedCollections() {
    const collections: NFTCollection[] = [
      {
        contractAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
        name: 'Sonic Wave Genesis',
        symbol: 'SWG',
        description: 'The original Sonic Wave music NFT collection',
        totalSupply: 100,
        floorPrice: 0.1,
        currency: 'ETH',
        verified: true,
        artistAddress: '0xartist1234567890123456789012345678901234567890',
        royaltyPercentage: 7.5,
        benefits: [
          {
            type: 'exclusive_content',
            title: 'Exclusive Tracks',
            description: 'Access to unreleased tracks and demos',
            value: 'unlimited',
            active: true
          },
          {
            type: 'discount',
            title: 'Marketplace Discount',
            description: 'Get 20% off all marketplace purchases',
            value: 20,
            active: true
          },
          {
            type: 'early_access',
            title: 'Early Release Access',
            description: 'Get new releases 48 hours before public',
            value: '48_hours',
            active: true
          },
          {
            type: 'vip_access',
            title: 'VIP Events',
            description: 'Exclusive access to virtual concerts and meet & greets',
            value: 'unlimited',
            requirements: {
              minimumTokens: 1
            },
            active: true
          }
        ]
      },
      {
        contractAddress: '0x1234567890123456789012345678901234567890',
        name: 'Artist Collective',
        symbol: 'ARTC',
        description: 'Multi-artist collaborative NFT collection',
        totalSupply: 500,
        floorPrice: 0.05,
        currency: 'ETH',
        verified: true,
        benefits: [
          {
            type: 'discount',
            title: 'Subscription Discount',
            description: 'Get 15% off premium subscriptions',
            value: 15,
            active: true
          },
          {
            type: 'exclusive_content',
            title: 'Collaborative Tracks',
            description: 'Access to exclusive collaborative releases',
            value: 'unlimited',
            active: true
          },
          {
            type: 'merchandise',
            title: 'Merch Discounts',
            description: 'Special pricing on artist merchandise',
            value: 25,
            active: true
          }
        ]
      },
      {
        contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        name: 'Platinum Records',
        symbol: 'PLAT',
        description: 'Ultra-rare platinum edition music NFTs',
        totalSupply: 50,
        floorPrice: 0.5,
        currency: 'ETH',
        verified: true,
        benefits: [
          {
            type: 'vip_access',
            title: 'Platinum VIP',
            description: 'Highest tier access to all platform features',
            value: 'unlimited',
            active: true
          },
          {
            type: 'exclusive_content',
            title: 'Master Recordings',
            description: 'Access to original master recordings and stems',
            value: 'unlimited',
            active: true
          },
          {
            type: 'events',
            title: 'Private Events',
            description: 'Invitation to exclusive private events and studios',
            value: 'unlimited',
            requirements: {
              minimumTokens: 1
            },
            active: true
          }
        ]
      }
    ];

    collections.forEach(collection => {
      this.supportedCollections.set(collection.contractAddress, collection);
    });
  }

  // Get supported NFT collections
  getSupportedCollections(): NFTCollection[] {
    return Array.from(this.supportedCollections.values());
  }

  // Get collection by contract address
  getCollection(contractAddress: string): NFTCollection | null {
    return this.supportedCollections.get(contractAddress) || null;
  }

  // Verify and load user's NFT holdings
  async loadUserNFTProfile(userAddress: string): Promise<UserNFTProfile> {
    try {
      console.log('Loading NFT profile for:', userAddress);

      const holdings: NFTHolding[] = [];
      let totalValue = 0;
      const activeBenefits: NFTBenefit[] = [];

      // Check holdings for each supported collection
      for (const collection of this.supportedCollections.values()) {
        const balance = await web3Service.checkNFTBalance(collection.contractAddress, userAddress);
        
        if (balance > 0) {
          // Get metadata for owned tokens (simplified - just get first few)
          const tokenIds = Array.from({ length: Math.min(balance, 5) }, (_, i) => (i + 1).toString());
          
          for (const tokenId of tokenIds) {
            const hasOwnership = await web3Service.checkNFTOwnership(
              collection.contractAddress, 
              tokenId, 
              userAddress
            );

            if (hasOwnership) {
              const metadata = await web3Service.getNFTMetadata(collection.contractAddress, tokenId);
              
              if (metadata) {
                const holding: NFTHolding = {
                  contractAddress: collection.contractAddress,
                  tokenId,
                  metadata,
                  benefits: this.calculateNFTBenefits(collection, metadata),
                  verifiedAt: new Date()
                };

                holdings.push(holding);
                totalValue += collection.floorPrice;

                // Add benefits to active benefits
                activeBenefits.push(...holding.benefits);
              }
            }
          }
        }
      }

      // Calculate user tier based on holdings
      const tier = this.calculateUserTier(holdings, totalValue);

      const profile: UserNFTProfile = {
        userAddress,
        totalNFTs: holdings.length,
        collections: holdings,
        activeBenefits,
        tier,
        totalValue,
        joinedAt: new Date(),
        lastUpdated: new Date()
      };

      // Cache the profile
      this.userProfiles.set(userAddress, profile);

      console.log('NFT profile loaded:', profile);
      return profile;
    } catch (error) {
      console.error('Error loading NFT profile:', error);
      throw error;
    }
  }

  private calculateNFTBenefits(collection: NFTCollection, metadata: NFTMetadata): NFTBenefit[] {
    const benefits: NFTBenefit[] = [];

    for (const collectionBenefit of collection.benefits) {
      if (!collectionBenefit.active) continue;

      // Check if user meets requirements
      if (collectionBenefit.requirements) {
        // For now, assume requirements are met if user owns the NFT
        // In production, you'd check specific requirements
      }

      const benefit: NFTBenefit = {
        type: collectionBenefit.type,
        value: collectionBenefit.value,
        description: collectionBenefit.description,
        contentIds: collectionBenefit.type === 'exclusive_content' ? ['exclusive_track_1', 'exclusive_track_2'] : undefined
      };

      benefits.push(benefit);
    }

    return benefits;
  }

  private calculateUserTier(holdings: NFTHolding[], totalValue: number): UserNFTProfile['tier'] {
    if (totalValue >= 2.0) return 'diamond';
    if (totalValue >= 1.0) return 'platinum';
    if (totalValue >= 0.5) return 'gold';
    if (totalValue >= 0.1) return 'silver';
    return 'bronze';
  }

  // Get user's NFT profile
  async getUserProfile(userAddress: string): Promise<UserNFTProfile | null> {
    // Check cache first
    const cached = this.userProfiles.get(userAddress);
    if (cached && Date.now() - cached.lastUpdated.getTime() < 5 * 60 * 1000) { // 5 minutes cache
      return cached;
    }

    // Load fresh profile
    try {
      return await this.loadUserNFTProfile(userAddress);
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Check if user has specific NFT benefit
  async hasBenefit(userAddress: string, benefitType: NFTBenefit['type']): Promise<boolean> {
    const profile = await this.getUserProfile(userAddress);
    if (!profile) return false;

    return profile.activeBenefits.some(benefit => benefit.type === benefitType);
  }

  // Get discount percentage for user
  async getDiscountPercentage(userAddress: string, context: 'marketplace' | 'subscription' | 'merchandise' = 'marketplace'): Promise<number> {
    const profile = await this.getUserProfile(userAddress);
    if (!profile) return 0;

    let maxDiscount = 0;

    for (const benefit of profile.activeBenefits) {
      if (benefit.type === 'discount' && typeof benefit.value === 'number') {
        // Apply context-specific logic
        if (context === 'marketplace' || context === 'subscription') {
          maxDiscount = Math.max(maxDiscount, benefit.value);
        }
      }
    }

    return maxDiscount;
  }

  // Apply NFT benefit (track usage)
  async applyBenefit(
    userAddress: string, 
    benefitType: NFTBenefit['type'], 
    context: string,
    value: number = 0
  ): Promise<boolean> {
    const hasBenefitAccess = await this.hasBenefit(userAddress, benefitType);
    if (!hasBenefitAccess) return false;

    // Record benefit usage
    const usage: BenefitUsage = {
      benefitId: `${benefitType}_${Date.now()}`,
      userAddress,
      usedAt: new Date(),
      context,
      value
    };

    this.benefitUsageHistory.push(usage);

    // Keep only last 1000 usage records
    if (this.benefitUsageHistory.length > 1000) {
      this.benefitUsageHistory = this.benefitUsageHistory.slice(-1000);
    }

    console.log('NFT benefit applied:', usage);
    return true;
  }

  // Get exclusive content IDs for user
  async getExclusiveContentIds(userAddress: string): Promise<string[]> {
    const profile = await this.getUserProfile(userAddress);
    if (!profile) return [];

    const contentIds: string[] = [];

    for (const benefit of profile.activeBenefits) {
      if (benefit.type === 'exclusive_content' && benefit.contentIds) {
        contentIds.push(...benefit.contentIds);
      }
    }

    return [...new Set(contentIds)]; // Remove duplicates
  }

  // Check early access eligibility
  async hasEarlyAccess(userAddress: string): Promise<{ hasAccess: boolean; hoursEarly: number }> {
    const profile = await this.getUserProfile(userAddress);
    if (!profile) return { hasAccess: false, hoursEarly: 0 };

    const earlyAccessBenefit = profile.activeBenefits.find(b => b.type === 'early_access');
    if (!earlyAccessBenefit) return { hasAccess: false, hoursEarly: 0 };

    const hoursEarly = earlyAccessBenefit.value === '48_hours' ? 48 : 
                      earlyAccessBenefit.value === '24_hours' ? 24 : 0;

    return { hasAccess: true, hoursEarly };
  }

  // Get benefit usage history
  getBenefitUsageHistory(userAddress: string, limit: number = 50): BenefitUsage[] {
    return this.benefitUsageHistory
      .filter(usage => usage.userAddress === userAddress)
      .sort((a, b) => b.usedAt.getTime() - a.usedAt.getTime())
      .slice(0, limit);
  }

  // Get user tier benefits
  getTierBenefits(tier: UserNFTProfile['tier']): string[] {
    const tierBenefits = {
      bronze: ['Basic NFT holder status'],
      silver: ['Basic NFT holder status', '5% marketplace discount'],
      gold: ['Basic NFT holder status', '10% marketplace discount', 'Early access to some releases'],
      platinum: ['Basic NFT holder status', '15% marketplace discount', 'Early access to releases', 'VIP support'],
      diamond: ['All benefits', '25% marketplace discount', '48h early access', 'VIP events', 'Exclusive content']
    };

    return tierBenefits[tier] || [];
  }

  // Refresh user profile (force reload)
  async refreshUserProfile(userAddress: string): Promise<UserNFTProfile | null> {
    this.userProfiles.delete(userAddress); // Clear cache
    return await this.loadUserNFTProfile(userAddress);
  }

  // Get collection statistics
  getCollectionStats(contractAddress: string): {
    totalHolders: number;
    averageHolding: number;
    benefitsUsed: number;
  } {
    const holders = Array.from(this.userProfiles.values())
      .filter(profile => profile.collections.some(h => h.contractAddress === contractAddress));

    const totalHoldings = holders.reduce((sum, holder) => 
      sum + holder.collections.filter(h => h.contractAddress === contractAddress).length, 0
    );

    const benefitsUsed = this.benefitUsageHistory.filter(usage => {
      const userProfile = this.userProfiles.get(usage.userAddress);
      return userProfile?.collections.some(h => h.contractAddress === contractAddress);
    }).length;

    return {
      totalHolders: holders.length,
      averageHolding: holders.length > 0 ? totalHoldings / holders.length : 0,
      benefitsUsed
    };
  }
}

export const nftBenefitsService = new NFTBenefitsService();
export default nftBenefitsService;