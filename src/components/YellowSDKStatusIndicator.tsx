// Mock Yellow SDK Status Indicator - Replacement for removed Yellow SDK
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useYellowSDK } from '@/hooks/useYellowSDK';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface YellowSDKStatusIndicatorProps {
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

const YellowSDKStatusIndicator: React.FC<YellowSDKStatusIndicatorProps> = ({
  variant = 'compact',
  className = ''
}) => {
  const { isConnected, isAuthenticated, isLoading, error, session } = useYellowSDK();

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
    if (error) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (isAuthenticated) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (isConnected) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
    return <XCircle className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Connecting...';
    if (error) return 'Connection Error';
    if (isAuthenticated) return 'Authenticated';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (isLoading) return 'blue';
    if (error) return 'red';
    if (isAuthenticated) return 'green';
    if (isConnected) return 'yellow';
    return 'gray';
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
        className={`flex items-center space-x-2 ${className}`}
      >
        {getStatusIcon()}
        <Badge variant="outline" className={`text-${getStatusColor()}-600 border-${getStatusColor()}-300`}>
          {getStatusText()}
        </Badge>
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
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-figma-text">Yellow SDK Status</h3>
            {getStatusIcon()}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-figma-text-secondary">Connection:</span>
              <Badge 
                variant="outline" 
                className={`text-${isConnected ? 'green' : 'red'}-600 border-${isConnected ? 'green' : 'red'}-300`}
              >
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-figma-text-secondary">Authentication:</span>
              <Badge 
                variant="outline" 
                className={`text-${isAuthenticated ? 'green' : 'gray'}-600 border-${isAuthenticated ? 'green' : 'gray'}-300`}
              >
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </Badge>
            </div>
            
            {session && (
              <div className="flex justify-between text-xs">
                <span className="text-figma-text-secondary">Session:</span>
                <span className="text-figma-text font-mono text-xs">
                  {session.sessionId.slice(0, 8)}...
                </span>
              </div>
            )}
            
            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default YellowSDKStatusIndicator;