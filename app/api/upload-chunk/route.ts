import { type NextRequest, NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { createS3Client, AWS_CONFIG } from "@/lib/aws-s3"

export async function POST(request: NextRequest) {
  try {
    console.log("📤 Chunk upload request received")

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

    const formData = await request.formData()
    const chunk = formData.get("chunk") as File
    const chunkNumber = Number.parseInt(formData.get("chunkNumber") as string)
    const totalChunks = Number.parseInt(formData.get("totalChunks") as string)
    const fileName = formData.get("fileName") as string
    const fileId = formData.get("fileId") as string

    // Validation
    if (!chunk || !chunkNumber || !totalChunks || !fileName || !fileId) {
      console.error("❌ Missing required fields")
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
          errors: {
            chunk: !chunk ? ["Chunk file is required"] : undefined,
            chunkNumber: !chunkNumber ? ["Chunk number is required"] : undefined,
            totalChunks: !totalChunks ? ["Total chunks is required"] : undefined,
            fileName: !fileName ? ["File name is required"] : undefined,
            fileId: !fileId ? ["File ID is required"] : undefined,
          },
        },
        { status: 422 },
      )
    }

    // Validate chunk number range
    if (chunkNumber < 1 || chunkNumber > totalChunks) {
      console.error(`❌ Invalid chunk number: ${chunkNumber}/${totalChunks}`)
      return NextResponse.json(
        {
          success: false,
          message: `Invalid chunk number: ${chunkNumber}/${totalChunks}`,
        },
        { status: 422 },
      )
    }

    console.log(`📦 Processing chunk ${chunkNumber}/${totalChunks}`)
    console.log(`📄 File: ${fileName}`)
    console.log(`🆔 File ID: ${fileId}`)
    console.log(`📏 Chunk size: ${chunk.size} bytes`)

    // Convert chunk to buffer
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer())

    // S3 key for the chunk (chunks are temporary, don't need to be public)
    const chunkKey = `uploads/chunks/${fileId}/chunk_${chunkNumber.toString().padStart(4, "0")}`

    console.log(`☁️ Uploading to S3: ${chunkKey}`)

    // Create S3 client and upload chunk
    const s3Client = createS3Client()
    const uploadCommand = new PutObjectCommand({
      Bucket: AWS_CONFIG.bucket,
      Key: chunkKey,
      Body: chunkBuffer,
      ContentType: "application/octet-stream",
      // Chunks are temporary, no need for public access
      Metadata: {
        originalFileName: fileName,
        fileId: fileId,
        chunkNumber: chunkNumber.toString(),
        totalChunks: totalChunks.toString(),
        chunkSize: chunk.size.toString(),
      },
    })

    const uploadResult = await s3Client.send(uploadCommand)

    console.log(`✅ Chunk ${chunkNumber} uploaded successfully`)
    console.log(`📋 S3 ETag: ${uploadResult.ETag}`)

    return NextResponse.json({
      success: true,
      message: `Chunk ${chunkNumber} uploaded successfully`,
      chunkNumber,
      totalChunks,
      chunkSize: chunk.size,
      fileId,
      s3Key: chunkKey,
      etag: uploadResult.ETag,
    })
  } catch (error) {
    console.error("💥 Chunk upload failed:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Chunk upload failed",
        error: error instanceof Error ? error.message : "Unknown error",
        errorCode: "CHUNK_UPLOAD_FAILED",
      },
      { status: 500 },
    )
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
