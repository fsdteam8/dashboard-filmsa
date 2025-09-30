"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Series } from "@/lib/series-services";

interface SeriesFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    release_date: string;
    status: string;
  }) => void;
  editingSeries?: Series | null;
  isLoading?: boolean;
}

export function SeriesForm({
  isOpen,
  onClose,
  onSubmit,
  editingSeries,
  isLoading = false,
}: SeriesFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    release_date: "",
    status: "active",
  });

  useEffect(() => {
    if (editingSeries) {
      setFormData({
        title: editingSeries.title || "",
        description: editingSeries.description || "",
        release_date: editingSeries.release_date || "",
        status: editingSeries.status || "active",
      });
    } else {
      resetForm();
    }
  }, [editingSeries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      release_date: "",
      status: "active",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#111] border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingSeries ? "Edit Series" : "Create Series"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Series Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter series title..."
              className="bg-[#272727] border-gray-600 text-white"
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
              placeholder="Enter series description..."
              className="bg-[#272727] border-gray-600 text-white min-h-[100px]"
              required
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
              required
            />
          </div>
          <div>
            <Label>Status</Label>
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={isLoading}
              className="bg-white text-black hover:bg-gray-100 disabled:opacity-50"
            >
              {isLoading
                ? editingSeries
                  ? "Updating..."
                  : "Creating..."
                : editingSeries
                ? "Update Series"
                : "Create Series"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
