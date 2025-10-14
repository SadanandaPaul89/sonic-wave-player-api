// Unified Wallet Context - Centralized wallet state management for all components

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { web3Service } from '@/services/web3Service';
import { yellowSDKService } from '@/services/yellowSDKService';
import { nitroLiteService } from '@/services/nitroLiteService';
import { persistentMusicService } from '@/services/persistentMusicService';
import { nftService } from '@/services/nftService';
import { userRoleService } from '@/services/userRoleService';
import { nftLimitService } from '@/services/nftLimitService';
import { UserRole } from '@/types/userRole';
import { NFTMintingLimits } from '@/types/nftLimits';
import { toast } from 'sonner';

export interface WalletState {
  // Connection status
  isWalletConnected: boolean;
  isYellowSDKConnected: boolean;
  isYellowSDKAuthenticated: boolean;
  isNitroLiteConnected: boolean;
  
  // Wallet info
  walletAddress: string | null;
  chainId: number | null;
  balance: string;
  
  // Yellow SDK info
  yellowBalance: number;
  paymentChannel: any | null;
  session: any | null;
  
  // User role info
  userRole: UserRole | null;
  isRoleLoading: boolean;
  
  // NFT minting status
  nftMintingStatus: {
    remainingMints: number;
    weeklyLimit: number;
    resetDate: Date | null;
    isLimited: boolean;
    canMint: boolean;
  };
  
  // Connection states
  isConnecting: boolean;
  isAuthenticating: boolean;
  
  // Errors
  error: string | null;
}

export interface WalletActions {
  // Connection actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  connectYellowSDK: () => Promise<void>;
  authenticateYellowSDK: () => Promise<void>;
  createPaymentChannel: (initialDeposit?: number) => Promise<void>;
  
  // Role management actions
  refreshUserRole: () => Promise<void>;
  refreshNFTMintingStatus: () => Promise<void>;
  
  // Role checking utilities
  isArtist: () => boolean;
  canUploadMusic: () => boolean;
  canMintNFT: () => boolean;
  
  // Utility actions
  switchNetwork: (chainId: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
  
  // Status checks
  isFullyConnected: () => boolean;
  getConnectionStatus: () => string;
}

interface WalletContextValue extends WalletState, WalletActions {}

const WalletContext = createContext<WalletContextValue | null>(null);

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [state, setState] = useState<WalletState>({
    isWalletConnected: false,
    isYellowSDKConnected: false,
    isYellowSDKAuthenticated: false,
    isNitroLiteConnected: false,
    walletAddress: null,
    chainId: null,
    balance: '0',
    yellowBalance: 0,
    paymentChannel: null,
    session: null,
    userRole: null,
    isRoleLoading: false,
    nftMintingStatus: {
      remainingMints: 0,
      weeklyLimit: 0,
      resetDate: null,
      isLimited: true,
      canMint: false
    },
    isConnecting: false,
    isAuthenticating: false,
    error: null
  });

  // Initialize wallet state on mount
  useEffect(() => {
    initializeWalletState();
    setupEventListeners();
    
    // Set up periodic connection status check
    const statusCheckInterval = setInterval(() => {
      checkConnectionStatus();
    }, 5000); // Check every 5 seconds
    
    return () => {
      clearInterval(statusCheckInterval);
    };
  }, []);

  const initializeWalletState = useCallback(async () => {
    try {
      console.log('WalletContext: Initializing wallet state...');
      
      // Check existing wallet connection
      const walletAddress = web3Service.getCurrentAccount();
      const chainId = web3Service.getCurrentChainId();
      const isWalletConnected = web3Service.isWalletConnected();
      
      console.log('WalletContext: Initial wallet state:', { walletAddress, chainId, isWalletConnected });
      
      if (walletAddress && chainId && isWalletConnected) {
        setState(prev => ({
          ...prev,
          isWalletConnected: true,
          walletAddress,
          chainId
        }));
        
        // Get balance
        await refreshBalance();
        
        // Check Yellow SDK status
        const yellowConnected = yellowSDKService.getConnectionStatus();
        const yellowAuthenticated = yellowSDKService.getAuthenticationStatus();
        const yellowSession = yellowSDKService.getCurrentSession();
        const yellowBalance = await yellowSDKService.getBalance();

        setState(prev => ({
          ...prev,
          isYellowSDKConnected: yellowConnected,
          isYellowSDKAuthenticated: yellowAuthenticated,
          session: yellowSession,
          yellowBalance,
          paymentChannel: yellowSession?.paymentChannel || null
        }));
        
        // Check Nitro Lite status
        const nitroConnected = nitroLiteService.isServiceConnected();
        setState(prev => ({
          ...prev,
          isNitroLiteConnected: nitroConnected
        }));

        // Initialize user role and NFT minting status
        await initializeUserRole(walletAddress);
        await initializeNFTMintingStatus(walletAddress);
      } else {
        // Ensure we're in disconnected state
        setState(prev => ({
          ...prev,
          isWalletConnected: false,
          walletAddress: null,
          chainId: null,
          balance: '0'
        }));
      }
    } catch (error) {
      console.error('Error initializing wallet state:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize wallet state'
      }));
    }
  }, []);

  // Check connection status periodically
  const checkConnectionStatus = useCallback(async () => {
    try {
      const walletAddress = web3Service.getCurrentAccount();
      const chainId = web3Service.getCurrentChainId();
      const isWalletConnected = web3Service.isWalletConnected();
      
      // Only update if there's a mismatch
      if (state.isWalletConnected !== isWalletConnected || 
          state.walletAddress !== walletAddress || 
          state.chainId !== chainId) {
        
        console.log('WalletContext: Connection status mismatch detected, syncing...');
        
        if (isWalletConnected && walletAddress && chainId) {
          setState(prev => ({
            ...prev,
            isWalletConnected: true,
            walletAddress,
            chainId
          }));
          
          // Refresh balance if needed
          if (state.walletAddress !== walletAddress) {
            await refreshBalance();
          }
        } else {
          setState(prev => ({
            ...prev,
            isWalletConnected: false,
            walletAddress: null,
            chainId: null,
            balance: '0'
          }));
        }
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  }, [state.isWalletConnected, state.walletAddress, state.chainId]);

  const setupEventListeners = useCallback(() => {
    // Web3 wallet events
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        console.log('WalletContext: Accounts changed:', accounts);
        if (accounts.length === 0) {
          console.log('WalletContext: No accounts, disconnecting all');
          handleDisconnectAll();
        } else {
          const newAddress = accounts[0];
          console.log('WalletContext: Account switched to:', newAddress);
          setState(prev => ({
            ...prev,
            walletAddress: newAddress,
            isWalletConnected: true
          }));
          
          // Refresh all wallet-dependent data
          try {
            await refreshBalance();
            await initializeUserRole(newAddress);
            await initializeNFTMintingStatus(newAddress);
          } catch (error) {
            console.error('Error refreshing wallet data after account change:', error);
          }
        }
      };

      const handleChainChanged = async (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        console.log('WalletContext: Chain changed to:', newChainId);
        setState(prev => ({
          ...prev,
          chainId: newChainId
        }));
        
        try {
          await refreshBalance();
        } catch (error) {
          console.error('Error refreshing balance after chain change:', error);
        }
      };

      const handleConnect = (connectInfo: { chainId: string }) => {
        console.log('WalletContext: Provider connected:', connectInfo);
        const newChainId = parseInt(connectInfo.chainId, 16);
        setState(prev => ({
          ...prev,
          chainId: newChainId
        }));
      };

      const handleDisconnect = (error: { code: number; message: string }) => {
        console.log('WalletContext: Provider disconnected:', error);
        handleDisconnectAll();
      };

      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);
      (window as any).ethereum.on('connect', handleConnect);
      (window as any).ethereum.on('disconnect', handleDisconnect);
    }

    // Yellow SDK events
    yellowSDKService.on('connected', () => {
      setState(prev => ({ ...prev, isYellowSDKConnected: true }));
    });

    yellowSDKService.on('disconnected', () => {
      setState(prev => ({
        ...prev,
        isYellowSDKConnected: false,
        isYellowSDKAuthenticated: false,
        session: null,
        paymentChannel: null,
        yellowBalance: 0
      }));
    });

    yellowSDKService.on('authenticated', async (session: any) => {
      const realBalance = await yellowSDKService.getBalance();
      setState(prev => ({
        ...prev,
        isYellowSDKAuthenticated: true,
        session,
        yellowBalance: realBalance,
        paymentChannel: session.paymentChannel || null
      }));
    });

    yellowSDKService.on('channelCreated', async (channel: any) => {
      const realBalance = await yellowSDKService.getBalance();
      setState(prev => ({
        ...prev,
        paymentChannel: channel,
        yellowBalance: realBalance
      }));
    });

    yellowSDKService.on('channelUpdated', async (channel: any) => {
      const realBalance = await yellowSDKService.getBalance();
      setState(prev => ({
        ...prev,
        paymentChannel: channel,
        yellowBalance: realBalance
      }));
    });

    // Nitro Lite events
    nitroLiteService.on('connected', () => {
      setState(prev => ({ ...prev, isNitroLiteConnected: true }));
    });

    nitroLiteService.on('disconnected', () => {
      setState(prev => ({ ...prev, isNitroLiteConnected: false }));
    });
  }, []);

  // Initialize user role
  const initializeUserRole = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;

    setState(prev => ({ ...prev, isRoleLoading: true }));

    try {
      const role = await userRoleService.getUserRole(walletAddress);
      setState(prev => ({
        ...prev,
        userRole: role,
        isRoleLoading: false
      }));
      
      console.log(`User role initialized: ${role} for ${walletAddress}`);
    } catch (error) {
      console.error('Error initializing user role:', error);
      setState(prev => ({
        ...prev,
        userRole: 'normal', // Default to normal on error
        isRoleLoading: false
      }));
    }
  }, []);

  // Initialize NFT minting status
  const initializeNFTMintingStatus = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;

    try {
      const eligibility = await nftLimitService.checkMintingEligibility(walletAddress);
      const limits = nftLimitService.getUserLimitsSync(walletAddress);
      
      setState(prev => ({
        ...prev,
        nftMintingStatus: {
          remainingMints: eligibility.remainingMints,
          weeklyLimit: limits?.weeklyLimit || 0,
          resetDate: eligibility.resetDate || null,
          isLimited: eligibility.remainingMints !== -1,
          canMint: eligibility.canMint
        }
      }));
      
      console.log(`NFT minting status initialized for ${walletAddress}:`, eligibility);
    } catch (error) {
      console.error('Error initializing NFT minting status:', error);
    }
  }, []);

  // Refresh user role
  const refreshUserRole = useCallback(async () => {
    if (!state.walletAddress) return;

    setState(prev => ({ ...prev, isRoleLoading: true }));

    try {
      const role = await userRoleService.reVerifyUser(state.walletAddress);
      setState(prev => ({
        ...prev,
        userRole: role,
        isRoleLoading: false
      }));
      
      // Also refresh NFT minting status as it depends on role
      await refreshNFTMintingStatus();
      
      toast.success('User role refreshed', {
        description: `Account type: ${role}`,
      });
    } catch (error: any) {
      console.error('Error refreshing user role:', error);
      setState(prev => ({
        ...prev,
        isRoleLoading: false,
        error: error.message || 'Failed to refresh user role'
      }));
    }
  }, [state.walletAddress]);

  // Refresh NFT minting status
  const refreshNFTMintingStatus = useCallback(async () => {
    if (!state.walletAddress) return;

    try {
      const eligibility = await nftLimitService.checkMintingEligibility(state.walletAddress);
      const limits = nftLimitService.getUserLimitsSync(state.walletAddress);
      
      setState(prev => ({
        ...prev,
        nftMintingStatus: {
          remainingMints: eligibility.remainingMints,
          weeklyLimit: limits?.weeklyLimit || 0,
          resetDate: eligibility.resetDate || null,
          isLimited: eligibility.remainingMints !== -1,
          canMint: eligibility.canMint
        }
      }));
    } catch (error) {
      console.error('Error refreshing NFT minting status:', error);
    }
  }, [state.walletAddress]);

  // Role checking utilities
  const isArtist = useCallback(() => {
    return state.userRole === 'artist';
  }, [state.userRole]);

  const canUploadMusic = useCallback(() => {
    return state.userRole === 'artist';
  }, [state.userRole]);

  const canMintNFT = useCallback(() => {
    return state.nftMintingStatus.canMint;
  }, [state.nftMintingStatus.canMint]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (state.isConnecting) return;
    
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      const { account, chainId } = await web3Service.connectWallet();
      
      setState(prev => ({
        ...prev,
        isWalletConnected: true,
        walletAddress: account,
        chainId,
        isConnecting: false
      }));
      
      await refreshBalance();
      
      // Initialize user role and NFT minting status
      await initializeUserRole(account);
      await initializeNFTMintingStatus(account);
      
      toast.success('Wallet connected successfully!', {
        description: `Connected to ${web3Service.formatAddress(account)}`,
      });
      
      // Auto-connect Yellow SDK after wallet connection
      setTimeout(() => {
        connectYellowSDK();
      }, 500);
      
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to connect wallet',
        isConnecting: false
      }));
      
      toast.error('Failed to connect wallet', {
        description: error.message || 'Please try again',
      });
    }
  }, [state.isConnecting]);

  // Connect Yellow SDK
  const connectYellowSDK = useCallback(async () => {
    if (!state.isWalletConnected || state.isYellowSDKConnected) return;
    
    try {
      await yellowSDKService.initializeConnection();
      
      // Auto-authenticate after connection
      setTimeout(() => {
        authenticateYellowSDK();
      }, 500);
      
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to connect to Yellow SDK'
      }));
      
      toast.error('Failed to connect to Yellow SDK', {
        description: error.message || 'Please try again',
      });
    }
  }, [state.isWalletConnected, state.isYellowSDKConnected]);

  // Authenticate with Yellow SDK
  const authenticateYellowSDK = useCallback(async () => {
    if (!state.isYellowSDKConnected || !state.walletAddress || state.isAuthenticating) return;
    
    setState(prev => ({ ...prev, isAuthenticating: true }));
    
    try {
      await yellowSDKService.authenticateUser(state.walletAddress);
      
      toast.success('Authenticated with Yellow SDK!', {
        description: 'You can now access premium features',
      });
      
      // Initialize persistent music library
      await persistentMusicService.initializeLibrary(state.walletAddress);
      
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Authentication failed'
      }));
      
      toast.error('Authentication failed', {
        description: error.message || 'Please try again',
      });
    } finally {
      setState(prev => ({ ...prev, isAuthenticating: false }));
    }
  }, [state.isYellowSDKConnected, state.walletAddress, state.isAuthenticating]);

  // Create payment channel
  const createPaymentChannel = useCallback(async (initialDeposit: number = 0.1) => {
    if (!state.isYellowSDKAuthenticated) {
      throw new Error('Please authenticate first');
    }
    
    try {
      const channel = await yellowSDKService.createPaymentChannel(initialDeposit);
      
      toast.success('Payment channel created!', {
        description: 'You can now make instant payments',
      });
      
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to create payment channel'
      }));
      
      toast.error('Failed to create payment channel', {
        description: error.message || 'Please try again',
      });
      throw error;
    }
  }, [state.isYellowSDKAuthenticated]);

  // Switch network
  const switchNetwork = useCallback(async (chainId: number) => {
    try {
      await web3Service.switchChain(chainId);
      toast.success('Network switched successfully');
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to switch network'
      }));
      
      toast.error('Failed to switch network', {
        description: error.message || 'Please try again',
      });
    }
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!state.walletAddress) return;
    
    try {
      const balance = await web3Service.getBalance(state.walletAddress);
      setState(prev => ({
        ...prev,
        balance: parseFloat(balance).toFixed(4)
      }));
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  }, [state.walletAddress]);

  // Disconnect all
  const handleDisconnectAll = useCallback(() => {
    web3Service.disconnect();
    yellowSDKService.disconnect();
    nitroLiteService.disconnect();
    
    setState({
      isWalletConnected: false,
      isYellowSDKConnected: false,
      isYellowSDKAuthenticated: false,
      isNitroLiteConnected: false,
      walletAddress: null,
      chainId: null,
      balance: '0',
      yellowBalance: 0,
      paymentChannel: null,
      session: null,
      userRole: null,
      isRoleLoading: false,
      nftMintingStatus: {
        remainingMints: 0,
        weeklyLimit: 0,
        resetDate: null,
        isLimited: true,
        canMint: false
      },
      isConnecting: false,
      isAuthenticating: false,
      error: null
    });
    
    toast.success('Disconnected successfully');
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    handleDisconnectAll();
  }, [handleDisconnectAll]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Check if fully connected
  const isFullyConnected = useCallback(() => {
    return state.isWalletConnected && 
           state.isYellowSDKConnected && 
           state.isYellowSDKAuthenticated;
  }, [state.isWalletConnected, state.isYellowSDKConnected, state.isYellowSDKAuthenticated]);

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    if (!state.isWalletConnected) return 'wallet_disconnected';
    if (!state.isYellowSDKConnected) return 'yellow_disconnected';
    if (!state.isYellowSDKAuthenticated) return 'not_authenticated';
    if (!state.paymentChannel) return 'no_channel';
    return 'fully_connected';
  }, [state.isWalletConnected, state.isYellowSDKConnected, state.isYellowSDKAuthenticated, state.paymentChannel]);

  const value: WalletContextValue = {
    ...state,
    connectWallet,
    disconnectWallet,
    connectYellowSDK,
    authenticateYellowSDK,
    createPaymentChannel,
    refreshUserRole,
    refreshNFTMintingStatus,
    isArtist,
    canUploadMusic,
    canMintNFT,
    switchNetwork,
    refreshBalance,
    clearError,
    isFullyConnected,
    getConnectionStatus
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Hook to use wallet context
export const useWallet = (): WalletContextValue => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export default WalletProvider;