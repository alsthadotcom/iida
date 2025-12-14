-- Add new columns to idea_listing table for the new Sell Idea form fields

ALTER TABLE idea_listing
ADD COLUMN one_line_description TEXT,
ADD COLUMN target_customer_type TEXT,
ADD COLUMN stage TEXT,
ADD COLUMN problem_description TEXT,
ADD COLUMN who_faces_problem TEXT,
ADD COLUMN pain_level INTEGER,
ADD COLUMN urgency_level TEXT,
ADD COLUMN current_alternatives TEXT,
ADD COLUMN solution_summary TEXT,
ADD COLUMN primary_advantage TEXT,
ADD COLUMN differentiation_strength INTEGER,
ADD COLUMN market_size TEXT,
ADD COLUMN market_growth_trend TEXT,
ADD COLUMN geographic_scope TEXT,
ADD COLUMN revenue_model_type TEXT,
ADD COLUMN expected_price_per_customer TEXT,
ADD COLUMN cost_intensity TEXT,
ADD COLUMN build_difficulty TEXT,
ADD COLUMN time_to_first_version TEXT,
ADD COLUMN regulatory_dependency TEXT,
ADD COLUMN validation_level TEXT,
ADD COLUMN validation_notes TEXT,
ADD COLUMN what_is_included TEXT,
ADD COLUMN buyer_resale_rights TEXT,
ADD COLUMN exclusivity TEXT;

-- Update the view logic if necessary (idea_detail_view likely needs these too)
-- Since generic 'SELECT *' is often used in views, we might need to recreate them if they are not auto-updating.
-- Supabase views usually need recreation if schema changes underneath if they are not simple views.
-- However, for now, let's just ensure the table has columns.

-- If you have a view named 'idea_detail_page' or similar, you might need to recreate it.
-- Assuming standard usage, we just alter the table.
