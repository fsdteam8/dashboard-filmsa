// Upload utility functions for S3 multipart uploads

export interface UploadConfig {
  chunkSize: number;
  maxRetries: number;
  retryDelay: number;
  allowedTypes: string[];
  presignedUrlExpiry: number;
}

export interface ChunkUploadResult {
  success: boolean;
  fileId?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
  s3Url?: string; // Direct S3 URL
  s3Key?: string;
  contentType?: string;
  uploadId?: string;
  method?: string;
}

export interface UploadProgress {
  currentChunk: number;
  totalChunks: number;
  percentage: number;
  bytesUploaded: number;
  totalBytes: number;
}

export interface MultipartUploadInit {
  success: boolean;
  uploadId: string;
  fileId: string;
  s3Key: string;
  fileName: string;
  originalName: string;
  contentType: string;
  totalChunks: number;
  message?: string;
  error?: string;
}

export interface PartUploadResult {
  success: boolean;
  partNumber: number;
  ETag: string;
  error?: string;
}

export const DEFAULT_CONFIG: UploadConfig = {
  chunkSize: 10 * 1024 * 1024, // 10MB chunks (minimum for S3 multipart except last part)
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  allowedTypes: [
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/quicktime", // .mov files
    "video/wmv",
    "video/x-ms-wmv", // Windows Media Video
    "video/flv",
    "video/x-flv", // Flash Video
    "video/webm",
    "video/mkv",
    "video/x-matroska", // .mkv files
    "video/3gp",
    "video/mp2t", // .ts files
    "video/mpeg",
    "video/mpg",
    "video/mpe",
    "video/m4v",
    "video/asf",
    "video/vob",
    "video/ogv",
    "video/ogg",
  ],
  presignedUrlExpiry: 3600, // 1 hour
};

export function validateFile(
  file: File,
  config: UploadConfig = DEFAULT_CONFIG
): { valid: boolean; error?: string } {
  // Check if file type starts with "video/" or is in our allowed list
  const isVideoType =
    file.type.startsWith("video/") || config.allowedTypes.includes(file.type);

  if (!isVideoType) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Please select a video file.`,
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

// Initialize S3 multipart upload
export async function initializeMultipartUpload(
  apiEndpoint: string,
  fileName: string,
  fileId: string,
  contentType: string,
  totalChunks: number,
  signal: AbortSignal
): Promise<MultipartUploadInit> {
  const response = await fetch(`${apiEndpoint}/upload-presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      fileId,
      contentType,
      totalChunks,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to initialize multipart upload: ${response.status} - ${errorText}`
    );
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to initialize multipart upload");
  }

  return result;
}

// Get presigned URL for uploading a specific part
export async function getPartUploadUrl(
  apiEndpoint: string,
  uploadId: string,
  partNumber: number,
  s3Key: string,
  signal: AbortSignal
): Promise<string> {
  const params = new URLSearchParams({
    uploadId,
    partNumber: partNumber.toString(),
    s3Key,
  });

  const response = await fetch(`${apiEndpoint}/upload-presign?${params}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to get part upload URL: ${response.status} - ${errorText}`
    );
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Failed to get part upload URL");
  }

  return result.presignedUrl;
}

// Upload a single part to S3
export async function uploadPart(
  presignedUrl: string,
  chunk: Blob,
  partNumber: number,
  signal: AbortSignal
): Promise<PartUploadResult> {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: chunk,
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Part ${partNumber} upload failed: ${response.status} - ${errorText}`
    );
  }

  const etag = response.headers.get("ETag");
  if (!etag) {
    throw new Error(`No ETag received for part ${partNumber}`);
  }

  return {
    success: true,
    partNumber,
    ETag: etag,
  };
}

// Complete the multipart upload
export async function completeMultipartUpload(
  apiEndpoint: string,
  uploadId: string,
  s3Key: string,
  parts: Array<{ PartNumber: number; ETag: string }>,
  fileName: string,
  fileId: string,
  contentType: string,
  signal: AbortSignal
): Promise<ChunkUploadResult> {
  const response = await fetch(`${apiEndpoint}/complete-upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uploadId,
      s3Key,
      parts,
      fileName,
      fileId,
      contentType,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to complete multipart upload: ${response.status} - ${errorText}`
    );
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to complete multipart upload");
  }

  return {
    success: true,
    fileId,
    fileName: result.fileName,
    fileSize: result.fileSize,
    s3Url: result.s3Url,
    s3Key: result.s3Key,
    contentType: result.contentType,
    uploadId: result.uploadId,
    method: result.method,
  };
}
