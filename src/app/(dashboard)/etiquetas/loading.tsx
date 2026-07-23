import {
  HeaderSkeleton,
  TablaSkeleton,
} from "@/core/ui/dashboard/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <TablaSkeleton rows={4} cols={4} />
    </div>
  );
}
