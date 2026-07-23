import { auth } from "@/core/auth";
import { tieneRolGestion } from "@/core/permisos";
import { listarTickets } from "@/modules/tickets/actions";

import { TicketsTable } from "./tickets-table";
import { NuevoTicketButton } from "./nuevo-ticket-button";

export const metadata = { title: "Registro de horas" };

export default async function HorasPage() {
  const session = await auth();
  const roles = session?.user.roles ?? [];

  const tickets = await listarTickets();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary-900">
            Registro de horas
          </h1>
          <p className="text-sm text-muted-foreground">
            Tu métrica madre. Cada pedido se carga en segundos y alimenta el
            riesgo por horas de cada cliente.
          </p>
        </div>
        <NuevoTicketButton />
      </header>

      <TicketsTable tickets={tickets} esGestion={tieneRolGestion(roles)} />
    </div>
  );
}
