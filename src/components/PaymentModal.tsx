// Payment Modal Component for handling content access payments

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Wallet, 
  Crown, 
  Gift, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  X,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePayment } from '@/hooks/usePayment';
import { useYellowSDK } from '@/hooks/useYellowSDK';
import { PaymentOption, PaymentResult } from '@/services/paymentService';
import { toast } from 'sonner';
import UnifiedWalletStatus from '@/components/UnifiedWalletStatus';
import { useWallet } from '@/contexts/WalletContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentTitle: string;
  contentArtist: string;
  onPaymentSuccess?: (result: PaymentResult) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  contentId,
  contentTitle,
  contentArtist,
  onPaymentSuccess
}) => {
  const { session, isAuthenticated, isConnected, connect, isConnecting } = useYellowSDK();
  const { 
    getPaymentOptions, 
    processPayment, 
    isProcessing, 
    error, 
    clearError 
  } = usePayment();

  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  // Load payment options when modal opens
  useEffect(() => {
    if (isOpen && contentId) {
      loadPaymentOptions();
    }
  }, [isOpen, contentId]);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPaymentOptions([]);
      setSelectedOption(null);
      setPaymentResult(null);
      clearError();
    }
  }, [isOpen, clearError]);

  const loadPaymentOptions = async () => {
    setLoading(true);
    try {
      const options = await getPaymentOptions(contentId, session?.walletAddress);
      setPaymentOptions(options);
      
      // Auto-select the first available option
      const availableOption = options.find(opt => opt.available);
      if (availableOption) {
        setSelectedOption(availableOption);
      }
    } catch (error) {
      console.error('Error loading payment options:', error);
      toast.error('Failed to load payment options');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedOption) {
      return;
    }

    // First check if wallet is connected
    if (!isConnected) {
      try {
        toast.info('Connecting to wallet...');
        await connect();
        // Wait a moment for authentication to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        toast.error('Failed to connect wallet. Please try again.');
        return;
      }
    }

    // Check if authenticated after connection attempt
    if (!isAuthenticated) {
      toast.error('Wallet authentication required. Please sign the authentication message in your wallet.');
      return;
    }

    try {
      const result = await processPayment(
        contentId,
        selectedOption.type,
        selectedOption.price
      );

      setPaymentResult(result);

      if (result.success) {
        toast.success('Payment successful!');
        onPaymentSuccess?.(result);

        // Close modal after a delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        toast.error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment processing failed');
    }
  };

  const getOptionIcon = (type: PaymentOption['type']) => {
    switch (type) {
      case 'free':
        return <Gift className="text-green-400" size={20} />;
      case 'pay_per_use':
        return <CreditCard className="text-blue-400" size={20} />;
      case 'subscription':
        return <Crown className="text-purple-400" size={20} />;
      case 'nft_access':
        return <Wallet className="text-orange-400" size={20} />;
      default:
        return <Info className="text-gray-400" size={20} />;
    }
  };

  const getOptionColor = (type: PaymentOption['type']) => {
    switch (type) {
      case 'free':
        return 'border-green-500/30 bg-green-500/10';
      case 'pay_per_use':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'subscription':
        return 'border-purple-500/30 bg-purple-500/10';
      case 'nft_access':
        return 'border-orange-500/30 bg-orange-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const formatPaymentType = (type: PaymentOption['type']) => {
    switch (type) {
      case 'free':
        return 'Free Access';
      case 'pay_per_use':
        return 'Pay Per Use';
      case 'subscription':
        return 'Subscription';
      case 'nft_access':
        return 'NFT Access';
      default:
        return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-figma-glass-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <CreditCard size={20} className="text-figma-purple" />
            Access Content
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Choose how you'd like to access "{contentTitle}" by {contentArtist}
          </DialogDescription>
        </DialogHeader>

        {/* Wallet Status */}
        <UnifiedWalletStatus variant="compact" showActions={true} />

        <div className="space-y-4">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="text-figma-purple animate-spin" />
              <span className="text-white ml-2">Loading payment options...</span>
            </div>
          )}

          {/* Error State */}
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
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                  <Button
                    onClick={clearError}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Payment Options */}
          {!loading && paymentOptions.length > 0 && !paymentResult && (
            <div className="space-y-3">
              <h3 className="text-white font-medium">Payment Options</h3>
              
              {paymentOptions.map((option, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-200 ${
                    option.available 
                      ? `${getOptionColor(option.type)} hover:scale-[1.02] ${
                          selectedOption === option ? 'ring-2 ring-figma-purple' : ''
                        }`
                      : 'border-gray-500/30 bg-gray-500/10 opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => option.available && setSelectedOption(option)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getOptionIcon(option.type)}
                        <div>
                          <p className="text-white font-medium">
                            {formatPaymentType(option.type)}
                          </p>
                          <p className="text-white/60 text-sm">
                            {option.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {option.price && (
                          <Badge variant="outline" className="border-white/20 text-white">
                            {option.price} {option.currency}
                          </Badge>
                        )}
                        {!option.available && (
                          <Badge variant="destructive">
                            Unavailable
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {!option.available && option.reason && (
                      <p className="text-red-400 text-xs mt-2">
                        {option.reason}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Payment Result */}
          <AnimatePresence>
            {paymentResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-6"
              >
                {paymentResult.success ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle size={32} className="text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-2">Payment Successful!</h3>
                      <p className="text-white/60 text-sm">
                        You now have access to this content.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                      <AlertCircle size={32} className="text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-2">Payment Failed</h3>
                      <p className="text-red-400 text-sm">
                        {paymentResult.error}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          {!loading && !paymentResult && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              
              <Button
                onClick={handlePayment}
                disabled={!selectedOption || !selectedOption.available || isProcessing || isConnecting}
                className="flex-1 bg-figma-purple hover:bg-figma-purple/80"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : selectedOption?.type === 'free' ? (
                  'Access Now'
                ) : (
                  `Pay ${selectedOption?.price || 0} ${selectedOption?.currency || 'ETH'}`
                )}
              </Button>
            </div>
          )}

          {/* Authentication Required */}
          {!isAuthenticated && (
            <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-figma-sm">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-yellow-400" />
                <p className="text-yellow-400 text-sm">
                  Please connect and authenticate your wallet to access payment options.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;