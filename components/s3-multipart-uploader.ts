import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  type CompletedPart,
} from "@aws-sdk/client-s3"
import { createS3Client, AWS_CONFIG } from "@/lib/aws-s3"

export interface MultipartUploadResult {
  success: boolean
  key?: string
  location?: string
  error?: string
  uploadId?: string
}

export async function createMultipartUpload(
  key: string,
  contentType = "video/mp4",
  metadata: Record<string, string> = {},
): Promise<{ uploadId: string; key: string }> {
  const s3Client = createS3Client()

  const command = new CreateMultipartUploadCommand({
    Bucket: AWS_CONFIG.bucket,
    Key: key,
    ContentType: contentType,
    Metadata: metadata,
  })

  const result = await s3Client.send(command)

  if (!result.UploadId) {
    throw new Error("Failed to create multipart upload")
  }

  return {
    uploadId: result.UploadId,
    key: key,
  }
}

export async function uploadPart(
  uploadId: string,
  key: string,
  partNumber: number,
  body: Buffer | Uint8Array,
): Promise<CompletedPart> {
  const s3Client = createS3Client()

  const command = new UploadPartCommand({
    Bucket: AWS_CONFIG.bucket,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
    Body: body,
  })

  const result = await s3Client.send(command)

  if (!result.ETag) {
    throw new Error(`Failed to upload part ${partNumber}`)
  }

  return {
    ETag: result.ETag,
    PartNumber: partNumber,
  }
}

export async function completeMultipartUpload(
  uploadId: string,
  key: string,
  parts: CompletedPart[],
): Promise<MultipartUploadResult> {
  const s3Client = createS3Client()

  try {
    const command = new CompleteMultipartUploadCommand({
      Bucket: AWS_CONFIG.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => (a.PartNumber || 0) - (b.PartNumber || 0)),
      },
    })

    const result = await s3Client.send(command)

    return {
      success: true,
      key: result.Key,
      location: result.Location,
      uploadId: uploadId,
    }
  } catch (error) {
    // Abort the multipart upload on failure
    await abortMultipartUpload(uploadId, key)

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      uploadId: uploadId,
    }
  }
}

export async function abortMultipartUpload(uploadId: string, key: string): Promise<void> {
  const s3Client = createS3Client()

  const command = new AbortMultipartUploadCommand({
    Bucket: AWS_CONFIG.bucket,
    Key: key,
    UploadId: uploadId,
  })

  await s3Client.send(command)
}
