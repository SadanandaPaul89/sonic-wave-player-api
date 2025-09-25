// Microtransaction Service for handling small payments and content access

import { yellowSDKService } from './yellowSDKService';

import { Transaction, PaymentChannel } from '@/types/yellowSDK';

export interface MicrotransactionConfig {
  minAmount: number;
  maxAmount: number;
  currency: 'ETH' | 'MATIC' | 'USD';
  feePercentage: number;
  batchThreshold: number; // Minimum amount before batching transactions
  settlementInterval: number; // Minutes between automatic settlements
}

export interface ContentAccess {
  contentId: string;
  userId: string;
  accessType: 'single' | 'timed' | 'unlimited';
  duration?: number; // in minutes for timed access
  price: number;
  currency: string;
  grantedAt: Date;
  expiresAt?: Date;
  transactionId: string;
}

export interface MicrotransactionBatch {
  id: string;
  userId: string;
  transactions: Transaction[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'processing' | 'settled' | 'failed';
  createdAt: Date;
  settledAt?: Date;
  settlementHash?: string;
}

export interface BalanceUpdate {
  userId: string;
  previousBalance: number;
  newBalance: number;
  change: number;
  reason: string;
  timestamp: Date;
}

class MicrotransactionService {
  private config: MicrotransactionConfig = {
    minAmount: 0.001, // 0.001 ETH minimum
    maxAmount: 0.1,   // 0.1 ETH maximum for microtransactions
    currency: 'ETH',
    feePercentage: 2.5, // 2.5% fee
    batchThreshold: 0.01, // Batch when total reaches 0.01 ETH
    settlementInterval: 60 // Settle every hour
  };

  private contentAccess: Map<string, ContentAccess[]> = new Map();
  private pendingTransactions: Map<string, Transaction[]> = new Map();
  private balanceHistory: Map<string, BalanceUpdate[]> = new Map();
  private settlementTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeService();
  }

  private initializeService() {
    // Listen for transaction events
    yellowSDKService.on('transactionProcessed', this.handleTransactionProcessed.bind(this));
    yellowSDKService.on('channelUpdated', this.handleChannelUpdated.bind(this));
    
    // Start automatic settlement timer
    this.startSettlementTimer();
    
    console.log('Microtransaction service initialized');
  }

  private handleTransactionProcessed(transaction: Transaction) {
    if (transaction.type === 'payment' && transaction.amount <= this.config.maxAmount) {
      this.recordMicrotransaction(transaction);
    }
  }

  private handleChannelUpdated(channel: PaymentChannel) {
    // Update balance history
    const session = yellowSDKService.getCurrentSession();
    if (session) {
      this.recordBalanceUpdate(
        session.walletAddress,
        session.balance,
        channel.balance,
        'Channel updated'
      );
    }
  }

  private recordMicrotransaction(transaction: Transaction) {
    const userId = yellowSDKService.getCurrentSession()?.walletAddress;
    if (!userId) return;

    // Add to pending transactions
    const pending = this.pendingTransactions.get(userId) || [];
    pending.push(transaction);
    this.pendingTransactions.set(userId, pending);

    // Grant content access if applicable
    if (transaction.contentId && transaction.status === 'confirmed') {
      this.grantContentAccess(transaction);
    }

    console.log('Microtransaction recorded:', transaction.id);
  }

  private grantContentAccess(transaction: Transaction) {
    const userId = yellowSDKService.getCurrentSession()?.walletAddress;
    if (!userId || !transaction.contentId) return;

    const access: ContentAccess = {
      contentId: transaction.contentId,
      userId,
      accessType: 'single',
      price: transaction.amount,
      currency: this.config.currency,
      grantedAt: new Date(),
      transactionId: transaction.id
    };

    // Add to user's content access
    const userAccess = this.contentAccess.get(userId) || [];
    userAccess.push(access);
    this.contentAccess.set(userId, userAccess);

    console.log('Content access granted:', access);
  }

  private recordBalanceUpdate(userId: string, previousBalance: number, newBalance: number, reason: string) {
    const update: BalanceUpdate = {
      userId,
      previousBalance,
      newBalance,
      change: newBalance - previousBalance,
      reason,
      timestamp: new Date()
    };

    const history = this.balanceHistory.get(userId) || [];
    history.unshift(update);
    
    // Keep only last 100 updates
    if (history.length > 100) {
      history.splice(100);
    }
    
    this.balanceHistory.set(userId, history);
  }

  private startSettlementTimer() {
    this.settlementTimer = setInterval(() => {
      this.processAutomaticSettlement();
    }, this.config.settlementInterval * 60 * 1000);
  }

  private async processAutomaticSettlement() {
    console.log('Processing automatic settlement...');
    
    for (const [userId, transactions] of this.pendingTransactions.entries()) {
      const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      if (totalAmount >= this.config.batchThreshold) {
        try {
          await this.settleBatch(userId, transactions);
        } catch (error) {
          console.error('Automatic settlement failed for user:', userId, error);
        }
      }
    }
  }

  // Process a microtransaction
  async processMicrotransaction(
    contentId: string,
    amount: number,
    accessType: 'single' | 'timed' = 'single',
    duration?: number
  ): Promise<Transaction> {
    // Validate amount
    if (amount < this.config.minAmount || amount > this.config.maxAmount) {
      throw new Error(`Amount must be between ${this.config.minAmount} and ${this.config.maxAmount} ${this.config.currency}`);
    }

    // Check authentication
    const session = yellowSDKService.getCurrentSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Check balance
    if (session.balance < amount) {
      throw new Error(`Insufficient balance. Required: ${amount}, Available: ${session.balance}`);
    }

    try {
      // Process transaction through Yellow SDK
      const transaction = await yellowSDKService.processTransaction(amount, contentId, 'payment');
      
      // Add metadata for access type
      if (transaction.metadata) {
        transaction.metadata.accessDuration = duration;
      } else {
        transaction.metadata = {
          accessDuration: duration
        };
      }

      return transaction;
    } catch (error) {
      console.error('Microtransaction processing error:', error);
      throw new Error(`Microtransaction failed: ${error.message}`);
    }
  }

  // Batch multiple microtransactions
  async batchMicrotransactions(
    transactions: Array<{ contentId: string; amount: number; accessType?: 'single' | 'timed'; duration?: number }>
  ): Promise<Transaction[]> {
    const session = yellowSDKService.getCurrentSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    // Check balance
    if (session.balance < totalAmount) {
      throw new Error(`Insufficient balance for batch. Required: ${totalAmount}, Available: ${session.balance}`);
    }

    const processedTransactions: Transaction[] = [];

    try {
      for (const tx of transactions) {
        const transaction = await this.processMicrotransaction(
          tx.contentId,
          tx.amount,
          tx.accessType,
          tx.duration
        );
        processedTransactions.push(transaction);
      }

      return processedTransactions;
    } catch (error) {
      console.error('Batch microtransaction error:', error);
      throw new Error(`Batch processing failed: ${error.message}`);
    }
  }

  // Settle pending transactions
  async settleBatch(userId: string, transactions: Transaction[]): Promise<MicrotransactionBatch> {
    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    const batch: MicrotransactionBatch = {
      id: `batch_${Date.now()}`,
      userId,
      transactions,
      totalAmount,
      currency: this.config.currency,
      status: 'processing',
      createdAt: new Date()
    };

    try {
      // Settle through Yellow SDK
      await yellowSDKService.settleChannel();
      
      batch.status = 'settled';
      batch.settledAt = new Date();
      batch.settlementHash = `settlement_${batch.id}`;

      // Remove from pending
      this.pendingTransactions.delete(userId);

      console.log('Batch settled successfully:', batch.id);
      return batch;
    } catch (error) {
      batch.status = 'failed';
      console.error('Batch settlement failed:', error);
      throw error;
    }
  }

  // Calculate transaction fee
  private calculateFee(amount: number): number {
    return amount * (this.config.feePercentage / 100);
  }

  // Check if user has access to content
  hasContentAccess(contentId: string, userId?: string): boolean {
    const session = yellowSDKService.getCurrentSession();
    const userAddress = userId || session?.walletAddress;
    
    if (!userAddress) return false;

    const userAccess = this.contentAccess.get(userAddress) || [];
    const access = userAccess.find(a => a.contentId === contentId);
    
    if (!access) return false;

    // Check if access has expired
    if (access.expiresAt && new Date() > access.expiresAt) {
      return false;
    }

    return true;
  }

  // Get user's content access history
  getContentAccessHistory(userId?: string): ContentAccess[] {
    const session = yellowSDKService.getCurrentSession();
    const userAddress = userId || session?.walletAddress;
    
    if (!userAddress) return [];

    return this.contentAccess.get(userAddress) || [];
  }

  // Get pending transactions for user
  getPendingTransactions(userId?: string): Transaction[] {
    const session = yellowSDKService.getCurrentSession();
    const userAddress = userId || session?.walletAddress;
    
    if (!userAddress) return [];

    return this.pendingTransactions.get(userAddress) || [];
  }

  // Get balance history
  getBalanceHistory(userId?: string): BalanceUpdate[] {
    const session = yellowSDKService.getCurrentSession();
    const userAddress = userId || session?.walletAddress;
    
    if (!userAddress) return [];

    return this.balanceHistory.get(userAddress) || [];
  }

  // Get spending analytics
  getSpendingAnalytics(userId?: string, days: number = 30): {
    totalSpent: number;
    transactionCount: number;
    averageTransaction: number;
    contentAccessed: number;
    dailySpending: Array<{ date: string; amount: number; count: number }>;
  } {
    const session = yellowSDKService.getCurrentSession();
    const userAddress = userId || session?.walletAddress;
    
    if (!userAddress) {
      return {
        totalSpent: 0,
        transactionCount: 0,
        averageTransaction: 0,
        contentAccessed: 0,
        dailySpending: []
      };
    }

    const pending = this.pendingTransactions.get(userAddress) || [];
    const access = this.contentAccess.get(userAddress) || [];
    
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentTransactions = pending.filter(tx => new Date(tx.timestamp) >= cutoffDate);
    const recentAccess = access.filter(a => a.grantedAt >= cutoffDate);

    const totalSpent = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const transactionCount = recentTransactions.length;
    const averageTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;

    // Calculate daily spending
    const dailySpending: { [key: string]: { amount: number; count: number } } = {};
    
    recentTransactions.forEach(tx => {
      const date = new Date(tx.timestamp).toISOString().split('T')[0];
      if (!dailySpending[date]) {
        dailySpending[date] = { amount: 0, count: 0 };
      }
      dailySpending[date].amount += tx.amount;
      dailySpending[date].count += 1;
    });

    const dailySpendingArray = Object.entries(dailySpending).map(([date, data]) => ({
      date,
      amount: data.amount,
      count: data.count
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalSpent,
      transactionCount,
      averageTransaction,
      contentAccessed: recentAccess.length,
      dailySpending: dailySpendingArray
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<MicrotransactionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Microtransaction config updated:', this.config);
  }

  // Get current configuration
  getConfig(): MicrotransactionConfig {
    return { ...this.config };
  }

  // Manual settlement trigger
  async triggerSettlement(userId?: string): Promise<void> {
    const session = yellowSDKService.getCurrentSession();
    const userAddress = userId || session?.walletAddress;
    
    if (!userAddress) {
      throw new Error('User not authenticated');
    }

    const pending = this.pendingTransactions.get(userAddress);
    if (!pending || pending.length === 0) {
      throw new Error('No pending transactions to settle');
    }

    await this.settleBatch(userAddress, pending);
  }

  // Cleanup
  destroy(): void {
    if (this.settlementTimer) {
      clearInterval(this.settlementTimer);
      this.settlementTimer = null;
    }
  }
}

export const microtransactionService = new MicrotransactionService();
export default microtransactionService;