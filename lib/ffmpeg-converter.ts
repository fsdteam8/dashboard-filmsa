import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execAsync = promisify(exec)

export interface HLSConversionResult {
  success: boolean
  error?: string
  outputDir?: string
  files?: string[]
  duration?: number
  resolution?: string
  conversionTime?: number
  skipped?: boolean
}

// Check if FFmpeg is available
export async function checkFFmpegAvailability(): Promise<boolean> {
  try {
    await execAsync("ffmpeg -version")
    return true
  } catch (error) {
    console.warn("⚠️ FFmpeg not found on system")
    return false
  }
}

export async function convertToHLS(inputVideoPath: string, fileId: string): Promise<HLSConversionResult> {
  const startTime = Date.now()

  try {
    console.log(`🎬 Starting HLS conversion for: ${inputVideoPath}`)

    // Check if FFmpeg is available
    const ffmpegAvailable = await checkFFmpegAvailability()

    if (!ffmpegAvailable) {
      console.warn("⚠️ FFmpeg not available - skipping HLS conversion")
      return {
        success: true,
        skipped: true,
        conversionTime: Date.now() - startTime,
        error: "FFmpeg not installed - HLS conversion skipped",
      }
    }

    // Create output directory
    const outputDir = `/tmp/hls_${fileId}`
    const fs = await import("fs")
    await fs.promises.mkdir(outputDir, { recursive: true })

    // Output paths
    const playlistPath = path.join(outputDir, "playlist.m3u8")
    const segmentPattern = path.join(outputDir, "segment_%03d.ts")

    // FFmpeg command for HLS conversion
    // -c:v libx264: Use H.264 codec for video
    // -c:a aac: Use AAC codec for audio
    // -hls_time 10: 10-second segments
    // -hls_list_size 0: Keep all segments in playlist
    // -hls_segment_filename: Pattern for segment files
    const ffmpegCommand = [
      "ffmpeg",
      "-i",
      `"${inputVideoPath}"`,
      "-c:v libx264",
      "-c:a aac",
      "-hls_time 10",
      "-hls_list_size 0",
      "-hls_segment_filename",
      `"${segmentPattern}"`,
      "-f hls",
      `"${playlistPath}"`,
    ].join(" ")

    console.log(`🔧 FFmpeg command: ${ffmpegCommand}`)

    // Execute FFmpeg conversion
    const { stdout, stderr } = await execAsync(ffmpegCommand, {
      timeout: 300000, // 5 minutes timeout
    })

    console.log(`📊 FFmpeg stdout:`, stdout)
    if (stderr) {
      console.log(`📊 FFmpeg stderr:`, stderr)
    }

    // Verify output files exist
    const files = await fs.promises.readdir(outputDir)
    const m3u8Files = files.filter((f) => f.endsWith(".m3u8"))
    const tsFiles = files.filter((f) => f.endsWith(".ts"))

    if (m3u8Files.length === 0) {
      throw new Error("No .m3u8 playlist file generated")
    }

    if (tsFiles.length === 0) {
      throw new Error("No .ts segment files generated")
    }

    console.log(`✅ HLS conversion successful:`)
    console.log(`📄 Playlist files: ${m3u8Files.length}`)
    console.log(`🎞️ Segment files: ${tsFiles.length}`)

    // Extract video information from FFmpeg output
    let duration: number | undefined
    let resolution: string | undefined

    // Parse duration and resolution from stderr (FFmpeg outputs info to stderr)
    const durationMatch = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/)
    if (durationMatch) {
      const hours = Number.parseInt(durationMatch[1])
      const minutes = Number.parseInt(durationMatch[2])
      const seconds = Number.parseFloat(durationMatch[3])
      duration = hours * 3600 + minutes * 60 + seconds
    }

    const resolutionMatch = stderr.match(/(\d{3,4}x\d{3,4})/)
    if (resolutionMatch) {
      resolution = resolutionMatch[1]
    }

    const conversionTime = Date.now() - startTime

    return {
      success: true,
      outputDir,
      files,
      duration,
      resolution,
      conversionTime,
    }
  } catch (error) {
    console.error(`💥 HLS conversion failed:`, error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown conversion error",
      conversionTime: Date.now() - startTime,
    }
  }
}

export async function getVideoInfo(inputVideoPath: string): Promise<{
  duration?: number
  resolution?: string
  bitrate?: string
  codec?: string
}> {
  try {
    const ffmpegAvailable = await checkFFmpegAvailability()

    if (!ffmpegAvailable) {
      console.warn("⚠️ FFmpeg not available - cannot get video info")
      return {}
    }

    const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${inputVideoPath}"`
    const { stdout } = await execAsync(command)

    const info = JSON.parse(stdout)
    const videoStream = info.streams?.find((s: any) => s.codec_type === "video")

    return {
      duration: Number.parseFloat(info.format?.duration || "0"),
      resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : undefined,
      bitrate: info.format?.bit_rate,
      codec: videoStream?.codec_name,
    }
  } catch (error) {
    console.error("Failed to get video info:", error)
    return {}
  }
}
