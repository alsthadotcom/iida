-- FIX DUPLICATE SCORES & ENFORCE UNIQUENESS

-- 1. Remove duplicate ai_scoring entries, keeping the most recent one for each idea_id
DELETE FROM ai_scoring a
USING ai_scoring b
WHERE a.idea_id = b.idea_id 
  AND a.created_at < b.created_at; -- Delete older ones

-- 2. Add Unique Constraint to prevent future duplicates
ALTER TABLE ai_scoring 
ADD CONSTRAINT ai_scoring_idea_id_key UNIQUE (idea_id);

-- 3. Just in case, verified views don't need changes as they will now return 1 row per idea.
