-- STORAGE BUCKET FIX: Create and configure the books bucket properly
-- Execute this in Supabase SQL Editor

-- First, let's check if the bucket exists and create it if needed
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'books',
  'books',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/epub+zip']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for the books bucket
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can upload their own books" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own books" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own books" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all books" ON storage.objects;

-- Users can upload files to their own folder
CREATE POLICY "Users can upload their own books" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'books' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own files
CREATE POLICY "Users can view their own books" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'books' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own files
CREATE POLICY "Users can delete their own books" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'books' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can manage all files
CREATE POLICY "Admins can manage all books" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'books' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Success message
SELECT 'Storage bucket and policies configured successfully!' as message;
