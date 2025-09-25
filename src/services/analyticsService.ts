// Analytics and Monitoring Service for Yellow SDK Integration

import { yellowSDKService } from './yellowSDKService';
import { Transaction, UserSession, SubscriptionStatus } from '@/types/yellowSDK';

export interface AnalyticsEvent {
  id: string;
  type: 'connection' | 'authentication' | 'transaction' | 'subscription' | 'content_access' | 'error';
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  data: Record<string, unknown>;
  metadata?: {
    userAgent?: string;
    platform?: string;
    version?: string;
    location?: string;
  };
}

export interface UserBehaviorMetrics {
  userId: string;
  sessionDuration: number;
  contentAccessed: string[];
  transactionCount: number;
  totalSpent: number;
  subscriptionTier?: string;
  nftBenefitsUsed: number;
  lastActive: Date;
  preferredPaymentMethod: 'pay_per_use' | 'subscription' | 'nft';
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  averageTransactionValue: number;
  subscriptionConversionRate: number;
  contentAccessRate: number;
  errorRate: number;
  averageSessionDuration: number;
  popularContent: Array<{ contentId: string; accessCount: number }>;
}

export interface PerformanceMetrics {
  connectionTime: number;
  authenticationTime: number;
  transactionProcessingTime: number;
  contentLoadTime: number;
  errorCount: number;
  uptime: number;
  websocketLatency: number;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private userMetrics: Map<string, UserBehaviorMetrics> = new Map();
  private performanceMetrics: PerformanceMetrics = {
    connectionTime: 0,
    authenticationTime: 0,
    transactionProcessingTime: 0,
    contentLoadTime: 0,
    errorCount: 0,
    uptime: Date.now(),
    websocketLatency: 0
  };
  private sessionStartTimes: Map<string, number> = new Map();

  constructor() {
    this.initializeService();
  }

  private initializeService() {
    // Set up event listeners for Yellow SDK events
    yellowSDKService.on('connected', () => {
      this.trackEvent('connection', { status: 'connected' });
    });

    yellowSDKService.on('disconnected', () => {
      this.trackEvent('connection', { status: 'disconnected' });
    });

    yellowSDKService.on('authenticated', (session: UserSession) => {
      this.trackEvent('authentication', { 
        userId: session.walletAddress,
        sessionId: session.sessionId 
      });
      this.sessionStartTimes.set(session.sessionId, Date.now());
    });

    yellowSDKService.on('transactionProcessed', (transaction: Transaction) => {
      this.trackEvent('transaction', {
        transactionId: transaction.id,
        amount: transaction.amount,
        contentId: transaction.contentId,
        type: transaction.type
      });
      this.updateUserMetrics(transaction);
    });

    yellowSDKService.on('subscriptionUpdated', (subscription: SubscriptionStatus) => {
      this.trackEvent('subscription', {
        tierId: subscription.tierId,
        isActive: subscription.isActive,
        userId: subscription.userId
      });
    });

    yellowSDKService.on('error', (error: any) => {
      this.trackEvent('error', {
        message: error.payload?.message || 'Unknown error',
        code: error.payload?.code,
        stack: error.payload?.stack
      });
      this.performanceMetrics.errorCount++;
    });

    console.log('Analytics service initialized');
  }

  // Track custom events
  trackEvent(
    type: AnalyticsEvent['type'], 
    data: Record<string, unknown>, 
    userId?: string,
    sessionId?: string
  ): void {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      type,
      timestamp: new Date(),
      userId,
      sessionId,
      data,
      metadata: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        version: '1.0.0', // App version
        location: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    this.events.push(event);
    
    // Keep only last 10000 events to prevent memory issues
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }

    console.log('Analytics event tracked:', event);
  }

  // Track content access
  trackContentAccess(contentId: string, userId?: string, accessMethod?: string): void {
    this.trackEvent('content_access', {
      contentId,
      accessMethod,
      timestamp: Date.now()
    }, userId);

    // Update user metrics
    if (userId) {
      const metrics = this.getUserMetrics(userId);
      if (!metrics.contentAccessed.includes(contentId)) {
        metrics.contentAccessed.push(contentId);
      }
      metrics.lastActive = new Date();
    }
  }

  // Track performance metrics
  trackPerformance(metric: keyof PerformanceMetrics, value: number): void {
    this.performanceMetrics[metric] = value;
    
    this.trackEvent('performance', {
      metric,
      value,
      timestamp: Date.now()
    });
  }

  // Update user behavior metrics
  private updateUserMetrics(transaction: Transaction): void {
    const userId = transaction.userId || 'anonymous';
    const metrics = this.getUserMetrics(userId);
    
    metrics.transactionCount++;
    metrics.totalSpent += transaction.amount;
    metrics.lastActive = new Date();
    
    // Determine preferred payment method
    const recentTransactions = this.getRecentTransactions(userId, 10);
    const paymentMethods = recentTransactions.map(t => t.type);
    const methodCounts = paymentMethods.reduce((acc, method) => {
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const preferredMethod = Object.entries(methodCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as UserBehaviorMetrics['preferredPaymentMethod'];
    
    if (preferredMethod) {
      metrics.preferredPaymentMethod = preferredMethod;
    }
  }

  // Get user metrics
  private getUserMetrics(userId: string): UserBehaviorMetrics {
    if (!this.userMetrics.has(userId)) {
      this.userMetrics.set(userId, {
        userId,
        sessionDuration: 0,
        contentAccessed: [],
        transactionCount: 0,
        totalSpent: 0,
        nftBenefitsUsed: 0,
        lastActive: new Date(),
        preferredPaymentMethod: 'pay_per_use'
      });
    }
    return this.userMetrics.get(userId)!;
  }

  // Get recent transactions for a user
  private getRecentTransactions(userId: string, limit: number = 10): Transaction[] {
    return this.events
      .filter(event => event.type === 'transaction' && event.userId === userId)
      .slice(-limit)
      .map(event => ({
        id: event.data.transactionId,
        amount: event.data.amount,
        contentId: event.data.contentId,
        type: event.data.type,
        userId: event.userId!,
        status: 'completed',
        timestamp: event.timestamp
      }));
  }

  // Generate system metrics
  getSystemMetrics(): SystemMetrics {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    const recentEvents = this.events.filter(event => 
      event.timestamp.getTime() > last24Hours
    );

    const transactionEvents = recentEvents.filter(event => event.type === 'transaction');
    const authEvents = recentEvents.filter(event => event.type === 'authentication');
    const contentEvents = recentEvents.filter(event => event.type === 'content_access');
    const subscriptionEvents = recentEvents.filter(event => 
      event.type === 'subscription' && event.data.isActive
    );

    const totalRevenue = transactionEvents.reduce((sum, event) => 
      sum + (event.data.amount || 0), 0
    );

    const contentAccessCounts = contentEvents.reduce((acc, event) => {
      const contentId = event.data.contentId;
      acc[contentId] = (acc[contentId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularContent = Object.entries(contentAccessCounts)
      .map(([contentId, accessCount]) => ({ contentId, accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    const uniqueUsers = new Set(recentEvents.map(event => event.userId).filter(Boolean));
    const activeUsers = new Set(
      recentEvents
        .filter(event => event.timestamp.getTime() > now - (60 * 60 * 1000)) // Last hour
        .map(event => event.userId)
        .filter(Boolean)
    );

    const sessionDurations = Array.from(this.sessionStartTimes.entries())
      .map(([sessionId, startTime]) => now - startTime)
      .filter(duration => duration > 0);

    const averageSessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
      : 0;

    return {
      totalUsers: uniqueUsers.size,
      activeUsers: activeUsers.size,
      totalTransactions: transactionEvents.length,
      totalRevenue,
      averageTransactionValue: transactionEvents.length > 0 ? totalRevenue / transactionEvents.length : 0,
      subscriptionConversionRate: authEvents.length > 0 ? subscriptionEvents.length / authEvents.length : 0,
      contentAccessRate: authEvents.length > 0 ? contentEvents.length / authEvents.length : 0,
      errorRate: recentEvents.length > 0 ? recentEvents.filter(e => e.type === 'error').length / recentEvents.length : 0,
      averageSessionDuration: averageSessionDuration / 1000, // Convert to seconds
      popularContent
    };
  }

  // Get performance metrics
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      ...this.performanceMetrics,
      uptime: Date.now() - this.performanceMetrics.uptime
    };
  }

  // Get user behavior analytics
  getUserBehaviorAnalytics(userId: string): UserBehaviorMetrics | null {
    const metrics = this.userMetrics.get(userId);
    if (!metrics) return null;

    // Calculate session duration
    const userEvents = this.events.filter(event => event.userId === userId);
    if (userEvents.length > 0) {
      const firstEvent = userEvents[0].timestamp.getTime();
      const lastEvent = userEvents[userEvents.length - 1].timestamp.getTime();
      metrics.sessionDuration = lastEvent - firstEvent;
    }

    return metrics;
  }

  // Get events by type and time range
  getEvents(
    type?: AnalyticsEvent['type'],
    startTime?: Date,
    endTime?: Date,
    userId?: string
  ): AnalyticsEvent[] {
    return this.events.filter(event => {
      if (type && event.type !== type) return false;
      if (startTime && event.timestamp < startTime) return false;
      if (endTime && event.timestamp > endTime) return false;
      if (userId && event.userId !== userId) return false;
      return true;
    });
  }

  // Export analytics data
  exportAnalytics(format: 'json' | 'csv' = 'json'): string {
    const data = {
      events: this.events,
      systemMetrics: this.getSystemMetrics(),
      performanceMetrics: this.getPerformanceMetrics(),
      userMetrics: Array.from(this.userMetrics.values()),
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Simple CSV export for events
      const headers = ['id', 'type', 'timestamp', 'userId', 'data'];
      const rows = this.events.map(event => [
        event.id,
        event.type,
        event.timestamp.toISOString(),
        event.userId || '',
        JSON.stringify(event.data)
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  // Clear old analytics data
  clearOldData(olderThanDays: number = 30): void {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    this.events = this.events.filter(event => 
      event.timestamp.getTime() > cutoffTime
    );

    // Clear old user metrics
    for (const [userId, metrics] of this.userMetrics.entries()) {
      if (metrics.lastActive.getTime() < cutoffTime) {
        this.userMetrics.delete(userId);
      }
    }

    console.log(`Cleared analytics data older than ${olderThanDays} days`);
  }

  // Generate event ID
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get analytics dashboard data
  getDashboardData(): {
    systemMetrics: SystemMetrics;
    performanceMetrics: PerformanceMetrics;
    recentEvents: AnalyticsEvent[];
    topUsers: Array<{ userId: string; metrics: UserBehaviorMetrics }>;
  } {
    const systemMetrics = this.getSystemMetrics();
    const performanceMetrics = this.getPerformanceMetrics();
    const recentEvents = this.events.slice(-50); // Last 50 events
    
    const topUsers = Array.from(this.userMetrics.entries())
      .sort(([,a], [,b]) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(([userId, metrics]) => ({ userId, metrics }));

    return {
      systemMetrics,
      performanceMetrics,
      recentEvents,
      topUsers
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;