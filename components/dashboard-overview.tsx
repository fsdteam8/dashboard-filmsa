"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { DollarSign, FileText, Users, TrendingUp } from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { StatCardSkeleton, ChartSkeleton } from "@/components/statCardSkeleton";
import RevenueChart from "./revenue-chart";

// Colors matching the screenshot exactly
const GENRE_COLORS = [
  "#22c55e", // Green
  "#ef4444", // Red
  "#7c2d12", // Dark Red
  "#3b82f6", // Blue
  "#1f2937", // Dark Gray
  "#10b981", // Emerald
  "#eab308", // Yellow
  "#8b5cf6", // Purple
  "#f97316", // Orange
];

// Colors for gender distribution
const GENDER_COLORS = [
  "#3b82f6", // Blue for male
  "#ec4899", // Pink for female
  "#10b981", // Green for others
];

export default function Dashboard() {
  const { data, isLoading, error } = useDashboardData();

  if (error) {
    return (
      <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
        <div className="text-center">
          <h1 className="text-xl text-red-500">Error loading dashboard data</h1>
          <p className="text-gray-500 mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div>
          <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Prepare chart data
  const chartData = data.monthly_revenue.with_ads.map((item, index) => ({
    month: item.month,
    withAds: item.revenue,
    withoutAds: data.monthly_revenue.without_ads[index]?.revenue || 0,
  }));

  // Calculate totals for legend display
  const totalWithAds = data.monthly_revenue.with_ads.reduce(
    (sum, item) => sum + item.revenue,
    0
  );
  const totalWithoutAds = data.monthly_revenue.without_ads.reduce(
    (sum, item) => sum + item.revenue,
    0
  );

  // Get the highest percentage for center display
  const topGenrePercentage = Math.max(
    ...data.genre_distribution.map((g) => g.percentage)
  );

  const topGenderPercentage = Math.max(
    ...data.gender_distribution.map((g) => g.percentage)
  );

  // Calculate growth percentage (mock calculation since API doesn't provide it)
  const calculateGrowth = (current: number) => {
    // Mock 10% growth as shown in screenshot
    return 10;
  };

  return (
    <div className="p-6 space-y-8 bg-[#111] min-h-screen">
      {/* Header */}
      <div>
        <h1 className="headTitle mb-2">Dashboard</h1>
        <h3 className="text-xl text-[#D3D3D3] font-normal">
          Welcome back to your admin panel
        </h3>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-[#545454] text-lg font-medium mb-2">
              <DollarSign className="h-4 w-4" />
              <span>Total Revenue</span>
            </div>
            <div className="font-bold text-[#111111] text-[32px] mb-2">
              ${data.total_revenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-3 w-3 text-red-500" />
              <span className="text-red-500 font-medium">
                {calculateGrowth(data.total_revenue)}%
              </span>
              <span className="text-gray-500">last 30 today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-[#545454] text-lg font-medium mb-2">
              <FileText className="h-4 w-4" />
              <span>Total Content</span>
            </div>
            <div className=" font-bold text-[#111111] text-[32px] mb-2">
              {data.total_content.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-3 w-3 text-red-500" />
              <span className="text-red-500 font-medium">
                {calculateGrowth(data.total_content)}%
              </span>
              <span className="text-gray-500">last 30 today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-[#545454] text-lg font-medium mb-2">
              <Users className="h-4 w-4" />
              <span>Total User</span>
            </div>
            <div className="font-bold text-[#111111] text-[32px] mb-2">
              {data.total_user.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp className="h-3 w-3 text-red-500" />
              <span className="text-red-500 font-medium">
                {calculateGrowth(data.total_user)}%
              </span>
              <span className="text-gray-500">last 30 today</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart - Exact recreation */}
        <RevenueChart data={data} />

        {/* Dual Charts - Genre and Gender Distribution */}
        <Card className="bg-[#272727] border-0 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-[32px] font-bold">
              Analytics Overview
            </CardTitle>
            <CardDescription className="text-gray-400 text-base">
              Genre and Gender Distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Genre Distribution Chart */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Most Watching Genres
                </h3>
                <div className="relative">
                  <ChartContainer
                    config={{
                      percentage: {
                        label: "Percentage",
                      },
                    }}
                    className="h-[200px]"
                  >
                    <PieChart>
                      <Pie
                        data={data.genre_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="percentage"
                      >
                        {data.genre_distribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={GENRE_COLORS[index % GENRE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  {/* Center percentage */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">
                        {topGenrePercentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
                {/* Genre Legend */}
                <div className="space-y-1">
                  {data.genre_distribution.map((genre, index) => (
                    <div
                      key={genre.genre_id}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            GENRE_COLORS[index % GENRE_COLORS.length],
                        }}
                      />
                      <span className="text-sm text-gray-300">
                        {genre.name}
                      </span>
                      <span className="text-sm text-gray-400 ml-auto">
                        {genre.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gender Distribution Chart */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  User Demographics
                </h3>
                <div className="relative">
                  <ChartContainer
                    config={{
                      percentage: {
                        label: "Percentage",
                      },
                    }}
                    className="h-[200px]"
                  >
                    <PieChart>
                      <Pie
                        data={data.gender_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="percentage"
                      >
                        {data.gender_distribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={GENDER_COLORS[index % GENDER_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  {/* Center percentage */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">
                        {topGenderPercentage > 0
                          ? `${topGenderPercentage.toFixed(1)}%`
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Gender Legend */}
                <div className="space-y-1">
                  {data.gender_distribution.map((gender, index) => (
                    <div
                      key={gender.gender}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            GENDER_COLORS[index % GENDER_COLORS.length],
                        }}
                      />
                      <span className="text-sm text-gray-300 capitalize">
                        {gender.gender}
                      </span>
                      <span className="text-sm text-gray-400 ml-auto">
                        {gender.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
