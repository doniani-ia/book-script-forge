/**
 * Sanitizes a filename to be compatible with Supabase Storage
 * @param filename - The original filename
 * @returns Sanitized filename safe for storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    // Remove or replace problematic characters
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .toLowerCase() // Convert to lowercase for consistency
    .substring(0, 255); // Limit length to prevent issues
}

/**
 * Generates a unique filename with timestamp
 * @param originalFilename - The original filename
 * @returns Unique filename with timestamp
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(originalFilename);
  return `${timestamp}-${sanitized}`;
}

/**
 * Validates if a file type is allowed
 * @param filename - The filename to check
 * @returns True if file type is allowed
 */
export function isAllowedFileType(filename: string): boolean {
  const allowedExtensions = ['.pdf', '.txt', '.doc', '.docx'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return allowedExtensions.includes(extension);
}

/**
 * Gets file extension from filename
 * @param filename - The filename
 * @returns File extension without dot
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || 'unknown';
}
