// IPFS Music Uploader - Real decentralized music upload with multiple formats

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Music, 
  FileAudio, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ipfsMusicService } from '@/services/ipfsMusicService';

interface UploadedTrack {
  ipfsHash: string;
  title: string;
  artist: string;
  audioFiles: any;
  metadata: any;
  totalSize: number;
  uploadedAt: Date;
}

interface IPFSMusicUploaderProps {
  onUploadComplete?: (track: UploadedTrack) => void;
  className?: string;
}

const IPFSMusicUploader: React.FC<IPFSMusicUploaderProps> = ({
  onUploadComplete,
  className = ''
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedTrack, setUploadedTrack] = useState<UploadedTrack | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid audio file (MP3, WAV, FLAC, AAC, OGG)');
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      setError('File size must be less than 100MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    
    // Auto-fill title from filename if empty
    if (!title) {
      const filename = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setTitle(filename);
    }

    toast.success('Audio file selected successfully');
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !title || !artist) {
      setError('Please fill in all required fields and select a file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      console.log('Starting IPFS upload for:', selectedFile.name);

      const metadata = {
        title,
        artist,
        album: album || undefined,
        genre: genre || undefined,
        year,
        duration: 0 // Would be extracted from audio file in real implementation
      };

      const result = await ipfsMusicService.uploadMusic(
        selectedFile,
        metadata,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      const uploadedTrack: UploadedTrack = {
        ipfsHash: result.ipfsHash,
        title: result.metadata.title,
        artist: result.metadata.artist,
        audioFiles: result.audioFiles,
        metadata: result.metadata,
        totalSize: result.totalSize,
        uploadedAt: new Date()
      };

      setUploadedTrack(uploadedTrack);
      onUploadComplete?.(uploadedTrack);

      toast.success('Music uploaded to IPFS successfully!', {
        description: `Hash: ${result.ipfsHash.slice(0, 12)}...`,
      });

      // Reset form
      setSelectedFile(null);
      setTitle('');
      setArtist('');
      setAlbum('');
      setGenre('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Upload failed:', error);
      setError(error.message || 'Upload failed. Please try again.');
      
      toast.error('Upload failed', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Copy IPFS hash
  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      toast.success('IPFS hash copied to clipboard');
      setTimeout(() => setCopiedHash(false), 2000);
    } catch (error) {
      toast.error('Failed to copy hash');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Form */}
      <Card className="glass-card border-figma-glass-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <Upload size={24} className="text-figma-purple" />
            Upload Music to IPFS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Selection */}
          <div className="space-y-2">
            <Label className="text-white">Audio File *</Label>
            <div 
              className="border-2 border-dashed border-white/20 rounded-figma-md p-8 text-center hover:border-figma-purple/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {selectedFile ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <FileAudio size={48} className="mx-auto text-figma-purple" />
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-white/60 text-sm">{formatFileSize(selectedFile.size)}</p>
                  <Badge className="bg-green-500/20 text-green-400">
                    Ready to upload
                  </Badge>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  <Music size={48} className="mx-auto text-white/40" />
                  <p className="text-white">Click to select an audio file</p>
                  <p className="text-white/60 text-sm">Supports MP3, WAV, FLAC, AAC, OGG (max 100MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter track title"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Artist *</Label>
              <Input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Enter artist name"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Album</Label>
              <Input
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="Enter album name (optional)"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-white">Genre</Label>
              <Input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Enter genre (optional)"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Year</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
              min="1900"
              max={new Date().getFullYear() + 1}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 max-w-32"
            />
          </div>

          {/* Upload Progress */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">Uploading to IPFS...</span>
                  <span className="text-white/60 text-sm">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-500/20 border border-red-500/30 rounded-figma-md"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-red-400" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !title || !artist || isUploading}
            className="w-full bg-gradient-to-r from-figma-purple to-figma-purple-light hover:from-figma-purple/80 hover:to-figma-purple-light/80 text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Uploading to IPFS...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Upload to IPFS
              </>
            )}
          </Button>

          {/* Info */}
          <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-figma-md">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-blue-400 mt-0.5" />
              <div className="text-blue-300 text-sm">
                <p className="font-medium mb-1">IPFS Upload Process:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Audio will be converted to multiple formats (320kbps, 192kbps, 128kbps)</li>
                  <li>• Files are uploaded to IPFS for decentralized storage</li>
                  <li>• Content is pinned to ensure availability</li>
                  <li>• You'll receive an IPFS hash for permanent access</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Success */}
      <AnimatePresence>
        {uploadedTrack && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="glass-card border-green-500/30 bg-green-500/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <CheckCircle size={24} className="text-green-400" />
                  Upload Successful!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/60 text-sm">Track</p>
                    <p className="text-white font-medium">{uploadedTrack.title}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Artist</p>
                    <p className="text-white font-medium">{uploadedTrack.artist}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Total Size</p>
                    <p className="text-white font-medium">{formatFileSize(uploadedTrack.totalSize)}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Uploaded</p>
                    <p className="text-white font-medium">{uploadedTrack.uploadedAt.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-white/60 text-sm">IPFS Hash</p>
                  <div className="flex items-center gap-2 p-3 bg-black/20 rounded-figma-sm">
                    <code className="text-green-400 font-mono text-sm flex-1">
                      {uploadedTrack.ipfsHash}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyHash(uploadedTrack.ipfsHash)}
                      className="h-8 w-8 p-0 text-white/60 hover:text-green-400"
                    >
                      {copiedHash ? (
                        <Check size={14} className="text-green-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${uploadedTrack.ipfsHash}`, '_blank')}
                      className="h-8 w-8 p-0 text-white/60 hover:text-green-400"
                    >
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-white/60 text-sm">Available Formats</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(uploadedTrack.audioFiles).map(([quality, file]: [string, any]) => (
                      <Badge key={quality} className="bg-figma-purple/20 text-figma-purple">
                        {quality.replace('_', ' ')}: {file.bitrate}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IPFSMusicUploader;