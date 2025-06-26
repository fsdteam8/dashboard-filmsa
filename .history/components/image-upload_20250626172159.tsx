"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cloud-upload, X } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  label: string
  onFileChange: (file: File | null) => void
  currentImage?: string
  required?: boolean
}

export function ImageUpload({ label, onFileChange, currentImage, required = false }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      onFileChange(file)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onFileChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div>
      <Label>{label}</Label>
      {preview ? (
        <div className="relative border-2 border-gray-600 rounded-lg p-4">
          <div className="relative w-full h-48">
            <Image src={preview || "/placeholder.svg"} alt="Preview" fill className="object-cover rounded" />
          </div>
          <div className="absolute top-2 right-2 flex gap-2">
            <Button type="button" size="sm" variant="destructive" onClick={handleRemove} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            className="w-full mt-2 bg-white text-black hover:bg-gray-100"
          >
            Change Image
          </Button>
        </div>
      ) : (<CloudUpload />
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
          <CloudUpload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-400 mb-2">Drag and drop image here, or click add image</p>
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            className="bg-white text-black hover:bg-gray-100"
          >
            Add Image
          </Button>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        required={required && !preview}
      />
    </div>
  )
}
