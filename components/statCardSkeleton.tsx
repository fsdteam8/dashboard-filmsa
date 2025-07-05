import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function StatCardSkeleton() {
  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="bg-gray-800 border-0">
      <CardHeader className="pb-4">
        <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-2" />
        <div className="h-4 w-48 bg-gray-700 rounded animate-pulse" />
      </CardHeader>
      <CardContent className="pb-6">
        <div className="h-[300px] bg-gray-700 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}
