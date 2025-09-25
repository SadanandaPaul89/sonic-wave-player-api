import React, { useState, useRef } from 'react';
import { Upload, Music, FileAudio, Loader2, Check, X, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { simpleIPFSService as ipfsService, MusicMetadata, UploadProgress } from '@/services/ipfsServiceSimple';
import { web3Service } from '@/services/web3Service';

interface IPFSUploaderProps {
  onUploadComplete?: (metadata: MusicMetadata, ipfsHash: string) => void;
  className?: string;
}

const IPFSUploader: React.FC<IPFSUploaderProps> = ({
  onUploadComplete,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    stage: 'preparing',
    progress: 0,
    message: ''
  });
  const [metadata, setMetadata] = useState({
    title: '',
    artist: '',
    album: '',
    genre: '',
    year: new Date().getFullYear(),
    description: ''
  });
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setUploadError(null);

    try {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/mp4'];
      if (!validTypes.includes(file.type)) {
        const error = `Invalid file type: ${file.type}. Please select an audio file (MP3, WAV, FLAC, AAC, OGG, or M4A)`;
        setUploadError(error);
        toast.error('Invalid file type', {
          description: 'Please select a supported audio file format',
        });
        return;
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        const error = `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 100MB`;
        setUploadError(error);
        toast.error('File too large', {
          description: 'Please select a file smaller than 100MB',
        });
        return;
      }

      setSelectedFile(file);

      // Auto-fill metadata from filename
      const filename = file.name.replace(/\.[^/.]+$/, '');
      const parts = filename.split(' - ');
      if (parts.length >= 2) {
        setMetadata(prev => ({
          ...prev,
          artist: parts[0].trim(),
          title: parts[1].trim()
        }));
      } else {
        setMetadata(prev => ({
          ...prev,
          title: filename
        }));
      }

      // Reset upload progress
      setUploadProgress({
        stage: 'preparing',
        progress: 0,
        message: ''
      });

      toast.success('File selected', {
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      });
    } catch (error) {
      console.error('Error selecting file:', error);
      setUploadError(error.message || 'Error selecting file');
      toast.error('Error selecting file');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('No file selected');
      return;
    }

    if (!metadata.title || !metadata.artist) {
      toast.error('Missing required fields', {
        description: 'Please provide at least a title and artist',
      });
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      console.log('Starting upload process for:', selectedFile.name);

      // Step 1: Process and upload audio file to IPFS
      const { metadata: processedMetadata, ipfsHashes } = await ipfsService.processAudioFile(
        selectedFile,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      console.log('Audio file processed:', processedMetadata);

      // Step 2: Create complete metadata
      setUploadProgress({
        stage: 'processing',
        progress: 80,
        message: 'Creating metadata...'
      });

      const completeMetadata: MusicMetadata = {
        ...processedMetadata,
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album || undefined,
        genre: metadata.genre || undefined,
        year: metadata.year,
        // Add custom properties
        properties: {
          ...processedMetadata.properties,
          description: metadata.description,
          uploaded_by: web3Service.getCurrentAccount() || 'anonymous',
          upload_timestamp: new Date().toISOString(),
          file_format: selectedFile.type,
          original_filename: selectedFile.name
        }
      };

      // Step 3: Pin content for availability
      setUploadProgress({
        stage: 'pinning',
        progress: 95,
        message: 'Finalizing upload...'
      });

      const audioHash = ipfsHashes.high_quality.uri.replace('ipfs://', '');
      await ipfsService.pinContent(audioHash);

      // Complete
      setUploadProgress({
        stage: 'complete',
        progress: 100,
        message: 'Upload complete!'
      });

      toast.success('Music uploaded successfully!', {
        description: `File: ${selectedFile.name}`,
      });

      console.log('Upload completed successfully:', {
        audioHash,
        metadata: completeMetadata
      });

      onUploadComplete?.(completeMetadata, audioHash);

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('ipfs-track-uploaded', {
        detail: { metadata: completeMetadata, hash: audioHash }
      }));

      // Reset form after a delay
      setTimeout(() => {
        resetForm();
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);

      const errorMessage = error.message || 'Upload failed';
      setUploadError(errorMessage);

      setUploadProgress({
        stage: 'complete',
        progress: 0,
        message: `Error: ${errorMessage}`
      });

      toast.error('Upload failed', {
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setMetadata({
      title: '',
      artist: '',
      album: '',
      genre: '',
      year: new Date().getFullYear(),
      description: ''
    });
    setUploadProgress({
      stage: 'preparing',
      progress: 0,
      message: ''
    });
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetUpload = () => {
    if (!isUploading) {
      resetForm();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={`glass-card border-figma-glass-border ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3">
          <Upload className="text-figma-purple" size={24} />
          Upload Music to IPFS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-figma-md p-8 text-center transition-all duration-300 ${dragActive
            ? 'border-figma-purple bg-figma-purple/10'
            : selectedFile
              ? 'border-green-500 bg-green-500/10'
              : 'border-white/30 hover:border-figma-purple/50 hover:bg-white/5'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploadProgress.stage === 'uploading' || uploadProgress.stage === 'processing'}
          />

          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div
                key="selected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-4"
              >
                <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                  <FileAudio size={32} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-white/60 text-sm">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetUpload}
                  className="text-white/60 hover:text-red-400"
                  disabled={uploadProgress.stage === 'uploading' || uploadProgress.stage === 'processing'}
                >
                  <X size={16} className="mr-2" />
                  Remove
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-4"
              >
                <div className="w-16 h-16 mx-auto bg-figma-purple/20 rounded-full flex items-center justify-center">
                  <Music size={32} className="text-figma-purple" />
                </div>
                <div>
                  <p className="text-white font-medium mb-2">Drop your music file here</p>
                  <p className="text-white/60 text-sm">or click to browse</p>
                </div>
                <p className="text-white/40 text-xs">
                  Supports MP3, WAV, FLAC, AAC, OGG (max 100MB)
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Upload Progress */}
        <AnimatePresence>
          {(isUploading || uploadProgress.stage === 'complete' || uploadError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                {isUploading ? (
                  <Loader2 size={20} className="text-figma-purple animate-spin" />
                ) : uploadProgress.stage === 'complete' && !uploadError ? (
                  <Check size={20} className="text-green-400" />
                ) : uploadError ? (
                  <AlertCircle size={20} className="text-red-400" />
                ) : (
                  <Info size={20} className="text-blue-400" />
                )}
                <span className="text-white text-sm">
                  {uploadError || uploadProgress.message || 'Ready to upload'}
                </span>
              </div>
              {isUploading && (
                <Progress
                  value={uploadProgress.progress}
                  className="w-full"
                />
              )}
              {uploadError && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-figma-sm">
                  <p className="text-red-400 text-sm">{uploadError}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadError(null)}
                    className="text-red-400 hover:text-red-300 mt-2"
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metadata Form */}
        {selectedFile && !isUploading && uploadProgress.stage !== 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-white">Title *</Label>
                <Input
                  id="title"
                  value={metadata.title}
                  onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Song title"
                />
              </div>
              <div>
                <Label htmlFor="artist" className="text-white">Artist *</Label>
                <Input
                  id="artist"
                  value={metadata.artist}
                  onChange={(e) => setMetadata(prev => ({ ...prev, artist: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Artist name"
                />
              </div>
              <div>
                <Label htmlFor="album" className="text-white">Album</Label>
                <Input
                  id="album"
                  value={metadata.album}
                  onChange={(e) => setMetadata(prev => ({ ...prev, album: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Album name"
                />
              </div>
              <div>
                <Label htmlFor="genre" className="text-white">Genre</Label>
                <Input
                  id="genre"
                  value={metadata.genre}
                  onChange={(e) => setMetadata(prev => ({ ...prev, genre: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Music genre"
                />
              </div>
              <div>
                <Label htmlFor="year" className="text-white">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={metadata.year}
                  onChange={(e) => setMetadata(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                  className="bg-white/10 border-white/20 text-white"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
                placeholder="Describe your music..."
                rows={3}
              />
            </div>
          </motion.div>
        )}

        {/* Upload Button */}
        {selectedFile && !isUploading && uploadProgress.stage !== 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              onClick={handleUpload}
              disabled={!metadata.title || !metadata.artist || isUploading}
              className="w-full bg-gradient-to-r from-figma-purple to-figma-purple-light hover:from-figma-purple/80 hover:to-figma-purple-light/80 text-white py-3 text-lg font-medium rounded-figma-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 size={20} className="mr-3 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={20} className="mr-3" />
                  Upload to IPFS
                </>
              )}
            </Button>
            <div className="text-center space-y-2">
              <p className="text-white/60 text-sm">
                Files are uploaded to IPFS for decentralized storage
              </p>
              {!web3Service.isWalletConnected() && (
                <p className="text-yellow-400 text-sm">
                  Wallet connection is optional for uploads
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Success State */}
        {uploadProgress.stage === 'complete' && !uploadError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <Check size={32} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">Upload Successful!</h3>
              <p className="text-white/60 text-sm">
                Your music has been uploaded to IPFS and is now available for playback.
              </p>
            </div>
            <Button
              onClick={resetForm}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Upload Another File
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default IPFSUploader;