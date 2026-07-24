"use client";

import { Sparkles } from "lucide-react";

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

import { MejoraAcciones } from "./mejora-acciones";

type Mejora = {
  id: string;
  clienteNegocio: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  fechaEntrega: Date | string | null;
};

const ESTADO: Record<
  string,
  { label: string; variant: "secondary" | "outline"; className?: string }
> = {
  pendiente: { label: "Pendiente", variant: "outline" },
  habilitada: {
    label: "Habilitada",
    variant: "outline",
    className: "border-teal-200 text-teal-700",
  },
  entregada: {
    label: "Entregada",
    variant: "outline",
    className: "border-emerald-200 text-emerald-700",
  },
};

export function MejorasTable({
  mejoras,
  esGestion,
}: {
  mejoras: Mejora[];
  esGestion: boolean;
}) {
  if (mejoras.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        titulo="Todavía no hay mejoras cargadas"
        descripcion="Creá una mejora para un cliente; el roadmap te dice a quién le toca."
        ctaLabel='Click en "Nueva mejora" arriba'
      />
    );
  }

  return (
    <TablaBuscador.Root<Mejora>
      data={mejoras}
      searchKeys={(m) => `${m.clienteNegocio} ${m.titulo}`}
      defaultSort={{ key: "cliente", dir: "asc" }}
      comparators={{ cliente: (a, b) => a.clienteNegocio.localeCompare(b.clienteNegocio) }}
    >
      {(filtrados) => (
        <div className="space-y-3">
          <TablaBuscador.Input placeholder="Buscar por cliente o título..." />
          <div className="rounded-xl border border-primary-100 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <TablaBuscador.SortableHeader sortKey="cliente">
                      Cliente
                    </TablaBuscador.SortableHeader>
                  </TableHead>
                  <TableHead>Mejora</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead>Entregada</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                      No hay mejoras que matcheen tu búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrados.map((m) => {
                    const e = ESTADO[m.estado] ?? ESTADO.pendiente!;
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium text-primary-900">
                          {m.clienteNegocio}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.titulo}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={e.variant} className={e.className}>
                            {e.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground tabular-nums">
                          {m.fechaEntrega ? fmtFecha(m.fechaEntrega) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <MejoraAcciones mejora={m} esGestion={esGestion} />
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
