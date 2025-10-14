
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Music, Upload, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import EnhancedMusicUploader from '@/components/EnhancedMusicUploader';
import { SonicWaveTrack } from '@/services/sonicWaveMusicLibrary';
import { toast } from '@/hooks/use-toast';
import AnimationWrapper from '@/components/AnimationWrapper';

const PublishSong: React.FC = () => {
  const navigate = useNavigate();

  const handleUploadComplete = (track: SonicWaveTrack) => {
    console.log("Track uploaded to Sonic Wave library:", track);
    
    // Show success toast
    toast({
      title: "Success!",
      description: `"${track.title}" has been uploaded to your library and Pinata IPFS.`
    });
    
    // Navigate to library after a short delay
    setTimeout(() => {
      navigate('/library');
    }, 2000);
  };

  return (
    <AnimationWrapper animation="fadeIn" className="min-h-screen">
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-figma-dark via-gray-900 to-black"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-figma-purple/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>
      </div>

      <div className="relative z-10 container mx-auto py-8 px-4 max-w-4xl">
        {/* Header Section */}
        <motion.div 
          className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/library">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Library
              </Button>
            </Link>
          </motion.div>
          
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h1 className="text-3xl lg:text-4xl font-bold text-white flex items-center gap-3">
                <motion.div
                  className="p-2 bg-figma-purple/20 rounded-figma-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Upload className="h-8 w-8 text-figma-purple" />
                </motion.div>
                Upload Your Music
              </h1>
              <motion.p 
                className="text-white/60 mt-2 text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Share your creativity with the world through decentralized music storage
              </motion.p>
            </motion.div>
          </div>
          
          <motion.div
            className="flex items-center gap-2 text-figma-purple"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">IPFS Powered</span>
          </motion.div>
        </motion.div>
        
        {/* Upload Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <EnhancedMusicUploader 
            onUploadComplete={handleUploadComplete}
            className="max-w-3xl mx-auto"
          />
        </motion.div>
        
        {/* Footer Info */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <div className="glass-card inline-flex items-center gap-3 px-6 py-3 rounded-figma-lg border-figma-glass-border">
            <Music className="h-5 w-5 text-figma-purple" />
            <span className="text-white/70 text-sm">
              Supported formats: <span className="text-white font-medium">MP3, WAV, FLAC, AAC, OGG</span> + 
              <span className="text-white font-medium"> JPEG, PNG, WebP</span> artwork
            </span>
          </div>
          
          <motion.div 
            className="mt-4 flex items-center justify-center gap-6 text-xs text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Decentralized Storage</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Permanent Hosting</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Global Access</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AnimationWrapper>
  );
};

export default PublishSong;
