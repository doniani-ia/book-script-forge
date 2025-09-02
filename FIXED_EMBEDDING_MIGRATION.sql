-- FIXED EMBEDDING MIGRATION: Fix embedding dimensions to match text-embedding-3-small model (1536 dimensions)
-- Execute this in Supabase SQL Editor

-- Drop the existing index
DROP INDEX IF EXISTS idx_book_chunks_embedding;

-- Alter the embedding column to use the correct dimensions
ALTER TABLE public.book_chunks 
ALTER COLUMN embedding TYPE vector(1536);

-- Recreate the index with the correct dimensions
CREATE INDEX idx_book_chunks_embedding ON public.book_chunks 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Drop all existing variations of the match_documents function
DROP FUNCTION IF EXISTS match_documents(vector, double precision, integer);
DROP FUNCTION IF EXISTS match_documents(vector, float, int);
DROP FUNCTION IF EXISTS match_documents(vector, double precision, int);
DROP FUNCTION IF EXISTS match_documents(vector, float, integer);
DROP FUNCTION IF EXISTS public.match_documents(vector, double precision, integer);
DROP FUNCTION IF EXISTS public.match_documents(vector, float, int);
DROP FUNCTION IF EXISTS public.match_documents(vector, double precision, int);
DROP FUNCTION IF EXISTS public.match_documents(vector, float, integer);

-- Create the match_documents function with the correct dimensions
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    book_chunks.id,
    book_chunks.content,
    1 - (book_chunks.embedding <=> query_embedding) AS similarity
  FROM book_chunks
  WHERE 1 - (book_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY book_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Success message
SELECT 'Embedding dimensions fixed to 1536 for text-embedding-3-small model!' as message;
