"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { VideoUpload } from "@/components/video-upload";
import { Play } from "lucide-react";
import type { Episode, Series, Season } from "@/lib/series-services";
import type { Genre } from "@/lib/services";

interface EpisodeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  editingEpisode?: Episode | null;
  seriesList: Series[];
  seasonsList: Season[];
  genresList: Genre[];
  isLoading?: boolean;
  onSeriesChange?: (seriesId: string) => void;
}

export function EpisodeForm({
  isOpen,
  onClose,
  onSubmit,
  editingEpisode,
  seriesList,
  seasonsList,
  genresList,
  isLoading = false,
  onSeriesChange,
}: EpisodeFormProps) {
  const [formData, setFormData] = useState({
    series_id: "",
    season_id: "",
    episode_number: "",
    title: "",
    synopsis: "",
    runtime_minutes: "",
    release_date: "",
    status: "draft",
    director_name: "",
    genre_id: "",
    publish: "public",
    schedule_date: "",
    schedule_time: "",
    duration: "",
    description: "",
  });

  const [videoUploadData, setVideoUploadData] = useState<any>(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);

  useEffect(() => {
    if (editingEpisode) {
      console.log("[v0] Loading episode data for editing:", editingEpisode);
      setFormData({
        series_id: editingEpisode.series_id?.toString() || "",
        season_id: editingEpisode.season_id?.toString() || "",
        episode_number: editingEpisode.episode_number?.toString() || "",
        title: editingEpisode.title || "",
        synopsis: editingEpisode.synopsis || "",
        runtime_minutes: editingEpisode.runtime_minutes?.toString() || "",
        release_date: editingEpisode.release_date || "",
        status: editingEpisode.status || "draft",
        director_name: editingEpisode.director_name || "",
        genre_id: editingEpisode.genre_id?.toString() || "",
        publish: editingEpisode.publish || "public",
        schedule_date: editingEpisode.schedule_date || "",
        schedule_time: editingEpisode.schedule_time || "",
        duration: editingEpisode.duration || "",
        description: editingEpisode.description || "",
      });

      if (editingEpisode.video1) {
        setVideoUploadData(
          typeof editingEpisode.video1 === "string"
            ? JSON.parse(editingEpisode.video1)
            : editingEpisode.video1
        );
      }
    } else {
      resetForm();
    }
  }, [editingEpisode]);

  const filteredSeasons = seasonsList.filter(
    (season) => season.series_id.toString() === formData.series_id
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 EPISODE FORM SUBMISSION STARTED");

    const data = new FormData();

    data.append("series_id", formData.series_id);
    data.append("season_id", formData.season_id);
    data.append("episode_number", formData.episode_number);
    data.append("title", formData.title);
    data.append("synopsis", formData.synopsis);
    data.append("status", formData.status);
    data.append("type", "episode");

    if (formData.release_date) {
      data.append("release_date", formData.release_date);
    }
    if (formData.runtime_minutes) {
      data.append("runtime_minutes", formData.runtime_minutes);
    }
    if (formData.publish) {
      data.append("publish", formData.publish);
    }
    if (formData.genre_id) {
      data.append("genre_id", formData.genre_id);
    }
    if (formData.director_name) {
      data.append("director_name", formData.director_name);
    }
    if (formData.duration) {
      data.append("duration", formData.duration);
    }
    if (formData.description) {
      data.append("description", formData.description);
    }

    if (formData.publish === "scheduled") {
      if (formData.schedule_date) {
        data.append("schedule_date", formData.schedule_date);
      }
      if (formData.schedule_time) {
        data.append("schedule_time", formData.schedule_time);
      }
    }

    if (videoUploadData) {
      data.append("video1", JSON.stringify(videoUploadData));
    }

    console.log("📤 Episode FormData contents:");
    for (const [key, value] of data.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    onSubmit(data);
  };

  const handleSeriesChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      series_id: value,
      season_id: "",
    }));
    if (onSeriesChange) {
      onSeriesChange(value);
    }
  };

  const handleVideoUpload = (file: File | null, uploadData?: any) => {
    console.log("🎬 Episode video upload completed:", { file, uploadData });
    if (uploadData) {
      setVideoUploadData(uploadData);
    } else {
      setVideoUploadData(null);
    }
  };

  const handleVideoUploadingChange = (uploading: boolean) => {
    setIsVideoUploading(uploading);
  };

  const resetForm = () => {
    setFormData({
      series_id: "",
      season_id: "",
      episode_number: "",
      title: "",
      synopsis: "",
      runtime_minutes: "",
      release_date: "",
      status: "draft",
      director_name: "",
      genre_id: "",
      publish: "public",
      schedule_date: "",
      schedule_time: "",
      duration: "",
      description: "",
    });
    setVideoUploadData(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#111] border-gray-700 text-white max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingEpisode ? "Edit Episode" : "Create Episode"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <VideoUpload
                label="Upload Episode Video"
                onFileChange={handleVideoUpload}
                onUploadingChange={handleVideoUploadingChange}
                currentVideo={editingEpisode?.video1}
              />
              {videoUploadData && (
                <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400 text-sm mb-3">
                    <Play className="h-4 w-4" />
                    <span className="font-medium">
                      Episode video uploaded successfully to S3
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
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Series *</Label>
                  <Select
                    value={formData.series_id}
                    onValueChange={handleSeriesChange}
                  >
                    <SelectTrigger className="bg-[#272727] border-gray-600 text-white">
                      <SelectValue placeholder="Select series" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] text-white border-gray-600">
                      {seriesList.map((series) => (
                        <SelectItem
                          key={series.id}
                          value={series.id.toString()}
                        >
                          {series.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Season *</Label>
                  <Select
                    value={formData.season_id}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, season_id: value }))
                    }
                    disabled={!formData.series_id}
                  >
                    <SelectTrigger className="bg-[#272727] border-gray-600 text-white">
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] text-white border-gray-600">
                      {filteredSeasons.map((season) => (
                        <SelectItem
                          key={season.id}
                          value={season.id.toString()}
                        >
                          {season.title} (Season {season.season_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="episode_number">Episode Number *</Label>
                  <Input
                    id="episode_number"
                    type="number"
                    min="1"
                    value={formData.episode_number}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        episode_number: e.target.value,
                      }))
                    }
                    className="bg-[#272727] border-gray-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="runtime_minutes">Runtime (minutes)</Label>
                  <Input
                    id="runtime_minutes"
                    type="number"
                    min="1"
                    value={formData.runtime_minutes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        runtime_minutes: e.target.value,
                      }))
                    }
                    className="bg-[#272727] border-gray-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">Episode Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter episode title..."
                  className="bg-[#272727] border-gray-600 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="synopsis">Synopsis *</Label>
                <Textarea
                  id="synopsis"
                  value={formData.synopsis}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      synopsis: e.target.value,
                    }))
                  }
                  placeholder="Enter episode synopsis..."
                  className="bg-[#272727] border-gray-600 text-white min-h-[100px]"
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
                  placeholder="Enter detailed description..."
                  className="bg-[#272727] border-gray-600 text-white min-h-[80px]"
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (HH:MM:SS)</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration: e.target.value,
                    }))
                  }
                  placeholder="00:40:00"
                  className="bg-[#272727] border-gray-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Genre</Label>
                <Select
                  value={formData.genre_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, genre_id: value }))
                  }
                >
                  <SelectTrigger className="bg-[#272727] border-gray-600 text-white">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] text-white border-gray-600">
                    {genresList.map((genre) => (
                      <SelectItem key={genre.id} value={genre.id.toString()}>
                        {genre.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="director_name">Director</Label>
                <Input
                  id="director_name"
                  value={formData.director_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      director_name: e.target.value,
                    }))
                  }
                  placeholder="Enter director name..."
                  className="bg-[#272727] border-gray-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="release_date">Release Date</Label>
                <Input
                  id="release_date"
                  type="date"
                  value={formData.release_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      release_date: e.target.value,
                    }))
                  }
                  className="bg-[#272727] border-gray-600 text-white"
                />
              </div>

              <div>
                <Label>Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="bg-[#272727] border-gray-600 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] text-white border-gray-600">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Publish Settings</Label>
                <RadioGroup
                  value={formData.publish}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, publish: value }))
                  }
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="draft">Draft</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="published">Published</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="scheduled" id="schedule" />
                    <Label htmlFor="scheduled">Schedule</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="archived" id="archive" />
                    <Label htmlFor="archived">Archive</Label>
                  </div>
                </RadioGroup>
                {formData.publish === "scheduled" && (
                  <div className="mt-4 space-y-2">
                    <Label>Schedule Publication</Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={formData.schedule_date}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            schedule_date: e.target.value,
                          }))
                        }
                        className="bg-[#272727] border-gray-600 text-white"
                      />
                      <Input
                        type="time"
                        value={formData.schedule_time}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            schedule_time: e.target.value,
                          }))
                        }
                        className="bg-[#272727] border-gray-600 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-gray-600 text-white hover:bg-gray-700 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isVideoUploading}
              className="bg-white text-black hover:bg-gray-100 disabled:opacity-50"
            >
              {isLoading
                ? editingEpisode
                  ? "Updating..."
                  : "Creating..."
                : editingEpisode
                ? "Update Episode"
                : "Create Episode"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
