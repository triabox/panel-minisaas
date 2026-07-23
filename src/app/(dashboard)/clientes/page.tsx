import { auth } from "@/core/auth";
import { tieneRolGestion } from "@/core/permisos";
import { listarClientes } from "@/modules/clientes/actions";
import { listarRubrosActivos } from "@/modules/rubros/actions";

import { ClientesTable } from "./clientes-table";
import { NuevoClienteButton } from "./nuevo-cliente-button";

export const metadata = { title: "Clientes" };

export default async function ClientesPage() {
  const session = await auth();
  const roles = session?.user.roles ?? [];

  const [clientes, rubros] = await Promise.all([
    listarClientes(),
    listarRubrosActivos(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary-900">
            Clientes
          </h1>
          <p className="text-sm text-muted-foreground">
            Cada negocio al que le operás un mini-SaaS. El riesgo se enciende
            solo: pago demorado o exceso de horas del mes.
          </p>
        </div>
        <NuevoClienteButton rubros={rubros} />
      </header>

      <ClientesTable
        clientes={clientes}
        rubros={rubros}
        esGestion={tieneRolGestion(roles)}
      />
    </div>
  );
}
