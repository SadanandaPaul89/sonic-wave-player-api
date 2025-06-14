
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Track } from '@/services/api';
import { Copy, Facebook, Twitter, MessageCircle, Mail, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, track }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/share/${track.id}`;
  const shareText = `Check out "${track.name}" by ${track.artistName} on Sonic Wave!`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareToSocial = (platform: string) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      email: `mailto:?subject=${encodeURIComponent(`Check out this song: ${track.name}`)}&body=${encodedText}%20${encodedUrl}`
    };

    window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-spotify-elevated border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Share "{track.name}"</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Track Preview */}
          <div className="flex items-center space-x-3 p-3 bg-spotify-base rounded-lg">
            <img
              src={track.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center'}
              alt={track.name}
              className="w-12 h-12 rounded object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{track.name}</div>
              <div className="text-xs text-gray-400 truncate">{track.artistName}</div>
            </div>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Share link</label>
            <div className="flex space-x-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 bg-spotify-base border-gray-600 text-white"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="icon"
                className="border-gray-600 hover:bg-gray-700"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Share to</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => shareToSocial('twitter')}
                variant="outline"
                className="border-gray-600 hover:bg-gray-700 text-white"
              >
                <Twitter size={16} className="mr-2" />
                Twitter
              </Button>
              <Button
                onClick={() => shareToSocial('facebook')}
                variant="outline"
                className="border-gray-600 hover:bg-gray-700 text-white"
              >
                <Facebook size={16} className="mr-2" />
                Facebook
              </Button>
              <Button
                onClick={() => shareToSocial('whatsapp')}
                variant="outline"
                className="border-gray-600 hover:bg-gray-700 text-white"
              >
                <MessageCircle size={16} className="mr-2" />
                WhatsApp
              </Button>
              <Button
                onClick={() => shareToSocial('email')}
                variant="outline"
                className="border-gray-600 hover:bg-gray-700 text-white"
              >
                <Mail size={16} className="mr-2" />
                Email
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
