-- Update the marketplace view to include market_saturation and capital_intensity
-- This view is used by the Marketplace page

DROP VIEW IF EXISTS marketplace CASCADE;

CREATE OR REPLACE VIEW marketplace AS
SELECT 
    gen_random_uuid() AS marketplace_id,
    i.idea_id,
    ai.ai_score_id,
    i.title,
    COALESCE(i.one_line_description, '') AS description,
    
    -- AI Metrics for card display
    ai.uniqueness,
    ai.product_market_fit AS viability,
    'TBD' AS profitability,
    ai.market_saturation,
    ai.capital_intensity,
    
    i.category,
    i.secondary_category,
    CASE 
        WHEN i.mvp_type IS NOT NULL THEN true 
        ELSE false 
    END AS mvp,
    i.document_url,
    i.price,
    u.username,
    i.created_at,
    
    -- Calculate overall_score as average of all 10 metrics
    ROUND(
        (ai.uniqueness + ai.customer_pain + ai.scalability + ai.product_market_fit + 
         ai.technical_complexity + ai.capital_intensity + ai.market_saturation + 
         ai.business_model_robustness + ai.market_growth_rate + ai.social_value) / 10.0, 
        2
    ) AS overall_score
    
FROM idea_listings i
JOIN ai_scoring ai ON i.idea_id = ai.idea_id
JOIN user_info u ON i.user_id = u.user_id
ORDER BY i.created_at DESC;
