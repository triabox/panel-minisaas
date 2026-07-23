import { notFound } from "next/navigation";

import { auth } from "@/core/auth";
import { Toaster } from "@/core/ui/sonner";
import {
  listarUsuarios,
  listarRolesDisponibles,
} from "@/modules/usuarios/actions";

import { NuevoUsuarioButton } from "./nuevo-usuario-button";
import { UsuariosTable } from "./usuarios-table";

export const metadata = { title: "Usuarios del sistema" };

export default async function UsuariosPage() {
  const session = await auth();
  if (!session?.user?.roles.includes("super_admin")) {
    notFound();
  }

  const [usuarios, roles] = await Promise.all([
    listarUsuarios(),
    listarRolesDisponibles(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary-900">
            Usuarios del sistema
          </h1>
          <p className="text-sm text-muted-foreground">
            Personas que pueden ingresar al panel. Cada una tiene uno o más
            roles.
          </p>
        </div>
        <NuevoUsuarioButton roles={roles} />
      </header>

      <UsuariosTable usuarios={usuarios} roles={roles} />

      <Toaster richColors closeButton />
    </div>
  );
}
