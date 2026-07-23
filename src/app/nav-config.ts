/**
 * Árbol de navegación de ESTE sistema — zona custom: editalo libremente.
 * El core solo dibuja lo que armes acá (ver src/core/ui/dashboard/sidebar.tsx).
 *
 * Principio del panel: todo a la vista, sin submenús escondidos.
 */
import {
  LayoutDashboard,
  Building2,
  Clock,
  UserCog,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { esSuperAdmin, tieneRolGestion } from "@/core/permisos";
import type { NavGrupo } from "@/core/ui/dashboard/sidebar";

export function obtenerNavGrupos(roles: string[]): NavGrupo[] {
  const grupos: NavGrupo[] = [
    {
      items: [
        { href: "/inicio", label: "Salud del negocio", icon: LayoutDashboard },
        { href: "/clientes", label: "Clientes", icon: Building2 },
        { href: "/horas", label: "Registro de horas", icon: Clock },
      ],
    },
  ];

  if (tieneRolGestion(roles)) {
    grupos.push({
      titulo: "Administración",
      items: [{ href: "/configuracion", label: "Configuración", icon: Settings }],
    });
  }

  if (esSuperAdmin(roles)) {
    grupos.push({
      titulo: "Sistema",
      items: [
        { href: "/usuarios", label: "Usuarios", icon: UserCog },
        { href: "/auditoria", label: "Auditoría", icon: ShieldCheck },
      ],
    });
  }

  return grupos;
}
