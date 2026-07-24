"use client";

import { MapPinned } from "lucide-react";

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

import { ProspectoAcciones } from "./prospecto-acciones";
import type { RubroOpt } from "./prospecto-form-dialog";

type Prospecto = {
  id: string;
  negocio: string;
  rubro: string | null;
  contactoNombre: string | null;
  estado: string;
  horasCac: number;
  fechaRecordatorio: Date | string | null;
};

const ESTADO: Record<string, string> = {
  contactado: "border-slate-200 text-slate-700",
  demo: "border-sky-200 text-sky-700",
  prueba: "border-amber-200 text-amber-700",
  cerrado: "border-emerald-200 text-emerald-700",
  descartado: "border-red-200 text-red-700",
};

export function ProspectosTable({
  prospectos,
  rubros,
  esGestion,
}: {
  prospectos: Prospecto[];
  rubros: RubroOpt[];
  esGestion: boolean;
}) {
  if (prospectos.length === 0) {
    return (
      <EmptyState
        icon={MapPinned}
        titulo="Todavía no hay prospectos"
        descripcion="Cargá el primero (o dejá que una IA los cargue por MCP) y seguí el embudo."
        ctaLabel='Click en "Nuevo prospecto" arriba'
      />
    );
  }

  return (
    <TablaBuscador.Root<Prospecto>
      data={prospectos}
      searchKeys={(p) => `${p.negocio} ${p.rubro ?? ""} ${p.contactoNombre ?? ""}`}
      defaultSort={{ key: "negocio", dir: "asc" }}
      comparators={{
        negocio: (a, b) => a.negocio.localeCompare(b.negocio),
        cac: (a, b) => a.horasCac - b.horasCac,
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
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">
                    <TablaBuscador.SortableHeader sortKey="cac">
                      CAC (h)
                    </TablaBuscador.SortableHeader>
                  </TableHead>
                  <TableHead>Recordatorio</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                      No hay prospectos que matcheen tu búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrados.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-primary-900">
                        {p.negocio}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.rubro ?? "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={ESTADO[p.estado] ?? ESTADO.contactado}
                        >
                          {p.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {p.horasCac.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">
                        {p.fechaRecordatorio ? fmtFecha(p.fechaRecordatorio) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <ProspectoAcciones
                          prospecto={p}
                          rubros={rubros}
                          esGestion={esGestion}
                        />
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
