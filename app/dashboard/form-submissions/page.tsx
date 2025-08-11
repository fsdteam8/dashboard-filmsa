"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp, ChevronDown, Search, Loader2 } from "lucide-react";

interface Person {
  id: number;
  name: string;
  stateOrCountry: string;
  gender: string;
  email: string;
  shows: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  status: string;
  data: Person[];
}

type SortField = keyof Person;
type SortDirection = "asc" | "desc";

export default function PeopleDataTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name"); // Changed from "id" to "name"
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc"); // Alphabetical order (A-Z)
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ["people"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/people`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch people data");
      }
      return response.json();
    },
  });

  // Filter and sort data locally
  const processedData = useMemo(() => {
    if (!data?.data) return [];

    let filtered = data.data;

    // Filter by shows name
    if (searchTerm) {
      filtered = filtered.filter((person) =>
        person.shows.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort data with proper type handling
    filtered.sort((a, b) => {
      // Handle null/undefined values by providing defaults
      const aValue = a[sortField] ?? "";
      const bValue = b[sortField] ?? "";

      // Special handling for date fields
      if (sortField === "created_at" || sortField === "updated_at") {
        const aTime = new Date(aValue).getTime();
        const bTime = new Date(bValue).getTime();
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }

      // Handle string comparison (case-insensitive) - optimized for names
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue, undefined, {
          sensitivity: "base",
          numeric: true,
        });
        return sortDirection === "asc" ? comparison : -comparison;
      }

      // Handle number comparison
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [data, searchTerm, sortField, sortDirection]);

  // Paginate processed data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (error) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="text-red-400 text-center">
            Error loading data: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800 p-2">
      <CardHeader className="border-b border-gray-800">
        <CardTitle className="text-white pb-5">Opinion Form Data</CardTitle>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by show name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="5" className="text-white">
                5 per page
              </SelectItem>
              <SelectItem value="10" className="text-white">
                10 per page
              </SelectItem>
              <SelectItem value="20" className="text-white">
                20 per page
              </SelectItem>
              <SelectItem value="50" className="text-white">
                50 per page
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center p-5">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <span className="ml-2 text-white">Loading...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto p-8">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-gray-800/50">
                    <TableHead
                      className="text-gray-300 cursor-pointer hover:text-white select-none"
                      onClick={() => handleSort("id")}
                    >
                      <div className="flex items-center gap-2">
                        ID {getSortIcon("id")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-gray-300 cursor-pointer hover:text-white select-none"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        Name {getSortIcon("name")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-gray-300 cursor-pointer hover:text-white select-none"
                      onClick={() => handleSort("stateOrCountry")}
                    >
                      <div className="flex items-center gap-2">
                        State/Country {getSortIcon("stateOrCountry")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-gray-300 cursor-pointer hover:text-white select-none"
                      onClick={() => handleSort("gender")}
                    >
                      <div className="flex items-center gap-2">
                        Gender {getSortIcon("gender")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-gray-300 cursor-pointer hover:text-white select-none"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center gap-2">
                        Email {getSortIcon("email")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-gray-300 cursor-pointer hover:text-white select-none"
                      onClick={() => handleSort("shows")}
                    >
                      <div className="flex items-center gap-2">
                        Shows {getSortIcon("shows")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-gray-300 cursor-pointer hover:text-white select-none"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center gap-2">
                        Created {getSortIcon("created_at")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-gray-300 cursor-pointer hover:text-white select-none"
                      onClick={() => handleSort("updated_at")}
                    >
                      <div className="flex items-center gap-2">
                        Updated {getSortIcon("updated_at")}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-gray-400"
                      >
                        {searchTerm
                          ? "No results found for your search."
                          : "No data available."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((person) => (
                      <TableRow
                        key={person.id}
                        className="border-gray-800 hover:bg-gray-800/30"
                      >
                        <TableCell className="text-white font-medium">
                          {person.id}
                        </TableCell>
                        <TableCell className="text-white">
                          {person.name}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {person.stateOrCountry}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {person.gender}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {person.email}
                        </TableCell>
                        <TableCell className="text-blue-400">
                          {person.shows}
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          {formatDate(person.created_at)}
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          {formatDate(person.updated_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
                <div className="text-sm text-gray-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, processedData.length)}{" "}
                  of {processedData.length} results
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={
                            currentPage === pageNum
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                          }
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
