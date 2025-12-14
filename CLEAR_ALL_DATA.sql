-- =====================================================================
-- ⚠️ DANGER: THIS SCRIPT DELETES ALL DATA FROM YOUR TABLES ⚠️
-- =====================================================================
-- Run this script in your Supabase SQL Editor to clear all data.
-- Your table structure (columns, types) will remain intact.

-- We use CASCADE to ensuring that deleting a user also deletes their
-- associated ideas and scores, avoiding foreign key constraint errors.

TRUNCATE TABLE ai_scoring, idea_listing, user_info CASCADE;

-- Note: This deletes all user profiles in 'user_info', but it DOES NOT
-- delete the actual authentication accounts in Supabase's 'auth.users'.
-- You might want to also delete users from the Authentication > Users 
-- section in your Supabase Dashboard to keep things in sync.
