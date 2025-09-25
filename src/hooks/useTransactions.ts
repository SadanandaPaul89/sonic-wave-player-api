// Hook for tracking Yellow SDK transactions

import { useState, useEffect } from 'react';
import { yellowSDKService } from '@/services/yellowSDKService';
import { Transaction } from '@/types/yellowSDK';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen for new transactions
    const handleTransaction = (transaction: Transaction) => {
      setTransactions(prev => {
        // Avoid duplicates
        const exists = prev.find(tx => tx.id === transaction.id);
        if (exists) {
          // Update existing transaction
          return prev.map(tx => tx.id === transaction.id ? transaction : tx);
        }
        // Add new transaction at the beginning
        return [transaction, ...prev].slice(0, 50); // Keep only last 50 transactions
      });
    };

    yellowSDKService.on('transactionProcessed', handleTransaction);

    return () => {
      yellowSDKService.off('transactionProcessed', handleTransaction);
    };
  }, []);

  // Process a test transaction
  const processTestTransaction = async (amount: number = 0.01) => {
    setIsLoading(true);
    try {
      const transaction = await yellowSDKService.processTransaction(
        amount,
        `test_content_${Date.now()}`,
        'payment'
      );
      return transaction;
    } catch (error) {
      console.error('Error processing test transaction:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    transactions,
    isLoading,
    processTestTransaction
  };
};