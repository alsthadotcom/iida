-- Update the 'idea_detail_page' view to use LEFT JOINs
-- This ensures that the details page works even if the AI score or user profile is missing.

DROP VIEW IF EXISTS idea_detail_page;

CREATE VIEW idea_detail_page AS
SELECT 
    ('DTL_' || substr(md5(il.idea_id), 1, 16)) AS idea_detail_id,
    il.idea_id,
    COALESCE(ai.ai_score_id, 'pending') as ai_score_id,
    il.title,
    il.description,
    COALESCE(ai.uniqueness, 0) as uniqueness,
    COALESCE(ai.demand, 'Mid') as demand,
    COALESCE(ai.problem_impact, 0) as problem_impact,
    -- For profitability, if missing, provide a safe fallback string
    COALESCE(ai.profitability, 'Analysis pending...') as profitability,
    COALESCE(ai.viability, 0) as viability,
    COALESCE(ai.scalability, 0) as scalability,
    COALESCE(ai.overall_score, 0) as overall_score,
    il.price,
    COALESCE(ui.username, 'Anonymous') as username,
    il.mvp,
    il.mvp_type,
    il.digital_mvp,
    il.physical_mvp_image,
    il.physical_mvp_video,
    il.document_url,
    il.additional_doc_1,
    il.additional_doc_2,
    il.additional_doc_3,
    il.category,
    il.created_at,
    il.updated_at
FROM idea_listing il
LEFT JOIN ai_scoring ai ON il.idea_id = ai.idea_id
LEFT JOIN user_info ui ON il.user_id = ui.user_id;
