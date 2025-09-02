-- Create function for semantic search using vector similarity
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  book_id uuid,
  content text,
  chunk_index int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.id,
    bc.book_id,
    bc.content,
    bc.chunk_index,
    1 - (bc.embedding <=> query_embedding) as similarity
  FROM book_chunks bc
  WHERE bc.embedding IS NOT NULL
    AND 1 - (bc.embedding <=> query_embedding) > match_threshold
  ORDER BY bc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create index for better performance on vector operations
CREATE INDEX IF NOT EXISTS idx_book_chunks_embedding_cosine 
ON book_chunks USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Create function to process books automatically
CREATE OR REPLACE FUNCTION process_uploaded_book()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This trigger will be called when a book is uploaded
  -- In a real implementation, you'd call an external service or webhook
  -- For now, we'll just log the event
  RAISE NOTICE 'Book uploaded: %', NEW.id;
  
  -- Update status to processing
  UPDATE books 
  SET status = 'processing' 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic book processing
CREATE TRIGGER trigger_process_uploaded_book
  AFTER INSERT ON books
  FOR EACH ROW
  EXECUTE FUNCTION process_uploaded_book();
