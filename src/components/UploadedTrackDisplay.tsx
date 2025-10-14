/**
 * Uploaded Track Display Component
 * Shows uploaded tracks with artwork and metadata
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Music, 
  ExternalLink, 
  Copy, 
  Check,
  Calendar,
  User,
  Disc,
  Tag
} from 'lucide-react';

import { toast } from 'sonner';

interface UploadedTrack {
  metadata: {
    title: string;
    artist: string;
    album?: string;
    genre?: string;
    year?: number;
    audioHash: string;
    artworkHash?: string;
    [key: string]: any;
  };
  hash: string;
}

interface UploadedTrackDisplayProps {
  tracks: UploadedTrack[];
  className?: string;
}

const UploadedTrackDisplay: React.FC<UploadedTrackDisplayProps> = ({
  tracks,
  className = ''
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(text);
      toast.success(`${type} hash copied to clipboard`);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getArtworkUrl = (artworkHash?: string) => {
    if (!artworkHash) return null;
    return `https://gateway.pinata.cloud/ipfs/${artworkHash}`;
  };

  const getAudioUrl = (audioHash: string) => {
    return `https://gateway.pinata.cloud/ipfs/${audioHash}`;
  };

  if (tracks.length === 0) {
    return (
      <Card className={`glass-card border-figma-glass-border ${className}`}>
        <CardContent className="py-12 text-center">
          <Music className="h-12 w-12 text-white/40 mx-auto mb-4" />
          <p className="text-white/60">No tracks uploaded yet</p>
          <p className="text-white/40 text-sm">Upload your first track to see it here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-white font-semibold text-lg">Your Uploaded Tracks</h3>
      
      <div className="space-y-4">
        {tracks.map((track, index) => (
          <div key={track.hash}>
            <Card className="glass-card border-figma-glass-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Artwork */}
                  <div className="flex-shrink-0">
                    {track.metadata.artworkHash ? (
                      <img
                        src={getArtworkUrl(track.metadata.artworkHash)}
                        alt={`${track.metadata.title} artwork`}
                        className="w-16 h-16 object-cover rounded border border-white/20"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIGZpbGw9IiM2NjYiLz4KPC9zdmc+';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white/10 rounded border border-white/20 flex items-center justify-center">
                        <Music className="h-6 w-6 text-white/40" />
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-white font-medium truncate">{track.metadata.title}</h4>
                        <p className="text-white/60 text-sm truncate">by {track.metadata.artist}</p>
                      </div>
                      
                      {/* Play Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const audio = new Audio(getAudioUrl(track.metadata.audioHash));
                          if (playingTrack === track.hash) {
                            audio.pause();
                            setPlayingTrack(null);
                          } else {
                            audio.play();
                            setPlayingTrack(track.hash);
                            audio.onended = () => setPlayingTrack(null);
                          }
                        }}
                        className="flex-shrink-0"
                      >
                        {playingTrack === track.hash ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {track.metadata.album && (
                        <Badge variant="secondary" className="text-xs">
                          <Disc className="h-3 w-3 mr-1" />
                          {track.metadata.album}
                        </Badge>
                      )}
                      {track.metadata.genre && (
                        <Badge variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {track.metadata.genre}
                        </Badge>
                      )}
                      {track.metadata.year && (
                        <Badge variant="secondary" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {track.metadata.year}
                        </Badge>
                      )}
                    </div>

                    {/* IPFS Hashes */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/60 min-w-0 flex-shrink-0">Metadata:</span>
                        <code className="text-xs text-white/80 font-mono truncate flex-1 bg-white/5 px-2 py-1 rounded">
                          {track.hash}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(track.hash, 'Metadata')}
                          className="flex-shrink-0 h-6 w-6 p-0"
                        >
                          {copiedHash === track.hash ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${track.hash}`, '_blank')}
                          className="flex-shrink-0 h-6 w-6 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/60 min-w-0 flex-shrink-0">Audio:</span>
                        <code className="text-xs text-white/80 font-mono truncate flex-1 bg-white/5 px-2 py-1 rounded">
                          {track.metadata.audioHash}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(track.metadata.audioHash, 'Audio')}
                          className="flex-shrink-0 h-6 w-6 p-0"
                        >
                          {copiedHash === track.metadata.audioHash ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${track.metadata.audioHash}`, '_blank')}
                          className="flex-shrink-0 h-6 w-6 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>

                      {track.metadata.artworkHash && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/60 min-w-0 flex-shrink-0">Artwork:</span>
                          <code className="text-xs text-white/80 font-mono truncate flex-1 bg-white/5 px-2 py-1 rounded">
                            {track.metadata.artworkHash}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(track.metadata.artworkHash!, 'Artwork')}
                            className="flex-shrink-0 h-6 w-6 p-0"
                          >
                            {copiedHash === track.metadata.artworkHash ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${track.metadata.artworkHash}`, '_blank')}
                            className="flex-shrink-0 h-6 w-6 p-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadedTrackDisplay;