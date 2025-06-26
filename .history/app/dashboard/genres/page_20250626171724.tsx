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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { genreService, type Genre } from "@/lib/services";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { ImageUpload } from "@/components/image-upload";
import { TableSkeleton } from "@/components/table-skeleton";

export default function GenresPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    thumbnail: null as File | null,
  });

  const queryClient = useQueryClient();

  const { data: genresData, isLoading } = useQuery({
    queryKey: ["genres"],
    queryFn: () => genreService.getGenres(1),
  });

  const createMutation = useMutation({
    mutationFn: genreService.createGenre,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["genres"] });
      setIsCreateOpen(false);
      setFormData({ name: "", thumbnail: null });
      toast.success("Genre created successfully");
    },
    onError: () => {
      toast.error("Failed to create genre");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      genreService.updateGenre(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["genres"] });
      setIsEditOpen(false);
      setEditingGenre(null);
      setFormData({ name: "", thumbnail: null });
      toast.success("Genre updated successfully");
    },
    onError: () => {
      toast.error("Failed to update genre");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: genreService.deleteGenre,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["genres"] });
      toast.success("Genre deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete genre");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    if (formData.thumbnail) {
      data.append("thumbnail", formData.thumbnail);
    }

    if (editingGenre) {
      updateMutation.mutate({ id: editingGenre.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (genre: Genre) => {
    setEditingGenre(genre);
    setFormData({ name: genre.name, thumbnail: null });
    setIsEditOpen(true);
  };

  // const genres = Array.isArray(genresData?.data) ? genresData.data : [];

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "#111" }}>
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="font-bold text-white headTitle">Genres</h1>
            <p className="text-white">Dashboard › Genres</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black hover:bg-gray-100 rounded-full py-6 px-6">
                Create Genres
                <Plus className="h-4 w-4 mr-2" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Create Genre</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Genres Title</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Type Title here..."
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <ImageUpload
                  label="Thumbnail"
                  onFileChange={(file) =>
                    setFormData((prev) => ({ ...prev, thumbnail: file }))
                  }
                  required
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-white text-black hover:bg-gray-100"
                  >
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card
          style={{ backgroundColor: "#272727" }}
          className="border-gray-700 w-full"
        >
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="*:text-[#E7E7E7] *:text-lg">
                  <TableHead className="text-gray-300 font-medium">
                    Genre Name
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Content
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Added
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              {isLoading ? (
                <TableSkeleton rows={5} columns={4} />
              ) : (
                <TableBody>
                  {genresData &&
                    genresData?.map((genre: Genre) => (
                      <TableRow
                        key={genre.id}
                        className="bg-[#272727] hover:bg-black *:text-white"
                      >
                        <TableCell className="flex items-center gap-3 py-4 ">
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/${genre.thumbnail}`}
                            alt={genre.name}
                            width={60}
                            height={40}
                            className="rounded object-cover"
                          />
                          <span className="text-white font-semibold text-[32px] leading-[160%]">
                            {genre.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-300">45</TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(genre.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(genre)}
                              className="text-gray-400 hover:text-white hover:bg-gray-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMutation.mutate(genre.id)}
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
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Edit Genre</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Genres Title</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Type Title here..."
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <ImageUpload
                label="Thumbnail"
                onFileChange={(file) =>
                  setFormData((prev) => ({ ...prev, thumbnail: file }))
                }
                currentImage={editingGenre?.thumbnail}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
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
