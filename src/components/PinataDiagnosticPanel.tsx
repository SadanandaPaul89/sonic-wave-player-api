/**
 * Pinata Diagnostic Panel Component
 * UI component to test and diagnose Pinata API issues
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { PinataDiagnostic } from '@/services/pinataDiagnostic';

interface DiagnosticResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const PinataDiagnosticPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    setHasRun(false);

    try {
      const diagnostic = new PinataDiagnostic();
      const diagnosticResults = await diagnostic.runDiagnostics();
      setResults(diagnosticResults);
      setHasRun(true);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      setResults([{
        step: 'Diagnostic Error',
        success: false,
        message: 'Failed to run diagnostics',
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
      setHasRun(true);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (success: boolean) => {
    if (success) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
    } else {
      return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Pinata API Diagnostics
          </CardTitle>
          <CardDescription>
            Test your Pinata API connection and troubleshoot upload issues. 
            This will help identify why uploads might not be appearing in your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runDiagnostics} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <div className="mr-2 h-4 w-4 bg-gray-400 rounded-full" />
                  Running Diagnostics...
                </>
              ) : (
                'Run Pinata Diagnostics'
              )}
            </Button>

            {hasRun && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Results</h3>
                  <Badge variant={successCount === totalCount ? "default" : "destructive"}>
                    {successCount}/{totalCount} Passed
                  </Badge>
                </div>

                <div className="space-y-3">
                  {results.map((result, index) => (
                    <Card key={index} className="border-l-4 border-l-gray-200">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.success)}
                            <span className="font-medium">{result.step}</span>
                          </div>
                          {getStatusBadge(result.success)}
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-2">{result.message}</p>
                        
                        {result.error && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <strong>Error:</strong> {result.error}
                          </div>
                        )}
                        
                        {result.data && (
                          <details className="mt-2">
                            <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-50 border rounded text-xs overflow-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {hasRun && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-semibold text-blue-900 mb-2">Troubleshooting Tips:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• If authentication fails, check your API keys in .env.local</li>
                      <li>• If uploads fail, verify your account has sufficient quota</li>
                      <li>• Check the Pinata dashboard at https://app.pinata.cloud</li>
                      <li>• Look for uploads in the "Files" section of your dashboard</li>
                      <li>• Recent uploads may take a few moments to appear</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PinataDiagnosticPanel;