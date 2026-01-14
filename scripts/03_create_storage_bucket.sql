-- Migration: Create storage bucket for assets
-- Date: 2025-01-21
-- Description: Creates the espelho-assets bucket and configures proper RLS policies

-- ============================================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================================

-- Insert bucket into storage.buckets if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'espelho-assets',
  'espelho-assets',
  true, -- Public bucket for easy access to uploaded assets
  52428800, -- 50MB file size limit
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. CREATE RLS POLICIES FOR STORAGE
-- ============================================================================

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'espelho-assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'espelho-assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'espelho-assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'espelho-assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Public read access (since bucket is public)
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'espelho-assets');

-- ============================================================================
-- 3. GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant authenticated users access to storage schema
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- To verify the bucket was created, run:
-- SELECT * FROM storage.buckets WHERE id = 'espelho-assets';
