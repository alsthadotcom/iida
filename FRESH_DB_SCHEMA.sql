-- ==============================================================================
-- FRESH DATABASE SCHEMA SCRIPT
-- This script rebuilds the idea_listing table and related views to match the new
-- "Sell Your Idea" form requirements exactly.
-- ==============================================================================

-- 1. Drop dependent views first to avoid dependency errors
DROP VIEW IF EXISTS idea_detail_page;
DROP VIEW IF EXISTS marketplace;

-- 2. Drop the main table (Cascade will handle FKs in likes/saves/ai_scoring if configured, 
--    but to be safe and clean, we fully recreate structure).
--    Recreating tables with CASCADE DROP ensures a truly fresh start for this table.
-- 3. Drop tables (Cascade will handle FKs, but explicit drops are safer for clean state)
DROP TABLE IF EXISTS "idea_listing" CASCADE;
DROP TABLE IF EXISTS "ai_scoring" CASCADE;

-- 4. Create the new idea_listing table
CREATE TABLE idea_listing (
    idea_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Idea Snapshot
    title TEXT NOT NULL,
    one_line_description TEXT NOT NULL,
    category TEXT NOT NULL, -- "Industry / Category"
    target_customer_type TEXT,
    stage TEXT,

    -- Problem & Urgency
    problem_description TEXT,
    who_faces_problem TEXT,
    pain_level INTEGER, -- 1-5
    urgency_level TEXT,
    current_alternatives TEXT,

    -- Solution & Advantage
    solution_summary TEXT,
    primary_advantage TEXT,
    differentiation_strength INTEGER, -- 1-5

    -- Market Potential
    market_size TEXT,
    market_growth_trend TEXT,
    geographic_scope TEXT,

    -- Revenue Model
    revenue_model_type TEXT,
    expected_price_per_customer TEXT,
    cost_intensity TEXT,

    -- Execution Difficulty
    build_difficulty TEXT,
    time_to_first_version TEXT,
    regulatory_dependency TEXT,

    -- Validation
    validation_level TEXT,
    validation_notes TEXT,

    -- Sale & Rights
    what_is_included TEXT,
    buyer_resale_rights TEXT,
    exclusivity TEXT,
    price NUMERIC NOT NULL,

    -- Documents
    document_url TEXT NOT NULL, -- Primary Prospectus
    additional_doc_1 TEXT,
    additional_doc_2 TEXT,
    additional_doc_3 TEXT
);

-- 4. Enable RLS on new table
ALTER TABLE idea_listing ENABLE ROW LEVEL SECURITY;

-- 5. Policies for idea_listing
-- Everyone can read
CREATE POLICY "Public profiles are viewable by everyone" 
ON idea_listing FOR SELECT 
USING (true);

-- Authenticated users can insert their own
CREATE POLICY "Users can insert their own ideas" 
ON idea_listing FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own
CREATE POLICY "Users can update their own ideas" 
ON idea_listing FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own
CREATE POLICY "Users can delete their own ideas" 
ON idea_listing FOR DELETE 
USING (auth.uid() = user_id);


-- 6. Ensure AI_SCORING exists (Recreated fresh)
CREATE TABLE ai_scoring (
    ai_score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID REFERENCES idea_listing(idea_id) ON DELETE CASCADE,
    uniqueness NUMERIC,
    demand TEXT,
    problem_impact NUMERIC,
    profitability TEXT,
    viability NUMERIC,
    scalability NUMERIC,
    overall_score NUMERIC GENERATED ALWAYS AS (
      (COALESCE(uniqueness, 0) + COALESCE(problem_impact, 0) + COALESCE(viability, 0) + COALESCE(scalability, 0)) / 4
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ai_scoring ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public AI scores" ON ai_scoring FOR SELECT USING (true);
CREATE POLICY "Users can create AI scores" ON ai_scoring FOR INSERT WITH CHECK (true); -- Ideally stricter
CREATE POLICY "Users can update AI scores" ON ai_scoring FOR UPDATE USING (true);


-- 7. Recreate Views

-- Marketplace View: Used for the card grid.
-- We map 'one_line_description' to 'description' for the card view compatibility.
CREATE OR REPLACE VIEW marketplace AS
SELECT 
    i.idea_id as marketplace_id,
    i.idea_id,
    i.title,
    i.one_line_description as description, -- Using brief description for cards
    i.category,
    i.price,
    i.user_id,
    i.created_at,
    i.document_url, -- Used for thumbnails if we generate them, or placeholders
    -- AI Scores
    s.ai_score_id,
    COALESCE(s.overall_score, 0) as overall_score,
    COALESCE(s.uniqueness, 0) as uniqueness,
    COALESCE(s.viability, 0) as viability,
    COALESCE(s.profitability, 'N/A') as profitability,
    
    -- MVP flag (derived from Stage for compatibility, or just hardcoded false if using stage)
    CASE WHEN i.stage = 'MVP built' OR i.stage = 'Revenue generating' THEN true ELSE false END as mvp
    
FROM idea_listing i
LEFT JOIN ai_scoring s ON i.idea_id = s.idea_id;


-- Idea Detail View: Used for the details page.
-- Selects ALL columns.
CREATE OR REPLACE VIEW idea_detail_page AS
SELECT 
    i.*,
    u.username,
    u.profile_picture,
    s.ai_score_id,
    s.overall_score,
    s.uniqueness,
    s.demand,
    s.problem_impact,
    s.profitability,
    s.viability,
    s.scalability,
    
    -- Compat fields if frontend calls them 'description' or 'mvp'
    i.one_line_description as description, -- Or solution_summary? Let's use one_line for "Main" description header if mapped
    CASE WHEN i.stage = 'MVP built' OR i.stage = 'Revenue generating' THEN true ELSE false END as mvp
    
FROM idea_listing i
LEFT JOIN user_info u ON i.user_id::text = u.user_id
LEFT JOIN ai_scoring s ON i.idea_id = s.idea_id;
