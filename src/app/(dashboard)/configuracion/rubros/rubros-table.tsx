"use client";

import { Layers } from "lucide-react";

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

import { RubroAcciones } from "./rubro-acciones";

type Rubro = {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  orden: number;
  cantidadUsos: number;
};

export function RubrosTable({ rubros }: { rubros: Rubro[] }) {
  if (rubros.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        titulo="Todavía no hay rubros"
        descripcion="Los rubros clasifican a tus clientes (gastronomía, retail, salud…)."
        ctaLabel='Click en "Nuevo rubro" arriba'
      />
    );
  }

  return (
    <TablaBuscador.Root<Rubro>
      data={rubros}
      searchKeys={(r) => `${r.nombre} ${r.codigo}`}
      defaultSort={{ key: "orden", dir: "asc" }}
      comparators={{
        orden: (a, b) => a.orden - b.orden,
        nombre: (a, b) => a.nombre.localeCompare(b.nombre),
        usos: (a, b) => a.cantidadUsos - b.cantidadUsos,
      }}
    >
      {(filtrados) => (
        <div className="space-y-3">
          <TablaBuscador.Input placeholder="Buscar rubro..." />

          <div className="rounded-xl border border-primary-100 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 text-center">
                    <TablaBuscador.SortableHeader sortKey="orden">
                      Orden
                    </TablaBuscador.SortableHeader>
                  </TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>
                    <TablaBuscador.SortableHeader sortKey="nombre">
                      Nombre
                    </TablaBuscador.SortableHeader>
                  </TableHead>
                  <TableHead className="text-center">
                    <TablaBuscador.SortableHeader sortKey="usos">
                      Clientes
                    </TablaBuscador.SortableHeader>
                  </TableHead>
                  <TableHead className="text-center">Estado</TableHead>
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
                      No hay rubros que matcheen tu búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrados.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-center text-muted-foreground">
                        {r.orden}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.codigo}
                      </TableCell>
                      <TableCell className="font-medium text-primary-900">
                        {r.nombre}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {r.cantidadUsos}
                      </TableCell>
                      <TableCell className="text-center">
                        {r.activo ? (
                          <Badge variant="secondary">Activo</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <RubroAcciones rubro={r} />
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
