// Yellow SDK Wallet Connect - Integrated wallet connection with Yellow SDK authentication

import React, { useState, useEffect } from 'react';
import { Wallet, Zap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { web3Service } from '@/services/web3Service';
import { useYellowSDK } from '@/hooks/useYellowSDK';

interface YellowSDKWalletConnectProps {
  onConnect?: (account: string, chainId: number) => void;
  onDisconnect?: () => void;
  className?: string;
}

const YellowSDKWalletConnect: React.FC<YellowSDKWalletConnectProps> = ({
  onConnect,
  onDisconnect,
  className = ''
}) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAccount, setWalletAccount] = useState<string | null>(null);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [balance, setBalance] = useState<string>('0');
  const [connectionStep, setConnectionStep] = useState<string>('');
  const [isOneClickConnecting, setIsOneClickConnecting] = useState(false);

  const {
    isConnected: yellowConnected,
    isAuthenticated: yellowAuthenticated,
    isConnecting: yellowConnecting,
    session,
    balance: yellowBalance,
    paymentChannel,
    error: yellowError,
    connect: connectYellow,
    authenticate: authenticateYellow,
    createPaymentChannel,
    clearError
  } = useYellowSDK();

  // Check wallet connection on mount
  useEffect(() => {
    const checkWalletConnection = () => {
      const account = web3Service.getCurrentAccount();
      const chainId = web3Service.getCurrentChainId();
      
      if (account && chainId) {
        setWalletAccount(account);
        setWalletChainId(chainId);
        setWalletConnected(true);
      }
    };

    checkWalletConnection();
  }, []);

  // Get balance when wallet account changes
  useEffect(() => {
    const getBalance = async () => {
      if (walletAccount) {
        try {
          const balanceEth = await web3Service.getBalance(walletAccount);
          setBalance(parseFloat(balanceEth).toFixed(4));
        } catch (error) {
          console.error('Error getting balance:', error);
          setBalance('0');
        }
      }
    };

    getBalance();
  }, [walletAccount, walletChainId]);

  // One-click connect - handles wallet + Yellow SDK + authentication + payment channel
  const handleOneClickConnect = async () => {
    setIsOneClickConnecting(true);
    setConnectionStep('Connecting wallet...');

    try {
      // Step 1: Connect wallet
      const { account, chainId } = await web3Service.connectWallet();
      setWalletAccount(account);
      setWalletChainId(chainId);
      setWalletConnected(true);
      onConnect?.(account, chainId);

      setConnectionStep('Connecting to Yellow SDK...');

      // Step 2: Connect to Yellow SDK
      clearError();
      await connectYellow();

      setConnectionStep('Authenticating...');

      // Step 3: Authenticate
      await authenticateYellow(account, 'demo-signature');

      setConnectionStep('Creating payment channel...');

      // Step 4: Create payment channel
      await createPaymentChannel();

      setConnectionStep('');
      toast.success('Fully connected!', {
        description: 'Wallet, Yellow SDK, and payment channel are ready',
      });

    } catch (error: any) {
      console.error('One-click connection failed:', error);
      setConnectionStep('');
      toast.error('Connection failed', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsOneClickConnecting(false);
    }
  };

  // Connect wallet (legacy - kept for backward compatibility)
  const handleConnectWallet = async () => {
    setIsConnectingWallet(true);

    try {
      const { account, chainId } = await web3Service.connectWallet();

      setWalletAccount(account);
      setWalletChainId(chainId);
      setWalletConnected(true);

      onConnect?.(account, chainId);

      toast.success('Wallet connected successfully!', {
        description: `Connected to ${web3Service.formatAddress(account)}`,
      });

      // Auto-connect to Yellow SDK after wallet connection
      setTimeout(() => {
        handleConnectYellow();
      }, 500);

    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsConnectingWallet(false);
    }
  };

  // Connect to Yellow SDK
  const handleConnectYellow = async () => {
    if (!walletConnected || !walletAccount) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      clearError();
      await connectYellow();
      
      // Auto-authenticate after connection
      setTimeout(() => {
        handleAuthenticate();
      }, 500);
      
    } catch (error: any) {
      console.error('Error connecting to Yellow SDK:', error);
      toast.error('Failed to connect to Yellow SDK', {
        description: error.message || 'Please try again',
      });
    }
  };

  // Authenticate with Yellow SDK
  const handleAuthenticate = async () => {
    if (!yellowConnected || !walletAccount) {
      toast.error('Please connect to Yellow SDK first');
      return;
    }

    try {
      // For demo purposes, we'll authenticate with a dummy signature
      // In production, you'd want to sign a message for security
      await authenticateYellow(walletAccount, 'demo-signature');
      
      toast.success('Authenticated with Yellow SDK!', {
        description: 'You can now access premium features',
      });
      
    } catch (error: any) {
      console.error('Error authenticating:', error);
      toast.error('Authentication failed', {
        description: error.message || 'Please try again',
      });
    }
  };

  // Create payment channel
  const handleCreateChannel = async () => {
    if (!yellowAuthenticated) {
      toast.error('Please authenticate first');
      return;
    }

    try {
      await createPaymentChannel();
      
      toast.success('Payment channel created!', {
        description: 'You can now make instant payments',
      });
      
    } catch (error: any) {
      console.error('Error creating channel:', error);
      toast.error('Failed to create payment channel', {
        description: error.message || 'Please try again',
      });
    }
  };

  // Disconnect everything
  const handleDisconnect = () => {
    web3Service.disconnect();
    setWalletAccount(null);
    setWalletChainId(null);
    setWalletConnected(false);
    setBalance('0');
    
    onDisconnect?.();
    
    toast.success('Disconnected successfully');
  };

  // Get connection status
  const getConnectionStatus = () => {
    if (!walletConnected) return 'wallet_disconnected';
    if (!yellowConnected) return 'yellow_disconnected';
    if (!yellowAuthenticated) return 'not_authenticated';
    if (!paymentChannel) return 'no_channel';
    return 'fully_connected';
  };

  const connectionStatus = getConnectionStatus();

  // If not connected at all, show connection prompt
  if (!walletConnected) {
    return (
      <Card className={`glass-card border-figma-glass-border ${className}`}>
        <CardContent className="p-6 text-center">
          <motion.div
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-figma-purple/20 to-yellow-500/20 rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative">
              <Wallet size={32} className="text-figma-purple" />
              <Zap size={16} className="absolute -top-1 -right-1 text-yellow-400" />
            </div>
          </motion.div>
          
          <h2 className="text-2xl font-bold text-white mb-4">Connect to Yellow SDK</h2>
          <p className="text-white/70 mb-8 max-w-md mx-auto">
            Connect your wallet and authenticate with Yellow SDK to access instant payments, 
            exclusive content, and decentralized features.
          </p>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="space-y-4">
              <Button
                onClick={handleOneClickConnect}
                disabled={isOneClickConnecting}
                className="bg-gradient-to-r from-figma-purple to-yellow-500 hover:from-figma-purple/80 hover:to-yellow-500/80 text-white px-8 py-3 text-lg font-medium rounded-figma-md transition-all duration-300 shadow-lg hover:shadow-figma-purple/25 w-full"
              >
                {isOneClickConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                    {connectionStep || 'Connecting...'}
                  </>
                ) : (
                  <>
                    <Zap size={20} className="mr-3" />
                    One-Click Connect
                  </>
                )}
              </Button>

              {connectionStep && (
                <div className="text-center">
                  <p className="text-white/60 text-sm">{connectionStep}</p>
                </div>
              )}
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <Card className="glass-card border-figma-glass-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 bg-gradient-to-r from-figma-purple to-yellow-500 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <Zap size={20} className="text-white" />
            </motion.div>
            Yellow SDK Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet Status */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-figma-md">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-green-400" />
              <div>
                <p className="text-white font-medium">Wallet Connected</p>
                <p className="text-white/60 text-sm">{web3Service.formatAddress(walletAccount!)}</p>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-400">Connected</Badge>
          </div>

          {/* Yellow SDK Status */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-figma-md">
            <div className="flex items-center gap-3">
              {yellowConnected ? (
                <CheckCircle size={20} className="text-green-400" />
              ) : yellowConnecting ? (
                <Loader2 size={20} className="text-yellow-400 animate-spin" />
              ) : (
                <AlertCircle size={20} className="text-red-400" />
              )}
              <div>
                <p className="text-white font-medium">Yellow SDK</p>
                <p className="text-white/60 text-sm">
                  {yellowConnected ? 'Connected' : yellowConnecting ? 'Connecting...' : 'Disconnected'}
                </p>
              </div>
            </div>
            <Badge className={
              yellowConnected ? 'bg-green-500/20 text-green-400' :
              yellowConnecting ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }>
              {yellowConnected ? 'Connected' : yellowConnecting ? 'Connecting' : 'Disconnected'}
            </Badge>
          </div>

          {/* Authentication Status */}
          {yellowConnected && (
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-figma-md">
              <div className="flex items-center gap-3">
                {yellowAuthenticated ? (
                  <CheckCircle size={20} className="text-green-400" />
                ) : (
                  <AlertCircle size={20} className="text-yellow-400" />
                )}
                <div>
                  <p className="text-white font-medium">Authentication</p>
                  <p className="text-white/60 text-sm">
                    {yellowAuthenticated ? 'Authenticated' : 'Not authenticated'}
                  </p>
                </div>
              </div>
              <Badge className={
                yellowAuthenticated ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }>
                {yellowAuthenticated ? 'Authenticated' : 'Pending'}
              </Badge>
            </div>
          )}

          {/* Payment Channel Status */}
          {yellowAuthenticated && (
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-figma-md">
              <div className="flex items-center gap-3">
                {paymentChannel ? (
                  <CheckCircle size={20} className="text-green-400" />
                ) : (
                  <AlertCircle size={20} className="text-yellow-400" />
                )}
                <div>
                  <p className="text-white font-medium">Payment Channel</p>
                  <p className="text-white/60 text-sm">
                    {paymentChannel ? 'Active channel' : 'No active channel'}
                  </p>
                </div>
              </div>
              <Badge className={
                paymentChannel ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }>
                {paymentChannel ? 'Active' : 'None'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!yellowConnected && (
          <Button
            onClick={handleConnectYellow}
            disabled={yellowConnecting}
            className="w-full bg-gradient-to-r from-figma-purple to-yellow-500 hover:from-figma-purple/80 hover:to-yellow-500/80 text-white"
          >
            {yellowConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Connecting to Yellow SDK...
              </>
            ) : (
              <>
                <Zap size={16} className="mr-2" />
                Connect to Yellow SDK
              </>
            )}
          </Button>
        )}

        {yellowConnected && !yellowAuthenticated && (
          <Button
            onClick={handleAuthenticate}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            <CheckCircle size={16} className="mr-2" />
            Authenticate
          </Button>
        )}

        {yellowAuthenticated && !paymentChannel && (
          <Button
            onClick={handleCreateChannel}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
          >
            <Zap size={16} className="mr-2" />
            Create Payment Channel
          </Button>
        )}

        <Button
          onClick={handleDisconnect}
          variant="outline"
          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400/50"
        >
          <Wallet size={16} className="mr-2" />
          Disconnect All
        </Button>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {yellowError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/20 border border-red-500/30 rounded-figma-md"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-400" />
              <div>
                <p className="text-red-400 font-medium">Connection Error</p>
                <p className="text-red-300 text-sm">{yellowError}</p>
              </div>
            </div>
            <Button
              onClick={clearError}
              variant="ghost"
              size="sm"
              className="mt-2 text-red-300 hover:text-red-200"
            >
              Dismiss
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default YellowSDKWalletConnect;