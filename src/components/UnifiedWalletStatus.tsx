// Mock Unified Wallet Status - Replacement for removed Yellow SDK
import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, CheckCircle, XCircle, Loader2, Settings } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useYellowSDK } from '@/hooks/useYellowSDK';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface UnifiedWalletStatusProps {
  variant?: 'full' | 'compact' | 'minimal';
  showActions?: boolean;
  className?: string;
}

const UnifiedWalletStatus: React.FC<UnifiedWalletStatusProps> = ({
  variant = 'compact',
  showActions = false,
  className = ''
}) => {
  const { 
    isWalletConnected, 
    walletAddress, 
    balance, 
    connectWallet, 
    disconnectWallet,
    isConnecting 
  } = useWallet();
  
  const { 
    isConnected: isYellowConnected, 
    isAuthenticated: isYellowAuthenticated,
    connect: connectYellow,
    disconnect: disconnectYellow,
    isLoading: isYellowLoading
  } = useYellowSDK();

  const getOverallStatus = () => {
    if (isConnecting || isYellowLoading) return 'loading';
    if (isWalletConnected && isYellowAuthenticated) return 'fully_connected';
    if (isWalletConnected && isYellowConnected) return 'partially_connected';
    if (isWalletConnected) return 'wallet_only';
    return 'disconnected';
  };

  const getStatusIcon = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'fully_connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'partially_connected':
        return <CheckCircle className="w-4 h-4 text-yellow-500" />;
      case 'wallet_only':
        return <Wallet className="w-4 h-4 text-blue-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'loading':
        return 'Connecting...';
      case 'fully_connected':
        return 'Fully Connected';
      case 'partially_connected':
        return 'Partially Connected';
      case 'wallet_only':
        return 'Wallet Connected';
      default:
        return 'Disconnected';
    }
  };

  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center ${className}`}
      >
        {getStatusIcon()}
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center space-x-3 ${className}`}
      >
        {getStatusIcon()}
        <div className="flex flex-col">
          <Badge variant="outline" className="text-xs">
            {getStatusText()}
          </Badge>
          {walletAddress && (
            <span className="text-xs text-figma-text-secondary font-mono">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          )}
        </div>
        
        {showActions && (
          <div className="flex space-x-1">
            {!isWalletConnected ? (
              <Button
                size="sm"
                variant="outline"
                onClick={connectWallet}
                disabled={isConnecting}
                className="text-xs"
              >
                Connect
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={disconnectWallet}
                className="text-xs"
              >
                <Settings className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  // Full variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="glass-card border-figma-glass-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-2">
              <Wallet className="w-4 h-4" />
              <span>Wallet Status</span>
            </span>
            {getStatusIcon()}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Wallet Connection Status */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-figma-text-secondary">Wallet:</span>
              <Badge 
                variant="outline" 
                className={`text-${isWalletConnected ? 'green' : 'red'}-600 border-${isWalletConnected ? 'green' : 'red'}-300`}
              >
                {isWalletConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            
            {walletAddress && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-figma-text-secondary">Address:</span>
                <span className="text-xs font-mono text-figma-text">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                </span>
              </div>
            )}
            
            {balance !== null && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-figma-text-secondary">Balance:</span>
                <span className="text-xs font-mono text-figma-text">
                  {parseFloat(balance).toFixed(4)} ETH
                </span>
              </div>
            )}
          </div>

          {/* Yellow SDK Status */}
          <div className="space-y-2 pt-2 border-t border-figma-glass-border">
            <div className="flex justify-between items-center">
              <span className="text-xs text-figma-text-secondary">Yellow SDK:</span>
              <Badge 
                variant="outline" 
                className={`text-${isYellowConnected ? 'green' : 'red'}-600 border-${isYellowConnected ? 'green' : 'red'}-300`}
              >
                {isYellowConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-figma-text-secondary">Authentication:</span>
              <Badge 
                variant="outline" 
                className={`text-${isYellowAuthenticated ? 'green' : 'gray'}-600 border-${isYellowAuthenticated ? 'green' : 'gray'}-300`}
              >
                {isYellowAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex space-x-2 pt-2">
              {!isWalletConnected ? (
                <Button
                  size="sm"
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="flex-1"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Wallet'
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={disconnectWallet}
                    className="flex-1"
                  >
                    Disconnect
                  </Button>
                  {!isYellowConnected && (
                    <Button
                      size="sm"
                      onClick={connectYellow}
                      disabled={isYellowLoading}
                      className="flex-1"
                    >
                      Connect Yellow
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UnifiedWalletStatus;