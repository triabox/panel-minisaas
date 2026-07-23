"use client";

import { Users } from "lucide-react";

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
import type { EtiquetaOption } from "./cliente-form-dialog";

type Cliente = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  etiquetas: Array<{ id: string; nombre: string }>;
};

export function ClientesTable({
  clientes,
  etiquetas,
  esGestion,
}: {
  clientes: Cliente[];
  etiquetas: EtiquetaOption[];
  esGestion: boolean;
}) {
  if (clientes.length === 0) {
    return (
      <EmptyState
        icon={Users}
        titulo="Todavía no hay clientes"
        descripcion="Este es el módulo de ejemplo del template: creá el primero para ver el patrón completo."
        ctaLabel='Click en "Nuevo cliente" arriba'
      />
    );
  }

  return (
    <TablaBuscador.Root<Cliente>
      data={clientes}
      searchKeys={(c) =>
        `${c.nombre} ${c.email ?? ""} ${c.telefono ?? ""} ${c.etiquetas.map((e) => e.nombre).join(" ")}`
      }
      defaultSort={{ key: "nombre", dir: "asc" }}
      comparators={{
        nombre: (a, b) => a.nombre.localeCompare(b.nombre),
      }}
    >
      {(filtrados) => (
        <div className="space-y-3">
          <TablaBuscador.Input placeholder="Buscar por nombre, email o etiqueta..." />

          <div className="rounded-xl border border-primary-100 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <TablaBuscador.SortableHeader sortKey="nombre">
                      Nombre
                    </TablaBuscador.SortableHeader>
                  </TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Etiquetas</TableHead>
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
                      colSpan={5}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      No hay clientes que matcheen tu búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrados.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-primary-900">
                        {c.nombre}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.email ?? "—"}
                        {c.telefono ? (
                          <span className="block text-xs">{c.telefono}</span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.etiquetas.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            c.etiquetas.map((e) => (
                              <Badge key={e.id} variant="secondary">
                                {e.nombre}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {c.activo ? (
                          <Badge variant="secondary">Activo</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <ClienteAcciones
                          cliente={c}
                          etiquetas={etiquetas}
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
