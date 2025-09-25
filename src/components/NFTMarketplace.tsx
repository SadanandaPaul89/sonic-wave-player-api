import React, { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Heart, Share2, Disc, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { web3Service, NFTMetadata } from '@/services/web3Service';
import { AudioFileStructure } from '@/types/yellowSDK';
import IPFSAudioPlayer from './IPFSAudioPlayer';

interface NFTListing {
  id: string;
  tokenId: string;
  contractAddress: string;
  metadata: NFTMetadata;
  price: string;
  currency: string;
  seller: string;
  isAuction: boolean;
  auctionEndTime?: number;
  highestBid?: string;
  totalViews: number;
  totalLikes: number;
  isLiked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface NFTMarketplaceProps {
  className?: string;
}

const NFTMarketplace: React.FC<NFTMarketplaceProps> = ({ className = '' }) => {
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<NFTListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<NFTListing | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'newest' | 'popular' | 'ending_soon'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'auction' | 'buy_now'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - in production, this would come from your backend/blockchain
  const mockListings: NFTListing[] = [
    {
      id: '1',
      tokenId: '1',
      contractAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
      metadata: {
        name: 'Cosmic Dreams',
        description: 'An ethereal journey through space and time, featuring ambient soundscapes and celestial melodies.',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        animation_url: 'ipfs://QmYourMusicHashHere',
        attributes: [
          { trait_type: 'Genre', value: 'Ambient' },
          { trait_type: 'Duration', value: '4:32' },
          { trait_type: 'BPM', value: 85 },
          { trait_type: 'Key', value: 'C Major' },
          { trait_type: 'Rarity', value: 'Epic' }
        ],
        properties: {
          audio_files: {
            high_quality: {
              uri: 'ipfs://QmYourMusicHashHere',
              format: 'MP3' as const,
              bitrate: '320kbps' as const,
              size: 9600000
            },
            streaming: {
              uri: 'ipfs://QmYourMusicHashHere',
              format: 'MP3' as const,
              bitrate: '192kbps' as const,
              size: 5760000
            },
            mobile: {
              uri: 'ipfs://QmYourMusicHashHere',
              format: 'MP3' as const,
              bitrate: '128kbps' as const,
              size: 3840000
            }
          },
          utilities: {
            concert_access: true,
            merchandise_discount: 20,
            future_drops_priority: true
          },
          royalties: {
            percentage: 10,
            recipient: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4'
          }
        }
      },
      price: '0.5',
      currency: 'ETH',
      seller: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
      isAuction: false,
      totalViews: 1247,
      totalLikes: 89,
      isLiked: false,
      rarity: 'epic'
    },
    {
      id: '2',
      tokenId: '2',
      contractAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
      metadata: {
        name: 'Digital Rebellion',
        description: 'A high-energy electronic track that captures the spirit of digital revolution.',
        image: 'https://images.unsplash.com/photo-1571974599782-87624638275c?w=400&h=400&fit=crop',
        attributes: [
          { trait_type: 'Genre', value: 'Electronic' },
          { trait_type: 'Duration', value: '3:45' },
          { trait_type: 'BPM', value: 128 },
          { trait_type: 'Key', value: 'A Minor' },
          { trait_type: 'Rarity', value: 'Rare' }
        ],
        properties: {
          audio_files: {
            high_quality: {
              uri: 'ipfs://QmAnotherMusicHash',
              format: 'MP3' as const,
              bitrate: '320kbps' as const,
              size: 8400000
            },
            streaming: {
              uri: 'ipfs://QmAnotherMusicHash',
              format: 'MP3' as const,
              bitrate: '192kbps' as const,
              size: 5040000
            },
            mobile: {
              uri: 'ipfs://QmAnotherMusicHash',
              format: 'MP3' as const,
              bitrate: '128kbps' as const,
              size: 3360000
            }
          },
          exclusive_content: {
            stems: [
              { name: 'Bass', uri: 'ipfs://QmBassHash' },
              { name: 'Drums', uri: 'ipfs://QmDrumsHash' }
            ]
          }
        }
      },
      price: '1.2',
      currency: 'ETH',
      seller: '0x853f43d8a49edb4b8c4c6b8c4c6b8c4c6b8c4c6b',
      isAuction: true,
      auctionEndTime: Date.now() + 86400000, // 24 hours from now
      highestBid: '0.8',
      totalViews: 892,
      totalLikes: 156,
      isLiked: true,
      rarity: 'rare'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setListings(mockListings);
      setFilteredListings(mockListings);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter and sort listings
  useEffect(() => {
    let filtered = [...listings];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(listing =>
        listing.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.metadata.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.metadata.attributes.some(attr =>
          attr.value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(listing => {
        if (filterBy === 'auction') return listing.isAuction;
        if (filterBy === 'buy_now') return !listing.isAuction;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'popular':
          return b.totalLikes - a.totalLikes;
        case 'ending_soon':
          if (a.isAuction && b.isAuction) {
            return (a.auctionEndTime || 0) - (b.auctionEndTime || 0);
          }
          return a.isAuction ? -1 : 1;
        case 'newest':
        default:
          return parseInt(b.tokenId) - parseInt(a.tokenId);
      }
    });

    setFilteredListings(filtered);
  }, [listings, searchQuery, filterBy, sortBy]);

  const handleLike = (listingId: string) => {
    setListings(prev => prev.map(listing => {
      if (listing.id === listingId) {
        return {
          ...listing,
          isLiked: !listing.isLiked,
          totalLikes: listing.isLiked ? listing.totalLikes - 1 : listing.totalLikes + 1
        };
      }
      return listing;
    }));
  };

  const handleBuy = async (listing: NFTListing) => {
    if (!web3Service.isWalletConnected()) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      // In production, this would interact with your marketplace smart contract
      // Example: await marketplaceContract.buyNFT(listing.contractAddress, listing.tokenId, { value: listing.price });

      toast.success('Purchase initiated!', {
        description: `Buying ${listing.metadata.name} for ${listing.price} ${listing.currency}`,
      });

      // Update the listing to show it's sold (in production, this would come from blockchain events)
      setListings(prev => prev.filter(l => l.id !== listing.id));
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed', {
        description: error.message || 'Please try again',
      });
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'epic': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'rare': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatTimeRemaining = (endTime: number) => {
    const remaining = endTime - Date.now();
    if (remaining <= 0) return 'Ended';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-white/10 rounded-figma-md"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">NFT Music Marketplace</h1>
          <p className="text-white/70">Discover and collect exclusive music NFTs</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-figma-purple/20 text-figma-purple">
            {filteredListings.length} items
          </Badge>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card border-figma-glass-border">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search music NFTs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="buy_now">Buy Now</SelectItem>
                  <SelectItem value="auction">Auctions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price">Price: Low to High</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="ending_soon">Ending Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NFT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredListings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card border-figma-glass-border hover:border-figma-purple/50 transition-all duration-300 group">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden rounded-t-figma-md">
                    <img
                      src={listing.metadata.image}
                      alt={listing.metadata.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Overlay Actions */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleLike(listing.id)}
                        className={`w-8 h-8 rounded-full backdrop-blur-sm ${listing.isLiked
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                      >
                        <Heart size={16} fill={listing.isLiked ? 'currentColor' : 'none'} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/nft/${listing.contractAddress}/${listing.tokenId}`);
                          toast.success('Link copied to clipboard!');
                        }}
                        className="w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                      >
                        <Share2 size={16} />
                      </Button>
                    </div>

                    {/* Rarity Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge className={`${getRarityColor(listing.rarity)} border`}>
                        {listing.rarity}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-4 text-white/80 text-sm">
                      <div className="flex items-center gap-1">
                        <Eye size={14} />
                        {listing.totalViews}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart size={14} />
                        {listing.totalLikes}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">{listing.metadata.name}</h3>
                      <p className="text-white/60 text-sm line-clamp-2">{listing.metadata.description}</p>
                    </div>

                    {/* Attributes */}
                    <div className="flex flex-wrap gap-2">
                      {listing.metadata.attributes.slice(0, 3).map((attr, i) => (
                        <Badge key={i} variant="secondary" className="bg-white/10 text-white/80 text-xs">
                          {attr.trait_type}: {attr.value}
                        </Badge>
                      ))}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div>
                        {listing.isAuction ? (
                          <div>
                            <p className="text-white/60 text-sm">Current bid</p>
                            <p className="text-white font-bold text-xl">
                              {listing.highestBid || '0'} {listing.currency}
                            </p>
                            <p className="text-figma-purple text-sm">
                              Ends in {formatTimeRemaining(listing.auctionEndTime!)}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-white/60 text-sm">Price</p>
                            <p className="text-white font-bold text-xl">
                              {listing.price} {listing.currency}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {listing.isAuction ? (
                        <Button
                          onClick={() => toast.success('Bid placed!')}
                          className="flex-1 bg-figma-purple hover:bg-figma-purple/80"
                        >
                          <TrendingUp size={16} className="mr-2" />
                          Place Bid
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleBuy(listing)}
                          className="flex-1 bg-figma-purple hover:bg-figma-purple/80"
                        >
                          <ShoppingCart size={16} className="mr-2" />
                          Buy Now
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setSelectedListing(listing)}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Eye size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredListings.length === 0 && (
        <Card className="glass-card border-figma-glass-border">
          <CardContent className="p-12 text-center">
            <Disc size={64} className="mx-auto mb-4 text-white/40" />
            <h3 className="text-white text-xl font-bold mb-2">No NFTs Found</h3>
            <p className="text-white/60">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}

      {/* NFT Detail Modal */}
      <AnimatePresence>
        {selectedListing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedListing(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-figma-dark border border-figma-glass-border rounded-figma-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Image and Player */}
                  <div className="space-y-6">
                    <img
                      src={selectedListing.metadata.image}
                      alt={selectedListing.metadata.name}
                      className="w-full aspect-square object-cover rounded-figma-md"
                    />

                    {/* Audio Player */}
                    {selectedListing.metadata.properties?.audio_files && (
                      <IPFSAudioPlayer
                        audioFiles={selectedListing.metadata.properties.audio_files as AudioFileStructure}
                        title={selectedListing.metadata.name}
                        artist="Artist Name"
                        artwork={selectedListing.metadata.image}
                        nftContract={selectedListing.contractAddress}
                        tokenId={selectedListing.tokenId}
                      />
                    )}
                  </div>

                  {/* Right: Details */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">{selectedListing.metadata.name}</h2>
                      <p className="text-white/70">{selectedListing.metadata.description}</p>
                    </div>

                    {/* Attributes */}
                    <div>
                      <h3 className="text-white font-semibold mb-3">Attributes</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedListing.metadata.attributes.map((attr, i) => (
                          <div key={i} className="p-3 bg-white/5 rounded-figma-sm">
                            <p className="text-white/60 text-sm">{attr.trait_type}</p>
                            <p className="text-white font-medium">{attr.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Purchase */}
                    <div className="p-6 bg-white/5 rounded-figma-md">
                      {selectedListing.isAuction ? (
                        <div>
                          <p className="text-white/60 text-sm mb-1">Current bid</p>
                          <p className="text-white font-bold text-2xl mb-2">
                            {selectedListing.highestBid || '0'} {selectedListing.currency}
                          </p>
                          <p className="text-figma-purple text-sm mb-4">
                            Ends in {formatTimeRemaining(selectedListing.auctionEndTime!)}
                          </p>
                          <Button
                            onClick={() => toast.success('Bid placed!')}
                            className="w-full bg-figma-purple hover:bg-figma-purple/80"
                          >
                            <TrendingUp size={16} className="mr-2" />
                            Place Bid
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-white/60 text-sm mb-1">Price</p>
                          <p className="text-white font-bold text-2xl mb-4">
                            {selectedListing.price} {selectedListing.currency}
                          </p>
                          <Button
                            onClick={() => handleBuy(selectedListing)}
                            className="w-full bg-figma-purple hover:bg-figma-purple/80"
                          >
                            <ShoppingCart size={16} className="mr-2" />
                            Buy Now
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NFTMarketplace;