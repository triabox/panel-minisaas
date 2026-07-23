"use client";

import { Clock } from "lucide-react";

import { Badge } from "@/core/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import { EmptyState } from "@/core/ui/dashboard/empty-state";
import { TablaBuscador } from "@/core/ui/dashboard/tabla-buscador";
import { fmtFecha } from "@/core/lib/fechas";
import { TIPO_TICKET_LABEL } from "@/modules/tickets/schemas";

import { TicketAcciones } from "./ticket-acciones";

type Ticket = {
  id: string;
  clienteNegocio: string;
  tipo: "bug" | "ajuste" | "feature" | "consulta";
  descripcion: string | null;
  horasHombre: number;
  tiempoIa: number;
  automatizado: boolean;
  fecha: Date | string;
};

export function TicketsTable({
  tickets,
  esGestion,
}: {
  tickets: Ticket[];
  esGestion: boolean;
}) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        titulo="Todavía no cargaste horas"
        descripcion="Cada pedido de soporte se carga acá en segundos. Es tu métrica madre."
        ctaLabel='Click en "Cargar horas" arriba'
      />
    );
  }

  return (
    <TablaBuscador.Root<Ticket>
      data={tickets}
      searchKeys={(t) =>
        `${t.clienteNegocio} ${TIPO_TICKET_LABEL[t.tipo]} ${t.descripcion ?? ""}`
      }
      defaultSort={{ key: "fecha", dir: "desc" }}
      comparators={{
        fecha: (a, b) => +new Date(a.fecha) - +new Date(b.fecha),
        horas: (a, b) => a.horasHombre - b.horasHombre,
      }}
    >
      {(filtrados) => (
        <div className="space-y-3">
          <TablaBuscador.Input placeholder="Buscar por cliente, tipo o descripción..." />

          <div className="rounded-xl border border-primary-100 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">
                    <TablaBuscador.SortableHeader sortKey="fecha">
                      Fecha
                    </TablaBuscador.SortableHeader>
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">
                    <TablaBuscador.SortableHeader sortKey="horas">
                      Horas
                    </TablaBuscador.SortableHeader>
                  </TableHead>
                  <TableHead className="text-right">IA (h)</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      No hay tickets que matcheen tu búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrados.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">
                        {fmtFecha(t.fecha)}
                      </TableCell>
                      <TableCell className="font-medium text-primary-900">
                        {t.clienteNegocio}
                        {t.descripcion ? (
                          <span className="block text-xs font-normal text-muted-foreground">
                            {t.descripcion}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary">
                            {TIPO_TICKET_LABEL[t.tipo]}
                          </Badge>
                          {t.automatizado ? (
                            <Badge
                              variant="outline"
                              className="border-teal-200 text-teal-700"
                            >
                              IA
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {t.horasHombre.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                        {t.tiempoIa.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <TicketAcciones ticket={t} esGestion={esGestion} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </TablaBuscador.Root>
  );
}
