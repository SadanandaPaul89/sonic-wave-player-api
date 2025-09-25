import React from 'react';
import { Globe, Zap, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Track } from '@/services/api';
import { musicService } from '@/services/musicService';

interface IPFSStatusIndicatorProps {
  track: Track;
  className?: string;
}

const IPFSStatusIndicator: React.FC<IPFSStatusIndicatorProps> = ({ track, className = '' }) => {
  const networkQuality = musicService.getNetworkQuality();

  if (!track.ipfs && !track.nft) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* IPFS Indicator */}
        {track.ipfs && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="bg-figma-purple/20 text-figma-purple border-figma-purple/30 text-xs">
                <Globe size={10} className="mr-1" />
                IPFS
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <p className="font-medium">Decentralized Storage</p>
                <p>Quality: {networkQuality.format}</p>
                <p>Bitrate: {networkQuality.bitrate}kbps</p>
                <p>Network: {networkQuality.connection}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* NFT Indicator */}
        {track.nft && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500/20 to-purple-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                <Zap size={10} className="mr-1" />
                NFT
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <p className="font-medium">NFT Exclusive</p>
                <p>Token ID: #{track.nft.tokenId}</p>
                <p>Contract: {track.nft.contractAddress.slice(0, 8)}...</p>
                {track.nft.isExclusive && <p className="text-yellow-400">Exclusive Content</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Network Quality Indicator */}
        {track.ipfs && (
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center">
                {networkQuality.connection === 'fast' ? (
                  <Wifi size={12} className="text-green-400" />
                ) : networkQuality.connection === 'medium' ? (
                  <Wifi size={12} className="text-yellow-400" />
                ) : (
                  <WifiOff size={12} className="text-red-400" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <p className="font-medium">Network Quality</p>
                <p>Connection: {networkQuality.connection}</p>
                <p>Streaming at {networkQuality.bitrate}kbps</p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default IPFSStatusIndicator;