"use client";

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

interface MonthlyRevenueData {
  monthly_revenue: {
    with_ads: Array<{ month: string; revenue: number }>;
    without_ads: Array<{ month: string; revenue: number }>;
  };
}

interface RevenueChartProps {
  data?: MonthlyRevenueData;
}

function transformRevenueData(data: MonthlyRevenueData) {
  const { with_ads, without_ads } = data.monthly_revenue;

  return with_ads.map((item, index) => ({
    month: item.month,
    withAds: item.revenue,
    withoutAds: without_ads[index]?.revenue || 0,
  }));
}

export default function RevenueChart({ data }: RevenueChartProps) {
  // Default data for when no data is provided
  const defaultData = {
    monthly_revenue: {
      with_ads: [
        { month: "Jan", revenue: 650 },
        { month: "Feb", revenue: 580 },
        { month: "Mar", revenue: 720 },
        { month: "Apr", revenue: 680 },
        { month: "May", revenue: 640 },
        { month: "Jun", revenue: 700 },
        { month: "Jul", revenue: 680 },
        { month: "Aug", revenue: 660 },
        { month: "Sep", revenue: 850 },
        { month: "Oct", revenue: 720 },
        { month: "Nov", revenue: 680 },
        { month: "Dec", revenue: 800 },
      ],
      without_ads: [
        { month: "Jan", revenue: 750 },
        { month: "Feb", revenue: 680 },
        { month: "Mar", revenue: 800 },
        { month: "Apr", revenue: 820 },
        { month: "May", revenue: 780 },
        { month: "Jun", revenue: 800 },
        { month: "Jul", revenue: 750 },
        { month: "Aug", revenue: 820 },
        { month: "Sep", revenue: 980 },
        { month: "Oct", revenue: 600 },
        { month: "Nov", revenue: 650 },
        { month: "Dec", revenue: 750 },
      ],
    },
  };

  const chartData = transformRevenueData(data || defaultData);

  const maxRevenue = Math.max(
    ...chartData.map((item) => Math.max(item.withAds, item.withoutAds))
  );
  const yAxisMax = Math.ceil(maxRevenue / 200) * 200; // Round up to nearest 200

  return (
    <Card className="bg-[#272727] border-0 text-white">
      <CardHeader className="pb-6">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-white text-[32px] font-bold mb-2">
              Statistic
            </CardTitle>
            <p className="text-gray-400 text-base">
              Revenue subscription added
            </p>
          </div>
          <div className="flex items-end gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-300">Without ads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-300">With ads</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <ChartContainer
          config={{
            withoutAds: {
              label: "Without ads",
              color: "#22c55e",
            },
            withAds: {
              label: "With ads",
              color: "#3b82f6",
            },
          }}
          className="h-[400px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="2 2"
                stroke="#4b5563"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 14, fill: "#9ca3af" }}
                className="text-gray-400"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 14, fill: "#9ca3af" }}
                tickFormatter={(value) =>
                  `$${value >= 1000 ? `${value / 1000}k` : value}`
                }
                domain={[0, yAxisMax]}
              />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
                        {payload.map((entry, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm"
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            ></div>
                            <span className="text-gray-300">
                              {entry.dataKey === "withoutAds"
                                ? "Without ads"
                                : "With ads"}{" "}
                              : {entry.value?.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="withoutAds"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: "#22c55e", strokeWidth: 0, r: 4 }}
                activeDot={{
                  r: 5,
                  fill: "#22c55e",
                  strokeWidth: 2,
                  stroke: "#1f2937",
                }}
              />
              <Line
                type="monotone"
                dataKey="withAds"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", strokeWidth: 0, r: 4 }}
                activeDot={{
                  r: 5,
                  fill: "#3b82f6",
                  strokeWidth: 2,
                  stroke: "#1f2937",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
