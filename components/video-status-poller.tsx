"use client"

import { useState, useEffect } from "react"
import { CheckCircle, RefreshCw, Clock } from "lucide-react"

interface VideoStatusPollerProps {
  fileId: string
  onMetadataReady?: (metadata: any) => void
}

export function VideoStatusPoller({ fileId, onMetadataReady }: VideoStatusPollerProps) {
  const [status, setStatus] = useState<any>(null)
  const [isPolling, setIsPolling] = useState(true)
  const [pollCount, setPollCount] = useState(0)

  useEffect(() => {
    if (!fileId || !isPolling) return

    const pollStatus = async () => {
      try {
        console.log(`🔄 Polling status for ${fileId} (attempt ${pollCount + 1})`)

        const response = await fetch(`/api/processing-status/${fileId}`)
        const data = await response.json()

        console.log(`📊 Status response:`, data)

        if (data.success) {
          setStatus(data)
          setPollCount((prev) => prev + 1)

          // If processing is complete and we have metadata, stop polling and notify parent
          if (data.processing?.status === "completed" && data.hls?.ready) {
            console.log(`✅ Processing complete for ${fileId}`)
            console.log(`📋 Metadata available:`, data.metadata)

            setIsPolling(false)
            if (onMetadataReady) {
              onMetadataReady(data)
            }
          }
        }
      } catch (error) {
        console.error("Failed to poll status:", error)
      }
    }

    // Poll immediately
    pollStatus()

    // Then poll every 3 seconds (faster polling)
    const interval = setInterval(pollStatus, 3000)

    // Stop polling after 2 minutes to prevent infinite polling
    const timeout = setTimeout(() => {
      console.log(`⏰ Stopping polling for ${fileId} after 2 minutes`)
      setIsPolling(false)
    }, 120000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [fileId, isPolling, onMetadataReady, pollCount])

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-yellow-400 text-sm">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Checking processing status...</span>
      </div>
    )
  }

  if (status.processing?.status === "completed") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>Processing complete - Metadata extracted!</span>
        </div>
        {status.metadata && (
          <div className="text-xs text-green-300">
            ✅ Duration: {status.metadata.durationFormatted || "N/A"} • Resolution:{" "}
            {status.metadata.resolution || "N/A"} • Codec: {status.metadata.video_codec || "N/A"}
          </div>
        )}
      </div>
    )
  }

  if (status.processing?.status === "in_progress") {
    return (
      <div className="flex items-center gap-2 text-blue-400 text-sm">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Processing video metadata... ({status.processing?.hlsFilesFound || 0} files generated)</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-yellow-400 text-sm">
      <Clock className="h-4 w-4" />
      <span>Processing queued... (Poll #{pollCount})</span>
    </div>
  )
}
