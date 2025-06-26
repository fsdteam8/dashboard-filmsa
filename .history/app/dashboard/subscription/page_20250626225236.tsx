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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { subscriptionService, type Subscription } from "@/lib/services";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/table-skeleton";

export default function SubscriptionPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<Subscription | null>(null);
  const [formData, setFormData] = useState({
    plan_name: "",
    price: 0,
    description: "",
    features: [] as string[],
  });
  const [newFeature, setNewFeature] = useState("");

  const queryClient = useQueryClient();

  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => subscriptionService.getSubscriptions(),
  });

  const createMutation = useMutation({
    mutationFn: subscriptionService.createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setIsCreateOpen(false);
      resetForm();
      toast.success("Subscription created successfully");
    },
    onError: () => {
      toast.error("Failed to create subscription");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      subscriptionService.updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setIsEditOpen(false);
      setEditingSubscription(null);
      resetForm();
      toast.success("Subscription updated successfully");
    },
    onError: () => {
      toast.error("Failed to update subscription");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: subscriptionService.deleteSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Subscription deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete subscription");
    },
  });

  const resetForm = () => {
    setFormData({
      plan_name: "",
      price: 0,
      description: "",
      features: [],
    });
    setNewFeature("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSubscription) {
      updateMutation.mutate({ id: editingSubscription.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setFormData({
      plan_name: subscription.plan_name,
      price: subscription.price,
      description: subscription.description,
      features: Array.isArray(subscription.features)
        ? subscription.features
        : [],
    });
    setIsEditOpen(true);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const subscriptions = Array.isArray(subscriptionData?.data)
    ? subscriptionData.data
    : [];

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "#111" }}>
      <div className="p-6 space-y-6 w-full">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="headTitlemb-">Subscription</h1>
            <p className="text-gray-400">Dashboard › Subscription</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white text-black hover:bg-gray-100">
                <Plus className="h-4 w-4 mr-2" />
                Create Subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Subscription</DialogTitle>
                <p className="text-gray-400">
                  Dashboard › Subscription › Create Subscription
                </p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan_name">Plan Name</Label>
                    <Input
                      id="plan_name"
                      value={formData.plan_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          plan_name: e.target.value,
                        }))
                      }
                      placeholder="Enter plan name"
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: Number.parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="$0.00"
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
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
                    placeholder="Write here..."
                    className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                    required
                  />
                </div>
                <div>
                  <Label>Features</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="Add a feature"
                        className="bg-gray-700 border-gray-600 text-white"
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), addFeature())
                        }
                      />
                      <Button
                        type="button"
                        onClick={addFeature}
                        className="bg-white text-black hover:bg-gray-100"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.features.map((feature, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-gray-600 text-white"
                        >
                          {feature}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() => removeFeature(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
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
                    {createMutation.isPending ? "Saving..." : "Save"}
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
                <TableRow className="border-gray-700 bg-gray-900">
                  <TableHead className="text-gray-300 font-medium">
                    Plan Name
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Price
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Description
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Features
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Active User
                  </TableHead>
                  <TableHead className="text-gray-300 font-medium">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              {isLoading ? (
                <TableSkeleton rows={10} columns={6} />
              ) : (
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow
                      key={subscription.id}
                      className="border-gray-700 hover:bg-gray-600"
                      style={{ backgroundColor: "#272727" }}
                    >
                      <TableCell className="text-white font-medium py-4">
                        {subscription.plan_name}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        ${subscription.price}
                      </TableCell>
                      <TableCell className="text-gray-300 max-w-xs truncate">
                        {subscription.description}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(subscription.features) &&
                            subscription.features
                              .slice(0, 2)
                              .map((feature, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="bg-gray-600 text-white text-xs"
                                >
                                  {feature}
                                </Badge>
                              ))}
                          {Array.isArray(subscription.features) &&
                            subscription.features.length > 2 && (
                              <Badge
                                variant="secondary"
                                className="bg-gray-600 text-white text-xs"
                              >
                                +{subscription.features.length - 2} more
                              </Badge>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">150</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(subscription)}
                            className="text-gray-400 hover:text-white hover:bg-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              deleteMutation.mutate(subscription.id)
                            }
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
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Subscription</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_plan_name">Plan Name</Label>
                  <Input
                    id="edit_plan_name"
                    value={formData.plan_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        plan_name: e.target.value,
                      }))
                    }
                    placeholder="Enter plan name"
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_price">Price</Label>
                  <Input
                    id="edit_price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="$0.00"
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Write here..."
                  className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                  required
                />
              </div>
              <div>
                <Label>Features</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add a feature"
                      className="bg-gray-700 border-gray-600 text-white"
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addFeature())
                      }
                    />
                    <Button
                      type="button"
                      onClick={addFeature}
                      className="bg-white text-black hover:bg-gray-100"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-gray-600 text-white"
                      >
                        {feature}
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => removeFeature(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
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
