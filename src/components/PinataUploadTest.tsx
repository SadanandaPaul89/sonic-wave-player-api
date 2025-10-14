/**
 * Simple Pinata Upload Test Component
 * Quick test for uploading files to Pinata
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Copy,
  ExternalLink,
  FileAudio,
  Image
} from 'lucide-react';
import { toast } from 'sonner';
import { ipfsService } from '@/services/ipfsService';

const PinataUploadTest: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    hash: string;
    type: string;
    name: string;
    size: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setUploadResult(null);

    try {
      console.log('Starting upload:', file.name, file.type, `${(file.size / 1024).toFixed(2)} KB`);
      
      const hash = await ipfsService.uploadFile(file, (progress) => {
        setUploadProgress(progress.progress);
        console.log('Upload progress:', progress);
      });

      setUploadResult({
        hash,
        type: file.type,
        name: file.name,
        size: file.size
      });

      toast.success('File uploaded successfully!');
      console.log('Upload successful:', hash);

    } catch (error) {
      console.error('Upload failed:', error);
      setError(error.message || 'Upload failed');
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const copyHash = async () => {
    if (uploadResult) {
      try {
        await navigator.clipboard.writeText(uploadResult.hash);
        toast.success('Hash copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy hash');
      }
    }
  };

  const openInGateway = () => {
    if (uploadResult) {
      window.open(`https://gateway.pinata.cloud/ipfs/${uploadResult.hash}`, '_blank');
    }
  };

  const reset = () => {
    setUploadResult(null);
    setError(null);
    setUploadProgress(0);
  };

  return (
    <Card className="glass-card border-figma-glass-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Upload className="h-5 w-5" />
          Quick Upload Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!uploadResult && !error && (
          <>
            <div className="text-center">
              <p className="text-white/70 text-sm mb-4">
                Test uploading audio files or images to Pinata
              </p>
              
              <input
                type="file"
                accept="audio/*,image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="test-file-input"
              />
              
              <Button
                onClick={() => document.getElementById('test-file-input')?.click()}
                disabled={isUploading}
                className="bg-figma-purple hover:bg-figma-purple/80"
              >
                {isUploading ? (
                  <>
                    <div className="mr-2 h-4 w-4 bg-gray-400 rounded-full" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Select File to Upload
                  </>
                )}
              </Button>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Upload Progress</span>
                  <span className="text-white/70">{uploadProgress.toFixed(0)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </>
        )}

        {uploadResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Upload Successful!</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {uploadResult.type.startsWith('audio/') ? (
                  <FileAudio className="h-4 w-4 text-blue-400" />
                ) : (
                  <Image className="h-4 w-4 text-green-400" />
                )}
                <span className="text-white text-sm">{uploadResult.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {(uploadResult.size / 1024).toFixed(2)} KB
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-white/70 text-sm">IPFS Hash:</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white font-mono text-sm break-all">
                    {uploadResult.hash}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyHash}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={openInGateway}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <Button onClick={reset} variant="outline">
                  Upload Another File
                </Button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Upload Failed</span>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>

            <div className="text-center">
              <Button onClick={reset} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-white/50 text-center">
          Supported: Audio files (MP3, WAV, FLAC, AAC, OGG) and Images (JPEG, PNG, WebP, GIF)
        </div>
      </CardContent>
    </Card>
  );
};

export default PinataUploadTest;