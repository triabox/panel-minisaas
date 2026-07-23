"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { APP_INICIALES, APP_NAME } from "@/core/lib/branding";
import { cn } from "@/core/lib/utils";

/**
 * El árbol de navegación es CUSTOM de cada sistema: se define en
 * src/app/nav-config.ts y se inyecta acá por prop. El core solo lo dibuja.
 */
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: NavItem[];
};

export type NavGrupo = {
  titulo?: string;
  items: NavItem[];
};

export function Sidebar({ grupos }: { grupos: NavGrupo[] }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-primary-100 bg-white lg:flex">
      <div className="flex min-h-16 shrink-0 items-center gap-3 border-b border-primary-100 px-4 py-2">
        <div className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
          {APP_INICIALES}
        </div>
        <p className="text-xs font-semibold leading-tight text-primary-900">
          {APP_NAME}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarNav grupos={grupos} />
      </div>
    </aside>
  );
}

/**
 * Activo cuando el path actual coincide exactamente, o cuando es un sub-path
 * (ej. /cursos/abc activa /cursos). Excepción: el "/" raíz solo coincide
 * exacto para evitar activar todo.
 */
function esActivo(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/** Lista de items reutilizable para el sidebar desktop y el drawer mobile. */
export function SidebarNav({
  grupos,
  onNavigate,
}: {
  grupos: NavGrupo[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-4 p-3">
      {grupos.map((grupo, i) => (
        <div key={grupo.titulo ?? i} className="flex flex-col gap-1">
          {grupo.titulo ? (
            <p className="px-3 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {grupo.titulo}
            </p>
          ) : null}
          {grupo.items.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

function SidebarLink({
  item,
  pathname,
  onNavigate,
  nivel = 0,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  nivel?: number;
}) {
  const Icon = item.icon;
  const tieneHijos = !!item.children?.length;
  // Default: siempre colapsado al cargar (decisión consensuada).
  const [abierto, setAbierto] = useState(false);

  // Render como grupo desplegable (botón con chevron, no link).
  if (tieneHijos) {
    return (
      <>
        <button
          type="button"
          onClick={() => setAbierto((o) => !o)}
          aria-expanded={abierto}
          className={cn(
            "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            "text-muted-foreground hover:bg-primary-50 hover:text-primary-800 focus-visible:bg-primary-50 focus-visible:text-primary-800",
            nivel > 0 && "ml-3",
          )}
        >
          <Icon className="size-4" />
          <span className="flex-1 text-left">{item.label}</span>
          {abierto ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>
        {abierto ? (
          <div className="flex flex-col gap-1">
            {item.children!.map((child) => (
              <SidebarLink
                key={child.href}
                item={child}
                pathname={pathname}
                onNavigate={onNavigate}
                nivel={nivel + 1}
              />
            ))}
          </div>
        ) : null}
      </>
    );
  }

  // Render leaf: link directo normal.
  const activo = esActivo(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={activo ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        nivel > 0 && "ml-3",
        activo
          ? "bg-primary-100 text-primary-900"
          : "text-muted-foreground hover:bg-primary-50 hover:text-primary-800 focus-visible:bg-primary-50 focus-visible:text-primary-800",
      )}
    >
      <Icon className="size-4" />
      {item.label}
    </Link>
  );
}
