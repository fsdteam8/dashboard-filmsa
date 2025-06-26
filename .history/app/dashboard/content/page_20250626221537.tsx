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
import { Edit, Trash2, Plus, Globe, Clock } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { ImageUpload } from "@/components/image-upload";
import { VideoUpload } from "@/components/video-upload";
import { TableSkeleton } from "@/components/table-skeleton";
import { Pagination } from "@/components/pagination";

export default function ContentPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
// console.log(uploadProgress);
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
    mutationFn: (formData: FormData) =>
      contentService.createContent(formData, (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percent);
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contents"] });
      setIsCreateOpen(false);
      resetForm();
      setUploadProgress(0); // reset
      toast.success("Content created successfully");
    },
    onError: () => {
      setUploadProgress(0); // reset
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
    onError: () => {
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      setIsEditOpen(true);
    } catch (error) {
      toast.error("Failed to load content details");
    }
  };

  // Safe array initialization with null checks
  // const contentList = Array.isArray(contentData?.data?.data) ? contentData?.data?.data : [];
  const totalPages =
    contentData?.data?.total && contentData?.data?.per_page
      ? Math.ceil(contentData.data?.total / contentData.data?.per_page)
      : 1;
  // const genres = Array.isArray(genresData) ? genresData.data : [];
  // console.log(genresData);

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "#111" }}>
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center justify-between bg-[#111]">
          <div>
            <h1 className="headTitile">Content</h1>
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
                <DialogTitle className=" text-[48px]">Create Content</DialogTitle>
                <p className="text-gray-100 text-xl">
                  Dashboard › Content › Create Content
                </p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4 bg-[#272727] p-4 rounded-lg ">
                    <VideoUpload
                      label="Video"
                      onFileChange={(file) =>
                        setFormData((prev) => ({ ...prev, video1: file }))
                      }
                      required
                    />

                    <div className="space-y-2">
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

                    <div className="space-y-2">
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
                        <div className="flex items-center space-x-2 ">
                          <RadioGroupItem value="private" id="private" className="bg-gray-500" />
                          <Label htmlFor="private">Private</Label>
                        </div>
                        <div className="flex items-center space-x-2" >
                          <RadioGroupItem value="public" id="public"className="bg-gray-500"  />
                          <Label htmlFor="public">Public</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="schedule" id="schedule" className="bg-gray-500"  />
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
                  <div className="space-y-4 bg-[#272727] p-4 rounded-lg">
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
                    disabled={createMutation.isPending}
                    className="bg-white text-black hover:bg-gray-100"
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
              <TableHeader className="border-b">
                <TableRow className="border-none bg-[#272727] ">
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
                  {contentData?.data?.data?.map((content: Content) => (
                    <TableRow
                      key={content.id}
                      className="border-[BFBFBF] hover:bg-gray-600"
                      style={{ backgroundColor: "#272727" }}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          {/* <Image
                            src={
                              content.image ||
                              "/placeholder.svg?height=60&width=80"
                            }
                            alt={content.title}
                            width={80}
                            height={60}
                            className="rounded object-cover"
                          /> */}
                          <div className="relative h-[60px] w-[100px]">
                                                    <Image
                                                      src={content.image}
                                                      alt={content.image}
                                                      fill
                                                      className="object-cover rounded"
                                                    />
                                                  </div>
                          <div>
                            <h3 className="text-white font-medium">
                              {content.title}
                            </h3>
                            <p className="text-gray-400 text-sm truncate max-w-xs">
                              {content.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-transparent"
                        >
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

        {/* Edit Dialog */}
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
                    onFileChange={(file) =>
                      setFormData((prev) => ({ ...prev, video1: file }))
                    }
                    currentVideo={editingContent?.video1}
                  />

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

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="border-gray-600  bg-white !text-black hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  {updateMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
