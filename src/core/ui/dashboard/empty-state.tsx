import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

import { Button } from "@/core/ui/button";

type Props = {
  icon?: LucideIcon;
  titulo: string;
  descripcion?: string;
  /** Texto del botón CTA. Si no se pasa, no se muestra. */
  ctaLabel?: string;
  /** URL para navegación, o callback en client. Si ambos faltan, no hay CTA. */
  ctaHref?: string;
  /** Variante visual. Default: borde lila claro */
  tono?: "default" | "soft";
};

/**
 * Estado vacío reusable. Pensado para tablas/listas que aún no tienen
 * contenido — invita a la acción siguiente en lugar de solo decir "Sin datos".
 */
export function EmptyState({
  icon: Icon,
  titulo,
  descripcion,
  ctaLabel,
  ctaHref,
  tono = "default",
}: Props) {
  const styles =
    tono === "soft"
      ? "border-primary-100 bg-primary-50/30"
      : "border-dashed border-primary-200 bg-white";

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-xl border p-8 text-center ${styles}`}
    >
      {Icon ? (
        <div className="inline-flex size-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <Icon className="size-6" />
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="text-base font-semibold text-primary-900">{titulo}</p>
        {descripcion ? (
          <p className="max-w-md text-sm text-muted-foreground">
            {descripcion}
          </p>
        ) : null}
      </div>
      {ctaLabel && ctaHref ? (
        <Button asChild size="sm" className="mt-2">
          <Link href={ctaHref}>
            {ctaLabel}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
