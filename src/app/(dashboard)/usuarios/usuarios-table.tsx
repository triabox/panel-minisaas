"use client";

import { UserCog } from "lucide-react";

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

import { UsuarioAcciones } from "./usuario-acciones";

type Rol = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
};

type Usuario = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  bloqueadoHasta: Date | null;
  ultimoLogin: Date | null;
  roles: { codigo: string; nombre: string }[];
};

export function UsuariosTable({
  usuarios,
  roles,
}: {
  usuarios: Usuario[];
  roles: Rol[];
}) {
  if (usuarios.length === 0) {
    return (
      <EmptyState
        icon={UserCog}
        titulo="Todavía no hay usuarios del sistema"
        descripcion="Las usuarios son las personas que pueden ingresar al panel. Cada una tiene uno o más roles."
        ctaLabel='Click en "Nueva usuario" arriba'
      />
    );
  }

  return (
    <TablaBuscador.Root<Usuario>
      data={usuarios}
      searchKeys={(u) =>
        `${u.apellido} ${u.nombre} ${u.email} ${u.roles.map((r) => r.nombre).join(" ")}`
      }
      defaultSort={{ key: "apellido", dir: "asc" }}
      comparators={{
        apellido: (a, b) =>
          `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`),
        email: (a, b) => a.email.localeCompare(b.email),
        ultimoLogin: (a, b) => {
          const aTime = a.ultimoLogin ? a.ultimoLogin.getTime() : 0;
          const bTime = b.ultimoLogin ? b.ultimoLogin.getTime() : 0;
          return aTime - bTime;
        },
      }}
    >
      {(filtradas) => (
        <div className="space-y-3">
          <TablaBuscador.Input placeholder="Buscar por nombre, email o rol..." />

          <div className="rounded-xl border border-primary-100 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <TablaBuscador.SortableHeader sortKey="apellido">
                      Persona
                    </TablaBuscador.SortableHeader>
                  </TableHead>
                  <TableHead>
                    <TablaBuscador.SortableHeader sortKey="email">
                      Email
                    </TablaBuscador.SortableHeader>
                  </TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead>
                    <TablaBuscador.SortableHeader sortKey="ultimoLogin">
                      Último ingreso
                    </TablaBuscador.SortableHeader>
                  </TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      No hay usuarios que matcheen tu búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtradas.map((u) => {
                    const bloqueada =
                      u.bloqueadoHasta && u.bloqueadoHasta > new Date();
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium text-primary-900">
                          {u.apellido}, {u.nombre}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map((r) => (
                              <Badge key={r.codigo} variant="secondary">
                                {r.nombre}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {bloqueada ? (
                            <Badge variant="destructive">Bloqueada</Badge>
                          ) : u.activo ? (
                            <Badge variant="secondary">Activa</Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              Inactivo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {u.ultimoLogin
                            ? new Date(u.ultimoLogin).toLocaleString("es-AR")
                            : "Nunca"}
                        </TableCell>
                        <TableCell className="text-right">
                          <UsuarioAcciones
                            usuario={{
                              id: u.id,
                              email: u.email,
                              nombre: u.nombre,
                              apellido: u.apellido,
                              activo: u.activo,
                              bloqueada: Boolean(bloqueada),
                              rolesCodigos: u.roles.map((r) => r.codigo),
                            }}
                            roles={roles}
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
