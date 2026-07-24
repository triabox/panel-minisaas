import { HeaderSkeleton, TablaSkeleton } from "@/core/ui/dashboard/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <div className="h-[420px] animate-pulse rounded-xl border border-primary-100 bg-primary-50/40" />
      <TablaSkeleton rows={5} cols={6} />
    </div>
  );
}
