-- Enable RLS on tables
ALTER TABLE idea_listing ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scoring ENABLE ROW LEVEL SECURITY;

-- 1. Policies for 'idea_listing'

-- Allow everyone to view listings (needed for Marketplace)
DROP POLICY IF EXISTS "Public can view listings" ON idea_listing;
CREATE POLICY "Public can view listings" ON idea_listing FOR SELECT TO public USING (true);

-- Allow users to insert their own listings
-- CAST auth.uid() to text to match user_id column type
DROP POLICY IF EXISTS "Users can insert own listings" ON idea_listing;
CREATE POLICY "Users can insert own listings" ON idea_listing FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);

-- Allow users to update their own listings
DROP POLICY IF EXISTS "Users can update own listings" ON idea_listing;
CREATE POLICY "Users can update own listings" ON idea_listing FOR UPDATE TO authenticated USING (auth.uid()::text = user_id);

-- Allow users to delete their own listings
DROP POLICY IF EXISTS "Users can delete own listings" ON idea_listing;
CREATE POLICY "Users can delete own listings" ON idea_listing FOR DELETE TO authenticated USING (auth.uid()::text = user_id);


-- 2. Policies for 'ai_scoring'

-- Allow everyone to view scores
DROP POLICY IF EXISTS "Public can view scores" ON ai_scoring;
CREATE POLICY "Public can view scores" ON ai_scoring FOR SELECT TO public USING (true);

-- Allow authenticated users to insert/update scores (Simplified)
DROP POLICY IF EXISTS "Users can manage scores" ON ai_scoring;
CREATE POLICY "Users can manage scores" ON ai_scoring FOR ALL TO authenticated USING (true);
