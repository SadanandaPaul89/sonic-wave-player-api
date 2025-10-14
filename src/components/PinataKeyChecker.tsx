/**
 * Pinata API Key Checker
 * Helps verify API key permissions and suggests fixes
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Key, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import { IPFS_CONFIG } from '@/config/environment';

interface KeyPermission {
  name: string;
  endpoint: string;
  required: boolean;
  description: string;
}

const REQUIRED_PERMISSIONS: KeyPermission[] = [
  {
    name: 'testAuthentication',
    endpoint: '/data/testAuthentication',
    required: true,
    description: 'Basic authentication testing'
  },
  {
    name: 'pinFileToIPFS',
    endpoint: '/pinning/pinFileToIPFS',
    required: true,
    description: 'Upload files to IPFS'
  },
  {
    name: 'pinJSONToIPFS',
    endpoint: '/pinning/pinJSONToIPFS',
    required: true,
    description: 'Upload JSON metadata to IPFS'
  },
  {
    name: 'pinList',
    endpoint: '/data/pinList',
    required: false,
    description: 'List your pinned files'
  },
  {
    name: 'userPinnedDataTotal',
    endpoint: '/data/userPinnedDataTotal',
    required: false,
    description: 'Get account usage statistics'
  }
];

interface PermissionResult {
  permission: KeyPermission;
  hasAccess: boolean;
  error?: string;
}

const PinataKeyChecker: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<PermissionResult[]>([]);
  const [hasValidKeys, setHasValidKeys] = useState(false);

  const checkPermissions = async () => {
    setIsChecking(true);
    setResults([]);

    // Check if we have credentials
    const hasApiKey = !!IPFS_CONFIG.pinata.apiKey;
    const hasSecretKey = !!IPFS_CONFIG.pinata.secretKey;
    const hasJWT = !!IPFS_CONFIG.pinata.jwt;

    if (!hasApiKey && !hasSecretKey && !hasJWT) {
      setResults([{
        permission: REQUIRED_PERMISSIONS[0],
        hasAccess: false,
        error: 'No API credentials found in environment variables'
      }]);
      setIsChecking(false);
      return;
    }

    setHasValidKeys(true);

    const permissionResults: PermissionResult[] = [];

    for (const permission of REQUIRED_PERMISSIONS) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };

        // Use JWT if available, otherwise API key/secret
        if (IPFS_CONFIG.pinata.jwt) {
          headers['Authorization'] = `Bearer ${IPFS_CONFIG.pinata.jwt}`;
        } else {
          headers['pinata_api_key'] = IPFS_CONFIG.pinata.apiKey;
          headers['pinata_secret_api_key'] = IPFS_CONFIG.pinata.secretKey;
        }

        const response = await fetch(`https://api.pinata.cloud${permission.endpoint}`, {
          method: 'GET',
          headers
        });

        if (response.ok) {
          permissionResults.push({
            permission,
            hasAccess: true
          });
        } else if (response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          permissionResults.push({
            permission,
            hasAccess: false,
            error: errorData.error?.reason || 'Permission denied'
          });
        } else {
          permissionResults.push({
            permission,
            hasAccess: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          });
        }
      } catch (error) {
        permissionResults.push({
          permission,
          hasAccess: false,
          error: error.message || 'Network error'
        });
      }

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setResults(permissionResults);
    setIsChecking(false);
  };

  const requiredPermissions = results.filter(r => r.permission.required);
  const optionalPermissions = results.filter(r => !r.permission.required);
  const hasAllRequired = requiredPermissions.every(r => r.hasAccess);
  const missingRequired = requiredPermissions.filter(r => !r.hasAccess);

  return (
    <Card className="glass-card border-figma-glass-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Key className="h-5 w-5" />
          API Key Permission Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasValidKeys && results.length === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This tool checks if your Pinata API keys have the required permissions for uploading files.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={checkPermissions}
          disabled={isChecking}
          className="w-full bg-figma-purple hover:bg-figma-purple/80"
        >
          {isChecking ? (
            <>
              <div className="mr-2 h-4 w-4 bg-gray-400 rounded-full" />
              Checking Permissions...
            </>
          ) : (
            <>
              <Key className="mr-2 h-4 w-4" />
              Check API Key Permissions
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-2">
              {hasAllRequired ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-400 font-medium">All required permissions available</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-400 font-medium">Missing required permissions</span>
                </>
              )}
            </div>

            {/* Required Permissions */}
            <div className="space-y-2">
              <h4 className="text-white font-medium">Required Permissions</h4>
              {requiredPermissions.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <div className="flex items-center gap-2">
                    {result.hasAccess ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <span className="text-white text-sm font-medium">{result.permission.name}</span>
                      <p className="text-white/60 text-xs">{result.permission.description}</p>
                    </div>
                  </div>
                  <Badge variant={result.hasAccess ? "default" : "destructive"} className="text-xs">
                    {result.hasAccess ? "Available" : "Missing"}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Optional Permissions */}
            {optionalPermissions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-white font-medium">Optional Permissions</h4>
                {optionalPermissions.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <div className="flex items-center gap-2">
                      {result.hasAccess ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <div>
                        <span className="text-white text-sm font-medium">{result.permission.name}</span>
                        <p className="text-white/60 text-xs">{result.permission.description}</p>
                      </div>
                    </div>
                    <Badge variant={result.hasAccess ? "default" : "secondary"} className="text-xs">
                      {result.hasAccess ? "Available" : "Limited"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Error Details */}
            {missingRequired.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Missing Required Permissions:</p>
                    <ul className="text-sm space-y-1">
                      {missingRequired.map((result, index) => (
                        <li key={index}>
                          • {result.permission.name}: {result.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Fix Instructions */}
            {!hasAllRequired && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded p-4">
                <h4 className="text-blue-400 font-medium mb-2">How to Fix:</h4>
                <ol className="text-blue-300 text-sm space-y-1">
                  <li>1. Go to your Pinata dashboard</li>
                  <li>2. Navigate to "API Keys" section</li>
                  <li>3. Create a new API key with these permissions:</li>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• pinFileToIPFS (for file uploads)</li>
                    <li>• pinJSONToIPFS (for metadata uploads)</li>
                    <li>• testAuthentication (for connection testing)</li>
                  </ul>
                  <li>4. Update your .env.local file with the new keys</li>
                  <li>5. Restart your development server</li>
                </ol>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => window.open('https://app.pinata.cloud/keys', '_blank')}
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Open Pinata API Keys
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PinataKeyChecker;