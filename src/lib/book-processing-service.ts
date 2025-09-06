import { documentProcessor } from './document-processor';
import { supabase } from '@/integrations/supabase/client';

export class BookProcessingService {
  private processingQueue: Set<string> = new Set();

  async processBook(bookId: string, onProgress?: (step: string, progress: number) => void): Promise<void> {
    // Prevent duplicate processing
    if (this.processingQueue.has(bookId)) {
      console.log(`Book ${bookId} is already being processed`);
      return;
    }

    this.processingQueue.add(bookId);

    try {
      console.log(`Starting processing for book ${bookId}`);
      onProgress?.('Iniciando processamento...', 0);
      
      const result = await documentProcessor.processBook(bookId, onProgress);
      
      if (result.success) {
        console.log(`Successfully processed book ${bookId} with ${result.chunks} chunks`);
        onProgress?.('Processamento concluído!', 100);
      } else {
        console.error(`Failed to process book ${bookId}: ${result.error}`);
        onProgress?.('Erro no processamento', 0);
      }
    } catch (error) {
      console.error(`Error processing book ${bookId}:`, error);
      onProgress?.('Erro no processamento', 0);
    } finally {
      this.processingQueue.delete(bookId);
    }
  }

  async processPendingBooks(): Promise<void> {
    try {
      // Find books that are in processing status but might be stuck
      const { data: pendingBooks, error } = await supabase
        .from('books')
        .select('id, status, created_at')
        .eq('status', 'processing')
        .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // 5 minutes ago

      if (error) {
        console.error('Error fetching pending books:', error);
        return;
      }

      for (const book of pendingBooks || []) {
        console.log(`Processing pending book: ${book.id}`);
        await this.processBook(book.id);
      }
    } catch (error) {
      console.error('Error in processPendingBooks:', error);
    }
  }

  async searchRelevantContent(query: string, userId: string, limit: number = 5): Promise<any[]> {
    try {
      const chunks = await documentProcessor.searchSimilarContent(query, userId, limit);
      
      // Get book information for each chunk
      const chunksWithBookInfo = await Promise.all(
        chunks.map(async (chunk) => {
          const { data: book } = await supabase
            .from('books')
            .select('title, author')
            .eq('id', chunk.book_id)
            .single();

          return {
            ...chunk,
            book_title: book?.title,
            book_author: book?.author
          };
        })
      );

      return chunksWithBookInfo;
    } catch (error) {
      console.error('Error searching relevant content:', error);
      return [];
    }
  }

  async deleteBook(bookId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[BookProcessingService] Starting deletion for book: ${bookId}`);

      // Get book information
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('file_path')
        .eq('id', bookId)
        .single();

      if (bookError || !book) {
        throw new Error(`Book not found: ${bookError?.message}`);
      }

      console.log(`[BookProcessingService] Book found, file path: ${book.file_path}`);

      // Delete chunks from vector database
      console.log(`[BookProcessingService] Deleting chunks from vector database`);
      const { error: chunksError } = await supabase
        .from('book_chunks')
        .delete()
        .eq('book_id', bookId);

      if (chunksError) {
        console.error(`[BookProcessingService] Error deleting chunks:`, chunksError);
        // Continue anyway
      } else {
        console.log(`[BookProcessingService] Chunks deleted successfully`);
      }

      // Delete the book record from database
      console.log(`[BookProcessingService] Deleting book record from database`);
      const { error: bookDeleteError } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (bookDeleteError) {
        throw new Error(`Failed to delete book record: ${bookDeleteError.message}`);
      }

      console.log(`[BookProcessingService] Book record deleted successfully`);

      // Delete the file from storage bucket
      console.log(`[BookProcessingService] Deleting file from storage bucket: ${book.file_path}`);
      const { error: storageError } = await supabase.storage
        .from('books')
        .remove([book.file_path]);

      if (storageError) {
        console.error(`[BookProcessingService] Error deleting file from storage:`, storageError);
        return {
          success: false,
          error: `Database cleanup successful, but storage deletion failed: ${storageError.message}`
        };
      }

      console.log(`[BookProcessingService] File deleted from storage successfully`);
      return { success: true };

    } catch (error: any) {
      console.error(`[BookProcessingService] Error in delete process:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
export const bookProcessingService = new BookProcessingService();
