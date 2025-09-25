# IPFS Music Storage & Streaming Implementation Plan

## Overview

This document outlines the implementation strategy for migrating Sonic Wave's music storage to IPFS (InterPlanetary File System) to achieve true decentralization while maintaining optimal streaming performance and user experience.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [IPFS Integration Strategy](#ipfs-integration-strategy)
3. [NFT Storage & Access](#nft-storage--access)
4. [Performance Optimization](#performance-optimization)
5. [Implementation Phases](#implementation-phases)
6. [Technical Requirements](#technical-requirements)
7. [Latency Mitigation](#latency-mitigation)
8. [Cost Analysis](#cost-analysis)
9. [Security Considerations](#security-considerations)

## Architecture Overview

### Current State
- Music files stored in centralized cloud storage (AWS S3/Supabase Storage)
- Direct HTTP streaming from CDN
- Single point of failure
- Geographic latency issues

### Target State
- Music files distributed across IPFS network
- Multi-gateway streaming with failover
- Content-addressed storage (immutable)
- Global content distribution
- Decentralized redundancy

### Hybrid Architecture (Recommended)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │  IPFS Gateway   │    │  IPFS Network   │
│                 │    │   Load Balancer │    │                 │
│ - Audio Player  │◄──►│                 │◄──►│ - Public Nodes  │
│ - Metadata UI   │    │ - Pinata        │    │ - Private Nodes │
│ - Upload Form   │    │ - Infura        │    │ - CDN Cache     │
└─────────────────┘    │ - Web3.Storage  │    └─────────────────┘
                       │ - Custom Node   │
                       └─────────────────┘
```

## IPFS Integration Strategy

### 1. File Storage Architecture

#### Audio File Structure
```
/music/
├── original/          # High-quality source files
│   └── {hash}.flac    # Lossless format
├── streaming/         # Optimized for streaming
│   ├── {hash}_320.mp3 # High quality
│   ├── {hash}_192.mp3 # Medium quality
│   └── {hash}_128.mp3 # Low quality (mobile)
└── metadata/
    └── {hash}.json    # Track metadata
```

#### Metadata Schema
```json
{
  "title": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "duration": 240,
  "genre": "Electronic",
  "year": 2024,
  "ipfs_hashes": {
    "original": "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "320kbps": "QmYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
    "192kbps": "QmZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
    "128kbps": "QmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
  },
  "artwork": "QmBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
  "created_at": "2024-01-01T00:00:00Z",
  "file_size": {
    "original": 45000000,
    "320kbps": 9600000,
    "192kbps": 5760000,
    "128kbps": 3840000
  }
}
```

### 2. Gateway Strategy

#### Multi-Gateway Configuration
```typescript
const IPFS_GATEWAYS = [
  {
    name: 'Pinata',
    url: 'https://gateway.pinata.cloud/ipfs/',
    priority: 1,
    region: 'global',
    rateLimit: 1000
  },
  {
    name: 'Infura',
    url: 'https://ipfs.infura.io/ipfs/',
    priority: 2,
    region: 'global',
    rateLimit: 500
  },
  {
    name: 'Web3Storage',
    url: 'https://w3s.link/ipfs/',
    priority: 3,
    region: 'global',
    rateLimit: 200
  },
  {
    name: 'Cloudflare',
    url: 'https://cloudflare-ipfs.com/ipfs/',
    priority: 4,
    region: 'global',
    rateLimit: 1000
  },
  {
    name: 'Custom Node',
    url: 'https://ipfs.sonicwave.com/ipfs/',
    priority: 5,
    region: 'custom',
    rateLimit: 2000
  }
];
```

## NFT Storage & Access

### 1. NFT Architecture Overview

#### Music NFT Structure
```
┌─────────────────────────────────────────────────────────────┐
│                    Music NFT Ecosystem                      │
├─────────────────────────────────────────────────────────────┤
│  Smart Contract (ERC-721/ERC-1155)                        │
│  ├── Token ID: Unique identifier                           │
│  ├── Owner: Wallet address                                 │
│  ├── Metadata URI: IPFS hash to metadata                   │
│  └── Royalty Info: Creator royalties                       │
├─────────────────────────────────────────────────────────────┤
│  IPFS Metadata (JSON)                                      │
│  ├── Track Info: Title, artist, album                      │
│  ├── Audio Files: Multiple quality IPFS hashes            │
│  ├── Artwork: Cover art IPFS hash                          │
│  ├── Exclusive Content: Bonus tracks, stems                │
│  └── Utility: Access rights, perks                         │
├─────────────────────────────────────────────────────────────┤
│  IPFS Audio Storage                                         │
│  ├── Original Master: Lossless FLAC                        │
│  ├── Streaming Versions: 320/192/128 kbps MP3             │
│  ├── Exclusive Content: Stems, instrumentals               │
│  └── Interactive Media: Visualizers, lyrics                │
└─────────────────────────────────────────────────────────────┘
```

### 2. Smart Contract Implementation

#### ERC-721 Music NFT Contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

contract SonicWaveMusicNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, IERC2981 {
    using Strings for uint256;
    
    struct MusicNFT {
        string ipfsHash;           // IPFS hash of metadata
        address artist;            // Original creator
        uint256 royaltyPercentage; // Royalty percentage (basis points)
        uint256 mintedAt;          // Timestamp
        bool isExclusive;          // Exclusive content flag
        uint256 maxSupply;         // For limited editions
        uint256 currentSupply;     // Current minted amount
    }
    
    mapping(uint256 => MusicNFT) public musicNFTs;
    mapping(address => bool) public authorizedMinters;
    mapping(uint256 => mapping(address => bool)) public accessRights;
    
    uint256 private _tokenIdCounter;
    uint256 public constant MAX_ROYALTY = 1000; // 10%
    
    event MusicNFTMinted(
        uint256 indexed tokenId,
        address indexed artist,
        address indexed owner,
        string ipfsHash
    );
    
    event AccessGranted(uint256 indexed tokenId, address indexed user);
    event AccessRevoked(uint256 indexed tokenId, address indexed user);
    
    constructor() ERC721("SonicWave Music NFT", "SWNFT") {}
    
    function mintMusicNFT(
        address to,
        string memory ipfsHash,
        address artist,
        uint256 royaltyPercentage,
        bool isExclusive,
        uint256 maxSupply
    ) public onlyAuthorizedMinter returns (uint256) {
        require(royaltyPercentage <= MAX_ROYALTY, "Royalty too high");
        require(maxSupply > 0, "Max supply must be positive");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        musicNFTs[tokenId] = MusicNFT({
            ipfsHash: ipfsHash,
            artist: artist,
            royaltyPercentage: royaltyPercentage,
            mintedAt: block.timestamp,
            isExclusive: isExclusive,
            maxSupply: maxSupply,
            currentSupply: 1
        });
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", ipfsHash)));
        
        emit MusicNFTMinted(tokenId, artist, to, ipfsHash);
        return tokenId;
    }
    
    function grantAccess(uint256 tokenId, address user) public {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        accessRights[tokenId][user] = true;
        emit AccessGranted(tokenId, user);
    }
    
    function revokeAccess(uint256 tokenId, address user) public {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        accessRights[tokenId][user] = false;
        emit AccessRevoked(tokenId, user);
    }
    
    function hasAccess(uint256 tokenId, address user) public view returns (bool) {
        return ownerOf(tokenId) == user || accessRights[tokenId][user];
    }
    
    // EIP-2981 Royalty Standard
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        MusicNFT memory nft = musicNFTs[tokenId];
        receiver = nft.artist;
        royaltyAmount = (salePrice * nft.royaltyPercentage) / 10000;
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
    
    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
}
```

#### ERC-1155 Multi-Edition Contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SonicWaveMultiEdition is ERC1155, Ownable {
    struct Edition {
        string ipfsHash;
        address artist;
        uint256 maxSupply;
        uint256 currentSupply;
        uint256 price;
        bool isActive;
        mapping(address => bool) allowlist;
    }
    
    mapping(uint256 => Edition) public editions;
    mapping(uint256 => mapping(address => bool)) public accessRights;
    
    uint256 private _editionIdCounter;
    
    constructor() ERC1155("") {}
    
    function createEdition(
        string memory ipfsHash,
        address artist,
        uint256 maxSupply,
        uint256 price
    ) public onlyOwner returns (uint256) {
        uint256 editionId = _editionIdCounter;
        _editionIdCounter++;
        
        Edition storage edition = editions[editionId];
        edition.ipfsHash = ipfsHash;
        edition.artist = artist;
        edition.maxSupply = maxSupply;
        edition.price = price;
        edition.isActive = true;
        
        return editionId;
    }
    
    function mintEdition(uint256 editionId, uint256 amount) public payable {
        Edition storage edition = editions[editionId];
        require(edition.isActive, "Edition not active");
        require(edition.currentSupply + amount <= edition.maxSupply, "Exceeds max supply");
        require(msg.value >= edition.price * amount, "Insufficient payment");
        
        edition.currentSupply += amount;
        _mint(msg.sender, editionId, amount, "");
        
        // Grant access rights
        accessRights[editionId][msg.sender] = true;
    }
}
```

### 3. NFT Metadata Schema

#### Comprehensive NFT Metadata
```json
{
  "name": "Exclusive Track - Artist Name",
  "description": "Limited edition music NFT with exclusive content and utilities",
  "image": "ipfs://QmArtworkHash...",
  "animation_url": "ipfs://QmVisualizerHash...",
  "external_url": "https://sonicwave.com/nft/123",
  "attributes": [
    {
      "trait_type": "Artist",
      "value": "Artist Name"
    },
    {
      "trait_type": "Genre",
      "value": "Electronic"
    },
    {
      "trait_type": "Duration",
      "value": "3:45"
    },
    {
      "trait_type": "Release Year",
      "value": "2024"
    },
    {
      "trait_type": "Edition Type",
      "value": "Limited"
    },
    {
      "trait_type": "Rarity",
      "value": "Legendary"
    }
  ],
  "properties": {
    "audio_files": {
      "master": {
        "uri": "ipfs://QmMasterAudioHash...",
        "format": "FLAC",
        "bitrate": "lossless",
        "size": 45000000
      },
      "high_quality": {
        "uri": "ipfs://QmHighQualityHash...",
        "format": "MP3",
        "bitrate": "320kbps",
        "size": 9600000
      },
      "streaming": {
        "uri": "ipfs://QmStreamingHash...",
        "format": "MP3",
        "bitrate": "192kbps",
        "size": 5760000
      }
    },
    "exclusive_content": {
      "stems": [
        {
          "name": "Vocals",
          "uri": "ipfs://QmVocalsHash..."
        },
        {
          "name": "Instrumental",
          "uri": "ipfs://QmInstrumentalHash..."
        },
        {
          "name": "Drums",
          "uri": "ipfs://QmDrumsHash..."
        }
      ],
      "bonus_tracks": [
        {
          "name": "Acoustic Version",
          "uri": "ipfs://QmAcousticHash..."
        }
      ],
      "behind_the_scenes": {
        "video": "ipfs://QmBTSVideoHash...",
        "photos": ["ipfs://QmPhoto1Hash...", "ipfs://QmPhoto2Hash..."]
      }
    },
    "utilities": {
      "concert_access": true,
      "meet_and_greet": true,
      "merchandise_discount": 20,
      "future_drops_priority": true,
      "voting_rights": true
    },
    "royalties": {
      "percentage": 5.0,
      "recipient": "0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4"
    },
    "license": {
      "type": "Personal Use",
      "commercial_rights": false,
      "resale_rights": true,
      "streaming_rights": true
    }
  }
}
```

### 4. NFT Access Control System

#### TypeScript NFT Access Manager
```typescript
interface NFTAccessRights {
  tokenId: string;
  contractAddress: string;
  owner: string;
  accessLevel: 'owner' | 'granted' | 'public';
  permissions: {
    stream: boolean;
    download: boolean;
    exclusiveContent: boolean;
    stems: boolean;
    commercial: boolean;
  };
  expiresAt?: number;
}

class NFTAccessManager {
  private web3Provider: any;
  private contracts: Map<string, any> = new Map();
  
  constructor(provider: any) {
    this.web3Provider = provider;
  }
  
  async checkNFTAccess(
    contractAddress: string,
    tokenId: string,
    userAddress: string
  ): Promise<NFTAccessRights | null> {
    try {
      const contract = await this.getContract(contractAddress);
      
      // Check ownership
      const owner = await contract.ownerOf(tokenId);
      const hasGrantedAccess = await contract.hasAccess(tokenId, userAddress);
      
      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        return {
          tokenId,
          contractAddress,
          owner,
          accessLevel: 'owner',
          permissions: {
            stream: true,
            download: true,
            exclusiveContent: true,
            stems: true,
            commercial: true
          }
        };
      }
      
      if (hasGrantedAccess) {
        return {
          tokenId,
          contractAddress,
          owner,
          accessLevel: 'granted',
          permissions: {
            stream: true,
            download: false,
            exclusiveContent: true,
            stems: false,
            commercial: false
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error checking NFT access:', error);
      return null;
    }
  }
  
  async getNFTMetadata(contractAddress: string, tokenId: string): Promise<any> {
    try {
      const contract = await this.getContract(contractAddress);
      const tokenURI = await contract.tokenURI(tokenId);
      
      // Handle IPFS URIs
      const metadataUrl = tokenURI.startsWith('ipfs://') 
        ? `https://gateway.pinata.cloud/ipfs/${tokenURI.slice(7)}`
        : tokenURI;
      
      const response = await fetch(metadataUrl);
      return await response.json();
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return null;
    }
  }
  
  async getOwnedNFTs(userAddress: string): Promise<NFTAccessRights[]> {
    const ownedNFTs: NFTAccessRights[] = [];
    
    // Query multiple NFT contracts
    const contracts = await this.getSupportedContracts();
    
    for (const contractAddress of contracts) {
      try {
        const contract = await this.getContract(contractAddress);
        const balance = await contract.balanceOf(userAddress);
        
        for (let i = 0; i < balance; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
          const accessRights = await this.checkNFTAccess(contractAddress, tokenId, userAddress);
          
          if (accessRights) {
            ownedNFTs.push(accessRights);
          }
        }
      } catch (error) {
        console.error(`Error querying contract ${contractAddress}:`, error);
      }
    }
    
    return ownedNFTs;
  }
  
  private async getContract(contractAddress: string) {
    if (!this.contracts.has(contractAddress)) {
      const contract = new this.web3Provider.eth.Contract(
        NFT_ABI, // Contract ABI
        contractAddress
      );
      this.contracts.set(contractAddress, contract);
    }
    
    return this.contracts.get(contractAddress);
  }
}
```

### 5. NFT-Gated Audio Streaming

#### Protected Audio Player
```typescript
class NFTGatedAudioPlayer {
  private accessManager: NFTAccessManager;
  private ipfsGateways: string[];
  
  constructor(accessManager: NFTAccessManager) {
    this.accessManager = accessManager;
    this.ipfsGateways = [
      'https://gateway.pinata.cloud/ipfs/',
      'https://ipfs.infura.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/'
    ];
  }
  
  async playNFTTrack(
    contractAddress: string,
    tokenId: string,
    userAddress: string,
    quality: 'master' | 'high_quality' | 'streaming' = 'streaming'
  ): Promise<HTMLAudioElement | null> {
    try {
      // Check access rights
      const accessRights = await this.accessManager.checkNFTAccess(
        contractAddress,
        tokenId,
        userAddress
      );
      
      if (!accessRights) {
        throw new Error('No access to this NFT');
      }
      
      // Get metadata
      const metadata = await this.accessManager.getNFTMetadata(contractAddress, tokenId);
      
      // Check quality permissions
      if (quality === 'master' && !accessRights.permissions.download) {
        quality = 'high_quality';
      }
      
      // Get audio file IPFS hash
      const audioFile = metadata.properties.audio_files[quality];
      if (!audioFile) {
        throw new Error(`Quality ${quality} not available`);
      }
      
      // Create audio element with IPFS source
      const audio = new Audio();
      const audioUrl = await this.getOptimalIPFSUrl(audioFile.uri);
      
      audio.src = audioUrl;
      audio.crossOrigin = 'anonymous';
      
      // Add access control headers if needed
      this.addAccessControlHeaders(audio, accessRights);
      
      return audio;
    } catch (error) {
      console.error('Error playing NFT track:', error);
      return null;
    }
  }
  
  async getExclusiveContent(
    contractAddress: string,
    tokenId: string,
    userAddress: string,
    contentType: 'stems' | 'bonus_tracks' | 'behind_the_scenes'
  ): Promise<any[]> {
    const accessRights = await this.accessManager.checkNFTAccess(
      contractAddress,
      tokenId,
      userAddress
    );
    
    if (!accessRights?.permissions.exclusiveContent) {
      throw new Error('No access to exclusive content');
    }
    
    const metadata = await this.accessManager.getNFTMetadata(contractAddress, tokenId);
    const exclusiveContent = metadata.properties.exclusive_content[contentType];
    
    if (!exclusiveContent) {
      return [];
    }
    
    // Convert IPFS URIs to accessible URLs
    return await Promise.all(
      exclusiveContent.map(async (item: any) => ({
        ...item,
        url: await this.getOptimalIPFSUrl(item.uri)
      }))
    );
  }
  
  private async getOptimalIPFSUrl(ipfsUri: string): Promise<string> {
    const hash = ipfsUri.replace('ipfs://', '');
    
    // Test gateways and return fastest
    const gatewayPromises = this.ipfsGateways.map(async (gateway) => {
      const url = `${gateway}${hash}`;
      const start = performance.now();
      
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return { url, latency: performance.now() - start };
        }
      } catch (error) {
        return { url, latency: Infinity };
      }
      
      return { url, latency: Infinity };
    });
    
    const results = await Promise.all(gatewayPromises);
    const fastest = results.reduce((prev, current) => 
      prev.latency < current.latency ? prev : current
    );
    
    return fastest.url;
  }
  
  private addAccessControlHeaders(audio: HTMLAudioElement, accessRights: NFTAccessRights) {
    // Add custom headers for access control
    const originalFetch = window.fetch;
    window.fetch = async (input, init = {}) => {
      if (typeof input === 'string' && input.includes('ipfs')) {
        init.headers = {
          ...init.headers,
          'X-NFT-Token': accessRights.tokenId,
          'X-NFT-Contract': accessRights.contractAddress,
          'X-Access-Level': accessRights.accessLevel
        };
      }
      return originalFetch(input, init);
    };
  }
}
```

### 6. NFT Marketplace Integration

#### NFT Trading Interface
```typescript
interface NFTListing {
  tokenId: string;
  contractAddress: string;
  seller: string;
  price: string;
  currency: 'ETH' | 'MATIC' | 'USDC';
  listingType: 'fixed' | 'auction';
  expiresAt: number;
  metadata: any;
}

class NFTMarketplace {
  private web3Provider: any;
  private marketplaceContract: any;
  
  async listNFT(
    contractAddress: string,
    tokenId: string,
    price: string,
    currency: string = 'ETH'
  ): Promise<string> {
    try {
      // Approve marketplace to transfer NFT
      const nftContract = new this.web3Provider.eth.Contract(NFT_ABI, contractAddress);
      await nftContract.methods.approve(this.marketplaceContract.options.address, tokenId).send();
      
      // List NFT on marketplace
      const tx = await this.marketplaceContract.methods.listNFT(
        contractAddress,
        tokenId,
        this.web3Provider.utils.toWei(price, 'ether')
      ).send();
      
      return tx.transactionHash;
    } catch (error) {
      console.error('Error listing NFT:', error);
      throw error;
    }
  }
  
  async buyNFT(listingId: string, price: string): Promise<string> {
    try {
      const tx = await this.marketplaceContract.methods.buyNFT(listingId).send({
        value: this.web3Provider.utils.toWei(price, 'ether')
      });
      
      return tx.transactionHash;
    } catch (error) {
      console.error('Error buying NFT:', error);
      throw error;
    }
  }
  
  async getActiveListings(): Promise<NFTListing[]> {
    try {
      const listings = await this.marketplaceContract.methods.getActiveListings().call();
      
      return await Promise.all(
        listings.map(async (listing: any) => {
          const metadata = await this.getNFTMetadata(listing.contractAddress, listing.tokenId);
          
          return {
            tokenId: listing.tokenId,
            contractAddress: listing.contractAddress,
            seller: listing.seller,
            price: this.web3Provider.utils.fromWei(listing.price, 'ether'),
            currency: 'ETH',
            listingType: 'fixed',
            expiresAt: listing.expiresAt,
            metadata
          };
        })
      );
    } catch (error) {
      console.error('Error fetching listings:', error);
      return [];
    }
  }
}
```

### 7. NFT Analytics & Insights

#### NFT Performance Tracking
```typescript
interface NFTAnalytics {
  tokenId: string;
  contractAddress: string;
  metrics: {
    totalPlays: number;
    uniqueListeners: number;
    averageListenTime: number;
    skipRate: number;
    shareCount: number;
    favoriteCount: number;
  };
  trading: {
    floorPrice: string;
    lastSalePrice: string;
    totalVolume: string;
    priceHistory: Array<{
      price: string;
      timestamp: number;
      buyer: string;
      seller: string;
    }>;
  };
  engagement: {
    communitySize: number;
    socialMentions: number;
    utilityUsage: {
      concertAccess: number;
      merchandiseDiscounts: number;
      votingParticipation: number;
    };
  };
}

class NFTAnalyticsService {
  async getTokenAnalytics(contractAddress: string, tokenId: string): Promise<NFTAnalytics> {
    const [metrics, trading, engagement] = await Promise.all([
      this.getPlaybackMetrics(contractAddress, tokenId),
      this.getTradingMetrics(contractAddress, tokenId),
      this.getEngagementMetrics(contractAddress, tokenId)
    ]);
    
    return {
      tokenId,
      contractAddress,
      metrics,
      trading,
      engagement
    };
  }
  
  async getCollectionAnalytics(contractAddress: string): Promise<any> {
    // Implementation for collection-wide analytics
    return {
      totalSupply: 0,
      uniqueHolders: 0,
      floorPrice: '0',
      totalVolume: '0',
      averageHoldTime: 0
    };
  }
  
  private async getPlaybackMetrics(contractAddress: string, tokenId: string) {
    // Query analytics database or blockchain events
    return {
      totalPlays: 1250,
      uniqueListeners: 890,
      averageListenTime: 180,
      skipRate: 0.15,
      shareCount: 45,
      favoriteCount: 123
    };
  }
  
  private async getTradingMetrics(contractAddress: string, tokenId: string) {
    // Query marketplace contracts and price feeds
    return {
      floorPrice: '0.5',
      lastSalePrice: '0.8',
      totalVolume: '12.5',
      priceHistory: []
    };
  }
  
  private async getEngagementMetrics(contractAddress: string, tokenId: string) {
    // Query social platforms and utility usage
    return {
      communitySize: 2500,
      socialMentions: 150,
      utilityUsage: {
        concertAccess: 45,
        merchandiseDiscounts: 78,
        votingParticipation: 234
      }
    };
  }
}
```

### 8. Cross-Chain NFT Support

#### Multi-Chain Architecture
```typescript
interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  nftContracts: string[];
  marketplaceContract: string;
  currency: string;
  blockExplorer: string;
}

const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
    nftContracts: ['0x...'],
    marketplaceContract: '0x...',
    currency: 'ETH',
    blockExplorer: 'https://etherscan.io'
  },
  {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    nftContracts: ['0x...'],
    marketplaceContract: '0x...',
    currency: 'MATIC',
    blockExplorer: 'https://polygonscan.com'
  },
  {
    chainId: 56,
    name: 'BSC',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    nftContracts: ['0x...'],
    marketplaceContract: '0x...',
    currency: 'BNB',
    blockExplorer: 'https://bscscan.com'
  }
];

class CrossChainNFTManager {
  private providers: Map<number, any> = new Map();
  private accessManagers: Map<number, NFTAccessManager> = new Map();
  
  constructor() {
    this.initializeChains();
  }
  
  private initializeChains() {
    SUPPORTED_CHAINS.forEach(chain => {
      const provider = new Web3(chain.rpcUrl);
      this.providers.set(chain.chainId, provider);
      this.accessManagers.set(chain.chainId, new NFTAccessManager(provider));
    });
  }
  
  async getUserNFTsAcrossChains(userAddress: string): Promise<NFTAccessRights[]> {
    const allNFTs: NFTAccessRights[] = [];
    
    const promises = SUPPORTED_CHAINS.map(async (chain) => {
      try {
        const accessManager = this.accessManagers.get(chain.chainId);
        if (accessManager) {
          const nfts = await accessManager.getOwnedNFTs(userAddress);
          return nfts.map(nft => ({ ...nft, chainId: chain.chainId, chainName: chain.name }));
        }
        return [];
      } catch (error) {
        console.error(`Error fetching NFTs from ${chain.name}:`, error);
        return [];
      }
    });
    
    const results = await Promise.all(promises);
    results.forEach(chainNFTs => allNFTs.push(...chainNFTs));
    
    return allNFTs;
  }
  
  async bridgeNFT(
    fromChainId: number,
    toChainId: number,
    contractAddress: string,
    tokenId: string
  ): Promise<string> {
    // Implementation for cross-chain NFT bridging
    // This would involve bridge contracts and cross-chain messaging
    throw new Error('Cross-chain bridging not implemented yet');
  }
}
```

## Performance Optimization

### 1. Streaming Optimization

#### Adaptive Bitrate Streaming
```typescript
interface StreamingConfig {
  connection: 'slow' | 'medium' | 'fast';
  bitrate: 128 | 192 | 320;
  format: 'mp3' | 'aac' | 'opus';
  preload: boolean;
}

const getOptimalStream = (networkSpeed: number): StreamingConfig => {
  if (networkSpeed < 1) return { connection: 'slow', bitrate: 128, format: 'mp3', preload: false };
  if (networkSpeed < 5) return { connection: 'medium', bitrate: 192, format: 'mp3', preload: true };
  return { connection: 'fast', bitrate: 320, format: 'mp3', preload: true };
};
```

#### Progressive Loading
```typescript
class IPFSAudioPlayer {
  private bufferSize = 1024 * 1024; // 1MB chunks
  private preloadBuffer = 3; // Preload 3 chunks ahead
  
  async streamAudio(ipfsHash: string, startTime: number = 0) {
    const gateways = this.getAvailableGateways();
    const chunks = await this.loadAudioChunks(ipfsHash, gateways, startTime);
    return this.createAudioStream(chunks);
  }
}
```

### 2. Caching Strategy

#### Multi-Level Caching
```
┌─────────────────┐
│ Browser Cache   │ ← 1 hour TTL
├─────────────────┤
│ Service Worker  │ ← 24 hours TTL
├─────────────────┤
│ CDN Cache       │ ← 7 days TTL
├─────────────────┤
│ IPFS Gateway    │ ← Permanent (content-addressed)
└─────────────────┘
```

#### Cache Implementation
```typescript
class IPFSCache {
  private indexedDB: IDBDatabase;
  private maxCacheSize = 500 * 1024 * 1024; // 500MB
  
  async cacheTrack(hash: string, audioData: ArrayBuffer) {
    if (await this.getCacheSize() > this.maxCacheSize) {
      await this.evictOldestTracks();
    }
    await this.storeInIndexedDB(hash, audioData);
  }
  
  async getTrack(hash: string): Promise<ArrayBuffer | null> {
    return await this.getFromIndexedDB(hash);
  }
}
```

## Implementation Phases

### Phase 1: Infrastructure Setup (Weeks 1-2)

#### Tasks:
- [ ] Set up IPFS node infrastructure
- [ ] Configure multiple gateway endpoints
- [ ] Implement basic IPFS client integration
- [ ] Create file upload pipeline to IPFS
- [ ] Set up pinning services (Pinata, Web3.Storage)
- [ ] Deploy NFT smart contracts (ERC-721 & ERC-1155)
- [ ] Set up Web3 provider integration
- [ ] Configure multi-chain support (Ethereum, Polygon, BSC)

#### Deliverables:
- IPFS node running on custom domain
- Gateway load balancer configuration
- Basic file upload/retrieval functionality
- NFT smart contracts deployed and verified
- Multi-chain Web3 integration

### Phase 2: Audio Processing & NFT Pipeline (Weeks 3-4)

#### Tasks:
- [ ] Implement multi-format audio encoding
- [ ] Create metadata extraction and storage
- [ ] Build batch processing for existing music library
- [ ] Implement progress tracking for uploads
- [ ] Add file validation and error handling
- [ ] Build NFT minting pipeline
- [ ] Create NFT metadata generation system
- [ ] Implement exclusive content packaging
- [ ] Add royalty and licensing management

#### Deliverables:
- Automated audio processing pipeline
- Migration tool for existing music files
- Quality assurance testing suite
- NFT minting and metadata system
- Exclusive content management tools

### Phase 3: NFT-Gated Streaming Implementation (Weeks 5-6)

#### Tasks:
- [ ] Build IPFS audio player component
- [ ] Implement adaptive bitrate streaming
- [ ] Add progressive loading and buffering
- [ ] Create fallback mechanisms for gateway failures
- [ ] Implement offline playback capabilities
- [ ] Build NFT access control system
- [ ] Create NFT-gated audio player
- [ ] Implement exclusive content streaming
- [ ] Add wallet connection and authentication
- [ ] Build NFT collection viewer

#### Deliverables:
- Enhanced audio player with IPFS support
- Streaming performance optimization
- Offline-first architecture
- NFT access control system
- Exclusive content streaming platform

### Phase 4: Performance & Marketplace (Weeks 7-8)

#### Tasks:
- [ ] Implement multi-level caching strategy
- [ ] Add network speed detection
- [ ] Create preloading algorithms
- [ ] Optimize for mobile networks
- [ ] Add performance monitoring
- [ ] Build NFT marketplace interface
- [ ] Implement trading functionality
- [ ] Add auction and bidding system
- [ ] Create NFT analytics dashboard
- [ ] Implement cross-chain bridging

#### Deliverables:
- Sub-3-second initial load times
- Smooth playback on slow connections
- Performance analytics dashboard
- Fully functional NFT marketplace
- Cross-chain NFT support

### Phase 5: Production Deployment & Community (Weeks 9-10)

#### Tasks:
- [ ] Gradual rollout to beta users
- [ ] Monitor performance metrics
- [ ] Implement A/B testing
- [ ] Create admin tools for content management
- [ ] Documentation and training
- [ ] Launch NFT creator tools
- [ ] Implement community features
- [ ] Add governance token integration
- [ ] Create artist onboarding program
- [ ] Launch marketing campaign

#### Deliverables:
- Production-ready IPFS music streaming
- Admin dashboard for content management
- User documentation and support materials
- NFT creator platform
- Community governance system

## Technical Requirements

### Frontend Dependencies
```json
{
  "ipfs-http-client": "^60.0.0",
  "ipfs-core": "^0.18.0",
  "hls.js": "^1.4.0",
  "workbox-webpack-plugin": "^7.0.0",
  "idb": "^7.1.0",
  "web3": "^4.0.0",
  "ethers": "^6.0.0",
  "@metamask/sdk": "^0.14.0",
  "@walletconnect/web3-provider": "^1.8.0",
  "@openzeppelin/contracts": "^4.9.0",
  "ipfs-only-hash": "^4.0.0",
  "multihashes": "^4.0.3"
}
```

### Backend Services
```yaml
services:
  ipfs-node:
    image: ipfs/go-ipfs:latest
    ports:
      - "4001:4001"
      - "5001:5001"
      - "8080:8080"
    volumes:
      - ipfs_data:/data/ipfs
    environment:
      - IPFS_PROFILE=server
      
  gateway-lb:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      
  audio-processor:
    build: ./audio-processor
    environment:
      - IPFS_API_URL=http://ipfs-node:5001
      - PINATA_API_KEY=${PINATA_API_KEY}
      
  nft-indexer:
    build: ./nft-indexer
    environment:
      - ETHEREUM_RPC_URL=${ETHEREUM_RPC_URL}
      - POLYGON_RPC_URL=${POLYGON_RPC_URL}
      - BSC_RPC_URL=${BSC_RPC_URL}
      - DATABASE_URL=${DATABASE_URL}
      
  blockchain-listener:
    build: ./blockchain-listener
    environment:
      - WEB3_PROVIDER_URL=${WEB3_PROVIDER_URL}
      - CONTRACT_ADDRESSES=${CONTRACT_ADDRESSES}
      - WEBHOOK_URL=${WEBHOOK_URL}
      
  metadata-api:
    build: ./metadata-api
    ports:
      - "3001:3001"
    environment:
      - IPFS_GATEWAY_URL=${IPFS_GATEWAY_URL}
      - DATABASE_URL=${DATABASE_URL}
```

### Audio Processing Pipeline
```typescript
interface AudioProcessor {
  formats: ['mp3', 'aac', 'opus'];
  bitrates: [128, 192, 320];
  
  async processAudio(file: File): Promise<ProcessedAudio> {
    const metadata = await this.extractMetadata(file);
    const formats = await this.encodeMultipleFormats(file);
    const ipfsHashes = await this.uploadToIPFS(formats);
    
    return {
      metadata,
      ipfsHashes,
      originalSize: file.size,
      processedSizes: formats.map(f => f.size)
    };
  }
}
```

## Latency Mitigation

### 1. Geographic Distribution

#### Gateway Selection Algorithm
```typescript
class GatewaySelector {
  async selectOptimalGateway(userLocation: string): Promise<Gateway> {
    const gateways = await this.getAvailableGateways();
    const latencies = await this.measureLatencies(gateways);
    
    return gateways
      .sort((a, b) => latencies[a.id] - latencies[b.id])
      .find(g => g.status === 'healthy') || gateways[0];
  }
  
  async measureLatencies(gateways: Gateway[]): Promise<Record<string, number>> {
    const measurements = await Promise.all(
      gateways.map(async (gateway) => {
        const start = performance.now();
        await fetch(`${gateway.url}ping`);
        const latency = performance.now() - start;
        return { id: gateway.id, latency };
      })
    );
    
    return measurements.reduce((acc, { id, latency }) => {
      acc[id] = latency;
      return acc;
    }, {} as Record<string, number>);
  }
}
```

### 2. Predictive Preloading

#### Smart Preloading Strategy
```typescript
class PreloadManager {
  private preloadQueue: string[] = [];
  private maxPreloadSize = 50 * 1024 * 1024; // 50MB
  
  async predictNextTracks(currentTrack: string, playlist: string[]): Promise<string[]> {
    const currentIndex = playlist.indexOf(currentTrack);
    const nextTracks = playlist.slice(currentIndex + 1, currentIndex + 4);
    
    // Consider user listening patterns
    const userPreferences = await this.getUserListeningPatterns();
    const predictedTracks = this.applyMLPrediction(nextTracks, userPreferences);
    
    return predictedTracks;
  }
  
  async preloadTracks(tracks: string[]) {
    for (const track of tracks) {
      if (this.getCurrentCacheSize() < this.maxPreloadSize) {
        await this.preloadTrack(track);
      }
    }
  }
}
```

### 3. Network Optimization

#### Connection Quality Detection
```typescript
class NetworkMonitor {
  private connection = (navigator as any).connection;
  
  getConnectionQuality(): 'slow' | 'medium' | 'fast' {
    if (!this.connection) return 'medium';
    
    const { effectiveType, downlink } = this.connection;
    
    if (effectiveType === '4g' && downlink > 10) return 'fast';
    if (effectiveType === '3g' || (effectiveType === '4g' && downlink > 1)) return 'medium';
    return 'slow';
  }
  
  onConnectionChange(callback: (quality: string) => void) {
    this.connection?.addEventListener('change', () => {
      callback(this.getConnectionQuality());
    });
  }
}
```

## Cost Analysis

### Monthly Costs (Estimated)

#### IPFS & NFT Infrastructure
| Service | Cost | Description |
|---------|------|-------------|
| Pinata Pro | $20/month | 1TB storage + bandwidth |
| Web3.Storage | $0 | Free tier (100GB) |
| Infura IPFS | $50/month | Dedicated gateway |
| Custom IPFS Node | $100/month | VPS + bandwidth |
| CDN (Cloudflare) | $20/month | Global edge caching |
| Infura Web3 API | $50/month | Ethereum/Polygon RPC |
| Alchemy API | $30/month | Multi-chain indexing |
| NFT Indexing Service | $40/month | Cross-chain NFT data |
| Smart Contract Gas | $200/month | Deployment & operations |
| **Total** | **$510/month** | For ~1TB + NFT infrastructure |

#### Comparison with Traditional Storage
| Solution | Monthly Cost | Bandwidth Cost | Scalability |
|----------|--------------|----------------|-------------|
| AWS S3 + CloudFront | $150/month | $0.085/GB | High |
| IPFS + Gateways | $190/month | Included | Very High |
| Supabase Storage | $100/month | Limited | Medium |

### Cost Optimization Strategies
1. **Community Pinning**: Incentivize users to pin content
2. **Selective Pinning**: Only pin popular tracks on premium services
3. **Compression**: Use advanced audio codecs (Opus, AAC)
4. **Tiered Storage**: Move old content to cheaper pinning services

## Security Considerations

### 1. Content Protection

#### DRM Alternative for IPFS
```typescript
class ContentProtection {
  async encryptAudio(audioBuffer: ArrayBuffer, key: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(key),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      audioBuffer
    );
    
    return new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
  }
  
  async decryptAudio(encryptedBuffer: ArrayBuffer, key: string): Promise<ArrayBuffer> {
    const iv = encryptedBuffer.slice(0, 12);
    const data = encryptedBuffer.slice(12);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(key),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    return await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );
  }
}
```

### 2. Access Control

#### Token-Based Access
```typescript
interface AccessToken {
  trackId: string;
  userId: string;
  permissions: ['stream', 'download'];
  expiresAt: number;
  signature: string;
}

class AccessController {
  async generateAccessToken(trackId: string, userId: string): Promise<string> {
    const token: AccessToken = {
      trackId,
      userId,
      permissions: ['stream'],
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      signature: await this.signToken(trackId, userId)
    };
    
    return btoa(JSON.stringify(token));
  }
  
  async validateAccess(token: string, trackId: string): Promise<boolean> {
    try {
      const decoded: AccessToken = JSON.parse(atob(token));
      return decoded.trackId === trackId && 
             decoded.expiresAt > Date.now() &&
             await this.verifySignature(decoded);
    } catch {
      return false;
    }
  }
}
```

## Monitoring & Analytics

### Performance Metrics
```typescript
interface IPFSMetrics {
  gatewayLatency: Record<string, number>;
  downloadSpeed: number;
  cacheHitRate: number;
  errorRate: number;
  userExperience: {
    timeToFirstByte: number;
    bufferingEvents: number;
    playbackQuality: string;
  };
}

class MetricsCollector {
  async collectMetrics(): Promise<IPFSMetrics> {
    return {
      gatewayLatency: await this.measureGatewayLatencies(),
      downloadSpeed: await this.measureDownloadSpeed(),
      cacheHitRate: this.calculateCacheHitRate(),
      errorRate: this.calculateErrorRate(),
      userExperience: await this.collectUXMetrics()
    };
  }
}
```

## Migration Strategy

### Gradual Rollout Plan

#### Phase 1: Beta Users (10%)
- Enable IPFS for new uploads only
- Maintain fallback to traditional storage
- Collect performance data

#### Phase 2: Power Users (25%)
- Migrate popular tracks to IPFS
- A/B test streaming performance
- Optimize based on feedback

#### Phase 3: General Availability (100%)
- Full IPFS migration
- Remove traditional storage dependencies
- Monitor and optimize continuously

### Rollback Strategy
```typescript
class MigrationController {
  private ipfsEnabled = false;
  
  async getAudioUrl(trackId: string): Promise<string> {
    if (this.ipfsEnabled && await this.isTrackOnIPFS(trackId)) {
      try {
        return await this.getIPFSUrl(trackId);
      } catch (error) {
        console.warn('IPFS failed, falling back to traditional storage', error);
        return await this.getTraditionalUrl(trackId);
      }
    }
    
    return await this.getTraditionalUrl(trackId);
  }
}
```

## Success Metrics

### Key Performance Indicators (KPIs)

1. **Latency Metrics**
   - Time to first byte: < 500ms
   - Initial playback: < 3 seconds
   - Buffer underruns: < 1%
   - NFT access verification: < 1 second

2. **Availability Metrics**
   - Gateway uptime: > 99.9%
   - Content availability: > 99.99%
   - Failover time: < 2 seconds
   - Smart contract uptime: > 99.95%

3. **User Experience**
   - Playback success rate: > 99%
   - User satisfaction score: > 4.5/5
   - Bounce rate improvement: > 20%
   - NFT holder retention: > 85%

4. **Cost Efficiency**
   - Storage cost reduction: > 30%
   - Bandwidth cost optimization: > 40%
   - Infrastructure scalability: 10x capacity
   - Gas cost optimization: < $5 per NFT mint

5. **NFT Ecosystem Metrics**
   - NFT trading volume: > $100K/month
   - Active NFT holders: > 1,000
   - Average NFT hold time: > 6 months
   - Creator royalty distribution: > $10K/month
   - Cross-chain adoption: > 3 networks

6. **Community Engagement**
   - Exclusive content access rate: > 70%
   - Utility feature usage: > 50%
   - Community governance participation: > 30%
   - Artist-fan interaction increase: > 200%

## Conclusion

This IPFS implementation plan provides a comprehensive roadmap for migrating Sonic Wave to decentralized music storage while maintaining optimal streaming performance. The phased approach ensures minimal disruption to users while gradually building a more resilient, scalable, and cost-effective infrastructure.

The combination of multiple IPFS gateways, intelligent caching, predictive preloading, and adaptive streaming will deliver a superior user experience while embracing the benefits of decentralization.

## Next Steps

1. **Technical Proof of Concept** (Week 1)
   - Set up basic IPFS node and gateway
   - Test audio streaming with sample files
   - Measure baseline performance metrics

2. **Stakeholder Review** (Week 2)
   - Present plan to development team
   - Review budget and timeline
   - Finalize implementation priorities

3. **Development Sprint Planning** (Week 3)
   - Break down tasks into development sprints
   - Assign team members to specific components
   - Set up development and testing environments

---

*This document will be updated as implementation progresses and new requirements emerge.*