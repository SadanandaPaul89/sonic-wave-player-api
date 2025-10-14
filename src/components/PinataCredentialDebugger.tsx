/**
 * Pinata Credential Debugger
 * Shows exactly what credentials are being loaded and used
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bug, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Copy,
  RefreshCw
} from 'lucide-react';
import { IPFS_CONFIG } from '@/config/environment';
import { toast } from 'sonner';

const PinataCredentialDebugger: React.FC = () => {
  const [showCredentials, setShowCredentials] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const maskCredential = (credential: string) => {
    if (!credential) return 'Not set';
    if (credential.length <= 8) return credential;
    return credential.substring(0, 4) + '...' + credential.substring(credential.length - 4);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const testCredentials = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      // Test with current credentials
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      let authMethod = 'none';
      
      if (IPFS_CONFIG.pinata.jwt) {
        headers['Authorization'] = `Bearer ${IPFS_CONFIG.pinata.jwt}`;
        authMethod = 'jwt';
      } else if (IPFS_CONFIG.pinata.apiKey && IPFS_CONFIG.pinata.secretKey) {
        headers['pinata_api_key'] = IPFS_CONFIG.pinata.apiKey;
        headers['pinata_secret_api_key'] = IPFS_CONFIG.pinata.secretKey;
        authMethod = 'api_key';
      }

      console.log('Testing with auth method:', authMethod);
      console.log('Headers being sent:', Object.keys(headers));

      const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        method: 'GET',
        headers
      });

      const responseData = await response.json();

      setTestResult({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        authMethod,
        data: responseData,
        headers: Object.keys(headers)
      });

    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
        authMethod: 'unknown'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const credentialInfo = {
    apiKey: IPFS_CONFIG.pinata.apiKey,
    secretKey: IPFS_CONFIG.pinata.secretKey,
    jwt: IPFS_CONFIG.pinata.jwt,
    hasApiKey: !!IPFS_CONFIG.pinata.apiKey,
    hasSecretKey: !!IPFS_CONFIG.pinata.secretKey,
    hasJWT: !!IPFS_CONFIG.pinata.jwt,
    preferredAuth: IPFS_CONFIG.pinata.jwt ? 'JWT' : 'API Key/Secret'
  };

  return (
    <Card className="glass-card border-figma-glass-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bug className="h-5 w-5" />
          Credential Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Credential Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Loaded Credentials</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCredentials(!showCredentials)}
            >
              {showCredentials ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-white/5 rounded">
              <span className="text-white/70 text-sm">API Key:</span>
              <div className="flex items-center gap-2">
                <Badge variant={credentialInfo.hasApiKey ? "default" : "secondary"}>
                  {credentialInfo.hasApiKey ? "Set" : "Not Set"}
                </Badge>
                {showCredentials && credentialInfo.apiKey && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(credentialInfo.apiKey, 'API Key')}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-white/5 rounded">
              <span className="text-white/70 text-sm">Secret Key:</span>
              <div className="flex items-center gap-2">
                <Badge variant={credentialInfo.hasSecretKey ? "default" : "secondary"}>
                  {credentialInfo.hasSecretKey ? "Set" : "Not Set"}
                </Badge>
                {showCredentials && credentialInfo.secretKey && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(credentialInfo.secretKey, 'Secret Key')}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-white/5 rounded">
              <span className="text-white/70 text-sm">JWT Token:</span>
              <div className="flex items-center gap-2">
                <Badge variant={credentialInfo.hasJWT ? "default" : "secondary"}>
                  {credentialInfo.hasJWT ? "Set" : "Not Set"}
                </Badge>
                {showCredentials && credentialInfo.jwt && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(credentialInfo.jwt, 'JWT Token')}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded">
              <span className="text-blue-300 text-sm font-medium">Preferred Auth:</span>
              <Badge variant="default" className="bg-blue-600">
                {credentialInfo.preferredAuth}
              </Badge>
            </div>
          </div>

          {showCredentials && (
            <div className="space-y-2 p-3 bg-white/5 rounded border border-white/10">
              <h4 className="text-white font-medium text-sm">Raw Values:</h4>
              <div className="space-y-1 text-xs font-mono">
                <div className="text-white/70">
                  API Key: <span className="text-white">{maskCredential(credentialInfo.apiKey)}</span>
                </div>
                <div className="text-white/70">
                  Secret: <span className="text-white">{maskCredential(credentialInfo.secretKey)}</span>
                </div>
                <div className="text-white/70">
                  JWT: <span className="text-white">{maskCredential(credentialInfo.jwt)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Button */}
        <Button
          onClick={testCredentials}
          disabled={isLoading}
          className="w-full bg-figma-purple hover:bg-figma-purple/80"
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 bg-gray-400 rounded-full" />
              Testing Credentials...
            </>
          ) : (
            <>
              <Bug className="mr-2 h-4 w-4" />
              Test Current Credentials
            </>
          )}
        </Button>

        {/* Test Results */}
        {testResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-400 font-medium">Authentication Successful</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-400 font-medium">Authentication Failed</span>
                </>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-white/70 text-sm">Auth Method:</span>
                <Badge variant="secondary">{testResult.authMethod}</Badge>
              </div>

              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-white/70 text-sm">HTTP Status:</span>
                <Badge variant={testResult.success ? "default" : "destructive"}>
                  {testResult.status} {testResult.statusText}
                </Badge>
              </div>

              {testResult.headers && (
                <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <span className="text-white/70 text-sm">Headers Sent:</span>
                  <span className="text-white text-xs">{testResult.headers.join(', ')}</span>
                </div>
              )}
            </div>

            {testResult.data && (
              <details className="bg-white/5 rounded p-3">
                <summary className="text-white cursor-pointer text-sm font-medium">
                  Response Data
                </summary>
                <pre className="mt-2 text-xs text-white/80 overflow-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </details>
            )}

            {testResult.error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {testResult.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Environment Info */}
        <div className="text-xs text-white/50 space-y-1">
          <div>Environment variables are loaded from .env.local</div>
          <div>JWT tokens take priority over API key/secret pairs</div>
          <div>Restart dev server after changing .env.local</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PinataCredentialDebugger;