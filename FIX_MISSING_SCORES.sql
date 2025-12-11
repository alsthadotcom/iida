-- Backfill missing AI Scores for existing listings
-- Corrected: 'overall_score' is generated automatically by the database, so we do not insert it.

INSERT INTO ai_scoring (
    idea_id,
    uniqueness,
    demand,
    problem_impact,
    profitability,
    viability,
    scalability
)
SELECT 
    il.idea_id,
    75, -- Default Uniqueness
    'Mid-High', -- Default Demand
    80, -- Default Impact
    'Estimated $10k-$50k/yr revenue', -- Default Profitability
    75, -- Default Viability
    75  -- Default Scalability
FROM idea_listing il
WHERE NOT EXISTS (
    SELECT 1 FROM ai_scoring ais WHERE ais.idea_id = il.idea_id
);
