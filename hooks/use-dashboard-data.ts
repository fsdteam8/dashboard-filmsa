import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface DashboardData {
  total_user: number;
  total_content: number;
  total_revenue: number;
  monthly_revenue: {
    with_ads: Array<{ month: string; revenue: number }>;
    without_ads: Array<{ month: string; revenue: number }>;
  };
  genre_distribution: Array<{
    genre_id: number;
    name: string;
    percentage: number;
  }>;
}

interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

const getDashboardData = async (token: string): Promise<DashboardData> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  const result: DashboardResponse = await res.json();

  if (!result.success) {
    throw new Error("API returned unsuccessful response");
  }

  return result.data;
};

export const useDashboardData = () => {
  const { data: session, status } = useSession();

  const token = session?.accessToken as string | undefined;

  const enabled = status === "authenticated" && !!token;

  return useQuery({
    queryKey: ["dashboard-data"],
    queryFn: () => getDashboardData(token!),
    enabled,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  });
};
