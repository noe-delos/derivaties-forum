-- First, drop the existing city column if it exists with ENUM type
ALTER TABLE public.posts 
DROP COLUMN IF EXISTS city;

-- Drop the ENUM type if it exists
DROP TYPE IF EXISTS post_city;

-- Add the city column as text
ALTER TABLE public.posts 
ADD COLUMN city text;

-- Set a default value for existing posts
UPDATE public.posts 
SET city = 'paris'
WHERE city IS NULL;

-- Set a default value for the column
ALTER TABLE public.posts 
ALTER COLUMN city SET DEFAULT 'paris';

-- Make the column NOT NULL after setting defaults
ALTER TABLE public.posts 
ALTER COLUMN city SET NOT NULL;