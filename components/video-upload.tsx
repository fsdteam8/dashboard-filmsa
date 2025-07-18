"use client";

import type React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Play, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  validateFile,
  formatFileSize,
  generateFileId,
  DEFAULT_CONFIG, // Import DEFAULT_CONFIG
  initializeMultipartUpload,
  getPartUploadUrl,
  uploadPart,
  completeMultipartUpload,
  type ChunkUploadResult,
  type PartUploadResult,
} from "@/lib/upload-utils";

interface VideoUploadProps {
  label: string;
  onFileChange: (file: File | null, uploadResult?: any) => void;
  currentVideo?: string;
  required?: boolean;
  apiEndpoint?: string;
  onUploadingChange?: (isUploading: boolean) => void; // New prop
}

export function VideoUpload({
  label,
  onFileChange,
  currentVideo,
  required = false,
  apiEndpoint = "/api",
  onUploadingChange, // Destructure new prop
}: VideoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentVideo || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false); // This state needs to be exposed
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use useEffect to call onUploadingChange whenever isUploading changes
  useEffect(() => {
    if (onUploadingChange) {
      onUploadingChange(isUploading);
    }
  }, [isUploading, onUploadingChange]);

  // Configuration constants - Using larger chunks for S3 multipart (minimum 5MB except last part)
  const CHUNK_SIZE = DEFAULT_CONFIG.chunkSize; // 10MB chunks
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second base delay

  // File validation function
  const validateVideoFile = (file: File) => validateFile(file, DEFAULT_CONFIG);

  // Generate the accept attribute string from DEFAULT_CONFIG.allowedTypes
  const acceptFileTypes = DEFAULT_CONFIG.allowedTypes.join(",");

  // Upload single part with retry logic
  const uploadPartWithRetry = async (
    presignedUrl: string,
    chunk: Blob,
    partNumber: number,
    signal: AbortSignal
  ): Promise<PartUploadResult> => {
    let attempts = 0;

    console.log(`🔄 Starting part ${partNumber} upload with retry logic`);

    while (attempts < MAX_RETRIES) {
      attempts++;
      console.log(`🎯 Part ${partNumber} attempt ${attempts}/${MAX_RETRIES}`);

      try {
        const result = await uploadPart(
          presignedUrl,
          chunk,
          partNumber,
          signal
        );
        console.log(
          `🎉 Part ${partNumber} completed successfully on attempt ${attempts}`
        );
        console.log(`📋 ETag: ${result.ETag}`);
        return result;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log(
            `🛑 Part ${partNumber} upload aborted during attempt ${attempts}`
          );
          throw error;
        }
        console.error(
          `💥 Part ${partNumber} upload attempt ${attempts} failed:`,
          error
        );
      }

      if (attempts < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, attempts - 1);
        console.log(
          `⏳ Waiting ${delay}ms before retry for part ${partNumber}`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.error(`💀 Part ${partNumber} failed after ${MAX_RETRIES} attempts`);
    throw new Error(
      `Failed to upload part ${partNumber} after ${MAX_RETRIES} attempts`
    );
  };

  // Main S3 multipart upload function
  const uploadFileWithMultipart = async (
    file: File
  ): Promise<ChunkUploadResult> => {
    const chunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileId = generateFileId(file.name);

    console.log(`🚀 Starting S3 multipart upload`);
    console.log(`📄 File: ${file.name}`);
    console.log(`📏 Size: ${formatFileSize(file.size)}`);
    console.log(`🧩 Total parts: ${chunks}`);
    console.log(`📦 Part size: ${formatFileSize(CHUNK_SIZE)}`);
    console.log(`🆔 Generated file ID: ${fileId}`);
    console.log(`🎬 Content Type: ${file.type}`);

    setTotalChunks(chunks);
    setCurrentChunk(0);

    // Create new abort controller for this upload
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setUploadStatus("uploading");
      setUploadProgress(0);

      const uploadStartTime = Date.now();

      // Step 1: Initialize multipart upload
      console.log(`\n🎬 Step 1: Initializing S3 multipart upload`);
      const initResult = await initializeMultipartUpload(
        apiEndpoint,
        file.name,
        fileId,
        file.type,
        chunks,
        signal
      );

      console.log(`✅ Multipart upload initialized`);
      console.log(`🆔 Upload ID: ${initResult.uploadId}`);
      console.log(`🔑 S3 Key: ${initResult.s3Key}`);

      setUploadProgress(5); // 5% for initialization

      // Step 2: Upload all parts
      console.log(`\n📦 Step 2: Uploading ${chunks} parts to S3`);
      const uploadedParts: Array<{ PartNumber: number; ETag: string }> = [];

      for (let i = 0; i < chunks; i++) {
        if (signal.aborted) {
          console.log(`🛑 Upload cancelled by user at part ${i + 1}`);
          throw new Error("Upload cancelled by user");
        }

        const partNumber = i + 1;
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        console.log(`\n📦 Preparing part ${partNumber}/${chunks}`);
        console.log(`📍 Byte range: ${start} - ${end}`);
        console.log(`📏 Part size: ${formatFileSize(chunk.size)}`);

        // Get presigned URL for this part
        const presignedUrl = await getPartUploadUrl(
          apiEndpoint,
          initResult.uploadId,
          partNumber,
          initResult.s3Key,
          signal
        );

        // Upload the part
        const partResult = await uploadPartWithRetry(
          presignedUrl,
          chunk,
          partNumber,
          signal
        );

        uploadedParts.push({
          PartNumber: partNumber,
          ETag: partResult.ETag,
        });

        setCurrentChunk(partNumber);

        // Update progress (reserve 10% for completion step)
        const progress = 5 + Math.round(((i + 1) / chunks) * 85);
        setUploadProgress(progress);
        console.log(
          `📈 Progress: ${progress}% (${i + 1}/${chunks} parts completed)`
        );
      }

      const partsUploadTime = Date.now() - uploadStartTime;
      console.log(`\n🎯 All parts uploaded in ${partsUploadTime}ms`);
      console.log(
        `📊 Average part upload time: ${Math.round(partsUploadTime / chunks)}ms`
      );

      // Step 3: Complete the multipart upload
      console.log(`\n🏁 Step 3: Completing multipart upload`);
      setUploadProgress(95);

      const result = await completeMultipartUpload(
        apiEndpoint,
        initResult.uploadId,
        initResult.s3Key,
        uploadedParts,
        initResult.fileName,
        fileId,
        file.type,
        signal
      );

      if (result.success) {
        const totalUploadTime = Date.now() - uploadStartTime;
        setUploadProgress(100);
        setUploadStatus("success");
        console.log(`🎉 S3 MULTIPART UPLOAD COMPLETED SUCCESSFULLY!`);
        console.log(`⏱️ Total upload time: ${totalUploadTime}ms`);
        console.log(
          `📊 Average speed: ${formatFileSize(
            Math.round(file.size / (totalUploadTime / 1000))
          )}/s`
        );
        console.log(`📍 Final S3 URL: ${result.s3Url}`);

        return {
          success: true,
          fileId,
          fileName: result.fileName,
          fileSize: result.fileSize,
          s3Url: result.s3Url,
          s3Key: result.s3Key,
          contentType: result.contentType,
          uploadId: result.uploadId,
          method: result.method,
        };
      } else {
        console.error(`❌ Multipart upload completion failed:`, result.error);
        throw new Error(result.error || "Failed to complete multipart upload");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setUploadStatus("idle");
        setUploadProgress(0);
        setCurrentChunk(0);
        setTotalChunks(0);
        console.log(`🛑 Upload cancelled`);
        return { success: false, error: "Upload cancelled" };
      }

      setUploadStatus("error");
      console.error(`💀 S3 multipart upload failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  };

  // Handle file selection and start upload
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        console.log(`❌ No file selected`);
        return;
      }

      console.log(`\n🎬 NEW S3 MULTIPART VIDEO UPLOAD STARTED`);
      console.log(`📄 Selected file: ${file.name}`);
      console.log(`📏 File size: ${formatFileSize(file.size)}`);
      console.log(`🕒 Upload started at: ${new Date().toISOString()}`);

      // Validate file
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        console.error(`❌ File validation failed: ${validation.error}`);
        toast.error(validation.error);
        return;
      }

      setIsUploading(true);
      setRetryCount(0);

      try {
        const result = await uploadFileWithMultipart(file);

        if (result.success) {
          // Create preview URL for the uploaded file
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string);
          };
          reader.readAsDataURL(file);

          setUploadedFileId(result.fileId || null);
          onFileChange(file, result); // Pass the upload result
          console.log(
            `🎉 SUCCESS: Video uploaded successfully using S3 multipart!`
          );
          toast.success("Video uploaded successfully!");
        } else {
          console.error(`❌ FAILURE: ${result.error}`);
          toast.error(result.error || "Upload failed");
          setUploadProgress(0);
          setCurrentChunk(0);
          setTotalChunks(0);
        }
      } catch (error) {
        console.error(`💥 Upload error:`, error);
        toast.error("Upload failed. Please try again.");
        setUploadProgress(0);
        setUploadStatus("error");
        setCurrentChunk(0);
        setTotalChunks(0);
      } finally {
        setIsUploading(false);
        console.log(
          `🏁 Upload process finished at: ${new Date().toISOString()}`
        );
      }
    },
    [onFileChange, apiEndpoint]
  );

  // Retry failed upload
  const handleRetry = useCallback(async () => {
    if (fileInputRef.current?.files?.[0] && retryCount < MAX_RETRIES) {
      setRetryCount((prev) => prev + 1);
      const file = fileInputRef.current.files[0];

      console.log(`\n🔄 RETRYING S3 MULTIPART UPLOAD`);
      console.log(`🎯 Retry attempt: ${retryCount + 1}/${MAX_RETRIES}`);
      console.log(`📄 File: ${file.name}`);

      setIsUploading(true);
      setUploadStatus("uploading");
      setUploadProgress(0);
      setCurrentChunk(0);

      try {
        const result = await uploadFileWithMultipart(file);

        if (result.success) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreview(reader.result as string);
          };
          reader.readAsDataURL(file);

          setUploadedFileId(result.fileId || null);
          onFileChange(file, result);
          console.log(`🎉 RETRY SUCCESS: Video uploaded successfully!`);
          toast.success("Video uploaded successfully!");
        } else {
          console.error(`❌ RETRY FAILED: ${result.error}`);
          toast.error(result.error || "Upload failed");
        }
      } catch (error) {
        console.error(`💥 Retry upload error:`, error);
        toast.error("Upload failed. Please try again.");
        setUploadStatus("error");
      } finally {
        setIsUploading(false);
      }
    }
  }, [retryCount, onFileChange, apiEndpoint]);

  // Cancel ongoing upload
  const handleCancel = useCallback(() => {
    console.log(`🛑 User cancelled upload`);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus("idle");
    setCurrentChunk(0);
    setTotalChunks(0);
    toast.info("Upload cancelled");
  }, []);

  // Remove uploaded file
  const handleRemove = useCallback(() => {
    console.log(`🗑️ Removing uploaded file`);
    setPreview(null);
    setUploadProgress(0);
    setUploadStatus("idle");
    setUploadedFileId(null);
    setRetryCount(0);
    setCurrentChunk(0);
    setTotalChunks(0);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onFileChange]);

  // Open file picker
  const handleClick = useCallback(() => {
    if (!isUploading) {
      console.log(`📁 Opening file picker`);
      fileInputRef.current?.click();
    }
  }, [isUploading]);

  // Get status icon based on current state
  const getStatusIcon = () => {
    switch (uploadStatus) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "uploading":
        return <Upload className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <Upload className="h-8 w-8 text-gray-400" />;
    }
  };

  // Get status text based on current state
  const getStatusText = () => {
    switch (uploadStatus) {
      case "uploading":
        return totalChunks > 0
          ? `Uploading part ${currentChunk}/${totalChunks} to S3 (${uploadProgress}%)`
          : `Initializing S3 multipart upload... ${uploadProgress}%`;
      case "success":
        return "Video uploaded successfully to S3";
      case "error":
        return "Upload failed";
      default:
        return "Upload your video file";
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      {preview && !isUploading && uploadStatus !== "error" ? (
        <div className="relative border-2 border-gray-600 rounded-lg p-4">
          <div className="relative w-full h-48 bg-gray-700 rounded flex items-center justify-center">
            <Play className="h-12 w-12 text-gray-400" />
            <span className="absolute bottom-2 left-2 text-xs text-gray-300 bg-black bg-opacity-50 px-2 py-1 rounded flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Video uploaded to S3
            </span>
            {uploadedFileId && (
              <span className="absolute top-2 left-2 text-xs text-gray-300 bg-black bg-opacity-50 px-2 py-1 rounded">
                ID: {uploadedFileId.slice(-8)}
              </span>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemove}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            className="w-full mt-2 bg-white text-black hover:bg-gray-100"
          >
            Change Video
          </Button>
        </div>
      ) : isUploading ? (
        <div className="border-2 border-gray-600 rounded-lg p-8">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              {getStatusIcon()}
              <p className="text-gray-400">{getStatusText()}</p>
            </div>
            {totalChunks > 0 && uploadStatus === "uploading" && (
              <p className="text-xs text-gray-500">
                Processing{" "}
                {formatFileSize(fileInputRef.current?.files?.[0]?.size || 0)}{" "}
                video file using S3 multipart upload
              </p>
            )}
          </div>
          <Progress value={uploadProgress} className="w-full mb-4" />
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="bg-white text-black hover:bg-gray-100"
            >
              Cancel Upload
            </Button>
          </div>
        </div>
      ) : uploadStatus === "error" ? (
        <div className="border-2 border-red-600 rounded-lg p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {getStatusIcon()}
            <p className="text-red-400">{getStatusText()}</p>
          </div>
          {fileInputRef.current?.files?.[0] && (
            <p className="text-xs text-gray-500 mb-4">
              Failed to upload: {fileInputRef.current.files[0].name} (
              {formatFileSize(fileInputRef.current.files[0].size)})
            </p>
          )}
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={retryCount >= MAX_RETRIES}
              className="bg-white text-black hover:bg-gray-100"
            >
              {retryCount >= MAX_RETRIES
                ? "Max Retries Reached"
                : `Retry (${retryCount}/${MAX_RETRIES})`}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClick}
              className="bg-white text-black hover:bg-gray-100"
            >
              Choose Different File
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-400 mb-2">Upload your video file</p>
          <p className="text-xs text-gray-500 mb-4">
            Large files will be uploaded using S3 multipart upload for maximum
            reliability
            <br />
            Supports files up to 5TB • All video formats supported
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            className="bg-white text-black hover:bg-gray-100"
          >
            Add Video
          </Button>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptFileTypes} // Use the dynamically generated accept string
        onChange={handleFileChange}
        className="hidden"
        required={required && !preview}
      />
    </div>
  );
}
