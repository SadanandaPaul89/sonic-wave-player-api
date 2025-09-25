// NFT Limit Service - Tracks and enforces NFT minting limits

import { userRoleService } from './userRoleService';
import { subscriptionService } from './subscriptionService';
import { 
  NFTMintingLimits, 
  MintingEligibility, 
  NFTMintingConfig, 
  MintingEvent 
} from '@/types/nftLimits';
import { UserRole } from '@/types/userRole';

class NFTLimitService {
  private limits: Map<string, NFTMintingLimits> = new Map();
  private config: NFTMintingConfig = {
    defaultLimits: {
      normal: 10, // 10 NFTs per week for normal users
      artist: -1  // Unlimited for artists
    },
    subscriptionLimits: {
      basic: 25,     // 25 NFTs per week
      premium: 50,   // 50 NFTs per week  
      vip: -1        // Unlimited for VIP
    },
    weekDuration: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  };

  constructor() {
    this.loadLimitsFromStorage();
    this.setupWeeklyReset();
  }

  // Check if user is eligible to mint NFTs
  async checkMintingEligibility(walletAddress: string): Promise<MintingEligibility> {
    if (!walletAddress) {
      return {
        canMint: false,
        remainingMints: 0,
        reason: 'No wallet address provided'
      };
    }

    try {
      // Get user role
      const userRole = await userRoleService.getUserRole(walletAddress);
      
      // Artists have unlimited minting
      if (userRole === 'artist') {
        return {
          canMint: true,
          remainingMints: -1 // Unlimited
        };
      }

      // Get or create limits for user
      const limits = await this.getUserLimits(walletAddress);
      
      // Check if user has unlimited access
      if (limits.isUnlimited) {
        return {
          canMint: true,
          remainingMints: -1 // Unlimited
        };
      }

      // Check weekly limit
      const remainingMints = limits.weeklyLimit - limits.currentWeekMints;
      
      if (remainingMints <= 0) {
        const resetDate = new Date(limits.weekStartDate.getTime() + this.config.weekDuration);
        
        return {
          canMint: false,
          remainingMints: 0,
          reason: 'Weekly minting limit reached',
          resetDate,
          upgradeOptions: this.getUpgradeOptions()
        };
      }

      return {
        canMint: true,
        remainingMints
      };

    } catch (error) {
      console.error('Error checking minting eligibility:', error);
      return {
        canMint: false,
        remainingMints: 0,
        reason: 'Error checking eligibility'
      };
    }
  }

  // Record an NFT mint
  async recordNFTMint(walletAddress: string, nftContract?: string, tokenId?: string, transactionHash?: string): Promise<void> {
    if (!walletAddress) {
      return;
    }

    try {
      const limits = await this.getUserLimits(walletAddress);
      
      // Don't track mints for unlimited users (artists, VIP)
      if (limits.isUnlimited) {
        console.log(`Mint recorded for unlimited user: ${walletAddress}`);
        return;
      }

      // Update mint count
      limits.currentWeekMints += 1;
      limits.totalMints += 1;
      limits.lastMintDate = new Date();

      // Store updated limits
      this.limits.set(walletAddress.toLowerCase(), limits);
      this.saveLimitsToStorage();

      // Record minting event
      const mintingEvent: MintingEvent = {
        walletAddress,
        timestamp: new Date(),
        nftContract,
        tokenId,
        transactionHash
      };
      
      this.recordMintingEvent(mintingEvent);

      console.log(`NFT mint recorded for ${walletAddress}: ${limits.currentWeekMints}/${limits.weeklyLimit} this week`);

    } catch (error) {
      console.error('Error recording NFT mint:', error);
    }
  }

  // Get remaining mints for a user
  async getRemainingMints(walletAddress: string): Promise<number> {
    if (!walletAddress) {
      return 0;
    }

    const eligibility = await this.checkMintingEligibility(walletAddress);
    return eligibility.remainingMints;
  }

  // Reset weekly limits (called automatically)
  resetWeeklyLimits(): void {
    const now = new Date();
    let resetCount = 0;

    for (const [address, limits] of this.limits.entries()) {
      const weekEnd = new Date(limits.weekStartDate.getTime() + this.config.weekDuration);
      
      if (now >= weekEnd) {
        limits.currentWeekMints = 0;
        limits.weekStartDate = now;
        resetCount++;
      }
    }

    if (resetCount > 0) {
      this.saveLimitsToStorage();
      console.log(`Reset weekly limits for ${resetCount} users`);
    }
  }

  // Upgrade user limits based on subscription
  async upgradeUserLimits(walletAddress: string, subscriptionTier: string): Promise<void> {
    if (!walletAddress) {
      return;
    }

    try {
      const limits = await this.getUserLimits(walletAddress);
      const newLimit = this.config.subscriptionLimits[subscriptionTier];

      if (newLimit !== undefined) {
        limits.subscriptionTier = subscriptionTier;
        limits.weeklyLimit = newLimit === -1 ? 999999 : newLimit; // Use large number for unlimited
        limits.isUnlimited = newLimit === -1;

        this.limits.set(walletAddress.toLowerCase(), limits);
        this.saveLimitsToStorage();

        console.log(`Upgraded limits for ${walletAddress} to ${subscriptionTier}: ${newLimit === -1 ? 'unlimited' : newLimit} per week`);
      }

    } catch (error) {
      console.error('Error upgrading user limits:', error);
    }
  }

  // Get user limits (create if doesn't exist)
  private async getUserLimits(walletAddress: string): Promise<NFTMintingLimits> {
    const existing = this.limits.get(walletAddress.toLowerCase());
    
    if (existing) {
      // Check if week has reset
      const now = new Date();
      const weekEnd = new Date(existing.weekStartDate.getTime() + this.config.weekDuration);
      
      if (now >= weekEnd) {
        existing.currentWeekMints = 0;
        existing.weekStartDate = now;
        this.limits.set(walletAddress.toLowerCase(), existing);
        this.saveLimitsToStorage();
      }
      
      return existing;
    }

    // Create new limits
    const userRole = await userRoleService.getUserRole(walletAddress);
    const subscription = subscriptionService.getCurrentSubscription(walletAddress);
    
    let weeklyLimit = this.config.defaultLimits[userRole];
    let isUnlimited = weeklyLimit === -1;
    let subscriptionTier: string | null = null;

    // Check subscription benefits
    if (subscription?.isActive && subscription.tier) {
      const subscriptionLimit = this.config.subscriptionLimits[subscription.tier];
      if (subscriptionLimit !== undefined) {
        weeklyLimit = subscriptionLimit;
        isUnlimited = subscriptionLimit === -1;
        subscriptionTier = subscription.tier;
      }
    }

    const newLimits: NFTMintingLimits = {
      walletAddress,
      weeklyLimit: isUnlimited ? 999999 : weeklyLimit,
      currentWeekMints: 0,
      weekStartDate: new Date(),
      subscriptionTier,
      lastMintDate: null,
      totalMints: 0,
      isUnlimited
    };

    this.limits.set(walletAddress.toLowerCase(), newLimits);
    this.saveLimitsToStorage();

    return newLimits;
  }

  // Get upgrade options for users who hit limits
  private getUpgradeOptions(): MintingEligibility['upgradeOptions'] {
    return [
      {
        tier: 'basic',
        weeklyLimit: this.config.subscriptionLimits.basic,
        price: 0.01 // ETH - should come from subscription service
      },
      {
        tier: 'premium', 
        weeklyLimit: this.config.subscriptionLimits.premium,
        price: 0.02 // ETH
      },
      {
        tier: 'vip',
        weeklyLimit: -1, // Unlimited
        price: 0.05 // ETH
      }
    ];
  }

  // Setup automatic weekly reset
  private setupWeeklyReset(): void {
    // Check for resets every hour
    setInterval(() => {
      this.resetWeeklyLimits();
    }, 60 * 60 * 1000); // 1 hour

    // Initial reset check
    this.resetWeeklyLimits();
  }

  // Storage management
  private loadLimitsFromStorage(): void {
    try {
      const stored = localStorage.getItem('nftMintingLimits');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Convert dates back from strings
        for (const [address, limits] of Object.entries(parsed)) {
          const typedLimits = limits as any;
          typedLimits.weekStartDate = new Date(typedLimits.weekStartDate);
          if (typedLimits.lastMintDate) {
            typedLimits.lastMintDate = new Date(typedLimits.lastMintDate);
          }
          this.limits.set(address, typedLimits);
        }
        
        console.log('Loaded NFT minting limits from storage');
      }
    } catch (error) {
      console.error('Error loading NFT limits:', error);
      this.limits.clear();
    }
  }

  private saveLimitsToStorage(): void {
    try {
      const toStore: { [address: string]: NFTMintingLimits } = {};
      
      for (const [address, limits] of this.limits.entries()) {
        toStore[address] = limits;
      }
      
      localStorage.setItem('nftMintingLimits', JSON.stringify(toStore));
    } catch (error) {
      console.error('Error saving NFT limits:', error);
    }
  }

  private recordMintingEvent(event: MintingEvent): void {
    try {
      const existing = localStorage.getItem('nftMintingEvents');
      const events: MintingEvent[] = existing ? JSON.parse(existing) : [];
      
      events.unshift(event);
      
      // Keep only last 1000 events
      if (events.length > 1000) {
        events.splice(1000);
      }
      
      localStorage.setItem('nftMintingEvents', JSON.stringify(events));
    } catch (error) {
      console.error('Error recording minting event:', error);
    }
  }

  // Public utility methods
  getUserLimitsSync(walletAddress: string): NFTMintingLimits | null {
    return this.limits.get(walletAddress.toLowerCase()) || null;
  }

  updateConfig(newConfig: Partial<NFTMintingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Updated NFT minting config:', this.config);
  }

  getConfig(): NFTMintingConfig {
    return { ...this.config };
  }

  // Get minting statistics
  getMintingStats(): {
    totalUsers: number;
    totalMints: number;
    averageMintsPerUser: number;
    usersAtLimit: number;
  } {
    const users = Array.from(this.limits.values());
    const totalUsers = users.length;
    const totalMints = users.reduce((sum, user) => sum + user.totalMints, 0);
    const usersAtLimit = users.filter(user => 
      !user.isUnlimited && user.currentWeekMints >= user.weeklyLimit
    ).length;

    return {
      totalUsers,
      totalMints,
      averageMintsPerUser: totalUsers > 0 ? totalMints / totalUsers : 0,
      usersAtLimit
    };
  }

  // Clear user limits (admin function)
  clearUserLimits(walletAddress: string): void {
    this.limits.delete(walletAddress.toLowerCase());
    this.saveLimitsToStorage();
  }

  // Clear all limits (admin function)
  clearAllLimits(): void {
    this.limits.clear();
    this.saveLimitsToStorage();
    localStorage.removeItem('nftMintingEvents');
  }
}

// Export singleton instance
export const nftLimitService = new NFTLimitService();
export default nftLimitService;