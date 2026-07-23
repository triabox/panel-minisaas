import { auth } from "@/core/auth";
import { tieneRolGestion } from "@/core/permisos";
import { listarClientes } from "@/modules/clientes/actions";
import { listarEtiquetasActivas } from "@/modules/etiquetas/actions";

import { ClientesTable } from "./clientes-table";
import { NuevoClienteButton } from "./nuevo-cliente-button";

export const metadata = { title: "Clientes" };

export default async function ClientesPage() {
  const session = await auth();
  const roles = session?.user.roles ?? [];

  const [clientes, etiquetas] = await Promise.all([
    listarClientes(),
    listarEtiquetasActivas(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary-900">
            Clientes
          </h1>
          <p className="text-sm text-muted-foreground">
            Módulo de ejemplo del template: entidad con etiquetas, búsqueda y
            auditoría.
          </p>
        </div>
        <NuevoClienteButton etiquetas={etiquetas} />
      </header>

      <ClientesTable
        clientes={clientes}
        etiquetas={etiquetas}
        esGestion={tieneRolGestion(roles)}
      />
    </div>
  );
}
