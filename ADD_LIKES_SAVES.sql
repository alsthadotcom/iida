-- ============================================
-- LIKES AND SAVES TABLES
-- ============================================

-- 1. Create 'likes' table
CREATE TABLE IF NOT EXISTS likes (
    like_id TEXT PRIMARY KEY DEFAULT ('LIKE_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    user_id TEXT NOT NULL REFERENCES user_info(user_id) ON DELETE CASCADE,
    idea_id TEXT NOT NULL REFERENCES idea_listing(idea_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, idea_id) -- Prevent duplicate likes from same user
);

-- 2. Create 'saves' table
CREATE TABLE IF NOT EXISTS saves (
    save_id TEXT PRIMARY KEY DEFAULT ('SAVE_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    user_id TEXT NOT NULL REFERENCES user_info(user_id) ON DELETE CASCADE,
    idea_id TEXT NOT NULL REFERENCES idea_listing(idea_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, idea_id) -- Prevent duplicate saves from same user
);

-- 3. Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

-- 4. Policies for 'likes'

-- Everyone can view likes (to count total)
DROP POLICY IF EXISTS "Public can view likes" ON likes;
CREATE POLICY "Public can view likes" ON likes FOR SELECT TO public USING (true);

-- Users can insert their own like
DROP POLICY IF EXISTS "Users can like ideas" ON likes;
CREATE POLICY "Users can like ideas" ON likes FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own like (unlike)
DROP POLICY IF EXISTS "Users can unlike ideas" ON likes;
CREATE POLICY "Users can unlike ideas" ON likes FOR DELETE TO authenticated USING (auth.uid()::text = user_id);

-- 5. Policies for 'saves'

-- Users can ONLY view their own saves (privacy requirement)
DROP POLICY IF EXISTS "Users can view own saves" ON saves;
CREATE POLICY "Users can view own saves" ON saves FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- Users can insert their own save
DROP POLICY IF EXISTS "Users can save ideas" ON saves;
CREATE POLICY "Users can save ideas" ON saves FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own save
DROP POLICY IF EXISTS "Users can unsave ideas" ON saves;
CREATE POLICY "Users can unsave ideas" ON saves FOR DELETE TO authenticated USING (auth.uid()::text = user_id);
