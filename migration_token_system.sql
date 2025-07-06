-- Token system migration
-- This migration adds the user_purchased_content table and updates the signup function

-- Create table to track purchased content
CREATE TABLE public.user_purchased_content (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    content_type text NOT NULL CHECK (content_type IN ('interview', 'correction')),
    tokens_spent integer NOT NULL,
    created_at timestamptz DEFAULT now(),
    -- Ensure a user can only purchase the same content once
    UNIQUE(user_id, post_id, content_type)
);

-- Add indexes for better performance
CREATE INDEX idx_user_purchased_content_user_id ON public.user_purchased_content(user_id);
CREATE INDEX idx_user_purchased_content_post_id ON public.user_purchased_content(post_id);
CREATE INDEX idx_user_purchased_content_type ON public.user_purchased_content(content_type);

-- Enable RLS on user_purchased_content table
ALTER TABLE public.user_purchased_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_purchased_content
CREATE POLICY "Users can view own purchased content" ON public.user_purchased_content
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchased content" ON public.user_purchased_content
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update the handle_new_user function to give 20 tokens on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, linkedin_url, phone_number, tokens)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'last_name',
        new.raw_user_meta_data->>'linkedin_url',
        new.raw_user_meta_data->>'phone_number',
        20  -- Give 20 tokens on signup
    );
    RETURN new;
END;
$$ language plpgsql security definer;

-- Function to purchase content
CREATE OR REPLACE FUNCTION public.purchase_content(
    p_post_id uuid,
    p_content_type text,
    p_tokens_cost integer
)
RETURNS boolean AS $$
DECLARE
    user_tokens integer;
    purchase_exists boolean;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Check if content type is valid
    IF p_content_type NOT IN ('interview', 'correction') THEN
        RAISE EXCEPTION 'Invalid content type';
    END IF;
    
    -- Check if user has enough tokens
    SELECT tokens INTO user_tokens 
    FROM public.users 
    WHERE id = auth.uid();
    
    IF user_tokens < p_tokens_cost THEN
        RAISE EXCEPTION 'Not enough tokens';
    END IF;
    
    -- Check if user already purchased this content
    SELECT EXISTS(
        SELECT 1 FROM public.user_purchased_content 
        WHERE user_id = auth.uid() 
        AND post_id = p_post_id 
        AND content_type = p_content_type
    ) INTO purchase_exists;
    
    IF purchase_exists THEN
        RAISE EXCEPTION 'Content already purchased';
    END IF;
    
    -- Deduct tokens from user
    UPDATE public.users 
    SET tokens = tokens - p_tokens_cost 
    WHERE id = auth.uid();
    
    -- Record the purchase
    INSERT INTO public.user_purchased_content (user_id, post_id, content_type, tokens_spent)
    VALUES (auth.uid(), p_post_id, p_content_type, p_tokens_cost);
    
    RETURN TRUE;
END;
$$ language plpgsql security definer;

-- Function to check if user has purchased content
CREATE OR REPLACE FUNCTION public.has_purchased_content(
    p_post_id uuid,
    p_content_type text
)
RETURNS boolean AS $$
BEGIN
    -- If user is not authenticated, return false
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has purchased this content
    RETURN EXISTS(
        SELECT 1 FROM public.user_purchased_content 
        WHERE user_id = auth.uid() 
        AND post_id = p_post_id 
        AND content_type = p_content_type
    );
END;
$$ language plpgsql security definer;

-- Grant permissions
GRANT ALL ON public.user_purchased_content TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Force RLS for service role
ALTER TABLE public.user_purchased_content FORCE ROW LEVEL SECURITY;