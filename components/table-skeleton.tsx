import { Skeleton } from "@/components/ui/skeleton"
import { TableBody, TableCell, TableRow } from "@/components/ui/table"

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="border-gray-700">
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j} className="py-4">
              <Skeleton className="h-4 w-full bg-gray-700" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}
