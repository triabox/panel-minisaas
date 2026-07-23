"use client";

/**
 * Cáscara del dashboard (zona custom). Computa la navegación EN EL CLIENTE
 * (los iconos son funciones y no pueden viajar del server al cliente) y
 * renderiza los componentes del core.
 */
import { Sidebar } from "@/core/ui/dashboard/sidebar";
import { TopBar } from "@/core/ui/dashboard/top-bar";

import { obtenerNavGrupos } from "../nav-config";

export function AppShell({
  nombre,
  email,
  roles,
  cerrarSesion,
  children,
}: {
  nombre: string;
  email: string;
  roles: string[];
  cerrarSesion: () => Promise<void>;
  children: React.ReactNode;
}) {
  const grupos = obtenerNavGrupos(roles);

  return (
    <div className="flex min-h-screen">
      <Sidebar grupos={grupos} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          nombre={nombre}
          email={email}
          roles={roles}
          grupos={grupos}
          cerrarSesion={cerrarSesion}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
