"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";

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
  eliminarCliente,
  obtenerCliente,
  toggleClienteActivo,
} from "@/modules/clientes/actions";

import { ClienteFormDialog, type EtiquetaOption } from "./cliente-form-dialog";

type Props = {
  cliente: { id: string; nombre: string; activo: boolean };
  etiquetas: EtiquetaOption[];
  esGestion: boolean;
};

export function ClienteAcciones({ cliente, etiquetas, esGestion }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [initial, setInitial] = useState<Parameters<typeof ClienteFormDialog>[0]["initial"]>();
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

  const onToggle = () => {
    startTransition(async () => {
      const res = await toggleClienteActivo(cliente.id);
      if (res.ok) {
        toast.success(res.data.activo ? "Cliente activado" : "Cliente desactivado");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const onEliminar = () => {
    if (
      !window.confirm(
        `¿ELIMINAR a "${cliente.nombre}"?\n\nSe borra el cliente y sus etiquetas asociadas. Esta acción no se puede deshacer.`,
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
            aria-label={`Acciones para ${cliente.nombre}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEditar}>
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onToggle}>
            <Power className="size-4" />
            {cliente.activo ? "Desactivar" : "Activar"}
          </DropdownMenuItem>
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
        etiquetas={etiquetas}
        initial={initial}
      />
    </>
  );
}
