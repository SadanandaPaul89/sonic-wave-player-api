import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Track } from '@/services/supabaseService';
import { Copy, Facebook, Twitter, Instagram, Linkedin, Mail, MessageCircle, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, track }) => {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/share/${track.id}`;
  const shareText = `Check out "${track.name}" by ${track.artistName} on Sonic Wave!`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out "${track.name}" on Sonic Wave`);
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareToInstagram = () => {
    // Instagram doesn't support direct URL sharing, so we copy to clipboard with instructions
    copyToClipboard();
    toast({
      title: "Instagram sharing",
      description: "Link copied! Paste it in your Instagram story or bio",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{track.name}"</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Track preview */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-12 h-12 bg-gray-300 rounded overflow-hidden flex-shrink-0">
              <img
                src={track.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop&crop=center'}
                alt={track.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{track.name}</div>
              <div className="text-sm text-gray-500 truncate">{track.artistName}</div>
            </div>
          </div>

          {/* Copy link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Share link</label>
            <div className="flex space-x-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="flex-shrink-0"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>

          {/* Social media buttons */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Share on social media</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={shareToFacebook}
                className="flex items-center space-x-2 justify-start text-foreground"
              >
                <Facebook size={16} className="text-blue-600" />
                <span>Facebook</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={shareToTwitter}
                className="flex items-center space-x-2 justify-start text-foreground"
              >
                <Twitter size={16} className="text-blue-400" />
                <span>Twitter</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={shareToLinkedIn}
                className="flex items-center space-x-2 justify-start text-foreground"
              >
                <Linkedin size={16} className="text-blue-700" />
                <span>LinkedIn</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={shareToWhatsApp}
                className="flex items-center space-x-2 justify-start text-foreground"
              >
                <MessageCircle size={16} className="text-green-600" />
                <span>WhatsApp</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={shareToInstagram}
                className="flex items-center space-x-2 justify-start text-foreground"
              >
                <Instagram size={16} className="text-pink-600" />
                <span>Instagram</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={shareViaEmail}
                className="flex items-center space-x-2 justify-start text-foreground"
              >
                <Mail size={16} className="text-gray-600" />
                <span>Email</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
