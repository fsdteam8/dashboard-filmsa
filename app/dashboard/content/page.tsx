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
  DialogFooter,
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
import { Edit, Trash2, Plus, Globe, Clock, Play, Star } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { ImageUpload } from "@/components/image-upload";
import { VideoUpload } from "@/components/video-upload";
import { TableSkeleton } from "@/components/table-skeleton";
import { Pagination } from "@/components/pagination";
import { useSession } from "next-auth/react";

export default function ContentPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isVideoUploading, setIsVideoUploading] = useState(false);

  const { data: session } = useSession();
  console.log(session.accessToken);
  // Cover confirmation modal states
  const [isCoverConfirmOpen, setIsCoverConfirmOpen] = useState(false);
  const [selectedContentForCover, setSelectedContentForCover] =
    useState<Content | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    director_name: "",
    genre_id: "",
    publish: "public",
    schedule: "",
    duration: "",
    image: null as File | null,
    profile_pic: null as File | null,
  });

  const [videoUploadData, setVideoUploadData] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: contentData, isLoading } = useQuery({
    queryKey: ["contents", currentPage],
    queryFn: () => contentService.getContents(currentPage),
  });

  const { data: genresData } = useQuery({
    queryKey: ["genres-all"],
    queryFn: () => genreService.getGenres(1),
  });

  // Cover API mutation
  const coverMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/cover`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken || ""}`,
          },
          body: JSON.stringify({
            content_id: contentId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to set cover");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] });
      setIsCoverConfirmOpen(false);
      setSelectedContentForCover(null);
      toast.success("Content set as cover successfully");
    },
    onError: (error) => {
      console.error("Set cover error:", error);
      toast.error("Failed to set content as cover");
    },
  });

  const createMutation = useMutation({
    mutationFn: contentService.createContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] });
      setIsCreateOpen(false);
      resetForm();
      toast.success("Content created successfully");
    },
    onError: (error) => {
      console.error("Create content error:", error);
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
      toast.success("Content updated successfully");
    },
    onError: (error) => {
      console.error("Update content error:", error);
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

  // Handle table row click for cover selection
  const handleRowClick = (content: Content, event: React.MouseEvent) => {
    // Prevent modal from opening if clicking on action buttons
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }

    setSelectedContentForCover(content);
    setIsCoverConfirmOpen(true);
  };

  // Handle cover confirmation
  const handleCoverConfirm = () => {
    if (selectedContentForCover) {
      coverMutation.mutate(selectedContentForCover.id);
    }
  };

  // Handle cover cancellation
  const handleCoverCancel = () => {
    setIsCoverConfirmOpen(false);
    setSelectedContentForCover(null);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      director_name: "",
      genre_id: "",
      publish: "public",
      schedule: "",
      duration: "",
      image: null,
      profile_pic: null,
    });
    setVideoUploadData(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 FORM SUBMISSION STARTED");
    console.log("=".repeat(50));

    console.log("📋 FORM DATA:");
    console.log("  Title:", formData.title);
    console.log("  Description:", formData.description);
    console.log("  Director:", formData.director_name);
    console.log("  Genre ID:", formData.genre_id);
    console.log("  Publish:", formData.publish);
    console.log("  Schedule:", formData.schedule);
    console.log("  Duration:", formData.duration);

    console.log("\n📹 VIDEO UPLOAD DATA (S3 URL):");
    if (videoUploadData) {
      console.log("  File ID:", videoUploadData.fileId);
      console.log("  Original File Name:", videoUploadData.originalFileName);
      console.log("  File Size:", videoUploadData.fileSizeFormatted);
      console.log("  Content Type:", videoUploadData.contentType);
      console.log("  S3 URL:", videoUploadData.s3Url);
    }

    const backendData = {
      title: formData.title,
      description: formData.description,
      director_name: formData.director_name,
      genre_id: Number.parseInt(formData.genre_id),
      publish: formData.publish,
      schedule: formData.schedule,
      duration: formData.duration,
      video_data: videoUploadData
        ? {
            file_id: videoUploadData.fileId,
            original_filename: videoUploadData.originalFileName,
            file_size: videoUploadData.fileSize,
            content_type: videoUploadData.contentType,
            s3_bucket: videoUploadData.s3Bucket,
            s3_region: videoUploadData.s3Region,
            s3_url: videoUploadData.s3Url,
            s3_key: videoUploadData.s3Key,
            upload_method: "chunked-s3-direct",
          }
        : null,
      has_image: !!formData.image,
      has_profile_pic: !!formData.profile_pic,
      submitted_at: new Date().toISOString(),
    };

    console.log("\n📤 FINAL DATA TO SEND TO BACKEND:");
    console.log(JSON.stringify(backendData, null, 2));

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        if (value instanceof File) {
          data.append(key, value);
        } else {
          data.append(key, value.toString());
        }
      }
    });

    if (videoUploadData) {
      data.append("video1", JSON.stringify(videoUploadData));
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
        duration: fullContent.duration || "",
        image: null,
        profile_pic: null,
      });

      if (fullContent.video1) {
        try {
          const parsedS3Data =
            typeof fullContent.video1 === "string"
              ? JSON.parse(fullContent.video1)
              : fullContent.video1;
          setVideoUploadData(parsedS3Data);
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

  const handleVideoUpload = (file: File | null, uploadData?: any) => {
    console.log("🎬 Video upload completed:", { file, uploadData });
    if (uploadData) {
      setVideoUploadData(uploadData);
      console.log("💾 Stored video upload data:", uploadData);
    } else {
      setVideoUploadData(null);
    }
  };

  const handleVideoUploadingChange = (uploading: boolean) => {
    setIsVideoUploading(uploading);
  };

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
                      onUploadingChange={handleVideoUploadingChange}
                    />
                    {videoUploadData && (
                      <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                        <div className="flex items-center gap-2 text-green-400 text-sm mb-3">
                          <Play className="h-4 w-4" />
                          <span className="font-medium">
                            Video uploaded successfully to S3
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-300">
                          <div>
                            <span className="text-gray-400">File ID:</span>
                            <br />
                            <span className="text-white">
                              {videoUploadData.fileId}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Size:</span>
                            <br />
                            <span className="text-white">
                              {videoUploadData.fileSizeFormatted}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-400">S3 URL:</span>
                            <br />
                            <code className="text-white break-all">
                              {videoUploadData.s3Url}
                            </code>
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
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            duration: e.target.value,
                          }))
                        }
                        placeholder="e.g., 2:30 or 150 seconds"
                        className="bg-[#111] border-gray-600 text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Enter duration in format like "2:30" (minutes:seconds)
                        or "150 seconds"
                      </p>
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
                    disabled={createMutation.isPending || isVideoUploading}
                    className="bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending ? "Saving..." : "Save"}
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
                    Duration
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
                    Watch Time
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              {isLoading ? (
                <TableSkeleton rows={10} columns={8} />
              ) : (
                <TableBody>
                  {contentList.map((content: Content) => (
                    <TableRow
                      key={content.id}
                      className="border-[BFBFBF] hover:bg-gray-600 cursor-pointer"
                      style={{ backgroundColor: "#272727" }}
                      onClick={(e) => handleRowClick(content, e)}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Image
                              src={
                                content.image ||
                                "/placeholder.svg?height=60&width=80" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg"
                              }
                              alt={content.title}
                              width={80}
                              height={60}
                              className="rounded object-cover"
                            />
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
                            {content.video1 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {(() => {
                                  try {
                                    const videoData =
                                      typeof content.video1 === "string"
                                        ? JSON.parse(content.video1)
                                        : content.video1;
                                    return videoData?.s3Url ? (
                                      <a
                                        href={videoData.s3Url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:underline truncate block"
                                      >
                                        View S3 Video
                                      </a>
                                    ) : (
                                      "Video"
                                    );
                                  } catch {
                                    return "Video";
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {content.duration || "N/A"}
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
                      <TableCell className="text-gray-300">
                        {content.total_watch_time}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(content);
                            }}
                            className="text-gray-400 hover:text-white hover:bg-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(content.id);
                            }}
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

        {/* Cover Confirmation Modal */}
        <Dialog open={isCoverConfirmOpen} onOpenChange={setIsCoverConfirmOpen}>
          <DialogContent className="bg-[#111] border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Set as Cover
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-300">
                Are you sure you want to set "{selectedContentForCover?.title}"
                as the cover content?
              </p>
              {selectedContentForCover && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Image
                      src={
                        selectedContentForCover.image ||
                        "/placeholder.svg?height=40&width=60"
                      }
                      alt={selectedContentForCover.title}
                      width={60}
                      height={40}
                      className="rounded object-cover"
                    />
                    <div>
                      <h4 className="text-white font-medium text-sm">
                        {selectedContentForCover.title}
                      </h4>
                      <p className="text-gray-400 text-xs">
                        {selectedContentForCover.genre_name}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleCoverCancel}
                disabled={coverMutation.isPending}
                className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCoverConfirm}
                disabled={coverMutation.isPending}
                className="bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50"
              >
                {coverMutation.isPending ? "Setting..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog - Similar structure with duration field */}
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
                    onUploadingChange={handleVideoUploadingChange}
                  />
                  {videoUploadData && (
                    <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                      <div className="flex items-center gap-2 text-green-400 text-sm mb-3">
                        <Play className="h-4 w-4" />
                        <span className="font-medium">
                          Video uploaded successfully to S3
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-300">
                        <div>
                          <span className="text-gray-400">File ID:</span>
                          <br />
                          <span className="text-white">
                            {videoUploadData.fileId}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Size:</span>
                          <br />
                          <span className="text-white">
                            {videoUploadData.fileSizeFormatted}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-400">S3 URL:</span>
                          <br />
                          <code className="text-white break-all">
                            {videoUploadData.s3Url}
                          </code>
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
                    <Label htmlFor="edit-duration">Duration</Label>
                    <Input
                      id="edit-duration"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          duration: e.target.value,
                        }))
                      }
                      placeholder="e.g., 2:30 or 150 seconds"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Enter duration in format like "2:30" (minutes:seconds) or
                      "150 seconds"
                    </p>
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
                  disabled={updateMutation.isPending || isVideoUploading}
                  className="bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending ? "Saving..." : "Update"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
