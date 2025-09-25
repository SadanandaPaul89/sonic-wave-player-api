// User Role Management Types

export type UserRole = 'artist' | 'normal';

export type RoleVerificationMethod = 'nft_ownership' | 'whitelist' | 'manual' | 'default';

export interface UserRoleData {
  walletAddress: string;
  role: UserRole;
  verificationMethod: RoleVerificationMethod;
  verifiedAt: Date;
  lastUpdated: Date;
  metadata?: {
    artistName?: string;
    verificationNFT?: {
      contractAddress: string;
      tokenId: string;
    };
    whitelistSource?: string;
  };
}

export interface RoleVerificationConfig {
  // Artist verification NFT contracts
  artistNFTContracts: string[];
  // Whitelist of known artist addresses
  artistWhitelist: string[];
  // Cache TTL in milliseconds
  cacheTTL: number;
  // Enable blockchain verification
  enableBlockchainVerification: boolean;
}

export interface RoleCache {
  [walletAddress: string]: {
    role: UserRole;
    verificationMethod: RoleVerificationMethod;
    cachedAt: number;
    expiresAt: number;
  };
}

export interface RoleVerificationResult {
  role: UserRole;
  verificationMethod: RoleVerificationMethod;
  confidence: 'high' | 'medium' | 'low';
  metadata?: UserRoleData['metadata'];
}