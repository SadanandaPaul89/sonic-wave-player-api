// Environment configuration for Yellow SDK and other services

export const ENV = {
  // Yellow SDK Configuration - Updated with correct Nitro Lite endpoints
  CLEARNODE_URL: import.meta.env.VITE_CLEARNODE_URL || 'https://clearnode.dev',
  CHAIN_ID: parseInt(import.meta.env.VITE_CHAIN_ID || '11155111'),
  NITROLITE_CUSTODY_ADDRESS: import.meta.env.VITE_NITROLITE_CUSTODY_ADDRESS || '0x7EF2e0048f5bAeDe046f6BF797943daF4ED8CB47',
  NITROLITE_ADJUDICATOR_ADDRESS: import.meta.env.VITE_NITROLITE_ADJUDICATOR_ADDRESS || '0x7EF2e0048f5bAeDe046f6BF797943daF4ED8CB47',
  NITROLITE_GUEST_ADDRESS: import.meta.env.VITE_NITROLITE_GUEST_ADDRESS || '0xdd57A0427DD5B8fc94753038B475B8aF9Ce8dff8',

  NITROLITE_WEBSOCKET_URL: import.meta.env.VITE_NITROLITE_WEBSOCKET_URL || 'wss://api.yellow.org/v1/nitrolite/ws',
  NITROLITE_API_URL: import.meta.env.VITE_NITROLITE_API_URL || 'https://api.yellow.org/v1/nitrolite',
  NITROLITE_API_KEY: import.meta.env.VITE_NITROLITE_API_KEY || '',
  NITROLITE_NETWORK: (import.meta.env.VITE_NITROLITE_NETWORK || 'testnet') as 'mainnet' | 'testnet',

  // IPFS Configuration
  PINATA_API_KEY: import.meta.env.VITE_PINATA_API_KEY || '',
  PINATA_SECRET_KEY: import.meta.env.VITE_PINATA_SECRET_KEY || '',
  WEB3_STORAGE_TOKEN: import.meta.env.VITE_WEB3_STORAGE_TOKEN || '',

  // Web3 Configuration
  INFURA_PROJECT_ID: import.meta.env.VITE_INFURA_PROJECT_ID || '',
  INFURA_PROJECT_SECRET: import.meta.env.VITE_INFURA_PROJECT_SECRET || '',

  // Development flags
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
} as const;

// Validation function to check required environment variables
export const validateEnvironment = () => {
  const requiredVars = [
    'NITROLITE_WEBSOCKET_URL',
  ];

  const missingVars = requiredVars.filter(varName => !ENV[varName as keyof typeof ENV]);

  if (missingVars.length > 0) {
    console.warn('Missing environment variables:', missingVars);
    if (ENV.IS_PRODUCTION) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  return true;
};

// Export configuration objects for different services
export const YELLOW_SDK_CONFIG = {
  websocketUrl: ENV.NITROLITE_WEBSOCKET_URL,
  apiUrl: ENV.CLEARNODE_URL,
  apiKey: ENV.NITROLITE_API_KEY,
  network: ENV.NITROLITE_NETWORK,
  chainId: ENV.CHAIN_ID,
  custodyAddress: ENV.NITROLITE_CUSTODY_ADDRESS,
  adjudicatorAddress: ENV.NITROLITE_ADJUDICATOR_ADDRESS,
  guestAddress: ENV.NITROLITE_GUEST_ADDRESS,
} as const;

export const IPFS_CONFIG = {
  pinata: {
    apiKey: ENV.PINATA_API_KEY,
    secretKey: ENV.PINATA_SECRET_KEY,
  },
  web3Storage: {
    token: ENV.WEB3_STORAGE_TOKEN,
  },
} as const;

export const WEB3_CONFIG = {
  infura: {
    projectId: ENV.INFURA_PROJECT_ID,
    projectSecret: ENV.INFURA_PROJECT_SECRET,
  },
} as const;