import { PutObjectCommand } from "@aws-sdk/client-s3"
import { createS3Client, AWS_CONFIG } from "@/lib/aws-s3"
import path from "path"

export interface HLSUploadResult {
  success: boolean
  error?: string
  segmentCount?: number
  uploadTime?: number
  uploadedFiles?: string[]
}

export async function uploadHLSToS3(hlsDir: string, fileId: string): Promise<HLSUploadResult> {
  const startTime = Date.now()

  try {
    console.log(`☁️ Starting HLS upload to S3 for fileId: ${fileId}`)

    const fs = await import("fs")
    const s3Client = createS3Client()

    // Read all files in the HLS directory
    const files = await fs.promises.readdir(hlsDir)
    const uploadedFiles: string[] = []

    console.log(`📁 Found ${files.length} files to upload:`, files)

    // Upload each file
    for (const file of files) {
      const filePath = path.join(hlsDir, file)
      const fileBuffer = await fs.promises.readFile(filePath)

      // Determine S3 key and content type
      const s3Key = `hls/${fileId}/${file}`
      const contentType = getHLSContentType(file)

      console.log(`📤 Uploading: ${file} → ${s3Key}`)

      const uploadCommand = new PutObjectCommand({
        Bucket: AWS_CONFIG.bucket,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: "public-read", // Make HLS files publicly accessible
        CacheControl: file.endsWith(".m3u8") ? "no-cache" : "max-age=31536000", // Cache segments for 1 year, playlists no cache
        Metadata: {
          fileId: fileId,
          originalFile: file,
          uploadedAt: new Date().toISOString(),
        },
      })

      await s3Client.send(uploadCommand)
      uploadedFiles.push(s3Key)

      console.log(`✅ Uploaded: ${file}`)
    }

    // Count segments (.ts files)
    const segmentCount = files.filter((f) => f.endsWith(".ts")).length
    const uploadTime = Date.now() - startTime

    console.log(`🎉 HLS upload completed successfully!`)
    console.log(`📊 Uploaded ${uploadedFiles.length} files in ${uploadTime}ms`)
    console.log(`🎞️ Segment count: ${segmentCount}`)

    return {
      success: true,
      segmentCount,
      uploadTime,
      uploadedFiles,
    }
  } catch (error) {
    console.error(`💥 HLS upload failed:`, error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error",
      uploadTime: Date.now() - startTime,
    }
  }
}

function getHLSContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()

  switch (ext) {
    case ".m3u8":
      return "application/vnd.apple.mpegurl"
    case ".ts":
      return "video/mp2t"
    case ".mp4":
      return "video/mp4"
    case ".webm":
      return "video/webm"
    default:
      return "application/octet-stream"
  }
}

export async function deleteHLSFromS3(fileId: string): Promise<boolean> {
  try {
    console.log(`🗑️ Deleting HLS files for fileId: ${fileId}`)

    const s3Client = createS3Client()
    const { ListObjectsV2Command, DeleteObjectsCommand } = await import("@aws-sdk/client-s3")

    // List all HLS files for this fileId
    const listCommand = new ListObjectsV2Command({
      Bucket: AWS_CONFIG.bucket,
      Prefix: `hls/${fileId}/`,
    })

    const listResult = await s3Client.send(listCommand)
    const objects = listResult.Contents || []

    if (objects.length === 0) {
      console.log(`ℹ️ No HLS files found for fileId: ${fileId}`)
      return true
    }

    // Delete all objects
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: AWS_CONFIG.bucket,
      Delete: {
        Objects: objects.map((obj) => ({ Key: obj.Key! })),
      },
    })

    await s3Client.send(deleteCommand)

    console.log(`✅ Deleted ${objects.length} HLS files for fileId: ${fileId}`)
    return true
  } catch (error) {
    console.error(`💥 Failed to delete HLS files:`, error)
    return false
  }
}
