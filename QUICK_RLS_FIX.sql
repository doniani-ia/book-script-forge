-- QUICK FIX: RLS Policies for Books Table
-- Execute this in Supabase SQL Editor

-- First, drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage books" ON public.books;
DROP POLICY IF EXISTS "Users can insert their own books" ON public.books;
DROP POLICY IF EXISTS "Users can view their own books" ON public.books;
DROP POLICY IF EXISTS "Users can update their own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete their own books" ON public.books;
DROP POLICY IF EXISTS "Admins can view all books" ON public.books;
DROP POLICY IF EXISTS "Admins can update all books" ON public.books;
DROP POLICY IF EXISTS "Admins can delete all books" ON public.books;

-- Create policies for users to manage their own books
CREATE POLICY "Users can insert their own books" 
ON public.books 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can view their own books" 
ON public.books 
FOR SELECT 
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own books" 
ON public.books 
FOR UPDATE 
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own books" 
ON public.books 
FOR DELETE 
USING (auth.uid() = uploaded_by);

-- Create policies for admins to manage all books
CREATE POLICY "Admins can view all books" 
ON public.books 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all books" 
ON public.books 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete all books" 
ON public.books 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Also fix book_chunks policies
DROP POLICY IF EXISTS "Admins can access book chunks" ON public.book_chunks;
DROP POLICY IF EXISTS "Users can view chunks from their own books" ON public.book_chunks;
DROP POLICY IF EXISTS "Users can insert chunks for their own books" ON public.book_chunks;
DROP POLICY IF EXISTS "Users can update chunks for their own books" ON public.book_chunks;
DROP POLICY IF EXISTS "Users can delete chunks for their own books" ON public.book_chunks;
DROP POLICY IF EXISTS "Admins can access all chunks" ON public.book_chunks;

-- Users can view chunks from their own books
CREATE POLICY "Users can view chunks from their own books" 
ON public.book_chunks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.books 
    WHERE id = book_chunks.book_id AND uploaded_by = auth.uid()
  )
);

-- Users can insert chunks for their own books
CREATE POLICY "Users can insert chunks for their own books" 
ON public.book_chunks 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.books 
    WHERE id = book_chunks.book_id AND uploaded_by = auth.uid()
  )
);

-- Users can update chunks for their own books
CREATE POLICY "Users can update chunks for their own books" 
ON public.book_chunks 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.books 
    WHERE id = book_chunks.book_id AND uploaded_by = auth.uid()
  )
);

-- Users can delete chunks for their own books
CREATE POLICY "Users can delete chunks for their own books" 
ON public.book_chunks 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.books 
    WHERE id = book_chunks.book_id AND uploaded_by = auth.uid()
  )
);

-- Admins can access all chunks
CREATE POLICY "Admins can access all chunks" 
ON public.book_chunks 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Success message
SELECT 'RLS policies updated successfully!' as message;
