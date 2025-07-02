import { type NextRequest, NextResponse } from "next/server"
import { ListObjectsV2Command } from "@aws-sdk/client-s3"
import { createS3Client, AWS_CONFIG } from "@/lib/aws-s3"

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {
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

    const { fileId } = params

    if (!fileId) {
      return NextResponse.json(
        {
          success: false,
          message: "File ID is required",
        },
        { status: 400 },
      )
    }

    console.log(`📊 Getting upload status for file ID: ${fileId}`)

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

    const chunks = chunkObjects
      .filter((obj) => obj.Key?.includes("chunk_"))
      .map((obj) => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        chunkNumber: Number.parseInt(obj.Key?.split("chunk_")[1] || "0"),
      }))
      .sort((a, b) => a.chunkNumber - b.chunkNumber)

    console.log(`📦 Found ${chunks.length} chunks for file ${fileId}`)

    return NextResponse.json({
      success: true,
      fileId,
      chunksUploaded: chunks.length,
      chunks: chunks,
      totalSize: chunks.reduce((sum, chunk) => sum + (chunk.size || 0), 0),
    })
  } catch (error) {
    console.error("💥 Failed to get upload status:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to get upload status",
        error: error instanceof Error ? error.message : "Unknown error",
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
