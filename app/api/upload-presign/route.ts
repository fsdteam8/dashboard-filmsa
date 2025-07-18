import { type NextRequest, NextResponse } from "next/server";
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createS3Client, AWS_CONFIG } from "@/lib/aws-s3";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Starting multipart upload initialization");

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

    const body = await request.json();
    const { fileName, fileId, contentType, totalChunks } = body;

    // Validation
    if (!fileName || !fileId || !contentType || !totalChunks) {
      console.error("❌ Missing required parameters");
      return NextResponse.json(
        {
          success: false,
          message: "Missing required parameters",
          errors: {
            fileName: !fileName ? ["File name is required"] : undefined,
            fileId: !fileId ? ["File ID is required"] : undefined,
            contentType: !contentType
              ? ["Content type is required"]
              : undefined,
            totalChunks: !totalChunks
              ? ["Total chunks is required"]
              : undefined,
          },
        },
        { status: 422 }
      );
    }

    console.log(`📄 Initializing multipart upload for: ${fileName}`);
    console.log(`🆔 File ID: ${fileId}`);
    console.log(`🎬 Content Type: ${contentType}`);
    console.log(`🧩 Total chunks: ${totalChunks}`);

    // Generate unique filename for final file
    const timestamp = Date.now();
    const extension = fileName.split(".").pop() || "bin";
    const uniqueFileName = `${fileId}_${timestamp}.${extension}`;
    const finalFileKey = `uploads/videos/${uniqueFileName}`;

    console.log(`📁 S3 Key: ${finalFileKey}`);

    // Create S3 client and initialize multipart upload
    const s3Client = createS3Client();

    const createMultipartCommand = new CreateMultipartUploadCommand({
      Bucket: AWS_CONFIG.bucket,
      Key: finalFileKey,
      ContentType: contentType,
      Metadata: {
        originalFileName: fileName,
        fileId: fileId,
        totalChunks: totalChunks.toString(),
        uploadedAt: new Date().toISOString(),
        uploadMethod: "s3-multipart",
      },
    });

    const multipartResult = await s3Client.send(createMultipartCommand);

    if (!multipartResult.UploadId) {
      throw new Error("Failed to initialize multipart upload");
    }

    console.log(
      `✅ Multipart upload initialized with ID: ${multipartResult.UploadId}`
    );

    return NextResponse.json({
      success: true,
      message: "Multipart upload initialized successfully",
      uploadId: multipartResult.UploadId,
      fileId: fileId,
      s3Key: finalFileKey,
      fileName: uniqueFileName,
      originalName: fileName,
      contentType: contentType,
      totalChunks: totalChunks,
    });
  } catch (error) {
    console.error("💥 Multipart upload initialization failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Multipart upload initialization failed",
        error: error instanceof Error ? error.message : "Unknown error",
        errorCode: "MULTIPART_INIT_FAILED",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("📝 Presigned URL request for chunk upload");

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
    const uploadId = searchParams.get("uploadId") || "";
    const partNumber = Number.parseInt(searchParams.get("partNumber") || "0");
    const s3Key = searchParams.get("s3Key") || "";

    // Validation
    if (!uploadId || !partNumber || !s3Key) {
      console.error("❌ Missing required parameters for chunk upload");
      return NextResponse.json(
        {
          success: false,
          message: "Missing required parameters",
          errors: {
            uploadId: !uploadId ? ["Upload ID is required"] : undefined,
            partNumber: !partNumber ? ["Part number is required"] : undefined,
            s3Key: !s3Key ? ["S3 key is required"] : undefined,
          },
        },
        { status: 422 }
      );
    }

    console.log(`📝 Generating presigned URL for part ${partNumber}`);
    console.log(`🆔 Upload ID: ${uploadId}`);
    console.log(`🔑 S3 Key: ${s3Key}`);

    // Create S3 client and generate presigned URL for upload part
    const s3Client = createS3Client();

    const uploadPartCommand = new UploadPartCommand({
      Bucket: AWS_CONFIG.bucket,
      Key: s3Key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    const presignedUrl = await getSignedUrl(s3Client, uploadPartCommand, {
      expiresIn: 3600, // 1 hour expiration
    });

    console.log(`✅ Presigned URL generated for part ${partNumber}`);

    return NextResponse.json({
      success: true,
      message: `Presigned URL generated for part ${partNumber}`,
      partNumber,
      uploadId,
      s3Key,
      presignedUrl,
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
