import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
} from "@/core/ui/avatar";
import { Badge } from "@/core/ui/badge";
import { APP_NAME } from "@/core/lib/branding";

import { CambiarPasswordMenuItem } from "./cambiar-password-menu-item";
import { LogoutMenuItem } from "./logout-menu-item";
import { MobileNav } from "./mobile-nav";
import type { NavGrupo } from "./sidebar";

/** Labels de los roles core; cada sistema puede pisarlos/extenderlos por prop. */
const ROL_LABELS_CORE: Record<string, string> = {
  super_admin: "Súper admin",
  admin: "Administración",
  operador: "Operación",
  observador: "Observación",
};

export function TopBar({
  nombre,
  email,
  roles,
  grupos,
  cerrarSesion,
  rolLabels,
}: {
  nombre: string;
  email: string;
  roles: string[];
  grupos: NavGrupo[];
  cerrarSesion: () => Promise<void>;
  rolLabels?: Record<string, string>;
}) {
  const ROL_LABELS = { ...ROL_LABELS_CORE, ...rolLabels };
  const iniciales = nombre
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const rolPrincipal = roles[0];

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-primary-100 bg-white/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2 lg:hidden">
        <MobileNav grupos={grupos} />
        <span className="truncate text-sm font-semibold text-primary-900">
          {APP_NAME}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {rolPrincipal ? (
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {ROL_LABELS[rolPrincipal] ?? rolPrincipal}
          </Badge>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-primary-50">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary-600 text-sm font-semibold text-white">
                {iniciales || "??"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="space-y-0.5">
              <p className="text-sm font-medium">{nombre}</p>
              <p className="text-xs font-normal text-muted-foreground">
                {email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <CambiarPasswordMenuItem />
            <LogoutMenuItem cerrarSesion={cerrarSesion} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
