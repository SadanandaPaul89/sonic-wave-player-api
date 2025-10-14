import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle, CheckCircle, Globe, Music } from 'lucide-react';
import { pinataLibraryService } from '@/services/pinataLibraryService';
import { IPFS_CONFIG } from '@/config/environment';

interface DebugInfo {
  hasCredentials: boolean;
  apiKey?: string;
  jwt?: string;
  gatewayUrl: string;
  filesFound: number;
  errors: string[];
  lastFetch?: string;
  cacheValid: boolean;
}

const PinataDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      // Check credentials
      const apiKey = process.env.REACT_APP_PINATA_API_KEY || localStorage.getItem('pinata_api_key');
      const secretKey = process.env.REACT_APP_PINATA_SECRET_KEY || localStorage.getItem('pinata_secret_key');
      const jwt = process.env.REACT_APP_PINATA_JWT || localStorage.getItem('pinata_jwt');

      const hasCredentials = !!(jwt || (apiKey && secretKey));

      // Get library stats
      const stats = pinataLibraryService.getStats();

      // Try to fetch tracks
      let tracks = [];
      let errors = [];
      try {
        tracks = await pinataLibraryService.getAllTracks();
      } catch (error) {
        errors.push(`Failed to fetch tracks: ${error.message}`);
      }

      // Test gateway connectivity
      const gatewayUrl = 'https://silver-changing-rook-174.mypinata.cloud';
      let gatewayTest = false;
      try {
        const response = await fetch(`${gatewayUrl}/ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        gatewayTest = response.ok;
      } catch (error) {
        errors.push(`Gateway test failed: ${error.message}`);
      }

      setDebugInfo({
        hasCredentials,
        apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : undefined,
        jwt: jwt ? `${jwt.substring(0, 20)}...` : undefined,
        gatewayUrl,
        filesFound: tracks.length,
        errors,
        lastFetch: stats.lastUpdated,
        cacheValid: stats.cacheValid
      });

      // Test API connectivity if we have credentials
      if (hasCredentials) {
        await testPinataAPI();
      }

    } catch (error) {
      setDebugInfo({
        hasCredentials: false,
        gatewayUrl: 'https://silver-changing-rook-174.mypinata.cloud',
        filesFound: 0,
        errors: [`Diagnostics failed: ${error.message}`],
        cacheValid: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testPinataAPI = async () => {
    const apiKey = process.env.REACT_APP_PINATA_API_KEY || localStorage.getItem('pinata_api_key');
    const secretKey = process.env.REACT_APP_PINATA_SECRET_KEY || localStorage.getItem('pinata_secret_key');
    const jwt = process.env.REACT_APP_PINATA_JWT || localStorage.getItem('pinata_jwt');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`;
    } else if (apiKey && secretKey) {
      headers['pinata_api_key'] = apiKey;
      headers['pinata_secret_api_key'] = secretKey;
    }

    const tests = [
      {
        name: 'Test Authentication',
        url: 'https://api.pinata.cloud/data/testAuthentication',
        method: 'GET'
      },
      {
        name: 'List Pinned Files',
        url: 'https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=10',
        method: 'GET'
      }
    ];

    const results = [];
    for (const test of tests) {
      try {
        const response = await fetch(test.url, {
          method: test.method,
          headers
        });

        const data = await response.json();
        results.push({
          name: test.name,
          success: response.ok,
          status: response.status,
          data: response.ok ? data : data.error || 'Unknown error'
        });
      } catch (error) {
        results.push({
          name: test.name,
          success: false,
          status: 0,
          data: error.message
        });
      }
    }

    setTestResults(results);
  };

  const refreshLibrary = async () => {
    setIsLoading(true);
    try {
      await pinataLibraryService.refresh();
      await runDiagnostics();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Pinata IPFS Debugger</h2>
        <Button
          onClick={runDiagnostics}
          disabled={isLoading}
          className="bg-figma-purple hover:bg-figma-purple/80"
        >
          <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Run Diagnostics
        </Button>
      </div>

      {debugInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Credentials Status */}
          <Card className="bg-figma-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {debugInfo.hasCredentials ? (
                  <CheckCircle size={20} className="text-green-400" />
                ) : (
                  <AlertCircle size={20} className="text-red-400" />
                )}
                API Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Has Credentials:</span>
                <Badge variant={debugInfo.hasCredentials ? "default" : "destructive"}>
                  {debugInfo.hasCredentials ? 'Yes' : 'No'}
                </Badge>
              </div>
              {debugInfo.apiKey && (
                <div className="flex items-center justify-between">
                  <span className="text-white/70">API Key:</span>
                  <code className="text-green-400 text-sm">{debugInfo.apiKey}</code>
                </div>
              )}
              {debugInfo.jwt && (
                <div className="flex items-center justify-between">
                  <span className="text-white/70">JWT Token:</span>
                  <code className="text-green-400 text-sm">{debugInfo.jwt}</code>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Library Status */}
          <Card className="bg-figma-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Music size={20} className="text-figma-purple" />
                Library Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Files Found:</span>
                <Badge variant={debugInfo.filesFound > 0 ? "default" : "secondary"}>
                  {debugInfo.filesFound}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Cache Valid:</span>
                <Badge variant={debugInfo.cacheValid ? "default" : "secondary"}>
                  {debugInfo.cacheValid ? 'Yes' : 'No'}
                </Badge>
              </div>
              {debugInfo.lastFetch && (
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Last Fetch:</span>
                  <span className="text-white/60 text-sm">
                    {new Date(debugInfo.lastFetch).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gateway Status */}
          <Card className="bg-figma-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe size={20} className="text-blue-400" />
                Gateway Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Gateway URL:</span>
                <code className="text-blue-400 text-sm">{debugInfo.gatewayUrl}</code>
              </div>
              <Button
                onClick={refreshLibrary}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Library
              </Button>
            </CardContent>
          </Card>

          {/* Errors */}
          {debugInfo.errors.length > 0 && (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <AlertCircle size={20} />
                  Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {debugInfo.errors.map((error, index) => (
                    <div key={index} className="text-red-300 text-sm bg-red-500/10 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* API Test Results */}
      {testResults.length > 0 && (
        <Card className="bg-figma-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">API Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border border-white/10 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{result.name}</span>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  <div className="text-white/70 text-sm">
                    Status: {result.status}
                  </div>
                  <div className="mt-2">
                    <pre className="text-xs bg-black/20 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-figma-card border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-white/70">
            <p className="mb-4">If your songs are missing, follow these steps:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Make sure you have Pinata API credentials set up</li>
              <li>Check that your files are actually uploaded to Pinata</li>
              <li>Verify the gateway URL is accessible</li>
              <li>Use the refresh button to update the library</li>
            </ol>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-4">
            <h4 className="text-blue-400 font-medium mb-2">Environment Variables Needed:</h4>
            <div className="space-y-1 text-sm">
              <div><code className="text-blue-300">VITE_PINATA_API_KEY</code> - Your Pinata API key</div>
              <div><code className="text-blue-300">VITE_PINATA_SECRET_KEY</code> - Your Pinata secret key</div>
              <div><code className="text-blue-300">VITE_PINATA_JWT</code> - Your Pinata JWT token (preferred)</div>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded p-4">
            <h4 className="text-green-400 font-medium mb-2">Testing Functions:</h4>
            <div className="space-y-2">
              <Button
                onClick={async () => {
                  await pinataLibraryService.addTestFile(
                    'Test Artist - Test Album - Test Song.mp3',
                    'QmTestSong123456789',
                    { title: 'Test Song', artist: 'Test Artist', album: 'Test Album' }
                  );
                  await runDiagnostics();
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Add Test Song
              </Button>
              <Button
                onClick={async () => {
                  pinataLibraryService.clearCache();
                  await runDiagnostics();
                }}
                variant="outline"
                className="w-full"
              >
                Clear Cache
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PinataDebugger;