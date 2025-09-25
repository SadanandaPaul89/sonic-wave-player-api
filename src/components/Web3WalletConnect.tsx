import React, { useState, useEffect } from 'react';
import { Wallet, ExternalLink, Copy, Check, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { web3Service, ChainConfig } from '@/services/web3Service';

interface Web3WalletConnectProps {
  onConnect?: (account: string, chainId: number) => void;
  onDisconnect?: () => void;
  className?: string;
}

const Web3WalletConnect: React.FC<Web3WalletConnectProps> = ({
  onConnect,
  onDisconnect,
  className = ''
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState<string>('0');
  const [copied, setCopied] = useState(false);
  const [supportedChains] = useState<ChainConfig[]>(web3Service.getSupportedChains());

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = () => {
      const currentAccount = web3Service.getCurrentAccount();
      const currentChainId = web3Service.getCurrentChainId();
      
      if (currentAccount && currentChainId) {
        setAccount(currentAccount);
        setChainId(currentChainId);
        setIsConnected(true);
      }
    };

    checkConnection();

    // Listen for account/chain changes
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          handleDisconnect();
        } else {
          setAccount(accounts[0]);
          onConnect?.(accounts[0], chainId || 1);
        }
      };

      const handleChainChanged = (newChainId: string) => {
        const chainIdNum = parseInt(newChainId, 16);
        setChainId(chainIdNum);
        if (account) {
          onConnect?.(account, chainIdNum);
        }
      };

      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);

      return () => {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
        (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account, chainId, onConnect]);

  // Get balance when account changes
  useEffect(() => {
    const getBalance = async () => {
      if (account) {
        try {
          const balanceEth = await web3Service.getBalance(account);
          setBalance(parseFloat(balanceEth).toFixed(4));
        } catch (error) {
          console.error('Error getting balance:', error);
          setBalance('0');
        }
      }
    };

    getBalance();
  }, [account, chainId]);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      const { account: connectedAccount, chainId: connectedChainId } = await web3Service.connectWallet();
      
      setAccount(connectedAccount);
      setChainId(connectedChainId);
      setIsConnected(true);
      
      onConnect?.(connectedAccount, connectedChainId);
      
      toast.success('Wallet connected successfully!', {
        description: `Connected to ${web3Service.formatAddress(connectedAccount)}`,
      });
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setBalance('0');
    onDisconnect?.();
    
    toast.success('Wallet disconnected');
  };

  const handleSwitchChain = async (newChainId: string) => {
    try {
      await web3Service.switchChain(parseInt(newChainId));
      toast.success('Network switched successfully');
    } catch (error: any) {
      console.error('Error switching chain:', error);
      toast.error('Failed to switch network', {
        description: error.message || 'Please try again',
      });
    }
  };

  const copyAddress = async () => {
    if (account) {
      try {
        await navigator.clipboard.writeText(account);
        setCopied(true);
        toast.success('Address copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy address');
      }
    }
  };

  const getCurrentChain = (): ChainConfig | undefined => {
    return supportedChains.find(chain => chain.chainId === chainId);
  };

  const getChainStatus = (chain: ChainConfig): 'connected' | 'supported' | 'testnet' => {
    if (chain.chainId === chainId) return 'connected';
    if (chain.testnet) return 'testnet';
    return 'supported';
  };

  if (!isConnected) {
    return (
      <Card className={`glass-card border-figma-glass-border ${className}`}>
        <CardContent className="p-6 text-center">
          <motion.div
            className="w-20 h-20 mx-auto mb-6 bg-figma-purple/20 rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Wallet size={32} className="text-figma-purple" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-white/70 mb-8 max-w-md mx-auto">
            Connect your Web3 wallet to access NFT music, exclusive content, and decentralized features.
          </p>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-gradient-to-r from-figma-purple to-figma-purple-light hover:from-figma-purple/80 hover:to-figma-purple-light/80 text-white px-8 py-3 text-lg font-medium rounded-figma-md transition-all duration-300 shadow-lg hover:shadow-figma-purple/25"
            >
              {isConnecting ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-3"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet size={20} className="mr-3" />
                  Connect Wallet
                </>
              )}
            </Button>
          </motion.div>
          
          <div className="mt-8 text-sm text-white/60">
            <p className="mb-4">Supported wallets:</p>
            <div className="flex justify-center gap-3 flex-wrap">
              {['MetaMask', 'WalletConnect', 'Coinbase'].map((wallet, index) => (
                <motion.span
                  key={wallet}
                  className="px-4 py-2 bg-white/10 rounded-figma-sm hover:bg-white/20 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  {wallet}
                </motion.span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentChain = getCurrentChain();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Wallet Info Card */}
      <Card className="glass-card border-figma-glass-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 bg-gradient-to-r from-figma-purple to-figma-purple-light rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <Wallet size={20} className="text-white" />
            </motion.div>
            Wallet Connected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div 
            className="flex items-center justify-between p-4 bg-white/5 rounded-figma-md hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.01 }}
          >
            <div>
              <p className="text-white/70 text-sm">Address</p>
              <p className="text-white font-mono text-sm">
                {web3Service.formatAddress(account!)}
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={copyAddress}
                className="text-white/70 hover:text-figma-purple hover:bg-figma-purple/20 transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="p-4 bg-gradient-to-r from-figma-purple/10 to-figma-purple-light/10 rounded-figma-md border border-figma-purple/20"
            whileHover={{ scale: 1.01 }}
          >
            <p className="text-white/70 text-sm">Balance</p>
            <p className="text-white text-2xl font-bold">{balance} {currentChain?.currency || 'ETH'}</p>
          </motion.div>
        </CardContent>
      </Card>

      {/* Network Selection */}
      <Card className="glass-card border-figma-glass-border">
        <CardHeader>
          <CardTitle className="text-white">Network</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{currentChain?.name || 'Unknown Network'}</p>
              <p className="text-white/60 text-sm">Chain ID: {chainId}</p>
            </div>
            <Badge 
              variant={currentChain?.testnet ? 'secondary' : 'default'}
              className={currentChain?.testnet ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}
            >
              {currentChain?.testnet ? 'Testnet' : 'Mainnet'}
            </Badge>
          </div>

          <Select value={chainId?.toString()} onValueChange={handleSwitchChain}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
              {supportedChains.map((chain) => {
                const status = getChainStatus(chain);
                return (
                  <SelectItem key={chain.chainId} value={chain.chainId.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span>{chain.name}</span>
                      <div className="flex items-center gap-2 ml-2">
                        {status === 'connected' && (
                          <Badge variant="default" className="bg-green-500/20 text-green-400 text-xs">
                            Connected
                          </Badge>
                        )}
                        {status === 'testnet' && (
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 text-xs">
                            Testnet
                          </Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Disconnect Button */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Button
          onClick={handleDisconnect}
          variant="outline"
          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400/50 transition-all duration-300 rounded-figma-md"
        >
          <Wallet size={16} className="mr-2" />
          Disconnect Wallet
        </Button>
      </motion.div>
    </div>
  );
};

export default Web3WalletConnect;