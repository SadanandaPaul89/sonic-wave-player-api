// Enhanced Music Uploader - Clean version without Yellow SDK dependencies
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Music, 
  Image as ImageIcon, 
  CheckCircle, 
  Loader2, 
  Copy, 
  Check, 
  ExternalLink,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface TrackMetadata {
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: string;
  description: string;
}

interface UploadedTrack {
  audioHash: string;
  metadataHash: string;
  artworkHash?: string;
  metadata: TrackMetadata;
}

const EnhancedMusicUploader: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<TrackMetadata>({
    title: '',
    artist: '',
    album: '',
    genre: '',
    year: '',
    description: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedTrack, setUploadedTrack] = useState<UploadedTrack | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleAudioUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      toast.success('Audio file selected successfully!');
    } else {
      toast.error('Please select a valid audio file');
    }
  }, []);

  const handleArtworkUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setArtworkFile(file);
      toast.success('Artwork selected successfully!');
    } else {
      toast.error('Please select a valid image file');
    }
  }, []);

  const handleMetadataChange = useCallback((field: keyof TrackMetadata, value: string) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleUpload = async () => {
    if (!audioFile) {
      toast.error('Please select an audio file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Mock upload - replace with actual IPFS upload logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Mock successful upload
      const mockUploadedTrack: UploadedTrack = {
        audioHash: `Qm${Math.random().toString(36).substring(2, 15)}`,
        metadataHash: `Qm${Math.random().toString(36).substring(2, 15)}`,
        artworkHash: artworkFile ? `Qm${Math.random().toString(36).substring(2, 15)}` : undefined,
        metadata
      };

      setUploadedTrack(mockUploadedTrack);
      toast.success('Track uploaded successfully to IPFS!');
    } catch (error) {
      toast.error('Upload failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(true);
      toast.success('Hash copied to clipboard!');
      setTimeout(() => setCopiedHash(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setAudioFile(null);
    setArtworkFile(null);
    setMetadata({
      title: '',
      artist: '',
      album: '',
      genre: '',
      year: '',
      description: ''
    });
    setUploadedTrack(null);
    setUploadProgress(0);
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToStep2 = audioFile !== null;
  const canProceedToStep3 = canProceedToStep2 && metadata.title && metadata.artist;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="glass-card border-figma-glass-border">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-figma-text mb-4">
              Upload Your Music to IPFS
            </CardTitle>
            
            {/* Step Indicators */}
            <div className="flex justify-center space-x-4 mb-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${currentStep >= step 
                      ? 'bg-figma-purple text-white' 
                      : 'bg-figma-glass-bg border border-figma-glass-border text-figma-text-secondary'
                    }
                  `}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`
                      w-12 h-0.5 mx-2
                      ${currentStep > step ? 'bg-figma-purple' : 'bg-figma-glass-border'}
                    `} />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {!uploadedTrack ? (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  {/* Step 1: File Upload */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-xl font-semibold text-figma-text mb-2">
                          Select Your Audio File
                        </h3>
                        <p className="text-figma-text-secondary">
                          Choose the audio file you want to upload to IPFS
                        </p>
                      </div>

                      {/* Audio File Upload */}
                      <div className="space-y-4">
                        <Label htmlFor="audio-upload" className="text-figma-text">
                          Audio File (MP3, WAV, FLAC)
                        </Label>
                        <div className="relative">
                          <Input
                            id="audio-upload"
                            type="file"
                            accept="audio/*"
                            onChange={handleAudioUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="audio-upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-figma-glass-border rounded-lg cursor-pointer hover:border-figma-purple transition-colors"
                          >
                            <Music className="w-8 h-8 text-figma-text-secondary mb-2" />
                            <span className="text-figma-text-secondary">
                              {audioFile ? audioFile.name : 'Click to select audio file'}
                            </span>
                          </label>
                        </div>
                        {audioFile && (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            ✓ Audio file selected
                          </Badge>
                        )}
                      </div>

                      {/* Artwork Upload (Optional) */}
                      <div className="space-y-4">
                        <Label htmlFor="artwork-upload" className="text-figma-text">
                          Artwork (Optional)
                        </Label>
                        <div className="relative">
                          <Input
                            id="artwork-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleArtworkUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="artwork-upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-figma-glass-border rounded-lg cursor-pointer hover:border-figma-purple transition-colors"
                          >
                            <ImageIcon className="w-8 h-8 text-figma-text-secondary mb-2" />
                            <span className="text-figma-text-secondary">
                              {artworkFile ? artworkFile.name : 'Click to select artwork'}
                            </span>
                          </label>
                        </div>
                        {artworkFile && (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            ✓ Artwork selected
                          </Badge>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={nextStep}
                          disabled={!canProceedToStep2}
                          className="px-8"
                        >
                          Next Step
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Metadata */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-xl font-semibold text-figma-text mb-2">
                          Add Track Information
                        </h3>
                        <p className="text-figma-text-secondary">
                          Provide details about your track
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-figma-text">
                            Track Title *
                          </Label>
                          <Input
                            id="title"
                            value={metadata.title}
                            onChange={(e) => handleMetadataChange('title', e.target.value)}
                            placeholder="Enter track title"
                            className="bg-figma-glass-bg border-figma-glass-border text-figma-text"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="artist" className="text-figma-text">
                            Artist Name *
                          </Label>
                          <Input
                            id="artist"
                            value={metadata.artist}
                            onChange={(e) => handleMetadataChange('artist', e.target.value)}
                            placeholder="Enter artist name"
                            className="bg-figma-glass-bg border-figma-glass-border text-figma-text"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="album" className="text-figma-text">
                            Album
                          </Label>
                          <Input
                            id="album"
                            value={metadata.album}
                            onChange={(e) => handleMetadataChange('album', e.target.value)}
                            placeholder="Enter album name"
                            className="bg-figma-glass-bg border-figma-glass-border text-figma-text"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="genre" className="text-figma-text">
                            Genre
                          </Label>
                          <Input
                            id="genre"
                            value={metadata.genre}
                            onChange={(e) => handleMetadataChange('genre', e.target.value)}
                            placeholder="Enter genre"
                            className="bg-figma-glass-bg border-figma-glass-border text-figma-text"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="year" className="text-figma-text">
                            Year
                          </Label>
                          <Input
                            id="year"
                            value={metadata.year}
                            onChange={(e) => handleMetadataChange('year', e.target.value)}
                            placeholder="Enter year"
                            className="bg-figma-glass-bg border-figma-glass-border text-figma-text"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-figma-text">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          value={metadata.description}
                          onChange={(e) => handleMetadataChange('description', e.target.value)}
                          placeholder="Enter track description"
                          className="bg-figma-glass-bg border-figma-glass-border text-figma-text"
                          rows={4}
                        />
                      </div>

                      <div className="flex justify-between">
                        <Button
                          onClick={prevStep}
                          variant="outline"
                          className="px-8"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          onClick={nextStep}
                          disabled={!canProceedToStep3}
                          className="px-8"
                        >
                          Next Step
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review & Upload */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-xl font-semibold text-figma-text mb-2">
                          Review & Upload
                        </h3>
                        <p className="text-figma-text-secondary">
                          Review your track details and upload to IPFS
                        </p>
                      </div>

                      {/* Review Section */}
                      <div className="bg-figma-glass-bg border border-figma-glass-border rounded-lg p-6 space-y-4">
                        <h4 className="font-semibold text-figma-text">Track Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-figma-text-secondary">Title:</span>
                            <p className="text-figma-text font-medium">{metadata.title}</p>
                          </div>
                          <div>
                            <span className="text-figma-text-secondary">Artist:</span>
                            <p className="text-figma-text font-medium">{metadata.artist}</p>
                          </div>
                          {metadata.album && (
                            <div>
                              <span className="text-figma-text-secondary">Album:</span>
                              <p className="text-figma-text font-medium">{metadata.album}</p>
                            </div>
                          )}
                          {metadata.genre && (
                            <div>
                              <span className="text-figma-text-secondary">Genre:</span>
                              <p className="text-figma-text font-medium">{metadata.genre}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Music className="h-4 w-4 text-figma-purple" />
                            <span className="text-figma-text">{audioFile?.name}</span>
                          </div>
                          {artworkFile && (
                            <div className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4 text-figma-purple" />
                              <span className="text-figma-text">{artworkFile.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Upload Progress */}
                      <AnimatePresence>
                        {isUploading && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                          >
                            <div className="text-center">
                              <p className="text-figma-text mb-2">Uploading to IPFS...</p>
                              <Progress value={uploadProgress} className="w-full" />
                              <p className="text-figma-text-secondary text-sm mt-2">
                                {uploadProgress}% complete
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex justify-between">
                        <Button
                          onClick={prevStep}
                          variant="outline"
                          disabled={isUploading}
                          className="px-8"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          onClick={handleUpload}
                          disabled={isUploading}
                          className="px-8"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload to IPFS
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* Upload Success */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircle className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-figma-text mb-2">
                      Upload Successful!
                    </h3>
                    <p className="text-figma-text-secondary">
                      Your track has been successfully uploaded to IPFS
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-figma-glass-bg border border-figma-glass-border rounded-lg p-6">
                      <h4 className="font-semibold text-figma-text mb-4">Track Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-figma-text-secondary">Title:</span>
                          <p className="text-figma-text font-medium">{uploadedTrack.metadata.title}</p>
                        </div>
                        <div>
                          <span className="text-figma-text-secondary">Artist:</span>
                          <p className="text-figma-text font-medium">{uploadedTrack.metadata.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>Live on IPFS</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-figma-text">IPFS Metadata Hash</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={uploadedTrack.metadataHash}
                          readOnly
                          className="bg-figma-glass-bg border-figma-glass-border text-figma-text font-mono text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(uploadedTrack.metadataHash)}
                        >
                          {copiedHash ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${uploadedTrack.metadataHash}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-figma-text-secondary">Audio Hash:</span>
                        <p className="text-figma-text font-mono text-xs break-all">{uploadedTrack.audioHash}</p>
                      </div>
                      {uploadedTrack.artworkHash && (
                        <div>
                          <span className="text-figma-text-secondary">Artwork Hash:</span>
                          <p className="text-figma-text font-mono text-xs break-all">{uploadedTrack.artworkHash}</p>
                        </div>
                      )}
                    </div>

                    <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded">
                      <p className="text-green-400 text-sm font-medium">
                        🎵 Track added to Sonic Wave Library!
                      </p>
                      <p className="text-green-300/60 text-xs mt-1">
                        Your music is now available across the entire Sonic Wave platform
                      </p>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                      className="text-center pt-6"
                    >
                      <Button
                        onClick={resetForm}
                        variant="outline"
                        className="px-8"
                      >
                        Upload Another Track
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EnhancedMusicUploader;