-- Update the Marketplace View to use LEFT JOINs
-- This ensures that listings appear even if scoring data is missing or user data is incomplete.

DROP VIEW IF EXISTS marketplace;

CREATE VIEW marketplace AS
SELECT
    ('MKT_' || substr(md5(il.idea_id), 1, 16)) AS marketplace_id,
    il.idea_id,
    COALESCE(ai.ai_score_id, 'pending') as ai_score_id,
    il.title,
    il.description,
    COALESCE(ai.uniqueness, 0) as uniqueness,
    COALESCE(ai.viability, 0) as viability,
    COALESCE(ai.profitability, 'N/A') as profitability,
    il.price,
    il.category,
    il.mvp,
    il.document_url,
    COALESCE(ui.username, 'Anonymous') as username,
    il.created_at,
    COALESCE(ai.overall_score, 0) as overall_score
FROM idea_listing il
LEFT JOIN ai_scoring ai ON il.idea_id = ai.idea_id
LEFT JOIN user_info ui ON il.user_id = ui.user_id
ORDER BY il.created_at DESC;
