
-- Create shares table
CREATE TABLE IF NOT EXISTS public.shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id), -- Nullable for anonymous shares
    idea_id TEXT NOT NULL, -- Assuming idea_id is TEXT like 'IDEA_...'
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for counting
CREATE INDEX IF NOT EXISTS shares_idea_id_idx ON public.shares(idea_id);

-- RLS
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- 1. Everyone can read shares (to count them)
CREATE POLICY "Everyone can read shares"
    ON public.shares FOR SELECT
    USING (true);

-- 2. Everyone can insert a share (public action)
CREATE POLICY "Everyone can insert shares"
    ON public.shares FOR INSERT
    WITH CHECK (true);
