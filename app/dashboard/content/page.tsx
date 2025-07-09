// @ts-nocheck
"use client";

import type React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { contentService, genreService, type Content } from "@/lib/services";
import {
  Edit,
  Trash2,
  Plus,
  Globe,
  Clock,
  Play,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { ImageUpload } from "@/components/image-upload";
import { VideoUpload } from "@/components/video-upload";
import { VideoStatusPoller } from "@/components/video-status-poller";
import { TableSkeleton } from "@/components/table-skeleton";
import { Pagination } from "@/components/pagination";

export default function ContentPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    director_name: "",
    genre_id: "",
    publish: "public",
    schedule: "",
    video1: null as File | null,
    image: null as File | null,
    profile_pic: null as File | null,
  });

  // Add this state at the top with other useState declarations
  const [autoSubmitWhenReady, setAutoSubmitWhenReady] = useState(false);
  const [isCompleteUploadLoading, setIsCompleteUploadLoading] = useState(false);

  // Store the upload data from VideoUpload component
  const [videoUploadData, setVideoUploadData] = useState<any>(null);
  // Store complete metadata after processing
  const [completeVideoMetadata, setCompleteVideoMetadata] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: contentData, isLoading } = useQuery({
    queryKey: ["contents", currentPage],
    queryFn: () => contentService.getContents(currentPage),
  });

  const { data: genresData } = useQuery({
    queryKey: ["genres-all"],
    queryFn: () => genreService.getGenres(1),
  });

  const createMutation = useMutation({
    mutationFn: contentService.createContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] });
      setIsCreateOpen(false);
      resetForm();
      setIsCompleteUploadLoading(false); // Reset loading
      toast.success("Content created successfully");
    },
    onError: (error) => {
      console.error("Create content error:", error);
      setIsCompleteUploadLoading(false); // Reset loading
      toast.error("Failed to create content");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      contentService.updateContent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] });
      setIsEditOpen(false);
      setEditingContent(null);
      resetForm();
      setIsCompleteUploadLoading(false); // Reset loading
      toast.success("Content updated successfully");
    },
    onError: (error) => {
      console.error("Update content error:", error);
      setIsCompleteUploadLoading(false); // Reset loading
      toast.error("Failed to update content");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: contentService.deleteContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] });
      toast.success("Content deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete content");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      director_name: "",
      genre_id: "",
      publish: "public",
      schedule: "",
      video1: null,
      image: null,
      profile_pic: null,
    });
    setVideoUploadData(null);
    setCompleteVideoMetadata(null);
    setIsCompleteUploadLoading(false); // Reset loading
  };

  // Modify the handleMetadataReady function
  const handleMetadataReady = (processingData: any) => {
    console.log("🎉 METADATA READY!");
    console.log("📊 Complete processing data:", processingData);

    setCompleteVideoMetadata(processingData);

    // Update the video upload data with complete metadata
    if (videoUploadData && processingData) {
      const updatedVideoData = {
        ...videoUploadData,
        metadata: {
          duration: processingData.metadata?.duration,
          durationFormatted: processingData.metadata?.durationFormatted,
          resolution: processingData.metadata?.resolution,
          width: processingData.metadata?.width,
          height: processingData.metadata?.height,
          codec: processingData.metadata?.video_codec,
          audioCodec: processingData.metadata?.audio_codec,
          bitrate: processingData.metadata?.bitrate,
          bitrateFormatted: processingData.metadata?.bitrateFormatted,
          frameRate: processingData.metadata?.frameRate,
          aspectRatio: processingData.metadata?.aspectRatio,
          format: processingData.metadata?.format,
          pixelFormat: processingData.metadata?.pixelFormat,
        },
        processing: {
          ...videoUploadData.processing,
          status: "completed",
          completedAt: new Date().toISOString(),
          mediaConvertJobId: processingData.processing?.mediaConvertJobId,
        },
        hls: {
          ...videoUploadData.hls,
          ready: true,
          segmentCount: processingData.hls?.segmentCount,
        },
      };

      setVideoUploadData(updatedVideoData);
      console.log(
        "✅ Updated video data with complete metadata:",
        updatedVideoData
      );

      // Auto-submit if flag is set
      if (autoSubmitWhenReady) {
        console.log("🚀 Auto-submitting form with complete metadata...");
        setAutoSubmitWhenReady(false);
        // Trigger form submission
        setTimeout(() => {
          const form = document.querySelector("form");
          if (form) {
            form.requestSubmit();
          }
        }, 100);
      }
    }
  };

  // Modify the handleSubmit function to set auto-submit flag
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Show loading state during complete upload
    setIsCompleteUploadLoading(true);

    // If video is uploaded but metadata is still processing, set auto-submit flag
    if (videoUploadData && !completeVideoMetadata) {
      setAutoSubmitWhenReady(true);
      toast.info(
        "Video is still processing. Form will auto-save when complete."
      );
      setIsCompleteUploadLoading(false);
      return;
    }

    // Rest of the existing handleSubmit code...
    console.log("🚀 FORM SUBMISSION STARTED");
    console.log("=".repeat(50));

    // Use complete metadata if available, otherwise use initial upload data
    const finalVideoData = completeVideoMetadata
      ? {
          ...videoUploadData,
          metadata: {
            duration: completeVideoMetadata.metadata?.duration,
            durationFormatted:
              completeVideoMetadata.metadata?.durationFormatted,
            resolution: completeVideoMetadata.metadata?.resolution,
            width: completeVideoMetadata.metadata?.width,
            height: completeVideoMetadata.metadata?.height,
            codec: completeVideoMetadata.metadata?.video_codec,
            audioCodec: completeVideoMetadata.metadata?.audio_codec,
            bitrate: completeVideoMetadata.metadata?.bitrate,
            bitrateFormatted: completeVideoMetadata.metadata?.bitrateFormatted,
            frameRate: completeVideoMetadata.metadata?.frameRate,
            aspectRatio: completeVideoMetadata.metadata?.aspectRatio,
          },
        }
      : videoUploadData;

    // Log form data
    console.log("📋 FORM DATA:");
    console.log("  Title:", formData.title);
    console.log("  Description:", formData.description);
    console.log("  Director:", formData.director_name);
    console.log("  Genre ID:", formData.genre_id);
    console.log("  Publish:", formData.publish);
    console.log("  Schedule:", formData.schedule);

    // Log video upload data (S3/HLS details)
    console.log("\n📹 FINAL VIDEO DATA WITH COMPLETE METADATA:");
    if (finalVideoData) {
      console.log("  File ID:", finalVideoData.fileId);
      console.log("  Original File Name:", finalVideoData.originalFileName);
      console.log("  File Size:", finalVideoData.fileSizeFormatted);
      console.log("  Content Type:", finalVideoData.contentType);

      console.log("\n  📊 COMPLETE VIDEO METADATA:");
      if (finalVideoData.metadata) {
        console.log(
          "    ⏱️ Duration:",
          finalVideoData.metadata.duration,
          "seconds"
        );
        console.log(
          "    ⏱️ Duration Formatted:",
          finalVideoData.metadata.durationFormatted
        );
        console.log("    📐 Resolution:", finalVideoData.metadata.resolution);
        console.log("    🎬 Video Codec:", finalVideoData.metadata.codec);
        console.log("    🔊 Audio Codec:", finalVideoData.metadata.audioCodec);
        console.log(
          "    📊 Bitrate:",
          finalVideoData.metadata.bitrateFormatted
        );
        console.log("    🎞️ Frame Rate:", finalVideoData.metadata.frameRate);
        console.log(
          "    📏 Aspect Ratio:",
          finalVideoData.metadata.aspectRatio
        );
      }

      console.log("\n  ☁️ S3 STORAGE:");
      if (finalVideoData.s3) {
        console.log("    Bucket:", finalVideoData.s3.bucket);
        console.log("    Region:", finalVideoData.s3.region);
        console.log(
          "    Original Video URL:",
          finalVideoData.s3.originalVideoUrl
        );
        console.log("    HLS Playlist URL:", finalVideoData.s3.hlsPlaylistUrl);
      }
    }

    // Prepare data for backend
    const backendData = {
      // Basic form fields
      title: formData.title,
      description: formData.description,
      director_name: formData.director_name,
      genre_id: Number.parseInt(formData.genre_id),
      publish: formData.publish,
      schedule: formData.schedule,

      // Video metadata (S3 details) - NO FILE, just metadata
      video_metadata: finalVideoData
        ? {
            file_id: finalVideoData.fileId,
            original_filename: finalVideoData.originalFileName,
            file_size: finalVideoData.fileSize,
            content_type: finalVideoData.contentType,
            // ✅ COMPLETE METADATA INCLUDING DURATION
            duration: finalVideoData.metadata?.duration,
            duration_formatted: finalVideoData.metadata?.durationFormatted,
            resolution: finalVideoData.metadata?.resolution,
            width: finalVideoData.metadata?.width,
            height: finalVideoData.metadata?.height,
            video_codec: finalVideoData.metadata?.codec,
            audio_codec: finalVideoData.metadata?.audioCodec,
            bitrate: finalVideoData.metadata?.bitrate,
            frame_rate: finalVideoData.metadata?.frameRate,
            aspect_ratio: finalVideoData.metadata?.aspectRatio,
            s3_bucket: finalVideoData.s3?.bucket,
            s3_region: finalVideoData.s3?.region,
            original_video_url: finalVideoData.s3?.originalVideoUrl,
            hls_playlist_url: finalVideoData.s3?.hlsPlaylistUrl,
            mediaconvert_job_id:
              completeVideoMetadata?.processing?.mediaConvertJobId,
            processing_status: "completed",
            upload_method: "chunked-s3-hls",
          }
        : null,

      // File uploads (images only, no video file)
      has_image: !!formData.image,
      has_profile_pic: !!formData.profile_pic,

      // Timestamps
      submitted_at: new Date().toISOString(),
    };

    console.log("\n📤 FINAL DATA TO SEND TO BACKEND:");
    console.log(JSON.stringify(backendData, null, 2));

    // Prepare FormData for actual submission
    const data = new FormData();

    // Add all form fields EXCEPT the video file
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "video1" && value !== null && value !== "") {
        // Skip video1 file
        if (value instanceof File) {
          data.append(key, value);
        } else {
          data.append(key, value.toString());
        }
      }
    });

    // Add video upload data as JSON string (S3 details only, not the file)
    if (finalVideoData) {
      data.append("video_metadata", JSON.stringify(finalVideoData));
    }

    console.log("\n🚀 SUBMITTING TO API...");
    console.log("=".repeat(50));

    if (editingContent) {
      updateMutation.mutate({ id: editingContent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = async (content: Content) => {
    try {
      const fullContent = await contentService.getContent(content.id);
      setEditingContent(fullContent);
      setFormData({
        title: fullContent.title,
        description: fullContent.description,
        director_name: fullContent.director_name || "",
        genre_id: fullContent.genre_id.toString(),
        publish: fullContent.publish,
        schedule: fullContent.schedule || "",
        video1: null,
        image: null,
        profile_pic: null,
      });

      // If content has video1, parse and set it
      if (fullContent.video1) {
        try {
          const parsedS3Data =
            typeof fullContent.video1 === "string"
              ? JSON.parse(fullContent.video1)
              : fullContent.video1;
          setVideoUploadData(parsedS3Data);
          setCompleteVideoMetadata(parsedS3Data); // Assume existing data is complete
          console.log("📋 Loaded existing video1:", parsedS3Data);
        } catch (error) {
          console.error("❌ Failed to parse video1:", error);
        }
      }
      setIsEditOpen(true);
    } catch (error) {
      toast.error("Failed to load content details");
    }
  };

  // Handle video upload completion
  const handleVideoUpload = (file: File | null, uploadData?: any) => {
    console.log("🎬 Video upload completed:", { file, uploadData });
    setFormData((prev) => ({ ...prev, video1: file }));
    if (uploadData) {
      setVideoUploadData(uploadData);
      setCompleteVideoMetadata(null); // Reset complete metadata for new upload
      console.log("💾 Stored video upload data:", uploadData);
    } else {
      setVideoUploadData(null);
      setCompleteVideoMetadata(null);
    }
  };

  // Get the best available metadata
  const getDisplayMetadata = () => {
    if (completeVideoMetadata?.metadata) {
      return {
        duration:
          completeVideoMetadata.metadata.durationFormatted ||
          `${completeVideoMetadata.metadata.duration}s`,
        resolution: completeVideoMetadata.metadata.resolution,
        codec: completeVideoMetadata.metadata.video_codec,
        size: videoUploadData?.fileSizeFormatted,
      };
    }
    if (videoUploadData?.metadata) {
      return {
        duration:
          videoUploadData.metadata.durationFormatted ||
          `${videoUploadData.metadata.duration}s`,
        resolution: videoUploadData.metadata.resolution,
        codec: videoUploadData.metadata.codec,
        size: videoUploadData.fileSizeFormatted,
      };
    }
    return null;
  };

  // Safe array initialization with null checks
  const contentList = Array.isArray(contentData?.data?.data)
    ? contentData?.data?.data
    : [];
  const totalPages =
    contentData?.data?.total && contentData?.data?.per_page
      ? Math.ceil(contentData.data?.total / contentData.data?.per_page)
      : 1;

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "#111" }}>
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center justify-between bg-[#111]">
          <div>
            <h1 className="text-3xl font-bold text-white">Content</h1>
            <p className="text-gray-400">Dashboard › Content</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-6">
                Create Content
                <Plus className="h-4 w-4 mr-2" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111] border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Content</DialogTitle>
                <p className="text-gray-400">
                  Dashboard › Content › Create Content
                </p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <VideoUpload
                      label="Upload Video"
                      onFileChange={handleVideoUpload}
                    />

                    {/* Video Upload Status with Polling */}
                    {videoUploadData && (
                      <div className="space-y-3">
                        {/* Processing Status */}
                        <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                          <VideoStatusPoller
                            fileId={videoUploadData.fileId}
                            onMetadataReady={handleMetadataReady}
                          />
                        </div>

                        {/* Metadata Display */}
                        <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                          <div className="flex items-center gap-2 text-green-400 text-sm mb-3">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-medium">
                              {completeVideoMetadata
                                ? "Video processed with complete metadata"
                                : "Video uploaded successfully"}
                            </span>
                          </div>

                          {(() => {
                            const metadata = getDisplayMetadata();
                            return metadata ? (
                              <div className="grid grid-cols-2 gap-4 text-xs text-gray-300">
                                <div>
                                  <span className="text-gray-400">
                                    Duration:
                                  </span>
                                  <br />
                                  <span className="text-white">
                                    {metadata.duration || "Processing..."}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400">
                                    Resolution:
                                  </span>
                                  <br />
                                  <span className="text-white">
                                    {metadata.resolution || "Processing..."}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Codec:</span>
                                  <br />
                                  <span className="text-white">
                                    {metadata.codec || "Processing..."}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Size:</span>
                                  <br />
                                  <span className="text-white">
                                    {metadata.size}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400">
                                Extracting video metadata...
                              </div>
                            );
                          })()}

                          <div className="mt-3 pt-3 border-t border-green-700/30">
                            <div className="text-xs text-gray-400">
                              <div>File ID: {videoUploadData.fileId}</div>
                              <div className="truncate">
                                HLS URL: {videoUploadData.hls?.playlistUrl}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Type Title here..."
                        className="bg-[#111] border-gray-600 text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Type description here..."
                        className="bg-[#111] border-gray-600 text-white min-h-[120px]"
                        required
                      />
                    </div>

                    <div>
                      <Label>Save or publish</Label>
                      <RadioGroup
                        value={formData.publish}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, publish: value }))
                        }
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="private"
                            id="private"
                            className="bg-gray-500"
                          />
                          <Label htmlFor="private">Private</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="public"
                            id="public"
                            className="bg-gray-500"
                          />
                          <Label htmlFor="public">Public</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="schedule"
                            id="schedule"
                            className="bg-gray-500"
                          />
                          <Label htmlFor="schedule">Schedule</Label>
                        </div>
                      </RadioGroup>
                      {formData.publish === "schedule" && (
                        <div className="mt-4 space-y-2">
                          <Label>Schedule as public</Label>
                          <div className="flex gap-2">
                            <Input
                              type="date"
                              value={formData.schedule.split(" ")[0] || ""}
                              onChange={(e) => {
                                const time =
                                  formData.schedule.split(" ")[1] || "00:00:00";
                                setFormData((prev) => ({
                                  ...prev,
                                  schedule: `${e.target.value} ${time}`,
                                }));
                              }}
                              className="bg-[#111] border-gray-600 text-white"
                            />
                            <Input
                              type="time"
                              value={
                                formData.schedule
                                  .split(" ")[1]
                                  ?.substring(0, 5) || ""
                              }
                              onChange={(e) => {
                                const date =
                                  formData.schedule.split(" ")[0] ||
                                  new Date().toISOString().split("T")[0];
                                setFormData((prev) => ({
                                  ...prev,
                                  schedule: `${date} ${e.target.value}:00`,
                                }));
                              }}
                              className="bg-[#111] border-gray-600 text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <Label>Genres</Label>
                      <Select
                        value={formData.genre_id}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, genre_id: value }))
                        }
                      >
                        <SelectTrigger className="bg-transparent border-gray-600 text-white">
                          <SelectValue placeholder="Select genre" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] text-white border-gray-600">
                          {genresData?.map((genre) => (
                            <SelectItem
                              key={genre.id}
                              value={genre.id.toString()}
                            >
                              {genre.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <ImageUpload
                      label="Thumbnail"
                      onFileChange={(file) =>
                        setFormData((prev) => ({ ...prev, image: file }))
                      }
                      required
                    />

                    <div>
                      <Label htmlFor="director">Director</Label>
                      <Input
                        id="director"
                        value={formData.director_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            director_name: e.target.value,
                          }))
                        }
                        placeholder="Type Director Name here..."
                        className="bg-[#111] border-gray-600 text-white"
                      />
                    </div>

                    <ImageUpload
                      label="Director's photo"
                      onFileChange={(file) =>
                        setFormData((prev) => ({ ...prev, profile_pic: file }))
                      }
                    />
                  </div>
                </div>

                {isCompleteUploadLoading && (
                  <div className="flex items-center justify-center gap-2 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
                    <span className="text-blue-400 text-sm">
                      Saving content with video metadata...
                    </span>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="border-gray-600 text-black hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isCompleteUploadLoading ||
                      createMutation.isPending ||
                      (videoUploadData && !completeVideoMetadata) // Disable if video uploaded but metadata not ready
                    }
                    className="bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCompleteUploadLoading
                      ? "Saving Content..."
                      : createMutation.isPending
                      ? "Processing..."
                      : videoUploadData && !completeVideoMetadata
                      ? "Processing Video..."
                      : "Save"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card
          style={{ backgroundColor: "#272727" }}
          className="bg-[#272727] border-none rounded-lg"
        >
          <CardContent className="p-0 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-none bg-[#272727]">
                  <TableHead className="text-gray-300 font-medium">
                    Video
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Visibility
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Genres
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Date
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Views
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Likes
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              {isLoading ? (
                <TableSkeleton rows={10} columns={7} />
              ) : (
                <TableBody>
                  {contentList.map((content: Content) => (
                    <TableRow
                      key={content.id}
                      className="border-[BFBFBF] hover:bg-gray-600"
                      style={{ backgroundColor: "#272727" }}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Image
                              src={
                                content.image ||
                                "/placeholder.svg?height=60&width=80" ||
                                "/placeholder.svg"
                              }
                              alt={content.title}
                              width={80}
                              height={60}
                              className="rounded object-cover"
                            />
                            {/* Play button overlay for videos with HLS */}
                            {content.video1 && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                                <Play className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-white font-medium">
                              {content.title}
                            </h3>
                            <p className="text-gray-400 text-sm truncate max-w-xs">
                              {content.description}
                            </p>
                            {/* Show video metadata if available */}
                            {content.video1 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {(() => {
                                  try {
                                    const videoData =
                                      typeof content.video1 === "string"
                                        ? JSON.parse(content.video1)
                                        : content.video1;
                                    return videoData?.metadata
                                      ?.durationFormatted
                                      ? `${
                                          videoData.metadata.durationFormatted
                                        } • ${
                                          videoData.metadata.resolution || "HD"
                                        }`
                                      : "Video";
                                  } catch {
                                    return "Video";
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-transparent">
                          {content.publish === "public" ? (
                            <>
                              <Globe className="h-3 w-3 mr-1" />
                              Public
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Schedule
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {content.genre_name}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(content.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {content.total_view}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {content.total_likes}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(content)}
                            className="text-gray-400 hover:text-white hover:bg-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(content.id)}
                            className="text-gray-400 hover:text-red-400 hover:bg-gray-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
            {contentData && (
              <Pagination
                currentPage={contentData.data.current_page || currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={contentData.data.total}
                itemsPerPage={contentData.data.per_page || 10}
              />
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog - Similar structure with polling */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Content</DialogTitle>
              <p className="text-gray-400">
                Dashboard › Content › Edit Content
              </p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <VideoUpload
                    label="Video"
                    onFileChange={handleVideoUpload}
                    currentVideo={editingContent?.video1}
                  />

                  {/* Video Upload Status for Edit */}
                  {videoUploadData && (
                    <div className="space-y-3">
                      {/* Processing Status */}
                      {!completeVideoMetadata && (
                        <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                          <VideoStatusPoller
                            fileId={videoUploadData.fileId}
                            onMetadataReady={handleMetadataReady}
                          />
                        </div>
                      )}

                      {/* Metadata Display */}
                      <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                        <div className="flex items-center gap-2 text-green-400 text-sm mb-3">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">
                            {completeVideoMetadata
                              ? "Video processed with complete metadata"
                              : "Video uploaded successfully"}
                          </span>
                        </div>

                        {(() => {
                          const metadata = getDisplayMetadata();
                          return metadata ? (
                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-300">
                              <div>
                                <span className="text-gray-400">Duration:</span>
                                <br />
                                <span className="text-white">
                                  {metadata.duration || "Processing..."}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  Resolution:
                                </span>
                                <br />
                                <span className="text-white">
                                  {metadata.resolution || "Processing..."}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Codec:</span>
                                <br />
                                <span className="text-white">
                                  {metadata.codec || "Processing..."}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Size:</span>
                                <br />
                                <span className="text-white">
                                  {metadata.size}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">
                              Extracting video metadata...
                            </div>
                          );
                        })()}

                        <div className="mt-3 pt-3 border-t border-green-700/30">
                          <div className="text-xs text-gray-400">
                            <div>File ID: {videoUploadData.fileId}</div>
                            <div className="truncate">
                              HLS URL: {videoUploadData.hls?.playlistUrl}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Type Title here..."
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Type description here..."
                      className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
                      required
                    />
                  </div>

                  <div>
                    <Label>Save or publish</Label>
                    <RadioGroup
                      value={formData.publish}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, publish: value }))
                      }
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="edit-private" />
                        <Label htmlFor="edit-private">Private</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public" id="edit-public" />
                        <Label htmlFor="edit-public">Public</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="schedule" id="edit-schedule" />
                        <Label htmlFor="edit-schedule">Schedule</Label>
                      </div>
                    </RadioGroup>
                    {formData.publish === "schedule" && (
                      <div className="mt-4 space-y-2">
                        <Label>Schedule as public</Label>
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            value={formData.schedule.split(" ")[0] || ""}
                            onChange={(e) => {
                              const time =
                                formData.schedule.split(" ")[1] || "00:00:00";
                              setFormData((prev) => ({
                                ...prev,
                                schedule: `${e.target.value} ${time}`,
                              }));
                            }}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                          <Input
                            type="time"
                            value={
                              formData.schedule
                                .split(" ")[1]
                                ?.substring(0, 5) || ""
                            }
                            onChange={(e) => {
                              const date =
                                formData.schedule.split(" ")[0] ||
                                new Date().toISOString().split("T")[0];
                              setFormData((prev) => ({
                                ...prev,
                                schedule: `${date} ${e.target.value}:00`,
                              }));
                            }}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <Label>Genres</Label>
                    <Select
                      value={formData.genre_id}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, genre_id: value }))
                      }
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {genresData?.map((genre) => (
                          <SelectItem
                            key={genre.id}
                            value={genre.id.toString()}
                          >
                            {genre.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <ImageUpload
                    label="Thumbnail"
                    onFileChange={(file) =>
                      setFormData((prev) => ({ ...prev, image: file }))
                    }
                    currentImage={editingContent?.image}
                  />

                  <div>
                    <Label htmlFor="edit-director">Director</Label>
                    <Input
                      id="edit-director"
                      value={formData.director_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          director_name: e.target.value,
                        }))
                      }
                      placeholder="Type Director Name here..."
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <ImageUpload
                    label="Director's photo"
                    onFileChange={(file) =>
                      setFormData((prev) => ({ ...prev, profile_pic: file }))
                    }
                    currentImage={editingContent?.profile_pic}
                  />
                </div>
              </div>

              {isCompleteUploadLoading && (
                <div className="flex items-center justify-center gap-2 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
                  <span className="text-blue-400 text-sm">
                    Saving content with video metadata...
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="border-gray-600 bg-white !text-black hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isCompleteUploadLoading ||
                    updateMutation.isPending ||
                    (videoUploadData && !completeVideoMetadata) // Disable if video uploaded but metadata not ready
                  }
                  className="bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCompleteUploadLoading
                    ? "Saving Content..."
                    : updateMutation.isPending
                    ? "Processing..."
                    : videoUploadData && !completeVideoMetadata
                    ? "Processing Video..."
                    : "Update"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
