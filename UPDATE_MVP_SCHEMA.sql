-- ==============================================================================
-- ADD MVP FIELDS TO IDEA LISTING
-- ==============================================================================

-- 1. Add Columns to idea_listing
ALTER TABLE idea_listing 
ADD COLUMN IF NOT EXISTS mvp_type TEXT,        -- 'digital' or 'physical'
ADD COLUMN IF NOT EXISTS mvp_url TEXT,         -- For Digital
ADD COLUMN IF NOT EXISTS mvp_image_url TEXT,   -- For Physical
ADD COLUMN IF NOT EXISTS mvp_video_url TEXT;   -- For Physical

-- 2. Update Views to include these fields

-- Update idea_detail_page View
DROP VIEW IF EXISTS idea_detail_page;
CREATE OR REPLACE VIEW idea_detail_page AS
SELECT 
    i.idea_id,
    i.user_id,
    i.title,
    i.one_line_description,
    i.category,
    i.secondary_category,
    i.pain_who,
    i.pain_problem,
    i.pain_frequency,
    i.solution_current,
    i.solution_insufficient,
    i.solution_risks,
    i.exec_steps,
    i.exec_skills,
    i.exec_risks,
    i.growth_acquisition,
    i.growth_drivers,
    i.growth_expansion,
    i.sol_what,
    i.sol_how,
    i.sol_why_better,
    i.rev_who_pays,
    i.rev_flow,
    i.rev_retention,
    i.impact_who,
    i.impact_improvement,
    i.impact_scale,
    i.price,
    i.document_url,
    i.additional_doc_1,
    i.additional_doc_2,
    i.additional_doc_3,
    
    -- MVP Fields
    CASE WHEN i.mvp_url IS NOT NULL OR i.mvp_image_url IS NOT NULL THEN true ELSE false END as mvp,
    i.mvp_type,
    i.mvp_url,
    i.mvp_image_url,
    i.mvp_video_url,

    i.created_at,
    i.updated_at,
    
    i.one_line_description as description, -- Mapped alias

    u.username,
    u.full_name,
    u.avatar_url,
    u.profile_picture,

    s.ai_score_id,
    s.overall_score,
    s.uniqueness,
    s.customer_pain,
    s.scalability,
    s.product_market_fit,
    s.technical_complexity,
    s.capital_intensity,
    s.market_saturation,
    s.business_model_robustness,
    s.market_growth_rate,
    s.social_value

FROM idea_listing i
LEFT JOIN user_info u ON i.user_id = u.user_id
LEFT JOIN ai_scoring s ON i.idea_id = s.idea_id;

-- Update Marketplace View
DROP VIEW IF EXISTS marketplace;
CREATE OR REPLACE VIEW marketplace AS
SELECT 
    i.idea_id as marketplace_id,
    i.idea_id,
    i.title,
    i.one_line_description as description, 
    i.category,
    i.secondary_category, 
    i.price,
    i.user_id,
    u.username,
    u.avatar_url, 
    u.profile_picture,
    i.created_at,
    i.document_url, 
    
    -- MVP Status (Calculated)
    CASE WHEN i.mvp_url IS NOT NULL OR i.mvp_image_url IS NOT NULL THEN true ELSE false END as mvp,
    
    s.ai_score_id,
    COALESCE(s.overall_score, 0) as overall_score,
    COALESCE(s.uniqueness, 0) as uniqueness,
    COALESCE(s.product_market_fit, 0) as viability, 
    'Analysis Completed' as profitability
    
FROM idea_listing i
LEFT JOIN ai_scoring s ON i.idea_id = s.idea_id
LEFT JOIN user_info u ON i.user_id = u.user_id;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
