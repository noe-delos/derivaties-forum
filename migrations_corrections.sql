-- Corrections system migration
-- Add correction-related notification types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'correction_submitted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'correction_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'correction_rejected';

-- Create correction status enum
CREATE TYPE correction_status AS ENUM ('pending', 'approved', 'rejected');

-- Create corrections table
CREATE TABLE public.corrections (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL, -- The correction content/answer
    status correction_status DEFAULT 'pending',
    moderator_id uuid REFERENCES public.users(id) ON DELETE SET NULL, -- Who approved/rejected
    moderator_note text, -- Note from moderator when approving/rejecting
    tokens_awarded integer DEFAULT 0, -- Tokens given to user when approved
    is_selected boolean DEFAULT false, -- Whether this correction was selected as the official one
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add index for better performance
CREATE INDEX idx_corrections_post_id ON public.corrections(post_id);
CREATE INDEX idx_corrections_user_id ON public.corrections(user_id);
CREATE INDEX idx_corrections_status ON public.corrections(status);
CREATE INDEX idx_corrections_selected ON public.corrections(is_selected);

-- Enable RLS on corrections table
ALTER TABLE public.corrections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for corrections
CREATE POLICY "Anyone can view approved corrections for public posts" ON public.corrections
    FOR SELECT USING (
        status = 'approved' AND
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE id = post_id 
            AND status = 'approved' 
            AND is_public = true
        )
    );

CREATE POLICY "Authenticated users can view approved corrections" ON public.corrections
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND
        status = 'approved' AND
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE id = post_id 
            AND status = 'approved'
        )
    );

CREATE POLICY "Users can view own corrections" ON public.corrections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Moderators can view all corrections" ON public.corrections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

CREATE POLICY "Authenticated users can submit corrections" ON public.corrections
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE id = post_id 
            AND status = 'approved'
        )
    );

CREATE POLICY "Users can update own pending corrections" ON public.corrections
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Moderators can update correction status" ON public.corrections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

-- Function to handle correction approval
CREATE OR REPLACE FUNCTION award_tokens_for_approved_correction()
RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        -- Award tokens to the user (default 15 tokens for approved correction)
        UPDATE public.users 
        SET tokens = tokens + COALESCE(NEW.tokens_awarded, 15)
        WHERE id = NEW.user_id;
        
        -- If this correction is selected as the official one, mark post as corrected
        IF NEW.is_selected = true THEN
            UPDATE public.posts 
            SET corrected = true
            WHERE id = NEW.post_id;
            
            -- Unselect any other corrections for this post
            UPDATE public.corrections 
            SET is_selected = false 
            WHERE post_id = NEW.post_id AND id != NEW.id;
        END IF;
        
        -- Create notification for user
        INSERT INTO public.notifications (user_id, type, title, content, post_id)
        VALUES (
            NEW.user_id,
            'correction_approved',
            'Correction approuvée !',
            'Votre correction a été approuvée et vous avez reçu ' || COALESCE(NEW.tokens_awarded, 15) || ' tokens.',
            NEW.post_id
        );
        
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        -- Create notification for user
        INSERT INTO public.notifications (user_id, type, title, content, post_id)
        VALUES (
            NEW.user_id,
            'correction_rejected',
            'Correction rejetée',
            'Votre correction a été rejetée. ' || COALESCE(NEW.moderator_note, ''),
            NEW.post_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ language plpgsql security definer;

-- Function to handle correction submission notification
CREATE OR REPLACE FUNCTION notify_correction_submission()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Notify moderators/admins about new correction submission
        INSERT INTO public.notifications (user_id, type, title, content, post_id)
        SELECT 
            u.id,
            'correction_submitted',
            'Nouvelle correction soumise',
            'Une nouvelle correction a été soumise pour validation.',
            NEW.post_id
        FROM public.users u 
        WHERE u.role IN ('moderator', 'admin');
    END IF;
    
    RETURN NEW;
END;
$$ language plpgsql security definer;

-- Function to update post corrected status when correction is unselected
CREATE OR REPLACE FUNCTION update_post_corrected_status()
RETURNS trigger AS $$
BEGIN
    -- If a correction is being unselected, check if there are any other selected corrections
    IF TG_OP = 'UPDATE' AND OLD.is_selected = true AND NEW.is_selected = false THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.corrections 
            WHERE post_id = NEW.post_id AND is_selected = true AND id != NEW.id
        ) THEN
            UPDATE public.posts 
            SET corrected = false 
            WHERE id = NEW.post_id;
        END IF;
    END IF;
    
    -- If a correction is being deleted and it was selected
    IF TG_OP = 'DELETE' AND OLD.is_selected = true THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.corrections 
            WHERE post_id = OLD.post_id AND is_selected = true AND id != OLD.id
        ) THEN
            UPDATE public.posts 
            SET corrected = false 
            WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ language plpgsql security definer;

-- Triggers for correction management
CREATE TRIGGER correction_status_change_trigger
    AFTER UPDATE ON public.corrections
    FOR EACH ROW EXECUTE FUNCTION award_tokens_for_approved_correction();

CREATE TRIGGER correction_submission_trigger
    AFTER INSERT ON public.corrections
    FOR EACH ROW EXECUTE FUNCTION notify_correction_submission();

CREATE TRIGGER correction_post_status_trigger
    AFTER UPDATE OR DELETE ON public.corrections
    FOR EACH ROW EXECUTE FUNCTION update_post_corrected_status();

-- Grant permissions
GRANT ALL ON public.corrections TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Force RLS for service role
ALTER TABLE public.corrections FORCE ROW LEVEL SECURITY;