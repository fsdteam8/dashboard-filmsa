"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Eye, Plus, Trash2, Upload } from "lucide-react"; // Removed Edit icon
import { VideoUpload } from "@/components/video-upload";

interface Ad {
  id: number;
  ads_url: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data: Ad[];
}

interface SingleAdResponse {
  success: boolean;
  data: Ad;
}

export default function AdsManagement() {
  const { data: session, status } = useSession();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // Removed isEditOpen and editingAd states
  const [adUploadData, setAdUploadData] = useState<any>(null);
  const [isAdUploading, setIsAdUploading] = useState(false);

  const token = session?.accessToken as string | undefined;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Fetch all ads
  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/ads`);
      const result: ApiResponse = await response.json();
      if (result.success) {
        setAds(result.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch ads",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch ads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch single ad details
  const fetchAdDetails = async (id: number) => {
    try {
      const response = await fetch(`${baseUrl}/api/ads/${id}`);
      const result: SingleAdResponse = await response.json();
      if (result.success) {
        setSelectedAd(result.data);
        setIsDetailsOpen(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch ad details",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch ad details",
        variant: "destructive",
      });
    }
  };

  // Handle ad file change from VideoUpload component
  const handleAdUpload = (file: File | null, uploadData?: any) => {
    if (uploadData) {
      setAdUploadData(uploadData);
      console.log("💾 Stored ad upload data:", uploadData);
    } else {
      setAdUploadData(null);
    }
  };

  // Handle ad uploading status change from VideoUpload component
  const handleAdUploadingChange = (uploading: boolean) => {
    setIsAdUploading(uploading);
  };

  // Create new ad
  const createAd = async () => {
    if (!adUploadData || !token) {
      toast({
        title: "Error",
        description: "Please upload an ad file and ensure you're authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      // Append the S3 upload metadata as a JSON string
      formData.append("ads", JSON.stringify(adUploadData));

      const response = await fetch(`${baseUrl}/api/ads`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Ad created successfully",
        });
        setIsCreateOpen(false);
        setAdUploadData(null); // Reset upload data
        fetchAds();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to create ad",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create ad",
        variant: "destructive",
      });
    }
  };

  // Removed updateAd function

  // Delete ad
  const deleteAd = async (id: number) => {
    if (!token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }
    if (!confirm("Are you sure you want to delete this ad?")) {
      return;
    }
    try {
      const response = await fetch(`${baseUrl}/api/ads/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        toast({
          title: "Success",
          description: "Ad deleted successfully",
        });
        fetchAds();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete ad",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete ad",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading ads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ads Management</CardTitle>
          <Dialog
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) setAdUploadData(null); // Reset on close
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Ad
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Ad</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <VideoUpload
                  label="Upload Ad File"
                  onFileChange={handleAdUpload}
                  onUploadingChange={handleAdUploadingChange}
                />
                {adUploadData && (
                  <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-sm text-green-800">
                    <p>
                      ✅ Ad uploaded to S3:{" "}
                      <a
                        href={adUploadData.s3Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline break-all"
                      >
                        {adUploadData.s3Url}
                      </a>
                    </p>
                    <p>File ID: {adUploadData.fileId}</p>
                  </div>
                )}
                <Button
                  onClick={createAd}
                  className="w-full"
                  disabled={isAdUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isAdUploading ? "Uploading..." : "Create Ad"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell>
                    <div className="w-20 h-12 bg-gray-100 rounded overflow-hidden">
                      {ad.ads_url &&
                      (ad.ads_url.includes(".mp4") ||
                        ad.ads_url.includes(".webm") ||
                        ad.ads_url.includes(".mov")) ? (
                        <video
                          src={ad.ads_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={
                            ad.ads_url ||
                            "/placeholder.svg?height=48&width=80&query=ad-placeholder"
                          }
                          alt="Ad preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(ad.created_at)}</TableCell>
                  <TableCell>{formatDate(ad.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchAdDetails(ad.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {/* Removed Edit button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAd(ad.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ad Details</DialogTitle>
          </DialogHeader>
          {selectedAd && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAd.id}
                  </p>
                </div>
                <div>
                  <Label>Created At</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedAd.created_at)}
                  </p>
                </div>
                <div>
                  <Label>Updated At</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedAd.updated_at)}
                  </p>
                </div>
              </div>
              <div>
                <Label>Ad URL</Label>
                <p className="text-sm text-muted-foreground break-all">
                  {selectedAd.ads_url}
                </p>
              </div>
              <div>
                <Label>Preview</Label>
                <div className="mt-2 border rounded-lg overflow-hidden">
                  {selectedAd.ads_url &&
                  (selectedAd.ads_url.includes(".mp4") ||
                    selectedAd.ads_url.includes(".webm") ||
                    selectedAd.ads_url.includes(".mov")) ? (
                    <video
                      src={selectedAd.ads_url}
                      controls
                      className="w-full max-h-64 object-contain"
                    />
                  ) : (
                    <img
                      src={
                        selectedAd.ads_url ||
                        "/placeholder.svg?height=64&width=256&query=ad-preview"
                      }
                      alt="Ad preview"
                      className="w-full max-h-64 object-contain"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Removed Edit Dialog */}
    </div>
  );
}
