-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for enums
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE post_category AS ENUM ('entretien_sales_trading', 'conseils_ecole', 'stage_summer_graduate', 'quant_hedge_funds');
CREATE TYPE post_type AS ENUM ('question', 'retour_experience', 'transcript_entretien', 'fichier_attache');
CREATE TYPE post_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM ('post_approved', 'post_rejected', 'comment_on_post', 'upvote_received', 'correction_submitted', 'correction_approved', 'correction_rejected');
CREATE TYPE post_city AS ENUM ('paris', 'london', 'new_york', 'hong_kong', 'singapore', 'dubai', 'frankfurt', 'tokyo', 'zurich', 'toronto');

-- Users table (extends auth.users)
CREATE TABLE public.users (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text NOT NULL,
    first_name text,
    last_name text,
    username text UNIQUE,
    bio text,
    job_title text,
    location text,
    school text,
    profile_picture_url text,
    banner_url text,
    linkedin_url text,
    phone_number text,
    tokens integer DEFAULT 0,
    role user_role DEFAULT 'user',
    is_banned boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Posts table
CREATE TABLE public.posts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    content text NOT NULL, -- Tiptap markdown content
    category post_category NOT NULL,
    type post_type NOT NULL,
    city post_city NOT NULL,
    tags text[] DEFAULT '{}',
    is_public boolean DEFAULT false, -- visible to anonymous users
    status post_status DEFAULT 'pending',
    moderator_note text, -- Note from moderator when approving/rejecting
    upvotes integer DEFAULT 0,
    downvotes integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    impressions integer DEFAULT 0, -- view count/popularity metric
    corrected boolean DEFAULT false, -- whether the post has been corrected
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Post media table (for images, videos, files)
CREATE TABLE public.post_media (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    file_url text NOT NULL,
    file_name text NOT NULL,
    file_type text NOT NULL, -- 'image', 'video', 'document'
    file_size bigint,
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Comments table
CREATE TABLE public.comments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE, -- for nested comments
    content text NOT NULL,
    upvotes integer DEFAULT 0,
    downvotes integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Votes table (for posts and comments)
CREATE TABLE public.votes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
    vote_type integer NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 for downvote, 1 for upvote
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, post_id),
    UNIQUE(user_id, comment_id)
);

-- Notifications table
CREATE TABLE public.notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title text NOT NULL,
    content text,
    post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Create correction status enum
CREATE TYPE correction_status AS ENUM ('pending', 'approved', 'rejected');

-- Corrections table
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

-- Function to handle user creation from auth.users
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

-- Trigger for auto-creating user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update post vote counts
CREATE OR REPLACE FUNCTION update_post_vote_counts()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE public.posts 
            SET upvotes = (
                SELECT COALESCE(SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END), 0)
                FROM public.votes 
                WHERE post_id = NEW.post_id
            ),
            downvotes = (
                SELECT COALESCE(SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END), 0)
                FROM public.votes 
                WHERE post_id = NEW.post_id
            )
            WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE public.posts 
            SET upvotes = (
                SELECT COALESCE(SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END), 0)
                FROM public.votes 
                WHERE post_id = NEW.post_id
            ),
            downvotes = (
                SELECT COALESCE(SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END), 0)
                FROM public.votes 
                WHERE post_id = NEW.post_id
            )
            WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_id IS NOT NULL THEN
            UPDATE public.posts 
            SET upvotes = (
                SELECT COALESCE(SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END), 0)
                FROM public.votes 
                WHERE post_id = OLD.post_id
            ),
            downvotes = (
                SELECT COALESCE(SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END), 0)
                FROM public.votes 
                WHERE post_id = OLD.post_id
            )
            WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language plpgsql security definer;

-- Function to update comment vote counts
CREATE OR REPLACE FUNCTION update_comment_vote_counts()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.comment_id IS NOT NULL THEN
            UPDATE public.comments 
            SET upvotes = (
                SELECT COALESCE(SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END), 0)
                FROM public.votes 
                WHERE comment_id = NEW.comment_id
            ),
            downvotes = (
                SELECT COALESCE(SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END), 0)
                FROM public.votes 
                WHERE comment_id = NEW.comment_id
            )
            WHERE id = NEW.comment_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.comment_id IS NOT NULL THEN
            UPDATE public.comments 
            SET upvotes = (
                SELECT COALESCE(SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END), 0)
                FROM public.votes 
                WHERE comment_id = NEW.comment_id
            ),
            downvotes = (
                SELECT COALESCE(SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END), 0)
                FROM public.votes 
                WHERE comment_id = NEW.comment_id
            )
            WHERE id = NEW.comment_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.comment_id IS NOT NULL THEN
            UPDATE public.comments 
            SET upvotes = (
                SELECT COALESCE(SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END), 0)
                FROM public.votes 
                WHERE comment_id = OLD.comment_id
            ),
            downvotes = (
                SELECT COALESCE(SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END), 0)
                FROM public.votes 
                WHERE comment_id = OLD.comment_id
            )
            WHERE id = OLD.comment_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language plpgsql security definer;

-- Function to update comments count on posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts 
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts 
        SET comments_count = comments_count - 1
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language plpgsql security definer;

-- Triggers for vote count updates
CREATE TRIGGER vote_post_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.votes
    FOR EACH ROW EXECUTE FUNCTION update_post_vote_counts();

CREATE TRIGGER vote_comment_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.votes
    FOR EACH ROW EXECUTE FUNCTION update_comment_vote_counts();

-- Trigger for comment count updates
CREATE TRIGGER comment_count_trigger
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Function to award tokens for approved posts
CREATE OR REPLACE FUNCTION award_tokens_for_approved_post()
RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        UPDATE public.users 
        SET tokens = tokens + 10
        WHERE id = NEW.user_id;
        
        INSERT INTO public.notifications (user_id, type, title, content, post_id)
        VALUES (
            NEW.user_id,
            'post_approved',
            'Publication approuvée !',
            'Votre publication "' || NEW.title || '" a été approuvée et vous avez reçu 10 tokens.',
            NEW.id
        );
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        INSERT INTO public.notifications (user_id, type, title, content, post_id)
        VALUES (
            NEW.user_id,
            'post_rejected',
            'Publication rejetée',
            'Votre publication "' || NEW.title || '" a été rejetée.',
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ language plpgsql security definer;

-- Trigger for post approval/rejection
CREATE TRIGGER post_status_change_trigger
    AFTER UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION award_tokens_for_approved_post();

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

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrections ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Anyone can view approved public posts" ON public.posts
    FOR SELECT USING (status = 'approved' AND is_public = true);

CREATE POLICY "Authenticated users can view all approved posts" ON public.posts
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND status = 'approved'
    );

CREATE POLICY "Users can view own posts" ON public.posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Moderators and admins can view all posts" ON public.posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('moderator', 'admin')
        )
    );

CREATE POLICY "Users can create posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Moderators can update post status" ON public.posts
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

-- Post media policies
CREATE POLICY "Anyone can view media for public approved posts" ON public.post_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE id = post_id 
            AND status = 'approved' 
            AND is_public = true
        )
    );

CREATE POLICY "Authenticated users can view media for approved posts" ON public.post_media
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE id = post_id 
            AND status = 'approved'
        )
    );

CREATE POLICY "Users can manage own post media" ON public.post_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE id = post_id 
            AND user_id = auth.uid()
        )
    );

-- Comments policies
CREATE POLICY "Anyone can view comments on public approved posts" ON public.comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE id = post_id 
            AND status = 'approved' 
            AND is_public = true
        )
    );

CREATE POLICY "Authenticated users can view comments on approved posts" ON public.comments
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE id = post_id 
            AND status = 'approved'
        )
    );

CREATE POLICY "Authenticated users can create comments" ON public.comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE id = post_id 
            AND status = 'approved'
        )
    );

CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Authenticated users can view votes" ON public.votes
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own votes" ON public.votes
    FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Corrections policies
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

-- Storage policies for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-pictures', 'profile-pictures', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('post-files', 'post-files', false);

-- Storage policies
CREATE POLICY "Users can upload own profile pictures" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-pictures' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own profile pictures" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-pictures' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view profile pictures" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload post media" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'post-media' AND
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Anyone can view post media" ON storage.objects
    FOR SELECT USING (bucket_id = 'post-media');

CREATE POLICY "Users can upload post files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'post-files' AND
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Authenticated users can view post files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'post-files' AND
        auth.uid() IS NOT NULL
    );

-- Create indexes for better performance
CREATE INDEX idx_posts_status_public ON public.posts(status, is_public);
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_impressions ON public.posts(impressions DESC);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_votes_post_id ON public.votes(post_id);
CREATE INDEX idx_votes_comment_id ON public.votes(comment_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_post_media_post_id ON public.post_media(post_id);
CREATE INDEX idx_corrections_post_id ON public.corrections(post_id);
CREATE INDEX idx_corrections_user_id ON public.corrections(user_id);
CREATE INDEX idx_corrections_status ON public.corrections(status);
CREATE INDEX idx_corrections_selected ON public.corrections(is_selected);
CREATE INDEX idx_users_linkedin_url ON public.users(linkedin_url);
CREATE INDEX idx_users_phone_number ON public.users(phone_number);

-- Add these statements at the end of the file to properly configure service role bypass
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

-- Grant proper permissions to the service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Explicitly allow service_role to bypass RLS
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.posts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.post_media FORCE ROW LEVEL SECURITY;
ALTER TABLE public.comments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.votes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.corrections FORCE ROW LEVEL SECURITY;

-- Add security definer to functions that need to bypass RLS
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
ALTER FUNCTION public.update_post_vote_counts() SECURITY DEFINER;
ALTER FUNCTION public.update_comment_vote_counts() SECURITY DEFINER;
ALTER FUNCTION public.update_post_comments_count() SECURITY DEFINER;
ALTER FUNCTION public.award_tokens_for_approved_post() SECURITY DEFINER;
ALTER FUNCTION public.award_tokens_for_approved_correction() SECURITY DEFINER;
ALTER FUNCTION public.notify_correction_submission() SECURITY DEFINER;
ALTER FUNCTION public.update_post_corrected_status() SECURITY DEFINER; 