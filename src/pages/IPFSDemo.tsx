import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Music, Disc, Wallet as WalletIcon, ShoppingCart, TrendingUp, Star, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimationWrapper } from '@/components/AnimationWrapper';
import { ScrollAnimation } from '@/components/ScrollAnimation';
import UnifiedWalletStatus from '@/components/UnifiedWalletStatus';
import IPFSUploader from '@/components/IPFSUploader';
import IPFSAudioPlayer from '@/components/IPFSAudioPlayer';
import ContentAccessGate from '@/components/ContentAccessGate';
import PaymentModal from '@/components/PaymentModal';
import SubscriptionManager from '@/components/SubscriptionManager';
import YellowSDKStatusIndicator from '@/components/YellowSDKStatusIndicator';
import { useYellowProvider } from '@/providers/YellowProvider';
import { useContent } from '@/hooks/useContent';
import { ipfsMusicService } from '@/services/ipfsMusicService';
import { AudioFileStructure } from '@/types/yellowSDK';
import IPFSMusicUploader from '@/components/IPFSMusicUploader';
import { MusicMetadata } from '@/services/ipfsServiceSimple';

const IPFSDemo = () => {
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [uploadedTracks, setUploadedTracks] = useState<Array<{ metadata: any; hash: string }>>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);

  const { 
    isConnected: yellowConnected, 
    isAuthenticated, 
    session, 
    balance 
  } = useYellowProvider();

  const { content, searchContent } = useContent();

  const handleWalletConnect = (account: string, _chainId: number) => {
    setConnectedAccount(account);
  };

  const handleWalletDisconnect = () => {
    setConnectedAccount(null);
  };

  const handleUploadComplete = (metadata: MusicMetadata, hash: string) => {
    setUploadedTracks(prev => [...prev, { metadata, hash }]);
    setActiveTab('player'); // Switch to player tab to show the uploaded track
  };

  const handleContentAccess = (contentId: string) => {
    setSelectedContent(contentId);
    setShowPaymentModal(true);
  };

  // Demo NFT data
  const demoTrack: AudioFileStructure = {
    high_quality: {
      uri: 'ipfs://QmYourMusicHashHere',
      format: 'MP3',
      bitrate: '320kbps',
      size: 9600000
    },
    streaming: {
      uri: 'ipfs://QmYourMusicHashHere',
      format: 'MP3',
      bitrate: '192kbps',
      size: 5760000
    },
    mobile: {
      uri: 'ipfs://QmYourMusicHashHere',
      format: 'MP3',
      bitrate: '128kbps',
      size: 3840000
    }
  };

  return (
    <div className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AnimationWrapper animation="fadeIn" delay={0.1}>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">IPFS Music Storage Demo</h1>
              <p className="text-white/70 text-lg max-w-3xl">
                Experience the future of decentralized music storage with Yellow SDK integration. 
                Upload music to IPFS, manage payments, and explore NFT-gated content.
              </p>
            </div>
            <YellowSDKStatusIndicator />
          </div>
          
          {/* Yellow SDK Status Banner */}
          {yellowConnected && (
            <div className="bg-figma-purple/20 border border-figma-purple/30 rounded-figma-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="text-figma-purple" size={20} />
                  <div>
                    <p className="text-figma-purple font-medium">Yellow SDK Connected</p>
                    <p className="text-figma-purple/80 text-sm">
                      {isAuthenticated ? `` : 'Ready for authentication'}
                    </p>
                  </div>
                </div>
                {!isAuthenticated && (
                  <Button size="sm" className="bg-figma-purple hover:bg-figma-purple/80">
                    Authenticate
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </AnimationWrapper>

      <ScrollAnimation animation="slideUp" delay={0.2}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-figma-purple">
              <TrendingUp size={16} className="mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-figma-purple">
              <WalletIcon size={16} className="mr-2" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-figma-purple">
              <Upload size={16} className="mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="player" className="data-[state=active]:bg-figma-purple">
              <Music size={16} className="mr-2" />
              Player
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-figma-purple">
              <CreditCard size={16} className="mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="data-[state=active]:bg-figma-purple">
              <ShoppingCart size={16} className="mr-2" />
              Marketplace
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="glass-card border-figma-glass-border h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-figma-purple/20 rounded-full flex items-center justify-center">
                        <Disc size={24} className="text-figma-purple" />
                      </div>
                      <h3 className="text-white font-semibold text-lg">Decentralized Storage</h3>
                    </div>
                    <p className="text-white/70 text-sm">
                      Store your music files on IPFS for permanent, censorship-resistant access. 
                      Files are distributed across the network ensuring high availability.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="glass-card border-figma-glass-border h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-figma-purple/20 rounded-full flex items-center justify-center">
                        <WalletIcon size={24} className="text-figma-purple" />
                      </div>
                      <h3 className="text-white font-semibold text-lg">Web3 Integration</h3>
                    </div>
                    <p className="text-white/70 text-sm">
                      Connect your Web3 wallet to access exclusive NFT music, 
                      participate in auctions, and enjoy premium features.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="glass-card border-figma-glass-border h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-figma-purple/20 rounded-full flex items-center justify-center">
                        <Music size={24} className="text-figma-purple" />
                      </div>
                      <h3 className="text-white font-semibold text-lg">Adaptive Streaming</h3>
                    </div>
                    <p className="text-white/70 text-sm">
                      Automatically selects optimal audio quality based on your network connection 
                      and device capabilities for the best listening experience.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <Card className="glass-card border-figma-glass-border">
              <CardHeader>
                <CardTitle className="text-white">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-figma-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-figma-purple font-bold text-xl">1</span>
                    </div>
                    <h4 className="text-white font-medium mb-2">Connect Wallet</h4>
                    <p className="text-white/60 text-sm">Connect your Web3 wallet to access all features</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-figma-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-figma-purple font-bold text-xl">2</span>
                    </div>
                    <h4 className="text-white font-medium mb-2">Upload Music</h4>
                    <p className="text-white/60 text-sm">Upload your audio files to IPFS with metadata</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-figma-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-figma-purple font-bold text-xl">3</span>
                    </div>
                    <h4 className="text-white font-medium mb-2">Stream & Play</h4>
                    <p className="text-white/60 text-sm">Enjoy high-quality streaming from IPFS</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-figma-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-figma-purple font-bold text-xl">4</span>
                    </div>
                    <h4 className="text-white font-medium mb-2">Trade NFTs</h4>
                    <p className="text-white/60 text-sm">Buy, sell, and trade music NFTs in the marketplace</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <UnifiedWalletStatus variant="full" showActions={true} />
              </div>
              <div className="space-y-6">
                <Card className="glass-card border-figma-glass-border">
                  <CardHeader>
                    <CardTitle className="text-white">Wallet Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-figma-sm">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Music size={16} className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">NFT Music Access</p>
                        <p className="text-white/60 text-xs">Access exclusive tracks you own</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-figma-sm">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <ShoppingCart size={16} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Marketplace Trading</p>
                        <p className="text-white/60 text-xs">Buy and sell music NFTs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-figma-sm">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <TrendingUp size={16} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Multi-Chain Support</p>
                        <p className="text-white/60 text-xs">Ethereum, Polygon, and more</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {connectedAccount && (
                  <Card className="glass-card border-figma-glass-border">
                    <CardHeader>
                      <CardTitle className="text-white">Connected Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button
                          onClick={() => setActiveTab('upload')}
                          className="w-full bg-figma-purple hover:bg-figma-purple/80"
                        >
                          <Upload size={16} className="mr-2" />
                          Upload Music to IPFS
                        </Button>
                        <Button
                          onClick={() => setActiveTab('marketplace')}
                          variant="outline"
                          className="w-full border-white/20 text-white hover:bg-white/10"
                        >
                          <ShoppingCart size={16} className="mr-2" />
                          Browse Marketplace
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <IPFSMusicUploader onUploadComplete={(track) => {
                  setUploadedTracks(prev => [...prev, { metadata: track.metadata, hash: track.ipfsHash }]);
                }} />
              </div>
              <div className="space-y-6">
                <Card className="glass-card border-figma-glass-border">
                  <CardHeader>
                    <CardTitle className="text-white">Upload Benefits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-green-400 text-xs">✓</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Permanent Storage</p>
                        <p className="text-white/60 text-xs">Files stored on IPFS are permanent and immutable</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-green-400 text-xs">✓</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Global Distribution</p>
                        <p className="text-white/60 text-xs">Content distributed across IPFS network worldwide</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-green-400 text-xs">✓</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Metadata Preservation</p>
                        <p className="text-white/60 text-xs">Rich metadata stored alongside audio files</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {uploadedTracks.length > 0 && (
                  <Card className="glass-card border-figma-glass-border">
                    <CardHeader>
                      <CardTitle className="text-white">Your Uploads</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {uploadedTracks.map((track, index) => (
                          <div key={index} className="p-3 bg-white/5 rounded-figma-sm">
                            <p className="text-white font-medium text-sm">{track.metadata.title}</p>
                            <p className="text-white/60 text-xs">{track.metadata.artist}</p>
                            <p className="text-figma-purple text-xs font-mono">IPFS: {track.hash.slice(0, 20)}...</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <SubscriptionManager />
              </div>
              <div className="space-y-6">
                <Card className="glass-card border-figma-glass-border">
                  <CardHeader>
                    <CardTitle className="text-white">Payment Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5">
                        <CreditCard size={12} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Payment Channels</p>
                        <p className="text-white/60 text-xs">Off-chain payment processing for instant transactions</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mt-0.5">
                        <Star size={12} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Subscriptions</p>
                        <p className="text-white/60 text-xs">Flexible subscription plans with automatic renewals</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                        <Music size={12} className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Pay-per-Track</p>
                        <p className="text-white/60 text-xs">Microtransactions for individual track purchases</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {yellowConnected && session && (
                  <Card className="glass-card border-figma-glass-border">
                    <CardHeader>
                      <CardTitle className="text-white">Your Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-sm">Wallet</span>
                          <span className="text-white text-sm font-mono">
                            {session.walletAddress.slice(0, 6)}...{session.walletAddress.slice(-4)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-sm">Balance</span>
                          <span className="text-white text-sm">{balance.toFixed(4)} ETH</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-sm">Subscription</span>
                          <span className="text-green-400 text-sm">
                            {session.subscriptionStatus?.isActive ? 'Active' : 'None'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Player Tab */}
          <TabsContent value="player" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Free Content */}
                <Card className="glass-card border-figma-glass-border">
                  <CardHeader>
                    <CardTitle className="text-white">Free Demo Track</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <IPFSAudioPlayer
                      audioFiles={demoTrack}
                      title="Cosmic Dreams"
                      artist="Digital Artist"
                      artwork="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop"
                    />
                  </CardContent>
                </Card>

                {/* Premium Content with Access Gate */}
                <ContentAccessGate
                  content={{
                    id: 'track_002',
                    title: 'Neon Nights',
                    artist: 'Synth Master',
                    accessTier: 'pay_per_use',
                    ipfsHash: 'QmAnotherMusicHash',
                    metadata: {
                      id: 'track_002',
                      title: 'Neon Nights',
                      artist: 'Synth Master',
                      genre: 'Synthwave',
                      duration: 198,
                      year: 2024,
                      description: 'Retro-futuristic synthwave vibes',
                      tags: ['synthwave', 'retro', 'neon'],
                      createdAt: new Date('2024-02-01'),
                      updatedAt: new Date('2024-02-01')
                    },
                    pricing: {
                      payPerUse: 0.005,
                      subscriptionTiers: ['premium', 'vip'],
                      currency: 'ETH'
                    },
                    createdAt: new Date('2024-02-01'),
                    updatedAt: new Date('2024-02-01')
                  }}
                  onAccessGranted={() => console.log('Access granted!')}
                  onAccessDenied={(reason) => console.log('Access denied:', reason)}
                >
                  <IPFSAudioPlayer
                    audioFiles={demoTrack}
                    title="Neon Nights"
                    artist="Synth Master"
                    artwork="https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop"
                  />
                </ContentAccessGate>
              </div>
              <div className="space-y-6">
                <Card className="glass-card border-figma-glass-border">
                  <CardHeader>
                    <CardTitle className="text-white">Player Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5">
                        <Music size={12} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Adaptive Quality</p>
                        <p className="text-white/60 text-xs">Automatically adjusts based on network speed</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mt-0.5">
                        <WalletIcon size={12} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">NFT Gating</p>
                        <p className="text-white/60 text-xs">Access control based on NFT ownership</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                        <TrendingUp size={12} className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Gateway Optimization</p>
                        <p className="text-white/60 text-xs">Selects fastest IPFS gateway automatically</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {uploadedTracks.length > 0 && (
                  <Card className="glass-card border-figma-glass-border">
                    <CardHeader>
                      <CardTitle className="text-white">Your Uploaded Tracks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {uploadedTracks.map((track, index) => (
                          <IPFSAudioPlayer
                            key={index}
                            audioFiles={track.metadata.ipfs_hashes}
                            title={track.metadata.title}
                            artist={track.metadata.artist}
                            artwork={track.metadata.artwork}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-white mb-4">NFT Marketplace</h2>
              <p className="text-white/60">Coming soon - NFT marketplace functionality</p>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollAnimation>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        contentId={selectedContent || 'demo_content'}
        contentTitle="Demo Content"
        contentArtist="Demo Artist"
      />
    </div>
  );
};

export default IPFSDemo;