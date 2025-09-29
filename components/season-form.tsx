"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { Season, Series } from "@/lib/series-services"

interface SeasonFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    series_id: number
    season_number: number
    title: string
    release_date: string
    status: string
  }) => void
  editingSeason?: Season | null
  seriesList: Series[]
  isLoading?: boolean
}

export function SeasonForm({
  isOpen,
  onClose,
  onSubmit,
  editingSeason,
  seriesList,
  isLoading = false,
}: SeasonFormProps) {
  const [formData, setFormData] = useState({
    series_id: editingSeason?.series_id?.toString() || "",
    season_number: editingSeason?.season_number?.toString() || "",
    title: editingSeason?.title || "",
    release_date: editingSeason?.release_date || "",
    status: editingSeason?.status || "active",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      series_id: Number.parseInt(formData.series_id),
      season_number: Number.parseInt(formData.season_number),
      title: formData.title,
      release_date: formData.release_date,
      status: formData.status,
    })
  }

  const resetForm = () => {
    setFormData({
      series_id: "",
      season_number: "",
      title: "",
      release_date: "",
      status: "active",
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#111] border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingSeason ? "Edit Season" : "Create Season"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Series</Label>
            <Select
              value={formData.series_id}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, series_id: value }))}
            >
              <SelectTrigger className="bg-[#272727] border-gray-600 text-white">
                <SelectValue placeholder="Select series" />
              </SelectTrigger>
              <SelectContent className="bg-[#111] text-white border-gray-600">
                {seriesList.map((series) => (
                  <SelectItem key={series.id} value={series.id.toString()}>
                    {series.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="season_number">Season Number</Label>
            <Input
              id="season_number"
              type="number"
              min="1"
              value={formData.season_number}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  season_number: e.target.value,
                }))
              }
              placeholder="Enter season number..."
              className="bg-[#272727] border-gray-600 text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="title">Season Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter season title..."
              className="bg-[#272727] border-gray-600 text-white"
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
              onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
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
                ? editingSeason
                  ? "Updating..."
                  : "Creating..."
                : editingSeason
                  ? "Update Season"
                  : "Create Season"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
