// Transaction Display Component - Shows transaction details with block explorer links

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle, 
  XCircle,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { web3Service } from '@/services/web3Service';

interface Transaction {
  id: string;
  channelId: string;
  amount: number;
  recipient: string;
  contentId?: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
}

interface TransactionDisplayProps {
  transactions: Transaction[];
  className?: string;
}

const TransactionDisplay: React.FC<TransactionDisplayProps> = ({
  transactions,
  className = ''
}) => {
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  // Get current chain info for block explorer links
  const getCurrentChain = () => {
    const chainId = web3Service.getCurrentChainId();
    return web3Service.getSupportedChains().find(chain => chain.chainId === chainId);
  };

  // Copy transaction hash
  const copyTxHash = async (txHash: string) => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopiedTx(txHash);
      toast.success('Transaction hash copied!');
      setTimeout(() => setCopiedTx(null), 2000);
    } catch (error) {
      toast.error('Failed to copy transaction hash');
    }
  };

  // Get block explorer URL
  const getBlockExplorerUrl = (txHash: string) => {
    const chain = getCurrentChain();
    if (!chain) return null;
    return `${chain.blockExplorer}/tx/${txHash}`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get status icon and color
  const getStatusDisplay = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock size={16} className="animate-pulse" />,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          label: 'Pending'
        };
      case 'confirmed':
        return {
          icon: <CheckCircle size={16} />,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          label: 'Confirmed'
        };
      case 'failed':
        return {
          icon: <XCircle size={16} />,
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          label: 'Failed'
        };
    }
  };

  if (transactions.length === 0) {
    return (
      <Card className={`glass-card border-figma-glass-border ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
            <Zap size={24} className="text-white/40" />
          </div>
          <h3 className="text-white font-medium mb-2">No Transactions Yet</h3>
          <p className="text-white/60 text-sm">
            Your payment transactions will appear here once you start making purchases.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-card border-figma-glass-border ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3">
          <Zap size={24} className="text-figma-purple" />
          Recent Transactions
          <Badge variant="secondary" className="bg-figma-purple/20 text-figma-purple">
            {transactions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence>
          {transactions.slice(0, 10).map((tx, index) => {
            const statusDisplay = getStatusDisplay(tx.status);
            const blockExplorerUrl = tx.txHash ? getBlockExplorerUrl(tx.txHash) : null;

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-white/5 rounded-figma-md hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${statusDisplay.bgColor}`}>
                      <div className={statusDisplay.color}>
                        {statusDisplay.icon}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">
                          {tx.amount.toFixed(4)} ETH
                        </p>
                        <Badge 
                          variant="secondary" 
                          className={`${statusDisplay.bgColor} ${statusDisplay.color} text-xs`}
                        >
                          {statusDisplay.label}
                        </Badge>
                      </div>
                      <p className="text-white/60 text-sm">
                        {tx.contentId ? `Content: ${tx.contentId}` : 'Payment'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-xs">
                      {formatTimestamp(tx.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Transaction Hash */}
                {tx.txHash && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-figma-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-xs">Transaction Hash:</span>
                        <code className="text-white font-mono text-xs">
                          {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                        </code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyTxHash(tx.txHash!)}
                          className="h-8 w-8 p-0 text-white/60 hover:text-figma-purple"
                        >
                          {copiedTx === tx.txHash ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </Button>
                        {blockExplorerUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(blockExplorerUrl, '_blank')}
                            className="h-8 w-8 p-0 text-white/60 hover:text-figma-purple"
                          >
                            <ExternalLink size={14} />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Block Explorer Link */}
                    {blockExplorerUrl && (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(blockExplorerUrl, '_blank')}
                          className="w-full border-figma-purple/30 text-figma-purple hover:bg-figma-purple/20 hover:border-figma-purple/50"
                        >
                          <ArrowUpRight size={14} className="mr-2" />
                          View on {getCurrentChain()?.name} Explorer
                        </Button>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Channel Info */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Channel:</span>
                    <code className="text-white/80 font-mono">
                      {tx.channelId.slice(0, 8)}...{tx.channelId.slice(-4)}
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-white/60">Recipient:</span>
                    <code className="text-white/80 font-mono">
                      {tx.recipient.slice(0, 6)}...{tx.recipient.slice(-4)}
                    </code>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {transactions.length > 10 && (
          <div className="text-center pt-4">
            <p className="text-white/60 text-sm">
              Showing 10 of {transactions.length} transactions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionDisplay;