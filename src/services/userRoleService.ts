// User Role Service - Manages user role determination and validation

import { web3Service } from './web3Service';
import { 
  UserRole, 
  UserRoleData, 
  RoleVerificationMethod, 
  RoleVerificationConfig, 
  RoleCache, 
  RoleVerificationResult 
} from '@/types/userRole';

class UserRoleService {
  private cache: RoleCache = {};
  private config: RoleVerificationConfig = {
    artistNFTContracts: [
      // Add artist verification NFT contract addresses here
      '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4', // Example artist NFT contract
    ],
    artistWhitelist: [
      // Add known artist wallet addresses here
      // These will be loaded from a secure source in production
    ],
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    enableBlockchainVerification: true
  };

  constructor() {
    this.loadCacheFromStorage();
  }

  // Determine user role based on multiple verification methods
  async determineUserRole(walletAddress: string): Promise<UserRole> {
    if (!walletAddress) {
      return 'normal';
    }

    // Check cache first
    const cachedRole = this.getCachedRole(walletAddress);
    if (cachedRole) {
      console.log(`Using cached role for ${walletAddress}: ${cachedRole}`);
      return cachedRole;
    }

    try {
      const verificationResult = await this.verifyUserRole(walletAddress);
      
      // Cache the result
      this.cacheRole(walletAddress, verificationResult.role, verificationResult.verificationMethod);
      
      // Store detailed role data
      const roleData: UserRoleData = {
        walletAddress,
        role: verificationResult.role,
        verificationMethod: verificationResult.verificationMethod,
        verifiedAt: new Date(),
        lastUpdated: new Date(),
        metadata: verificationResult.metadata
      };
      
      this.storeRoleData(roleData);
      
      console.log(`Determined role for ${walletAddress}: ${verificationResult.role} (${verificationResult.verificationMethod})`);
      return verificationResult.role;
      
    } catch (error) {
      console.error('Error determining user role:', error);
      // Default to normal user on error
      this.cacheRole(walletAddress, 'normal', 'default');
      return 'normal';
    }
  }

  // Verify user role using multiple methods
  private async verifyUserRole(walletAddress: string): Promise<RoleVerificationResult> {
    // Method 1: Check whitelist (highest confidence)
    if (this.config.artistWhitelist.includes(walletAddress.toLowerCase())) {
      return {
        role: 'artist',
        verificationMethod: 'whitelist',
        confidence: 'high',
        metadata: {
          whitelistSource: 'official'
        }
      };
    }

    // Method 2: Check NFT ownership (high confidence)
    if (this.config.enableBlockchainVerification) {
      const nftVerification = await this.verifyArtistNFTOwnership(walletAddress);
      if (nftVerification.isArtist) {
        return {
          role: 'artist',
          verificationMethod: 'nft_ownership',
          confidence: 'high',
          metadata: {
            verificationNFT: nftVerification.nftData
          }
        };
      }
    }

    // Default: Normal user
    return {
      role: 'normal',
      verificationMethod: 'default',
      confidence: 'high'
    };
  }

  // Check if user owns artist verification NFTs
  private async verifyArtistNFTOwnership(walletAddress: string): Promise<{
    isArtist: boolean;
    nftData?: { contractAddress: string; tokenId: string };
  }> {
    try {
      for (const contractAddress of this.config.artistNFTContracts) {
        const balance = await web3Service.checkNFTBalance(contractAddress, walletAddress);
        
        if (balance > 0) {
          // Get user's NFTs to find a specific token ID
          const userNFTs = await web3Service.getUserNFTs(contractAddress, walletAddress);
          
          if (userNFTs.length > 0) {
            return {
              isArtist: true,
              nftData: {
                contractAddress,
                tokenId: userNFTs[0].tokenId
              }
            };
          }
        }
      }
      
      return { isArtist: false };
    } catch (error) {
      console.error('Error verifying artist NFT ownership:', error);
      return { isArtist: false };
    }
  }

  // Get cached role if valid
  private getCachedRole(walletAddress: string): UserRole | null {
    const cached = this.cache[walletAddress.toLowerCase()];
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() > cached.expiresAt) {
      delete this.cache[walletAddress.toLowerCase()];
      this.saveCacheToStorage();
      return null;
    }
    
    return cached.role;
  }

  // Cache role with expiration
  private cacheRole(walletAddress: string, role: UserRole, verificationMethod: RoleVerificationMethod): void {
    const now = Date.now();
    this.cache[walletAddress.toLowerCase()] = {
      role,
      verificationMethod,
      cachedAt: now,
      expiresAt: now + this.config.cacheTTL
    };
    
    this.saveCacheToStorage();
  }

  // Get user role (from cache or determine)
  async getUserRole(walletAddress: string): Promise<UserRole> {
    if (!walletAddress) {
      return 'normal';
    }
    
    const cachedRole = this.getCachedRole(walletAddress);
    if (cachedRole) {
      return cachedRole;
    }
    
    return await this.determineUserRole(walletAddress);
  }

  // Get user role synchronously (cache only)
  getUserRoleSync(walletAddress: string): UserRole | null {
    if (!walletAddress) {
      return 'normal';
    }
    
    return this.getCachedRole(walletAddress);
  }

  // Set user role manually (admin function)
  setUserRole(walletAddress: string, role: UserRole): void {
    if (!walletAddress) {
      return;
    }
    
    this.cacheRole(walletAddress, role, 'manual');
    
    const roleData: UserRoleData = {
      walletAddress,
      role,
      verificationMethod: 'manual',
      verifiedAt: new Date(),
      lastUpdated: new Date()
    };
    
    this.storeRoleData(roleData);
    console.log(`Manually set role for ${walletAddress}: ${role}`);
  }

  // Check if user is an artist
  async isArtist(walletAddress: string): Promise<boolean> {
    const role = await this.getUserRole(walletAddress);
    return role === 'artist';
  }

  // Check if user is an artist (synchronous)
  isArtistSync(walletAddress: string): boolean {
    const role = this.getUserRoleSync(walletAddress);
    return role === 'artist';
  }

  // Check if user can upload music
  async canUploadMusic(walletAddress: string): Promise<boolean> {
    return await this.isArtist(walletAddress);
  }

  // Check if user can upload music (synchronous)
  canUploadMusicSync(walletAddress: string): boolean {
    return this.isArtistSync(walletAddress);
  }

  // Clear role cache for a user
  clearUserRole(walletAddress: string): void {
    delete this.cache[walletAddress.toLowerCase()];
    this.saveCacheToStorage();
    this.removeRoleData(walletAddress);
  }

  // Clear all cached roles
  clearAllRoles(): void {
    this.cache = {};
    this.saveCacheToStorage();
    localStorage.removeItem('userRoleData');
  }

  // Update configuration
  updateConfig(newConfig: Partial<RoleVerificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Updated role verification config:', this.config);
  }

  // Get current configuration
  getConfig(): RoleVerificationConfig {
    return { ...this.config };
  }

  // Force re-verification of a user
  async reVerifyUser(walletAddress: string): Promise<UserRole> {
    this.clearUserRole(walletAddress);
    return await this.determineUserRole(walletAddress);
  }

  // Get role statistics
  getRoleStats(): { artists: number; normal: number; total: number } {
    const roles = Object.values(this.cache);
    const artists = roles.filter(r => r.role === 'artist').length;
    const normal = roles.filter(r => r.role === 'normal').length;
    
    return {
      artists,
      normal,
      total: roles.length
    };
  }

  // Private methods for storage management
  private loadCacheFromStorage(): void {
    try {
      const cached = localStorage.getItem('userRoleCache');
      if (cached) {
        this.cache = JSON.parse(cached);
        console.log('Loaded role cache from storage');
      }
    } catch (error) {
      console.error('Error loading role cache:', error);
      this.cache = {};
    }
  }

  private saveCacheToStorage(): void {
    try {
      localStorage.setItem('userRoleCache', JSON.stringify(this.cache));
    } catch (error) {
      console.error('Error saving role cache:', error);
    }
  }

  private storeRoleData(roleData: UserRoleData): void {
    try {
      const existingData = localStorage.getItem('userRoleData');
      const allRoleData: { [address: string]: UserRoleData } = existingData 
        ? JSON.parse(existingData) 
        : {};
      
      allRoleData[roleData.walletAddress.toLowerCase()] = roleData;
      localStorage.setItem('userRoleData', JSON.stringify(allRoleData));
    } catch (error) {
      console.error('Error storing role data:', error);
    }
  }

  private removeRoleData(walletAddress: string): void {
    try {
      const existingData = localStorage.getItem('userRoleData');
      if (existingData) {
        const allRoleData = JSON.parse(existingData);
        delete allRoleData[walletAddress.toLowerCase()];
        localStorage.setItem('userRoleData', JSON.stringify(allRoleData));
      }
    } catch (error) {
      console.error('Error removing role data:', error);
    }
  }

  // Get detailed role data
  getRoleData(walletAddress: string): UserRoleData | null {
    try {
      const existingData = localStorage.getItem('userRoleData');
      if (existingData) {
        const allRoleData = JSON.parse(existingData);
        return allRoleData[walletAddress.toLowerCase()] || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting role data:', error);
      return null;
    }
  }
}

// Export singleton instance
export const userRoleService = new UserRoleService();
export default userRoleService;