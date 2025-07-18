import { type NextRequest, NextResponse } from "next/server";
import {
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  HeadObjectCommand,
  type CompletedPart,
} from "@aws-sdk/client-s3";
import { createS3Client, AWS_CONFIG } from "@/lib/aws-s3";

export async function POST(request: NextRequest) {
  try {
    console.log("🏁 Complete multipart upload request received");

    // Validate AWS configuration
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
    const { uploadId, s3Key, parts, fileName, fileId, contentType } = body;

    // Validation
    if (
      !uploadId ||
      !s3Key ||
      !parts ||
      !Array.isArray(parts) ||
      !fileName ||
      !fileId ||
      !contentType
    ) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
          errors: {
            uploadId: !uploadId ? ["Upload ID is required"] : undefined,
            s3Key: !s3Key ? ["S3 key is required"] : undefined,
            parts:
              !parts || !Array.isArray(parts)
                ? ["Parts array is required"]
                : undefined,
            fileName: !fileName ? ["File name is required"] : undefined,
            fileId: !fileId ? ["File ID is required"] : undefined,
            contentType: !contentType
              ? ["Content type is required"]
              : undefined,
          },
        },
        { status: 422 }
      );
    }

    console.log(`📄 Completing multipart upload for: ${fileName}`);
    console.log(`🆔 Upload ID: ${uploadId}`);
    console.log(`🔑 S3 Key: ${s3Key}`);
    console.log(`🧩 Parts to complete: ${parts.length}`);

    // Create S3 client
    const s3Client = createS3Client();

    // Sort parts by part number to ensure correct order
    const sortedParts: CompletedPart[] = parts
      .map((part: any) => ({
        ETag: part.ETag,
        PartNumber: part.PartNumber,
      }))
      .sort((a, b) => (a.PartNumber || 0) - (b.PartNumber || 0));

    console.log(
      `🔗 Completing multipart upload with ${sortedParts.length} parts`
    );

    try {
      // Complete the multipart upload
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: AWS_CONFIG.bucket,
        Key: s3Key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: sortedParts,
        },
      });

      const completeResult = await s3Client.send(completeCommand);

      console.log(`✅ Multipart upload completed successfully`);
      console.log(`📍 Location: ${completeResult.Location}`);

      // Get final file size from S3
      const headCommand = new HeadObjectCommand({
        Bucket: AWS_CONFIG.bucket,
        Key: s3Key,
      });
      const headResult = await s3Client.send(headCommand);
      const fileSize = headResult.ContentLength || 0;

      // Generate the final S3 URL
      const finalFileUrl = `https://${AWS_CONFIG.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${s3Key}`;

      console.log(`🎉 Upload completed! Final file URL: ${finalFileUrl}`);
      console.log(`📏 Final file size: ${fileSize} bytes`);

      return NextResponse.json({
        success: true,
        message: "File uploaded successfully using S3 multipart upload.",
        fileName: fileName,
        originalName: fileName.split("_")[0] + "." + fileName.split(".").pop(), // Extract original name
        fileSize: fileSize,
        fileId: fileId,
        contentType: contentType,
        s3Url: finalFileUrl, // The direct S3 URL
        s3Key: s3Key,
        uploadId: uploadId,
        partsCompleted: sortedParts.length,
        uploadTime: Date.now(),
        method: "s3-multipart-upload",
        location: completeResult.Location,
      });
    } catch (completeError) {
      console.error("💥 Failed to complete multipart upload:", completeError);

      // Abort the multipart upload on failure
      try {
        const abortCommand = new AbortMultipartUploadCommand({
          Bucket: AWS_CONFIG.bucket,
          Key: s3Key,
          UploadId: uploadId,
        });
        await s3Client.send(abortCommand);
        console.log(`🗑️ Aborted failed multipart upload: ${uploadId}`);
      } catch (abortError) {
        console.error("💥 Failed to abort multipart upload:", abortError);
      }

      return NextResponse.json(
        {
          success: false,
          message: "Failed to complete multipart upload",
          error:
            completeError instanceof Error
              ? completeError.message
              : "Unknown error",
          errorCode: "MULTIPART_COMPLETE_FAILED",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("💥 Upload completion failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Upload completion failed",
        error: error instanceof Error ? error.message : "Unknown error",
        errorCode: "UPLOAD_COMPLETION_FAILED",
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
