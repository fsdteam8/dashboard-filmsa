import { type NextRequest, NextResponse } from "next/server"
import { ListObjectsV2Command, GetObjectCommand, DeleteObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { createS3Client, AWS_CONFIG } from "@/lib/aws-s3"
import { convertToHLS, checkFFmpegAvailability } from "@/lib/ffmpeg-converter"
import { uploadHLSToS3 } from "@/lib/hls-uploader"

export async function POST(request: NextRequest) {
  try {
    console.log("🏁 Complete upload request received")

    // Validate AWS configuration first
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_BUCKET) {
      console.error("❌ Missing AWS configuration")
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error: Missing AWS credentials",
        },
        { status: 500 },
      )
    }

    const body = await request.json()
    const { fileName, fileId } = body

    // Validation
    if (!fileName || !fileId) {
      console.error("❌ Missing required fields")
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
          errors: {
            fileName: !fileName ? ["File name is required"] : undefined,
            fileId: !fileId ? ["File ID is required"] : undefined,
          },
        },
        { status: 422 },
      )
    }

    console.log(`📄 Completing upload for: ${fileName}`)
    console.log(`🆔 File ID: ${fileId}`)

    // Check FFmpeg availability
    const ffmpegAvailable = await checkFFmpegAvailability()
    console.log(`🔧 FFmpeg available: ${ffmpegAvailable}`)

    // Create S3 client
    const s3Client = createS3Client()

    // List all chunks for this file
    const chunksPrefix = `uploads/chunks/${fileId}/`
    const listCommand = new ListObjectsV2Command({
      Bucket: AWS_CONFIG.bucket,
      Prefix: chunksPrefix,
    })

    const listResult = await s3Client.send(listCommand)
    const chunkObjects = listResult.Contents || []

    if (chunkObjects.length === 0) {
      console.error("❌ No chunks found")
      return NextResponse.json(
        {
          success: false,
          message: "No chunks found for this upload",
        },
        { status: 404 },
      )
    }

    console.log(`📦 Found ${chunkObjects.length} chunks`)

    // Sort chunks by chunk number
    const sortedChunks = chunkObjects
      .filter((obj) => obj.Key?.includes("chunk_"))
      .sort((a, b) => {
        const aNum = Number.parseInt(a.Key?.split("chunk_")[1] || "0")
        const bNum = Number.parseInt(b.Key?.split("chunk_")[1] || "0")
        return aNum - bNum
      })

    console.log(`🔄 Sorted ${sortedChunks.length} chunks for assembly`)

    // Download and combine all chunks
    const chunkBuffers: Buffer[] = []
    let totalSize = 0

    for (let i = 0; i < sortedChunks.length; i++) {
      const chunk = sortedChunks[i]
      if (!chunk.Key) continue

      console.log(`⬇️ Downloading chunk ${i + 1}/${sortedChunks.length}: ${chunk.Key}`)

      const getCommand = new GetObjectCommand({
        Bucket: AWS_CONFIG.bucket,
        Key: chunk.Key,
      })

      const chunkResult = await s3Client.send(getCommand)

      if (!chunkResult.Body) {
        throw new Error(`Failed to download chunk: ${chunk.Key}`)
      }

      // Convert stream to buffer
      const chunkBuffer = Buffer.from(await chunkResult.Body.transformToByteArray())
      chunkBuffers.push(chunkBuffer)
      totalSize += chunkBuffer.length

      console.log(`✅ Downloaded chunk ${i + 1}, size: ${chunkBuffer.length} bytes`)
    }

    // Combine all chunks into final file
    console.log(`🔗 Combining ${chunkBuffers.length} chunks, total size: ${totalSize} bytes`)
    const finalBuffer = Buffer.concat(chunkBuffers)

    // Generate unique filename for final file
    const timestamp = Date.now()
    const extension = fileName.split(".").pop() || "mp4"
    const uniqueFileName = `${fileId}_${timestamp}.${extension}`

    if (ffmpegAvailable) {
      // FFmpeg is available - proceed with HLS conversion
      const tempVideoPath = `/tmp/${uniqueFileName}`

      console.log(`💾 Saving merged video temporarily: ${tempVideoPath}`)

      // Save merged video to temporary file for FFmpeg processing
      const fs = await import("fs")
      await fs.promises.writeFile(tempVideoPath, finalBuffer)

      // Convert to HLS format using FFmpeg
      console.log(`🎬 Converting to HLS format...`)
      const hlsResult = await convertToHLS(tempVideoPath, fileId)

      if (!hlsResult.success && !hlsResult.skipped) {
        throw new Error(`HLS conversion failed: ${hlsResult.error}`)
      }

      if (hlsResult.skipped) {
        console.log(`⚠️ HLS conversion skipped - uploading original MP4`)
        // Upload original MP4 file
        const mp4Key = `uploads/videos/${uniqueFileName}`
        const uploadCommand = new PutObjectCommand({
          Bucket: AWS_CONFIG.bucket,
          Key: mp4Key,
          Body: finalBuffer,
          ContentType: "video/mp4",
          ACL: "public-read",
          Metadata: {
            originalFileName: fileName,
            fileId: fileId,
            totalChunks: sortedChunks.length.toString(),
            finalSize: finalBuffer.length.toString(),
            uploadedAt: new Date().toISOString(),
          },
        })

        await s3Client.send(uploadCommand)

        // Clean up
        await fs.promises.unlink(tempVideoPath).catch(() => {})

        const mp4Url = `https://${AWS_CONFIG.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${mp4Key}`

        return NextResponse.json({
          success: true,
          message: "File uploaded successfully (HLS conversion skipped - FFmpeg not available)",
          fileName: uniqueFileName,
          originalName: fileName,
          fileSize: finalBuffer.length,
          filePath: mp4Key,
          fileUrl: mp4Url,
          chunksProcessed: sortedChunks.length,
          fileId: fileId,
          s3Key: mp4Key,
          hlsSkipped: true,
          ffmpegAvailable: false,
        })
      }

      console.log(`✅ HLS conversion completed`)
      console.log(`📁 HLS files: ${hlsResult.files?.length} files generated`)

      // Upload HLS files to S3
      console.log(`☁️ Uploading HLS files to S3...`)
      const s3UploadResult = await uploadHLSToS3(hlsResult.outputDir!, fileId)

      if (!s3UploadResult.success) {
        throw new Error(`S3 upload failed: ${s3UploadResult.error}`)
      }

      console.log(`✅ HLS files uploaded to S3`)

      // Clean up temporary files
      console.log(`🧹 Cleaning up temporary files...`)
      try {
        await fs.promises.unlink(tempVideoPath)
        if (hlsResult.outputDir) {
          await fs.promises.rm(hlsResult.outputDir, { recursive: true, force: true })
        }
      } catch (cleanupError) {
        console.warn(`⚠️ Cleanup warning:`, cleanupError)
      }

      // Generate HLS playlist URL
      const hlsPlaylistUrl = `https://${AWS_CONFIG.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/hls/${fileId}/playlist.m3u8`

      console.log(`🎉 Upload and HLS conversion completed successfully!`)
      console.log(`🔗 HLS Playlist URL: ${hlsPlaylistUrl}`)

      // Clean up chunk files from S3
      await cleanupChunks(s3Client, sortedChunks)

      return NextResponse.json({
        success: true,
        message: "File uploaded and converted to HLS successfully",
        fileName: uniqueFileName,
        originalName: fileName,
        fileSize: finalBuffer.length,
        // HLS-specific data
        hls: {
          playlistUrl: hlsPlaylistUrl,
          segmentCount: s3UploadResult.segmentCount,
          duration: hlsResult.duration,
          resolution: hlsResult.resolution,
        },
        // Legacy data for compatibility
        filePath: `hls/${fileId}/playlist.m3u8`,
        fileUrl: hlsPlaylistUrl,
        chunksProcessed: sortedChunks.length,
        fileId: fileId,
        s3Key: `hls/${fileId}/playlist.m3u8`,
        conversionTime: hlsResult.conversionTime,
        uploadTime: s3UploadResult.uploadTime,
        ffmpegAvailable: true,
      })
    } else {
      // FFmpeg not available - upload original MP4
      console.log(`⚠️ FFmpeg not available - uploading original MP4 file`)

      const mp4Key = `uploads/videos/${uniqueFileName}`
      const uploadCommand = new PutObjectCommand({
        Bucket: AWS_CONFIG.bucket,
        Key: mp4Key,
        Body: finalBuffer,
        ContentType: "video/mp4",
        ACL: "public-read",
        Metadata: {
          originalFileName: fileName,
          fileId: fileId,
          totalChunks: sortedChunks.length.toString(),
          finalSize: finalBuffer.length.toString(),
          uploadedAt: new Date().toISOString(),
        },
      })

      await s3Client.send(uploadCommand)

      // Clean up chunk files from S3
      await cleanupChunks(s3Client, sortedChunks)

      const mp4Url = `https://${AWS_CONFIG.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${mp4Key}`

      console.log(`🎉 Upload completed successfully (MP4 format)!`)
      console.log(`🔗 MP4 URL: ${mp4Url}`)

      return NextResponse.json({
        success: true,
        message: "File uploaded successfully (HLS conversion skipped - FFmpeg not available)",
        fileName: uniqueFileName,
        originalName: fileName,
        fileSize: finalBuffer.length,
        filePath: mp4Key,
        fileUrl: mp4Url,
        chunksProcessed: sortedChunks.length,
        fileId: fileId,
        s3Key: mp4Key,
        hlsSkipped: true,
        ffmpegAvailable: false,
      })
    }
  } catch (error) {
    console.error("💥 Upload completion failed:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Upload completion failed",
        error: error instanceof Error ? error.message : "Unknown error",
        errorCode: "UPLOAD_COMPLETION_FAILED",
      },
      { status: 500 },
    )
  }
}

async function cleanupChunks(s3Client: any, sortedChunks: any[]) {
  console.log(`🧹 Cleaning up ${sortedChunks.length} chunk files from S3`)
  const deleteObjects = sortedChunks.filter((chunk) => chunk.Key).map((chunk) => ({ Key: chunk.Key! }))

  if (deleteObjects.length > 0) {
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: AWS_CONFIG.bucket,
      Delete: {
        Objects: deleteObjects,
      },
    })

    await s3Client.send(deleteCommand)
    console.log(`🗑️ Cleaned up ${deleteObjects.length} chunk files`)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
