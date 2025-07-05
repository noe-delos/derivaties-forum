-- Migration to add LinkedIn URL and phone number to users table
-- Execute this in Supabase SQL Studio

-- Add LinkedIn URL and phone number columns to users table
ALTER TABLE public.users 
ADD COLUMN linkedin_url text,
ADD COLUMN phone_number text;

-- Update the handle_new_user function to include LinkedIn URL and phone number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, linkedin_url, phone_number)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'last_name',
        new.raw_user_meta_data->>'linkedin_url',
        new.raw_user_meta_data->>'phone_number'
    );
    RETURN new;
END;
$$ language plpgsql security definer;

-- Add indexes for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_linkedin_url ON public.users(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number); 