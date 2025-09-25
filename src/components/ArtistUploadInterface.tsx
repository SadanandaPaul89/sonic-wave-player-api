// Artist Upload Interface - Role-protected music upload component

import React from 'react';
import { useWallet } from '@/contexts/WalletContext';
import IPFSMusicUploader from './IPFSMusicUploader';
import RoleIndicator from './RoleIndicator';
import SubscriptionPrompt from './SubscriptionPrompt';
import { Music, Lock, AlertTriangle, RefreshCw } from 'lucide-react';

interface ArtistUploadInterfaceProps {
  className?: string;
  onUploadComplete?: (track: any) => void;
}

const ArtistUploadInterface: React.FC<ArtistUploadInterfaceProps> = ({
  className = '',
  onUploadComplete
}) => {
  const { 
    userRole, 
    isRoleLoading, 
    walletAddress, 
    canUploadMusic,
    refreshUserRole 
  } = useWallet();

  // Not connected
  if (!walletAddress) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to access music upload features.
          </p>
          <button className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Loading role
  if (isRoleLoading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Verifying Account
          </h3>
          <p className="text-gray-600">
            Checking your account permissions...
          </p>
        </div>
      </div>
    );
  }

  // Not an artist
  if (userRole !== 'artist') {
    return (
      <div className={`${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Artist Account Required
              </h3>
              <p className="text-red-700 mb-4">
                Music upload is restricted to verified artist accounts. Your current account type is:
              </p>
              <div className="mb-4">
                <RoleIndicator size="lg" />
              </div>
              <p className="text-red-700 text-sm mb-4">
                If you believe this is an error, try refreshing your account status or contact support 
                if you should have artist privileges.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={refreshUserRole}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Status
                </button>
                <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Show upgrade options for normal users */}
        {userRole === 'normal' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Music className="w-6 h-6 text-blue-500 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">
                  Want to become an artist?
                </h4>
                <p className="text-blue-700 text-sm mb-4">
                  Artist accounts get unlimited NFT minting, music upload privileges, and priority support.
                </p>
                <div className="space-y-3">
                  <div className="text-sm text-blue-700">
                    <strong>How to get artist status:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Own a verified artist NFT from our partner collections</li>
                      <li>Apply through our artist verification program</li>
                      <li>Get whitelisted by our team</li>
                    </ul>
                  </div>
                  <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Artist with upload restrictions
  if (!canUploadMusic()) {
    return (
      <div className={`${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Upload Temporarily Unavailable
              </h3>
              <div className="mb-4">
                <RoleIndicator size="lg" />
              </div>
              <p className="text-yellow-700 mb-4">
                Your artist account is verified, but music upload features are currently unavailable. 
                This could be due to:
              </p>
              <ul className="list-disc list-inside text-yellow-700 text-sm mb-4 space-y-1">
                <li>Temporary system maintenance</li>
                <li>Network connectivity issues</li>
                <li>Account verification in progress</li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={refreshUserRole}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
                <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Artist with full access
  return (
    <div className={className}>
      {/* Artist Status Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Music className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Artist Upload Center</h3>
              <p className="text-sm text-gray-600">Upload your music to IPFS</p>
            </div>
          </div>
          <RoleIndicator size="md" />
        </div>
      </div>

      {/* Upload Interface */}
      <IPFSMusicUploader 
        onUploadComplete={onUploadComplete}
        className="artist-upload-interface"
      />

      {/* Artist Benefits Reminder */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Artist Benefits</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Unlimited NFT minting</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Priority IPFS pinning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Advanced analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Direct fan engagement</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistUploadInterface;