import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/contexts/WalletContext';
import { web3Service } from '@/services/web3Service';
import { yellowSDKService } from '@/services/yellowSDKService';
import { RefreshCw, Wifi, WifiOff, CheckCircle, XCircle } from 'lucide-react';

const WalletStatusDebugger: React.FC = () => {
  const wallet = useWallet();
  const [rawWeb3Status, setRawWeb3Status] = useState({
    account: null as string | null,
    chainId: null as number | null,
    isConnected: false
  });
  const [rawYellowStatus, setRawYellowStatus] = useState({
    isConnected: false,
    isAuthenticated: false,
    session: null as any
  });

  const refreshRawStatus = () => {
    // Get raw status from services
    setRawWeb3Status({
      account: web3Service.getCurrentAccount(),
      chainId: web3Service.getCurrentChainId(),
      isConnected: web3Service.isWalletConnected()
    });

    setRawYellowStatus({
      isConnected: yellowSDKService.getConnectionStatus(),
      isAuthenticated: yellowSDKService.getAuthenticationStatus(),
      session: yellowSDKService.getCurrentSession()
    });
  };

  useEffect(() => {
    refreshRawStatus();
    const interval = setInterval(refreshRawStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const StatusIndicator = ({ isActive, label }: { isActive: boolean; label: string }) => (
    <div className="flex items-center space-x-2">
      {isActive ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      )}
      <span className="text-sm">{label}</span>
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="glass-card border-figma-glass-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <span>Wallet Status Debugger</span>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshRawStatus}
              className="text-white border-white/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Context Status */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Wallet Context Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <StatusIndicator isActive={wallet.isWalletConnected} label="Wallet Connected" />
              <StatusIndicator isActive={wallet.isYellowSDKConnected} label="Yellow SDK Connected" />
              <StatusIndicator isActive={wallet.isYellowSDKAuthenticated} label="Yellow SDK Authenticated" />
              <StatusIndicator isActive={wallet.isFullyConnected()} label="Fully Connected" />
            </div>
            
            <div className="space-y-2 text-sm text-white/70">
              <div>Address: {wallet.walletAddress || 'None'}</div>
              <div>Chain ID: {wallet.chainId || 'None'}</div>
              <div>Balance: {wallet.balance} ETH</div>
              <div>Yellow Balance: {wallet.yellowBalance}</div>
              <div>Connection Status: {wallet.getConnectionStatus()}</div>
            </div>
          </div>

          {/* Raw Service Status */}
          <div className="space-y-3 border-t border-white/20 pt-4">
            <h3 className="text-lg font-semibold text-white">Raw Service Status</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-white mb-2">Web3 Service</h4>
                <div className="grid grid-cols-2 gap-4">
                  <StatusIndicator isActive={rawWeb3Status.isConnected} label="Connected" />
                  <StatusIndicator isActive={!!rawWeb3Status.account} label="Has Account" />
                </div>
                <div className="text-sm text-white/70 mt-2">
                  <div>Account: {rawWeb3Status.account || 'None'}</div>
                  <div>Chain ID: {rawWeb3Status.chainId || 'None'}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-white mb-2">Yellow SDK Service</h4>
                <div className="grid grid-cols-2 gap-4">
                  <StatusIndicator isActive={rawYellowStatus.isConnected} label="Connected" />
                  <StatusIndicator isActive={rawYellowStatus.isAuthenticated} label="Authenticated" />
                </div>
                <div className="text-sm text-white/70 mt-2">
                  <div>Session: {rawYellowStatus.session ? 'Active' : 'None'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Comparison */}
          <div className="space-y-3 border-t border-white/20 pt-4">
            <h3 className="text-lg font-semibold text-white">Status Sync Check</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Wallet Connection Sync:</span>
                <Badge variant={wallet.isWalletConnected === rawWeb3Status.isConnected ? "default" : "destructive"}>
                  {wallet.isWalletConnected === rawWeb3Status.isConnected ? "Synced" : "Out of Sync"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Address Sync:</span>
                <Badge variant={wallet.walletAddress === rawWeb3Status.account ? "default" : "destructive"}>
                  {wallet.walletAddress === rawWeb3Status.account ? "Synced" : "Out of Sync"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Chain ID Sync:</span>
                <Badge variant={wallet.chainId === rawWeb3Status.chainId ? "default" : "destructive"}>
                  {wallet.chainId === rawWeb3Status.chainId ? "Synced" : "Out of Sync"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 border-t border-white/20 pt-4">
            <h3 className="text-lg font-semibold text-white">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {!wallet.isWalletConnected ? (
                <Button
                  onClick={wallet.connectWallet}
                  disabled={wallet.isConnecting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {wallet.isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              ) : (
                <Button
                  onClick={wallet.disconnectWallet}
                  variant="destructive"
                >
                  Disconnect Wallet
                </Button>
              )}
              
              {wallet.isWalletConnected && !wallet.isYellowSDKConnected && (
                <Button
                  onClick={wallet.connectYellowSDK}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Connect Yellow SDK
                </Button>
              )}
              
              {wallet.isYellowSDKConnected && !wallet.isYellowSDKAuthenticated && (
                <Button
                  onClick={wallet.authenticateYellowSDK}
                  disabled={wallet.isAuthenticating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {wallet.isAuthenticating ? "Authenticating..." : "Authenticate"}
                </Button>
              )}
              
              <Button
                onClick={wallet.refreshBalance}
                variant="outline"
                className="text-white border-white/20"
              >
                Refresh Balance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletStatusDebugger;