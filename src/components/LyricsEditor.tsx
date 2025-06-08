
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Save } from 'lucide-react';
import { getLyricsBySongId, saveLyrics } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';

interface LyricLine {
  time: number;
  text: string;
}

interface LyricsEditorProps {
  songId: string;
  artistId: string;
  onClose: () => void;
}

const LyricsEditor: React.FC<LyricsEditorProps> = ({ songId, artistId, onClose }) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([{ time: 0, text: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
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
  }, [songId]);

  const addLyricLine = () => {
    const lastTime = lyrics.length > 0 ? lyrics[lyrics.length - 1].time : 0;
    setLyrics([...lyrics, { time: lastTime + 10, text: '' }]);
  };

  const removeLyricLine = (index: number) => {
    if (lyrics.length > 1) {
      setLyrics(lyrics.filter((_, i) => i !== index));
    }
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Filter out empty lyrics and sort by time
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

  const formatTimeInput = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Edit Lyrics
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
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          Add time-synced lyrics for your song. Time should be in MM:SS format (e.g., 1:30 for 1 minute 30 seconds).
        </div>
        
        {lyrics.map((lyric, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="w-20">
              <Input
                type="text"
                placeholder="0:00"
                value={formatTimeInput(lyric.time)}
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeLyricLine(index)}
              disabled={lyrics.length === 1}
              className="mt-1"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
        
        <Button onClick={addLyricLine} variant="outline" className="w-full">
          <Plus size={16} className="mr-2" />
          Add Lyric Line
        </Button>
      </CardContent>
    </Card>
  );
};

export default LyricsEditor;
