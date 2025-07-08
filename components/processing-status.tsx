"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react"

interface ProcessingStatusProps {
  fileId: string
  onProcessingComplete?: (hlsUrl: string) => void
}

export function ProcessingStatus({ fileId, onProcessingComplete }: ProcessingStatusProps) {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/processing-status/${fileId}`)
      const data = await response.json()

      if (data.success) {
        setStatus(data)
        setError(null)

        // If processing is complete and HLS is ready, notify parent
        if (data.processing.status === "completed" && data.hls?.ready && onProcessingComplete) {
          onProcessingComplete(data.hls.playlistUrl)
        }
      } else {
        setError(data.message || "Failed to check status")
      }
    } catch (err) {
      setError("Failed to check processing status")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()

    // Poll every 10 seconds if processing is not complete
    const interval = setInterval(() => {
      if (status?.processing?.status !== "completed") {
        checkStatus()
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [fileId, status?.processing?.status])

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
    if (error) return <AlertCircle className="h-5 w-5 text-red-500" />

    switch (status?.processing?.status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "in_progress":
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusText = () => {
    if (loading) return "Checking status..."
    if (error) return error

    switch (status?.processing?.status) {
      case "completed":
        return "Processing completed successfully!"
      case "in_progress":
        return `Processing video... (${status.processing.hlsFilesFound} files generated)`
      case "pending":
        return "Processing queued..."
      default:
        return "Unknown status"
    }
  }

  const getProgress = () => {
    if (status?.processing?.status === "completed") return 100
    if (status?.processing?.status === "in_progress") return 60
    if (status?.processing?.status === "pending") return 20
    return 0
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Video Processing Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{getStatusText()}</span>
            <span>{getProgress()}%</span>
          </div>
          <Progress value={getProgress()} className="w-full" />
        </div>

        {status && (
          <div className="space-y-2 text-sm text-gray-600">
            <div>File ID: {status.fileId}</div>
            {status.processing.segmentCount > 0 && <div>HLS Segments: {status.processing.segmentCount}</div>}
            {status.hls?.ready && <div className="text-green-600">✅ HLS stream ready for playback</div>}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={checkStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Status
          </Button>

          {status?.hls?.ready && (
            <Button size="sm" onClick={() => window.open(status.hls.playlistUrl, "_blank")}>
              View HLS Stream
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
