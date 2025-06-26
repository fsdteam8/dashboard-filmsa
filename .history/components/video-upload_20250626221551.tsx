"use client";

import type React from "react";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Play } from "lucide-react";

interface VideoUploadProps {
  label: string;
  onFileChange: (file: File | null) => void;
  currentVideo?: string;
  required?: boolean;
}

export function VideoUpload({
  label,
  onFileChange,
  currentVideo,
  required = false,
}: VideoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentVideo || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setIsUploading(true);
        setUploadProgress(0);

        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              setIsUploading(false);
              const reader = new FileReader();
              reader.onloadend = () => {
                setPreview(reader.result as string);
              };
              reader.readAsDataURL(file);
              // Call onFileChange after state updates are complete
              setTimeout(() => onFileChange(file), 0);
              return 100;
            }
            return prev + 10;
          });
        }, 200);
      }
    },
    [onFileChange]
  );

  const handleRemove = useCallback(() => {
    setPreview(null);
    setUploadProgress(0);
    setTimeout(() => onFileChange(null), 0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onFileChange]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {preview && !isUploading ? (
        <div className="relative border-2 border-gray-600 rounded-lg p-4">
          <div className="relative w-full h-48 bg-gray-700 rounded flex items-center justify-center">
            <Play className="h-12 w-12 text-gray-400" />
            <span className="absolute bottom-2 left-2 text-xs text-gray-300 bg-black bg-opacity-50 px-2 py-1 rounded">
              Video uploaded
            </span>
          </div>
          <div className="absolute top-2 right-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemove}
              className="h-8 w-8 p-0"
            >
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
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-400">Uploading video...</p>
          </div>
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-center text-sm text-gray-400 mt-2">
            {uploadProgress}%
          </p>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-400 mb-2">Upload your video file</p>
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
  );
}
