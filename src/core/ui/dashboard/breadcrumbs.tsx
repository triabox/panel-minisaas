import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

import { cn } from "@/core/lib/utils";

type Item = {
  /** Texto a mostrar. Si es el último, queda en negrita y sin link. */
  label: string;
  /** URL si es navegable. Omitir en el último item. */
  href?: string;
};

type Props = {
  items: Item[];
  /** Si está, muestra ícono de Inicio como primer item. */
  withHome?: boolean;
  className?: string;
};

/**
 * Migajas de pan para páginas profundas. La última no es link.
 * El primer "Inicio" se agrega opcionalmente con `withHome`.
 */
export function Breadcrumbs({ items, withHome = true, className }: Props) {
  const todosItems: Item[] = withHome
    ? [{ label: "Inicio", href: "/inicio" }, ...items]
    : items;

  return (
    <nav
      aria-label="Ruta de navegación"
      className={cn(
        "flex flex-wrap items-center gap-1 text-xs text-muted-foreground",
        className,
      )}
    >
      {todosItems.map((item, i) => {
        const isLast = i === todosItems.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 ? (
              <ChevronRight
                className="size-3.5 shrink-0 text-muted-foreground/60"
                aria-hidden
              />
            ) : null}
            {isLast || !item.href ? (
              <span
                className={cn(
                  isLast && "font-medium text-primary-900",
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {i === 0 && withHome ? (
                  <span className="inline-flex items-center gap-1">
                    <Home className="size-3.5" />
                    {item.label}
                  </span>
                ) : (
                  item.label
                )}
              </span>
            ) : (
              <Link
                href={item.href}
                className="transition-colors hover:text-primary-700 hover:underline underline-offset-4"
              >
                {i === 0 && withHome ? (
                  <span className="inline-flex items-center gap-1">
                    <Home className="size-3.5" />
                    {item.label}
                  </span>
                ) : (
                  item.label
                )}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
