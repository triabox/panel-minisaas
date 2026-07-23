"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";

import { Input } from "@/core/ui/input";
import { cn } from "@/core/lib/utils";

type Direccion = "asc" | "desc";

type SortState = { key: string; dir: Direccion } | null;

type Ctx<T> = {
  query: string;
  setQuery: (q: string) => void;
  sort: SortState;
  setSort: (s: SortState) => void;
  data: T[];
};

const TablaBuscadorCtx = React.createContext<Ctx<unknown> | null>(null);

function useCtx<T>(): Ctx<T> {
  const ctx = React.useContext(TablaBuscadorCtx);
  if (!ctx) {
    throw new Error(
      "TablaBuscador.* debe ir dentro de <TablaBuscador.Root>",
    );
  }
  return ctx as Ctx<T>;
}

type RootProps<T> = {
  data: T[];
  /** Devuelve un string searchable para una fila (ej: `${nombre} ${apellido} ${dni}`). */
  searchKeys: (item: T) => string;
  children:
    | React.ReactNode
    | ((filtered: T[], state: { hasFilters: boolean }) => React.ReactNode);
  /** Estado inicial de orden. */
  defaultSort?: SortState;
  /** Mapa de comparadores para cada key de orden. */
  comparators?: Record<string, (a: T, b: T) => number>;
};

function Root<T>({
  data,
  searchKeys,
  children,
  defaultSort = null,
  comparators,
}: RootProps<T>) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortState>(defaultSort);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = !q
      ? [...data]
      : data.filter((item) =>
          searchKeys(item).toLowerCase().includes(q),
        );

    if (sort && comparators?.[sort.key]) {
      const cmp = comparators[sort.key];
      result = [...result].sort(cmp);
      if (sort.dir === "desc") result.reverse();
    }
    return result;
  }, [data, query, sort, searchKeys, comparators]);

  const ctx: Ctx<T> = { query, setQuery, sort, setSort, data: filtered };

  return (
    <TablaBuscadorCtx.Provider value={ctx as unknown as Ctx<unknown>}>
      {typeof children === "function"
        ? children(filtered, { hasFilters: query.trim() !== "" })
        : children}
    </TablaBuscadorCtx.Provider>
  );
}

function Input_({
  placeholder = "Buscar...",
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const { query, setQuery } = useCtx();
  return (
    <div className={cn("relative max-w-sm", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}

function SortableHeader({
  sortKey,
  children,
  className,
}: {
  sortKey: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { sort, setSort } = useCtx();
  const active = sort?.key === sortKey;
  const dir = active ? sort.dir : null;

  const toggle = () => {
    if (!active) setSort({ key: sortKey, dir: "asc" });
    else if (dir === "asc") setSort({ key: sortKey, dir: "desc" });
    else setSort(null);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary-700",
        active && "text-primary-700",
        className,
      )}
    >
      {children}
      {dir === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : dir === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ArrowUpDown className="size-3 opacity-50" />
      )}
    </button>
  );
}

export const TablaBuscador = {
  Root,
  Input: Input_,
  SortableHeader,
};
