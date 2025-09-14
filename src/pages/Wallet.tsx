import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Copy, Check, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AnimationWrapper } from '@/components/AnimationWrapper';
import { ScrollAnimation } from '@/components/ScrollAnimation';

const WalletPage: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [isConnecting, setIsConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate wallet connection (replace with actual Web3 logic)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock wallet data
      setWalletAddress('0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4');
      setBalance('2.45');
      setIsConnected(true);
      
      toast.success('Wallet connected successfully!', {
        description: 'You can now access Web3 features',
      });
    } catch (error) {
      toast.error('Failed to connect wallet', {
        description: 'Please try again or check your wallet extension',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress('');
    setBalance('0.00');
    toast.success('Wallet disconnected', {
      description: 'Your wallet has been safely disconnected',
    });
  };

  const copyAddress = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress);
        setCopied(true);
        toast.success('Address copied to clipboard', {
          description: walletAddress,
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy address');
      }
    }
  };



  return (
    <div className="pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <AnimationWrapper animation="fadeIn" delay={0.1}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Web3 Wallet</h1>
          <p className="text-white/70">Connect your blockchain wallet to access Web3 features</p>
        </div>
      </AnimationWrapper>

      {!isConnected ? (
        <ScrollAnimation animation="slideUp" delay={0.2}>
          <Card className="glass-card border-figma-glass-border">
            <CardContent className="p-8 text-center">
              <motion.div
                className="w-20 h-20 mx-auto mb-6 bg-figma-purple/20 rounded-full flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Wallet size={32} className="text-figma-purple" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                Connect your Web3 wallet to access blockchain features, NFT collections, and crypto payments for premium content.
              </p>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={connectWallet}
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
        </ScrollAnimation>
      ) : (
        <div className="space-y-6">
          {/* Wallet Info Card */}
          <ScrollAnimation animation="slideUp" delay={0.2}>
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
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
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
                  <p className="text-white text-2xl font-bold">{balance} ETH</p>
                  <p className="text-figma-purple text-sm mt-1">≈ $4,234.50 USD</p>
                </motion.div>
              </CardContent>
            </Card>
          </ScrollAnimation>

          {/* Web3 Features */}
          <ScrollAnimation animation="slideUp" delay={0.4}>
            <Card className="glass-card border-figma-glass-border">
              <CardHeader>
                <CardTitle className="text-white">Web3 Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      title: 'NFT Music Collection',
                      description: 'Own exclusive music NFTs and rare tracks',
                      gradient: 'from-figma-purple/20 to-figma-purple-light/20',
                      border: 'border-figma-purple/30'
                    },
                    {
                      title: 'Crypto Payments',
                      description: 'Pay for premium features with crypto',
                      gradient: 'from-figma-purple-light/20 to-figma-purple/20',
                      border: 'border-figma-purple-light/30'
                    },
                    {
                      title: 'Artist Tokens',
                      description: 'Support artists with their tokens',
                      gradient: 'from-figma-purple/20 to-figma-purple-light/20',
                      border: 'border-figma-purple/30'
                    },
                    {
                      title: 'Decentralized Storage',
                      description: 'Store your music on IPFS',
                      gradient: 'from-figma-purple-light/20 to-figma-purple/20',
                      border: 'border-figma-purple-light/30'
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      className={`p-4 bg-gradient-to-r ${feature.gradient} rounded-figma-md border ${feature.border} hover:bg-white/10 transition-all duration-300 cursor-pointer group`}
                      whileHover={{ scale: 1.02, y: -2 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      <h3 className="text-white font-medium mb-2 group-hover:text-figma-purple transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-white/70 text-sm">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </ScrollAnimation>

          {/* Disconnect Button */}
          <ScrollAnimation animation="fadeIn" delay={0.6}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                onClick={disconnectWallet}
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400/50 transition-all duration-300 rounded-figma-md"
              >
                <LogOut size={16} className="mr-2" />
                Disconnect Wallet
              </Button>
            </motion.div>
          </ScrollAnimation>
        </div>
      )}
    </div>
  );
};

export default WalletPage;