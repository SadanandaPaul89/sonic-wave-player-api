// Debug version of IPFS Uploader to isolate upload issues

import React, { useState, useRef } from 'react';
import { Upload, FileAudio, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface DebugUploaderProps {
  onUploadComplete?: (hash: string, metadata: any) => void;
  className?: string;
}

const IPFSUploaderDebug: React.FC<DebugUploaderProps> = ({
  onUploadComplete,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });

    // Basic validation
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/mp4'];
    if (!validTypes.includes(file.type)) {
      const error = `Invalid file type: ${file.type}`;
      setUploadError(error);
      toast.error('Invalid file type', {
        description: 'Please select an audio file (MP3, WAV, FLAC, AAC, OGG, or M4A)',
      });
      return;
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      const error = `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
      setUploadError(error);
      toast.error('File too large', {
        description: 'Please select a file smaller than 100MB',
      });
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setUploadSuccess(false);
    toast.success('File selected successfully');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('No file selected');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadStatus('Starting upload...');

    try {
      console.log('Starting upload process...');
      
      // Step 1: Create a simple hash from file content
      setUploadStatus('Reading file...');
      const arrayBuffer = await selectedFile.arrayBuffer();
      console.log('File read successfully, size:', arrayBuffer.byteLength);

      // Step 2: Generate a simple hash
      setUploadStatus('Generating hash...');
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const ipfsHash = `Qm${hashHex.substring(0, 44)}`;
      
      console.log('Generated hash:', ipfsHash);

      // Step 3: Store file data locally for demo
      setUploadStatus('Storing file...');
      const uint8Array = new Uint8Array(arrayBuffer);
      const fileData = {
        hash: ipfsHash,
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        data: Array.from(uint8Array),
        uploadedAt: new Date().toISOString()
      };

      localStorage.setItem(`ipfs_file_${ipfsHash}`, JSON.stringify(fileData));
      console.log('File stored locally with hash:', ipfsHash);

      // Step 4: Create metadata
      setUploadStatus('Creating metadata...');
      const metadata = {
        title: selectedFile.name.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        duration: 0,
        ipfs_hashes: {
          high_quality: {
            uri: `ipfs://${ipfsHash}`,
            format: 'MP3',
            bitrate: '320kbps',
            size: selectedFile.size
          },
          streaming: {
            uri: `ipfs://${ipfsHash}`,
            format: 'MP3',
            bitrate: '192kbps',
            size: Math.floor(selectedFile.size * 0.6)
          },
          mobile: {
            uri: `ipfs://${ipfsHash}`,
            format: 'MP3',
            bitrate: '128kbps',
            size: Math.floor(selectedFile.size * 0.4)
          }
        },
        created_at: new Date().toISOString(),
        file_size: {
          high_quality: selectedFile.size,
          streaming: Math.floor(selectedFile.size * 0.6),
          mobile: Math.floor(selectedFile.size * 0.4)
        }
      };

      setUploadStatus('Upload complete!');
      setUploadSuccess(true);
      
      console.log('Upload completed successfully:', { hash: ipfsHash, metadata });
      
      toast.success('Upload successful!', {
        description: `File uploaded with hash: ${ipfsHash.substring(0, 10)}...`,
      });

      onUploadComplete?.(ipfsHash, metadata);

    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'Upload failed';
      setUploadError(errorMessage);
      setUploadStatus(`Error: ${errorMessage}`);
      
      toast.error('Upload failed', {
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className={`glass-card border-figma-glass-border ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3">
          <Upload className="text-figma-purple" size={24} />
          Debug IPFS Uploader
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="block w-full text-white bg-white/10 border border-white/20 rounded-figma-sm p-3"
            disabled={isUploading}
          />
          
          {selectedFile && (
            <div className="p-3 bg-white/5 rounded-figma-sm">
              <div className="flex items-center gap-3">
                <FileAudio size={20} className="text-green-400" />
                <div className="flex-1">
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-white/60 text-sm">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                  </p>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetUpload}
                    className="text-white/60 hover:text-red-400"
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upload Status */}
        {(isUploading || uploadStatus) && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {isUploading ? (
                <Loader2 size={20} className="text-figma-purple animate-spin" />
              ) : uploadSuccess ? (
                <Check size={20} className="text-green-400" />
              ) : uploadError ? (
                <AlertCircle size={20} className="text-red-400" />
              ) : null}
              <span className="text-white text-sm">{uploadStatus}</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {uploadError && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-figma-sm">
            <p className="text-red-400 text-sm">{uploadError}</p>
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && !uploadSuccess && (
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-gradient-to-r from-figma-purple to-figma-purple-light hover:from-figma-purple/80 hover:to-figma-purple-light/80 text-white py-3 text-lg font-medium rounded-figma-md transition-all duration-300 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 size={20} className="mr-3 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={20} className="mr-3" />
                Upload File (Debug)
              </>
            )}
          </Button>
        )}

        {/* Success State */}
        {uploadSuccess && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <Check size={32} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">Upload Successful!</h3>
              <p className="text-white/60 text-sm">
                File has been processed and stored locally for testing.
              </p>
            </div>
            <Button
              onClick={resetUpload}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Upload Another File
            </Button>
          </div>
        )}

        {/* Debug Info */}
        <div className="p-3 bg-white/5 rounded-figma-sm">
          <p className="text-white/60 text-xs">
            Debug Mode: Files are processed locally for testing. 
            Check browser console for detailed logs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default IPFSUploaderDebug;