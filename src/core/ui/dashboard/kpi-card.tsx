import type { LucideIcon } from "lucide-react";

import { cn } from "@/core/lib/utils";

/** Tarjeta de indicador para dashboards y reportes. */
export function KpiCard({
  titulo,
  valor,
  detalle,
  icon: Icon,
  tono = "default",
}: {
  titulo: string;
  valor: string | number;
  detalle?: string;
  icon?: LucideIcon;
  tono?: "default" | "positivo" | "alerta";
}) {
  return (
    <div className="rounded-xl border border-primary-100 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {titulo}
        </p>
        {Icon ? <Icon className="size-4 text-primary-400" /> : null}
      </div>
      <p
        className={cn(
          "mt-2 text-3xl font-bold tabular-nums",
          tono === "positivo" && "text-emerald-700",
          tono === "alerta" && "text-amber-700",
          tono === "default" && "text-primary-900",
        )}
      >
        {valor}
      </p>
      {detalle ? (
        <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>
      ) : null}
    </div>
  );
}
