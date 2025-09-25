// Subscription Service for managing user subscriptions

import { yellowSDKService } from './yellowSDKService';
import { SubscriptionStatus, SubscriptionBenefit } from '@/types/yellowSDK';

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'ETH' | 'MATIC' | 'USD';
  duration: number; // in days
  benefits: SubscriptionBenefit[];
  features: string[];
  popular?: boolean;
  maxConcurrentStreams?: number;
  downloadLimit?: number;
  exclusiveContent?: boolean;
  earlyAccess?: boolean;
  adFree?: boolean;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  billing: 'monthly' | 'yearly';
  discount?: number; // percentage discount for yearly
}

export interface SubscriptionTransaction {
  id: string;
  userId: string;
  tierId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  createdAt: Date;
  expiresAt: Date;
  autoRenew: boolean;
  paymentMethod: 'crypto' | 'card';
  transactionHash?: string;
}

class SubscriptionService {
  private availableTiers: SubscriptionTier[] = [];
  private userSubscriptions: Map<string, SubscriptionStatus> = new Map();

  constructor() {
    this.initializeService();
  }

  private initializeService() {
    this.setupDefaultTiers();
    
    // Listen for subscription updates from Yellow SDK
    yellowSDKService.on('subscriptionUpdated', this.handleSubscriptionUpdate.bind(this));
  }

  private setupDefaultTiers() {
    this.availableTiers = [
      {
        id: 'basic',
        name: 'Basic',
        description: 'Essential music streaming',
        price: 0.01, // 0.01 ETH per month
        currency: 'ETH',
        duration: 30,
        benefits: [
          {
            type: 'unlimited_access',
            value: 'basic_catalog',
            description: 'Access to basic music catalog'
          }
        ],
        features: [
          'Unlimited streaming from basic catalog',
          'Standard audio quality (192kbps)',
          'Mobile and web access',
          'Basic playlist features'
        ],
        maxConcurrentStreams: 1,
        adFree: false
      },
      {
        id: 'premium',
        name: 'Premium',
        description: 'Enhanced music experience',
        price: 0.02, // 0.02 ETH per month
        currency: 'ETH',
        duration: 30,
        benefits: [
          {
            type: 'unlimited_access',
            value: 'full_catalog',
            description: 'Access to full music catalog'
          },
          {
            type: 'exclusive_content',
            value: 'premium_tracks',
            description: 'Access to premium exclusive tracks'
          },
          {
            type: 'discount',
            value: 10,
            description: '10% discount on NFT purchases'
          }
        ],
        features: [
          'Unlimited streaming from full catalog',
          'High-quality audio (320kbps)',
          'Exclusive premium content',
          'Ad-free experience',
          'Offline downloads (up to 1000 tracks)',
          'Advanced playlist features',
          '10% discount on NFT purchases'
        ],
        maxConcurrentStreams: 3,
        downloadLimit: 1000,
        exclusiveContent: true,
        adFree: true,
        popular: true
      },
      {
        id: 'vip',
        name: 'VIP',
        description: 'Ultimate music experience',
        price: 0.05, // 0.05 ETH per month
        currency: 'ETH',
        duration: 30,
        benefits: [
          {
            type: 'unlimited_access',
            value: 'full_catalog',
            description: 'Access to full music catalog'
          },
          {
            type: 'exclusive_content',
            value: 'vip_content',
            description: 'Access to VIP exclusive content'
          },
          {
            type: 'early_access',
            value: 'new_releases',
            description: 'Early access to new releases'
          },
          {
            type: 'discount',
            value: 20,
            description: '20% discount on NFT purchases'
          }
        ],
        features: [
          'Everything in Premium',
          'Lossless audio quality (FLAC)',
          'VIP exclusive content and events',
          'Early access to new releases',
          'Unlimited offline downloads',
          'Priority customer support',
          '20% discount on NFT purchases',
          'Access to artist meet & greets',
          'Exclusive merchandise discounts'
        ],
        maxConcurrentStreams: 5,
        downloadLimit: -1, // unlimited
        exclusiveContent: true,
        earlyAccess: true,
        adFree: true
      }
    ];
  }

  private handleSubscriptionUpdate(subscription: SubscriptionStatus) {
    const session = yellowSDKService.getCurrentSession();
    if (session) {
      this.userSubscriptions.set(session.walletAddress, subscription);
    }
  }

  // Get available subscription tiers
  getAvailableTiers(): SubscriptionTier[] {
    return [...this.availableTiers];
  }

  // Get specific tier by ID
  getTierById(tierId: string): SubscriptionTier | null {
    return this.availableTiers.find(tier => tier.id === tierId) || null;
  }

  // Get subscription plans (monthly/yearly options)
  getSubscriptionPlans(tierId: string): SubscriptionPlan[] {
    const tier = this.getTierById(tierId);
    if (!tier) return [];

    const plans: SubscriptionPlan[] = [
      {
        tier,
        billing: 'monthly'
      }
    ];

    // Add yearly plan with discount
    plans.push({
      tier: {
        ...tier,
        price: tier.price * 10, // 10 months price for 12 months
        duration: 365
      },
      billing: 'yearly',
      discount: 17 // ~17% discount (2 months free)
    });

    return plans;
  }

  // Subscribe to a tier
  async subscribe(tierId: string, billing: 'monthly' | 'yearly' = 'monthly'): Promise<SubscriptionTransaction> {
    const session = yellowSDKService.getCurrentSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const tier = this.getTierById(tierId);
    if (!tier) {
      throw new Error(`Subscription tier '${tierId}' not found`);
    }

    const plans = this.getSubscriptionPlans(tierId);
    const selectedPlan = plans.find(plan => plan.billing === billing);
    if (!selectedPlan) {
      throw new Error(`Billing plan '${billing}' not available for tier '${tierId}'`);
    }

    try {
      // Process subscription payment through Yellow SDK
      const transaction = await yellowSDKService.processTransaction(
        selectedPlan.tier.price,
        `subscription_${tierId}_${billing}`,
        'subscription'
      );

      // Create subscription transaction record
      const subscriptionTransaction: SubscriptionTransaction = {
        id: `sub_${Date.now()}`,
        userId: session.walletAddress,
        tierId,
        amount: selectedPlan.tier.price,
        currency: selectedPlan.tier.currency,
        status: transaction.status === 'confirmed' ? 'confirmed' : 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + selectedPlan.tier.duration * 24 * 60 * 60 * 1000),
        autoRenew: true,
        paymentMethod: 'crypto',
        transactionHash: transaction.id
      };

      // Update user subscription status
      if (transaction.status === 'confirmed') {
        const subscriptionStatus: SubscriptionStatus = {
          isActive: true,
          tier: tierId as any,
          expiresAt: subscriptionTransaction.expiresAt,
          autoRenew: true,
          paymentMethod: 'crypto',
          nextBillingDate: subscriptionTransaction.expiresAt,
          benefits: selectedPlan.tier.benefits
        };

        this.userSubscriptions.set(session.walletAddress, subscriptionStatus);
        
        // Notify Yellow SDK of subscription update
        yellowSDKService.emit('subscriptionUpdated', subscriptionStatus);
      }

      return subscriptionTransaction;

    } catch (error) {
      console.error('Subscription error:', error);
      throw new Error(`Subscription failed: ${error.message}`);
    }
  }

  // Cancel subscription
  async cancelSubscription(): Promise<void> {
    const session = yellowSDKService.getCurrentSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const currentSubscription = this.userSubscriptions.get(session.walletAddress);
    if (!currentSubscription || !currentSubscription.isActive) {
      throw new Error('No active subscription to cancel');
    }

    try {
      // Update subscription status
      const updatedSubscription: SubscriptionStatus = {
        ...currentSubscription,
        autoRenew: false
      };

      this.userSubscriptions.set(session.walletAddress, updatedSubscription);
      
      // Notify Yellow SDK
      yellowSDKService.emit('subscriptionUpdated', updatedSubscription);

      console.log('Subscription cancelled successfully');
    } catch (error) {
      console.error('Cancellation error:', error);
      throw new Error(`Cancellation failed: ${error.message}`);
    }
  }

  // Renew subscription
  async renewSubscription(): Promise<SubscriptionTransaction> {
    const session = yellowSDKService.getCurrentSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const currentSubscription = this.userSubscriptions.get(session.walletAddress);
    if (!currentSubscription) {
      throw new Error('No subscription to renew');
    }

    // Subscribe to the same tier
    return this.subscribe(currentSubscription.tier);
  }

  // Upgrade subscription
  async upgradeSubscription(newTierId: string): Promise<SubscriptionTransaction> {
    const session = yellowSDKService.getCurrentSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const currentSubscription = this.userSubscriptions.get(session.walletAddress);
    if (!currentSubscription || !currentSubscription.isActive) {
      throw new Error('No active subscription to upgrade');
    }

    const newTier = this.getTierById(newTierId);
    const currentTier = this.getTierById(currentSubscription.tier);

    if (!newTier || !currentTier) {
      throw new Error('Invalid tier specified');
    }

    if (newTier.price <= currentTier.price) {
      throw new Error('New tier must be higher than current tier');
    }

    // Calculate prorated amount
    const remainingDays = Math.max(0, Math.ceil((currentSubscription.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    const proratedAmount = (newTier.price - currentTier.price) * (remainingDays / 30);

    try {
      // Process upgrade payment
      const transaction = await yellowSDKService.processTransaction(
        proratedAmount,
        `upgrade_${currentSubscription.tier}_to_${newTierId}`,
        'subscription'
      );

      // Update subscription
      if (transaction.status === 'confirmed') {
        const updatedSubscription: SubscriptionStatus = {
          ...currentSubscription,
          tier: newTierId as any,
          benefits: newTier.benefits
        };

        this.userSubscriptions.set(session.walletAddress, updatedSubscription);
        yellowSDKService.emit('subscriptionUpdated', updatedSubscription);
      }

      return {
        id: `upgrade_${Date.now()}`,
        userId: session.walletAddress,
        tierId: newTierId,
        amount: proratedAmount,
        currency: newTier.currency,
        status: transaction.status === 'confirmed' ? 'confirmed' : 'pending',
        createdAt: new Date(),
        expiresAt: currentSubscription.expiresAt,
        autoRenew: currentSubscription.autoRenew,
        paymentMethod: 'crypto',
        transactionHash: transaction.id
      };

    } catch (error) {
      console.error('Upgrade error:', error);
      throw new Error(`Upgrade failed: ${error.message}`);
    }
  }

  // Get current subscription status
  getCurrentSubscription(userAddress?: string): SubscriptionStatus | null {
    const session = yellowSDKService.getCurrentSession();
    const address = userAddress || session?.walletAddress;
    
    if (!address) return null;

    return this.userSubscriptions.get(address) || null;
  }

  // Check if user has access to specific content tier
  hasAccessToTier(requiredTier: string, userAddress?: string): boolean {
    const subscription = this.getCurrentSubscription(userAddress);
    
    if (!subscription || !subscription.isActive) {
      return false;
    }

    // Check if subscription has expired
    if (new Date() > subscription.expiresAt) {
      return false;
    }

    // Define tier hierarchy
    const tierHierarchy = ['basic', 'premium', 'vip'];
    const userTierIndex = tierHierarchy.indexOf(subscription.tier);
    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

    return userTierIndex >= requiredTierIndex;
  }

  // Get subscription benefits
  getSubscriptionBenefits(userAddress?: string): SubscriptionBenefit[] {
    const subscription = this.getCurrentSubscription(userAddress);
    return subscription?.benefits || [];
  }

  // Check if subscription is expiring soon (within 7 days)
  isSubscriptionExpiringSoon(userAddress?: string): boolean {
    const subscription = this.getCurrentSubscription(userAddress);
    
    if (!subscription || !subscription.isActive) {
      return false;
    }

    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return subscription.expiresAt <= sevenDaysFromNow;
  }

  // Get days until subscription expires
  getDaysUntilExpiration(userAddress?: string): number {
    const subscription = this.getCurrentSubscription(userAddress);
    
    if (!subscription || !subscription.isActive) {
      return 0;
    }

    const now = new Date();
    const expiration = subscription.expiresAt;
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  // Get recommended tier based on user behavior (mock implementation)
  getRecommendedTier(userAddress?: string): SubscriptionTier {
    // Mock recommendation logic - in production this would analyze user behavior
    return this.availableTiers.find(tier => tier.popular) || this.availableTiers[1];
  }

  // Calculate savings for yearly subscription
  calculateYearlySavings(tierId: string): { amount: number; percentage: number } {
    const plans = this.getSubscriptionPlans(tierId);
    const monthlyPlan = plans.find(p => p.billing === 'monthly');
    const yearlyPlan = plans.find(p => p.billing === 'yearly');

    if (!monthlyPlan || !yearlyPlan) {
      return { amount: 0, percentage: 0 };
    }

    const monthlyYearlyTotal = monthlyPlan.tier.price * 12;
    const yearlyPrice = yearlyPlan.tier.price;
    const savings = monthlyYearlyTotal - yearlyPrice;
    const percentage = (savings / monthlyYearlyTotal) * 100;

    return { amount: savings, percentage: Math.round(percentage) };
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;