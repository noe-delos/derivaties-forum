-- Add the city column to the posts table
ALTER TABLE public.posts 
ADD COLUMN city text;

-- Set a default value for existing posts
UPDATE public.posts 
SET city = 'paris'
WHERE city IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE public.posts 
ALTER COLUMN city SET NOT NULL; 