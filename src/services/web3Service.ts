// Web3 Service for blockchain integration with real wallet support

// Chain configurations
export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  nftContracts: string[];
  marketplaceContract: string;
  currency: string;
  blockExplorer: string;
  testnet?: boolean;
}

// Ethereum provider interface
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isConnected?: () => boolean;
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    nftContracts: [],
    marketplaceContract: '',
    currency: 'ETH',
    blockExplorer: 'https://etherscan.io'
  },
  {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    nftContracts: [],
    marketplaceContract: '',
    currency: 'MATIC',
    blockExplorer: 'https://polygonscan.com'
  },
  {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    nftContracts: [],
    marketplaceContract: '',
    currency: 'ETH',
    blockExplorer: 'https://basescan.org'
  },
  {
    chainId: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    nftContracts: [],
    marketplaceContract: '',
    currency: 'ETH',
    blockExplorer: 'https://sepolia.basescan.org',
    testnet: true
  },
  {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    nftContracts: [],
    marketplaceContract: '',
    currency: 'ETH',
    blockExplorer: 'https://sepolia.etherscan.io',
    testnet: true
  },
  {
    chainId: 80001,
    name: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    nftContracts: [],
    marketplaceContract: '',
    currency: 'MATIC',
    blockExplorer: 'https://mumbai.polygonscan.com',
    testnet: true
  }
];

// NFT Metadata interface
export interface NFTMetadata {
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
      master?: {
        uri: string;
        format: string;
        bitrate: string;
        size: number;
      };
      high_quality: {
        uri: string;
        format: string;
        bitrate: string;
        size: number;
      };
      streaming: {
        uri: string;
        format: string;
        bitrate: string;
        size: number;
      };
    };
    exclusive_content?: {
      stems?: Array<{
        name: string;
        uri: string;
      }>;
      bonus_tracks?: Array<{
        name: string;
        uri: string;
      }>;
      behind_the_scenes?: {
        video?: string;
        photos?: string[];
      };
    };
    utilities?: {
      concert_access?: boolean;
      meet_and_greet?: boolean;
      merchandise_discount?: number;
      future_drops_priority?: boolean;
      voting_rights?: boolean;
    };
    royalties?: {
      percentage: number;
      recipient: string;
    };
    license?: {
      type: string;
      commercial_rights: boolean;
      resale_rights: boolean;
      streaming_rights: boolean;
    };
  };
}

class Web3Service {
  private currentAccount: string | null = null;
  private currentChainId: number | null = null;
  private isConnected: boolean = false;
  private provider: EthereumProvider | null = null;

  constructor() {
    this.initializeWeb3();
  }

  private async initializeWeb3() {
    // Check if MetaMask or other Web3 provider is available
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = (window as any).ethereum as EthereumProvider;
      console.log('Web3 provider detected:', this.provider.isMetaMask ? 'MetaMask' : 'Unknown');
      
      // Setup event listeners for connection changes
      this.setupProviderEventListeners();
      
      // Check if already connected
      try {
        const accounts = await this.provider.request({ method: 'eth_accounts' }) as string[];
        if (accounts.length > 0) {
          this.currentAccount = accounts[0];
          const chainId = await this.provider.request({ method: 'eth_chainId' }) as string;
          this.currentChainId = parseInt(chainId, 16);
          this.isConnected = true;
          console.log('Already connected to:', this.currentAccount, 'on chain:', this.currentChainId);
        } else {
          // Ensure we're in disconnected state if no accounts
          this.isConnected = false;
          this.currentAccount = null;
          this.currentChainId = null;
        }
      } catch (error) {
        console.log('No existing connection found');
        this.isConnected = false;
        this.currentAccount = null;
        this.currentChainId = null;
      }
    } else {
      console.warn('No Web3 provider found. Please install MetaMask or another Web3 wallet.');
    }
  }

  private setupProviderEventListeners() {
    if (!this.provider) return;

    // Listen for account changes
    this.provider.on('accountsChanged', (accounts: string[]) => {
      console.log('Accounts changed:', accounts);
      if (accounts.length === 0) {
        // User disconnected
        this.currentAccount = null;
        this.isConnected = false;
        console.log('Wallet disconnected via provider');
      } else {
        // User switched accounts
        this.currentAccount = accounts[0];
        this.isConnected = true;
        console.log('Account switched to:', this.currentAccount);
      }
    });

    // Listen for chain changes
    this.provider.on('chainChanged', (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      console.log('Chain changed to:', newChainId);
      this.currentChainId = newChainId;
    });

    // Listen for connection status changes
    this.provider.on('connect', (connectInfo: { chainId: string }) => {
      console.log('Provider connected:', connectInfo);
      this.currentChainId = parseInt(connectInfo.chainId, 16);
    });

    this.provider.on('disconnect', (error: { code: number; message: string }) => {
      console.log('Provider disconnected:', error);
      this.currentAccount = null;
      this.currentChainId = null;
      this.isConnected = false;
    });
  }

  // Connect wallet
  async connectWallet(): Promise<{ account: string; chainId: number }> {
    if (!this.provider) {
      throw new Error('No Web3 provider found. Please install MetaMask or another Web3 wallet.');
    }

    try {
      // Request account access
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts'
      }) as string[];

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      // Get current chain
      const chainId = await this.provider.request({
        method: 'eth_chainId'
      }) as string;

      this.currentAccount = accounts[0];
      this.currentChainId = parseInt(chainId, 16);
      this.isConnected = true;

      console.log('Wallet connected:', this.currentAccount, 'on chain:', this.currentChainId);

      return {
        account: this.currentAccount,
        chainId: this.currentChainId
      };
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      
      // Handle specific MetaMask errors
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      } else if (error.code === -32002) {
        throw new Error('Connection request already pending. Please check your wallet.');
      } else {
        throw new Error(error.message || 'Failed to connect wallet');
      }
    }
  }

  // Switch to specific chain
  async switchChain(chainId: number): Promise<void> {
    if (!this.provider) {
      throw new Error('No Web3 provider available');
    }

    const chainConfig = SUPPORTED_CHAINS.find(chain => chain.chainId === chainId);
    if (!chainConfig) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    try {
      // Try to switch to the chain
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });

      this.currentChainId = chainId;
      console.log(`Switched to chain: ${chainConfig.name}`);
    } catch (error: any) {
      // If the chain is not added to the wallet, add it
      if (error.code === 4902) {
        try {
          await this.provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${chainId.toString(16)}`,
              chainName: chainConfig.name,
              rpcUrls: [chainConfig.rpcUrl],
              nativeCurrency: {
                name: chainConfig.currency,
                symbol: chainConfig.currency,
                decimals: 18
              },
              blockExplorerUrls: [chainConfig.blockExplorer]
            }]
          });

          this.currentChainId = chainId;
          console.log(`Added and switched to chain: ${chainConfig.name}`);
        } catch (addError) {
          console.error('Error adding chain:', addError);
          throw new Error(`Failed to add chain: ${chainConfig.name}`);
        }
      } else {
        console.error('Error switching chain:', error);
        throw new Error(`Failed to switch to chain: ${chainConfig.name}`);
      }
    }
  }

  // Check NFT ownership using ERC-721 standard
  async checkNFTOwnership(contractAddress: string, tokenId: string, userAddress: string): Promise<boolean> {
    if (!this.provider) {
      console.warn('No Web3 provider available, using mock data');
      return this.mockNFTOwnership(contractAddress, tokenId, userAddress);
    }

    try {
      console.log(`Checking ERC-721 NFT ownership: ${contractAddress}/${tokenId} for ${userAddress}`);
      
      // ERC-721 ownerOf(uint256 tokenId) function call
      const functionSelector = '0x6352211e'; // ownerOf function selector
      const paddedTokenId = tokenId.padStart(64, '0');
      const data = functionSelector + paddedTokenId;
      
      const result = await this.provider.request({
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data: data
        }, 'latest']
      }) as string;

      if (result && result !== '0x' && result.length >= 66) {
        // Extract address from result (last 40 characters)
        const ownerAddress = '0x' + result.slice(-40).toLowerCase();
        const hasOwnership = ownerAddress === userAddress.toLowerCase();
        
        console.log(`ERC-721 ownership result: ${hasOwnership} (owner: ${ownerAddress})`);
        return hasOwnership;
      }

      return false;
    } catch (error) {
      console.error('Error checking ERC-721 ownership:', error);
      // Fallback to mock data for demo
      return this.mockNFTOwnership(contractAddress, tokenId, userAddress);
    }
  }

  private mockNFTOwnership(contractAddress: string, tokenId: string, userAddress: string): boolean {
    // Mock logic for demo purposes
    const mockOwnerships = {
      '0x742d35cc6634c0532925a3b8d4c0532925a3b8d4': ['1', '2', '3'],
      '0x1234567890123456789012345678901234567890': ['4', '5', '6'],
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd': ['1', '7', '8']
    };
    
    const ownedTokens = mockOwnerships[userAddress.toLowerCase() as keyof typeof mockOwnerships] || [];
    const hasOwnership = ownedTokens.includes(tokenId);
    
    console.log(`Mock NFT ownership result: ${hasOwnership}`);
    return hasOwnership;
  }

  // Check NFT balance using ERC-721 standard
  async checkNFTBalance(contractAddress: string, userAddress: string): Promise<number> {
    if (!this.provider) {
      console.warn('No Web3 provider available, using mock data');
      return this.mockNFTBalance(userAddress);
    }

    try {
      console.log(`Checking ERC-721 balance for ${userAddress} on contract ${contractAddress}`);
      
      // ERC-721 balanceOf(address owner) function call
      const functionSelector = '0x70a08231'; // balanceOf function selector
      const paddedAddress = userAddress.slice(2).padStart(64, '0');
      const data = functionSelector + paddedAddress;
      
      const result = await this.provider.request({
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data: data
        }, 'latest']
      }) as string;

      if (result && result !== '0x') {
        const balance = parseInt(result, 16);
        console.log(`ERC-721 balance for ${userAddress}: ${balance}`);
        return balance;
      }

      return 0;
    } catch (error) {
      console.error('Error checking ERC-721 balance:', error);
      return this.mockNFTBalance(userAddress);
    }
  }

  private mockNFTBalance(userAddress: string): number {
    const mockBalances = {
      '0x742d35cc6634c0532925a3b8d4c0532925a3b8d4': 3,
      '0x1234567890123456789012345678901234567890': 2,
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd': 4
    };
    
    const balance = mockBalances[userAddress.toLowerCase() as keyof typeof mockBalances] || 0;
    console.log(`Mock NFT balance for ${userAddress}: ${balance}`);
    return balance;
  }

  // Get NFT metadata with enhanced information
  async getNFTMetadata(contractAddress: string, tokenId: string): Promise<NFTMetadata | null> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Enhanced mock metadata with benefits
      const mockMetadata: NFTMetadata = {
        name: `Music NFT #${tokenId}`,
        description: 'A unique music NFT with exclusive content and benefits',
        image: `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&seed=${tokenId}`,
        animation_url: `https://ipfs.io/ipfs/QmSampleAnimation${tokenId}`,
        external_url: `https://sonicwave.app/nft/${contractAddress}/${tokenId}`,
        attributes: [
          { trait_type: 'Genre', value: 'Electronic' },
          { trait_type: 'Duration', value: '3:45' },
          { trait_type: 'Rarity', value: parseInt(tokenId) <= 3 ? 'Epic' : 'Rare' },
          { trait_type: 'Artist Tier', value: parseInt(tokenId) <= 3 ? 'Platinum' : 'Gold' },
          { trait_type: 'Release Year', value: 2024 },
          { trait_type: 'Edition', value: `${tokenId}/100` }
        ],
        properties: {
          audio_files: {
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
            }
          },
          utilities: {
            concert_access: true,
            merchandise_discount: 20,
            future_drops_priority: true
          },
          royalties: {
            percentage: 10,
            recipient: contractAddress
          }
        }
      };
      
      return mockMetadata;
    } catch (error) {
      console.error('Error getting NFT metadata:', error);
      return null;
    }
  }

  // Get token URI using ERC-721 standard
  async getTokenURI(contractAddress: string, tokenId: string): Promise<string | null> {
    if (!this.provider) {
      console.warn('No Web3 provider available');
      return null;
    }

    try {
      console.log(`Getting ERC-721 tokenURI for ${contractAddress}/${tokenId}`);
      
      // ERC-721 tokenURI(uint256 tokenId) function call
      const functionSelector = '0xc87b56dd'; // tokenURI function selector
      const paddedTokenId = tokenId.padStart(64, '0');
      const data = functionSelector + paddedTokenId;
      
      const result = await this.provider.request({
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data: data
        }, 'latest']
      }) as string;

      if (result && result !== '0x' && result.length > 66) {
        // Decode the string result
        const offset = parseInt(result.slice(2, 66), 16) * 2 + 2;
        const length = parseInt(result.slice(66, 130), 16) * 2;
        const hexString = result.slice(130, 130 + length);
        
        // Convert hex to string
        let uri = '';
        for (let i = 0; i < hexString.length; i += 2) {
          uri += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
        }
        
        console.log(`ERC-721 tokenURI: ${uri}`);
        return uri;
      }

      return null;
    } catch (error) {
      console.error('Error getting ERC-721 tokenURI:', error);
      return null;
    }
  }

  // Check if contract supports ERC-721 interface
  async supportsERC721(contractAddress: string): Promise<boolean> {
    if (!this.provider) {
      return false;
    }

    try {
      console.log(`Checking ERC-721 interface support for ${contractAddress}`);
      
      // ERC-165 supportsInterface(bytes4 interfaceId) function call
      // ERC-721 interface ID: 0x80ac58cd
      const functionSelector = '0x01ffc9a7'; // supportsInterface function selector
      const erc721InterfaceId = '80ac58cd00000000000000000000000000000000000000000000000000000000';
      const data = functionSelector + erc721InterfaceId;
      
      const result = await this.provider.request({
        method: 'eth_call',
        params: [{
          to: contractAddress,
          data: data
        }, 'latest']
      }) as string;

      if (result && result !== '0x') {
        const supports = parseInt(result, 16) === 1;
        console.log(`ERC-721 interface support: ${supports}`);
        return supports;
      }

      return false;
    } catch (error) {
      console.error('Error checking ERC-721 interface support:', error);
      return false;
    }
  }

  // Get user's NFTs from a contract using ERC-721 standard
  async getUserNFTs(contractAddress: string, userAddress: string): Promise<Array<{ tokenId: string; metadata: NFTMetadata | null }>> {
    if (!this.provider) {
      console.warn('No Web3 provider available, returning mock data');
      return this.getMockUserNFTs(userAddress);
    }

    try {
      console.log(`Getting user NFTs for ${userAddress} from contract ${contractAddress}`);
      
      // First check if contract supports ERC-721
      const isERC721 = await this.supportsERC721(contractAddress);
      if (!isERC721) {
        console.warn('Contract does not support ERC-721 interface');
        return [];
      }

      // Get user's balance
      const balance = await this.checkNFTBalance(contractAddress, userAddress);
      if (balance === 0) {
        return [];
      }

      // For now, return mock data since we'd need to enumerate tokens
      // In a real implementation, you'd use events or a subgraph to get user's tokens
      return this.getMockUserNFTs(userAddress);
    } catch (error) {
      console.error('Error getting user NFTs:', error);
      return [];
    }
  }

  private getMockUserNFTs(userAddress: string): Array<{ tokenId: string; metadata: NFTMetadata | null }> {
    const mockNFTs = {
      '0x742d35cc6634c0532925a3b8d4c0532925a3b8d4': [
        { tokenId: '1', metadata: null },
        { tokenId: '2', metadata: null },
        { tokenId: '3', metadata: null }
      ],
      '0x1234567890123456789012345678901234567890': [
        { tokenId: '4', metadata: null },
        { tokenId: '5', metadata: null }
      ]
    };
    
    return mockNFTs[userAddress.toLowerCase() as keyof typeof mockNFTs] || [];
  }

  // Get current account
  getCurrentAccount(): string | null {
    return this.currentAccount;
  }

  // Get current chain ID
  getCurrentChainId(): number | null {
    return this.currentChainId;
  }

  // Check if wallet is connected
  isWalletConnected(): boolean {
    return this.isConnected;
  }

  // Public method to check connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Get supported chains
  getSupportedChains(): ChainConfig[] {
    return SUPPORTED_CHAINS;
  }

  // Format address for display
  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Convert Wei to Ether
  weiToEther(wei: string): string {
    try {
      const weiValue = BigInt(wei);
      const etherValue = Number(weiValue) / Math.pow(10, 18);
      return etherValue.toString();
    } catch (error) {
      console.error('Error converting Wei to Ether:', error);
      return '0';
    }
  }

  // Convert Ether to Wei
  etherToWei(ether: string): string {
    try {
      const etherValue = parseFloat(ether);
      const weiValue = BigInt(Math.floor(etherValue * Math.pow(10, 18)));
      return '0x' + weiValue.toString(16);
    } catch (error) {
      console.error('Error converting Ether to Wei:', error);
      return '0x0';
    }
  }

  // Get account balance
  async getBalance(address?: string): Promise<string> {
    if (!this.provider) {
      return '0';
    }

    try {
      const targetAddress = address || this.currentAccount;
      if (!targetAddress) {
        return '0';
      }

      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [targetAddress, 'latest']
      }) as string;

      return this.weiToEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  // Sign message
  async signMessage(message: string): Promise<string> {
    if (!this.provider || !this.currentAccount) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [message, this.currentAccount]
      }) as string;

      return signature;
    } catch (error: any) {
      console.error('Error signing message:', error);
      if (error.code === 4001) {
        throw new Error('User rejected the signature request');
      }
      throw new Error(error.message || 'Failed to sign message');
    }
  }

  // Send transaction
  async sendTransaction(to: string, value: string): Promise<string> {
    if (!this.provider || !this.currentAccount) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log(`Sending transaction: ${value} ETH to ${to}`);

      // Convert ETH to Wei
      const valueInWei = this.etherToWei(value);

      const transactionParameters = {
        to,
        from: this.currentAccount,
        value: valueInWei,
        // Optional: add gas limit, gas price, etc.
      };

      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters]
      }) as string;

      console.log('Transaction sent successfully:', txHash);
      return txHash;
    } catch (error: any) {
      console.error('Error sending transaction:', error);
      if (error.code === 4001) {
        throw new Error('Transaction rejected by user');
      } else if (error.code === -32603) {
        throw new Error('Transaction failed - insufficient funds or network error');
      } else {
        throw new Error(error.message || 'Failed to send transaction');
      }
    }
  }

  // Disconnect wallet
  disconnect(): void {
    this.currentAccount = null;
    this.currentChainId = null;
    this.isConnected = false;
    
    // Clear any cached data
    if (typeof window !== 'undefined' && window.localStorage) {
      // Clear any wallet-related localStorage items
      const keysToRemove = Object.keys(window.localStorage).filter(key => 
        key.includes('wallet') || key.includes('web3') || key.includes('metamask')
      );
      keysToRemove.forEach(key => window.localStorage.removeItem(key));
    }
    
    console.log('Wallet disconnected and cache cleared');
  }
}

// Export singleton instance
export const web3Service = new Web3Service();
export default web3Service;