// Upload utility functions for chunked file uploads with presigned URLs

export interface UploadConfig {
  chunkSize: number
  maxRetries: number
  retryDelay: number
  allowedTypes: string[]
  presignedUrlExpiry: number
}

export interface ChunkUploadResult {
  success: boolean
  fileId?: string
  error?: string
  fileName?: string
  fileSize?: number
  fileUrl?: string
}

export interface UploadProgress {
  currentChunk: number
  totalChunks: number
  percentage: number
  bytesUploaded: number
  totalBytes: number
}

export interface PresignedUrlResponse {
  success: boolean
  chunkNumber: number
  totalChunks: number
  fileId: string
  s3Key: string
  uploadUrl: string
  uploadFields: Record<string, string>
  expiresIn: number
  message?: string
  error?: string
}

export const DEFAULT_CONFIG: UploadConfig = {
  chunkSize: 5 * 1024 * 1024, // 5MB
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  allowedTypes: ["video/mp4", "video/avi", "video/mov", "video/wmv", "video/flv", "video/webm", "video/mkv"],
  presignedUrlExpiry: 3600, // 1 hour
}

export function validateFile(file: File, config: UploadConfig = DEFAULT_CONFIG): { valid: boolean; error?: string } {
  if (!config.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${config.allowedTypes.join(", ")}`,
    }
  }

  return { valid: true }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function generateFileId(fileName: string): string {
  const cleanName = fileName.replace(/[^a-zA-Z0-9]/g, "_")
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${cleanName}-${timestamp}-${random}`
}

export function calculateProgress(currentChunk: number, totalChunks: number): number {
  return Math.round((currentChunk / totalChunks) * 100)
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Get presigned URL for chunk upload
export async function getPresignedUrl(
  apiEndpoint: string,
  chunkNumber: number,
  totalChunks: number,
  fileName: string,
  fileId: string,
  chunkSize: number,
  signal: AbortSignal,
): Promise<PresignedUrlResponse> {
  const presignParams = new URLSearchParams({
    chunkNumber: chunkNumber.toString(),
    totalChunks: totalChunks.toString(),
    fileName: fileName,
    fileId: fileId,
    chunkSize: chunkSize.toString(),
  })

  const response = await fetch(`${apiEndpoint}/upload-presign?${presignParams}`, {
    method: "GET",
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get presigned URL: ${response.status} - ${errorText}`)
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.message || "Failed to get presigned URL")
  }

  return result
}

// Upload chunk directly to S3 using presigned URL
export async function uploadChunkToS3(
  chunk: Blob,
  presignedData: PresignedUrlResponse,
  signal: AbortSignal,
): Promise<boolean> {
  const formData = new FormData()

  // Add all the presigned fields first
  Object.entries(presignedData.uploadFields).forEach(([key, value]) => {
    formData.append(key, value)
  })

  // Add the file last (this is important for S3)
  formData.append("file", chunk)

  const response = await fetch(presignedData.uploadUrl, {
    method: "POST",
    body: formData,
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`S3 upload failed: ${response.status} - ${errorText}`)
  }

  return true
}
