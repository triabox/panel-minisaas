"use client";

import { Tags } from "lucide-react";

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

import { EtiquetaAcciones } from "./etiqueta-acciones";

type Etiqueta = {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  orden: number;
  cantidadUsos: number;
};

export function EtiquetasTable({ etiquetas }: { etiquetas: Etiqueta[] }) {
  if (etiquetas.length === 0) {
    return (
      <EmptyState
        icon={Tags}
        titulo="Todavía no hay etiquetas cargadas"
        descripcion="Las etiquetas clasifican a los clientes (potencial, VIP, etc.)."
        ctaLabel='Click en "Nueva etiqueta" arriba'
      />
    );
  }

  return (
    <TablaBuscador.Root<Etiqueta>
      data={etiquetas}
      searchKeys={(t) => `${t.nombre} ${t.codigo}`}
      defaultSort={{ key: "orden", dir: "asc" }}
      comparators={{
        orden: (a, b) => a.orden - b.orden,
        nombre: (a, b) => a.nombre.localeCompare(b.nombre),
        usos: (a, b) => a.cantidadUsos - b.cantidadUsos,
      }}
    >
      {(filtrados) => (
        <div className="space-y-3">
          <TablaBuscador.Input placeholder="Buscar etiqueta..." />

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
                      Usos
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
                      No hay etiquetas que matcheen tu búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrados.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-center text-muted-foreground">
                        {t.orden}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {t.codigo}
                      </TableCell>
                      <TableCell className="font-medium text-primary-900">
                        {t.nombre}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {t.cantidadUsos}
                      </TableCell>
                      <TableCell className="text-center">
                        {t.activo ? (
                          <Badge variant="secondary">Activo</Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <EtiquetaAcciones etiqueta={t} />
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
