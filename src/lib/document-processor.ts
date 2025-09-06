import { supabase } from '@/integrations/supabase/client';
// Temporarily disabled - these libraries don't work in the browser
// import * as pdfParse from 'pdf-parse';
// import * as mammoth from 'mammoth';

export interface ProcessingResult {
  success: boolean;
  chunks: number;
  error?: string;
}

export interface DocumentChunk {
  content: string;
  chunkIndex: number;
  embedding?: number[];
}

export class DocumentProcessor {
  private readonly CHUNK_SIZE = 1000; // characters per chunk
  private readonly CHUNK_OVERLAP = 200; // overlap between chunks

  async processBook(bookId: string, onProgress?: (step: string, progress: number) => void): Promise<ProcessingResult> {
    try {
      console.log(`[DocumentProcessor] Starting processing for book: ${bookId}`);
      onProgress?.('Buscando informações do livro...', 5);
      
      // Get book information
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (bookError || !book) {
        console.error(`[DocumentProcessor] Book not found:`, bookError);
        throw new Error(`Book not found: ${bookError?.message}`);
      }
      
      console.log(`[DocumentProcessor] Book found:`, book.title, book.file_path);
      onProgress?.('Atualizando status para processamento...', 10);

      // Update status to processing
      console.log(`[DocumentProcessor] Updating status to processing`);
      await this.updateBookStatus(bookId, 'processing');

      // Download file from storage
      onProgress?.('Baixando arquivo do storage...', 15);
      console.log(`[DocumentProcessor] Downloading file from storage: ${book.file_path}`);
      const fileContent = await this.downloadFile(book.file_path);
      console.log(`[DocumentProcessor] File downloaded, size: ${fileContent.byteLength} bytes`);

      // Extract text based on file type
      onProgress?.('Extraindo texto do arquivo...', 25);
      console.log(`[DocumentProcessor] Extracting text from ${book.file_type} file`);
      const extractedText = await this.extractText(fileContent, book.file_type);
      console.log(`[DocumentProcessor] Text extracted, length: ${extractedText.length} characters`);

      // Split into chunks
      onProgress?.('Dividindo texto em chunks...', 35);
      console.log(`[DocumentProcessor] Splitting text into chunks`);
      const chunks = this.splitIntoChunks(extractedText);
      console.log(`[DocumentProcessor] Created ${chunks.length} chunks`);

      // Generate embeddings for each chunk using the user's API key
      onProgress?.('Gerando embeddings para busca semântica...', 50);
      console.log(`[DocumentProcessor] Generating embeddings for ${chunks.length} chunks`);
      const chunksWithEmbeddings = await this.generateEmbeddings(chunks, book.uploaded_by, onProgress);
      console.log(`[DocumentProcessor] Generated embeddings for ${chunksWithEmbeddings.length} chunks`);

      // Save chunks to database
      onProgress?.('Salvando chunks no banco de dados...', 90);
      console.log(`[DocumentProcessor] Saving chunks to database`);
      await this.saveChunks(bookId, chunksWithEmbeddings);
      console.log(`[DocumentProcessor] Chunks saved successfully`);

      // Update book status to ready
      onProgress?.('Finalizando processamento...', 95);
      console.log(`[DocumentProcessor] Updating status to ready`);
      await this.updateBookStatus(bookId, 'ready');

      return {
        success: true,
        chunks: chunks.length
      };

    } catch (error: any) {
      console.error('Error processing book:', error);
      
      // Update status to error
      await this.updateBookStatus(bookId, 'error');
      
      return {
        success: false,
        chunks: 0,
        error: error.message
      };
    }
  }

  private async updateBookStatus(bookId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('books')
      .update({ status })
      .eq('id', bookId);

    if (error) {
      console.error('Error updating book status:', error);
    }
  }

  private async downloadFile(filePath: string): Promise<ArrayBuffer> {
    const { data, error } = await supabase.storage
      .from('books')
      .download(filePath);

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }

    return await data.arrayBuffer();
  }

  private async extractText(fileContent: ArrayBuffer, fileType: string): Promise<string> {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return await this.extractFromPDF(fileContent);
      case 'txt':
        return await this.extractFromTXT(fileContent);
      case 'doc':
      case 'docx':
        return await this.extractFromDOC(fileContent);
      default:
        throw new Error(`Unsupported file type: ${fileType}. Only PDF, DOC, DOCX, and TXT are supported.`);
    }
  }

  private async extractFromPDF(fileContent: ArrayBuffer): Promise<string> {
    try {
      // For now, we'll use a simple text extraction approach
      // In a production environment, you'd want to use a proper PDF parser
      const text = new TextDecoder('utf-8').decode(fileContent);
      
      // Basic PDF text extraction (this is simplified)
      // Remove PDF metadata and extract readable text
      const cleanText = text
        .replace(/[^\x20-\x7E\n\r]/g, ' ') // Remove non-printable characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      if (cleanText.length < 50) {
        throw new Error('PDF appears to be empty, corrupted, or contains only images. Please use a PDF with selectable text.');
      }

      return cleanText;
    } catch (error: any) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  private async extractFromTXT(fileContent: ArrayBuffer): Promise<string> {
    const text = new TextDecoder('utf-8').decode(fileContent);
    return text.trim();
  }

  private async extractFromDOC(fileContent: ArrayBuffer): Promise<string> {
    try {
      // For DOC/DOCX files, we'll try to extract text using a simple approach
      // This is a basic implementation - for production, you'd want a proper parser
      const text = new TextDecoder('utf-8').decode(fileContent);
      
      // Basic text extraction for DOC/DOCX (this is simplified)
      const cleanText = text
        .replace(/[^\x20-\x7E\n\r]/g, ' ') // Remove non-printable characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      if (cleanText.length < 50) {
        throw new Error('DOC/DOCX file appears to be empty or corrupted. Please use a file with readable text content.');
      }

      return cleanText;
    } catch (error: any) {
      throw new Error(`Failed to extract text from DOC/DOCX: ${error.message}. Please try converting to TXT format.`);
    }
  }



  private splitIntoChunks(text: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      let endIndex = startIndex + this.CHUNK_SIZE;
      
      // Try to break at sentence boundary
      if (endIndex < text.length) {
        const lastPeriod = text.lastIndexOf('.', endIndex);
        const lastNewline = text.lastIndexOf('\n', endIndex);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > startIndex + this.CHUNK_SIZE * 0.5) {
          endIndex = breakPoint + 1;
        }
      }

      const chunkText = text.slice(startIndex, endIndex).trim();
      
      if (chunkText.length > 0) {
        chunks.push({
          content: chunkText,
          chunkIndex: chunkIndex++
        });
      }

      // Move start index with overlap
      startIndex = endIndex - this.CHUNK_OVERLAP;
    }

    return chunks;
  }

  private async generateEmbeddings(chunks: DocumentChunk[], userId: string, onProgress?: (step: string, progress: number) => void): Promise<DocumentChunk[]> {
    // Get user's OpenAI API key from settings
    const { data: userSettings, error } = await supabase
      .from('user_settings')
      .select('openai_api_key')
      .eq('user_id', userId)
      .single();

    if (error || !userSettings?.openai_api_key) {
      console.warn('No OpenAI API key found for user, skipping embeddings generation');
      return chunks;
    }

    const chunksWithEmbeddings: DocumentChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const embedding = await this.generateEmbedding(chunk.content, userSettings.openai_api_key);
        chunksWithEmbeddings.push({
          ...chunk,
          embedding
        });
        
        // Update progress for embeddings generation
        const progress = 50 + ((i + 1) / chunks.length) * 35; // 50-85% range
        onProgress?.(`Gerando embedding ${i + 1}/${chunks.length}...`, progress);
      } catch (error) {
        console.error('Error generating embedding for chunk:', error);
        // Continue without embedding
        chunksWithEmbeddings.push(chunk);
      }
    }

    return chunksWithEmbeddings;
  }

  private async generateEmbedding(text: string, apiKey: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  private async saveChunks(bookId: string, chunks: DocumentChunk[]): Promise<void> {
    const chunksToInsert = chunks.map(chunk => ({
      book_id: bookId,
      content: chunk.content,
      chunk_index: chunk.chunkIndex,
      embedding: chunk.embedding ? `[${chunk.embedding.join(',')}]` : null
    }));

    const { error } = await supabase
      .from('book_chunks')
      .insert(chunksToInsert);

    if (error) {
      throw new Error(`Failed to save chunks: ${error.message}`);
    }
  }

  async searchSimilarContent(query: string, userId: string, limit: number = 5): Promise<DocumentChunk[]> {
    // Get user's OpenAI API key from settings
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('openai_api_key')
      .eq('user_id', userId)
      .single();

    if (settingsError || !userSettings?.openai_api_key) {
      console.warn('No OpenAI API key found for user, returning empty results');
      return [];
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query, userSettings.openai_api_key);

      // Search for similar chunks using vector similarity
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: 0.7,
        match_count: limit
      });

      if (error) {
        console.error('Error searching similar content:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Error in searchSimilarContent:', error);
      return [];
    }
  }
}

// Singleton instance
export const documentProcessor = new DocumentProcessor();
