import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { auth } from "@/core/auth";
import { Badge } from "@/core/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import {
  listarAuditoria,
  listarModulosDisponibles,
} from "@/core/auditoria/actions";

export const metadata = { title: "Auditoría" };

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{
    modulo?: string;
    accion?: string;
    desde?: string;
    hasta?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.roles.includes("super_admin")) {
    notFound();
  }
  const sp = await searchParams;

  const desde = sp.desde ? new Date(sp.desde) : undefined;
  const hasta = sp.hasta ? new Date(sp.hasta) : undefined;

  const [eventos, modulos] = await Promise.all([
    listarAuditoria({
      modulo: sp.modulo || undefined,
      accion: sp.accion || undefined,
      desde,
      hasta,
      limit: 200,
    }),
    listarModulosDisponibles(),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-primary-900">
          <ShieldCheck className="size-7" /> Auditoría
        </h1>
        <p className="text-sm text-muted-foreground">
          Registro de acciones sensibles. Mostramos las{" "}
          <span className="font-semibold">200 más recientes</span> según los
          filtros.
        </p>
      </header>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-primary-100 bg-white p-4">
        <div className="space-y-1">
          <label
            htmlFor="modulo"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Módulo
          </label>
          <select
            id="modulo"
            name="modulo"
            defaultValue={sp.modulo ?? ""}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Todos</option>
            {modulos.map((m) => (
              <option key={m.modulo} value={m.modulo}>
                {m.modulo} ({m.cantidad})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="accion"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Acción
          </label>
          <input
            id="accion"
            name="accion"
            type="text"
            defaultValue={sp.accion ?? ""}
            placeholder="eliminar, baja, login..."
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="desde"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Desde
          </label>
          <input
            id="desde"
            name="desde"
            type="date"
            defaultValue={sp.desde ?? ""}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="hasta"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Hasta
          </label>
          <input
            id="hasta"
            name="hasta"
            type="date"
            defaultValue={sp.hasta ?? ""}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-md bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700"
        >
          Aplicar
        </button>
      </form>

      <div className="rounded-xl border border-primary-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Recurso</TableHead>
              <TableHead>Detalle</TableHead>
              <TableHead className="text-center">OK</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Sin eventos registrados con esos filtros.
                </TableCell>
              </TableRow>
            ) : (
              eventos.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(e.fecha).toLocaleString("es-AR")}
                  </TableCell>
                  <TableCell className="text-sm text-primary-900">
                    {e.usuario ? (
                      <>
                        <p>{e.usuario.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.usuario.email}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">
                        anónimo
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{e.modulo}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{e.accion}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {e.recursoTipo}
                    {e.recursoId ? (
                      <p className="font-mono text-[10px]">{e.recursoId}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-xs text-xs text-muted-foreground">
                    {e.detalle ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {e.exito ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-300 bg-emerald-50 text-emerald-900"
                      >
                        ✓
                      </Badge>
                    ) : (
                      <Badge variant="destructive">✗</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
