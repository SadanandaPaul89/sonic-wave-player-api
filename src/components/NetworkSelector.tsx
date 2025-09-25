// Network Selector Component - Switch between different blockchain networks

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { web3Service, ChainConfig } from '@/services/web3Service';

interface NetworkSelectorProps {
  currentChainId?: number | null;
  onNetworkChange?: (chainId: number) => void;
  className?: string;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  currentChainId,
  onNetworkChange,
  className = ''
}) => {
  const [switchingTo, setSwitchingTo] = useState<number | null>(null);
  const supportedChains = web3Service.getSupportedChains();

  const handleNetworkSwitch = async (chainId: number) => {
    if (chainId === currentChainId) return;

    setSwitchingTo(chainId);
    
    try {
      await web3Service.switchChain(chainId);
      onNetworkChange?.(chainId);
      
      const chain = supportedChains.find(c => c.chainId === chainId);
      toast.success(`Switched to ${chain?.name}`, {
        description: chain?.testnet ? 'Testnet network' : 'Mainnet network'
      });
    } catch (error: any) {
      console.error('Error switching network:', error);
      toast.error('Failed to switch network', {
        description: error.message || 'Please try again'
      });
    } finally {
      setSwitchingTo(null);
    }
  };

  const getNetworkStatus = (chain: ChainConfig) => {
    if (chain.chainId === currentChainId) {
      return {
        status: 'connected',
        icon: <CheckCircle size={16} className="text-green-400" />,
        badge: 'Connected',
        badgeClass: 'bg-green-500/20 text-green-400'
      };
    }
    
    if (chain.testnet) {
      return {
        status: 'testnet',
        icon: <AlertCircle size={16} className="text-yellow-400" />,
        badge: 'Testnet',
        badgeClass: 'bg-yellow-500/20 text-yellow-400'
      };
    }
    
    return {
      status: 'available',
      icon: <Globe size={16} className="text-white/60" />,
      badge: 'Available',
      badgeClass: 'bg-white/10 text-white/60'
    };
  };

  const getNetworkDescription = (chain: ChainConfig) => {
    const descriptions: Record<number, string> = {
      1: 'Ethereum mainnet - Most secure and established network',
      137: 'Polygon - Fast and low-cost transactions',
      8453: 'Base - Coinbase L2 with low fees and fast finality',
      84532: 'Base Sepolia - Base testnet for development and testing',
      11155111: 'Sepolia - Ethereum testnet for development',
      80001: 'Mumbai - Polygon testnet for development'
    };
    
    return descriptions[chain.chainId] || 'Blockchain network';
  };

  return (
    <Card className={`glass-card border-figma-glass-border ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3">
          <Globe size={24} className="text-figma-purple" />
          Network Selection
          {currentChainId && (
            <Badge variant="secondary" className="bg-figma-purple/20 text-figma-purple">
              {supportedChains.find(c => c.chainId === currentChainId)?.name}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {supportedChains.map((chain) => {
            const networkStatus = getNetworkStatus(chain);
            const isConnected = chain.chainId === currentChainId;
            const isSwitching = switchingTo === chain.chainId;

            return (
              <motion.div
                key={chain.chainId}
                whileHover={{ scale: isConnected ? 1 : 1.02 }}
                whileTap={{ scale: isConnected ? 1 : 0.98 }}
                className={`p-4 rounded-figma-md border transition-all cursor-pointer ${
                  isConnected 
                    ? 'bg-figma-purple/20 border-figma-purple/50' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
                onClick={() => !isConnected && !isSwitching && handleNetworkSwitch(chain.chainId)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {networkStatus.icon}
                    <div>
                      <h4 className="text-white font-medium">{chain.name}</h4>
                      <p className="text-white/60 text-sm">Chain ID: {chain.chainId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={networkStatus.badgeClass}>
                      {networkStatus.badge}
                    </Badge>
                    {isSwitching && (
                      <Loader2 size={16} className="text-figma-purple animate-spin" />
                    )}
                  </div>
                </div>
                
                <p className="text-white/70 text-sm mb-3">
                  {getNetworkDescription(chain)}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-white/60">
                    <span>Currency: {chain.currency}</span>
                    {chain.testnet && (
                      <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs">
                        Testnet
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(chain.blockExplorer, '_blank');
                    }}
                    className="h-8 w-8 p-0 text-white/60 hover:text-figma-purple"
                  >
                    <ExternalLink size={14} />
                  </Button>
                </div>
                
                {!isConnected && !isSwitching && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 border-figma-purple/30 text-figma-purple hover:bg-figma-purple/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNetworkSwitch(chain.chainId);
                    }}
                  >
                    Switch to {chain.name}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-figma-md">
          <h4 className="text-blue-400 font-medium mb-2">Network Recommendations</h4>
          <ul className="text-blue-300 text-sm space-y-1">
            <li>• <strong>Base Sepolia</strong> - Best for testing Yellow SDK features</li>
            <li>• <strong>Base Mainnet</strong> - Low fees for production use</li>
            <li>• <strong>Polygon</strong> - Fast transactions and low costs</li>
            <li>• <strong>Ethereum</strong> - Maximum security and compatibility</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkSelector;