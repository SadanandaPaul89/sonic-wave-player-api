// Environment configuration for Yellow SDK and other services

export const ENV = {
  // IPFS Configuration
  PINATA_API_KEY: import.meta.env.VITE_PINATA_API_KEY || '',
  PINATA_SECRET_KEY: import.meta.env.VITE_PINATA_SECRET_KEY || '',
  PINATA_JWT: import.meta.env.VITE_PINATA_JWT || '',
  WEB3_STORAGE_TOKEN: import.meta.env.VITE_WEB3_STORAGE_TOKEN || '',

  // Development flags
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
} as const;

// Validation function to check required environment variables
export const validateEnvironment = () => {
  // No required environment variables for basic functionality
  return true;
};

export const IPFS_CONFIG = {
  pinata: {
    apiKey: ENV.PINATA_API_KEY,
    secretKey: ENV.PINATA_SECRET_KEY,
    jwt: ENV.PINATA_JWT,
  },
  web3Storage: {
    token: ENV.WEB3_STORAGE_TOKEN,
  },
} as const;

// Simplified configuration - removed Web3 and Yellow SDK configs