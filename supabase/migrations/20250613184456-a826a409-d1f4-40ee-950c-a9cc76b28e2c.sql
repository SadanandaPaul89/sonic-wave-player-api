
-- Create a table to store song likes
CREATE TABLE public.song_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  song_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, song_id)
);

-- Create a table to store song plays
CREATE TABLE public.song_plays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.song_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_plays ENABLE ROW LEVEL SECURITY;

-- RLS policies for song_likes
CREATE POLICY "Users can view all likes" ON public.song_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON public.song_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.song_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for song_plays
CREATE POLICY "Users can view all plays" ON public.song_plays FOR SELECT USING (true);
CREATE POLICY "Users can insert their own plays" ON public.song_plays FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Add like_count and play_count columns to songs table
ALTER TABLE public.songs ADD COLUMN like_count INTEGER DEFAULT 0;
ALTER TABLE public.songs ADD COLUMN play_count INTEGER DEFAULT 0;

-- Create functions to update counters
CREATE OR REPLACE FUNCTION update_song_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.songs SET like_count = like_count + 1 WHERE id = NEW.song_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.songs SET like_count = like_count - 1 WHERE id = OLD.song_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_song_play_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.songs SET play_count = play_count + 1 WHERE id = NEW.song_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER song_like_counter_trigger
  AFTER INSERT OR DELETE ON public.song_likes
  FOR EACH ROW EXECUTE FUNCTION update_song_like_count();

CREATE TRIGGER song_play_counter_trigger
  AFTER INSERT ON public.song_plays
  FOR EACH ROW EXECUTE FUNCTION update_song_play_count();
