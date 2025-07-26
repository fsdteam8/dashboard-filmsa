"use client";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useSession } from "next-auth/react";
import { TableSkeleton } from "@/components/table-skeleton";

interface User {
  id: number;
  email: string;
  profile_pic: string | null;
  roles: string;
  phone: string | null;
  plan_type: string;
  gender: string | null;
  username: string | null;
  first_name: string;
  last_name: string | null;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: User[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlanType, setSelectedPlanType] = useState<string>("all");
  const [meta, setMeta] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });
  const [loading, setLoading] = useState(true);
  const session = useSession();
  const token = session?.data?.accessToken;

  const planTypeOptions = [
    { value: "all", label: "All Plans" },
    { value: "withoutads", label: "Without Ads" },
    { value: "none", label: "None" },
    { value: "withads", label: "With Ads" },
  ];

  const fetchUsers = async (page: number, planType = "all") => {
    setLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/all-users?page=${page}`;

      // Add plan_type filter if not "all"
      if (planType !== "all") {
        url += `&plan_type=${planType}`;
      }

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data: ApiResponse = await response.json();
      if (data.success) {
        setUsers(data.data);
        setMeta(data.meta);
        setCurrentPage(data.meta.current_page);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers(currentPage, selectedPlanType);
    }
  }, [currentPage, selectedPlanType, token]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= meta.last_page) {
      setCurrentPage(page);
    }
  };

  const handlePlanTypeChange = (planType: string) => {
    setSelectedPlanType(planType);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "premium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "pro":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "basic":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "withoutads":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "withads":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "none":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPlanDisplayName = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "withoutads":
        return "Without Ads";
      case "withads":
        return "With Ads";
      case "none":
        return "None";
      default:
        return plan.charAt(0).toUpperCase() + plan.slice(1);
    }
  };

  return (
    <div className="bg-gray-900/50 rounded-lg border border-gray-800 m-10">
      {/* Filter Section */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-gray-300 text-sm font-medium">
              Filter by Plan:
            </span>
          </div>
          <Select value={selectedPlanType} onValueChange={handlePlanTypeChange}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-gray-300">
              <SelectValue placeholder="Select plan type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {planTypeOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-gray-300 focus:bg-gray-700 focus:text-white"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPlanType !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePlanTypeChange("all")}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-gray-800 hover:bg-gray-800/50">
            <TableHead className="text-gray-300 font-medium">User</TableHead>
            <TableHead className="text-gray-300 font-medium">Email</TableHead>
            <TableHead className="text-gray-300 font-medium">Plan</TableHead>
            <TableHead className="text-gray-300 font-medium">Phone</TableHead>
            <TableHead className="text-gray-300 font-medium">Gender</TableHead>
          </TableRow>
        </TableHeader>

        {loading ? (
          <TableSkeleton rows={10} columns={5} />
        ) : (
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="border-gray-800 hover:bg-gray-800/30"
              >
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profile_pic || undefined} />
                      <AvatarFallback className="bg-gray-700 text-gray-300">
                        {user.first_name?.charAt(0) ||
                          user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-white font-medium">
                        {user.first_name} {user.last_name || ""}
                      </div>
                      {user.username && (
                        <div className="text-gray-400 text-sm">
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-300">{user.email}</TableCell>
                <TableCell>
                  <Badge className={`${getPlanColor(user.plan_type)} border`}>
                    {getPlanDisplayName(user.plan_type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-300">
                  {user.phone || "N/A"}
                </TableCell>
                <TableCell className="text-gray-300">
                  {user.gender || "N/A"}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && !loading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-gray-400"
                >
                  No users found for the selected filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        )}
      </Table>

      {/* Pagination */}
      {!loading && users.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
          <div className="text-gray-400 text-sm">
            Showing {(meta.current_page - 1) * meta.per_page + 1} to{" "}
            {Math.min(meta.current_page * meta.per_page, meta.total)} of{" "}
            {meta.total} results
            {selectedPlanType !== "all" && (
              <span className="ml-2">
                (filtered by{" "}
                {
                  planTypeOptions.find((opt) => opt.value === selectedPlanType)
                    ?.label
                }
                )
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(
              (page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className={
                    page === currentPage
                      ? "bg-white text-black hover:bg-gray-200"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }
                >
                  {page}
                </Button>
              )
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === meta.last_page}
              className="text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
