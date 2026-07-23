"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Play, Pause, Ban, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/ui/dropdown-menu";
import { Button } from "@/core/ui/button";
import { toast } from "sonner";
import {
  cambiarEstadoCliente,
  eliminarCliente,
  obtenerCliente,
} from "@/modules/clientes/actions";

import { ClienteFormDialog, type RubroOption } from "./cliente-form-dialog";

type Props = {
  cliente: { id: string; negocio: string; estado: string };
  rubros: RubroOption[];
  esGestion: boolean;
};

export function ClienteAcciones({ cliente, rubros, esGestion }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [initial, setInitial] =
    useState<Parameters<typeof ClienteFormDialog>[0]["initial"]>();
  const [, startTransition] = useTransition();

  const onEditar = () => {
    startTransition(async () => {
      const data = await obtenerCliente(cliente.id);
      if (!data) {
        toast.error("No se pudo cargar el cliente.");
        return;
      }
      setInitial(data);
      setEditOpen(true);
    });
  };

  const onCambiarEstado = (estado: "activo" | "pausado" | "baja") => {
    startTransition(async () => {
      const res = await cambiarEstadoCliente(cliente.id, { estado });
      if (res.ok) {
        toast.success(`Cliente marcado como ${estado}.`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const onEliminar = () => {
    if (
      !window.confirm(
        `¿ELIMINAR a "${cliente.negocio}"?\n\nSe borra el cliente y TODO su historial de horas. Esta acción no se puede deshacer.\n\nSi solo querés dejar de operarlo, usá "Dar de baja".`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await eliminarCliente(cliente.id);
      if (res.ok) {
        toast.success("Cliente eliminado.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Acciones para ${cliente.negocio}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEditar}>
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          {cliente.estado !== "activo" ? (
            <DropdownMenuItem onSelect={() => onCambiarEstado("activo")}>
              <Play className="size-4" />
              Activar
            </DropdownMenuItem>
          ) : null}
          {cliente.estado !== "pausado" ? (
            <DropdownMenuItem onSelect={() => onCambiarEstado("pausado")}>
              <Pause className="size-4" />
              Pausar
            </DropdownMenuItem>
          ) : null}
          {cliente.estado !== "baja" ? (
            <DropdownMenuItem onSelect={() => onCambiarEstado("baja")}>
              <Ban className="size-4" />
              Dar de baja
            </DropdownMenuItem>
          ) : null}

          {esGestion ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onEliminar}>
                <Trash2 className="size-4" />
                Eliminar
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ClienteFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        rubros={rubros}
        initial={initial}
      />
    </>
  );
}
