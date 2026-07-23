"use client";

import { Building2, AlertTriangle } from "lucide-react";

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

import { ClienteAcciones } from "./cliente-acciones";
import type { RubroOption } from "./cliente-form-dialog";

type Cliente = {
  id: string;
  negocio: string;
  rubro: string | null;
  sistema: string | null;
  contactoNombre: string | null;
  abonoMensual: number;
  moneda: string;
  estado: string;
  estadoPago: string;
  horasMes: number;
  umbralHorasCliente: number;
  enRiesgo: boolean;
  motivosRiesgo: string[];
};

function fmtMoneda(monto: number, moneda: string): string {
  const simbolo = moneda === "USD" ? "US$" : "$";
  return `${simbolo} ${monto.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

const ESTADO_BADGE: Record<string, { label: string; variant: "secondary" | "outline" }> = {
  activo: { label: "Activo", variant: "secondary" },
  pausado: { label: "Pausado", variant: "outline" },
  baja: { label: "Baja", variant: "outline" },
};

export function ClientesTable({
  clientes,
  rubros,
  esGestion,
}: {
  clientes: Cliente[];
  rubros: RubroOption[];
  esGestion: boolean;
}) {
  if (clientes.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        titulo="Todavía no hay clientes"
        descripcion="Cargá tu primer cliente para empezar a medir horas y riesgo."
        ctaLabel='Click en "Nuevo cliente" arriba'
      />
    );
  }

  return (
    <TablaBuscador.Root<Cliente>
      data={clientes}
      searchKeys={(c) =>
        `${c.negocio} ${c.rubro ?? ""} ${c.sistema ?? ""} ${c.contactoNombre ?? ""}`
      }
      defaultSort={{ key: "negocio", dir: "asc" }}
      comparators={{
        negocio: (a, b) => a.negocio.localeCompare(b.negocio),
        horas: (a, b) => a.horasMes - b.horasMes,
      }}
    >
      {(filtrados) => (
        <div className="space-y-3">
          <TablaBuscador.Input placeholder="Buscar por negocio, rubro o contacto..." />

          <div className="rounded-xl border border-primary-100 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <TablaBuscador.SortableHeader sortKey="negocio">
                      Negocio
                    </TablaBuscador.SortableHeader>
                  </TableHead>
                  <TableHead>Rubro</TableHead>
                  <TableHead className="text-right">Abono</TableHead>
                  <TableHead className="text-center">
                    <TablaBuscador.SortableHeader sortKey="horas">
                      Horas / mes
                    </TablaBuscador.SortableHeader>
                  </TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead>Riesgo</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      No hay clientes que matcheen tu búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrados.map((c) => {
                    const excede = c.horasMes > c.umbralHorasCliente;
                    const estadoBadge = ESTADO_BADGE[c.estado] ?? ESTADO_BADGE.activo!;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium text-primary-900">
                          {c.negocio}
                          {c.sistema ? (
                            <span className="block text-xs font-normal text-muted-foreground">
                              {c.sistema}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.rubro ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {fmtMoneda(c.abonoMensual, c.moneda)}
                        </TableCell>
                        <TableCell className="text-center text-sm tabular-nums">
                          <span
                            className={excede ? "font-semibold text-red-600" : ""}
                          >
                            {c.horasMes.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            / {c.umbralHorasCliente.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={estadoBadge.variant}
                            className={
                              c.estado === "baja" ? "text-muted-foreground" : ""
                            }
                          >
                            {estadoBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {c.enRiesgo ? (
                            <span
                              title={c.motivosRiesgo.join(" · ")}
                              className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                            >
                              <AlertTriangle className="size-3" />
                              {c.motivosRiesgo.length === 1
                                ? c.motivosRiesgo[0]
                                : `En riesgo (${c.motivosRiesgo.length})`}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">OK</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <ClienteAcciones
                            cliente={c}
                            rubros={rubros}
                            esGestion={esGestion}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </TablaBuscador.Root>
  );
}
