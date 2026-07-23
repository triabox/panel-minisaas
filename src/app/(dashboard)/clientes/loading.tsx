import { Skeleton } from "@/core/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
