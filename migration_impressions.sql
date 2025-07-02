-- Migration: Add impressions and corrected columns to posts table
-- Run this migration after the existing migrations

-- Add impressions column (integer)
ALTER TABLE public.posts ADD COLUMN impressions integer DEFAULT 0;

-- Add corrected column (boolean)
ALTER TABLE public.posts ADD COLUMN corrected boolean DEFAULT false;

-- Function to assign random impressions to existing posts
CREATE OR REPLACE FUNCTION assign_random_impressions_to_posts()
RETURNS void AS $$
DECLARE
    post_record RECORD;
    random_impressions integer;
BEGIN
    -- Update each existing post with random impressions between 200 and 1000
    FOR post_record IN SELECT id FROM public.posts WHERE impressions = 0 LOOP
        -- Generate random number between 200 and 1000
        random_impressions := floor(random() * (1000 - 200 + 1)) + 200;
        
        -- Update the post
        UPDATE public.posts 
        SET impressions = random_impressions 
        WHERE id = post_record.id;
    END LOOP;
END;
$$ language plpgsql;

-- Execute the function to assign random impressions to existing posts
SELECT assign_random_impressions_to_posts();

-- Drop the function as it's no longer needed
DROP FUNCTION assign_random_impressions_to_posts();

-- Add index for impressions (useful for sorting by popularity)
CREATE INDEX idx_posts_impressions ON public.posts(impressions DESC);

-- Grant permissions
GRANT ALL ON public.posts TO service_role; 