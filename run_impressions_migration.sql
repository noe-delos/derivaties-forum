-- Standalone migration script for adding impressions and corrected columns
-- Run this in your Supabase SQL editor or database client

-- Add impressions column (integer)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS impressions integer DEFAULT 0;

-- Add corrected column (boolean) 
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS corrected boolean DEFAULT false;

-- Update existing posts with random impressions between 200 and 1000
UPDATE public.posts 
SET impressions = floor(random() * (1000 - 200 + 1)) + 200 
WHERE impressions = 0;

-- Add index for impressions (useful for sorting by popularity)
CREATE INDEX IF NOT EXISTS idx_posts_impressions ON public.posts(impressions DESC);

-- Verify the update
SELECT id, title, impressions, corrected FROM public.posts LIMIT 10; 