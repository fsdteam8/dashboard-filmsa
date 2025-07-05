// Upload utility functions for chunked file uploads

export interface UploadConfig {
  chunkSize: number;
  maxRetries: number;
  retryDelay: number;
  allowedTypes: string[];
}

export interface ChunkUploadResult {
  success: boolean;
  fileId?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
}

export interface UploadProgress {
  currentChunk: number;
  totalChunks: number;
  percentage: number;
  bytesUploaded: number;
  totalBytes: number;
}

export const DEFAULT_CONFIG: UploadConfig = {
  chunkSize: 5 * 1024 * 1024, // 5MB
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  allowedTypes: [
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/wmv",
    "video/flv",
    "video/webm",
    "video/mkv",
  ],
};

export function validateFile(
  file: File,
  config: UploadConfig = DEFAULT_CONFIG
): { valid: boolean; error?: string } {
  if (!config.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${
        file.type
      }. Allowed types: ${config.allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
}

export function generateFileId(fileName: string): string {
  const cleanName = fileName.replace(/[^a-zA-Z0-9]/g, "_");
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${cleanName}-${timestamp}-${random}`;
}

export function calculateProgress(
  currentChunk: number,
  totalChunks: number
): number {
  return Math.round((currentChunk / totalChunks) * 100);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
