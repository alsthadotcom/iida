-- ==============================================================================
-- FRESH DATABASE SCHEMA SCRIPT (V4)
-- This script rebuilds the idea_listing table and related views to match the 
-- Granular 7-Section Analysis requirements exactly.
-- ==============================================================================

-- 1. Drop dependent views first to avoid dependency errors
DROP VIEW IF EXISTS idea_detail_page;
DROP VIEW IF EXISTS marketplace;

-- 2. Drop the main tables (Cascade will handle FKs)
DROP TABLE IF EXISTS "idea_listing" CASCADE;
DROP TABLE IF EXISTS "ai_scoring" CASCADE;

-- 3. Create the new idea_listing table
CREATE TABLE idea_listing (
    idea_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Page 1: Idea Info
    title TEXT NOT NULL,
    one_line_description TEXT NOT NULL,
    category TEXT NOT NULL, 
    secondary_category TEXT,

    -- Page 2: Customer Pain
    pain_who TEXT,
    pain_problem TEXT[],
    pain_frequency TEXT,

    -- Page 3: Current Solutions
    solution_current TEXT[],
    solution_insufficient TEXT[],
    solution_risks TEXT,

    -- Page 4: Execution Steps
    exec_steps TEXT[],
    exec_skills TEXT[],
    exec_risks TEXT,

    -- Page 5: Growth Plan
    growth_acquisition TEXT[],
    growth_drivers TEXT,
    growth_expansion TEXT[],

    -- Page 6: Solution Details
    sol_what TEXT,
    sol_how TEXT,
    sol_why_better TEXT,

    -- Page 7: Revenue Plan
    rev_who_pays TEXT,
    rev_flow TEXT,
    rev_retention TEXT,

    -- Page 8: Impact
    impact_who TEXT,
    impact_improvement TEXT,
    impact_scale TEXT,

    -- Documents & Price
    price NUMERIC NOT NULL,
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT ai_scoring_idea_id_key UNIQUE (idea_id)
);
ALTER TABLE ai_scoring ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public AI scores" ON ai_scoring FOR SELECT USING (true);
CREATE POLICY "Users can create AI scores" ON ai_scoring FOR INSERT WITH CHECK (true); -- Ideally stricter
CREATE POLICY "Users can update AI scores" ON ai_scoring FOR UPDATE USING (true);


-- 7. Recreate Views

-- Marketplace View
CREATE OR REPLACE VIEW marketplace AS
SELECT 
    i.idea_id as marketplace_id,
    i.idea_id,
    i.title,
    i.one_line_description as description, 
    i.category,
    i.secondary_category, -- Added
    i.price,
    i.user_id,
    u.username,
    i.created_at,
    i.document_url, 
    -- AI Scores
    s.ai_score_id,
    COALESCE(s.overall_score, 0) as overall_score,
    COALESCE(s.uniqueness, 0) as uniqueness,
    COALESCE(s.viability, 0) as viability,
    COALESCE(s.profitability, 'N/A') as profitability,
    false as mvp
    
FROM idea_listing i
LEFT JOIN ai_scoring s ON i.idea_id = s.idea_id
LEFT JOIN user_info u ON i.user_id::text = u.user_id::text;


-- Idea Detail View
CREATE OR REPLACE VIEW idea_detail_page AS
SELECT 
    i.idea_id,
    i.user_id,
    i.created_at,
    i.updated_at,
    -- Core Info
    i.title,
    i.one_line_description,
    i.category,
    i.secondary_category,
    i.price,
    i.document_url,
    i.additional_doc_1, i.additional_doc_2, i.additional_doc_3,
    
    -- Granular Fields
    i.pain_who, i.pain_problem, i.pain_frequency,
    i.solution_current, i.solution_insufficient, i.solution_risks,
    i.exec_steps, i.exec_skills, i.exec_risks,
    i.growth_acquisition, i.growth_drivers, i.growth_expansion,
    i.sol_what, i.sol_how, i.sol_why_better,
    i.rev_who_pays, i.rev_flow, i.rev_retention,
    i.impact_who, i.impact_improvement, i.impact_scale,

    u.username,
    u.profile_picture,
    s.ai_score_id,
    s.overall_score, s.uniqueness, s.demand, s.problem_impact, s.profitability, s.viability, s.scalability,
    
    i.one_line_description as description,
    false as mvp
    
FROM idea_listing i
LEFT JOIN user_info u ON i.user_id::text = u.user_id::text
LEFT JOIN ai_scoring s ON i.idea_id = s.idea_id;
