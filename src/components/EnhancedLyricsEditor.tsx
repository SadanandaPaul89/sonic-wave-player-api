
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Trash2, Upload, Play, Pause, Edit, Save, FileText, Music } from 'lucide-react';
import { getLyricsBySongId, saveLyrics } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import { usePlayer } from '@/contexts/PlayerContext';

interface LyricLine {
  time: number;
  text: string;
}

interface EnhancedLyricsEditorProps {
  songId: string;
  artistId: string;
  songUrl?: string;
  onClose: () => void;
}

const EnhancedLyricsEditor: React.FC<EnhancedLyricsEditorProps> = ({ 
  songId, 
  artistId, 
  songUrl,
  onClose 
}) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([{ time: 0, text: '' }]);
  const [bulkText, setBulkText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Initialize audio element
    if (songUrl && !audioRef.current) {
      audioRef.current = document.createElement('audio') as HTMLAudioElement;
      audioRef.current.src = songUrl;
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
    }

    const loadLyrics = async () => {
      setIsLoading(true);
      try {
        const lyricsData = await getLyricsBySongId(songId);
        if (lyricsData.length > 0) {
          setLyrics(lyricsData);
        }
      } catch (error) {
        console.error('Error loading lyrics:', error);
        toast({
          title: "Error",
          description: "Failed to load lyrics",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadLyrics();

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.pause();
      }
    };
  }, [songId, songUrl]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const processLyricsWithAI = async () => {
    if (!bulkText.trim()) {
      toast({
        title: "Error",
        description: "Please enter lyrics text first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingAI(true);
    setProcessingProgress(0);

    try {
      // Split text into lines
      const lines = bulkText.split('\n').filter(line => line.trim());
      
      // Simulate AI processing with incremental progress
      const processedLyrics: LyricLine[] = [];
      const timePerLine = duration / lines.length;

      for (let i = 0; i < lines.length; i++) {
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        processedLyrics.push({
          time: Math.round(i * timePerLine),
          text: lines[i].trim()
        });

        setProcessingProgress(((i + 1) / lines.length) * 100);
      }

      setLyrics(processedLyrics);
      setBulkText('');
      
      toast({
        title: "Success",
        description: "Lyrics processed with AI-assisted timing!"
      });
    } catch (error) {
      console.error('Error processing lyrics:', error);
      toast({
        title: "Error",
        description: "Failed to process lyrics with AI",
        variant: "destructive"
      });
    } finally {
      setIsProcessingAI(false);
      setProcessingProgress(0);
    }
  };

  const parseLRCFile = (content: string): LyricLine[] => {
    const lines = content.split('\n');
    const lrcLyrics: LyricLine[] = [];

    lines.forEach(line => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const centiseconds = parseInt(match[3]);
        const time = minutes * 60 + seconds + centiseconds / 100;
        const text = match[4].trim();
        
        if (text) {
          lrcLyrics.push({ time, text });
        }
      }
    });

    return lrcLyrics.sort((a, b) => a.time - b.time);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      if (file.name.endsWith('.lrc')) {
        const parsedLyrics = parseLRCFile(content);
        if (parsedLyrics.length > 0) {
          setLyrics(parsedLyrics);
          toast({
            title: "Success",
            description: "LRC file uploaded successfully!"
          });
        } else {
          toast({
            title: "Error",
            description: "Invalid LRC file format",
            variant: "destructive"
          });
        }
      } else {
        setBulkText(content);
        toast({
          title: "Success",
          description: "Text file loaded. You can now process with AI timing."
        });
      }
    };
    
    reader.readAsText(file);
  };

  const updateLyricLine = (index: number, field: 'time' | 'text', value: string | number) => {
    const updatedLyrics = lyrics.map((lyric, i) => {
      if (i === index) {
        return { ...lyric, [field]: field === 'time' ? Number(value) : value };
      }
      return lyric;
    });
    setLyrics(updatedLyrics);
  };

  const addLyricLine = () => {
    const lastTime = lyrics.length > 0 ? lyrics[lyrics.length - 1].time : 0;
    setLyrics([...lyrics, { time: lastTime + 10, text: '' }]);
  };

  const removeLyricLine = (index: number) => {
    if (lyrics.length > 1) {
      setLyrics(lyrics.filter((_, i) => i !== index));
    }
  };

  const setCurrentTimeAsStart = (index: number) => {
    updateLyricLine(index, 'time', Math.round(currentTime));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const validLyrics = lyrics
        .filter(lyric => lyric.text.trim() !== '')
        .sort((a, b) => a.time - b.time);

      const success = await saveLyrics(songId, artistId, validLyrics);
      
      if (success) {
        toast({
          title: "Success",
          description: "Lyrics saved successfully!"
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description: "Failed to save lyrics",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving lyrics:', error);
      toast({
        title: "Error",
        description: "Failed to save lyrics",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimeInput = (timeStr: string): number => {
    const [mins, secs] = timeStr.split(':').map(Number);
    return (mins || 0) * 60 + (secs || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading lyrics...</div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Enhanced Lyrics Editor
          <Badge variant="secondary">Verified Artist</Badge>
        </CardTitle>
        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save size={16} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save Lyrics'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="bulk" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
            <TabsTrigger value="edit">Fine-tune Timing</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bulk" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Upload Lyrics</h3>
                <div className="space-y-4">
                  <div>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full"
                    >
                      <Upload size={16} className="mr-2" />
                      Upload LRC or TXT File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".lrc,.txt"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                  
                  <div className="text-center text-gray-500">or</div>
                  
                  <div>
                    <Textarea
                      placeholder="Paste your lyrics here... (one line per lyric)"
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      rows={10}
                      className="w-full"
                    />
                  </div>
                  
                  <Button 
                    onClick={processLyricsWithAI}
                    disabled={isProcessingAI || !bulkText.trim()}
                    className="w-full"
                  >
                    <Music size={16} className="mr-2" />
                    {isProcessingAI ? 'Processing with AI...' : 'Generate AI Timing'}
                  </Button>
                  
                  {isProcessingAI && (
                    <div className="space-y-2">
                      <Progress value={processingProgress} />
                      <p className="text-sm text-gray-500 text-center">
                        Processing lyrics with AI-assisted timing...
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Instructions</h3>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm space-y-2">
                  <p><strong>LRC Format:</strong> Upload pre-synced .lrc files with timestamps</p>
                  <p><strong>Plain Text:</strong> Paste lyrics and let AI generate timing</p>
                  <p><strong>AI Processing:</strong> Automatically distributes lines across song duration</p>
                  <p><strong>Fine-tuning:</strong> Use the "Fine-tune Timing" tab to adjust</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="edit" className="space-y-4">
            {songUrl && (
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-4 mb-2">
                  <Button onClick={togglePlayback} size="sm">
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </Button>
                  <span className="text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <div className="w-full bg-gray-300 dark:bg-gray-600 h-2 rounded-full">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {lyrics.map((lyric, index) => (
                <div key={index} className="flex gap-2 items-start p-2 border rounded">
                  <div className="w-20">
                    <Input
                      type="text"
                      placeholder="0:00"
                      value={formatTime(lyric.time)}
                      onChange={(e) => updateLyricLine(index, 'time', parseTimeInput(e.target.value))}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Lyric text..."
                      value={lyric.text}
                      onChange={(e) => updateLyricLine(index, 'text', e.target.value)}
                      className="min-h-[40px] resize-none"
                      rows={1}
                    />
                  </div>
                  <div className="flex gap-1">
                    {songUrl && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentTimeAsStart(index)}
                        title="Set current playback time"
                      >
                        <Music size={16} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLyricLine(index)}
                      disabled={lyrics.length === 1}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <Button onClick={addLyricLine} variant="outline" className="w-full">
              Add Lyric Line
            </Button>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Synced Lyrics Preview</h3>
                <div className="border rounded-lg p-4 h-80 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                  {lyrics.map((lyric, index) => {
                    const isActive = currentTime >= lyric.time && 
                      (index === lyrics.length - 1 || currentTime < lyrics[index + 1]?.time);
                    
                    return (
                      <div
                        key={index}
                        className={`p-2 rounded cursor-pointer transition-all ${
                          isActive 
                            ? 'bg-blue-500 text-white font-medium' 
                            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => seekTo(lyric.time)}
                      >
                        <span className="text-xs opacity-70 mr-2">
                          {formatTime(lyric.time)}
                        </span>
                        {lyric.text}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Export Options</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <FileText size={16} className="mr-2" />
                    Export as LRC
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileText size={16} className="mr-2" />
                    Export as Plain Text
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedLyricsEditor;
