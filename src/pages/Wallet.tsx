import { useState } from 'react';
import { 
  Wallet as WalletIcon, 
  Music, 
  Settings, 
  Disc, 
  Star, 
  CreditCard, 
  Zap, 
  TrendingUp 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useWallet } from '@/contexts/WalletContext';
import PersistentMusicLibrary from '@/components/PersistentMusicLibrary';
import AnimationWrapper from '@/components/AnimationWrapper';
import ScrollAnimation from '@/components/ScrollAnimation';
import NFTBenefitsDisplay from '@/components/NFTBenefitsDisplay';
import MicrotransactionDashboard from '@/components/MicrotransactionDashboard';
import TransactionDisplay from '@/components/TransactionDisplay';
import SubscriptionManager from '@/components/SubscriptionManager';
import PaymentModal from '@/components/PaymentModal';
import IPFSAudioPlayer from '@/components/IPFSAudioPlayer';
import Web3WalletConnect from '@/components/Web3WalletConnect';

// Import the correct AudioFileStructure from yellowSDK types
import type { AudioFileStructure } from '@/types/yellowSDK';

const Wallet = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showDemo, setShowDemo] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Use centralized wallet context
  const {
    isWalletConnected,
    walletAddress,
    isYellowSDKAuthenticated,
    paymentChannel,
  } = useWallet();

  // Mock data for demo - in production, this would come from blockchain/backend
  const userNFTs: any[] = [];
  const transactions: any[] = [];
  const isProcessingTx = false;

  // Handle test transaction
  const handleTestTransaction = async () => {
    toast.success('Test transaction processed successfully!');
  };

  // Demo NFT data
  const demoNFT: AudioFileStructure = {
    high_quality: {
      url: 'ipfs://QmYourMusicHashHere',
      format: 'MP3',
      bitrate: 320
    },
    medium_quality: {
      url: 'ipfs://QmYourMusicHashHere',
      format: 'MP3',
      bitrate: 192
    },
    low_quality: {
      url: 'ipfs://QmYourMusicHashHere',
      format: 'MP3',
      bitrate: 128
    }
  };

  return (
    <div className="pb-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <AnimationWrapper animation="fadeIn" delay={0.1}>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Web3 Music Wallet</h1>
              <p className="text-white/70">Connect your wallet to access NFTs and exclusive content</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white/60 text-sm">System Online</span>
            </div>
          </div>
        </div>
      </AnimationWrapper>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wallet Connection - Single Source of Truth */}
        <div className="lg:col-span-1 space-y-6">
          <ScrollAnimation animation="slideUp" delay={0.2}>
            <Web3WalletConnect />
          </ScrollAnimation>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {isWalletConnected ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-7 bg-white/10 mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="library">Music Library</TabsTrigger>
                <TabsTrigger value="nfts">NFTs</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="networks">Networks</TabsTrigger>
                <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* NFT Benefits */}
                <ScrollAnimation animation="slideUp" delay={0.3}>
                  <NFTBenefitsDisplay compact={false} />
                </ScrollAnimation>

                {/* Demo IPFS Player */}
                {showDemo && (
                  <ScrollAnimation animation="slideUp" delay={0.4}>
                    <Card className="glass-card border-figma-glass-border">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center justify-between">
                          <span className="flex items-center gap-3">
                            <TrendingUp size={24} className="text-figma-purple" />
                            Demo: IPFS Music Player
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDemo(false)}
                            className="text-white/60 hover:text-white"
                          >
                            ×
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4 p-4 bg-figma-purple/10 border border-figma-purple/20 rounded-figma-md">
                          <p className="text-figma-purple text-sm">
                            <strong>Demo Mode:</strong> This player demonstrates IPFS music streaming with Yellow SDK integration.
                          </p>
                        </div>
                        <IPFSAudioPlayer
                          audioFiles={demoNFT}
                          title="Cosmic Dreams"
                          artist="Digital Artist"
                          artwork="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop"
                          nftContract="0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4"
                          tokenId="1"
                        />
                      </CardContent>
                    </Card>
                  </ScrollAnimation>
                )}
              </TabsContent>

              <TabsContent value="library" className="space-y-6">
                {/* Persistent Music Library */}
                <ScrollAnimation animation="slideUp" delay={0.3}>
                  <PersistentMusicLibrary />
                </ScrollAnimation>
              </TabsContent>

              <TabsContent value="nfts" className="space-y-6">
                {/* NFT Music Collection */}
                <ScrollAnimation animation="slideUp" delay={0.3}>
                  <Card className="glass-card border-figma-glass-border">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-3">
                        <Music size={24} className="text-figma-purple" />
                        Your NFT Music Collection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userNFTs.length > 0 ? (
                        <div className="space-y-4">
                          {userNFTs.map((nft, index) => (
                            <div key={index} className="p-4 bg-white/5 rounded-figma-md">
                              <h4 className="text-white font-medium">{nft.name}</h4>
                              <p className="text-white/60 text-sm">{nft.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Disc size={48} className="mx-auto mb-4 text-white/40" />
                          <p className="text-white/60 mb-4">No NFT music found in your wallet</p>
                          <p className="text-white/40 text-sm">
                            Purchase or mint NFT music to see it here
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </ScrollAnimation>

                {/* NFT Benefits Detail */}
                <ScrollAnimation animation="slideUp" delay={0.4}>
                  <NFTBenefitsDisplay />
                </ScrollAnimation>
              </TabsContent>

              <TabsContent value="payments" className="space-y-6">
                {/* Microtransaction Dashboard */}
                <ScrollAnimation animation="slideUp" delay={0.3}>
                  <MicrotransactionDashboard />
                </ScrollAnimation>

                {/* Payment Channel Info */}
                {paymentChannel && (
                  <ScrollAnimation animation="slideUp" delay={0.4}>
                    <Card className="glass-card border-figma-glass-border">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3">
                          <CreditCard size={24} className="text-figma-purple" />
                          Active Payment Channel
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-white/60 text-sm">Channel ID</p>
                            <p className="text-white font-mono text-sm">{paymentChannel.channelId.slice(0, 10)}...</p>
                          </div>
                          <div>
                            <p className="text-white/60 text-sm">Balance</p>
                            <p className="text-white font-medium">{paymentChannel.balance.toFixed(4)} ETH</p>
                          </div>
                          <div>
                            <p className="text-white/60 text-sm">Status</p>
                            <p className="text-green-400 text-sm capitalize">{paymentChannel.status}</p>
                          </div>
                          <div>
                            <p className="text-white/60 text-sm">Created</p>
                            <p className="text-white/60 text-sm">{paymentChannel.createdAt.toLocaleDateString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollAnimation>
                )}
              </TabsContent>

              <TabsContent value="transactions" className="space-y-6">
                {/* Test Transaction Button */}
                {isYellowSDKAuthenticated && paymentChannel && (
                  <ScrollAnimation animation="slideUp" delay={0.3}>
                    <Card className="glass-card border-figma-glass-border">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3">
                          <Zap size={24} className="text-figma-purple" />
                          Test Nitro Lite Payment
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-figma-md">
                          <p className="text-blue-400 text-sm">
                            <strong>Testnet Demo:</strong> Click below to process a test payment through Nitro Lite channels. 
                            This will show you how instant micropayments work with real transaction hashes.
                          </p>
                        </div>
                        <Button
                          onClick={handleTestTransaction}
                          disabled={isProcessingTx}
                          className="w-full bg-gradient-to-r from-figma-purple to-yellow-500 hover:from-figma-purple/80 hover:to-yellow-500/80 text-white"
                        >
                          {isProcessingTx ? (
                            <>
                              <motion.div
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              />
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              <Zap size={16} className="mr-2" />
                              Send Test Payment (0.01 ETH)
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </ScrollAnimation>
                )}

                {/* Transaction History */}
                <ScrollAnimation animation="slideUp" delay={0.4}>
                  <TransactionDisplay transactions={transactions} />
                </ScrollAnimation>
              </TabsContent>

              <TabsContent value="networks" className="space-y-6">
                {/* Network Selector */}
                <ScrollAnimation animation="slideUp" delay={0.3}>
                  <Card className="glass-card border-figma-glass-border">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-3">
                        <Settings size={24} className="text-figma-purple" />
                        Network Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-white/60 text-sm mb-2">Current Network</p>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <span className="text-white">Ethereum Mainnet</span>
                          </div>
                        </div>
                        <Button 
                          onClick={() => toast.success('Network switching coming soon!')}
                          variant="outline"
                          className="w-full"
                        >
                          Switch Network
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollAnimation>
              </TabsContent>

              <TabsContent value="subscriptions" className="space-y-6">
                {/* Subscription Manager */}
                <ScrollAnimation animation="slideUp" delay={0.3}>
                  <SubscriptionManager />
                </ScrollAnimation>
              </TabsContent>
            </Tabs>
          ) : (
            <ScrollAnimation animation="slideUp" delay={0.3}>
              <Card className="glass-card border-figma-glass-border">
                <CardContent className="p-12 text-center">
                  <motion.div
                    className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center"
                    animate={{ 
                      scale: [1, 1.05, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <WalletIcon size={32} className="text-white/60" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                  <p className="text-white/60 max-w-md mx-auto mb-6">
                    Connect your Web3 wallet to access your NFT music collection, 
                    payment features, and decentralized music platform.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto mb-8">
                    <Card className="glass-card border-figma-glass-border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Star size={16} className="text-figma-purple" />
                          <h3 className="text-white font-medium text-sm">Payment Channels</h3>
                        </div>
                        <p className="text-white/60 text-xs">
                          Instant micropayments and subscriptions
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="glass-card border-figma-glass-border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Disc size={16} className="text-figma-purple" />
                          <h3 className="text-white font-medium text-sm">NFT Benefits</h3>
                        </div>
                        <p className="text-white/60 text-xs">
                          Exclusive content and holder perks
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="text-center text-white/40 text-sm">
                    <p>Use the wallet connection panel on the left to get started</p>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimation>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        contentId="demo_content"
        contentTitle="Demo Content"
        contentArtist="Demo Artist"
      />
    </div>
  );
};

export default Wallet;