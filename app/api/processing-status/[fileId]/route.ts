import { type NextRequest, NextResponse } from "next/server";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { createS3Client, AWS_CONFIG } from "@/lib/aws-s3";

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json(
        {
          success: false,
          message: "File ID is required",
        },
        { status: 400 }
      );
    }

    console.log(`📊 Checking processing status for file ID: ${fileId}`);

    const s3Client = createS3Client();

    // Check if HLS files exist
    const hlsPrefix = `hls/${fileId}/`;
    const listCommand = new ListObjectsV2Command({
      Bucket: AWS_CONFIG.bucket,
      Prefix: hlsPrefix,
    });

    const listResult = await s3Client.send(listCommand);
    const hlsFiles = listResult.Contents || [];

    const playlistFile = hlsFiles.find((file) => file.Key?.endsWith(".m3u8"));
    const segmentFiles = hlsFiles.filter((file) => file.Key?.endsWith(".ts"));

    // Check if original video exists
    const originalVideoPrefix = `uploads/videos/original/`;
    const originalListCommand = new ListObjectsV2Command({
      Bucket: AWS_CONFIG.bucket,
      Prefix: originalVideoPrefix,
    });

    const originalListResult = await s3Client.send(originalListCommand);
    const originalFiles =
      originalListResult.Contents?.filter((file) =>
        file.Key?.includes(fileId)
      ) || [];

    // Try to get comprehensive video metadata from Lambda processing
    let videoMetadata = null;
    try {
      const videoDetailsKey = `processing/jobs/${fileId}.json`;
      const getDetailsCommand = new GetObjectCommand({
        Bucket: AWS_CONFIG.bucket,
        Key: videoDetailsKey,
      });

      const detailsResult = await s3Client.send(getDetailsCommand);
      if (detailsResult.Body) {
        const detailsText = await detailsResult.Body.transformToString();
        const detailsData = JSON.parse(detailsText);
        videoMetadata = detailsData;
        console.log(`📋 Found comprehensive video metadata for ${fileId}`);
      }
    } catch (error) {
      console.log(`⚠️ No comprehensive metadata found for ${fileId}:`, error);
    }

    const status = {
      fileId,
      processing: {
        status: playlistFile
          ? "completed"
          : hlsFiles.length > 0
          ? "in_progress"
          : "pending",
        hlsFilesFound: hlsFiles.length,
        segmentCount: segmentFiles.length,
        hasPlaylist: !!playlistFile,
      },
      original: {
        exists: originalFiles.length > 0,
        files: originalFiles.map((file) => ({
          key: file.Key,
          size: file.Size,
          lastModified: file.LastModified,
          url: `https://${AWS_CONFIG.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${file.Key}`,
        })),
      },
      hls: playlistFile
        ? {
            playlistUrl: `https://${AWS_CONFIG.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${playlistFile.Key}`,
            segmentCount: segmentFiles.length,
            totalFiles: hlsFiles.length,
            ready: true,
          }
        : null,
      // Include comprehensive metadata if available
      metadata: videoMetadata?.metadata || null,
      videoDetails: videoMetadata || null,
    };

    console.log(`📊 Processing status response:`, status);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error("💥 Failed to get processing status:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to get processing status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
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
  });
}
