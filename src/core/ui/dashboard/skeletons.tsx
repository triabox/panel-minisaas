import { Skeleton } from "@/core/ui/skeleton";

/**
 * Skeleton para el header típico de una página: título grande + descripción
 * + botón a la derecha. Reemplaza el contenido visualmente sin layout shift.
 */
export function HeaderSkeleton({ conBoton = true }: { conBoton?: boolean }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {conBoton ? <Skeleton className="h-9 w-36" /> : null}
    </header>
  );
}

/**
 * Skeleton de tabla con búsqueda. Imita el patrón TablaBuscador (input
 * arriba + tabla con N filas).
 */
export function TablaSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-full max-w-sm" />
      <div className="rounded-xl border border-primary-100 bg-white">
        <div className="border-b border-primary-100 p-4">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={`h-${i}`} className="h-4 w-3/4" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-primary-100">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={`r-${r}`} className="p-4">
              <div
                className="grid items-center gap-4"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: cols }).map((_, c) => (
                  <Skeleton key={`c-${r}-${c}`} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton genérico para páginas detalle: header + bloque de datos + sección.
 */
export function DetalleSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-64" /> {/* breadcrumbs */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-72" /> {/* h1 */}
        <Skeleton className="h-4 w-96" /> {/* subtítulo */}
      </div>
      {/* Bloque de datos en grid */}
      <div className="grid gap-4 rounded-xl border border-primary-100 bg-white p-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
      {/* Sección con título + tabla mini */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="rounded-xl border border-primary-100 bg-white p-4">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton de cards (lista de clases, cursos en formato card, etc.)
 */
export function CardsListaSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-xl border border-primary-100 bg-white p-4"
        >
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  );
}
