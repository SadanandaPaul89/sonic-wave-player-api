// Unified Wallet Status Component - Shows consistent wallet status across all components

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useWallet } from '@/contexts/WalletContext';
import { web3Service } from '@/services/web3Service';

interface UnifiedWalletStatusProps {
  variant?: 'full' | 'compact' | 'minimal';
  showActions?: boolean;
  className?: string;
}

const UnifiedWalletStatus: React.FC<UnifiedWalletStatusProps> = ({
  variant = 'full',
  showActions = true,
  className = ''
}) => {
  const {
    isWalletConnected,
    isYellowSDKConnected,
    isYellowSDKAuthenticated,
    walletAddress,
    chainId,
    balance,
    yellowBalance,
    paymentChannel,
    isConnecting,
    isAuthenticating,
    error,
    connectWallet,
    disconnectWallet,
    connectYellowSDK,
    authenticateYellowSDK,
    createPaymentChannel,
    clearError,
    isFullyConnected,
    getConnectionStatus
  } = useWallet();

  const [copiedAddress, setCopiedAddress] = React.useState(false);

  // Copy wallet address
  const copyAddress = async () => {
    if (walletAddress) {
      try {
        await navigator.clipboard.writeText(walletAddress);
        setCopiedAddress(true);
        toast.success('Address copied to clipboard');
        setTimeout(() => setCopiedAddress(false), 2000);
      } catch (error) {
        toast.error('Failed to copy address');
      }
    }
  };

  // Get current chain info
  const getCurrentChain = () => {
    return web3Service.getSupportedChains().find(chain => chain.chainId === chainId);
  };

  // Get status display info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'wallet_disconnected':
        return {
          icon: <AlertCircle size={16} className="text-red-400" />,
          label: 'Wallet Disconnected',
          color: 'text-red-400',
          bgColor: 'bg-red-500/20'
        };
      case 'yellow_disconnected':
        return {
          icon: <AlertCircle size={16} className="text-yellow-400" />,
          label: 'Yellow SDK Disconnected',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20'
        };
      case 'not_authenticated':
        return {
          icon: <AlertCircle size={16} className="text-yellow-400" />,
          label: 'Not Authenticated',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20'
        };
      case 'no_channel':
        return {
          icon: <AlertCircle size={16} className="text-blue-400" />,
          label: 'No Payment Channel',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20'
        };
      case 'fully_connected':
        return {
          icon: <CheckCircle size={16} className="text-green-400" />,
          label: 'Fully Connected',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20'
        };
      default:
        return {
          icon: <AlertCircle size={16} className="text-gray-400" />,
          label: 'Unknown Status',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20'
        };
    }
  };

  const connectionStatus = getConnectionStatus();
  const statusInfo = getStatusInfo(connectionStatus);
  const currentChain = getCurrentChain();

  // Minimal variant - just a status badge
  if (variant === 'minimal') {
    return (
      <Badge className={`${statusInfo.bgColor} ${statusInfo.color} flex items-center gap-2 ${className}`}>
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  }

  // Compact variant - single line status
  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between p-3 bg-white/5 rounded-figma-md ${className}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${statusInfo.bgColor}`}>
            {statusInfo.icon}
          </div>
          <div>
            <p className="text-white font-medium text-sm">{statusInfo.label}</p>
            {walletAddress && (
              <p className="text-white/60 text-xs">
                {web3Service.formatAddress(walletAddress)}
              </p>
            )}
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center gap-2">
            {!isWalletConnected ? (
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                size="sm"
                className="bg-figma-purple hover:bg-figma-purple/80"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Connect'
                )}
              </Button>
            ) : !isYellowSDKConnected ? (
              <Button
                onClick={connectYellowSDK}
                size="sm"
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                Connect Yellow SDK
              </Button>
            ) : !isYellowSDKAuthenticated ? (
              <Button
                onClick={authenticateYellowSDK}
                disabled={isAuthenticating}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isAuthenticating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Authenticate'
                )}
              </Button>
            ) : !paymentChannel ? (
              <Button
                onClick={() => createPaymentChannel()}
                size="sm"
                className="bg-green-500 hover:bg-green-600"
              >
                Create Channel
              </Button>
            ) : (
              <Button
                onClick={disconnectWallet}
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/20"
              >
                Disconnect
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full variant - detailed status card
  return (
    <Card className={`glass-card border-figma-glass-border ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 bg-gradient-to-r from-figma-purple to-yellow-500 rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <Zap size={20} className="text-white" />
          </motion.div>
          Wallet Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className={`flex items-center justify-between p-3 rounded-figma-md ${statusInfo.bgColor}`}>
          <div className="flex items-center gap-3">
            {statusInfo.icon}
            <span className={`font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          {isFullyConnected() && (
            <CheckCircle size={20} className="text-green-400" />
          )}
        </div>

        {/* Wallet Connection */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-figma-md">
          <div className="flex items-center gap-3">
            {isWalletConnected ? (
              <CheckCircle size={20} className="text-green-400" />
            ) : (
              <AlertCircle size={20} className="text-red-400" />
            )}
            <div>
              <p className="text-white font-medium">Wallet</p>
              {walletAddress ? (
                <div className="flex items-center gap-2">
                  <p className="text-white/60 text-sm font-mono">
                    {web3Service.formatAddress(walletAddress)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="h-6 w-6 p-0 text-white/60 hover:text-figma-purple"
                  >
                    {copiedAddress ? (
                      <Check size={12} className="text-green-400" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-white/60 text-sm">Not connected</p>
              )}
            </div>
          </div>
          <Badge className={isWalletConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
            {isWalletConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* Network Info */}
        {isWalletConnected && currentChain && (
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-figma-md">
            <div>
              <p className="text-white font-medium">{currentChain.name}</p>
              <p className="text-white/60 text-sm">Balance: {balance} {currentChain.currency}</p>
            </div>
            <Badge className={currentChain.testnet ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}>
              {currentChain.testnet ? 'Testnet' : 'Mainnet'}
            </Badge>
          </div>
        )}

        {/* Yellow SDK Status */}
        {isWalletConnected && (
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-figma-md">
            <div className="flex items-center gap-3">
              {isYellowSDKAuthenticated ? (
                <CheckCircle size={20} className="text-green-400" />
              ) : isYellowSDKConnected ? (
                <AlertCircle size={20} className="text-yellow-400" />
              ) : (
                <AlertCircle size={20} className="text-red-400" />
              )}
              <div>
                <p className="text-white font-medium">Yellow SDK</p>
                <p className="text-white/60 text-sm">
                  {isYellowSDKAuthenticated ? 'Authenticated' : 
                   isYellowSDKConnected ? 'Connected, not authenticated' : 
                   'Not connected'}
                </p>
              </div>
            </div>
            <Badge className={
              isYellowSDKAuthenticated ? 'bg-green-500/20 text-green-400' :
              isYellowSDKConnected ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }>
              {isYellowSDKAuthenticated ? 'Authenticated' :
               isYellowSDKConnected ? 'Connected' :
               'Disconnected'}
            </Badge>
          </div>
        )}

        {/* Payment Channel */}
        {isYellowSDKAuthenticated && (
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
            <Badge className={paymentChannel ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
              {paymentChannel ? 'Active' : 'None'}
            </Badge>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="space-y-2">
            {!isWalletConnected ? (
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-figma-purple to-yellow-500 hover:from-figma-purple/80 hover:to-yellow-500/80"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet size={16} className="mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            ) : !isYellowSDKConnected ? (
              <Button
                onClick={connectYellowSDK}
                className="w-full bg-yellow-500 hover:bg-yellow-600"
              >
                <Zap size={16} className="mr-2" />
                Connect Yellow SDK
              </Button>
            ) : !isYellowSDKAuthenticated ? (
              <Button
                onClick={authenticateYellowSDK}
                disabled={isAuthenticating}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    Authenticate
                  </>
                )}
              </Button>
            ) : !paymentChannel ? (
              <Button
                onClick={() => createPaymentChannel()}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                <Zap size={16} className="mr-2" />
                Create Payment Channel
              </Button>
            ) : (
              <Button
                onClick={disconnectWallet}
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400/50"
              >
                <Wallet size={16} className="mr-2" />
                Disconnect All
              </Button>
            )}
          </div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-red-500/20 border border-red-500/30 rounded-figma-md"
            >
              <div className="flex items-center gap-3">
                <AlertCircle size={16} className="text-red-400" />
                <div className="flex-1">
                  <p className="text-red-400 font-medium text-sm">Error</p>
                  <p className="text-red-300 text-xs">{error}</p>
                </div>
                <Button
                  onClick={clearError}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-300 hover:text-red-200"
                >
                  ×
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default UnifiedWalletStatus;