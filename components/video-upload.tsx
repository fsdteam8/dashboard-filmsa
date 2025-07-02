"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Upload, X, Play, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import {
  validateFile,
  formatFileSize,
  generateFileId,
  DEFAULT_CONFIG,
  type ChunkUploadResult,
} from "@/lib/upload-utils"

interface VideoUploadProps {
  label: string
  onFileChange: (file: File | null) => void
  currentVideo?: string
  required?: boolean
  apiEndpoint?: string
}

export function VideoUpload({
  label,
  onFileChange,
  currentVideo,
  required = false,
  apiEndpoint = "/api",
}: VideoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentVideo || null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [currentChunk, setCurrentChunk] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Configuration constants
  const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
  const MAX_RETRIES = 3
  const RETRY_DELAY = 1000 // 1 second base delay

  // File validation function
  const validateVideoFile = (file: File) => validateFile(file, DEFAULT_CONFIG)

  // Format file size helper function

  // Upload single chunk to server function
  const uploadSingleChunk = async (
    chunk: Blob,
    chunkNumber: number,
    totalChunks: number,
    fileName: string,
    fileId: string,
    signal: AbortSignal,
  ): Promise<boolean> => {
    console.log(`📤 Uploading chunk ${chunkNumber}/${totalChunks}`)
    console.log(`📦 Chunk size: ${formatFileSize(chunk.size)}`)

    const formData = new FormData()
    formData.append("chunk", chunk)
    formData.append("chunkNumber", chunkNumber.toString())
    formData.append("totalChunks", totalChunks.toString())
    formData.append("fileName", fileName)
    formData.append("fileId", fileId)

    try {
      const response = await fetch(`${apiEndpoint}/upload-chunk`, {
        method: "POST",
        body: formData,
        signal,
        headers: {
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
      })

      console.log(`📊 Response status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ HTTP error for chunk ${chunkNumber}: ${response.status} - ${errorText}`)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const result = await response.json()
      console.log(`📋 Chunk ${chunkNumber} response:`, result)

      if (!result.success) {
        throw new Error(result.message || `Chunk ${chunkNumber} upload failed`)
      }

      console.log(`✅ Chunk ${chunkNumber} uploaded successfully`)
      return true
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log(`🛑 Chunk ${chunkNumber} upload aborted`)
        throw error
      }
      console.error(`💥 Failed to upload chunk ${chunkNumber}:`, error)
      return false
    }
  }

  // Upload chunk with retry logic function
  const uploadChunkWithRetry = async (
    chunk: Blob,
    chunkNumber: number,
    totalChunks: number,
    fileName: string,
    fileId: string,
    signal: AbortSignal,
  ): Promise<void> => {
    let attempts = 0

    console.log(`🔄 Starting chunk ${chunkNumber} upload with retry logic`)

    while (attempts < MAX_RETRIES) {
      attempts++
      console.log(`🎯 Chunk ${chunkNumber} attempt ${attempts}/${MAX_RETRIES}`)

      try {
        const success = await uploadSingleChunk(chunk, chunkNumber, totalChunks, fileName, fileId, signal)
        if (success) {
          setCurrentChunk(chunkNumber)
          console.log(`🎉 Chunk ${chunkNumber} completed successfully on attempt ${attempts}`)
          return
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log(`🛑 Chunk ${chunkNumber} upload aborted during attempt ${attempts}`)
          throw error
        }
        console.error(`💥 Chunk ${chunkNumber} upload attempt ${attempts} failed:`, error)
      }

      if (attempts < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, attempts - 1)
        console.log(`⏳ Waiting ${delay}ms before retry for chunk ${chunkNumber}`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    console.error(`💀 Chunk ${chunkNumber} failed after ${MAX_RETRIES} attempts`)
    throw new Error(`Failed to upload chunk ${chunkNumber} after ${MAX_RETRIES} attempts`)
  }

  // Complete upload by assembling chunks on server function
  const completeUpload = async (fileName: string, fileId: string, signal: AbortSignal): Promise<ChunkUploadResult> => {
    console.log(`🏁 Completing upload for file: ${fileName}`)
    console.log(`🆔 File ID: ${fileId}`)

    try {
      const startTime = Date.now()
      const response = await fetch(`${apiEndpoint}/complete-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName, fileId }),
        signal,
      })

      const endTime = Date.now()
      const completionTime = endTime - startTime

      console.log(`⏱️ Upload completion time: ${completionTime}ms`)
      console.log(`📊 Completion response status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        console.error(`❌ HTTP error during completion: ${response.status}`)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log(`📋 Completion response:`, result)

      const success = result.success || true
      if (success) {
        console.log(`🎉 Upload completed successfully!`)
      } else {
        console.error(`❌ Upload completion failed:`, result.error)
      }

      return {
        success,
        fileId,
        error: result.error,
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log(`🛑 Upload completion aborted`)
        throw error
      }
      console.error(`💥 Failed to complete upload:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to complete upload",
      }
    }
  }

  // Main chunked upload function
  const uploadFileInChunks = async (file: File): Promise<ChunkUploadResult> => {
    const chunks = Math.ceil(file.size / CHUNK_SIZE)
    const fileId = generateFileId(file.name)

    console.log(`🚀 Starting chunked upload`)
    console.log(`📄 File: ${file.name}`)
    console.log(`📏 Size: ${formatFileSize(file.size)}`)
    console.log(`🧩 Total chunks: ${chunks}`)
    console.log(`📦 Chunk size: ${formatFileSize(CHUNK_SIZE)}`)
    console.log(`🆔 Generated file ID: ${fileId}`)

    setTotalChunks(chunks)
    setCurrentChunk(0)

    // Create new abort controller for this upload
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    try {
      setUploadStatus("uploading")
      setUploadProgress(0)

      const uploadStartTime = Date.now()

      // Upload chunks sequentially
      for (let i = 0; i < chunks; i++) {
        if (signal.aborted) {
          console.log(`🛑 Upload cancelled by user at chunk ${i + 1}`)
          throw new Error("Upload cancelled by user")
        }

        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)

        console.log(`\n📦 Preparing chunk ${i + 1}/${chunks}`)
        console.log(`📍 Byte range: ${start} - ${end}`)
        console.log(`📏 Chunk size: ${formatFileSize(chunk.size)}`)

        await uploadChunkWithRetry(chunk, i + 1, chunks, file.name, fileId, signal)

        // Update progress (reserve 10% for completion step)
        const progress = Math.round(((i + 1) / chunks) * 90)
        setUploadProgress(progress)
        console.log(`📈 Progress: ${progress}% (${i + 1}/${chunks} chunks completed)`)
      }

      const chunksUploadTime = Date.now() - uploadStartTime
      console.log(`\n🎯 All chunks uploaded in ${chunksUploadTime}ms`)
      console.log(`📊 Average chunk upload time: ${Math.round(chunksUploadTime / chunks)}ms`)

      // Complete the upload
      console.log(`🏁 Starting upload completion...`)
      setUploadProgress(95)

      const result = await completeUpload(file.name, fileId, signal)

      if (result.success) {
        const totalUploadTime = Date.now() - uploadStartTime
        setUploadProgress(100)
        setUploadStatus("success")
        console.log(`🎉 UPLOAD COMPLETED SUCCESSFULLY!`)
        console.log(`⏱️ Total upload time: ${totalUploadTime}ms`)
        console.log(`📊 Average speed: ${formatFileSize(Math.round(file.size / (totalUploadTime / 1000)))}/s`)
        return { success: true, fileId }
      } else {
        console.error(`❌ Upload completion failed:`, result.error)
        throw new Error(result.error || "Failed to complete upload")
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setUploadStatus("idle")
        setUploadProgress(0)
        setCurrentChunk(0)
        setTotalChunks(0)
        console.log(`🛑 Upload cancelled`)
        return { success: false, error: "Upload cancelled" }
      }

      setUploadStatus("error")
      console.error(`💀 Upload failed:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      }
    }
  }

  // Handle file selection and start upload
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) {
        console.log(`❌ No file selected`)
        return
      }

      console.log(`\n🎬 NEW VIDEO UPLOAD STARTED`)
      console.log(`📄 Selected file: ${file.name}`)
      console.log(`📏 File size: ${formatFileSize(file.size)}`)
      console.log(`🕒 Upload started at: ${new Date().toISOString()}`)

      // Validate file
      const validation = validateVideoFile(file)
      if (!validation.valid) {
        console.error(`❌ File validation failed: ${validation.error}`)
        toast.error(validation.error)
        return
      }

      setIsUploading(true)
      setRetryCount(0)

      try {
        const result = await uploadFileInChunks(file)

        if (result.success) {
          // Create preview URL for the uploaded file
          const reader = new FileReader()
          reader.onloadend = () => {
            setPreview(reader.result as string)
          }
          reader.readAsDataURL(file)

          setUploadedFileId(result.fileId || null)
          onFileChange(file)
          console.log(`🎉 SUCCESS: Video uploaded successfully!`)
          toast.success("Video uploaded successfully!")
        } else {
          console.error(`❌ FAILURE: ${result.error}`)
          toast.error(result.error || "Upload failed")
          setUploadProgress(0)
          setCurrentChunk(0)
          setTotalChunks(0)
        }
      } catch (error) {
        console.error(`💥 Upload error:`, error)
        toast.error("Upload failed. Please try again.")
        setUploadProgress(0)
        setUploadStatus("error")
        setCurrentChunk(0)
        setTotalChunks(0)
      } finally {
        setIsUploading(false)
        console.log(`🏁 Upload process finished at: ${new Date().toISOString()}`)
      }
    },
    [onFileChange, apiEndpoint],
  )

  // Retry failed upload
  const handleRetry = useCallback(async () => {
    if (fileInputRef.current?.files?.[0] && retryCount < MAX_RETRIES) {
      setRetryCount((prev) => prev + 1)
      const file = fileInputRef.current.files[0]

      console.log(`\n🔄 RETRYING UPLOAD`)
      console.log(`🎯 Retry attempt: ${retryCount + 1}/${MAX_RETRIES}`)
      console.log(`📄 File: ${file.name}`)

      setIsUploading(true)
      setUploadStatus("uploading")
      setUploadProgress(0)
      setCurrentChunk(0)

      try {
        const result = await uploadFileInChunks(file)

        if (result.success) {
          const reader = new FileReader()
          reader.onloadend = () => {
            setPreview(reader.result as string)
          }
          reader.readAsDataURL(file)

          setUploadedFileId(result.fileId || null)
          onFileChange(file)
          console.log(`🎉 RETRY SUCCESS: Video uploaded successfully!`)
          toast.success("Video uploaded successfully!")
        } else {
          console.error(`❌ RETRY FAILED: ${result.error}`)
          toast.error(result.error || "Upload failed")
        }
      } catch (error) {
        console.error(`💥 Retry upload error:`, error)
        toast.error("Upload failed. Please try again.")
        setUploadStatus("error")
      } finally {
        setIsUploading(false)
      }
    }
  }, [retryCount, onFileChange, apiEndpoint])

  // Cancel ongoing upload
  const handleCancel = useCallback(() => {
    console.log(`🛑 User cancelled upload`)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsUploading(false)
    setUploadProgress(0)
    setUploadStatus("idle")
    setCurrentChunk(0)
    setTotalChunks(0)
    toast.info("Upload cancelled")
  }, [])

  // Remove uploaded file
  const handleRemove = useCallback(() => {
    console.log(`🗑️ Removing uploaded file`)
    setPreview(null)
    setUploadProgress(0)
    setUploadStatus("idle")
    setUploadedFileId(null)
    setRetryCount(0)
    setCurrentChunk(0)
    setTotalChunks(0)
    onFileChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [onFileChange])

  // Open file picker
  const handleClick = useCallback(() => {
    if (!isUploading) {
      console.log(`📁 Opening file picker`)
      fileInputRef.current?.click()
    }
  }, [isUploading])

  // Get status icon based on current state
  const getStatusIcon = () => {
    switch (uploadStatus) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "uploading":
        return <Upload className="h-5 w-5 text-blue-500 animate-pulse" />
      default:
        return <Upload className="h-8 w-8 text-gray-400" />
    }
  }

  // Get status text based on current state
  const getStatusText = () => {
    switch (uploadStatus) {
      case "uploading":
        return totalChunks > 0
          ? `Uploading chunk ${currentChunk}/${totalChunks} (${uploadProgress}%)`
          : `Uploading video... ${uploadProgress}%`
      case "success":
        return "Video uploaded successfully"
      case "error":
        return "Upload failed"
      default:
        return "Upload your video file"
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      {preview && !isUploading && uploadStatus !== "error" ? (
        <div className="relative border-2 border-gray-600 rounded-lg p-4">
          <div className="relative w-full h-48 bg-gray-700 rounded flex items-center justify-center">
            <Play className="h-12 w-12 text-gray-400" />
            <span className="absolute bottom-2 left-2 text-xs text-gray-300 bg-black bg-opacity-50 px-2 py-1 rounded flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Video uploaded
            </span>
            {uploadedFileId && (
              <span className="absolute top-2 left-2 text-xs text-gray-300 bg-black bg-opacity-50 px-2 py-1 rounded">
                ID: {uploadedFileId.slice(-8)}
              </span>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <Button type="button" size="sm" variant="destructive" onClick={handleRemove} className="h-8 w-8 p-0">
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
            {totalChunks > 0 && (
              <p className="text-xs text-gray-500">
                Processing {formatFileSize(fileInputRef.current?.files?.[0]?.size || 0)} video file
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
              {retryCount >= MAX_RETRIES ? "Max Retries Reached" : `Retry (${retryCount}/${MAX_RETRIES})`}
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
            Large files will be uploaded in chunks for better reliability
            <br />
            Supported formats: MP4, AVI, MOV, WMV, FLV, WebM, MKV
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
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
        required={required && !preview}
      />
    </div>
  )
}
