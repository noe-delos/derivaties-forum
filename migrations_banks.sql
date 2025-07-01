-- Banks feature migration
-- Run this after the main migrations.sql

-- Create banks table
CREATE TABLE public.banks (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    logo_url text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Insert the banks data
INSERT INTO public.banks (name, logo_url) VALUES
    ('Goldman Sachs', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8U42AyM6MTdBAKSpUT6JBik3NIbXjc0typg&s'),
    ('Rothschild & Co', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFCjzYEadkSm-M3ysp0Reqr-c92NAM3Oqisg&s'),
    ('Société Générale', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6L1Ve75Tf6cTzo_-ZA8hRYvaX7mwCjd7OOQ&s'),
    ('BNP Paribas', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDZFXaYDmSQ6tL4O9x7cG9FBnS2F2FNrWWMQ&s'),
    ('Crédit Agricole', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjrLQq91ocYuNTMnLgsSNRgXFEuXw60_zYNg&s'),
    ('Crédit Mutuel', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9OEJE2uCKWDWMaFXkRfAjAJJWidIK2lWO9Q&s');

-- Add bank_id column to posts table
ALTER TABLE public.posts ADD COLUMN bank_id uuid REFERENCES public.banks(id);

-- Function to assign random banks to existing posts
CREATE OR REPLACE FUNCTION assign_random_banks_to_posts()
RETURNS void AS $$
DECLARE
    post_record RECORD;
    bank_ids uuid[];
    random_bank_id uuid;
BEGIN
    -- Get all bank IDs
    SELECT ARRAY(SELECT id FROM public.banks) INTO bank_ids;
    
    -- Update each existing post with a random bank
    FOR post_record IN SELECT id FROM public.posts WHERE bank_id IS NULL LOOP
        -- Select a random bank ID
        random_bank_id := bank_ids[floor(random() * array_length(bank_ids, 1)) + 1];
        
        -- Update the post
        UPDATE public.posts 
        SET bank_id = random_bank_id 
        WHERE id = post_record.id;
    END LOOP;
END;
$$ language plpgsql;

-- Execute the function to assign random banks to existing posts
SELECT assign_random_banks_to_posts();

-- Drop the function as it's no longer needed
DROP FUNCTION assign_random_banks_to_posts();

-- Make bank_id required for future posts
ALTER TABLE public.posts ALTER COLUMN bank_id SET NOT NULL;

-- Add index for better performance
CREATE INDEX idx_posts_bank_id ON public.posts(bank_id);

-- RLS policies for banks table
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view banks" ON public.banks
    FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON public.banks TO service_role; 