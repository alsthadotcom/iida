-- SIMPLIFIED STORAGE POLICIES FOR DEBUGGING
-- We will temporarily allow any authenticated user to upload to the bucket to rule out path-matching errors.

-- 1. Ensure Storage Bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('idea-assets', 'idea-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Reset Policies

DROP POLICY IF EXISTS "Users can upload own idea assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own idea assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own idea assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view idea assets" ON storage.objects;

-- Policy: Allow ANY authenticated user to upload files to 'idea-assets'
-- This removes the strict path check for now to fix the mobile upload issue.
CREATE POLICY "Users can upload idea assets" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'idea-assets');

-- Policy: Users can update their own files (keep strict owner check for safety)
CREATE POLICY "Users can update own idea assets" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'idea-assets' AND owner = auth.uid());

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own idea assets" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'idea-assets' AND owner = auth.uid());

-- Policy: Public view
CREATE POLICY "Public can view idea assets" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'idea-assets');
