-- ============================================================================
-- FIX: Force public access for company-logos bucket
-- ============================================================================

-- 1. Ensure bucket is public (force update)
UPDATE storage.buckets
SET public = true
WHERE id = 'company-logos';

-- 2. Drop existing read policy to avoid conflicts
DROP POLICY IF EXISTS "Public can view company logos" ON storage.objects;

-- 3. Re-create the public read policy with a simpler condition
CREATE POLICY "Public can view company logos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'company-logos' );

-- 4. Grant usage on schema storage to anon and authenticated (just in case)
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT SELECT ON storage.objects TO anon, authenticated;
