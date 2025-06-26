"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardService } from "@/lib/services";
import { DollarSign, FileVideo, Users, TrendingUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
  "#8DD1E1",
  "#D084D0",
];

function DashboardSkeleton() {
  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "#111" }}>
      <div className="p-6 space-y-6 w-full">
        <div>
          <Skeleton className="h-8 w-48 bg-gray-700 mb-2" />
          <Skeleton className="h-4 w-64 bg-gray-700" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card
              key={i}
              style={{ backgroundColor: "#272727" }}
              className="border-gray-700"
            >
              <CardHeader>
                <Skeleton className="h-6 w-32 bg-gray-600" />
                <Skeleton className="h-4 w-48 bg-gray-600" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full bg-gray-600" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.getDashboard,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Mock data for the line chart
  const lineChartData = [
    { month: "Jan", withAds: 800, withoutAds: 600 },
    { month: "Feb", withAds: 900, withoutAds: 700 },
    { month: "Mar", withAds: 1000, withoutAds: 800 },
    { month: "Apr", withAds: 1100, withoutAds: 900 },
    { month: "May", withAds: 1200, withoutAds: 1000 },
    { month: "Jun", withAds: 1240, withoutAds: 1240 },
  ];

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "#111" }}>
      <div className="p-6 space-y-6 w-full">
        <div>
          <h1 className="headTitle mb-2">Dashboard</h1>
          <p className="text-gray-100">Welcome back to your admin panel</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${dashboardData?.total_revenue?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-red-500 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                10% ↗ last 30 today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Content
              </CardTitle>
              <FileVideo className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.total_content?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-red-500 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                10% ↗ last 30 today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.total_user?.toLocaleString() || "0"}
              </div>
              <p className="text-xs text-red-500 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                10% ↗ last 30 today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Line Chart */}
          <Card
            style={{ backgroundColor: "#272727" }}
            className="border-gray-700"
          >
            <CardHeader>
              <CardTitle className="text-white">Statistic</CardTitle>
              <p className="text-gray-400 text-sm">
                Revenue subscription added
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      color: "#F9FAFB",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="withoutAds"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Without ads"
                  />
                  <Line
                    type="monotone"
                    dataKey="withAds"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="With ads"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card
            style={{ backgroundColor: "#272727" }}
            className="border-gray-700"
          >
            <CardHeader>
              <CardTitle className="text-white">Most watching</CardTitle>
              <p className="text-gray-400 text-sm">
                Most watching in the Genres
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData?.genre_distribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="percentage"
                  >
                    {(dashboardData?.genre_distribution || []).map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "6px",
                      color: "#F9FAFB",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {(dashboardData?.genre_distribution || []).map(
                  (genre, index) => (
                    <div
                      key={genre.genre_id}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-gray-300">{genre.name}</span>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
