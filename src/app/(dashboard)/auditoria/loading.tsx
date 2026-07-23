import {
  HeaderSkeleton,
  TablaSkeleton,
} from "@/core/ui/dashboard/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton conBoton={false} />
      <TablaSkeleton rows={8} cols={6} />
    </div>
  );
}
