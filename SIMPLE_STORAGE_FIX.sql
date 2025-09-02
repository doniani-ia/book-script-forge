-- SIMPLE STORAGE FIX: Create books bucket with simple policies
-- Execute this in Supabase SQL Editor

-- Create the books bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'books',
  'books',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/epub+zip']
)
ON CONFLICT (id) DO NOTHING;

-- Drop all existing policies for storage.objects
DROP POLICY IF EXISTS "Users can upload their own books" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own books" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own books" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all books" ON storage.objects;
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON storage.objects;

-- Simple policies: Allow all authenticated users to manage books bucket
CREATE POLICY "Enable read access for all users" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'books');

CREATE POLICY "Enable insert for authenticated users only" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'books' AND auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'books' AND auth.role() = 'authenticated');

CREATE POLICY "Enable delete for users based on user_id" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'books' AND auth.role() = 'authenticated');

-- Success message
SELECT 'Storage bucket configured with simple policies!' as message;
