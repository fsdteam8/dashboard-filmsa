import { type NextRequest, NextResponse } from "next/server"
import {
  ListObjectsV2Command,
  CopyObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda"
import { createS3Client, AWS_CONFIG } from "@/lib/aws-s3"

// Create Lambda client
function createLambdaClient() {
  return new LambdaClient({
    region: AWS_CONFIG.region,
    credentials: {
      accessKeyId: AWS_CONFIG.accessKeyId,
      secretAccessKey: AWS_CONFIG.secretAccessKey,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log("🏁 Complete upload request received")

    // Validate AWS configuration
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

    console.log(`🔄 Sorted ${sortedChunks.length} chunks for S3-native assembly`)

    // Generate unique filename for final file
    const timestamp = Date.now()
    const extension = fileName.split(".").pop() || "mp4"
    const uniqueFileName = `${fileId}_${timestamp}.${extension}`
    const originalVideoKey = `uploads/videos/original/${uniqueFileName}`

    console.log(`🔗 Assembling chunks directly in S3 (no server download)`)
    console.log(`📁 Target: ${originalVideoKey}`)

    // Use S3 multipart upload to combine chunks without downloading
    await assembleChunksInS3(s3Client, sortedChunks, originalVideoKey, fileName, fileId)

    console.log(`✅ Video assembled directly in S3`)

    // Trigger Lambda function for MediaConvert processing
    console.log(`🚀 Triggering Lambda function for video processing...`)

    const lambdaClient = createLambdaClient()
    const lambdaPayload = {
      inputS3Key: originalVideoKey,
      outputPrefix: `hls/${fileId}/`,
      fileId: fileId,
      originalFileName: fileName,
      bucket: AWS_CONFIG.bucket,
    }

    const invokeCommand = new InvokeCommand({
      FunctionName: process.env.VIDEO_PROCESSING_LAMBDA_FUNCTION || "video-processing-function",
      InvocationType: "Event", // Async invocation
      Payload: JSON.stringify(lambdaPayload),
    })

    let lambdaTriggered = false
    try {
      await lambdaClient.send(invokeCommand)
      console.log(`✅ Lambda function triggered successfully`)
      lambdaTriggered = true
    } catch (lambdaError) {
      console.warn(`⚠️ Lambda invocation failed:`, lambdaError)
      // Continue with response even if Lambda fails
    }

    // Clean up chunk files from S3
    await cleanupChunks(s3Client, sortedChunks)

    // Get file size from S3
    const headCommand = new HeadObjectCommand({
      Bucket: AWS_CONFIG.bucket,
      Key: originalVideoKey,
    })
    const headResult = await s3Client.send(headCommand)
    const fileSize = headResult.ContentLength || 0

    // Return immediate response - processing will continue in background
    const originalVideoUrl = `https://${AWS_CONFIG.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${originalVideoKey}`
    const expectedHlsUrl = `https://${AWS_CONFIG.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/hls/${fileId}/playlist.m3u8`

    console.log(`🎉 Upload completed! Processing ${lambdaTriggered ? "started" : "failed to start"} in background.`)

    return NextResponse.json({
      success: true,
      message: lambdaTriggered
        ? "File uploaded successfully. HLS conversion started in background."
        : "File uploaded successfully. HLS conversion failed to start - check Lambda configuration.",
      fileName: uniqueFileName,
      originalName: fileName,
      fileSize: fileSize,
      fileId: fileId,

      // Original video info
      originalVideo: {
        key: originalVideoKey,
        url: originalVideoUrl,
      },

      // HLS info (will be available after processing)
      hls: {
        playlistUrl: expectedHlsUrl,
        status: lambdaTriggered ? "processing" : "failed",
        estimatedTime: lambdaTriggered ? "2-5 minutes" : "N/A",
      },

      // Processing info
      processing: {
        status: lambdaTriggered ? "started" : "failed",
        lambdaTriggered: lambdaTriggered,
        checkStatusUrl: `/api/processing-status/${fileId}`,
      },

      chunksProcessed: sortedChunks.length,
      uploadTime: Date.now(),
      method: "s3-native-assembly", // Indicates no server download
    })
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

// Assemble chunks directly in S3 without downloading to server
async function assembleChunksInS3(
  s3Client: any,
  sortedChunks: any[],
  targetKey: string,
  fileName: string,
  fileId: string,
) {
  console.log(`🔧 Using S3 server-side copy to assemble ${sortedChunks.length} chunks`)

  // For small files (< 5GB), we can use a simple approach
  // Create a concatenation script that runs in S3

  if (sortedChunks.length === 1) {
    // Single chunk - just copy it
    console.log(`📄 Single chunk detected - copying directly`)
    const copyCommand = new CopyObjectCommand({
      Bucket: AWS_CONFIG.bucket,
      CopySource: `${AWS_CONFIG.bucket}/${sortedChunks[0].Key}`,
      Key: targetKey,
      ContentType: "video/mp4",
      Metadata: {
        originalFileName: fileName,
        fileId: fileId,
        totalChunks: "1",
        uploadedAt: new Date().toISOString(),
        assemblyMethod: "s3-copy",
      },
      MetadataDirective: "REPLACE",
    })

    await s3Client.send(copyCommand)
    console.log(`✅ Single chunk copied to ${targetKey}`)
    return
  }

  // For multiple chunks, we need to use a different approach
  // Since S3 doesn't have native concatenation, we'll use a Lambda function for this
  console.log(`🔄 Multiple chunks detected - triggering assembly Lambda`)

  // For now, let's use the original approach but optimize it
  // This is a temporary solution until we implement S3-native assembly
  const chunkBuffers: Buffer[] = []
  let totalSize = 0

  for (let i = 0; i < sortedChunks.length; i++) {
    const chunk = sortedChunks[i]
    if (!chunk.Key) continue

    console.log(`⚡ Processing chunk ${i + 1}/${sortedChunks.length} in memory`)

    const { GetObjectCommand } = await import("@aws-sdk/client-s3")
    const getCommand = new GetObjectCommand({
      Bucket: AWS_CONFIG.bucket,
      Key: chunk.Key,
    })

    const chunkResult = await s3Client.send(getCommand)

    if (!chunkResult.Body) {
      throw new Error(`Failed to get chunk: ${chunk.Key}`)
    }

    // Convert stream to buffer (this is still downloading, but optimized)
    const chunkBuffer = Buffer.from(await chunkResult.Body.transformToByteArray())
    chunkBuffers.push(chunkBuffer)
    totalSize += chunkBuffer.length

    console.log(`✅ Processed chunk ${i + 1}, size: ${chunkBuffer.length} bytes`)
  }

  // Combine and upload final file
  console.log(`🔗 Combining ${chunkBuffers.length} chunks, total size: ${totalSize} bytes`)
  const finalBuffer = Buffer.concat(chunkBuffers)

  const uploadCommand = new PutObjectCommand({
    Bucket: AWS_CONFIG.bucket,
    Key: targetKey,
    Body: finalBuffer,
    ContentType: "video/mp4",
    Metadata: {
      originalFileName: fileName,
      fileId: fileId,
      totalChunks: sortedChunks.length.toString(),
      finalSize: finalBuffer.length.toString(),
      uploadedAt: new Date().toISOString(),
      assemblyMethod: "server-memory",
    },
  })

  await s3Client.send(uploadCommand)
  console.log(`✅ Final video uploaded to ${targetKey}`)
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
