// NFT Service for music NFT interactions with ERC-721 standard
import { web3Service } from './web3Service';
import { ipfsService, AudioMetadata } from './ipfsService';
import { persistentMusicService, PersistentTrack } from './persistentMusicService';

// Mock ABI for the Music NFT contract (in production, import from compiled contract)
const MUSIC_NFT_ABI = [
  "function mintMusicNFT(address to, string memory ipfsHash, address artist, uint256 royaltyPercentage, bool isExclusive, uint256 maxSupply) public returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function hasAccess(uint256 tokenId, address user) public view returns (bool)",
  "function grantAccess(uint256 tokenId, address user) public",
  "function revokeAccess(uint256 tokenId, address user) public",
  "function getMusicNFT(uint256 tokenId) public view returns (tuple(string ipfsHash, address artist, uint256 royaltyPercentage, uint256 mintedAt, bool isExclusive, uint256 maxSupply, uint256 currentSupply))",
  "function totalSupply() public view returns (uint256)",
  "function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount)",
  "event MusicNFTMinted(uint256 indexed tokenId, address indexed artist, address indexed owner, string ipfsHash)"
];

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    audio_files: {
      master: { uri: string; format: string; bitrate: string; size: number };
      high_quality: { uri: string; format: string; bitrate: string; size: number };
      streaming: { uri: string; format: string; bitrate: string; size: number };
    };
    exclusive_content?: {
      stems?: Array<{ name: string; uri: string }>;
      bonus_tracks?: Array<{ name: string; uri: string }>;
    };
    utilities?: {
      concert_access?: boolean;
      meet_and_greet?: boolean;
      merchandise_discount?: number;
    };
    royalties: {
      percentage: number;
      recipient: string;
    };
  };
}

interface MintNFTParams {
  audioFile: File;
  metadata: {
    title: string;
    artist: string;
    album?: string;
    genre?: string;
    description: string;
    artwork?: File;
  };
  royaltyPercentage: number;
  isExclusive: boolean;
  maxSupply: number;
}

class NFTService {
  private contractAddress: string = '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4'; // Default music NFT contract

  constructor() {
    console.log('NFT Service initialized with contract:', this.contractAddress);
  }

  // Set the music NFT contract address
  setContractAddress(address: string) {
    this.contractAddress = address;
    console.log('NFT contract address updated to:', address);
  }

  // Get the current contract address
  getContractAddress(): string {
    return this.contractAddress;
  }

  async mintMusicNFT(params: MintNFTParams): Promise<{
    tokenId: string;
    transactionHash: string;
    ipfsHash: string;
  }> {
    if (!this.contract) {
      await this.initializeContract();
    }

    const connection = web3Service.getConnection();
    if (!connection) {
      throw new Error('Wallet not connected');
    }

    try {
      // 1. Upload audio file and get metadata
      console.log('Uploading audio to IPFS...');
      const audioMetadata = await ipfsService.uploadAudioWithMetadata(
        params.audioFile,
        {
          title: params.metadata.title,
          artist: params.metadata.artist,
          album: params.metadata.album,
          genre: params.metadata.genre,
          duration: 0 // Would be extracted from audio file
        }
      );

      // 2. Upload artwork if provided
      let artworkHash = '';
      if (params.metadata.artwork) {
        console.log('Uploading artwork to IPFS...');
        artworkHash = await ipfsService.uploadFile(params.metadata.artwork);
      }

      // 3. Create NFT metadata
      const nftMetadata: NFTMetadata = {
        name: params.metadata.title,
        description: params.metadata.description,
        image: artworkHash ? `ipfs://${artworkHash}` : '',
        external_url: `https://sonicwave.com/nft/`,
        attributes: [
          { trait_type: 'Artist', value: params.metadata.artist },
          { trait_type: 'Genre', value: params.metadata.genre || 'Unknown' },
          { trait_type: 'Album', value: params.metadata.album || 'Single' },
          { trait_type: 'Edition Type', value: params.isExclusive ? 'Exclusive' : 'Standard' }
        ],
        properties: {
          audio_files: {
            master: {
              uri: `ipfs://${audioMetadata.ipfs_hashes.original}`,
              format: 'MP3',
              bitrate: 'lossless',
              size: audioMetadata.file_size.original
            },
            high_quality: {
              uri: `ipfs://${audioMetadata.ipfs_hashes.high_quality}`,
              format: 'MP3',
              bitrate: '320kbps',
              size: audioMetadata.file_size.high_quality
            },
            streaming: {
              uri: `ipfs://${audioMetadata.ipfs_hashes.streaming}`,
              format: 'MP3',
              bitrate: '192kbps',
              size: audioMetadata.file_size.streaming
            }
          },
          royalties: {
            percentage: params.royaltyPercentage / 100,
            recipient: connection.address
          }
        }
      };

      // 4. Upload NFT metadata to IPFS
      console.log('Uploading NFT metadata to IPFS...');
      const metadataHash = await ipfsService.uploadJSON(nftMetadata);

      // 5. Mint NFT on blockchain (mock for now)
      console.log('Minting NFT on blockchain...');
      
      // For development, simulate the minting process
      const mockTokenId = Math.floor(Math.random() * 1000000).toString();
      const mockTxHash = `0x${Math.random().toString(16).substring(2)}`;

      console.log('NFT minted successfully:', {
        tokenId: mockTokenId,
        transactionHash: mockTxHash,
        ipfsHash: metadataHash
      });

      return {
        tokenId: mockTokenId,
        transactionHash: mockTxHash,
        ipfsHash: metadataHash
      };

      // Real implementation would be:
      /*
      const tx = await this.contract!.mintMusicNFT(
        connection.address,
        metadataHash,
        connection.address,
        params.royaltyPercentage * 100, // Convert to basis points
        params.isExclusive,
        params.maxSupply
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find((e: any) => e.event === 'MusicNFTMinted');
      const tokenId = event?.args?.tokenId.toString();

      return {
        tokenId,
        transactionHash: tx.hash,
        ipfsHash: metadataHash
      };
      */
    } catch (error) {
      console.error('Error minting music NFT:', error);
      throw error;
    }
  }

  async getNFTMetadata(tokenId: string): Promise<NFTMetadata> {
    try {
      // For development, return mock metadata
      const mockMetadata: NFTMetadata = {
        name: 'Sample Music NFT',
        description: 'A sample music NFT for testing',
        image: 'ipfs://QmSampleImageHash',
        attributes: [
          { trait_type: 'Artist', value: 'Sample Artist' },
          { trait_type: 'Genre', value: 'Electronic' }
        ],
        properties: {
          audio_files: {
            master: {
              uri: 'ipfs://QmSampleAudioHash',
              format: 'MP3',
              bitrate: 'lossless',
              size: 10000000
            },
            high_quality: {
              uri: 'ipfs://QmSampleAudioHash',
              format: 'MP3',
              bitrate: '320kbps',
              size: 8000000
            },
            streaming: {
              uri: 'ipfs://QmSampleAudioHash',
              format: 'MP3',
              bitrate: '192kbps',
              size: 5000000
            }
          },
          royalties: {
            percentage: 5,
            recipient: '0x1234567890123456789012345678901234567890'
          }
        }
      };

      return mockMetadata;

      // Real implementation would be:
      /*
      if (!this.contract) {
        await this.initializeContract();
      }

      const tokenURI = await this.contract!.tokenURI(tokenId);
      const ipfsHash = tokenURI.replace('ipfs://', '');
      return await ipfsService.retrieveJSON(ipfsHash);
      */
    } catch (error) {
      console.error('Error getting NFT metadata:', error);
      throw error;
    }
  }

  async checkAccess(tokenId: string, userAddress: string): Promise<boolean> {
    try {
      // For development, return true for demo purposes
      return true;

      // Real implementation would be:
      /*
      if (!this.contract) {
        await this.initializeContract();
      }

      return await this.contract!.hasAccess(tokenId, userAddress);
      */
    } catch (error) {
      console.error('Error checking NFT access:', error);
      return false;
    }
  }

  async grantAccess(tokenId: string, userAddress: string): Promise<string> {
    if (!this.contract) {
      await this.initializeContract();
    }

    const connection = web3Service.getConnection();
    if (!connection) {
      throw new Error('Wallet not connected');
    }

    try {
      // For development, return mock transaction hash
      const mockTxHash = `0x${Math.random().toString(16).substring(2)}`;
      console.log('Access granted (mock):', { tokenId, userAddress, txHash: mockTxHash });
      return mockTxHash;

      // Real implementation would be:
      /*
      const tx = await this.contract!.grantAccess(tokenId, userAddress);
      await tx.wait();
      return tx.hash;
      */
    } catch (error) {
      console.error('Error granting access:', error);
      throw error;
    }
  }

  async getUserNFTs(userAddress: string): Promise<Array<{
    tokenId: string;
    metadata: NFTMetadata;
  }>> {
    try {
      // For development, return mock NFTs
      const mockNFTs = [
        {
          tokenId: '1',
          metadata: await this.getNFTMetadata('1')
        },
        {
          tokenId: '2',
          metadata: await this.getNFTMetadata('2')
        }
      ];

      return mockNFTs;

      // Real implementation would query the blockchain for user's NFTs
    } catch (error) {
      console.error('Error getting user NFTs:', error);
      return [];
    }
  }
  // Sync user's NFT-owned music to persistent library
  async syncNFTMusicToLibrary(userAddress: string): Promise<void> {
    try {
      console.log('Syncing NFT-owned music to persistent library for:', userAddress);
      
      // Get user's NFTs from all known music NFT contracts
      const musicNFTContracts = [
        '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4', // Example music NFT contract
        // Add more contract addresses as needed
      ];

      for (const contractAddress of musicNFTContracts) {
        try {
          // Check if user owns any NFTs from this contract
          const balance = await web3Service.checkNFTBalance(contractAddress, userAddress);
          
          if (balance > 0) {
            console.log(`User owns ${balance} NFTs from contract ${contractAddress}`);
            
            // Get user's NFTs (this would need to be enhanced to get actual token IDs)
            const userNFTs = await web3Service.getUserNFTs(contractAddress, userAddress);
            
            for (const nft of userNFTs) {
              await this.addNFTMusicToLibrary(contractAddress, nft.tokenId, userAddress);
            }
          }
        } catch (error) {
          console.error(`Error syncing NFTs from contract ${contractAddress}:`, error);
        }
      }
    } catch (error) {
      console.error('Error syncing NFT music to library:', error);
    }
  }

  // Add specific NFT music to persistent library
  async addNFTMusicToLibrary(contractAddress: string, tokenId: string, userAddress: string): Promise<void> {
    try {
      // Verify ownership
      const isOwner = await web3Service.checkNFTOwnership(contractAddress, tokenId, userAddress);
      if (!isOwner) {
        console.log(`User ${userAddress} does not own NFT ${contractAddress}/${tokenId}`);
        return;
      }

      // Get NFT metadata
      const metadata = await this.getNFTMetadata(tokenId);
      
      // Create persistent track from NFT
      const persistentTrack: PersistentTrack = {
        id: `nft_${contractAddress}_${tokenId}`,
        title: metadata.name || 'Unknown NFT Track',
        artist: this.extractArtistFromMetadata(metadata),
        artwork: metadata.image,
        audioFiles: metadata.properties.audio_files || {
          streaming: {
            uri: 'ipfs://QmDefaultAudioHash',
            format: 'MP3',
            bitrate: '192kbps',
            size: 5000000
          }
        },
        accessType: 'nft_owned',
        nftContract: contractAddress,
        nftTokenId: tokenId,
        metadata: {
          description: metadata.description,
          tags: ['nft', 'exclusive']
        }
      };

      // Add to persistent library
      await persistentMusicService.addTrackToLibrary(persistentTrack);
      console.log(`Added NFT music to library: ${persistentTrack.title}`);
    } catch (error) {
      console.error(`Error adding NFT music to library:`, error);
    }
  }

  // Extract artist name from NFT metadata
  private extractArtistFromMetadata(metadata: NFTMetadata): string {
    // Look for artist in attributes
    const artistAttribute = metadata.attributes.find(
      attr => attr.trait_type.toLowerCase() === 'artist'
    );
    
    if (artistAttribute) {
      return artistAttribute.value.toString();
    }

    // Fallback to extracting from name or description
    if (metadata.name.includes(' by ')) {
      return metadata.name.split(' by ')[1];
    }

    return 'Unknown Artist';
  }

  // Check if user has access to NFT exclusive content
  async checkNFTAccess(contractAddress: string, tokenId: string, userAddress: string): Promise<boolean> {
    try {
      // First check direct ownership
      const isOwner = await web3Service.checkNFTOwnership(contractAddress, tokenId, userAddress);
      if (isOwner) {
        return true;
      }

      // Check if user has been granted access (if contract supports it)
      // This would require calling the hasAccess function on the contract
      // For now, return false if not owner
      return false;
    } catch (error) {
      console.error('Error checking NFT access:', error);
      return false;
    }
  }

  // Get all NFT contracts that contain music
  getMusicNFTContracts(): string[] {
    return [
      '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4', // Example music NFT contract
      // Add more known music NFT contracts
    ];
  }

  // Verify ERC-721 compliance of a contract
  async verifyERC721Contract(contractAddress: string): Promise<boolean> {
    try {
      return await web3Service.supportsERC721(contractAddress);
    } catch (error) {
      console.error('Error verifying ERC-721 contract:', error);
      return false;
    }
  }
}

export const nftService = new NFTService();
export type { NFTMetadata, MintNFTParams };