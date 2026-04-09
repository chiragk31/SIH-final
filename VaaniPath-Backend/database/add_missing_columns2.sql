-- Add missing subtitle_url to translations
ALTER TABLE translations ADD COLUMN IF NOT EXISTS subtitle_url TEXT;
ALTER TABLE translations ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Add missing views to videos
ALTER TABLE videos ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS subtitles JSONB DEFAULT '{}'::jsonb;
