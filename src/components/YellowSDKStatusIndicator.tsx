// Yellow SDK Connection Status Indicator

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Loader2, AlertCircle, CheckCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useYellowSDK } from '@/hooks/useYellowSDK';
import { toast } from 'sonner';

interface YellowSDKStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const YellowSDKStatusIndicator: React.FC<YellowSDKStatusIndicatorProps> = ({
  className = '',
  showDetails = false
}) => {
  const {
    isConnected,
    isAuthenticated,
    isConnecting,
    session,
    balance,
    paymentChannel,
    error,
    connect,
    disconnect,
    clearError
  } = useYellowSDK();

  const handleConnect = async () => {
    try {
      await connect();
      toast.success('Connected to Yellow SDK');
    } catch (error) {
      toast.error('Failed to connect to Yellow SDK');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.info('Disconnected from Yellow SDK');
  };

  const getStatusIcon = () => {
    if (isConnecting) {
      return <Loader2 size={16} className="text-yellow-400 animate-spin" />;
    }
    if (error) {
      return <AlertCircle size={16} className="text-red-400" />;
    }
    if (isAuthenticated) {
      return <CheckCircle size={16} className="text-green-400" />;
    }
    if (isConnected) {
      return <Wifi size={16} className="text-blue-400" />;
    }
    return <WifiOff size={16} className="text-gray-400" />;
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (error) return 'Connection Error';
    if (isAuthenticated) return 'Authenticated';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (isConnecting) return 'text-yellow-400';
    if (error) return 'text-red-400';
    if (isAuthenticated) return 'text-green-400';
    if (isConnected) return 'text-blue-400';
    return 'text-gray-400';
  };

  if (!showDetails) {
    // Compact indicator
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getStatusIcon()}
        <span className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  // Detailed status card
  return (
    <Card className={`glass-card border-figma-glass-border ${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className={`font-medium ${getStatusColor()}`}>
                Yellow SDK
              </p>
              <p className="text-white/60 text-sm">
                {getStatusText()}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isConnected && !isConnecting && (
              <Button
                onClick={handleConnect}
                size="sm"
                className="bg-figma-purple hover:bg-figma-purple/80"
              >
                Connect
              </Button>
            )}
            {isConnected && (
              <Button
                onClick={handleDisconnect}
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Disconnect
              </Button>
            )}
          </div>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-red-500/20 border border-red-500/30 rounded-figma-sm"
            >
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 text-sm font-medium">Connection Error</p>
                  <p className="text-red-400/80 text-xs mt-1">{error}</p>
                </div>
                <Button
                  onClick={clearError}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  ×
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session Details */}
        <AnimatePresence>
          {isAuthenticated && session && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-figma-purple" />
                <span className="text-white font-medium text-sm">Session Active</span>
              </div>
              
              <div className="text-sm">
                <p className="text-white/60">Wallet</p>
                <p className="text-white font-mono">
                  {session.walletAddress.slice(0, 6)}...{session.walletAddress.slice(-4)}
                </p>
              </div>

              {paymentChannel && (
                <div className="p-3 bg-figma-purple/20 border border-figma-purple/30 rounded-figma-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white text-sm font-medium">Payment Channel Active</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-white/60">Channel ID</p>
                      <p className="text-white font-mono">
                        {paymentChannel.channelId.slice(0, 8)}...
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60">Status</p>
                      <p className="text-green-400 capitalize">{paymentChannel.status}</p>
                    </div>
                  </div>
                </div>
              )}

              {session.subscriptionStatus?.isActive && (
                <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-figma-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={14} className="text-blue-400" />
                    <span className="text-white text-sm font-medium">
                      {session.subscriptionStatus.tier.toUpperCase()} Subscription
                    </span>
                  </div>
                  <p className="text-white/60 text-xs">
                    Expires: {new Date(session.subscriptionStatus.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection Instructions */}
        {!isConnected && !isConnecting && !error && (
          <div className="p-3 bg-white/5 rounded-figma-sm">
            <p className="text-white/60 text-sm">
              Connect to Yellow SDK to enable off-chain payments and subscriptions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default YellowSDKStatusIndicator;