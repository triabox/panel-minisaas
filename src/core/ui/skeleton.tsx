import { cn } from "@/core/lib/utils";

/**
 * Bloque animado tipo "pulse" para indicar que algo se está cargando.
 * Usar con tamaños explícitos (h-X w-X) para que ocupe el lugar que va
 * a tomar el contenido real, evitando layout shift cuando llegue.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary-100/70", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
