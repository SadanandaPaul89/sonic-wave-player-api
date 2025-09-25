// Content Service for managing content tiers and access control

import { subscriptionService } from './subscriptionService';
import { microtransactionService } from './microtransactionService';
import { web3Service } from './web3Service';
import {
  ContentItem,
  AccessTier,
  NFTRequirement,
  ContentPricing,
  AccessRight,
  AudioMetadata,
  AudioFileStructure
} from '@/types/yellowSDK';

// Extended metadata interface for content management
export interface ContentMetadata extends AudioMetadata {
  description?: string;
  tags?: string[];
  language?: string;
  explicit?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentTierDefinition {
  tier: AccessTier;
  name: string;
  description: string;
  color: string;
  icon: string;
  features: string[];
  restrictions?: string[];
}

export interface AccessValidationResult {
  hasAccess: boolean;
  accessMethod: 'free' | 'subscription' | 'nft' | 'payment' | 'none';
  reason?: string;
  requiredAction?: {
    type: 'subscribe' | 'purchase_nft' | 'pay' | 'connect_wallet';
    details: any;
  };
}

export interface ContentFilter {
  tier?: AccessTier[];
  genre?: string[];
  artist?: string[];
  year?: { min?: number; max?: number };
  duration?: { min?: number; max?: number };
  explicit?: boolean;
  hasAccess?: boolean;
  tags?: string[];
}

class ContentService {
  private contentCache: Map<string, ContentItem> = new Map();
  private tierDefinitions: ContentTierDefinition[] = [];
  private userAccessCache: Map<string, AccessRight[]> = new Map();

  constructor() {
    this.initializeService();
  }

  private initializeService() {
    this.setupContentTiers();
    this.loadMockContent();
    console.log('Content service initialized');
  }

  private setupContentTiers() {
    this.tierDefinitions = [
      {
        tier: 'free',
        name: 'Free',
        description: 'Open access content available to everyone',
        color: '#10B981', // green
        icon: '🆓',
        features: [
          'No payment required',
          'Basic audio quality',
          'Limited catalog',
          'Ad-supported'
        ]
      },
      {
        tier: 'pay_per_use',
        name: 'Pay-per-Use',
        description: 'Individual track purchases with microtransactions',
        color: '#3B82F6', // blue
        icon: '💰',
        features: [
          'One-time payment per track',
          'High-quality audio',
          'Instant access',
          'No subscription required'
        ]
      },
      {
        tier: 'subscription',
        name: 'Subscription',
        description: 'Premium content included in subscription plans',
        color: '#8B5CF6', // purple
        icon: '⭐',
        features: [
          'Unlimited access with subscription',
          'High-quality audio',
          'Exclusive content',
          'Ad-free experience'
        ]
      },
      {
        tier: 'nft_gated',
        name: 'NFT Exclusive',
        description: 'Exclusive content for NFT holders',
        color: '#F59E0B', // amber
        icon: '🎨',
        features: [
          'Exclusive to NFT holders',
          'Lossless audio quality',
          'Special editions',
          'Artist perks'
        ]
      },
      {
        tier: 'premium',
        name: 'Premium',
        description: 'Ultra-exclusive content with multiple access requirements',
        color: '#EF4444', // red
        icon: '💎',
        features: [
          'Multiple access methods',
          'Ultra-rare content',
          'Collector benefits',
          'VIP experiences'
        ]
      }
    ];
  }

  private loadMockContent() {
    // Mock content for demonstration
    const createMockAudioFileStructure = (hash: string): AudioFileStructure => ({
      high_quality: {
        uri: `ipfs://${hash}`,
        format: 'MP3',
        bitrate: '320kbps',
        size: 9600000
      },
      streaming: {
        uri: `ipfs://${hash}`,
        format: 'MP3',
        bitrate: '192kbps',
        size: 5760000
      },
      mobile: {
        uri: `ipfs://${hash}`,
        format: 'MP3',
        bitrate: '128kbps',
        size: 3840000
      }
    });

    const mockContent: ContentItem[] = [
      {
        id: 'track_001',
        title: 'Cosmic Dreams',
        artist: 'Digital Artist',
        accessTier: 'free',
        ipfsHash: 'QmYourMusicHashHere',
        metadata: {
          title: 'Cosmic Dreams',
          artist: 'Digital Artist',
          genre: 'Electronic',
          duration: 225, // 3:45
          year: 2024,
          ipfs_hashes: createMockAudioFileStructure('QmYourMusicHashHere'),
          created_at: new Date('2024-01-15').toISOString(),
          file_size: {
            high_quality: 9600000,
            streaming: 5760000,
            mobile: 3840000
          },
          properties: {
            description: 'A journey through digital soundscapes',
            tags: ['electronic', 'ambient', 'space']
          }
        },
        pricing: {
          subscriptionTiers: [],
          currency: 'ETH'
        },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 'track_002',
        title: 'Neon Nights',
        artist: 'Synth Master',
        accessTier: 'pay_per_use',
        ipfsHash: 'QmAnotherMusicHash',
        metadata: {
          title: 'Neon Nights',
          artist: 'Synth Master',
          genre: 'Synthwave',
          duration: 198, // 3:18
          year: 2024,
          ipfs_hashes: createMockAudioFileStructure('QmAnotherMusicHash'),
          created_at: new Date('2024-02-01').toISOString(),
          file_size: {
            high_quality: 8400000,
            streaming: 5040000,
            mobile: 3360000
          },
          properties: {
            description: 'Retro-futuristic synthwave vibes',
            tags: ['synthwave', 'retro', 'neon']
          }
        },
        pricing: {
          payPerUse: 0.005, // 0.005 ETH
          subscriptionTiers: ['premium', 'vip'],
          currency: 'ETH'
        },
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01')
      },
      {
        id: 'track_003',
        title: 'Exclusive Beat',
        artist: 'NFT Creator',
        accessTier: 'nft_gated',
        ipfsHash: 'QmNFTExclusiveHash',
        metadata: {
          title: 'Exclusive Beat',
          artist: 'NFT Creator',
          genre: 'Hip Hop',
          duration: 180, // 3:00
          year: 2024,
          ipfs_hashes: createMockAudioFileStructure('QmNFTExclusiveHash'),
          created_at: new Date('2024-03-01').toISOString(),
          file_size: {
            high_quality: 7200000,
            streaming: 4320000,
            mobile: 2880000
          },
          properties: {
            description: 'Exclusive track for NFT holders only',
            tags: ['hip-hop', 'exclusive', 'nft']
          }
        },
        pricing: {
          subscriptionTiers: ['vip'],
          nftDiscount: 100, // 100% discount for NFT holders
          currency: 'ETH'
        },
        nftRequirements: [
          {
            contractAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
            tokenIds: ['1', '2', '3'],
            minimumBalance: 1
          }
        ],
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01')
      }
    ];

    // Cache mock content
    mockContent.forEach(content => {
      this.contentCache.set(content.id, content);
    });
  }

  // Get content tier definitions
  getContentTiers(): ContentTierDefinition[] {
    return [...this.tierDefinitions];
  }

  // Get tier definition by tier
  getTierDefinition(tier: AccessTier): ContentTierDefinition | null {
    return this.tierDefinitions.find(t => t.tier === tier) || null;
  }

  // Get content by ID
  async getContent(contentId: string): Promise<ContentItem | null> {
    // Check cache first
    const cached = this.contentCache.get(contentId);
    if (cached) {
      return cached;
    }

    // In production, this would fetch from your content database/API
    // For now, return null if not in cache
    return null;
  }

  // Get multiple content items
  async getContentList(contentIds: string[]): Promise<ContentItem[]> {
    const content: ContentItem[] = [];

    for (const id of contentIds) {
      const item = await this.getContent(id);
      if (item) {
        content.push(item);
      }
    }

    return content;
  }

  // Search and filter content
  async searchContent(
    query?: string,
    filter?: ContentFilter,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ content: ContentItem[]; total: number }> {
    let allContent = Array.from(this.contentCache.values());

    // Apply text search
    if (query) {
      const searchTerm = query.toLowerCase();
      allContent = allContent.filter(item =>
        item.title.toLowerCase().includes(searchTerm) ||
        item.artist.toLowerCase().includes(searchTerm) ||
        item.metadata.genre?.toLowerCase().includes(searchTerm) ||
        (item.metadata.properties?.tags as string[])?.some((tag: string) => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply filters
    if (filter) {
      if (filter.tier && filter.tier.length > 0) {
        allContent = allContent.filter(item => filter.tier!.includes(item.accessTier));
      }

      if (filter.genre && filter.genre.length > 0) {
        allContent = allContent.filter(item =>
          item.metadata.genre && filter.genre!.includes(item.metadata.genre)
        );
      }

      if (filter.artist && filter.artist.length > 0) {
        allContent = allContent.filter(item => filter.artist!.includes(item.artist));
      }

      if (filter.year) {
        allContent = allContent.filter(item => {
          const year = item.metadata.year;
          if (!year) return false;
          if (filter.year!.min && year < filter.year!.min) return false;
          if (filter.year!.max && year > filter.year!.max) return false;
          return true;
        });
      }

      if (filter.duration) {
        allContent = allContent.filter(item => {
          const duration = item.metadata.duration;
          if (filter.duration!.min && duration < filter.duration!.min) return false;
          if (filter.duration!.max && duration > filter.duration!.max) return false;
          return true;
        });
      }

      if (filter.explicit !== undefined) {
        allContent = allContent.filter(item =>
          (item.metadata.properties?.explicit || false) === filter.explicit
        );
      }

      if (filter.tags && filter.tags.length > 0) {
        allContent = allContent.filter(item =>
          filter.tags!.some(tag => (item.metadata.properties?.tags as string[])?.includes(tag))
        );
      }
    }

    // Apply access filter if requested
    if (filter?.hasAccess !== undefined) {
      const userAddress = web3Service.getCurrentAccount();
      const filteredContent: ContentItem[] = [];

      for (const item of allContent) {
        const access = await this.validateAccess(item.id, userAddress);
        if (access.hasAccess === filter.hasAccess) {
          filteredContent.push(item);
        }
      }

      allContent = filteredContent;
    }

    const total = allContent.length;
    const paginatedContent = allContent.slice(offset, offset + limit);

    return { content: paginatedContent, total };
  }

  // Validate user access to content
  async validateAccess(contentId: string, userAddress?: string): Promise<AccessValidationResult> {
    const content = await this.getContent(contentId);
    if (!content) {
      return {
        hasAccess: false,
        accessMethod: 'none',
        reason: 'Content not found'
      };
    }

    const currentUser = userAddress || web3Service.getCurrentAccount();

    // Check different access methods based on content tier
    switch (content.accessTier) {
      case 'free':
        return {
          hasAccess: true,
          accessMethod: 'free'
        };

      case 'pay_per_use':
        return await this.validatePayPerUseAccess(content, currentUser);

      case 'subscription':
        return await this.validateSubscriptionAccess(content, currentUser);

      case 'nft_gated':
        return await this.validateNFTAccess(content, currentUser);

      case 'premium':
        return await this.validatePremiumAccess(content, currentUser);

      default:
        return {
          hasAccess: false,
          accessMethod: 'none',
          reason: 'Unknown access tier'
        };
    }
  }

  private async validatePayPerUseAccess(content: ContentItem, userAddress?: string): Promise<AccessValidationResult> {
    if (!userAddress) {
      return {
        hasAccess: false,
        accessMethod: 'none',
        reason: 'Wallet not connected',
        requiredAction: {
          type: 'connect_wallet',
          details: {}
        }
      };
    }

    // Check if user has already purchased this content
    const hasPurchased = microtransactionService.hasContentAccess(content.id, userAddress);
    if (hasPurchased) {
      return {
        hasAccess: true,
        accessMethod: 'payment'
      };
    }

    // Check if user has subscription that includes this content
    if (content.pricing.subscriptionTiers.length > 0) {
      const hasSubscription = subscriptionService.hasAccessToTier(
        content.pricing.subscriptionTiers[0],
        userAddress
      );
      if (hasSubscription) {
        return {
          hasAccess: true,
          accessMethod: 'subscription'
        };
      }
    }

    // Require payment
    return {
      hasAccess: false,
      accessMethod: 'none',
      reason: `Payment required: ${content.pricing.payPerUse} ${content.pricing.currency}`,
      requiredAction: {
        type: 'pay',
        details: {
          amount: content.pricing.payPerUse,
          currency: content.pricing.currency,
          contentId: content.id
        }
      }
    };
  }

  private async validateSubscriptionAccess(content: ContentItem, userAddress?: string): Promise<AccessValidationResult> {
    if (!userAddress) {
      return {
        hasAccess: false,
        accessMethod: 'none',
        reason: 'Wallet not connected',
        requiredAction: {
          type: 'connect_wallet',
          details: {}
        }
      };
    }

    // Check subscription access
    for (const tier of content.pricing.subscriptionTiers) {
      const hasAccess = subscriptionService.hasAccessToTier(tier, userAddress);
      if (hasAccess) {
        return {
          hasAccess: true,
          accessMethod: 'subscription'
        };
      }
    }

    // Require subscription
    const recommendedTier = subscriptionService.getRecommendedTier(userAddress);
    return {
      hasAccess: false,
      accessMethod: 'none',
      reason: 'Active subscription required',
      requiredAction: {
        type: 'subscribe',
        details: {
          recommendedTier: recommendedTier.id,
          availableTiers: content.pricing.subscriptionTiers
        }
      }
    };
  }

  private async validateNFTAccess(content: ContentItem, userAddress?: string): Promise<AccessValidationResult> {
    if (!userAddress) {
      return {
        hasAccess: false,
        accessMethod: 'none',
        reason: 'Wallet not connected',
        requiredAction: {
          type: 'connect_wallet',
          details: {}
        }
      };
    }

    if (!content.nftRequirements || content.nftRequirements.length === 0) {
      return {
        hasAccess: false,
        accessMethod: 'none',
        reason: 'No NFT requirements defined'
      };
    }

    // Check NFT ownership
    for (const requirement of content.nftRequirements) {
      const hasNFT = await web3Service.checkNFTOwnership(
        requirement.contractAddress,
        requirement.tokenIds?.[0] || '1',
        userAddress
      );

      if (hasNFT) {
        return {
          hasAccess: true,
          accessMethod: 'nft'
        };
      }
    }

    // Check if user has VIP subscription as fallback
    if (content.pricing.subscriptionTiers.includes('vip')) {
      const hasVIP = subscriptionService.hasAccessToTier('vip', userAddress);
      if (hasVIP) {
        return {
          hasAccess: true,
          accessMethod: 'subscription'
        };
      }
    }

    return {
      hasAccess: false,
      accessMethod: 'none',
      reason: 'Required NFT not owned',
      requiredAction: {
        type: 'purchase_nft',
        details: {
          requirements: content.nftRequirements
        }
      }
    };
  }

  private async validatePremiumAccess(content: ContentItem, userAddress?: string): Promise<AccessValidationResult> {
    if (!userAddress) {
      return {
        hasAccess: false,
        accessMethod: 'none',
        reason: 'Wallet not connected',
        requiredAction: {
          type: 'connect_wallet',
          details: {}
        }
      };
    }

    // Premium content can be accessed through multiple methods
    // Try NFT access first
    if (content.nftRequirements) {
      const nftAccess = await this.validateNFTAccess(content, userAddress);
      if (nftAccess.hasAccess) {
        return nftAccess;
      }
    }

    // Try subscription access
    if (content.pricing.subscriptionTiers.length > 0) {
      const subAccess = await this.validateSubscriptionAccess(content, userAddress);
      if (subAccess.hasAccess) {
        return subAccess;
      }
    }

    // Try pay-per-use as last resort
    if (content.pricing.payPerUse) {
      return await this.validatePayPerUseAccess(content, userAddress);
    }

    return {
      hasAccess: false,
      accessMethod: 'none',
      reason: 'Premium access required through NFT, subscription, or payment'
    };
  }

  // Grant access to content (for testing/admin purposes)
  async grantAccess(contentId: string, userAddress: string, method: 'payment' | 'subscription' | 'nft' | 'admin'): Promise<void> {
    const accessRight: AccessRight = {
      contentId,
      accessType: method === 'admin' ? 'free' : method === 'payment' ? 'paid' : method,
      grantedAt: new Date(),
      source: `${method}_grant`
    };

    const userAccess = this.userAccessCache.get(userAddress) || [];
    userAccess.push(accessRight);
    this.userAccessCache.set(userAddress, userAccess);

    console.log(`Access granted to ${userAddress} for content ${contentId} via ${method}`);
  }

  // Get user's access rights
  getUserAccessRights(userAddress?: string): AccessRight[] {
    const currentUser = userAddress || web3Service.getCurrentAccount();
    if (!currentUser) return [];

    return this.userAccessCache.get(currentUser) || [];
  }

  // Get content recommendations based on user preferences
  async getRecommendations(userAddress?: string, limit: number = 10): Promise<ContentItem[]> {
    // Simple recommendation based on user's access history
    const userAccess = this.getUserAccessRights(userAddress);
    const accessedContent = userAccess.map(access => access.contentId);

    // Get all content and filter out already accessed
    const { content: allContent } = await this.searchContent();
    const unaccessed = allContent.filter(item => !accessedContent.includes(item.id));

    // Simple recommendation: return random unaccessed content
    const shuffled = unaccessed.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  }

  // Get content analytics
  getContentAnalytics(_contentId: string): {
    totalAccess: number;
    accessMethods: { [key: string]: number };
    revenue: number;
  } {
    // Mock analytics - in production this would come from your analytics service
    // contentId would be used to get specific analytics for that content
    return {
      totalAccess: Math.floor(Math.random() * 1000),
      accessMethods: {
        free: Math.floor(Math.random() * 100),
        payment: Math.floor(Math.random() * 50),
        subscription: Math.floor(Math.random() * 200),
        nft: Math.floor(Math.random() * 25)
      },
      revenue: Math.random() * 10 // ETH
    };
  }

  // Add new content (for content creators)
  async addContent(
    id: string,
    title: string,
    artist: string,
    metadata: AudioMetadata,
    accessTier: AccessTier,
    pricing: ContentPricing,
    ipfsHash: string,
    nftRequirements?: NFTRequirement[]
  ): Promise<ContentItem> {
    const content: ContentItem = {
      id,
      title,
      artist,
      accessTier,
      ipfsHash,
      metadata,
      pricing,
      nftRequirements,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.contentCache.set(content.id, content);
    console.log('Content added:', content.id);

    return content;
  }

  // Update content
  async updateContent(contentId: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    const existing = this.contentCache.get(contentId);
    if (!existing) return null;

    const updated: ContentItem = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    this.contentCache.set(contentId, updated);
    console.log('Content updated:', contentId);

    return updated;
  }

  // Delete content
  async deleteContent(contentId: string): Promise<boolean> {
    const deleted = this.contentCache.delete(contentId);
    if (deleted) {
      console.log('Content deleted:', contentId);
    }
    return deleted;
  }
}

export const contentService = new ContentService();
export default contentService;