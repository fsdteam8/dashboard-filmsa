import { type NextRequest, NextResponse } from "next/server"
import { ListObjectsV2Command } from "@aws-sdk/client-s3"
import { createS3Client, AWS_CONFIG } from "@/lib/aws-s3"

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {
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

    console.log(`📊 Getting video info for file ID: ${fileId}`)

    const s3Client = createS3Client()

    // Check if HLS files exist
    const hlsPrefix = `hls/${fileId}/`
    const listCommand = new ListObjectsV2Command({
      Bucket: AWS_CONFIG.bucket,
      Prefix: hlsPrefix,
    })

    const listResult = await s3Client.send(listCommand)
    const hlsFiles = listResult.Contents || []

    const playlistFile = hlsFiles.find((file) => file.Key?.endsWith(".m3u8"))
    const segmentFiles = hlsFiles.filter((file) => file.Key?.endsWith(".ts"))

    if (!playlistFile) {
      return NextResponse.json(
        {
          success: false,
          message: "HLS files not found for this video",
        },
        { status: 404 },
      )
    }

    // Generate URLs
    const playlistUrl = `https://${AWS_CONFIG.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${playlistFile.Key}`
    const segmentUrls = segmentFiles.map(
      (file) => `https://${AWS_CONFIG.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${file.Key}`,
    )

    console.log(`📦 Found HLS files for ${fileId}: ${hlsFiles.length} total files`)

    return NextResponse.json({
      success: true,
      fileId,
      hls: {
        playlistUrl,
        segmentCount: segmentFiles.length,
        segmentUrls,
        totalFiles: hlsFiles.length,
      },
      files: hlsFiles.map((file) => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        url: `https://${AWS_CONFIG.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${file.Key}`,
      })),
    })
  } catch (error) {
    console.error("💥 Failed to get video info:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to get video info",
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
