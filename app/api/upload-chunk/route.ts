import { type NextRequest, NextResponse } from "next/server";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { createS3Client, AWS_CONFIG } from "@/lib/aws-s3";

export async function GET(request: NextRequest) {
  try {
    console.log("📝 Presigned URL request received");

    // Validate AWS configuration first
    if (
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY ||
      !process.env.AWS_BUCKET
    ) {
      console.error("❌ Missing AWS configuration");
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error: Missing AWS credentials",
        },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const chunkNumber = Number.parseInt(searchParams.get("chunkNumber") || "0");
    const totalChunks = Number.parseInt(searchParams.get("totalChunks") || "0");
    const fileName = searchParams.get("fileName") || "";
    const fileId = searchParams.get("fileId") || "";
    const chunkSize = Number.parseInt(searchParams.get("chunkSize") || "0");

    // Validation
    if (!chunkNumber || !totalChunks || !fileName || !fileId || !chunkSize) {
      console.error("❌ Missing required parameters");
      return NextResponse.json(
        {
          success: false,
          message: "Missing required parameters",
          errors: {
            chunkNumber: !chunkNumber
              ? ["Chunk number is required"]
              : undefined,
            totalChunks: !totalChunks
              ? ["Total chunks is required"]
              : undefined,
            fileName: !fileName ? ["File name is required"] : undefined,
            fileId: !fileId ? ["File ID is required"] : undefined,
            chunkSize: !chunkSize ? ["Chunk size is required"] : undefined,
          },
        },
        { status: 422 }
      );
    }

    // Validate chunk number range
    if (chunkNumber < 1 || chunkNumber > totalChunks) {
      console.error(`❌ Invalid chunk number: ${chunkNumber}/${totalChunks}`);
      return NextResponse.json(
        {
          success: false,
          message: `Invalid chunk number: ${chunkNumber}/${totalChunks}`,
        },
        { status: 422 }
      );
    }

    console.log(
      `📝 Generating presigned URL for chunk ${chunkNumber}/${totalChunks}`
    );
    console.log(`📄 File: ${fileName}`);
    console.log(`🆔 File ID: ${fileId}`);
    console.log(`📏 Chunk size: ${chunkSize} bytes`);

    // S3 key for the chunk
    const chunkKey = `uploads/chunks/${fileId}/chunk_${chunkNumber
      .toString()
      .padStart(4, "0")}`;

    console.log(`☁️ Generating presigned URL for S3 key: ${chunkKey}`);

    // Create S3 client and generate presigned POST
    const s3Client = createS3Client();

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: AWS_CONFIG.bucket,
      Key: chunkKey,
      Conditions: [
        ["content-length-range", 0, chunkSize + 1000], // Allow slight size variance
        ["starts-with", "$Content-Type", "application/octet-stream"],
      ],
      Fields: {
        "Content-Type": "application/octet-stream",
      },
      Expires: 3600, // 1 hour expiration
    });

    console.log(
      `✅ Presigned URL generated successfully for chunk ${chunkNumber}`
    );

    return NextResponse.json({
      success: true,
      message: `Presigned URL generated for chunk ${chunkNumber}`,
      chunkNumber,
      totalChunks,
      fileId,
      s3Key: chunkKey,
      uploadUrl: url,
      uploadFields: fields,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("💥 Presigned URL generation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Presigned URL generation failed",
        error: error instanceof Error ? error.message : "Unknown error",
        errorCode: "PRESIGNED_URL_FAILED",
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
