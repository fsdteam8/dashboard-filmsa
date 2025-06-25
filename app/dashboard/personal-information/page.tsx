"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { settingsService } from "@/lib/services"
import { Edit, Save } from "lucide-react"
import { toast } from "sonner"

export default function PersonalInformationPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    country: "",
    city: "",
  })
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  })

  const queryClient = useQueryClient()

  const { data: userInfo, isLoading } = useQuery({
    queryKey: ["userInfo"],
    queryFn: settingsService.getUserInfo,
    onSuccess: (data) => {
      setFormData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone: data.phone || "",
        email: data.email || "",
        country: data.country || "",
        city: data.city || "",
      })
    },
  })

  const updateInfoMutation = useMutation({
    mutationFn: settingsService.updateUserInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userInfo"] })
      setIsEditing(false)
      toast.success("Personal information updated successfully")
    },
    onError: () => {
      toast.error("Failed to update personal information")
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: settingsService.changePassword,
    onSuccess: () => {
      setIsPasswordDialogOpen(false)
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_new_password: "",
      })
      toast.success("Password changed successfully")
    },
    onError: () => {
      toast.error("Failed to change password")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateInfoMutation.mutate(formData)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_new_password) {
      toast.error("New passwords do not match")
      return
    }
    changePasswordMutation.mutate(passwordData)
  }

  if (isLoading) {
    return <div className="p-6 text-white">Loading...</div>
  }

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "#111" }}>
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-3xl font-bold text-white">Personal Information</h1>
            <p className="text-gray-400">
              Dashboard › Personal Information
              {isEditing && " › Edit Personal Information"}
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="bg-white text-black hover:bg-gray-100">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={updateInfoMutation.isPending}
              className="bg-white text-black hover:bg-gray-100"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateInfoMutation.isPending ? "Saving..." : "Save"}
            </Button>
          )}
        </div>

        <Card className="bg-gray-800 border-gray-700 w-full max-w-4xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="first_name" className="text-gray-300">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white mt-2"
                    disabled={!isEditing}
                    placeholder="Bessie"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-gray-300">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white mt-2"
                    disabled={!isEditing}
                    placeholder="Edwards"
                  />
                </div>
              </div>

              {!isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email" className="text-gray-300">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      value={formData.email}
                      className="bg-gray-700 border-gray-600 text-white mt-2"
                      disabled
                      placeholder="darrellsteward@gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-gray-300">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      className="bg-gray-700 border-gray-600 text-white mt-2"
                      disabled
                      placeholder="(307) 555-0133"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="country" className="text-gray-300">
                    Country
                  </Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white mt-2"
                    disabled={!isEditing}
                    placeholder="USA"
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-gray-300">
                    City/State
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white mt-2"
                    disabled={!isEditing}
                    placeholder="Alabama"
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Dialog */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, new_password: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, current_password: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirm_new_password">Confirm New Password</Label>
                <Input
                  id="confirm_new_password"
                  type="password"
                  value={passwordData.confirm_new_password}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, confirm_new_password: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full bg-white text-black hover:bg-gray-100"
              >
                {changePasswordMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
